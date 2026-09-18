-- DinoWar — los TORNEOS: una regla fija, una racha, y una entrada que se paga.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que crea `catalogo_torneos`, `catalogo_torneo_cartas`, `catalogo_torneo_premios`
-- y las tres columnas nuevas de `catalogo_economia`; luego ésta, que las lee.
--
-- Qué hay:
--
-- - `rachas`: una por jugador, torneo y semana. Lleva el mazo CERRADO al
--   entrar, las victorias, las derrotas y lo que se cobró.
-- - `duelos.torneo` y `duelos.semana`: de qué torneo es cada duelo. Lo pone el
--   servidor al emparejar, nunca el cliente.
-- - `entrar_en_torneo(p_torneo, p_mazo)`: valida y cobra EN LA MISMA llamada.
-- - `retirar_racha()`: cierra la racha y paga lo que lleve.
-- - `mi_racha()`: lo que el navegador necesita para pintar.
--
-- TRES DECISIONES QUE NO SE DEDUCEN DEL CÓDIGO:
--
-- 1. NINGUNA FIRMA DE LA EDGE FUNCTION CAMBIA. `duelo_buscar` y `duelo_cerrar`
--    se recrean con el mismo prototipo: el torneo no llega por parámetro, lo
--    deduce el servidor de la racha abierta del jugador. Es más seguro —el
--    cliente no puede decir en qué torneo está— y, sobre todo, evita
--    re-empaquetar, re-anclar y desplegar la función, que son los tres sitios
--    donde este proyecto ya se ha equivocado. Los torneos no tocan la Edge
--    Function: ni una línea.
--
-- 2. EL MAZO SE CIERRA AL ENTRAR. `duelo_buscar` recibe un mazo del cliente y,
--    si hay racha abierta, lo IGNORA y usa el de la racha. Sin eso, la regla
--    del torneo se comprobaría una vez y se podría cambiar de mazo entre
--    duelos, que es exactamente lo que un formato de regla fija no es. Y como
--    el mazo guardado se puede editar después de entrar, guardarlo por id no
--    valdría: se guarda la lista entera.
--
-- 3. LA ENTRADA SE COBRA DESPUÉS DE VALIDAR, en la misma transacción. La
--    colección de salida son 55 cartas exactas, así que CUALQUIER regla la
--    deja por debajo de un mazo legal: una cuenta nueva no puede jugar un
--    torneo, y lo que no puede pasar es que pague por descubrirlo.

-- ------------------------------------------------------------------ semana

-- El mismo número que `semanaDe()` en src/data/expediciones.js: semanas desde
-- el 1 de enero de 1970, desplazadas para que empiecen en lunes. Existe aquí
-- porque el servidor no puede preguntarle al cliente qué semana es —con la
-- fecha local, alguien en Auckland entraría al torneo de la semana que viene—.
create or replace function private.semana_de(p_dia date)
returns int
language sql immutable as $$
  select floor(((p_dia - date '1970-01-01') + 3) / 7.0)::int;
$$;

/** El torneo de esta semana. Es `semana mod (cuántos hay)` sobre `orden`. */
create or replace function private.torneo_de(p_dia date)
returns text
language plpgsql stable set search_path = public as $$
declare
  v_n int;
begin
  select count(*) into v_n from public.catalogo_torneos;
  if v_n = 0 then return null; end if;
  return (select id from public.catalogo_torneos
           where orden = private.semana_de(p_dia) % v_n);
end;
$$;

-- ------------------------------------------------------------------ rachas

