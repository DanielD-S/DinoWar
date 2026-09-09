-- DinoWar — cuentas, colección y mazos en el servidor.
--
-- Hasta aquí el servidor validaba que un mazo fuese LEGAL —50 cartas, copias
-- por rareza— pero no que fuese TUYO, porque la colección vivía entera en el
-- localStorage del jugador y el servidor no la había visto nunca. El propio
-- validador lo decía en su comentario. Esta migración es la que lo cierra.
--
-- Lo que cambia de sitio: la colección, las dinomonedas y los mazos. Lo que NO
-- cambia es el principio de la 0001 — el cliente no escribe estado de juego.
-- Ninguna tabla de aquí tiene política de escritura; se mueven todas desde
-- funciones SECURITY DEFINER que sacan quién eres de auth.uid().
--
-- Una cuenta con correo NO es un usuario nuevo: es el mismo `auth.users.id`
-- anónimo al que se le añade una identidad. Por eso aquí no hay ninguna tabla
-- de «cuentas» ni ninguna migración de datos: el uuid que tenías sigue siendo
-- el tuyo, con su tribu, su yacimiento y sus aportes intactos.
--
-- Idempotente a propósito: se puede volver a aplicar sin romper nada.

-- ------------------------------------------------------------- el jugador
-- Las dinomonedas se guardan aquí y no en el navegador porque son lo que
-- compra los sobres, y los sobres son lo que llena la colección: dejarlas
-- fuera haría que «la colección es del servidor» fuese un adorno.
alter table public.jugadores add column if not exists monedas bigint not null default 0
  check (monedas >= 0);
alter table public.jugadores add column if not exists sobres_abiertos int not null default 0;
-- Sembrada la colección de salida. Es una marca y no un conteo porque sembrar
-- dos veces regalaría un set entero.
alter table public.jugadores add column if not exists sembrado boolean not null default false;
alter table public.jugadores add column if not exists mazo_activo uuid;
-- Todavía no lo mueve nadie: el PvP no existe. Está aquí porque la puntuación
-- de un jugador tiene que nacer con su cuenta, no añadirse después a una tabla
-- con partidas ya jugadas.
alter table public.jugadores add column if not exists elo int not null default 1200;

-- ------------------------------------------------------------- colección
-- Una fila por carta poseída. Podría ser un jsonb en `jugadores` y sería menos
-- SQL, pero entonces no habría clave foránea contra el catálogo y una carta
-- borrada del set dejaría copias colgando de un id que ya no existe.
create table if not exists public.coleccion (
  jugador_id uuid not null references public.jugadores (id) on delete cascade,
  card_id    text not null references public.catalogo_cartas (card_id),
  copias     int  not null check (copias > 0),
  primary key (jugador_id, card_id)
);

-- ----------------------------------------------------------------- mazos
-- El mazo sí va en jsonb: es una lista corta que se lee y se escribe entera,
-- nunca por partes, y no hace falta consultarla por carta.
create table if not exists public.mazos (
  id             uuid primary key default gen_random_uuid(),
  jugador_id     uuid not null references public.jugadores (id) on delete cascade,
  nombre         text not null check (char_length(nombre) between 1 and 24),
  cartas         jsonb not null,
  actualizado_en timestamptz not null default now()
);
create index if not exists mazos_por_jugador on public.mazos (jugador_id);

alter table public.jugadores drop constraint if exists jugadores_mazo_activo_fk;
alter table public.jugadores add constraint jugadores_mazo_activo_fk
  foreign key (mazo_activo) references public.mazos (id) on delete set null;

-- -------------------------------------------------------------- partidas
-- Una fila por partida en solitario COBRADA. El daño a un jefe ya se validaba
-- re-jugando la partida; las 50 dinomonedas de una victoria no, y se acuñaban
-- diciendo «he ganado». Con monedas acuñadas se compran sobres, y las cartas
-- que salen son legítimas: el agujero del mazo se reabre por la puerta de al
-- lado. Así que la victoria pasa por el mismo validador.
create table if not exists public.partidas (
  id         bigserial primary key,
  jugador_id uuid not null references public.jugadores (id) on delete cascade,
  semilla    bigint not null,
  turnos     int not null,
  ganada     boolean not null,
  monedas    int not null check (monedas >= 0),
  jugado_en  timestamptz not null default now()
);

