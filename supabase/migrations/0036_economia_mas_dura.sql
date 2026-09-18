-- DinoWar — la economía se endurece, y rejugar se recalibra con ella.
--
-- Decisión del autor del 18-09-2026: **comprar sobres jugando tiene que ser
-- posible y costar**, para que quede sitio a venderlos por dinero. Lo que se
-- midió antes de tocarlo, y que es el motivo:
--
--   sobre 100 · 50 victorias pagadas al día · 50 por victoria
--   → techo de 2.650 monedas al día = 26 sobres al día
--   → colección entera (139 cartas, 344 copias, ~135 sobres) en 6 días
--   → y en producción, una cuenta con VEINTE partidas jugadas tenía 128 de
--     las 139 cartas distintas y 3.016 monedas sin gastar.
--
-- Ahora: sobre 300, victoria 30, inicio 300, 10 victorias pagadas al día y los
-- premios de misión un 40 % más bajos. Techo del día ~580 (1,9 sobres), día
-- normal ~255 (0,85 sobres), colección entera en 70 días jugando mucho y 159
-- jugando normal.
--
-- Los números de la economía viven en `catalogo_economia` y los pone la 0006
-- regenerada desde `src/data/coleccion.js`: **al aplicar, primero el bloque de
-- `catalogo_economia` de la 0006 y luego esto**, que `aplicar_expedicion` lee
-- de esa tabla el suelo de la victoria.
--
-- Y aquí sólo cambia un número de la 0035: el divisor de rejugar pasa de 3 a
-- 5. Es el mismo criterio de entonces —que la media de rejugar no se separe de
-- una victoria— con las victorias a 30 en vez de a 50: con divisor 3 la media
-- salía 2,1 victorias y el mejor nodo pagaba 5; con 5 son 1,3 y 3.
-- `src/data/rejugar.js` lleva el mismo 5 y `test/rejugar.test.js` los compara.

create or replace function public.aplicar_expedicion(
  p_jugador uuid, p_clave text, p_rival text, p_requisito text, p_premio int
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_filas    int;
  v_monedas  bigint;
  v_victoria int;
  v_dia      date := (now() at time zone 'utc')::date;
  v_veces    int;
  v_extra    int;
  -- Los dos números de src/data/rejugar.js.
  c_divisor  constant int := 5;
  c_por_dia  constant int := 3;
begin
  if p_requisito is not null and not exists (
    select 1 from public.expediciones_victorias
     where jugador_id = p_jugador and clave = p_requisito
  ) then
    return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', true);
  end if;

  insert into public.expediciones_victorias (jugador_id, clave, rival_id, premio)
  values (p_jugador, p_clave, p_rival, greatest(0, p_premio))
  on conflict (jugador_id, clave) do nothing;
  get diagnostics v_filas = row_count;

  if v_filas = 0 then
    select monedas_victoria into v_victoria from public.catalogo_economia where id = 1;
    v_extra := greatest(0, round(greatest(0, p_premio)::numeric / c_divisor)::int
                           - coalesce(v_victoria, 0));
    if v_extra = 0 then
      return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', false,
        'rejugada', true, 'veces', 0, 'tope', c_por_dia);
    end if;

    insert into public.expediciones_rejugadas (jugador_id, rival_id, dia, veces)
    values (p_jugador, p_rival, v_dia, 1)
    on conflict (jugador_id, rival_id, dia) do update
      set veces = public.expediciones_rejugadas.veces + 1
      where public.expediciones_rejugadas.veces < c_por_dia
    returning veces into v_veces;

    if v_veces is null then
      return jsonb_build_object('premio', 0, 'primera', false, 'cerrado', false,
        'rejugada', true, 'veces', c_por_dia, 'tope', c_por_dia);
    end if;

    update public.jugadores set monedas = monedas + v_extra
     where id = p_jugador returning monedas into v_monedas;

    return jsonb_build_object('premio', v_extra, 'primera', false, 'cerrado', false,
      'rejugada', true, 'veces', v_veces, 'tope', c_por_dia, 'monedas', v_monedas);
  end if;

  update public.jugadores set monedas = monedas + greatest(0, p_premio)
   where id = p_jugador returning monedas into v_monedas;

  return jsonb_build_object('premio', greatest(0, p_premio), 'primera', true,
    'cerrado', false, 'monedas', v_monedas);
end;
$$;

revoke all on function public.aplicar_expedicion(uuid, text, text, text, int)
  from public, anon, authenticated;