create table if not exists public.rachas (
  id          uuid primary key default gen_random_uuid(),
  jugador_id  uuid not null references public.jugadores (id) on delete cascade,
  torneo      text not null references public.catalogo_torneos (id),
  -- La semana va en la fila y no se deduce de `creada_en`: sin ella, la racha
  -- de hace siete semanas —mismo torneo, otra vuelta— bloquearía la de hoy.
  -- Es la misma trampa que el ciclo de los jefes de la Cuenca.
  semana      int  not null,
  -- El mazo con el que se entró, cerrado. Ver la decisión 2 de la cabecera.
  mazo        jsonb not null,
  ganadas     int  not null default 0 check (ganadas >= 0),
  perdidas    int  not null default 0 check (perdidas >= 0),
  cerrada     boolean not null default false,
  -- Lo que se pagó al cerrarla, para que el navegador lo pueda enseñar y para
  -- que un cierre repetido no pague dos veces.
  monedas     int  not null default 0,
  sobres      int  not null default 0,
  creada_en   timestamptz not null default now(),
  cerrada_en  timestamptz,
  unique (jugador_id, torneo, semana)
);

create index if not exists rachas_abiertas
  on public.rachas (jugador_id) where not cerrada;

-- Como los duelos: la fila es del servicio. El jugador la ve por `mi_racha()`.
alter table public.rachas enable row level security;
revoke all on public.rachas from anon, authenticated;

-- De qué torneo es un duelo. Null es un duelo normal de la cola pública.
alter table public.duelos add column if not exists torneo text references public.catalogo_torneos (id);
alter table public.duelos add column if not exists semana int;

-- ------------------------------------------------------------------ entrar

/**
 * Entrar en el torneo de la semana con un mazo. Valida y cobra a la vez: si el
 * mazo no vale, no se toca una moneda.
 *
 * La validación son dos capas y las dos hacen falta. `private.validar_mazo` es
 * la de siempre —las 55 cartas, las copias por rareza, el tope de legendarias,
 * y que las cartas sean TUYAS—; encima va la del torneo, que es una lista de
 * ids generada desde `src/data/torneos.js` más, si el torneo lo recorta, un
 * tope de copias propio.
 */
