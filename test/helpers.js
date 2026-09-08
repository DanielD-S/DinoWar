// Utilidades para montar escenarios de campo sin jugar una partida entera.

import { crearPartida } from '../src/engine/state.js';
import { reduce, ACCION } from '../src/engine/actions.js';

/**
 * Partida limpia, con manos y Biomasa a cero para que no interfieran.
 * Arranca en el turno 2: en el 1 no hay combate y en el 3 empieza el clima.
 */
export function tablero(seed = 42) {
  const s = crearPartida(seed);
  s.turno = 2;
  for (const jug of s.jugadores) {
    jug.mano = [];
    jug.biomasa = 0;
  }
  return s;
}

function nueva(s, cardId, dueno, extra = {}) {
  const iid = s.siguienteInstId++;
  s.instancias[iid] = {
    iid, cardId, dueno,
    ranura: null, heridas: 0, modAtaque: 0, modVida: 0,
    adherencias: [], adheridoA: null, desplegadoEnTurno: null,
    ...extra,
  };
  return iid;
}

/** Coloca una unidad ya revelada en una ranura. Devuelve su iid. */
export function poner(s, cardId, dueno, ranura, extra = {}) {
  const iid = nueva(s, cardId, dueno, { ranura, ...extra });
  s.ranuras[dueno][ranura] = iid;
  return iid;
}

/** Pone una carta concreta en la mano de un jugador. Devuelve su iid. */
export function enMano(s, cardId, dueno) {
  const iid = nueva(s, cardId, dueno);
  s.jugadores[dueno].mano.push(iid);
  return iid;
}

/** Ejecuta la fase indicada a través del reducer. */
export function ejecutar(s, fase) {
  const copia = structuredClone(s);
  copia.fase = fase;
  return reduce(copia, { tipo: ACCION.AVANZAR });
}

export const vivo = (s, iid) => s.instancias[iid].ranura !== null;

export { reduce, ACCION };
