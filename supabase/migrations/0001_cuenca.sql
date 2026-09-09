-- DinoWar — la Cuenca. Esquema y políticas de la capa cooperativa.
--
-- Principio: el cliente NO escribe estado de juego. Todo lo que decide algo
-- —el daño a un jefe, los fósiles que produce un yacimiento— pasa por una
-- función del servidor. Las tablas están abiertas a LECTURA para los miembros
-- de tu tribu y cerradas a escritura para todo el mundo.
--
-- Idempotente a propósito: se puede volver a aplicar sin romper nada.

-- ---------------------------------------------------------------- jugadores
-- Un jugador es un usuario de auth, normalmente anónimo: el juego promete
-- "sin cuenta" y eso se cumple con signInAnonymously(). El apodo es lo único
-- que se enseña a los demás; no se pide ni email ni nada identificable.
create table if not exists public.jugadores (
  id          uuid primary key references auth.users (id) on delete cascade,
  apodo       text not null check (char_length(apodo) between 1 and 24),
  tribu_id    uuid,
  creado_en   timestamptz not null default now(),
  visto_en    timestamptz not null default now()
);

-- ------------------------------------------------------------------ tribus
create table if not exists public.tribus (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 3 and 32),
  codigo      text not null unique,          -- para entrar; corto y legible
  almacen     bigint not null default 0 check (almacen >= 0),
  creada_en   timestamptz not null default now()
);

alter table public.jugadores
  drop constraint if exists jugadores_tribu_fk;
alter table public.jugadores
  add constraint jugadores_tribu_fk
  foreign key (tribu_id) references public.tribus (id) on delete set null;

-- -------------------------------------------------------------- yacimientos
-- La producción NO se guarda como un contador que el cliente incrementa: se
-- guarda el instante del último cobro y el servidor deriva los fósiles con
-- now(). Así adelantar el reloj del móvil no regala nada — que es la razón por
-- la que src/data/tribu.js recibe el instante por argumento en vez de leerlo.
create table if not exists public.yacimientos (
  jugador_id  uuid primary key references public.jugadores (id) on delete cascade,
  nivel       int  not null default 1 check (nivel between 1 and 8),
  fosiles     int  not null default 0 check (fosiles >= 0),
  cobrado_en  timestamptz not null default now()
);

-- ------------------------------------------------------------------- jefes
-- Una fila por tribu y evento. La vida la baja SÓLO la función de asalto.
create table if not exists public.jefes (
  tribu_id     uuid not null references public.tribus (id) on delete cascade,
  evento_id    text not null,
  vida         bigint not null check (vida >= 0),
  vida_maxima  bigint not null check (vida_maxima > 0),
  caido_en     timestamptz,
  primary key (tribu_id, evento_id)
);

-- Cuánto aportó cada uno. Es lo que decide quién cobra la carta, así que es la
-- tabla que más importa que el cliente no pueda tocar.
create table if not exists public.aportes (
  tribu_id    uuid not null references public.tribus (id) on delete cascade,
  evento_id   text not null,
  jugador_id  uuid not null references public.jugadores (id) on delete cascade,
  dano        bigint not null default 0 check (dano >= 0),
  asaltos     int    not null default 0 check (asaltos >= 0),
  reclamado   boolean not null default false,
  primary key (tribu_id, evento_id, jugador_id)
);

-- Registro de asaltos: uno por partida validada. Sirve para el tope diario y
-- para poder auditar después una partida concreta.
create table if not exists public.asaltos (
  id          bigserial primary key,
  tribu_id    uuid not null references public.tribus (id) on delete cascade,
  evento_id   text not null,
  jugador_id  uuid not null references public.jugadores (id) on delete cascade,
  semilla     bigint not null,
  dano        int not null check (dano >= 0),
  turnos      int not null,
  ganada      boolean not null,
  jugado_en   timestamptz not null default now()
);

-- La misma semilla no se puede cobrar dos veces: sin esto, un asalto bueno se
-- reenvía en bucle y el validador lo aprobaría todas las veces, porque la
-- partida ES válida. Lo que no es válido es cobrarla otra vez.
create unique index if not exists asaltos_una_vez
  on public.asaltos (jugador_id, evento_id, semilla);

create index if not exists asaltos_por_dia
  on public.asaltos (jugador_id, jugado_en desc);

-- ------------------------------------------------------------------- RLS
-- Todo cerrado, y se abre sólo lo que hace falta. Ninguna tabla tiene política
-- de INSERT/UPDATE/DELETE para el cliente: eso es exclusivo de las funciones
-- del servidor, que corren con la clave de servicio.

