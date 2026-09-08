// Bucle de partida headless. Lo comparten el simulador y los tests; la
// interfaz usará el mismo `avanzar`/`reduce` pero conducido por el jugador.

import { crearPartida, vistaDe, FASE, dominacion, unidadesDe } from '../src/engine/state.js';
import { reduce, ACCION, legales } from '../src/engine/actions.js';
import { decidir, PERFIL } from '../src/engine/ai.js';
import { semilla, siguiente } from '../src/engine/rng.js';

const MAX_ACCIONES_POR_FASE = 200;

/**
 * Juega una partida completa entre dos IAs.
 *
 * @param {number} seed
 * @param {[string,string]} perfiles perfiles de IA para el jugador 0 y el 1
 * @param {(estado:object)=>void} [observador] llamado tras cada RESOLUCIÓN
 * @param {boolean} [redactar] si false, la IA ve el estado completo (más rápido;
 *        sólo admisible para perfiles que provablemente no leen datos del rival)
 */
export function jugarPartida(seed, perfiles = [PERFIL.ALEATORIA, PERFIL.ALEATORIA], observador = null, redactar = true) {
  let s = crearPartida(seed);
  // RNG de decisión, independiente del RNG de la partida: así cambiar la IA no
  // cambia los repartos de cartas y las comparaciones A/B son limpias.
  let rng = semilla(seed ^ 0x5bf03635);
  const jugadas = [];
  // Turnos-jugador en los que un bando llega al despliegue sin ninguna jugada
  // posible. Es la métrica que justifica (o desmiente) el suelo de ingreso D3.
  const bloqueos = [0, 0];
  let ultimoTurnoMedido = 0;

  const ver = (j) => (redactar ? vistaDe(s, j) : s);

  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.SEQUIA_PAGO) {
      for (const j of s.sequiaPendiente.slice()) {
        const d = decidir(ver(j), j, rng, perfiles[j]);
        rng = d.rng;
        s = reduce(s, d.accion);
      }
      continue;
    }

    if (s.fase === FASE.DESPLIEGUE && s.turno !== ultimoTurnoMedido) {
      ultimoTurnoMedido = s.turno;
      for (let j = 0; j < 2; j++) {
        const opciones = legales(s, j).filter((a) => a.tipo !== ACCION.PASAR);
        if (opciones.length === 0) bloqueos[j] += 1;
      }
    }

    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      let pasos = 0;
      const faseInicial = s.fase;
      while (s.fase === faseInicial) {
        let actuo = false;
        for (let j = 0; j < 2; j++) {
          const d = decidir(ver(j), j, rng, perfiles[j]);
          rng = d.rng;
          if (!d.accion) continue;
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.DESPLEGAR || d.accion.tipo === ACCION.ADAPTAR) {
            jugadas.push({ turno: s.turno, jugador: j, cardId: s.instancias[d.accion.iid].cardId });
          }
          if (s.fase !== faseInicial) break;
        }
        if (!actuo) break;
        if (++pasos > MAX_ACCIONES_POR_FASE) {
          throw new Error(`fase ${faseInicial} no converge (semilla ${seed})`);
        }
      }
      if (s.fase === faseInicial) {
        throw new Error(`fase ${faseInicial} bloqueada sin acciones legales (semilla ${seed})`);
      }
      continue;
    }

    const faseAnterior = s.fase;
    s = reduce(s, { tipo: ACCION.AVANZAR });
    if (faseAnterior === FASE.RESOLUCION && observador) observador(s);
  }

  return { estado: s, jugadas, bloqueos };
}

/** Foto del tablero para métricas, tomada justo después de una resolución. */
export function foto(s) {
  const dom = dominacion(s);
  return {
    turno: s.turno,
    dominadores: dom.map((d) => d.dominador),
    unidades: [unidadesDe(s, 0).length, unidadesDe(s, 1).length],
    territorio: [s.jugadores[0].territorio, s.jugadores[1].territorio],
    biomasa: [s.jugadores[0].biomasa, s.jugadores[1].biomasa],
  };
}

export { siguiente };
