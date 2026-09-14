-- DinoWar — relevar a un capataz que no aparece.
--
-- El mando sólo cambiaba de manos por voluntad del capataz: cederlo, o salir y
-- que lo heredara el más antiguo. Las dos piden que el capataz ESTÉ. Quien
-- funda una tribu, la deja en «por solicitud» y no vuelve, la deja congelada:
-- nadie entra —porque nadie contesta a la puerta—, nadie echa a nadie, y los
-- que están dentro no tienen ninguna forma de arreglarlo. Con siete personas
-- esperando a una que no va a volver, la única salida era irse todos y fundar
-- otra, perdiendo el almacén.
--
-- `visto_en` ya estaba en la tabla desde el primer día: `entrar()` lo pone al
-- día en cada arranque del juego, así que un capataz que juega NUNCA puede ser
-- relevado. Pasado el plazo, el mando lo coge quien lo pida.
--
-- Tres decisiones que conviene conocer antes de discutirlas:
--
--   * Lo coge QUIEN LO PIDE, y no el más antiguo. El más antiguo puede ser
--     justamente otro ausente —es lo normal si la tribu se apagó entera—, y
--     entonces el relevo automático dejaría el mando en otro sitio donde no
--     hay nadie. Quien pide el mando es, por definición, quien está.
--   * El plazo son SIETE DÍAS y está también en `src/data/mando.js`, que es lo
--     que enseña el botón y dice cuánto falta. Como con el resto del mando: la
--     copia del navegador es la cortesía, y ésta es la que manda, porque sale
--     de `auth.uid()` y de la hora del servidor.
--   * Una tribu SIN capataz —no debería pasar, pero un `update` a mano lo
--     deja así— la coge cualquiera sin esperar nada. Es la válvula: una tribu
--     sin nadie que mande no tiene otra forma de volver a funcionar.
--
-- Aplicada en producción el 14-09-2026.
create or replace function public.reclamar_mando()
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_capataz uuid;
  v_visto timestamptz;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;

  -- `for update` sobre la fila del capataz: dos que reclamen a la vez tienen
  -- que acabar con un capataz, no con dos. El segundo se encuentra la fila ya
  -- en 'miembro' y no cumple la condición de abajo.
  select j.id, j.visto_en into v_capataz, v_visto
    from public.jugadores j
   where j.tribu_id = v_tribu and j.rol = 'capataz'
   for update;

  if v_capataz = v_id then raise exception 'ya mandas tú'; end if;

  if v_capataz is not null and v_visto > now() - interval '7 days' then
    raise exception 'el capataz sigue apareciendo: el mando sólo se releva tras siete días sin entrar';
  end if;

  if v_capataz is not null then
    update public.jugadores set rol = 'miembro' where id = v_capataz;
  end if;
  update public.jugadores set rol = 'capataz' where id = v_id;
end;
$$;

-- Y el estado de la tribu dice cuándo se vio a cada uno por última vez. Es lo
-- que enseña «sin aparecer hace nueve días» en su fila y lo que enciende el
-- botón de reclamar. No sale de la tribu: la lista pública de tribus abiertas
-- sigue sin decir nada de quién está dentro.
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
    -- Cada miembro con lo que ha aportado y cuándo se le vio por última vez.
    'miembros', coalesce((select jsonb_agg(jsonb_build_object(
                            'id', p.id, 'apodo', p.apodo, 'rol', p.rol,
                            'desde', p.tribu_desde, 'visto', p.visto_en,
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
    'historial', coalesce((select jsonb_agg(x order by x->>'jugado_en' desc) from (
                    select jsonb_build_object(
                             'jugador_id', s.jugador_id, 'apodo', p.apodo,
                             'evento_id', s.evento_id, 'dano', s.dano, 'turnos', s.turnos,
                             'ganada', s.ganada, 'jugado_en', s.jugado_en) as x
                      from public.asaltos s join public.jugadores p on p.id = s.jugador_id
                     where s.tribu_id = v_tribu
                     order by s.jugado_en desc limit 10) q), '[]'::jsonb),
    'asaltos_hoy', (select count(*) from public.asaltos s
                    where s.jugador_id = v_id and s.jugado_en > now() - interval '24 hours')
  );
end;
$$;

-- Revocar a PUBLIC antes de conceder: una función creada por `postgres` nace
-- con execute para PUBLIC y anon es miembro.
revoke all on function public.reclamar_mando() from public, anon;
grant execute on function public.reclamar_mando() to authenticated;
