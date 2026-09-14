-- DinoWar — quién ha aportado al almacén.
--
-- `aportar` sumaba al común y no guardaba nada: ni quién ni cuánto. Lo único
-- que se veía por persona era el daño al jefe, así que el juego pedía el
-- recurso que cuesta TIEMPO REAL —el yacimiento produce por horas— y no lo
-- reconocía en ningún sitio. En una tribu de ocho, eso es exactamente lo que
-- hace que nadie aporte.
--
-- Va en su tabla y no en una columna de `jugadores` por una razón: lo aportado
-- es a ESTA tribu. Con una columna del jugador habría que ponerla a cero al
-- entrar y al salir —seis funciones tocadas para no mentir—, y quien se fue y
-- volvió perdería lo suyo. Con la fila por (tribu, jugador) no hay nada que
-- reiniciar: irse deja la fila donde estaba y volver la recupera.
--
-- Como todo lo demás: sin políticas, se lee y se escribe por función.
--
-- Aplicada en producción el 14-09-2026.
create table if not exists public.fosiles_aportados (
  tribu_id    uuid   not null references public.tribus (id) on delete cascade,
  jugador_id  uuid   not null references public.jugadores (id) on delete cascade,
  fosiles     bigint not null default 0 check (fosiles >= 0),
  primary key (tribu_id, jugador_id)
);
alter table public.fosiles_aportados enable row level security;

-- Aportar al común, apuntando quién. El resto es idéntico: se cobra primero lo
-- que haya producido el yacimiento, para que «aportar todo» sea todo de verdad.
create or replace function public.aportar(p_cantidad int)
returns table (fosiles int, almacen bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_tengo int;
  v_da int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;

  select y.fosiles into v_tengo from private.cobrar_fosiles(v_id) y;
  v_da := least(greatest(coalesce(p_cantidad, 0), 0), v_tengo);
  if v_da = 0 then
    return query select v_tengo, t.almacen from public.tribus t where t.id = v_tribu;
    return;
  end if;

  update public.yacimientos set fosiles = yacimientos.fosiles - v_da where jugador_id = v_id;
  update public.tribus set almacen = tribus.almacen + v_da where id = v_tribu;

  insert into public.fosiles_aportados (tribu_id, jugador_id, fosiles)
  values (v_tribu, v_id, v_da)
  on conflict (tribu_id, jugador_id)
  do update set fosiles = public.fosiles_aportados.fosiles + excluded.fosiles;

  return query
    select y.fosiles, t.almacen
    from public.yacimientos y, public.tribus t
    where y.jugador_id = v_id and t.id = v_tribu;
end;
$$;

-- Y el estado de la tribu lo devuelve: cada miembro con lo que ha aportado.
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
    -- Cada miembro con lo que ha puesto de su yacimiento en el común. El
    -- `left join` y el coalesce: quien no ha aportado nada no tiene fila, y
    -- eso son cero fósiles, no un hueco.
    'miembros', coalesce((select jsonb_agg(jsonb_build_object(
                            'id', p.id, 'apodo', p.apodo, 'rol', p.rol,
                            'desde', p.tribu_desde,
                            'fosiles', coalesce(fa.fosiles, 0))
                            order by p.tribu_desde nulls first, p.creado_en)
                          from public.jugadores p
                          left join public.fosiles_aportados fa
                                 on fa.tribu_id = v_tribu and fa.jugador_id = p.id
                          where p.tribu_id = v_tribu), '[]'::jsonb),
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
