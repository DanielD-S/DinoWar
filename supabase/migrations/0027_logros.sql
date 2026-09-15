-- DinoWar — logros, misiones de jefe y de duelo, y recompensas que no son monedas.
--
-- ORDEN AL APLICAR: primero la 0006 regenerada (`node tools/generar-cartas.mjs`),
-- que añade `exclusivo` a `catalogo_cosmeticos` y mete los títulos; luego ésta.
-- Y DESPUÉS, la Edge Function re-empaquetada y re-anclada: `duelo_cerrar` y
-- `aplicar_partida` cambian de firma y la función es quien las llama.
--
-- Qué hay:
--
-- - `logros`: el progreso de cada jugador en cada logro, acumulado para
--   siempre (las misiones son por día). Catálogo en src/data/logros.js; aquí
--   NO hay copia: la meta y la recompensa viajan en la llamada, como el premio
--   de una misión, y el SQL sólo apunta y entrega.
-- - `private.avanzar_misiones` es el bucle que tenía `aplicar_partida`, sacado
--   para que lo llamen también el asalto y el duelo. `private.avanzar_logros`
--   es lo mismo para los logros, y entrega: un título (cosmético exclusivo),
--   un mazo inicial más (`mazos_extra`) o sobres gratis (`sobres_gratis`).
-- - `aplicar_partida` gana `p_logros`; `aplicar_avances` es la entrada del
--   ASALTO (que no pasa por aplicar_partida: tiene su tabla); `duelo_cerrar`
--   recibe los avances de cada bando. Las tres firmas cambian y las viejas se
--   tiran: dos firmas vivas del mismo nombre es no saber cuál corrió.
-- - `aplicar_sobre` descuenta un sobre gratis antes de cobrar.
-- - `elegir_mazo_extra`: gasta un `mazos_extra` en un inicial que no se tenga.
--   `iniciales_tomados` recuerda cuáles: las cuentas de antes de la 0023 no
--   eligieron ninguno y tienen los tres disponibles.
-- - `comprar_cosmetico` rechaza lo exclusivo y `equipar_cosmetico` lo pide
--   otorgado. Lo otorga `private.otorgar_cosmetico`, sólo desde aquí.

alter table public.jugadores
  add column if not exists sobres_gratis     int    not null default 0 check (sobres_gratis >= 0),
  add column if not exists mazos_extra       int    not null default 0 check (mazos_extra >= 0),
  add column if not exists iniciales_tomados text[] not null default '{}';

create table if not exists public.logros (
  jugador_id  uuid    not null references public.jugadores (id) on delete cascade,
  logro_id    text    not null,
  progreso    int     not null default 0 check (progreso >= 0),
  cobrado     boolean not null default false,
  cobrado_en  timestamptz,
  primary key (jugador_id, logro_id)
);

alter table public.logros enable row level security;
drop policy if exists logros_leer_los_mios on public.logros;
create policy logros_leer_los_mios on public.logros
  for select to authenticated using (jugador_id = auth.uid());

