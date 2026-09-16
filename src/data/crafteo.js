// DinoWar — el crafteo: fundir lo que sobra en esquirlas y crear lo que falta.
//
// Hasta ahora las copias sobrantes se fundían en DINOMONEDAS, y con ellas se
// compraban más sobres: repetir cartas era la forma de abrir más. Ahora las
// monedas salen sólo de jugar —victorias, misiones, expediciones— y compran
// sobres; lo que sobra se funde en ESQUIRLAS, y con esquirlas se CREA la carta
// que eliges. Es el camino gratis y lento, y es el único que te deja elegir.
//
// UNA esquirla para todo, y el coste va por rareza. No puede ser «craftear de su
// misma rareza»: el sobre reparte sobre todo lo que te falta (`abrirSobre` en
// coleccion.js mira la colección en el 70 % de las cartas), así que las copias
// sobrantes de una rareza escasean hasta que la tienes entera. Con una esquirla
// por rareza casi no habría nada que crear. Con una sola, las comunes que ya
// completaste pagan tus raras y tus épicas.
//
// Los números empezaron siendo los de Hearthstone (fundir 5 / 20 / 100 / 400,
// crear 40 / 100 / 400 / 1600) y el autor los subió el 16-09-2026 en las tres
// rarezas de abajo, a la vez que el sobre pasó de mirar la colección siempre a
// mirarla el 70 %: con más copias sobrantes, fundir da más y crear cuesta más,
// y la legendaria se queda como estaba. Fundir una carta siempre da MENOS de
// lo que cuesta crear otra de su rareza, así que no hay bucle, y crear sólo se
// puede hasta el tope de copias, así que lo creado nunca vuelve a ser
// sobrante. Lo que cambia con estos números está medido en la nota del
// crafteo de CLAUDE.md.
//
// Vive aparte de coleccion.js a propósito: ese fichero va dentro de la Edge
// Function, y tocarlo obliga a re-empaquetar, re-anclar y desplegar. El servidor
// no necesita esto: fundir y crear son SQL (0029), que lee estos números de
// `catalogo_crafteo`, la tabla que el generador escribe desde aquí.

import { CARTAS, RAREZA, carta } from './cards.js';
import { excedente, limiteDe } from './coleccion.js';

export const CRAFTEO = Object.freeze({
  fundir: Object.freeze({
    [RAREZA.COMUN]: 10, [RAREZA.RARO]: 30, [RAREZA.EPICO]: 150, [RAREZA.LEGENDARIO]: 400,
  }),
  crear: Object.freeze({
    [RAREZA.COMUN]: 80, [RAREZA.RARO]: 200, [RAREZA.EPICO]: 500, [RAREZA.LEGENDARIO]: 1600,
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
