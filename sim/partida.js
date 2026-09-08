// DinoWar — bucle de partida headless. Lo comparten el simulador y los tests.

import { crearPartida, vistaDe, FASE, unidadesDe } from '../src/engine/state.js';
import { reduce, ACCION, legales } from '../src/engine/actions.js';
import { decidir, PERFIL } from '../src/engine/ai.js';
import { semilla } from '../src/engine/rng.js';

const MAX_ACCIONES_POR_FASE = 200;

export function jugarPartida(
  seed,
  perfiles = [PERFIL.HEURISTICA, PERFIL.HEURISTICA],
  observador = null,
  redactar = true,
) {
  let s = crearPartida(seed);
  // RNG de decisión independiente del de la partida: cambiar la IA no cambia
  // los repartos, así que las comparaciones A/B son limpias.
  let rng = semilla(seed ^ 0x5bf03635);
  const jugadas = [];
  const ver = (j) => (redactar ? vistaDe(s, j) : s);

  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const faseInicial = s.fase;
      let pasos = 0;
      while (s.fase === faseInicial) {
        let actuo = false;
        for (let j = 0; j < 2; j++) {
          if (s.fase !== faseInicial) break;
          if (legales(s, j).length === 0) continue;
          const d = decidir(ver(j), j, rng, perfiles[j]);
          rng = d.rng;
          if (!d.accion) continue;
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo !== ACCION.PASAR && d.accion.tipo !== ACCION.DESCARTAR && d.accion.iid !== undefined) {
            jugadas.push({ turno: s.turno, jugador: j, cardId: s.instancias[d.accion.iid].cardId });
          }
        }
        if (!actuo) break;
        if (++pasos > MAX_ACCIONES_POR_FASE) throw new Error(`fase ${faseInicial} no converge (semilla ${seed})`);
      }
      if (s.fase === faseInicial) throw new Error(`fase ${faseInicial} bloqueada (semilla ${seed})`);
      continue;
    }

    const anterior = s.fase;
    s = reduce(s, { tipo: ACCION.AVANZAR });
    if (anterior === FASE.COMBATE && observador) observador(s);
  }

  return { estado: s, jugadas };
}

/** Foto del estado para métricas, justo después de un combate. */
export function foto(s) {
  return {
    turno: s.turno,
    trofeos: [s.jugadores[0].trofeos, s.jugadores[1].trofeos],
    habitat: [s.jugadores[0].habitat, s.jugadores[1].habitat],
    unidades: [unidadesDe(s, 0).length, unidadesDe(s, 1).length],
    campo: s.campo,
  };
}

/**
 * Quién va por delante en una foto. Es la definición que usa la métrica
 * antibola de nieve: primero trofeos, y a igualdad, habitat.
 */
export function lider(f) {
  if (f.trofeos[0] !== f.trofeos[1]) return f.trofeos[0] > f.trofeos[1] ? 0 : 1;
  if (f.habitat[0] !== f.habitat[1]) return f.habitat[0] > f.habitat[1] ? 0 : 1;
  return null;
}
