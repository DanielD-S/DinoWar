-- DinoWar — los logros de «entera» de Hell Creek, Tendaguru y Kem Kem.
--
-- Y DESPUÉS, la Edge Function re-empaquetada y re-anclada: es ella quien
-- escribe el contador nuevo de cada mapa (`expedicion:<mapa>`) en el parte.
--
-- Hasta hoy «La Morrison entera» medía `expedicionNuevos`, que suma también
-- las primeras victorias del visitante de la semana: siete nodos y un
-- visitante ya la pagaban. Ahora cada mapa mide su contador. El de la
-- Morrison conserva el progreso que llevara cada cuenta —la fila de `logros`
-- es la misma— y los tres nuevos se RECUENTAN aquí de `expediciones_victorias`
-- para quien ya haya recorrido esos mapas, como hizo la 0028 con lo jugado
-- antes de los logros. Se pasan por `private.avanzar_logros`, que es quien
-- entrega: si alguien tiene ya los ocho, cobra sus sobres en el acto.

create or replace function private.catalogo_logros()
returns jsonb
language sql immutable as $$
  -- LOGROS:INICIO
  select '[{"id":"duelista","mide":"duelos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_duelista"}},{"id":"asaltante","mide":"asaltos","meta":5,"recompensa":{"tipo":"titulo","id":"titulo_asaltante"}},{"id":"cazador","mide":"jefesVencidos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_cazador"}},{"id":"trofeo_saurophaganax","mide":"jefe:saurophaganax","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_saurophaganax"}},{"id":"trofeo_barosaurus","mide":"jefe:barosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_barosaurus"}},{"id":"trofeo_supersaurus","mide":"jefe:supersaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_supersaurus"}},{"id":"trofeo_hesperosaurus","mide":"jefe:hesperosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_hesperosaurus"}},{"id":"trofeo_harpactognathus","mide":"jefe:harpactognathus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_harpactognathus"}},{"id":"cazador_mayor","mide":"cartasJefe","meta":5,"recompensa":{"tipo":"cosmetico","id":"dorso_cazador"}},{"id":"campeon","mide":"duelosGanados","meta":10,"recompensa":{"tipo":"titulo","id":"titulo_campeon"}},{"id":"explorador","mide":"victorias","meta":10,"recompensa":{"tipo":"sobres","n":3}},{"id":"demoledor","mide":"danoJefe","meta":300,"recompensa":{"tipo":"sobres","n":5}},{"id":"morrison","mide":"expedicion:morrison","meta":8,"recompensa":{"tipo":"mazo"}},{"id":"hell_creek","mide":"expedicion:hell_creek","meta":8,"recompensa":{"tipo":"sobres","n":4}},{"id":"tendaguru","mide":"expedicion:tendaguru","meta":8,"recompensa":{"tipo":"sobres","n":5}},{"id":"kem_kem","mide":"expedicion:kem_kem","meta":8,"recompensa":{"tipo":"sobres","n":6}},{"id":"veterano","mide":"duelosGanados","meta":25,"recompensa":{"tipo":"mazo"}},{"id":"leyenda","mide":"duelosGanados","meta":50,"recompensa":{"tipo":"cosmetico","id":"estandarte_campeon"}}]'::jsonb
  -- LOGROS:FIN
$$;
revoke all on function private.catalogo_logros() from public, anon, authenticated;

-- ------------------------------------------------- lo ya recorrido
do $$
declare
  v_mapas jsonb := '{"hell_creek": ["sotobosque_hell_creek", "los_blindados", "cabezas_de_hueso", "marisma_edmontosaurus", "mar_interior", "clan_de_los_cuernos", "invierno_del_impacto", "el_ultimo_rey"], "tendaguru": ["corredores_de_la_meseta", "llanura_de_marea", "espinas_de_kentrosaurus", "cazadores_de_la_meseta", "cuellos_de_dicraeosaurus", "vientos_de_gondwana", "grandes_carnivoros", "coloso_de_tendaguru"], "kem_kem": ["pescadores_del_delta", "abelisaurios_del_echkar", "vela_de_ouranosaurus", "segadora_del_elrhaz", "alas_del_sahara", "rio_de_spinosaurus", "corredor_del_delta", "diente_de_sierra"]}'::jsonb;
  v_mapa  text;
  j       record;
  v_n     int;
  v_logro jsonb;
begin
  for v_mapa in select jsonb_object_keys(v_mapas) loop
    select d into v_logro from jsonb_array_elements(private.catalogo_logros()) d
     where d->>'mide' = 'expedicion:' || v_mapa;
    if v_logro is null then continue; end if;
    for j in select v.jugador_id as id, count(*) as n
               from public.expediciones_victorias v
              where v.rival_id in (select jsonb_array_elements_text(v_mapas->v_mapa))
                and v.clave = v.rival_id
              group by v.jugador_id
    loop
      perform private.avanzar_logros(j.id, jsonb_build_array(jsonb_build_object(
        'id', v_logro->>'id', 'avance', j.n, 'meta', v_logro->'meta', 'recompensa', v_logro->'recompensa')));
    end loop;
  end loop;
end;
$$;
