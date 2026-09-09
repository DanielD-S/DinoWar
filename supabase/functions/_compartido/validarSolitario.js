// DinoWar — validación de una partida EN SOLITARIO, contra la IA.
//
// Por qué existe: las dinomonedas de una victoria se acuñaban diciendo «he
// ganado». Con monedas acuñadas se compran sobres, y las cartas que salen de un
// sobre comprado son legítimas — así que mover la colección al servidor sin
// mover esto habría cerrado la puerta del mazo dejando abierta la de al lado.
//
// El rival es el mazo de REFERENCIA, el mismo que mide el simulador y el mismo
// que `crearPartida` pone cuando no le dan uno. Por eso aquí no viaja: si el
// mazo del rival lo eligiera el cliente, la victoria sería contra cincuenta
// cartas escogidas para perder.
//
// Puro y sin dependencias de plataforma: corre igual en Node y en Deno.

import { ECONOMIA } from '../../../src/data/coleccion.js';
import { validarPartida, perfilValido } from './validarPartida.js';

export { PartidaInvalida } from './validarPartida.js';

/**
 * Re-juega la partida y devuelve lo que el servidor pagaría por ella.
 *
 * @param {object} envio             lo que mandó el cliente
 * @param {number} envio.semilla
 * @param {Array<[string,number]>} envio.mazo
 * @param {object[]} envio.acciones   SÓLO las tuyas, en orden
 * @param {string} [envio.perfil]     la dificultad que elegiste
 * @returns {{premio:number, ganada:boolean, turnos:number, trofeos:number,
 *            danoAlHabitat:number, motivoFin:string}}
 */
export function validarSolitario(envio) {
  const r = validarPartida(envio, {
    // null es el mazo de referencia. Es lo que hace `crearPartida` en el
    // navegador cuando la partida no es un asalto, así que reproducirlo es
    // literalmente no pasarle nada.
    mazoRival: null,
    habitatRival: null,
    perfil: perfilValido(envio.perfil),
  });

  // Perder no paga: `monedasDerrota` es 0 y está aquí, y no un cero escrito a
  // mano, para que cambiarlo sea cambiar la economía en un solo sitio.
  return {
    ...r,
    premio: r.ganada ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota,
  };
}