alter table public.jugadores   enable row level security;
alter table public.tribus      enable row level security;
alter table public.yacimientos enable row level security;
alter table public.jefes       enable row level security;
alter table public.aportes     enable row level security;
alter table public.asaltos     enable row level security;

-- De qué tribu eres. En una función para no repetir la subconsulta y para que
-- el planificador la cachee.
-- Ojo: esta función NACIÓ en `public` y de ahí la sacó la 0002. Todo lo que
-- vive en `public` es un endpoint REST, y una función SECURITY DEFINER
-- publicada sin necesidad es superficie regalada. Se deja aquí tal cual se
-- aplicó —las migraciones cuentan lo que pasó, no lo que debería haber pasado—
-- y la 0002 la corrige.
create or replace function public.mi_tribu()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tribu_id from public.jugadores where id = auth.uid()
$$;

drop policy if exists "ves a los de tu tribu" on public.jugadores;
create policy "ves a los de tu tribu" on public.jugadores
  for select to authenticated
  using (id = auth.uid() or (tribu_id is not null and tribu_id = public.mi_tribu()));

drop policy if exists "ves tu tribu" on public.tribus;
create policy "ves tu tribu" on public.tribus
  for select to authenticated
  using (id = public.mi_tribu());

drop policy if exists "ves tu yacimiento" on public.yacimientos;
create policy "ves tu yacimiento" on public.yacimientos
  for select to authenticated
  using (jugador_id = auth.uid());

drop policy if exists "ves los jefes de tu tribu" on public.jefes;
create policy "ves los jefes de tu tribu" on public.jefes
  for select to authenticated
  using (tribu_id = public.mi_tribu());

drop policy if exists "ves los aportes de tu tribu" on public.aportes;
create policy "ves los aportes de tu tribu" on public.aportes
  for select to authenticated
  using (tribu_id = public.mi_tribu());

drop policy if exists "ves los asaltos de tu tribu" on public.asaltos;
create policy "ves los asaltos de tu tribu" on public.asaltos
  for select to authenticated
  using (tribu_id = public.mi_tribu());

-- Aplicar un asalto ya validado. Va en una función y no en la Edge Function
-- para que la resta de vida, el aporte y el cobro del almacén sean UNA
-- transacción: dos tribus asaltando a la vez no pueden dejar la vida en
-- negativo ni cobrar dos veces el mismo almacén.
--
-- SECURITY DEFINER y revocada al cliente: sólo la llama la Edge Function, que
-- es la única que ha visto el motor re-jugar la partida.
create or replace function public.aplicar_asalto(
  p_tribu     uuid,
  p_evento    text,
  p_jugador   uuid,
  p_semilla   bigint,
  p_dano      int,
  p_turnos    int,
  p_ganada    boolean,
  p_coste     int
) returns table (vida bigint, cayo boolean, almacen bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vida_antes bigint;
  v_vida       bigint;
  v_almacen    bigint;
begin
  -- El orden importa: primero se bloquea la tribu y luego el jefe, siempre en
  -- el mismo orden, o dos asaltos simultáneos se abrazan en un interbloqueo.
  select almacen into v_almacen from public.tribus where id = p_tribu for update;
  if not found then raise exception 'tribu inexistente'; end if;
  if v_almacen < p_coste then raise exception 'almacén insuficiente'; end if;

  select vida into v_vida_antes from public.jefes
    where tribu_id = p_tribu and evento_id = p_evento for update;
  if not found then raise exception 'ese jefe no está abierto para tu tribu'; end if;
  if v_vida_antes <= 0 then raise exception 'el jefe ya ha caído'; end if;

  insert into public.asaltos (tribu_id, evento_id, jugador_id, semilla, dano, turnos, ganada)
  values (p_tribu, p_evento, p_jugador, p_semilla, p_dano, p_turnos, p_ganada);

  v_vida := greatest(0, v_vida_antes - p_dano);

  update public.jefes
     set vida = v_vida,
         caido_en = case when v_vida = 0 and caido_en is null then now() else caido_en end
   where tribu_id = p_tribu and evento_id = p_evento;

  update public.tribus set almacen = almacen - p_coste where id = p_tribu
    returning almacen into v_almacen;

  insert into public.aportes (tribu_id, evento_id, jugador_id, dano, asaltos)
  values (p_tribu, p_evento, p_jugador, p_dano, 1)
  on conflict (tribu_id, evento_id, jugador_id)
  do update set dano = public.aportes.dano + excluded.dano,
                asaltos = public.aportes.asaltos + 1;

  return query select v_vida, (v_vida = 0 and v_vida_antes > 0), v_almacen;
end;
$$;

revoke all on function public.aplicar_asalto(uuid, text, uuid, bigint, int, int, boolean, int) from public, anon, authenticated;