-- La misma semilla no se cobra dos veces. Igual que en `asaltos`: la partida ES
-- válida, lo que no es válido es reenviarla en bucle.
create unique index if not exists partidas_una_vez
  on public.partidas (jugador_id, semilla);
create index if not exists partidas_por_dia
  on public.partidas (jugador_id, jugado_en desc);

-- ------------------------------------------------------------------- RLS
-- Ves lo tuyo y nada más. Sin políticas de escritura, como el resto.
alter table public.coleccion enable row level security;
alter table public.mazos     enable row level security;
alter table public.partidas  enable row level security;

drop policy if exists "ves tu colección" on public.coleccion;
create policy "ves tu colección" on public.coleccion
  for select to authenticated using (jugador_id = auth.uid());

drop policy if exists "ves tus mazos" on public.mazos;
create policy "ves tus mazos" on public.mazos
  for select to authenticated using (jugador_id = auth.uid());

drop policy if exists "ves tus partidas" on public.partidas;
create policy "ves tus partidas" on public.partidas
  for select to authenticated using (jugador_id = auth.uid());

revoke insert, update, delete on
  public.coleccion, public.mazos, public.partidas from anon, authenticated;
revoke select on public.coleccion, public.mazos, public.partidas from anon;
revoke usage, select on all sequences in schema public from anon, authenticated;