-- ------------------------------------------------------------- otorgar
create or replace function private.otorgar_cosmetico(p_jugador uuid, p_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform 1 from public.catalogo_cosmeticos where id = p_id;
  if not found then raise exception 'el cosmético % no existe', p_id; end if;
  insert into public.jugador_cosmeticos (jugador_id, cosmetico_id) values (p_jugador, p_id)
  on conflict do nothing;
end;
$$;
revoke all on function private.otorgar_cosmetico(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------- las misiones
-- El bucle de la 0010, tal cual, para que lo llamen tres caminos.
create or replace function private.avanzar_misiones(
  p_jugador uuid, p_dia date, p_avances jsonb,
  out premios int, out cumplidas jsonb
)
language plpgsql security definer set search_path = public as $$
declare
  a          jsonb;
  v_progreso int;
  v_cobrada  boolean;
begin
  premios := 0;
  cumplidas := '[]'::jsonb;
  for a in select * from jsonb_array_elements(coalesce(p_avances, '[]'::jsonb))
  loop
    insert into public.misiones (jugador_id, dia, mision_id, progreso)
    values (p_jugador, p_dia, a->>'id', greatest(0, (a->>'avance')::int))
    on conflict (jugador_id, dia, mision_id)
      do update set progreso = public.misiones.progreso + greatest(0, (a->>'avance')::int)
    returning progreso, cobrada into v_progreso, v_cobrada;

    if not v_cobrada and v_progreso >= greatest(1, (a->>'meta')::int) then
      update public.misiones set cobrada = true
       where jugador_id = p_jugador and dia = p_dia and mision_id = a->>'id'
         and not cobrada;
      if found then
        premios := premios + greatest(0, (a->>'premio')::int);
        cumplidas := cumplidas || jsonb_build_array(a->>'id');
      end if;
    end if;
  end loop;
end;
$$;
revoke all on function private.avanzar_misiones(uuid, date, jsonb) from public, anon, authenticated;

-- ------------------------------------------------------------ los logros
-- `p_logros` es una lista de {id, avance, meta, recompensa}. La recompensa es
-- {tipo: 'titulo', id} | {tipo: 'mazo'} | {tipo: 'sobres', n}, y se entrega
-- aquí mismo, una sola vez: el `and not cobrado` del update es lo que lo hace
-- idempotente. Devuelve los ids que se acaban de cumplir.
create or replace function private.avanzar_logros(p_jugador uuid, p_logros jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  a           jsonb;
  r           jsonb;
  v_progreso  int;
  v_cobrado   boolean;
  v_cumplidos jsonb := '[]'::jsonb;
begin
  for a in select * from jsonb_array_elements(coalesce(p_logros, '[]'::jsonb))
  loop
    insert into public.logros (jugador_id, logro_id, progreso)
    values (p_jugador, a->>'id', greatest(0, (a->>'avance')::int))
    on conflict (jugador_id, logro_id)
      do update set progreso = public.logros.progreso + greatest(0, (a->>'avance')::int)
    returning progreso, cobrado into v_progreso, v_cobrado;

    if not v_cobrado and v_progreso >= greatest(1, (a->>'meta')::int) then
      update public.logros set cobrado = true, cobrado_en = now()
       where jugador_id = p_jugador and logro_id = a->>'id' and not cobrado;
      if found then
        r := a->'recompensa';
        case r->>'tipo'
          when 'titulo' then perform private.otorgar_cosmetico(p_jugador, r->>'id');
          when 'mazo' then update public.jugadores set mazos_extra = mazos_extra + 1 where id = p_jugador;
          when 'sobres' then update public.jugadores set sobres_gratis = sobres_gratis + greatest(1, (r->>'n')::int) where id = p_jugador;
          else null;
        end case;
        v_cumplidos := v_cumplidos || jsonb_build_array(a->>'id');
      end if;
    end if;
  end loop;
  return v_cumplidos;
end;
$$;
revoke all on function private.avanzar_logros(uuid, jsonb) from public, anon, authenticated;

-- ------------------------------------------------------------ la partida
drop function if exists public.aplicar_partida(uuid, bigint, int, boolean, int, date, jsonb);

create or replace function public.aplicar_partida(
  p_jugador uuid, p_semilla bigint, p_turnos int, p_ganada boolean, p_monedas int,
  p_dia date default null, p_avances jsonb default '[]'::jsonb, p_logros jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_monedas   bigint;
  v_dia       date := coalesce(p_dia, (now() at time zone 'utc')::date);
  m           record;
  v_logros    jsonb;
begin
  insert into public.partidas (jugador_id, semilla, turnos, ganada, monedas)
  values (p_jugador, p_semilla, p_turnos, p_ganada, p_monedas);

  select * into m from private.avanzar_misiones(p_jugador, v_dia, p_avances);
  v_logros := private.avanzar_logros(p_jugador, p_logros);

  update public.jugadores set monedas = monedas + p_monedas + m.premios
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object(
    'monedas', v_monedas,
    'premio', p_monedas,
    'misiones', m.premios,
    'cumplidas', m.cumplidas,
    'logros', v_logros,
    'dia', to_char(v_dia, 'YYYY-MM-DD')
  );
end;
$$;
revoke all on function public.aplicar_partida(uuid, bigint, int, boolean, int, date, jsonb, jsonb)
  from public, anon, authenticated;

-- ------------------------------------------------------------- el asalto
-- Sin fila de `partidas`: el asalto ya tiene la suya en `asaltos`. Sólo
-- misiones, logros y las monedas de las misiones que se completen.
create or replace function public.aplicar_avances(
  p_jugador uuid, p_dia date, p_avances jsonb, p_logros jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_monedas bigint;
  m         record;
  v_logros  jsonb;
begin
  select * into m from private.avanzar_misiones(p_jugador, p_dia, p_avances);
  v_logros := private.avanzar_logros(p_jugador, p_logros);
  update public.jugadores set monedas = monedas + m.premios
   where id = p_jugador returning monedas into v_monedas;
  return jsonb_build_object(
    'monedas', v_monedas, 'misiones', m.premios, 'cumplidas', m.cumplidas, 'logros', v_logros
  );
end;
$$;
revoke all on function public.aplicar_avances(uuid, date, jsonb, jsonb)
  from public, anon, authenticated;

-- -------------------------------------------------------------- el duelo
-- El de la 0011 con los avances de cada bando. Un duelo ya cuenta como
-- partida jugada y ganada para las misiones del día.
drop function if exists public.duelo_cerrar(uuid, int, text, int, int, int, int);

create or replace function public.duelo_cerrar(
  p_id uuid, p_ganador int, p_motivo text, p_turnos int,
  p_elo_a int, p_elo_b int, p_monedas_victoria int,
  p_dia date default null,
  p_avances_a jsonb default '[]'::jsonb, p_avances_b jsonb default '[]'::jsonb,
  p_logros_a jsonb default '[]'::jsonb, p_logros_b jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
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
    case when p_ganador = 0 then p_monedas_victoria else 0 end, p_dia, p_avances_a, p_logros_a);
  perform public.aplicar_partida(d.jugador_b, d.semilla, p_turnos, p_ganador = 1,
    case when p_ganador = 1 then p_monedas_victoria else 0 end, p_dia, p_avances_b, p_logros_b);

  return jsonb_build_object('ya', false, 'ganador', p_ganador, 'motivo', p_motivo,
    'elo_a', p_elo_a, 'elo_b', p_elo_b);
end;
$$;
revoke all on function public.duelo_cerrar(uuid, int, text, int, int, int, int, date, jsonb, jsonb, jsonb, jsonb)
  from public, anon, authenticated;

-- --------------------------------------------------------------- el sobre
-- El de la 0007: un sobre gratis se gasta antes de tocar las monedas.
create or replace function public.aplicar_sobre(p_jugador uuid, p_cartas text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_precio  int;
  v_monedas bigint;
  v_gratis  int;
begin
  if p_cartas is null or array_length(p_cartas, 1) is null then
    raise exception 'sobre vacío';
  end if;
  select precio_sobre into v_precio from public.catalogo_economia where id = 1;

  select monedas, sobres_gratis into v_monedas, v_gratis
    from public.jugadores where id = p_jugador for update;
  if not found then raise exception 'jugador inexistente'; end if;
  if v_gratis > 0 then
    v_precio := 0;
  elsif v_monedas < v_precio then
    raise exception 'no te llegan las dinomonedas';
  end if;

  perform private.dar_cartas(p_jugador,
    (select jsonb_object_agg(x, n) from (
       select x, count(*)::int n from unnest(p_cartas) x group by x) t));

  if v_gratis > 0 then
    update public.jugadores
       set sobres_gratis = sobres_gratis - 1, sobres_abiertos = sobres_abiertos + 1
     where id = p_jugador returning monedas into v_monedas;
  else
    update public.jugadores
       set monedas = monedas - v_precio, sobres_abiertos = sobres_abiertos + 1
     where id = p_jugador returning monedas into v_monedas;
  end if;

  return jsonb_build_object('monedas', v_monedas, 'cartas', to_jsonb(p_cartas), 'gratis', v_gratis > 0);
end;
$$;

-- ---------------------------------------------------------- los cosméticos
create or replace function public.comprar_cosmetico(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id        uuid := auth.uid();
  v_precio    int;
  v_defecto   boolean;
  v_exclusivo boolean;
  v_monedas   bigint;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select precio, por_defecto, exclusivo into v_precio, v_defecto, v_exclusivo
    from public.catalogo_cosmeticos where id = p_id;
  if not found then raise exception 'ese artículo no existe'; end if;
  if v_exclusivo then raise exception 'ese se gana, no se compra'; end if;
  if v_defecto or v_precio = 0 then raise exception 'ese ya es tuyo'; end if;

  select monedas into v_monedas from public.jugadores where id = v_id for update;
  if not found then raise exception 'no has entrado'; end if;

  if exists (select 1 from public.jugador_cosmeticos
              where jugador_id = v_id and cosmetico_id = p_id) then
    raise exception 'ya lo tienes';
  end if;
  if v_monedas < v_precio then
    raise exception 'te faltan % dinomonedas', v_precio - v_monedas;
  end if;

  insert into public.jugador_cosmeticos (jugador_id, cosmetico_id) values (v_id, p_id);
  update public.jugadores set monedas = monedas - v_precio where id = v_id;
  return public.mi_perfil();
end;
$$;

create or replace function public.equipar_cosmetico(p_id text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id        uuid := auth.uid();
  v_tipo      text;
  v_defecto   boolean;
  v_precio    int;
  v_exclusivo boolean;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select tipo, por_defecto, precio, exclusivo into v_tipo, v_defecto, v_precio, v_exclusivo
    from public.catalogo_cosmeticos where id = p_id;
  if not found then raise exception 'ese artículo no existe'; end if;

  if not v_defecto and (v_precio > 0 or v_exclusivo) and not exists (
    select 1 from public.jugador_cosmeticos where jugador_id = v_id and cosmetico_id = p_id
  ) then
    raise exception 'ese artículo no es tuyo';
  end if;

  update public.jugadores
     set equipado = equipado || jsonb_build_object(v_tipo, p_id)
   where id = v_id;
  if not found then raise exception 'no has entrado'; end if;
  return public.mi_perfil();
end;
$$;

revoke all on function public.comprar_cosmetico(text) from public, anon;
grant execute on function public.comprar_cosmetico(text) to authenticated;
revoke all on function public.equipar_cosmetico(text) from public, anon;
grant execute on function public.equipar_cosmetico(text) to authenticated;

-- --------------------------------------------------------- mazos iniciales
-- El de la 0023 apuntando cuál se tomó.
create or replace function private.sembrar_inicial(p_jugador uuid, p_mazo text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_mazo    uuid;
  v_monedas int;
  v_nombre  text;
begin
  perform 1 from public.jugadores
   where id = p_jugador and not sembrado for update;
  if not found then return false; end if;

  select min(nombre) into v_nombre from public.catalogo_iniciales where mazo = p_mazo;
  if v_nombre is null then raise exception 'ese mazo inicial no existe'; end if;

  select monedas_inicio into v_monedas from public.catalogo_economia where id = 1;

  insert into public.coleccion (jugador_id, card_id, copias)
    select p_jugador, card_id, copias from public.catalogo_iniciales where mazo = p_mazo
  on conflict (jugador_id, card_id) do nothing;

  insert into public.mazos (jugador_id, nombre, cartas)
    values (p_jugador, v_nombre,
            (select jsonb_object_agg(card_id, copias)
               from public.catalogo_iniciales where mazo = p_mazo))
    returning id into v_mazo;

  update public.jugadores
     set monedas = v_monedas, sembrado = true, mazo_activo = v_mazo,
         iniciales_tomados = array_append(iniciales_tomados, p_mazo)
   where id = p_jugador;
  return true;
end;
$$;

-- Un mazo inicial más, ganado con un logro. Las cartas se SUMAN a la
-- colección —`dar_cartas`, como un sobre— y el mazo se guarda hecho si cabe.
create or replace function public.elegir_mazo_extra(p_mazo text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id      uuid := auth.uid();
  v_extra   int;
  v_tomados text[];
  v_nombre  text;
  v_maximo  int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select mazos_extra, iniciales_tomados into v_extra, v_tomados
    from public.jugadores where id = v_id for update;
  if not found then raise exception 'no has entrado'; end if;
  if v_extra <= 0 then raise exception 'no tienes ningún mazo inicial por elegir'; end if;
  if p_mazo = any(v_tomados) then raise exception 'ese mazo ya lo tienes'; end if;

  select min(nombre) into v_nombre from public.catalogo_iniciales where mazo = p_mazo;
  if v_nombre is null then raise exception 'ese mazo inicial no existe'; end if;

  perform private.dar_cartas(v_id,
    (select jsonb_object_agg(card_id, copias) from public.catalogo_iniciales where mazo = p_mazo));

  select mazos_maximo into v_maximo from public.catalogo_economia where id = 1;
  if (select count(*) from public.mazos where jugador_id = v_id) < coalesce(v_maximo, 5) then
    insert into public.mazos (jugador_id, nombre, cartas)
      values (v_id, v_nombre,
              (select jsonb_object_agg(card_id, copias)
                 from public.catalogo_iniciales where mazo = p_mazo));
  end if;

  update public.jugadores
     set mazos_extra = mazos_extra - 1,
         iniciales_tomados = array_append(iniciales_tomados, p_mazo)
   where id = v_id;
  return public.mi_perfil();
end;
$$;

revoke all on function public.elegir_mazo_extra(text) from public, anon;
grant execute on function public.elegir_mazo_extra(text) to authenticated;

-- -------------------------------------------------------------- el perfil
-- El de la 0024 con los sobres gratis, los mazos por elegir y los tomados.
create or replace function public.mi_perfil()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid(); j record;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select * into j from public.jugadores where id = v_id;
  if not found then raise exception 'no has entrado'; end if;

  return jsonb_build_object(
    'apodo', j.apodo,
    'apodo_cambios', j.apodo_cambios,
    'apodo_restantes', greatest(0, 1 - j.apodo_cambios),
    'monedas', j.monedas,
    'elo', j.elo,
    'sobres_abiertos', j.sobres_abiertos,
    'sobres_gratis', j.sobres_gratis,
    'mazos_extra', j.mazos_extra,
    'iniciales_tomados', to_jsonb(j.iniciales_tomados),
    'activo', j.mazo_activo,
    'sembrado', j.sembrado,
    'cosmeticos', coalesce((select jsonb_agg(cosmetico_id order by comprado_en)
                              from public.jugador_cosmeticos where jugador_id = v_id), '[]'::jsonb),
    'equipado', j.equipado,
    'cartas', coalesce((select jsonb_object_agg(card_id, copias)
                          from public.coleccion where jugador_id = v_id), '{}'::jsonb),
    'mazos', coalesce((select jsonb_agg(jsonb_build_object(
                                'id', m.id, 'nombre', m.nombre, 'cartas', m.cartas)
                              order by m.actualizado_en)
                         from public.mazos m where m.jugador_id = v_id), '[]'::jsonb)
  );
end;
$$;

-- ------------------------------------------------------ misiones y logros
-- El de la 0010 con los logros: es la misma llamada que ya hace el menú.
create or replace function public.mis_misiones()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id  uuid := auth.uid();
  v_dia date := (now() at time zone 'utc')::date;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  return jsonb_build_object(
    'dia', to_char(v_dia, 'YYYY-MM-DD'),
    'progreso', coalesce((
      select jsonb_object_agg(m.mision_id, jsonb_build_object(
               'progreso', m.progreso, 'cobrada', m.cobrada))
        from public.misiones m
       where m.jugador_id = v_id and m.dia = v_dia), '{}'::jsonb),
    'logros', coalesce((
      select jsonb_object_agg(l.logro_id, jsonb_build_object(
               'progreso', l.progreso, 'cobrado', l.cobrado))
        from public.logros l
       where l.jugador_id = v_id), '{}'::jsonb)
  );
end;
$$;
revoke all on function public.mis_misiones() from public, anon;
grant execute on function public.mis_misiones() to authenticated;
