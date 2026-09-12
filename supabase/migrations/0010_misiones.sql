-- DinoWar — misiones diarias.
--
-- Tres misiones al día, elegidas por el calendario. Aquí vive SÓLO el progreso:
-- qué misiones tocan hoy no se guarda, se calcula, y se calcula en JavaScript
-- (`src/data/misiones.js`) tanto en el navegador como en la Edge Function.
--
-- POR QUÉ EL CATÁLOGO NO ESTÁ EN SQL. Podría estar: es lo que se hizo con
-- `catalogo_cartas`, que sí tiene su tabla y su generador. Pero allí hacía falta
-- —el SQL valida mazos y necesita saber la rareza de cada carta— y aquí no: lo
-- único que el SQL hace con una misión es sumarle progreso y pagarle el premio.
-- Una copia del catálogo en la base de datos traería la misma trampa que ya nos
-- costó una mañana: regenerar el SQL no es aplicarlo, y mientras tanto el
-- navegador enseña una meta y el servidor acredita otra. Así que la meta y el
-- premio VIAJAN en la llamada, desde el único sitio donde están escritos.
--
-- Eso sería un agujero si lo llamara el cliente. No lo llama: `aplicar_partida`
-- está revocada a todo el mundo y sólo la alcanza la clave de servicio, después
-- de que la Edge Function haya re-jugado la partida entera.

-- ------------------------------------------------------------------ tabla
create table if not exists public.misiones (
  jugador_id uuid    not null references public.jugadores (id) on delete cascade,
  dia        date    not null,
  mision_id  text    not null,
  progreso   int     not null default 0 check (progreso >= 0),
  -- Cobrada una vez y nunca más. Es la fila la que lo recuerda, no un cálculo
  -- sobre el progreso: si mañana sube la meta de una misión, lo que ya se pagó
  -- sigue pagado y no se vuelve a deber.
  cobrada    boolean not null default false,
  primary key (jugador_id, dia, mision_id)
);

create index if not exists misiones_por_dia on public.misiones (jugador_id, dia);

-- El cliente NO escribe. Como todo lo demás: lectura por política, escritura
-- sólo por funciones `security definer`.
alter table public.misiones enable row level security;

drop policy if exists misiones_leer_las_mias on public.misiones;
create policy misiones_leer_las_mias on public.misiones
  for select to authenticated using (jugador_id = auth.uid());

-- ------------------------------------------------------- leer las de hoy
--
-- Devuelve el DÍA además del progreso, y ése es el punto: con la fecha local del
-- navegador, alguien en Auckland vería las misiones de mañana y el servidor le
-- acreditaría las de hoy. El día lo dice quien paga.
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
       where m.jugador_id = v_id and m.dia = v_dia), '{}'::jsonb)
  );
end;
$$;

-- Revocar ANTES de conceder: una función creada por `postgres` nace con el
-- grant por defecto a PUBLIC, del que anon es miembro. No filtraba nada —sin
-- `auth.uid()` la función lanza— pero el resto de lecturas del jugador van
-- revocadas a anon, y una excepción sin motivo es una que un día alguien copia.
revoke all on function public.mis_misiones() from public, anon;
grant execute on function public.mis_misiones() to authenticated;

-- --------------------------------------------- la partida, con sus misiones
--
-- `aplicar_partida` gana dos parámetros, así que hay que tirar la versión
-- anterior: en Postgres una firma distinta es una función distinta y las dos se
-- quedarían vivas, con la Edge Function llamando a la que le cuadre y nadie
-- sabiendo cuál corrió.
drop function if exists public.aplicar_partida(uuid, bigint, int, boolean, int);

-- `p_avances` es una lista de {id, avance, meta, premio}. La escribe la Edge
-- Function a partir del PARTE que sacó re-jugando la partida: el cliente no
-- toca ninguno de los cuatro campos.
--
-- Todo va en UNA transacción —la fila de la partida, las monedas del premio, el
-- progreso de las misiones y las monedas de las que se completen— porque a
-- medias es peor que nada: una partida cobrada cuyo progreso se perdió es una
-- misión que el jugador cumplió y no le pagaron.
create or replace function public.aplicar_partida(
  p_jugador uuid, p_semilla bigint, p_turnos int, p_ganada boolean, p_monedas int,
  p_dia date default null, p_avances jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_monedas   bigint;
  v_dia       date := coalesce(p_dia, (now() at time zone 'utc')::date);
  v_premios   int := 0;
  v_cumplidas jsonb := '[]'::jsonb;
  a           jsonb;
  v_progreso  int;
  v_cobrada   boolean;
begin
  insert into public.partidas (jugador_id, semilla, turnos, ganada, monedas)
  values (p_jugador, p_semilla, p_turnos, p_ganada, p_monedas);

  for a in select * from jsonb_array_elements(coalesce(p_avances, '[]'::jsonb))
  loop
    -- El insert con `on conflict do update` suma sobre lo que hubiera: dos
    -- partidas terminadas a la vez no pueden pisarse el progreso.
    insert into public.misiones (jugador_id, dia, mision_id, progreso)
    values (p_jugador, v_dia, a->>'id', greatest(0, (a->>'avance')::int))
    on conflict (jugador_id, dia, mision_id)
      do update set progreso = public.misiones.progreso + greatest(0, (a->>'avance')::int)
    returning progreso, cobrada into v_progreso, v_cobrada;

    -- Y se paga en cuanto llega a la meta, una sola vez. El `and not cobrada`
    -- del update es lo que lo hace idempotente aunque esto se llame dos veces:
    -- la segunda no encuentra fila que actualizar y no suma nada.
    if not v_cobrada and v_progreso >= greatest(1, (a->>'meta')::int) then
      update public.misiones set cobrada = true
       where jugador_id = p_jugador and dia = v_dia and mision_id = a->>'id'
         and not cobrada;
      if found then
        v_premios := v_premios + greatest(0, (a->>'premio')::int);
        v_cumplidas := v_cumplidas || jsonb_build_array(a->>'id');
      end if;
    end if;
  end loop;

  update public.jugadores set monedas = monedas + p_monedas + v_premios
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object(
    'monedas', v_monedas,
    'premio', p_monedas,
    'misiones', v_premios,
    'cumplidas', v_cumplidas,
    'dia', to_char(v_dia, 'YYYY-MM-DD')
  );
end;
$$;

-- Escribe dinomonedas: sólo la clave de servicio, y sólo después de re-jugar.
revoke all on function public.aplicar_partida(uuid, bigint, int, boolean, int, date, jsonb)
  from public, anon, authenticated;
