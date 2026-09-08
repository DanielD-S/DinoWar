// Utilidades para montar escenarios de tablero sin jugar una partida entera.

import { crearPartida, FASE } from '../src/engine/state.js';
import { reduce, ACCION } from '../src/engine/actions.js';

/** Partida limpia, con las manos y los recursos vaciados para no interferir. */
export function tableroVacio(seed = 42) {
  const s = crearPartida(seed);
  for (const jug of s.jugadores) {
    jug.mano = [];
    jug.biomasa = 0;
    jug.agua = 0;
    jug.territorio = 0;
  }
  return s;
}

/** Pone una unidad ya desplegada en una zona. Devuelve su iid. */
export function colocar(s, cardId, dueno, zona, extra = {}) {
  const iid = s.siguienteInstId++;
  s.instancias[iid] = {
    iid, cardId, dueno, zona,
    modPoder: 0,
    colosalGastado: false,
    adherencias: [],
    adheridoA: null,
    desplegadoEnTurno: s.turno,
    ...extra,
  };
  s.zonas[zona - 1].unidades.push(iid);
  return iid;
}

/** Adhiere una adaptación ya revelada a una unidad. Devuelve su iid. */
export function adherir(s, cardId, objetivoIid, extra = {}) {
  const objetivo = s.instancias[objetivoIid];
  const iid = s.siguienteInstId++;
  s.instancias[iid] = {
    iid, cardId,
    dueno: objetivo.dueno,
    zona: objetivo.zona,
    modPoder: 0,
    colosalGastado: false,
    adherencias: [],
    adheridoA: objetivoIid,
    desplegadoEnTurno: s.turno,
    ...extra,
  };
  objetivo.adherencias.push(iid);
  return iid;
}

/** Pone una carta concreta en la mano de un jugador. Devuelve su iid. */
export function enMano(s, cardId, dueno) {
  const iid = s.siguienteInstId++;
  s.instancias[iid] = {
    iid, cardId, dueno,
    zona: null,
    modPoder: 0,
    colosalGastado: false,
    adherencias: [],
    adheridoA: null,
    desplegadoEnTurno: null,
  };
  s.jugadores[dueno].mano.push(iid);
  return iid;
}

/** Ejecuta la fase indicada a través del reducer. */
export function ejecutarFase(s, fase) {
  const copia = structuredClone(s);
  copia.fase = fase;
  return reduce(copia, { tipo: ACCION.AVANZAR });
}

export const vivo = (s, iid) => s.instancias[iid].zona !== null;
export const enDescarte = (s, iid) => s.jugadores[s.instancias[iid].dueno].descarte.includes(iid);

export { FASE, reduce, ACCION };
