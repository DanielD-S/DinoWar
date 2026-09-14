-- DinoWar — la lista de cuencas: descubrir una tribu sin que te dicten un código.
--
-- Hasta ahora entrar era saberse seis letras que alguien te pasaba por fuera
-- del juego. Eso vale entre amigos y no vale para nadie más: quien entra solo
-- no tiene forma de encontrar a nadie, y una cuenca con una persona no puede
-- tirar un jefe de 6.000 de Vida.
--
-- Dos formas de entrar, y las dos siguen existiendo:
--   · el CÓDIGO es una invitación privada y entra sin pedir permiso, esté la
--     cuenca abierta o cerrada: quien lo tiene es porque se lo dieron.
--   · la LISTA enseña las cuencas con sitio. Las `libre` se entra y ya; las
--     de `solicitud` piden que el capataz diga que sí.
--
-- El emblema es el mismo juego de medallones que usan los mazos —siete clados
-- y tres familias de soporte—: no hay arte nuevo que generar, y una lista de
-- nombres a pelo no se distingue de una hoja de cálculo.

alter table public.tribus
  add column if not exists acceso  text not null default 'libre',
  add column if not exists emblema text not null default 'clado_teropodo';

alter table public.tribus drop constraint if exists tribus_acceso_ck;
alter table public.tribus add constraint tribus_acceso_ck
  check (acceso in ('libre', 'solicitud'));

-- Quién ha pedido entrar y a dónde. Una fila por persona y tribu: pedir dos
-- veces es pedir una vez.
create table if not exists public.solicitudes (
  tribu_id    uuid not null references public.tribus (id) on delete cascade,
  jugador_id  uuid not null references public.jugadores (id) on delete cascade,
  pedida_en   timestamptz not null default now(),
  primary key (tribu_id, jugador_id)
);
create index if not exists solicitudes_jugador_idx on public.solicitudes (jugador_id);

-- Como todo lo demás: lectura por función, escritura por función. La tabla no
-- tiene políticas, así que sin `security definer` no la ve nadie.
alter table public.solicitudes enable row level security;

-- Las cuencas con sitio. Devuelve lo justo para decidir —nombre, emblema, cómo
-- se entra, cuánta gente hay— y NADA de dentro: ni almacén, ni jefes, ni quién
-- está. Una lista pública no es una mirilla.
create or replace function public.tribus_abiertas()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tope int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select miembros_maximo into v_tope from public.catalogo_cuenca where id = 1;

  return coalesce((
    select jsonb_agg(x order by x->>'nombre')
    from (
      select jsonb_build_object(
               'id', t.id, 'nombre', t.nombre, 'emblema', t.emblema, 'acceso', t.acceso,
               'miembros', c.cuantos, 'tope', v_tope,
               'pedida', exists (select 1 from public.solicitudes s
                                  where s.tribu_id = t.id and s.jugador_id = v_id)) as x
        from public.tribus t
        join lateral (select count(*) as cuantos from public.jugadores p
                       where p.tribu_id = t.id) c on true
       where c.cuantos > 0 and c.cuantos < v_tope
       limit 60
    ) q
  ), '[]'::jsonb);
end;
$$;

