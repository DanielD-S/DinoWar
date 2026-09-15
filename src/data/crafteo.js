// DinoWar — el crafteo: fundir lo que sobra en esquirlas y crear lo que falta.
//
// Hasta ahora las copias sobrantes se fundían en DINOMONEDAS, y con ellas se
// compraban más sobres: repetir cartas era la forma de abrir más. Ahora las
// monedas salen sólo de jugar —victorias, misiones, expediciones— y compran
// sobres; lo que sobra se funde en ESQUIRLAS, y con esquirlas se CREA la carta
// que eliges. Es el camino gratis y lento, y es el único que te deja elegir.
//
// UNA esquirla para todo, y el coste va por rareza. No puede ser «craftear de su
// misma rareza»: el sobre reparte primero lo que te falta (`abrirSobre` en
// coleccion.js), así que las copias sobrantes de una rareza sólo aparecen cuando
// ya la tienes entera. Con una esquirla por rareza nunca habría nada que crear.
// Con una sola, las comunes que ya completaste pagan tus raras y tus épicas.
//
// Los números son los de Hearthstone, que llevan diez años de ajuste: fundir da
// 5 / 20 / 100 / 400 y crear cuesta 40 / 100 / 400 / 1600. Fundir una carta
// siempre da MENOS de lo que cuesta crear otra de su rareza, así que no hay
// bucle, y crear sólo se puede hasta el tope de copias, así que lo creado nunca
// vuelve a ser sobrante.
//
// Vive aparte de coleccion.js a propósito: ese fichero va dentro de la Edge
// Function, y tocarlo obliga a re-empaquetar, re-anclar y desplegar. El servidor
// no necesita esto: fundir y crear son SQL (0029), que lee estos números de
// `catalogo_crafteo`, la tabla que el generador escribe desde aquí.

import { CARTAS, RAREZA, carta } from './cards.js';
import { excedente, limiteDe } from './coleccion.js';

export const CRAFTEO = Object.freeze({
  fundir: Object.freeze({
    [RAREZA.COMUN]: 5, [RAREZA.RARO]: 20, [RAREZA.EPICO]: 100, [RAREZA.LEGENDARIO]: 400,
  }),
  crear: Object.freeze({
    [RAREZA.COMUN]: 40, [RAREZA.RARO]: 100, [RAREZA.EPICO]: 400, [RAREZA.LEGENDARIO]: 1600,
  }),
});

/** Esquirlas que daría fundir todo lo que sobra. */
export function esquirlasDeFundir(cartas) {
  return Object.entries(excedente(cartas))
    .reduce((n, [cardId, copias]) => n + copias * CRAFTEO.fundir[carta(cardId).rareza], 0);
}

/** Lo que cuesta crear una copia de esta carta. */
export const costeDeCrear = (cardId) => CRAFTEO.crear[carta(cardId).rareza];

/**
 * ¿Se puede crear una copia más? Sólo cartas del set —las de jefe se ganan en
 * la cuenca— y sólo hasta el tope de copias que caben en un mazo.
 */
export const sePuedeCrear = (cardId, cartas) => Boolean(CARTAS[cardId])
  && (cartas?.[cardId] ?? 0) < limiteDe(cardId);