create or replace function public.entrar_en_torneo(p_torneo text, p_mazo jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id      uuid := auth.uid();
  v_hoy     date := (now() at time zone 'utc')::date;
  v_toca    text;
  v_semana  int;
  v_entrada int;
  v_tope    int;
  v_monedas bigint;
  v_mal     text;
  r         public.rachas%rowtype;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  v_toca := private.torneo_de(v_hoy);
  if v_toca is null then raise exception 'no hay torneos'; end if;
  if p_torneo is distinct from v_toca then
    raise exception 'ese torneo no es el de esta semana';
  end if;
  v_semana := private.semana_de(v_hoy);

  -- Una racha por torneo y semana, y sólo una abierta a la vez: dos rachas
  -- abiertas dejarían a `duelo_buscar` sin saber en cuál te empareja.
  if exists (select 1 from public.rachas where jugador_id = v_id and not cerrada) then
    raise exception 'ya tienes una racha en marcha';
  end if;
  if exists (select 1 from public.rachas
              where jugador_id = v_id and torneo = p_torneo and semana = v_semana) then
    raise exception 'ya jugaste este torneo esta semana';
  end if;
  if exists (select 1 from public.duelos
              where estado <> 'terminado' and (jugador_a = v_id or jugador_b = v_id)) then
    raise exception 'tienes un duelo sin terminar';
  end if;

  -- Lo de siempre: 55 cartas, rarezas, legendarias, y que sean tuyas.
  perform private.validar_mazo(v_id, p_mazo);

  -- Y la regla del torneo. Primero lo que no entra.
  select string_agg(e.key, ', ') into v_mal
    from jsonb_each_text(p_mazo) e
   where not exists (select 1 from public.catalogo_torneo_cartas c
                      where c.torneo = p_torneo and c.card_id = e.key);
  if v_mal is not null then
    raise exception 'en este torneo no entran: %', v_mal;
  end if;

  -- Luego el tope de copias propio, si lo hay.
  select copias_max into v_tope from public.catalogo_torneos where id = p_torneo;
  if v_tope is not null then
    select string_agg(format('%s lleva %s y aquí el máximo es %s', e.key, e.value, v_tope), '; ')
      into v_mal
      from jsonb_each_text(p_mazo) e
     where e.value::int > v_tope;
    if v_mal is not null then raise exception 'copias por encima de la regla: %', v_mal; end if;
  end if;

  -- Y ahora se cobra, con la fila bloqueada: entre mirar el saldo y gastarlo
  -- cabe otra petición.
  select torneo_entrada into v_entrada from public.catalogo_economia where id = 1;
  select monedas into v_monedas from public.jugadores where id = v_id for update;
  if not found then raise exception 'no has entrado'; end if;
  if v_monedas < v_entrada then
    raise exception 'te faltan % dinomonedas para entrar', v_entrada - v_monedas;
  end if;
  update public.jugadores set monedas = monedas - v_entrada where id = v_id;

  insert into public.rachas (jugador_id, torneo, semana, mazo)
  values (v_id, p_torneo, v_semana, p_mazo)
  returning * into r;

  return jsonb_build_object('racha', to_jsonb(r) - 'mazo', 'perfil', public.mi_perfil());
end;
$$;

-- ------------------------------------------------------------------ cerrar

/**
 * Cierra una racha y paga lo que le toque. Idempotente: una racha ya cerrada
 * devuelve lo que se pagó y no vuelve a pagar.
 *
 * Es `private` porque la llaman dos sitios que ya saben quién es quién:
 * `duelo_cerrar` —clave de servicio, desde la Edge Function— y
 * `retirar_racha`, que saca el jugador de `auth.uid()`.
 */
create or replace function private.cerrar_racha(p_racha uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r        public.rachas%rowtype;
  v_monedas int;
  v_sobres  int;
begin
  select * into r from public.rachas where id = p_racha for update;
  if not found then raise exception 'racha inexistente'; end if;
  if r.cerrada then
    return jsonb_build_object('ya', true, 'ganadas', r.ganadas, 'perdidas', r.perdidas,
                              'monedas', r.monedas, 'sobres', r.sobres);
  end if;

  -- El premio sale del catálogo, no de la petición. Si la escalera se queda
  -- corta —una racha con más victorias de las que tiene premio— se coge la de
  -- más arriba, que es lo que hace `premioDeRacha()` en el navegador.
  select monedas, sobres into v_monedas, v_sobres
    from public.catalogo_torneo_premios
   where victorias = least(r.ganadas, (select max(victorias) from public.catalogo_torneo_premios));
  v_monedas := coalesce(v_monedas, 0);
  v_sobres  := coalesce(v_sobres, 0);

  update public.rachas
     set cerrada = true, cerrada_en = now(), monedas = v_monedas, sobres = v_sobres
   where id = p_racha;

  if v_monedas > 0 or v_sobres > 0 then
    update public.jugadores
       set monedas = monedas + v_monedas, sobres_gratis = sobres_gratis + v_sobres
     where id = r.jugador_id;
  end if;

  return jsonb_build_object('ya', false, 'ganadas', r.ganadas, 'perdidas', r.perdidas,
                            'monedas', v_monedas, 'sobres', v_sobres);
end;
$$;

/**
 * Retirarse de la racha y cobrar lo que lleve. Existe porque con nueve cuentas
 * no siempre hay con quien terminarla: sin esto, una racha de tres victorias
 * se quedaría sin cobrar por no encontrar rival, y eso convierte la entrada en
 * un peaje. No se puede retirar con un duelo a medias — ése se pierde o se
 * gana primero.
 */
create or replace function public.retirar_racha()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  r    public.rachas%rowtype;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if exists (select 1 from public.duelos
              where estado <> 'terminado' and (jugador_a = v_id or jugador_b = v_id)) then
    raise exception 'termina el duelo antes de retirarte';
  end if;
  select * into r from public.rachas where jugador_id = v_id and not cerrada;
  if not found then raise exception 'no tienes ninguna racha en marcha'; end if;
  return jsonb_build_object('cierre', private.cerrar_racha(r.id), 'perfil', public.mi_perfil());
end;
$$;

/** Lo que el navegador necesita para pintar el torneo: la racha, sin el mazo. */
create or replace function public.mi_racha()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_hoy date := (now() at time zone 'utc')::date;
  r    public.rachas%rowtype;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select * into r from public.rachas where jugador_id = v_id and not cerrada;
  if not found then
    -- Sin racha abierta: aún así hace falta saber si la de esta semana ya se
    -- jugó, o el botón ofrecería entrar a un torneo que ya está gastado.
    select * into r from public.rachas
     where jugador_id = v_id and torneo = private.torneo_de(v_hoy)
       and semana = private.semana_de(v_hoy);
  end if;
  return jsonb_build_object(
    'dia', v_hoy,
    'torneo', private.torneo_de(v_hoy),
    'semana', private.semana_de(v_hoy),
    'racha', case when r.id is null then null else to_jsonb(r) - 'mazo' end);
end;
$$;

/**
 * Anota un duelo en la racha de un jugador y la cierra si el resultado la
 * cierra. Devuelve cómo quedó, o null si ese jugador no tenía racha abierta
 * —que pasa si se retiró entre que el duelo empezó y terminó—.
 *
 * Va con la fila bloqueada porque las dos peticiones del final de un duelo
 * llegan a la vez: sin el bloqueo, dos `duelo_cerrar` simultáneos podrían leer
 * las mismas victorias y escribir la misma suma dos veces.
 */
create or replace function private.anotar_racha(
  p_jugador uuid, p_torneo text, p_semana int, p_gano boolean,
  p_victorias int, p_derrotas int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r public.rachas%rowtype;
begin
  select * into r from public.rachas
   where jugador_id = p_jugador and torneo = p_torneo and semana = p_semana
     and not cerrada
   for update;
  if not found then return null; end if;

  update public.rachas
     set ganadas  = ganadas  + case when p_gano then 1 else 0 end,
         perdidas = perdidas + case when p_gano then 0 else 1 end
   where id = r.id
   returning * into r;

  if r.ganadas >= p_victorias or r.perdidas >= p_derrotas then
    return jsonb_build_object('ganadas', r.ganadas, 'perdidas', r.perdidas,
                              'cierre', private.cerrar_racha(r.id));
  end if;
  return jsonb_build_object('ganadas', r.ganadas, 'perdidas', r.perdidas, 'cierre', null);
end;
$$;

-- --------------------------------------------------------------- emparejar
--
-- MISMA FIRMA. Lo único que cambia es que, si el jugador tiene una racha
-- abierta, el duelo es de ese torneo: se juega con el mazo cerrado de la racha
-- y sólo contra gente del mismo torneo y la misma semana. Sin racha, todo
-- queda exactamente como estaba.

create or replace function public.duelo_buscar(p_jugador uuid, p_mazo jsonb, p_semilla bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
  v_elo int;
  r public.rachas%rowtype;
  v_torneo text;
  v_semana int;
  v_mazo jsonb := p_mazo;
begin
  select elo into v_elo from public.jugadores where id = p_jugador;
  if v_elo is null then raise exception 'jugador inexistente'; end if;

  -- Ya tiene uno abierto: se le devuelve ése. No se abre otro.
  select * into d from public.duelos
   where estado <> 'terminado' and (jugador_a = p_jugador or jugador_b = p_jugador)
   order by creado_en desc limit 1;
  if found then return to_jsonb(d); end if;

  -- El torneo NO llega en la petición: sale de la racha abierta. Y con él, el
  -- mazo — el que mande el cliente se descarta.
  select * into r from public.rachas where jugador_id = p_jugador and not cerrada;
  if found then
    v_torneo := r.torneo;
    v_semana := r.semana;
    v_mazo := r.mazo;
  end if;

  -- Alguien esperando en la MISMA cola, el que más lleva. Un duelo de torneo y
  -- uno normal no se emparejan nunca: `is not distinct from` compara los nulos
  -- como iguales, que es justo lo que hace falta aquí.
  select * into d from public.duelos
   where estado = 'esperando' and codigo is null and jugador_a <> p_jugador
     and torneo is not distinct from v_torneo
     and semana is not distinct from v_semana
   order by creado_en
   for update skip locked
   limit 1;
  if found then
    update public.duelos
       set jugador_b = p_jugador, mazo_b = v_mazo, elo_b = v_elo,
           estado = 'jugando', actualizado_en = now()
     where id = d.id
     returning * into d;
    return to_jsonb(d);
  end if;

  insert into public.duelos (jugador_a, semilla, mazo_a, elo_a, torneo, semana)
  values (p_jugador, p_semilla, v_mazo, v_elo, v_torneo, v_semana)
  returning * into d;
  return to_jsonb(d);
end;
$$;

-- ------------------------------------------------------------------ cerrar
--
-- MISMA FIRMA otra vez. Lo que se añade: si el duelo era de torneo, se anota
-- la victoria o la derrota en la racha de cada uno y, si eso la cierra, se
-- paga. El ELO se mueve igual — un duelo de torneo es un duelo.

create or replace function public.duelo_cerrar(
  p_id uuid, p_ganador int, p_motivo text, p_turnos int,
  p_elo_a int, p_elo_b int, p_monedas_victoria int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
  v_vict int;
  v_derr int;
  v_rachas jsonb := '{}'::jsonb;
begin
  select * into d from public.duelos where id = p_id for update;
  if not found then raise exception 'duelo inexistente'; end if;
  if d.estado = 'terminado' then
    return jsonb_build_object('ya', true, 'ganador', d.ganador, 'motivo', d.motivo);
  end if;
  if d.jugador_b is null then
    delete from public.duelos where id = p_id;
    return jsonb_build_object('ya', false, 'borrado', true);
  end if;

  update public.duelos
     set estado = 'terminado', ganador = p_ganador, motivo = p_motivo,
         actualizado_en = now()
   where id = p_id;

  update public.jugadores set elo = p_elo_a, duelos = duelos + 1 where id = d.jugador_a;
  update public.jugadores set elo = p_elo_b, duelos = duelos + 1 where id = d.jugador_b;

  perform public.aplicar_partida(d.jugador_a, d.semilla, p_turnos, p_ganador = 0,
    case when p_ganador = 0 then p_monedas_victoria else 0 end);
  perform public.aplicar_partida(d.jugador_b, d.semilla, p_turnos, p_ganador = 1,
    case when p_ganador = 1 then p_monedas_victoria else 0 end);

  if d.torneo is not null then
    select torneo_victorias, torneo_derrotas into v_vict, v_derr
      from public.catalogo_economia where id = 1;

    v_rachas := jsonb_build_object(
      'a', private.anotar_racha(d.jugador_a, d.torneo, d.semana, p_ganador = 0, v_vict, v_derr),
      'b', private.anotar_racha(d.jugador_b, d.torneo, d.semana, p_ganador = 1, v_vict, v_derr));
  end if;

  return jsonb_build_object('ya', false, 'ganador', p_ganador, 'motivo', p_motivo,
    'elo_a', p_elo_a, 'elo_b', p_elo_b, 'rachas', v_rachas);
end;
$$;

-- --------------------------------------------------------------- permisos
revoke all on function private.semana_de(date) from public, anon, authenticated;
revoke all on function private.torneo_de(date) from public, anon, authenticated;
revoke all on function private.cerrar_racha(uuid) from public, anon, authenticated;
revoke all on function private.anotar_racha(uuid, text, int, boolean, int, int) from public, anon, authenticated;
revoke all on function public.duelo_buscar(uuid, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.duelo_cerrar(uuid, int, text, int, int, int, int) from public, anon, authenticated;

-- Éstas sí las llama el navegador con su sesión: sacan el jugador de
-- `auth.uid()` y no de un parámetro. Y se revoca antes de conceder, porque una
-- función recién creada nace con execute para PUBLIC y anon es miembro.
revoke all on function public.entrar_en_torneo(text, jsonb) from public, anon, authenticated;
grant execute on function public.entrar_en_torneo(text, jsonb) to authenticated;
revoke all on function public.retirar_racha() from public, anon, authenticated;
grant execute on function public.retirar_racha() to authenticated;
revoke all on function public.mi_racha() from public, anon, authenticated;
grant execute on function public.mi_racha() to authenticated;
