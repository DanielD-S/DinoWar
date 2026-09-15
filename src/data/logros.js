// DinoWar — logros: objetivos de una vez, con recompensa que no son monedas.
//
// Las misiones diarias son tres al día y pagan dinomonedas; se acaban a
// medianoche. Un logro es lo contrario: se cumple UNA vez en la vida de la
// cuenta y lo que da no se compra con nada —un título, un mazo inicial más,
// sobres gratis—. Son la respuesta a «¿y para qué sigo?» cuando ya se han
// visto los rivales de la Morrison y los dos jefes.
//
// Miden los MISMOS contadores que las misiones (el `VOCABULARIO` de
// misiones.js), acumulados para siempre en vez de por día, y el progreso lo
// escribe el servidor por el mismo camino: nunca lo que diga el navegador. La
// recompensa VIAJA en la llamada, como la meta y el premio de una misión, y el
// SQL sólo apunta y entrega. Lo vigila test/logros.test.js.
//
// Las recompensas, y por qué ninguna rompe la regla de la tienda:
//
//   titulo   un cosmético `exclusivo` de cosmeticos.js: se otorga, no se vende.
//   mazo     un mazo inicial más, a elegir entre los que no se tienen. Son
//            cartas, y se ganan JUGANDO, que es el único camino legítimo.
//   sobres   n sobres gratis, que el servidor descuenta antes que las monedas.

import { VOCABULARIO } from './misiones.js';

export const RECOMPENSA = Object.freeze({ TITULO: 'titulo', MAZO: 'mazo', SOBRES: 'sobres' });

const L = (id, nombre, texto, mide, meta, recompensa) => Object.freeze({
  id, nombre, texto, mide, meta, recompensa: Object.freeze(recompensa),
});

export const LOGROS = Object.freeze([
  // Los de entrar en cada modo: baratos, para que quien no ha probado el duelo
  // o la cuenca tenga un motivo pequeño para asomarse.
  L('duelista', 'Duelista', 'Juega 1 duelo', 'duelos', 1, { tipo: RECOMPENSA.TITULO, id: 'titulo_duelista' }),
  L('asaltante', 'Asaltante', 'Asalta al jefe 5 veces', 'asaltos', 5, { tipo: RECOMPENSA.TITULO, id: 'titulo_asaltante' }),
  // El golpe de gracia: el asalto que deja al jefe a cero. Se lo lleva quien
  // lo da, que es lo único que el servidor puede saber sin repartir méritos.
  L('cazador', 'Cazador de jefes', 'Da el golpe final a 1 jefe', 'jefesVencidos', 1, { tipo: RECOMPENSA.TITULO, id: 'titulo_cazador' }),

  // Los de constancia.
  L('campeon', 'Campeón', 'Gana 10 duelos', 'duelosGanados', 10, { tipo: RECOMPENSA.TITULO, id: 'titulo_campeon' }),
  L('explorador', 'Explorador', 'Gana 10 partidas', 'victorias', 10, { tipo: RECOMPENSA.SOBRES, n: 3 }),
  L('demoledor', 'Demoledor', 'Hazle 300 de daño a los jefes', 'danoJefe', 300, { tipo: RECOMPENSA.SOBRES, n: 5 }),

  // Los grandes: un mazo inicial más. Eran los otros dos que no elegiste al
  // empezar y sólo se podían completar a base de sobres.
  L('morrison', 'La Morrison entera', 'Vence por primera vez a los 8 rivales de la Morrison', 'expedicionNuevos', 8, { tipo: RECOMPENSA.MAZO }),
  L('veterano', 'Veterano', 'Gana 25 duelos', 'duelosGanados', 25, { tipo: RECOMPENSA.MAZO }),
]);

export const LOGRO_POR_ID = Object.freeze(Object.fromEntries(LOGROS.map((l) => [l.id, l])));

const ES_VOCABULARIO = new Set(VOCABULARIO);
export const logroMideAlgoConocido = (l) => ES_VOCABULARIO.has(l.mide);

/**
 * Lo que un parte le suma a cada logro. Sólo lo que avanza, con la meta y la
 * recompensa al lado: es lo que el servidor apunta y entrega.
 *
 * @param {object} parte
 * @returns {Array<{id:string, avance:number, meta:number, recompensa:object}>}
 */
export function avancesDeLogros(parte) {
  return LOGROS
    .map((l) => ({ id: l.id, avance: parte[l.mide] ?? 0, meta: l.meta, recompensa: l.recompensa }))
    .filter((a) => a.avance > 0);
}

/** Cómo se lee una recompensa en pantalla. */
export function textoDeRecompensa(r, nombreDeTitulo = (id) => id) {
  if (r.tipo === RECOMPENSA.TITULO) return `Título «${nombreDeTitulo(r.id)}»`;
  if (r.tipo === RECOMPENSA.MAZO) return 'Un mazo inicial más, a elegir';
  if (r.tipo === RECOMPENSA.SOBRES) return `${r.n} sobres gratis`;
  return '';
}
