-- DinoWar — el Duelo: dos personas, una partida llevada por el servidor.
--
-- Aquí NO se juega nada. La partida la lleva la Edge Function con el motor
-- (`_compartido/duelo.js`): esta tabla guarda el duelo tal cual —el estado del
-- motor, los relojes, los pasos— en un jsonb que sólo la clave de servicio lee
-- y escribe. El cliente no ve la tabla: recibe su VISTA, sin la mano ni el
-- mazo del otro, y sólo a través de la función.
--
-- Lo que sí decide el SQL es lo que tiene que ser atómico entre dos personas
-- que pulsan a la vez: emparejar (dos que buscan rival no pueden acabar en
-- tres duelos) y cerrar (el ELO se mueve una vez, pase lo que pase con las
-- dos peticiones que llegan al mismo tiempo cuando termina la partida).
--
-- La escritura del estado va con `version`: la función lee, aplica la jugada y
-- escribe «si la versión sigue siendo la que leí». Si el otro escribió entre
-- medias, vuelve a leer y a aplicar. Es lo que evita que dos jugadas
-- simultáneas se pisen sin necesidad de bloquear nada entre dos peticiones
-- HTTP, que no se puede.

-- ------------------------------------------------------------------ tabla
create table if not exists public.duelos (
  id            uuid primary key default gen_random_uuid(),
  jugador_a     uuid not null references public.jugadores (id) on delete cascade,
  jugador_b     uuid references public.jugadores (id) on delete cascade,
  -- Reto privado entre amigos: seis letras que se pasan por donde sea. Null en
  -- los duelos de la cola pública.
  codigo        text unique,
  semilla       bigint not null,
  mazo_a        jsonb not null,
  mazo_b        jsonb,
  -- El ELO de cada uno AL EMPEZAR, para que el cierre calcule sobre lo que
  -- había y no sobre lo que otro duelo cerrado entre medias haya movido.
  elo_a         int not null,
  elo_b         int,
  -- El duelo del motor, tal cual lo devuelve crearDuelo(). Null mientras se
  -- espera rival, y también durante el instante entre emparejar y que la
  -- función escriba el primer estado: el cliente que lo vea así vuelve a
  -- preguntar.
  datos         jsonb,
  version       int not null default 0,
  estado        text not null default 'esperando'
                check (estado in ('esperando', 'jugando', 'terminado')),
  ganador       int check (ganador in (0, 1)),
  motivo        text,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists duelos_abiertos
  on public.duelos (estado, creado_en) where estado <> 'terminado';
create index if not exists duelos_por_jugador_a on public.duelos (jugador_a);
create index if not exists duelos_por_jugador_b on public.duelos (jugador_b);

-- Sin políticas: la tabla existe para el servicio y para nadie más. Un
-- jugador que leyera la fila vería el estado entero, con la mano del otro.
alter table public.duelos enable row level security;
revoke all on public.duelos from anon, authenticated;

-- Cuántos duelos ha cerrado cada uno: el ELO se mueve el doble en los diez
-- primeros, y contarlos cada vez sobre la tabla sería recorrerla entera.
alter table public.jugadores add column if not exists duelos int not null default 0;

-- --------------------------------------------------------------- emparejar

-- Seis letras sin las que se confunden (0/O, 1/I/L).
create or replace function private.codigo_de_duelo()
returns text
language plpgsql as $$
declare
  letras text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text := '';
begin
  for i in 1..6 loop
    c := c || substr(letras, 1+ floor(random() * length(letras))::int, 1);
  end loop;
  return c;
end;
$$;

/**
 * Buscar rival en la cola pública. Devuelve el duelo en el que quedas, sea
 * porque ya tenías uno abierto, porque había alguien esperando y se te ha
 * emparejado, o porque te has quedado tú esperando.
 *
 * `for update skip locked` es lo que hace que dos que buscan a la vez no se
 * lleven al mismo tercero: cada uno bloquea una fila distinta o ninguna.
 */
create or replace function public.duelo_buscar(p_jugador uuid, p_mazo jsonb, p_semilla bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
  v_elo int;
begin
  select elo into v_elo from public.jugadores where id = p_jugador;
  if v_elo is null then raise exception 'jugador inexistente'; end if;

  -- Ya tiene uno abierto: se le devuelve ése. No se abre otro.
  select * into d from public.duelos
   where estado <> 'terminado' and (jugador_a = p_jugador or jugador_b = p_jugador)
   order by creado_en desc limit 1;
  if found then return to_jsonb(d); end if;

  -- Alguien esperando en la cola pública, el que más lleva.
  select * into d from public.duelos
   where estado = 'esperando' and codigo is null and jugador_a <> p_jugador
   order by creado_en
   for update skip locked
   limit 1;
  if found then
    update public.duelos
       set jugador_b = p_jugador, mazo_b = p_mazo, elo_b = v_elo,
           estado = 'jugando', actualizado_en = now()
     where id = d.id
     returning * into d;
    return to_jsonb(d);
  end if;

  insert into public.duelos (jugador_a, semilla, mazo_a, elo_a)
  values (p_jugador, p_semilla, p_mazo, v_elo)
  returning * into d;
  return to_jsonb(d);
end;
$$;

/** Retar a un amigo: abre un duelo con código y espera a que alguien lo meta. */
create or replace function public.duelo_retar(p_jugador uuid, p_mazo jsonb, p_semilla bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
  v_elo int;
  v_codigo text;
begin
  select elo into v_elo from public.jugadores where id = p_jugador;
  if v_elo is null then raise exception 'jugador inexistente'; end if;

  select * into d from public.duelos
   where estado <> 'terminado' and (jugador_a = p_jugador or jugador_b = p_jugador)
   order by creado_en desc limit 1;
  if found then return to_jsonb(d); end if;

  -- Un código que no esté en uso. Con 31^6 posibles no va a chocar, pero
  -- «no va a» no es «no puede».
  loop
    v_codigo := private.codigo_de_duelo();
    exit when not exists (select 1 from public.duelos where codigo = v_codigo and estado <> 'terminado');
  end loop;

  insert into public.duelos (jugador_a, codigo, semilla, mazo_a, elo_a)
  values (p_jugador, v_codigo, p_semilla, p_mazo, v_elo)
  returning * into d;
  return to_jsonb(d);
end;
$$;

/** Aceptar el reto de un amigo con su código. */
create or replace function public.duelo_aceptar(p_jugador uuid, p_codigo text, p_mazo jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d public.duelos%rowtype;
  v_elo int;
begin
  select elo into v_elo from public.jugadores where id = p_jugador;
  if v_elo is null then raise exception 'jugador inexistente'; end if;
  if exists (select 1 from public.duelos
              where estado <> 'terminado' and (jugador_a = p_jugador or jugador_b = p_jugador)) then
    raise exception 'ya tienes un duelo abierto';
  end if;

  select * into d from public.duelos
   where codigo = upper(trim(p_codigo)) and estado = 'esperando'
   for update;
  if not found then raise exception 'ese código no está esperando a nadie'; end if;
  if d.jugador_a = p_jugador then raise exception 'ése es tu propio reto'; end if;

  update public.duelos
     set jugador_b = p_jugador, mazo_b = p_mazo, elo_b = v_elo,
         estado = 'jugando', actualizado_en = now()
   where id = d.id
   returning * into d;
  return to_jsonb(d);
end;
$$;

/** Salir de la cola o retirar el reto. Sólo lo que aún no ha empezado. */
create or replace function public.duelo_cancelar(p_jugador uuid)
returns void
language sql security definer set search_path = public as $$
  delete from public.duelos where jugador_a = p_jugador and estado = 'esperando';
$$;

-- ------------------------------------------------------------------ cerrar

/**
 * Cierra el duelo UNA vez: mueve el ELO, anota la partida a los dos y paga la
 * victoria. Los ELO nuevos los calcula la función con `src/data/ligas.js` —el
 * mismo fichero que el cliente usa para pintar la liga— y llegan aquí ya
 * hechos; lo que el SQL garantiza es que no se apliquen dos veces aunque las
 * dos peticiones del final lleguen a la vez.
 *
 * La partida se anota con `aplicar_partida`, la misma de las partidas contra
 * la IA: cuenta para el tope diario, paga lo que paga una victoria y entra en
 * el historial. Las misiones no avanzan con un duelo, de momento: el parte se
 * saca re-jugando y aquí no hay nada que re-jugar.
 */
create or replace function public.duelo_cerrar(
  p_id uuid, p_ganador int, p_motivo text, p_turnos int,
  p_elo_a int, p_elo_b int, p_monedas_victoria int
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
    -- Un reto que se cancela antes de empezar no es una partida: se borra.
    delete from public.duelos where id = p_id;
    return jsonb_build_object('ya', false, 'borrado', true);
  end if;

  update public.duelos
     set estado = 'terminado', ganador = p_ganador, motivo = p_motivo,
         actualizado_en = now()
   where id = p_id;

  update public.jugadores set elo = p_elo_a, duelos = duelos + 1 where id = d.jugador_a;
  update public.jugadores set elo = p_elo_b, duelos = duelos + 1 where id = d.jugador_b;

  -- La semilla del duelo vale de semilla de partida para los dos: es única
  -- por duelo y `partidas` es única por (jugador, semilla), así que un cierre
  -- repetido —que este `for update` ya impide— tampoco podría anotar dos.
  perform public.aplicar_partida(d.jugador_a, d.semilla, p_turnos, p_ganador = 0,
    case when p_ganador = 0 then p_monedas_victoria else 0 end);
  perform public.aplicar_partida(d.jugador_b, d.semilla, p_turnos, p_ganador = 1,
    case when p_ganador = 1 then p_monedas_victoria else 0 end);

  return jsonb_build_object('ya', false, 'ganador', p_ganador, 'motivo', p_motivo,
    'elo_a', p_elo_a, 'elo_b', p_elo_b);
end;
$$;

-- --------------------------------------------------------------- permisos
-- Todo revocado a todo el mundo: sólo la clave de servicio, desde la Edge
-- Function, después de saber quién eres por el JWT. Como `aplicar_partida`.
revoke all on function private.codigo_de_duelo() from public, anon, authenticated;
revoke all on function public.duelo_buscar(uuid, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.duelo_retar(uuid, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.duelo_aceptar(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.duelo_cancelar(uuid) from public, anon, authenticated;
revoke all on function public.duelo_cerrar(uuid, int, text, int, int, int, int) from public, anon, authenticated;
