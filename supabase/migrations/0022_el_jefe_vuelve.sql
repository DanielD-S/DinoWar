-- DinoWar — el jefe vuelve cada ciclo.
--
-- El calendario da la vuelta cada catorce días: `eventosActivos()` toma el día
-- módulo el ciclo, así que la ventana del Saurophaganax se abre otra vez el día
-- 14, el 28 y el 42. La BASE DE DATOS no daba la vuelta con él. `jefes` tenía
-- la clave (tribu, evento) y `abrir_jefe` hacía `on conflict do nothing`, así
-- que en la segunda vuelta encontraba la fila del primer ciclo —con 0 de Vida y
-- su `caido_en` puesto— y no hacía nada: el jefe seguía muerto para siempre.
--
-- Lo que eso significa jugando: una tribu que mata a los dos jefes se queda sin
-- nada que hacer. No se agota un contenido «hasta la próxima temporada», se
-- agota el JUEGO cooperativo entero — los fósiles siguen produciéndose, el
-- almacén sigue llenándose y no hay a quién pegarle. Con dos jefes y ocho
-- personas, eso son dos semanas.
--
-- El arreglo es la VUELTA en la clave. `jefes` y `aportes` pasan a llevar
-- `ciclo`, que es cuántas vueltas enteras lleva dada el calendario de esa tribu
-- desde que se fundó, y lo calcula el servidor de `creada_en` —nunca llega en
-- la petición: si llegara, cualquiera abriría un jefe nuevo cada minuto—.
--
-- Cuatro decisiones que conviene conocer antes de discutirlas:
--
--   * Las filas viejas NO se borran, se quedan en el ciclo 0. Un jefe caído con
--     una carta sin reclamar sigue teniendo su fila y su aporte, y la carta se
--     puede coger meses después. Borrarlas sería cobrarle al jugador el arreglo.
--   * La misma tribu puede tener la carta del Saurophaganax dos veces, una por
--     vuelta. Es lo correcto: son dos cacerías, no una repetida — y lo que se
--     repite no es una carta regalada, es el trabajo de cinco días de ocho
--     personas.
--   * `aplicar_asalto` NO cambia de firma. Lo llama la Edge Function, y cambiar
--     lo que se le manda obligaría a re-empaquetar, re-anclar y volver a
--     desplegar — tres sitios donde este proyecto ya se ha equivocado. El ciclo
--     lo saca ella misma de la tribu, que es de donde tiene que salir.
--   * `estado_cuenca` no manda la historia entera. Al año son cincuenta y dos
--     cacerías por tribu y eso viaja en CADA repintado de la pantalla: van las
--     del ciclo de ahora, más las que te hayan dejado una carta sin reclamar.
--
-- Aplicada en producción el 14-09-2026, con las dos tribus en la vuelta 0: por
-- eso rellenar `ciclo` con 0 es exacto y no una aproximación.

alter table public.jefes   add column if not exists ciclo int not null default 0;
alter table public.aportes add column if not exists ciclo int not null default 0;
-- En `asaltos` es sólo registro: sin él no se puede reconstruir de qué cacería
-- fue una partida cuando la misma tribu ha cazado al mismo jefe tres veces.
alter table public.asaltos add column if not exists ciclo int not null default 0;

alter table public.jefes   drop constraint if exists jefes_pkey;
alter table public.jefes   add primary key (tribu_id, evento_id, ciclo);
alter table public.aportes drop constraint if exists aportes_pkey;
alter table public.aportes add primary key (tribu_id, evento_id, jugador_id, ciclo);

-- Cuántas vueltas enteras lleva el calendario de esta tribu. Va en `private`
-- porque no es un endpoint: todo lo de `public` se publica por REST, y una
-- función que no necesita nadie de fuera no tiene por qué estar ahí.
create or replace function private.ciclo_de(p_tribu uuid)
returns int
language sql stable security definer set search_path = public as $$
  select floor(extract(epoch from (now() - t.creada_en)) / 86400
                 / (select ciclo_dias from public.catalogo_cuenca where id = 1))::int
    from public.tribus t where t.id = p_tribu;
$$;
revoke all on function private.ciclo_de(uuid) from public, anon, authenticated;