-- ================================================================= mazos
-- LA COMPROBACIÓN QUE FALTABA. Un mazo es legal si suma las cartas exactas y
-- respeta las rarezas; es TUYO si de cada carta tienes al menos tantas copias
-- como pide. Lo segundo no se podía comprobar en ningún sitio hasta ahora.
--
-- Devuelve los problemas en el mensaje de la excepción y no un booleano, por lo
-- mismo que `validarMazo()` en el JavaScript devuelve una lista: la pantalla
-- necesita decir POR QUÉ no se puede guardar, no sólo que no.
create or replace function private.validar_mazo(p_jugador uuid, p_cartas jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tam   int;
  v_total int;
  v_mal   text;
begin
  if p_cartas is null or jsonb_typeof(p_cartas) <> 'object' then
    raise exception 'mazo mal formado';
  end if;
  select tamano_mazo into v_tam from public.catalogo_economia where id = 1;

  select string_agg(e.key, ', ') into v_mal
    from jsonb_each_text(p_cartas) e
   where e.value !~ '^[1-9][0-9]*$';
  if v_mal is not null then raise exception 'copias inválidas: %', v_mal; end if;

  select string_agg(e.key, ', ') into v_mal
    from jsonb_each_text(p_cartas) e
    left join public.catalogo_cartas c on c.card_id = e.key
   where c.card_id is null;
  if v_mal is not null then raise exception 'carta desconocida: %', v_mal; end if;

  select string_agg(format('%s lleva %s copias y el máximo es %s', e.key, e.value, c.copias_max), '; ')
    into v_mal
    from jsonb_each_text(p_cartas) e
    join public.catalogo_cartas c on c.card_id = e.key
   where e.value::int > c.copias_max;
  if v_mal is not null then raise exception 'copias por encima de la rareza: %', v_mal; end if;

  select string_agg(format('de %s tienes %s y el mazo pide %s',
                           e.key, coalesce(col.copias, 0), e.value), '; ')
    into v_mal
    from jsonb_each_text(p_cartas) e
    left join public.coleccion col
      on col.jugador_id = p_jugador and col.card_id = e.key
   where e.value::int > coalesce(col.copias, 0);
  if v_mal is not null then raise exception 'ese mazo no es tuyo: %', v_mal; end if;

  select coalesce(sum(e.value::int), 0) into v_total from jsonb_each_text(p_cartas) e;
  if v_total <> v_tam then
    raise exception 'un mazo son % cartas exactas y ése lleva %', v_tam, v_total;
  end if;
end;
$$;

-- Guardar un mazo. Con p_id null crea uno; con p_id, actualiza el tuyo. Un
-- p_id de otro jugador no da «no encontrado» silencioso: da error.
create or replace function public.guardar_mazo(p_id uuid, p_nombre text, p_cartas jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id     uuid := auth.uid();
  v_mazo   uuid;
  v_nombre text;
  v_max    int;
  v_n      int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  perform private.validar_mazo(v_id, p_cartas);

  v_nombre := left(coalesce(nullif(trim(p_nombre), ''), 'Mazo'), 24);
  select mazos_maximo into v_max from public.catalogo_economia where id = 1;

  if p_id is null then
    select count(*) into v_n from public.mazos where jugador_id = v_id;
    if v_n >= v_max then raise exception 'no caben más mazos: el tope son %', v_max; end if;
    insert into public.mazos (jugador_id, nombre, cartas)
      values (v_id, v_nombre, p_cartas) returning id into v_mazo;
    -- El primero que guardas se activa solo: una cuenta sin mazo activo no
    -- podría jugar y no habría forma de darse cuenta hasta intentarlo.
    update public.jugadores set mazo_activo = coalesce(mazo_activo, v_mazo) where id = v_id;
  else
    update public.mazos set nombre = v_nombre, cartas = p_cartas, actualizado_en = now()
     where id = p_id and jugador_id = v_id returning id into v_mazo;
    if v_mazo is null then raise exception 'ese mazo no es tuyo'; end if;
  end if;
  return v_mazo;
end;
$$;

create or replace function public.activar_mazo(p_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if not exists (select 1 from public.mazos where id = p_id and jugador_id = v_id) then
    raise exception 'ese mazo no es tuyo';
  end if;
  update public.jugadores set mazo_activo = p_id where id = v_id;
  return p_id;
end;
$$;

-- Borrar deja sin mazo activo si borras el que lo era: la clave foránea es
-- `on delete set null`. Quedarse sin ninguno es legal —se guarda otro— y es
-- mejor que impedir borrar el último y no poder deshacer un mazo roto.
create or replace function public.borrar_mazo(p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  delete from public.mazos where id = p_id and jugador_id = v_id;
  if not found then raise exception 'ese mazo no es tuyo'; end if;
end;
$$;

-- ============================================================== colección
-- Sembrar la colección de salida. Es lo que hace que una cuenta nueva pueda
-- jugar en el primer minuto: justo el mazo de referencia, ni una carta más.
-- Las otras salen de los sobres, que es para lo que están.
create or replace function private.sembrar(p_jugador uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_mazo    uuid;
  v_monedas int;
begin
  -- El `for update` es lo que impide que dos arranques a la vez —dos pestañas,
  -- un reintento— siembren dos veces y regalen un set entero.
  perform 1 from public.jugadores
   where id = p_jugador and not sembrado for update;
  if not found then return; end if;

  select monedas_inicio into v_monedas from public.catalogo_economia where id = 1;

  insert into public.coleccion (jugador_id, card_id, copias)
    select p_jugador, card_id, copias from public.catalogo_inicial
  on conflict (jugador_id, card_id) do nothing;

  insert into public.mazos (jugador_id, nombre, cartas)
    values (p_jugador, 'Morrison',
            (select jsonb_object_agg(card_id, copias) from public.catalogo_inicial))
    returning id into v_mazo;

  update public.jugadores
     set monedas = v_monedas, sembrado = true, mazo_activo = v_mazo
   where id = p_jugador;
end;
$$;

-- Añadir copias. La usan la apertura de sobres y el cobro de un jefe caído.
create or replace function private.dar_cartas(p_jugador uuid, p_cartas jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare v_mal text;
begin
  select string_agg(e.key, ', ') into v_mal
    from jsonb_each_text(p_cartas) e
    left join public.catalogo_cartas c on c.card_id = e.key
   where c.card_id is null;
  -- Se para en vez de ignorarlas: una carta que el servidor no conoce y se
  -- descarta en silencio es un sobre que se cobra y no entrega lo que dijo.
  if v_mal is not null then raise exception 'carta desconocida: %', v_mal; end if;

  insert into public.coleccion (jugador_id, card_id, copias)
    select p_jugador, e.key, e.value::int from jsonb_each_text(p_cartas) e
  on conflict (jugador_id, card_id)
    do update set copias = public.coleccion.copias + excluded.copias;
end;
$$;

-- Fundir el excedente: las copias que superan lo que cabe en un mazo. Una
-- cuarta de Dryosaurus no la puedes jugar nunca, y eso es exactamente lo que se
-- funde. Las de jefe quedan fuera —se ganan cooperando, no se reciclan—, igual
-- que en `excedente()` del JavaScript.
create or replace function public.fundir_excedente()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id       uuid := auth.uid();
  v_monedas  bigint := 0;
  v_fundidas int := 0;
  v_saldo    bigint;
begin
  if v_id is null then raise exception 'sin sesión'; end if;

  select coalesce(sum((col.copias - c.copias_max) * c.valor_fusion), 0),
         coalesce(sum(col.copias - c.copias_max), 0)
    into v_monedas, v_fundidas
    from public.coleccion col
    join public.catalogo_cartas c on c.card_id = col.card_id
   where col.jugador_id = v_id and not c.es_jefe and col.copias > c.copias_max;

  update public.coleccion col
     set copias = c.copias_max
    from public.catalogo_cartas c
   where c.card_id = col.card_id and col.jugador_id = v_id
     and not c.es_jefe and col.copias > c.copias_max;

  update public.jugadores set monedas = monedas + v_monedas
   where id = v_id returning monedas into v_saldo;

  return jsonb_build_object('monedas', v_saldo, 'ganadas', v_monedas, 'fundidas', v_fundidas);
end;
$$;

-- Todo tu perfil en una llamada, por lo mismo que `estado_cuenca()`: la
-- pantalla necesita monedas, cartas y mazos a la vez y tres viajes desde un
-- móvil se notan.
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
    'monedas', j.monedas,
    'elo', j.elo,
    'sobres_abiertos', j.sobres_abiertos,
    'activo', j.mazo_activo,
    'cartas', coalesce((select jsonb_object_agg(card_id, copias)
                          from public.coleccion where jugador_id = v_id), '{}'::jsonb),
    'mazos', coalesce((select jsonb_agg(jsonb_build_object(
                                'id', m.id, 'nombre', m.nombre, 'cartas', m.cartas)
                              order by m.actualizado_en)
                         from public.mazos m where m.jugador_id = v_id), '[]'::jsonb)
  );
end;
$$;

-- ================================== lo que sólo llama la Edge Function
-- Estas dos escriben dinomonedas y cartas, así que están revocadas a todo el
-- mundo: sólo las alcanza la clave de servicio, y sólo después de que el motor
-- haya re-jugado la partida o sorteado el sobre.

-- Cobrar un sobre y entregarlo, en una transacción. El sorteo lo hace la Edge
-- Function con el mismo `abrirSobre()` del navegador —las probabilidades viven
-- en un solo sitio— pero el cobro se vuelve a comprobar aquí con la fila
-- bloqueada: entre leer el saldo y gastarlo cabe otra petición.
create or replace function public.aplicar_sobre(p_jugador uuid, p_cartas text[])
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_precio  int;
  v_monedas bigint;
begin
  if p_cartas is null or array_length(p_cartas, 1) is null then
    raise exception 'sobre vacío';
  end if;
  select precio_sobre into v_precio from public.catalogo_economia where id = 1;

  select monedas into v_monedas from public.jugadores where id = p_jugador for update;
  if not found then raise exception 'jugador inexistente'; end if;
  if v_monedas < v_precio then raise exception 'no te llegan las dinomonedas'; end if;

  perform private.dar_cartas(p_jugador,
    (select jsonb_object_agg(x, n) from (
       select x, count(*)::int n from unnest(p_cartas) x group by x) t));

  update public.jugadores
     set monedas = monedas - v_precio, sobres_abiertos = sobres_abiertos + 1
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object('monedas', v_monedas, 'cartas', to_jsonb(p_cartas));
end;
$$;

-- Comprobar un mazo contra la colección de un jugador concreto. Es
-- `private.validar_mazo` asomada a `public` para que la Edge Function pueda
-- llamarla: el esquema `private` no se publica por PostgREST y desde fuera no
-- se alcanza. Está revocada a anon y a authenticated, así que sigue sin ser un
-- endpoint para el navegador.
--
-- Existe para que la regla «ese mazo no es tuyo» tenga UNA implementación. La
-- alternativa era comprobarlo otra vez en JavaScript dentro de la función, y
-- dos copias de una regla acaban discrepando.
create or replace function public.validar_mazo_de(p_jugador uuid, p_cartas jsonb)
returns void
language sql security definer set search_path = public as $$
  select private.validar_mazo(p_jugador, p_cartas);
$$;

-- Pagar una partida en solitario ya re-jugada por el servidor. El índice único
-- sobre (jugador, semilla) es lo que impide reenviar la misma victoria.
create or replace function public.aplicar_partida(
  p_jugador uuid, p_semilla bigint, p_turnos int, p_ganada boolean, p_monedas int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_monedas bigint;
begin
  insert into public.partidas (jugador_id, semilla, turnos, ganada, monedas)
  values (p_jugador, p_semilla, p_turnos, p_ganada, p_monedas);

  update public.jugadores set monedas = monedas + p_monedas
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object('monedas', v_monedas, 'premio', p_monedas);
end;
$$;

-- ================================================== las de la 0005, al día
-- `entrar` ahora también siembra. Sigue siendo idempotente y se sigue llamando
-- en cada arranque sin pensarlo.
create or replace function public.entrar(p_apodo text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_apodo text;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  v_apodo := coalesce(nullif(trim(p_apodo), ''), 'Excavador');
  v_apodo := left(v_apodo, 24);

  insert into public.jugadores (id, apodo) values (v_id, v_apodo)
  on conflict (id) do update set visto_en = now();

  insert into public.yacimientos (jugador_id) values (v_id)
  on conflict (jugador_id) do nothing;

  perform private.sembrar(v_id);

  return v_id;
end;
$$;

-- `reclamar_jefe` devolvía el id de la carta y era el NAVEGADOR quien se la
-- apuntaba. Con la colección en el servidor, apuntarla es cosa suya: si no, la
-- recompensa de un jefe sería la única carta del juego que sigue saliendo de
-- una afirmación del cliente.
create or replace function public.reclamar_jefe(p_evento text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_vida bigint;
  v_dano bigint;
  v_recompensa text;
begin
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;
  select j.vida into v_vida from public.jefes j
    where j.tribu_id = v_tribu and j.evento_id = p_evento;
  if v_vida is null then raise exception 'ese jefe no está abierto'; end if;
  if v_vida > 0 then raise exception 'ese jefe sigue en pie'; end if;

  select a.dano into v_dano from public.aportes a
    where a.tribu_id = v_tribu and a.evento_id = p_evento and a.jugador_id = v_id
      and not a.reclamado
    for update;
  if v_dano is null or v_dano <= 0 then return null; end if;

  update public.aportes set reclamado = true
   where tribu_id = v_tribu and evento_id = p_evento and jugador_id = v_id;

  select recompensa into v_recompensa from public.catalogo_eventos where evento_id = p_evento;
  if v_recompensa is not null then
    perform private.dar_cartas(v_id, jsonb_build_object(v_recompensa, 1));
  end if;
  return v_recompensa;
end;
$$;

-- ---------------------------------------------------------------- permisos
-- Lo que puede llamar un jugador, y nada más. Las de `private` no son endpoints
-- y las dos `aplicar_*` viven en `public` porque las llama la Edge Function con
-- la clave de servicio, pero están revocadas a anon y a authenticated: nadie
-- las alcanza desde el navegador.
revoke all on function
  public.guardar_mazo(uuid, text, jsonb), public.activar_mazo(uuid),
  public.borrar_mazo(uuid), public.fundir_excedente(), public.mi_perfil()
  from public, anon;
grant execute on function
  public.guardar_mazo(uuid, text, jsonb), public.activar_mazo(uuid),
  public.borrar_mazo(uuid), public.fundir_excedente(), public.mi_perfil()
  to authenticated;

revoke all on function public.aplicar_sobre(uuid, text[]) from public, anon, authenticated;
revoke all on function public.validar_mazo_de(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.aplicar_partida(uuid, bigint, int, boolean, int)
  from public, anon, authenticated;
revoke all on function private.validar_mazo(uuid, jsonb) from public, anon, authenticated;
revoke all on function private.sembrar(uuid) from public, anon, authenticated;
revoke all on function private.dar_cartas(uuid, jsonb) from public, anon, authenticated;
