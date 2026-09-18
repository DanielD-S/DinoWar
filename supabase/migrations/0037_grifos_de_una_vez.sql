-- DinoWar — los grifos de UNA VEZ, recortados.
--
-- La economía del 18-09-2026 endureció lo que se gana cada día —sobre a 300,
-- victoria a 30, diez victorias pagadas— y dejó a propósito sin tocar lo que
-- se gana UNA VEZ, que con el precio nuevo ya valía tres veces menos. Medido
-- después, seguía siendo el grifo más grande que hay:
--
--   primeras victorias   6.130 monedas = 20,4 sobres
--   logros               23 sobres gratis + 2 mazos iniciales
--   ------------------------------------------------------
--   43 de los 135 sobres de la colección entera, o sea un TERCIO, por
--   contenido que se hace una vez y no vuelve.
--
-- Ahora: primeras victorias 3.685 (12,3 sobres) y 15 sobres de logros, o sea
-- 27 de 135, un quinto. Los dos MAZOS no se tocan: no son sobres, son las
-- cartas de los otros dos iniciales y el único camino que hay a ellos.
--
-- Aquí sólo viaja la copia del catálogo de logros, que es lo único de esto que
-- vive en SQL: `reclamar_jefe` y `avanzar_logros` no pasan por la Edge
-- Function y leen de aquí. Los premios de primera victoria los manda la
-- función desde `src/data/expediciones.js` en cada llamada, así que para ésos
-- no hay nada que aplicar — pero sí hay que DESPLEGAR, que ese fichero va
-- dentro del paquete.
--
-- `test/logros.test.js` compara esta copia con `src/data/logros.js` y falla si
-- se separan. Es la trampa de «regenerar no es aplicar» por su puerta de
-- siempre: quien añada un logro tiene que escribir su copia en una migración
-- nueva, no editar ésta.

create or replace function private.catalogo_logros()
returns jsonb
language sql immutable as $$
  -- LOGROS:INICIO
  select '[{"id":"duelista","mide":"duelos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_duelista"}},{"id":"asaltante","mide":"asaltos","meta":5,"recompensa":{"tipo":"titulo","id":"titulo_asaltante"}},{"id":"cazador","mide":"jefesVencidos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_cazador"}},{"id":"trofeo_saurophaganax","mide":"jefe:saurophaganax","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_saurophaganax"}},{"id":"trofeo_barosaurus","mide":"jefe:barosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_barosaurus"}},{"id":"trofeo_supersaurus","mide":"jefe:supersaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_supersaurus"}},{"id":"trofeo_hesperosaurus","mide":"jefe:hesperosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_hesperosaurus"}},{"id":"trofeo_harpactognathus","mide":"jefe:harpactognathus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_harpactognathus"}},{"id":"cazador_mayor","mide":"cartasJefe","meta":5,"recompensa":{"tipo":"cosmetico","id":"dorso_cazador"}},{"id":"campeon","mide":"duelosGanados","meta":10,"recompensa":{"tipo":"titulo","id":"titulo_campeon"}},{"id":"explorador","mide":"victorias","meta":10,"recompensa":{"tipo":"sobres","n":2}},{"id":"demoledor","mide":"danoJefe","meta":300,"recompensa":{"tipo":"sobres","n":3}},{"id":"morrison","mide":"expedicion:morrison","meta":8,"recompensa":{"tipo":"mazo"}},{"id":"hell_creek","mide":"expedicion:hell_creek","meta":8,"recompensa":{"tipo":"sobres","n":3}},{"id":"tendaguru","mide":"expedicion:tendaguru","meta":8,"recompensa":{"tipo":"sobres","n":3}},{"id":"kem_kem","mide":"expedicion:kem_kem","meta":8,"recompensa":{"tipo":"sobres","n":4}},{"id":"veterano","mide":"duelosGanados","meta":25,"recompensa":{"tipo":"mazo"}},{"id":"leyenda","mide":"duelosGanados","meta":50,"recompensa":{"tipo":"cosmetico","id":"estandarte_campeon"}}]'::jsonb
  -- LOGROS:FIN
$$;
revoke all on function private.catalogo_logros() from public, anon, authenticated;

-- ------------------------------------------------- y el divisor de rejugar
--
-- Va ATADO a los premios: rejugar paga `premio ÷ divisor` con el suelo de una
-- victoria, así que recortar los premios un 40 % sin tocar el divisor habría
-- recortado también lo que paga rejugar, que no es lo que se pidió. Con los
-- premios al 0,6 y el divisor de 5 a 3 la cuenta es la misma —0,6 ÷ 3 es
-- 1 ÷ 5— y los pagos por rejugar no se mueven ni una moneda: 30 en los flojos,
-- 90 en el último de Kem Kem, media 1,29 victorias. Comprobado antes de
-- escribirlo, nodo a nodo.
--
-- `src/data/rejugar.js` lleva el mismo 3 y `test/rejugar.test.js` compara los
-- dos sitios contra la ÚLTIMA migración que escribe la función, que es ésta.

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
  c_divisor  constant int := 3;
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
