-- DinoWar — el historial de asaltos, que ya estaba guardado y no se veía.
--
-- `asaltos` apunta desde el primer día quién asaltó, cuánto daño hizo, cuántos
-- turnos duró y si ganó. Nada de eso salía por pantalla: lo único visible era
-- el total acumulado por persona contra el jefe de ahora. «Hoy Pablo 423, tú
-- 67» es lo que hace que un grupo se sienta grupo, y no hay que calcular nada
-- — sólo pintarlo.
--
-- Van los DIEZ últimos y no todos: esto viaja en cada repintado de la pantalla,
-- y una tribu de ocho a cinco asaltos por día son cuarenta filas diarias.
--
-- Aplicada en producción el 14-09-2026.
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
                    where s.jugador_id = v_id and s.jugado_en > now() - interval '24 hours'),
    -- Los últimos asaltos de la tribu. La tabla los guarda desde el primer día
    -- y no se enseñaban en ningún sitio: «hoy Pablo 423, tú 67» es lo que hace
    -- que un grupo se sienta grupo. Diez, que esto viaja en cada repintado.
    'historial', coalesce((select jsonb_agg(x order by x->>'jugado_en' desc) from (
                     select jsonb_build_object(
                              'jugador_id', s.jugador_id, 'apodo', p.apodo,
                              'evento_id', s.evento_id, 'dano', s.dano,
                              'turnos', s.turnos, 'ganada', s.ganada,
                              'jugado_en', s.jugado_en) as x
                       from public.asaltos s join public.jugadores p on p.id = s.jugador_id
                      where s.tribu_id = v_tribu
                      order by s.jugado_en desc limit 10) q), '[]'::jsonb)
  );
end;
$$;
