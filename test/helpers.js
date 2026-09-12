// Utilidades para montar escenarios de campo sin jugar una partida entera.

import { crearPartida, nuevaInstancia, vistaDe, FASE } from '../src/engine/state.js';
import { reduce, ACCION, legales } from '../src/engine/actions.js';
import { decidir, PERFIL } from '../src/engine/ai.js';
import { semilla } from '../src/engine/rng.js';
import { MAZO } from '../src/data/balance.js';

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
  s.instancias[iid] = { ...nuevaInstancia(iid, cardId, dueno), ...extra };
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

/** El mazo de referencia, mutable: los validadores reciben pares, no congelados. */
export const MAZO_OK = MAZO.map((e) => [...e]);

/**
 * Juega una partida entera contra la IA y devuelve el ENVÍO que haría el
 * navegador: semilla, mazo y SÓLO tus jugadas, en el orden en que las haces.
 *
 * Está aquí y no dentro de un test porque la usan dos —el de cuentas, que
 * comprueba que el servidor llega al mismo ganador, y el de misiones, que
 * comprueba qué deja escrito—. Dos copias de este bucle serían dos formas de
 * jugar la misma partida, que es justo lo que `validarPartida` existe para
 * evitar un piso más arriba.
 */
export function jugarSolo(seed, perfil = PERFIL.HEURISTICA) {
  let s = crearPartida(seed, [MAZO_OK, null]);
  let rngIA = semilla(seed ^ 0x5bf03635);
  const acciones = [];

  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const faseInicial = s.fase;
      let pasos = 0;
      while (s.fase === faseInicial) {
        let actuo = false;
        let rngYo = semilla(seed ^ 0x1234abcd);
        while (s.fase === faseInicial && legales(s, 0).length > 0) {
          const d = decidir(vistaDe(s, 0), 0, rngYo, perfil);
          rngYo = d.rng;
          if (!d.accion) break;
          acciones.push(d.accion);
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
        }
        let suyas = 0;
        while (s.fase === faseInicial && legales(s, 1).length > 0) {
          const d = decidir(vistaDe(s, 1), 1, rngIA, perfil);
          rngIA = d.rng;
          if (!d.accion) break;
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
          if (++suyas > 200) break;
        }
        if (!actuo) break;
        if (++pasos > 200) break;
      }
      if (s.fase === faseInicial) break;
      continue;
    }
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }
  return { semilla: seed, mazo: MAZO_OK, acciones, perfil, ganada: s.ganador === 0 };
}

export { reduce, ACCION };
