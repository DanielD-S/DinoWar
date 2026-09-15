-- DinoWar — tres jefes nuevos: Supersaurus, Hesperosaurus y Harpactognathus.
--
-- ORDEN AL APLICAR:
--   1. La 0006 regenerada (`node tools/generar-cartas.mjs`): las tres cartas de
--      jefe en `catalogo_cartas` y sus tres retratos exclusivos en
--      `catalogo_cosmeticos`.
--   2. La 0004 regenerada (`node tools/generar-catalogo.mjs`): los seis eventos
--      nuevos en `catalogo_eventos` y `ciclo_dias` de 14 a 35.
--   3. Ésta.
--   4. Re-anclar sobre main y desplegar la Edge Function: el asalto re-juega la
--      partida con el mazo del jefe, que sale de src/data/eventos.js.
--
-- El calendario pasa de 14 a 35 días y las tribus NO pierden su vuelta: los
-- catorce primeros días son los mismos de antes, y `private.ciclo_de()` divide
-- por `ciclo_dias`, así que una tribu de menos de 35 días sigue en la vuelta 0.
-- Se aplicó con las dos tribus a 6 días de vida; con una tribu de más de 14
-- días habría que mirar sus filas de `jefes` antes, que su vuelta bajaría.
--
-- Aquí sólo va la copia del catálogo de logros que usa `reclamar_jefe`: tres
-- trofeos nuevos, y «Cazador mayor» pasa a pedir las cinco cartas de jefe.
-- Nadie tenía todavía ninguna, así que no hay recuento que rehacer.

create or replace function private.catalogo_logros()
returns jsonb
language sql immutable as $$
  -- LOGROS:INICIO
  select '[{"id":"duelista","mide":"duelos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_duelista"}},{"id":"asaltante","mide":"asaltos","meta":5,"recompensa":{"tipo":"titulo","id":"titulo_asaltante"}},{"id":"cazador","mide":"jefesVencidos","meta":1,"recompensa":{"tipo":"titulo","id":"titulo_cazador"}},{"id":"trofeo_saurophaganax","mide":"jefe:saurophaganax","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_saurophaganax"}},{"id":"trofeo_barosaurus","mide":"jefe:barosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_barosaurus"}},{"id":"trofeo_supersaurus","mide":"jefe:supersaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_supersaurus"}},{"id":"trofeo_hesperosaurus","mide":"jefe:hesperosaurus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_hesperosaurus"}},{"id":"trofeo_harpactognathus","mide":"jefe:harpactognathus","meta":1,"recompensa":{"tipo":"cosmetico","id":"retrato_harpactognathus"}},{"id":"cazador_mayor","mide":"cartasJefe","meta":5,"recompensa":{"tipo":"cosmetico","id":"dorso_cazador"}},{"id":"campeon","mide":"duelosGanados","meta":10,"recompensa":{"tipo":"titulo","id":"titulo_campeon"}},{"id":"explorador","mide":"victorias","meta":10,"recompensa":{"tipo":"sobres","n":3}},{"id":"demoledor","mide":"danoJefe","meta":300,"recompensa":{"tipo":"sobres","n":5}},{"id":"morrison","mide":"expedicionNuevos","meta":8,"recompensa":{"tipo":"mazo"}},{"id":"veterano","mide":"duelosGanados","meta":25,"recompensa":{"tipo":"mazo"}},{"id":"leyenda","mide":"duelosGanados","meta":50,"recompensa":{"tipo":"cosmetico","id":"estandarte_campeon"}}]'::jsonb
  -- LOGROS:FIN
$$;
revoke all on function private.catalogo_logros() from public, anon, authenticated;
