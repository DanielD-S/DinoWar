// DinoWar — mide la curva de una expedición.
//
//   node sim/expediciones.mjs            400 partidas por rival
//   node sim/expediciones.mjs 1000
//
// Un camino de rivales sólo funciona si cada uno es un poco más difícil que el
// anterior, y eso no se decide a ojo: un mazo de saurópodos «que aguanta» puede
// ser el más fácil del mapa si la IA no sabe jugarlo. Aquí el JUGADOR es el
// mazo de referencia llevado por la heurística —el que tiene una cuenta nueva
// y juega alguien que sabe— y enfrente cada rival con su mazo y su perfil.
// Bandos alternados, porque el primer jugador gana más.
//
// La columna que importa es «le ganas»: la curva buena baja de nodo en nodo,
// del 90 % del primero a algo por debajo del 50 % en el último.

import { pathToFileURL } from 'node:url';
import { crearPartida, vistaDe, FASE } from '../src/engine/state.js';
import { reduce, ACCION, legales } from '../src/engine/actions.js';
import { decidir, PERFIL } from '../src/engine/ai.js';
import { semilla } from '../src/engine/rng.js';
import { MAZO } from '../src/data/balance.js';
import { EXPEDICIONES, VISITANTES } from '../src/data/expediciones.js';

/**
 * Cuántas cartas del mazo son RELLENO de Biomasa, que `completar()` mete hasta
 * las 55. Sale en la tabla porque es la palanca de dificultad que nadie sabía
 * que estaba tocando: un rival escrito con veintidós criaturas y nueve cartas
 * de soporte se lleva veinticuatro Biomasa, y está medido desde hace meses que
 * catorce ya hunden un mazo al 39,8 %. Los cuatro nodos finales llevan entre 9
 * y 16; los primeros, entre 19 y 25. Es la columna que explica la curva.
 */
const RELLENO = new Set(['biomasa', 'araucarias', 'cicadas', 'ginkgos', 'equisetos', 'galeria', 'helechal']);
const relleno = (r) => r.mazo.filter(([id]) => RELLENO.has(id)).reduce((n, [, c]) => n + c, 0);

/** Una partida: jugador en el bando `lado`, rival en el otro. Devuelve si ganó el jugador. */
export function jugar(seed, lado, mazoRival, perfilRival, mazoJugador = MAZO) {
  const mazos = lado === 0 ? [mazoJugador, mazoRival] : [mazoRival, mazoJugador];
  const perfiles = lado === 0 ? [PERFIL.HEURISTICA, perfilRival] : [perfilRival, PERFIL.HEURISTICA];
  let s = crearPartida(seed, mazos);
  const rng = [semilla(seed ^ 0x1111), semilla(seed ^ 0x5bf03635)];
  let v = 0;
  while (s.fase !== FASE.FIN && v++ < 4000) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const f0 = s.fase;
      let pasos = 0;
      while (s.fase === f0 && pasos++ < 200) {
        let actuo = false;
        for (const j of [0, 1]) {
          let k = 0;
          while (s.fase === f0 && legales(s, j).length && k++ < 200) {
            const d = decidir(vistaDe(s, j), j, rng[j], perfiles[j]);
            rng[j] = d.rng;
            if (!d.accion) break;
            s = reduce(s, d.accion);
            actuo = true;
            if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
          }
        }
        if (!actuo) break;
      }
      if (s.fase === f0) break;
      continue;
    }
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }
  return { gana: s.ganador === lado, turnos: s.turno, motivo: s.motivoFin };
}

/** Cuánto le gana el mazo de referencia a un rival. */
export function medir(rival, n) {
  let gana = 0;
  let turnos = 0;
  const vias = {};
  for (let p = 0; p < n; p++) {
    const r = jugar(52000 + Math.floor(p / 2), p % 2, rival.mazo, rival.perfil);
    if (r.gana) gana += 1;
    turnos += r.turnos;
    vias[r.motivo] = (vias[r.motivo] ?? 0) + 1;
  }
  return { gana: gana / n, turnos: turnos / n, vias };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = Number(process.argv[2]) || 400;
  const pct = (x) => `${(x * 100).toFixed(1).padStart(5)} %`;
  process.stdout.write(`${n} partidas por rival. Jugador: mazo de referencia con la heurística.\n\n`);
  for (const e of EXPEDICIONES) {
    process.stdout.write(`${e.nombre}\n`);
    process.stdout.write(`  ${'#'.padEnd(3)}${'rival'.padEnd(30)}${'perfil'.padEnd(12)}le ganas  turnos  relleno  vías\n`);
    e.rivales.forEach((r, i) => {
      const m = medir(r, n);
      const vias = Object.entries(m.vias).map(([k, v]) => `${k[0]}${Math.round((v / n) * 100)}`).join(' ');
      process.stdout.write(`  ${String(i + 1).padEnd(3)}${r.nombre.padEnd(30)}${r.perfil.padEnd(12)}${pct(m.gana)}  ${m.turnos.toFixed(1).padStart(6)}  ${String(relleno(r)).padStart(7)}  ${vias}\n`);
    });
  }
  process.stdout.write('\nVisitantes de la semana\n');
  for (const r of VISITANTES) {
    const m = medir(r, n);
    process.stdout.write(`     ${r.nombre.padEnd(30)}${r.perfil.padEnd(12)}${pct(m.gana)}  ${m.turnos.toFixed(1).padStart(6)}  ${String(relleno(r)).padStart(7)}\n`);
  }
}