-- Entrar en una cuenca LIBRE. La comprobación del tope y del acceso va aquí y
-- no en el navegador: la lista se pinta una vez y la cuenca se llena mientras
-- la miras.
create or replace function public.unirse_a_tribu(p_tribu uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_acceso text;
  v_cuantos int;
  v_tope int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if private.mi_tribu() is not null then raise exception 'ya estás en una cuenca: sal antes de entrar en otra'; end if;

  select t.acceso into v_acceso from public.tribus t where t.id = p_tribu for update;
  if v_acceso is null then raise exception 'esa cuenca ya no existe'; end if;
  if v_acceso <> 'libre' then raise exception 'esa cuenca entra por solicitud'; end if;

  select miembros_maximo into v_tope from public.catalogo_cuenca where id = 1;
  select count(*) into v_cuantos from public.jugadores where tribu_id = p_tribu;
  if v_cuantos >= v_tope then raise exception 'esa cuenca está llena'; end if;

  update public.jugadores set tribu_id = p_tribu, rol = 'miembro', tribu_desde = now()
   where id = v_id;
  delete from public.solicitudes where jugador_id = v_id;
  return p_tribu;
end;
$$;

-- Pedir entrada. Se puede pedir a varias: es una petición, no un compromiso, y
-- al entrar en una se borran todas las demás.
create or replace function public.solicitar_entrada(p_tribu uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_acceso text;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if private.mi_tribu() is not null then raise exception 'ya estás en una cuenca'; end if;
  select t.acceso into v_acceso from public.tribus t where t.id = p_tribu;
  if v_acceso is null then raise exception 'esa cuenca ya no existe'; end if;
  if v_acceso = 'libre' then raise exception 'esa cuenca es libre: se entra sin pedirlo'; end if;

  insert into public.solicitudes (tribu_id, jugador_id) values (p_tribu, v_id)
  on conflict (tribu_id, jugador_id) do nothing;
end;
$$;

create or replace function public.retirar_solicitud(p_tribu uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  delete from public.solicitudes where tribu_id = p_tribu and jugador_id = v_id;
end;
$$;

-- Contestar a quien pide entrar. Sólo el capataz, y la fila se borra diga lo
-- que diga: una solicitud rechazada que se queda en la lista es una que se
-- vuelve a rechazar mañana.
create or replace function public.responder_solicitud(p_jugador uuid, p_si boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
  v_cuantos int;
  v_tope int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select j.tribu_id into v_tribu from public.jugadores j
   where j.id = v_id and j.rol = 'capataz';
  if v_tribu is null then raise exception 'sólo el capataz contesta a las solicitudes'; end if;
  if not exists (select 1 from public.solicitudes s
                  where s.tribu_id = v_tribu and s.jugador_id = p_jugador) then
    raise exception 'esa persona no ha pedido entrar';
  end if;

  if p_si then
    if (select tribu_id from public.jugadores where id = p_jugador) is not null then
      -- Entró en otra mientras esperaba. No es un error de nadie: se descarta.
      delete from public.solicitudes where tribu_id = v_tribu and jugador_id = p_jugador;
      raise exception 'esa persona ya está en otra cuenca';
    end if;
    select miembros_maximo into v_tope from public.catalogo_cuenca where id = 1;
    select count(*) into v_cuantos from public.jugadores where tribu_id = v_tribu;
    if v_cuantos >= v_tope then raise exception 'tu cuenca está llena'; end if;

    update public.jugadores set tribu_id = v_tribu, rol = 'miembro', tribu_desde = now()
     where id = p_jugador;
    delete from public.solicitudes where jugador_id = p_jugador;
    return;
  end if;

  delete from public.solicitudes where tribu_id = v_tribu and jugador_id = p_jugador;
end;
$$;

-- Cómo se entra y qué medallón lleva. Del capataz, y de nadie más.
create or replace function public.ajustar_tribu(p_acceso text, p_emblema text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select j.tribu_id into v_tribu from public.jugadores j
   where j.id = v_id and j.rol = 'capataz';
  if v_tribu is null then raise exception 'sólo el capataz cambia los ajustes'; end if;
  if p_acceso is not null and p_acceso not in ('libre', 'solicitud') then
    raise exception 'ese acceso no existe';
  end if;

  update public.tribus
     set acceso  = coalesce(p_acceso, acceso),
         emblema = coalesce(nullif(trim(p_emblema), ''), emblema)
   where id = v_tribu;

  -- Abrirla de par en par deja sin sentido lo que hubiera pendiente.
  if p_acceso = 'libre' then delete from public.solicitudes where tribu_id = v_tribu; end if;
end;
$$;

-- El estado de la cuenca, con el acceso, el emblema y —si mandas tú— quién
-- está pidiendo entrar. Las solicitudes sólo viajan al capataz: al resto no le
-- toca contestarlas y no tienen por qué saber quién llamó a la puerta.
create or replace function public.estado_cuenca()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_mando boolean := exists (select 1 from public.jugadores j
                              where j.id = v_id and j.rol = 'capataz' and j.tribu_id is not null);
  y record;
  v_dia int;
  v_ciclo int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select * into y from private.cobrar_fosiles(v_id) limit 1;
  select ciclo_dias into v_ciclo from public.catalogo_cuenca where id = 1;

  if v_tribu is not null then
    select floor(extract(epoch from (now() - creada_en)) / 86400)::int % v_ciclo
      into v_dia from public.tribus where id = v_tribu;
  end if;

  return jsonb_build_object(
    'ahora', extract(epoch from now()) * 1000,
    'yo', v_id,
    'yacimiento', jsonb_build_object('nivel', y.nivel, 'fosiles', y.fosiles, 'deposito', y.deposito),
    'dia', v_dia,
    'tribu', (select jsonb_build_object('id', t.id, 'nombre', t.nombre, 'codigo', t.codigo,
                                        'almacen', t.almacen, 'creada_en', t.creada_en,
                                        'acceso', t.acceso, 'emblema', t.emblema)
              from public.tribus t where t.id = v_tribu),
    'miembros', coalesce((select jsonb_agg(jsonb_build_object(
                            'id', p.id, 'apodo', p.apodo, 'rol', p.rol,
                            'desde', p.tribu_desde)
                            order by p.tribu_desde nulls first, p.creado_en)
                          from public.jugadores p where p.tribu_id = v_tribu), '[]'::jsonb),
    'solicitudes', case when v_mando then coalesce((
                     select jsonb_agg(jsonb_build_object(
                              'id', p.id, 'apodo', p.apodo, 'pedida_en', s.pedida_en)
                              order by s.pedida_en)
                       from public.solicitudes s join public.jugadores p on p.id = s.jugador_id
                      where s.tribu_id = v_tribu), '[]'::jsonb) else '[]'::jsonb end,
    'jefes', coalesce((select jsonb_agg(jsonb_build_object(
                          'evento_id', j.evento_id, 'vida', j.vida,
                          'vida_maxima', j.vida_maxima, 'caido_en', j.caido_en))
                       from public.jefes j where j.tribu_id = v_tribu), '[]'::jsonb),
    'aportes', coalesce((select jsonb_agg(jsonb_build_object(
                          'evento_id', a.evento_id, 'jugador_id', a.jugador_id,
                          'apodo', p.apodo, 'dano', a.dano, 'reclamado', a.reclamado))
                         from public.aportes a join public.jugadores p on p.id = a.jugador_id
                         where a.tribu_id = v_tribu), '[]'::jsonb),
    'asaltos_hoy', (select count(*) from public.asaltos s
                    where s.jugador_id = v_id and s.jugado_en > now() - interval '24 hours')
  );
end;
$$;

revoke all on function public.tribus_abiertas(), public.unirse_a_tribu(uuid),
  public.solicitar_entrada(uuid), public.retirar_solicitud(uuid),
  public.responder_solicitud(uuid, boolean), public.ajustar_tribu(text, text)
  from public, anon;
grant execute on function public.tribus_abiertas(), public.unirse_a_tribu(uuid),
  public.solicitar_entrada(uuid), public.retirar_solicitud(uuid),
  public.responder_solicitud(uuid, boolean), public.ajustar_tribu(text, text)
  to authenticated;
