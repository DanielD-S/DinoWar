// DinoWar — la PREVISIÓN del combate: qué pasa en cada columna si nadie
// cambia nada.
//
// Antes de pulsar Listo el jugador ve su campo y el del rival, y hasta hoy
// tenía que echar las cuentas de cabeza: «mi 4/7 contra su 3/8, ¿lo mato?,
// ¿me mata?, ¿cuánto le entra al hábitat?». Lo único que el tablero decía
// era el borde `pasa` del carril abierto.
//
// Esto no inventa reglas: JUEGA el turno sobre una copia, con el mismo motor,
// y lee lo que salió. Los dos bandos se dan por listos, se revela y se
// combate, y de los eventos se saca la etiqueta de cada columna y lo que baja
// cada hábitat. Lo que se simula es exactamente lo PÚBLICO: el campo de los
// dos, tus despliegues pendientes —que tú sí conoces— y ninguno del rival,
// que en un duelo la vista no trae y contra la IA todavía no ha hecho. Por
// eso es «si nadie cambia nada»: el rival puede tapar el carril, y la
// previsión no lo sabe ni finge saberlo.
//
// Dos cosas que conviene saber:
//
// - Contra la IA el estado lleva el rng; la vista de un duelo no. Se pone
//   uno fijo para la copia: lo que sortea la revelación —robar en la Nidada,
//   una búsqueda— no cambia el combate, y una copia no toca nada de verdad.
// - Si la revelación no se puede simular —una entrada tuya que muerde un mazo
//   rival que la vista trae como cifra— se cae a simular sólo el combate con
//   lo que hay puesto. Menos preciso, nunca falso, y antes que nada.

import { BALANCE } from '../data/balance.js';
import { reduce, ACCION } from '../engine/actions.js';
import { FASE, unidadEn } from '../engine/state.js';
import { semilla } from '../engine/rng.js';

/** Lo que se dice de la unidad propia de una columna. */
export const SUERTE = Object.freeze({
  MATA: 'mata',        // el de enfrente cae y ella sigue
  MUERE: 'muere',      // cae ella
  AMBOS: 'ambos',      // caen los dos
  CHOCA: 'choca',      // se pegan y nadie cae
  AVANZA: 'avanza',    // no hay nadie enfrente, o vuela: pega al hábitat
});

/**
 * La previsión, o null cuando no toca: fuera del despliegue, ya en Listo, o
 * en el turno sin combate.
 *
 * @returns {null | {
 *   columnas: { mia: { suerte: string, dano: number } | null, rival: { dano: number } | null }[],
 *   habitat: number[],   cuánto baja cada hábitat, por bando
 *   trofeos: number[],   cuántos gana cada bando
 * }}
 */
export function prever(estado, yo = 0) {
  if (estado.fase !== FASE.DESPLIEGUE || estado.jugadores[yo].listo) return null;
  if (estado.turno < BALANCE.turnoPrimerCombate) return null;

  const desde = estado.eventos.length;
  let antes;
  try {
    antes = revelada(estado);
  } catch {
    antes = null;
  }
  if (!antes) {
    antes = structuredClone(estado);
    antes.fase = FASE.COMBATE;
  }
  let despues;
  try {
    despues = reduce(antes, { tipo: ACCION.AVANZAR });
  } catch {
    return null;
  }
  const eventos = despues.eventos.slice(desde);
  if (!eventos.some((e) => e.tipo === 'CHOQUE' || e.tipo === 'AVANCE' || e.tipo === 'SOBREVUELO')) {
    return null;
  }
  const otro = 1 - yo;
  const muertos = new Set(eventos.filter((e) => e.tipo === 'MUERTE').map((e) => e.iid));

  const columnas = [];
  for (let r = 0; r < BALANCE.ranuras; r++) {
    const a = unidadEn(antes, yo, r)?.iid ?? null;
    const b = unidadEn(antes, otro, r)?.iid ?? null;
    const golpes = eventos.filter((e) => (e.tipo === 'AVANCE' || e.tipo === 'SOBREVUELO') && e.ranura === r);
    const choque = eventos.some((e) => e.tipo === 'CHOQUE' && e.ranura === r);
    let mia = null;
    if (a !== null) {
      const cae = muertos.has(a);
      const caeEl = b !== null && muertos.has(b);
      const golpe = golpes.find((e) => e.bando === yo);
      let suerte;
      if (cae && caeEl) suerte = SUERTE.AMBOS;
      else if (cae) suerte = SUERTE.MUERE;
      else if (caeEl) suerte = SUERTE.MATA;
      else if (choque) suerte = SUERTE.CHOCA;
      else suerte = SUERTE.AVANZA;
      mia = { suerte, dano: golpe?.dano ?? 0 };
    }
    const suyo = golpes.find((e) => e.bando === otro);
    columnas.push({ mia, rival: suyo ? { dano: suyo.dano } : null });
  }

  return {
    columnas,
    habitat: [0, 1].map((b) => Math.max(0, estado.jugadores[b].habitat - despues.jugadores[b].habitat)),
    trofeos: [0, 1].map((b) => despues.jugadores[b].trofeos - estado.jugadores[b].trofeos),
  };
}

/** La copia con los dos listos y la revelación hecha, parada antes del combate. */
function revelada(estado) {
  const base = structuredClone(estado);
  for (const j of base.jugadores) j.listo = true;
  if (base.rng === undefined || base.rng === null) base.rng = semilla(1);
  base.fase = FASE.REVELACION;
  const s = reduce(base, { tipo: ACCION.AVANZAR });
  return s.fase === FASE.COMBATE ? s : null;
}
