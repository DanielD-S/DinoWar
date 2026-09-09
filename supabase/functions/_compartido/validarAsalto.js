// DinoWar — validación de un ASALTO en el servidor.
//
// EL CLIENTE NO DICE CUÁNTO DAÑO HIZO. Manda la semilla, su mazo y SUS PROPIAS
// jugadas; el servidor re-juega la partida entera con el mismo motor y calcula
// el daño por su cuenta. Lo que el navegador afirme sobre el resultado no se
// lee en ningún sitio.
//
// El bucle que re-juega ya no está aquí: vive en validarPartida.js, porque las
// partidas en solitario también hay que validarlas y son la misma máquina con
// otro rival enfrente. Lo que queda en este fichero es lo que un asalto tiene
// de propio: qué jefe es, con qué mazo y qué hábitat viene, y cómo se traduce
// el final de la partida a daño para la tribu.
//
// Esto es posible por una decisión que ya estaba tomada: el motor es puro,
// (estado, acción) → estado, y `test/pureza.test.js` falla si deja de serlo o si
// la misma semilla deja de dar la misma partida. Sin esa disciplina habría que
// fiarse del cliente.
//
// Puro y sin dependencias de plataforma: corre igual en Node (los tests) y en
// Deno (la Edge Function).

import { PERFIL } from '../../../src/engine/ai.js';
import { CARTAS } from '../../../src/data/cards.js';
import { danoDeAsalto, habitatDeAsalto } from '../../../src/data/tribu.js';
import { JEFES, CALENDARIO, TIPO_EVENTO } from '../../../src/data/eventos.js';
import {
  validarPartida, validarMazoLegal, PartidaInvalida, LIMITES,
} from './validarPartida.js';

export { LIMITES };

/**
 * Se mantiene el nombre porque es el que sale en las respuestas de la Edge
 * Function y en los tests. Es la misma excepción que levanta el validador
 * genérico: un asalto inválido es una partida inválida.
 */
export const AsaltoInvalido = PartidaInvalida;

/** Un mazo legal: las cartas exactas y ninguna por encima de su rareza. */
export const validarMazoDeAsalto = validarMazoLegal;

/** El jefe tiene que existir y su ventana tiene que estar abierta. */
export function jefeDelEvento(eventoId) {
  const evento = CALENDARIO.find((e) => e.id === eventoId && e.tipo === TIPO_EVENTO.JEFE);
  if (!evento) throw new AsaltoInvalido('ese evento no es una caza', eventoId);
  const jefe = JEFES[evento.jefe];
  if (!jefe) throw new AsaltoInvalido('jefe inexistente', evento.jefe);
  return { evento, jefe };
}

/**
 * Re-juega el asalto y devuelve el daño que el servidor calcula.
 *
 * El jefe lleva SIEMPRE la IA heurística: no es una partida tuya, es trabajo
 * para la tribu, y dejar que la dificultad la eligiese el atacante convertiría
 * «pon el jefe en fácil» en la forma barata de bajarle la vida.
 *
 * @param {object} envio           lo que mandó el cliente
 * @param {string} envio.jefeEvento
 * @param {number} envio.semilla
 * @param {Array<[string,number]>} envio.mazo
 * @param {object[]} envio.acciones  SÓLO las del jugador, en orden
 * @returns {{dano:number, turnos:number, ganada:boolean, motivoFin:string,
 *            trofeos:number, danoAlHabitat:number}}
 */
export function validarAsalto(envio) {
  if (!envio || typeof envio !== 'object') throw new AsaltoInvalido('envío vacío');
  const { jefe } = jefeDelEvento(envio.jefeEvento);

  const r = validarPartida(envio, {
    mazoRival: jefe.mazo.map((e) => [...e]),
    habitatRival: habitatDeAsalto(),
    perfil: PERFIL.HEURISTICA,
  });

  return { ...r, dano: danoDeAsalto(r) };
}

/** Sólo para mensajes de error legibles. */
export const cartasDelSet = () => Object.keys(CARTAS).length;