-- Abrir el jefe de la ventana de HOY, en la vuelta de hoy. El `do nothing`
-- sigue estando y sigue haciendo falta —ocho personas entran a la vez y las
-- ocho llaman—, pero ya no tapa la cacería del ciclo siguiente.
create or replace function public.abrir_jefe(p_evento text)
returns table (vida bigint, vida_maxima bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_tribu uuid := private.mi_tribu();
  ev record;
  v_ciclo int;
  v_dia int;
  v_vuelta int;
begin
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;
  select * into ev from public.catalogo_eventos where evento_id = p_evento and tipo = 'JEFE';
  if not found then raise exception 'ese evento no es una caza'; end if;

  select ciclo_dias into v_ciclo from public.catalogo_cuenca where id = 1;
  select floor(extract(epoch from (now() - creada_en)) / 86400)::int % v_ciclo
    into v_dia from public.tribus where id = v_tribu;
  v_vuelta := private.ciclo_de(v_tribu);

  if v_dia < ev.dia or v_dia >= ev.dia + ev.dura then
    raise exception 'la ventana de ese jefe no está abierta';
  end if;

  insert into public.jefes (tribu_id, evento_id, ciclo, vida, vida_maxima)
  values (v_tribu, p_evento, v_vuelta, ev.vida_maxima, ev.vida_maxima)
  on conflict (tribu_id, evento_id, ciclo) do nothing;

  return query select j.vida, j.vida_maxima from public.jefes j
    where j.tribu_id = v_tribu and j.evento_id = p_evento and j.ciclo = v_vuelta;
end;
$$;

-- El asalto, contra el jefe de ESTA vuelta. Misma firma y mismos nombres de
-- salida que la 0013: lo que cambia es que la fila que se busca y la que se
-- actualiza llevan ciclo. Las columnas de salida siguen cualificadas
-- (`t.almacen`, `j.vida`), que es lo que costó una mañana en la 0013.
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
  v_vuelta     int;
begin
  -- Siempre en el mismo orden —tribu y luego jefe— o dos asaltos simultáneos
  -- se abrazan en un interbloqueo.
  select t.almacen into v_almacen from public.tribus t where t.id = p_tribu for update;
  if not found then raise exception 'tribu inexistente'; end if;
  if v_almacen < p_coste then raise exception 'almacén insuficiente'; end if;

  v_vuelta := private.ciclo_de(p_tribu);

  select j.vida into v_vida_antes from public.jefes j
    where j.tribu_id = p_tribu and j.evento_id = p_evento and j.ciclo = v_vuelta for update;
  if not found then raise exception 'ese jefe no está abierto para tu tribu'; end if;
  if v_vida_antes <= 0 then raise exception 'el jefe ya ha caído'; end if;

  insert into public.asaltos (tribu_id, evento_id, ciclo, jugador_id, semilla, dano, turnos, ganada)
  values (p_tribu, p_evento, v_vuelta, p_jugador, p_semilla, p_dano, p_turnos, p_ganada);

  v_vida := greatest(0, v_vida_antes - p_dano);

  update public.jefes j
     set vida = v_vida,
         caido_en = case when v_vida = 0 and j.caido_en is null then now() else j.caido_en end
   where j.tribu_id = p_tribu and j.evento_id = p_evento and j.ciclo = v_vuelta;

  update public.tribus t set almacen = t.almacen - p_coste where t.id = p_tribu
    returning t.almacen into v_almacen;

  insert into public.aportes (tribu_id, evento_id, ciclo, jugador_id, dano, asaltos)
  values (p_tribu, p_evento, v_vuelta, p_jugador, p_dano, 1)
  on conflict (tribu_id, evento_id, jugador_id, ciclo)
  do update set dano = public.aportes.dano + excluded.dano,
                asaltos = public.aportes.asaltos + 1;

  return query select v_vida, (v_vida = 0 and v_vida_antes > 0), v_almacen;
end;
$$;
revoke all on function public.aplicar_asalto(uuid, text, uuid, bigint, int, int, boolean, int)
  from public, anon, authenticated;

-- Reclamar la carta. Ya no hay UNA fila por jefe, así que ya no vale mirar «el»
-- jefe: se coge la cacería MÁS ANTIGUA de ese jefe que esté ganada y sin
-- cobrar. Así una carta del ciclo pasado se sigue pudiendo coger mientras el
-- del ciclo de ahora sigue en pie, que es justamente el caso que antes no
-- existía y ahora es normal.
create or replace function public.reclamar_jefe(p_evento text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_ciclo int;
  v_recompensa text;
begin
  if v_tribu is null then raise exception 'no estás en ninguna tribu'; end if;
  if not exists (select 1 from public.jefes j
                  where j.tribu_id = v_tribu and j.evento_id = p_evento) then
    raise exception 'ese jefe no está abierto';
  end if;

  select a.ciclo into v_ciclo
    from public.aportes a
    join public.jefes j on j.tribu_id = a.tribu_id
                       and j.evento_id = a.evento_id
                       and j.ciclo = a.ciclo
   where a.tribu_id = v_tribu and a.evento_id = p_evento and a.jugador_id = v_id
     and not a.reclamado and a.dano > 0 and j.vida <= 0
   order by a.ciclo
   limit 1
   for update of a;

  -- Sin nada que cobrar: o no le hiciste daño, o ya cogiste tu carta, o el de
  -- esta vuelta sigue en pie. Devolver null y no reventar: la pantalla lo pide
  -- al volver de una partida, y no tener premio no es un error.
  if v_ciclo is null then return null; end if;

  update public.aportes set reclamado = true
   where tribu_id = v_tribu and evento_id = p_evento
     and jugador_id = v_id and ciclo = v_ciclo;

  select recompensa into v_recompensa from public.catalogo_eventos where evento_id = p_evento;
  if v_recompensa is not null then
    perform private.dar_cartas(v_id, jsonb_build_object(v_recompensa, 1));
  end if;
  return v_recompensa;
end;
$$;

-- El punto de la placa: las cartas sin reclamar, ahora de cualquier vuelta. El
-- join tiene que llevar el ciclo o cuenta de más — un aporte del ciclo 0 se
-- emparejaría con el jefe vivo del ciclo 1 y al revés.
create or replace function public.avisos_cuenca()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := auth.uid();
  v_tribu uuid := private.mi_tribu();
  v_mando boolean;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  if v_tribu is null then return jsonb_build_object('solicitudes', 0, 'cartas', 0); end if;

  select (j.rol = 'capataz') into v_mando from public.jugadores j where j.id = v_id;

  return jsonb_build_object(
    'solicitudes', case when v_mando
      then (select count(*) from public.solicitudes s where s.tribu_id = v_tribu)
      else 0 end,
    'cartas', (select count(*)
                 from public.aportes a
                 join public.jefes j2 on j2.tribu_id = a.tribu_id
                                     and j2.evento_id = a.evento_id
                                     and j2.ciclo = a.ciclo
                where a.tribu_id = v_tribu and a.jugador_id = v_id
                  and a.dano > 0 and not a.reclamado and j2.vida <= 0));
end;
$$;

-- Y el estado de la tribu dice en qué vuelta va y manda las cacerías que
-- importan: las de ahora y las que te dejaron una carta pendiente. La historia
-- entera no cabe en un repintado.
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
  v_vuelta int;
begin
  if v_id is null then raise exception 'sin sesión'; end if;
  select * into y from private.cobrar_fosiles(v_id) limit 1;
  select ciclo_dias into v_ciclo from public.catalogo_cuenca where id = 1;

  if v_tribu is not null then
    select floor(extract(epoch from (now() - creada_en)) / 86400)::int % v_ciclo
      into v_dia from public.tribus where id = v_tribu;
    v_vuelta := private.ciclo_de(v_tribu);
  end if;

  return jsonb_build_object(
    'ahora', extract(epoch from now()) * 1000,
    'yo', v_id,
    'yacimiento', jsonb_build_object('nivel', y.nivel, 'fosiles', y.fosiles, 'deposito', y.deposito),
    'dia', v_dia,
    'ciclo', v_vuelta,
    'tribu', (select jsonb_build_object('id', t.id, 'nombre', t.nombre, 'codigo', t.codigo,
                                        'almacen', t.almacen, 'creada_en', t.creada_en,
                                        'acceso', t.acceso, 'emblema', t.emblema)
              from public.tribus t where t.id = v_tribu),
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
    -- Las cacerías de la vuelta de ahora, más las viejas en las que te quedó
    -- una carta por coger. Ni una fila más: esto viaja en cada repintado.
    'jefes', coalesce((select jsonb_agg(jsonb_build_object(
                          'evento_id', j.evento_id, 'ciclo', j.ciclo, 'vida', j.vida,
                          'vida_maxima', j.vida_maxima, 'caido_en', j.caido_en))
                       from public.jefes j
                      where j.tribu_id = v_tribu
                        and (j.ciclo = v_vuelta
                             or exists (select 1 from public.aportes a
                                         where a.tribu_id = j.tribu_id
                                           and a.evento_id = j.evento_id
                                           and a.ciclo = j.ciclo
                                           and a.jugador_id = v_id
                                           and a.dano > 0 and not a.reclamado))), '[]'::jsonb),
    'aportes', coalesce((select jsonb_agg(jsonb_build_object(
                          'evento_id', a.evento_id, 'ciclo', a.ciclo, 'jugador_id', a.jugador_id,
                          'apodo', p.apodo, 'dano', a.dano, 'reclamado', a.reclamado))
                         from public.aportes a join public.jugadores p on p.id = a.jugador_id
                         where a.tribu_id = v_tribu
                           and (a.ciclo = v_vuelta
                                or (a.jugador_id = v_id and not a.reclamado))), '[]'::jsonb),
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
