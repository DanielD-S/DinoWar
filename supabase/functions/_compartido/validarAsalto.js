// DinoWar — validación de un asalto en el servidor.
//
// EL CLIENTE NO DICE CUÁNTO DAÑO HIZO. Manda la semilla, su mazo y SUS PROPIAS
// jugadas; el servidor re-juega la partida entera con el mismo motor y calcula
// el daño por su cuenta. Lo que el navegador afirme sobre el resultado no se
// lee en ningún sitio.
//
// Esto es posible por una decisión que ya estaba tomada: el motor es puro,
// (estado, acción) → estado, y `test/pureza.test.js` falla si deja de serlo o si
// la misma semilla deja de dar la misma partida. Sin esa disciplina habría que
// fiarse del cliente.
//
// Las jugadas DEL JEFE no se aceptan del cliente: las calcula el servidor con
// su propia IA. Si se aceptaran, la trampa sería trivial y no haría falta tocar
// ningún número — bastaría con mandar un jefe que pasa todos los turnos.
//
// Puro y sin dependencias de plataforma: corre igual en Node (los tests) y en
// Deno (la Edge Function).

import { crearPartida, vistaDe, FASE } from '../../../src/engine/state.js';
import { reduce, ACCION, legales, validar } from '../../../src/engine/actions.js';
import { decidir, PERFIL } from '../../../src/engine/ai.js';
import { semilla } from '../../../src/engine/rng.js';
import { BALANCE } from '../../../src/data/balance.js';
import { CARTAS, existeCarta, carta } from '../../../src/data/cards.js';
import { danoDeAsalto, habitatDeAsalto } from '../../../src/data/tribu.js';
import { JEFES, CALENDARIO, TIPO_EVENTO } from '../../../src/data/eventos.js';

/** Topes de gasto. Un cliente hostil manda listas enormes para quemar CPU. */
export const LIMITES = Object.freeze({
  acciones: 4000,       // una partida normal no pasa de unos cientos
  pasosPorFase: 200,    // el mismo tope que usa el simulador
});

export class AsaltoInvalido extends Error {
  constructor(motivo, detalle = null) {
    super(motivo);
    this.name = 'AsaltoInvalido';
    this.detalle = detalle;
  }
}

/**
 * Un mazo legal: 50 cartas exactas y ninguna por encima de su rareza.
 *
 * NO comprueba que sean tuyas. La propiedad vive hoy en el localStorage del
 * jugador y el servidor no la conoce, así que esto para a quien se invente
 * cartas o meta doce legendarias, pero no a quien juegue una que no ha ganado.
 * Cerrar ese hueco es mover la colección al servidor, y va aparte.
 */
export function validarMazoDeAsalto(mazo) {
  if (!Array.isArray(mazo) || mazo.length === 0) throw new AsaltoInvalido('mazo ausente');
  let total = 0;
  for (const entrada of mazo) {
    if (!Array.isArray(entrada) || entrada.length !== 2) throw new AsaltoInvalido('mazo mal formado');
    const [cardId, copias] = entrada;
    if (typeof cardId !== 'string' || !existeCarta(cardId)) {
      throw new AsaltoInvalido('carta desconocida', cardId);
    }
    if (!Number.isInteger(copias) || copias <= 0) throw new AsaltoInvalido('copias inválidas', cardId);
    const tope = BALANCE.copiasPorRareza[carta(cardId).rareza];
    if (copias > tope) throw new AsaltoInvalido('copias por encima de la rareza', cardId);
    total += copias;
  }
  if (total !== BALANCE.tamanoMazo) {
    throw new AsaltoInvalido('el mazo no suma las cartas exactas', total);
  }
  return true;
}

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
  const { jefeEvento, semilla: seed, mazo, acciones } = envio;

  if (!Number.isInteger(seed)) throw new AsaltoInvalido('semilla inválida');
  if (!Array.isArray(acciones)) throw new AsaltoInvalido('faltan las jugadas');
  if (acciones.length > LIMITES.acciones) throw new AsaltoInvalido('demasiadas jugadas', acciones.length);

  const { jefe } = jefeDelEvento(jefeEvento);
  validarMazoDeAsalto(mazo);

  // Mismo arranque que el navegador: si esto difiere en un solo detalle, la
  // partida diverge y el daño calculado no es el que vio el jugador.
  let s = crearPartida(seed, [mazo, jefe.mazo.map((e) => [...e])]);
  s.jugadores[1].habitat = habitatDeAsalto();

  // El jefe lo juega el SERVIDOR, con su propia IA y su propio RNG derivado de
  // la semilla. Es la mitad de la partida que el cliente no toca.
  let rngIA = semilla(seed ^ 0x5bf03635);

  const pendientes = acciones.slice();

  /**
   * La siguiente jugada del jugador. Si la lista se acaba, sólo vale seguir si
   * pasar es legal: en la fase de descarte descartar es OBLIGATORIO y el
   * servidor no puede elegir por ti sin decidir qué carta pierdes. Un envío que
   * se queda corto ahí está incompleto y se rechaza en vez de inventárselo.
   */
  const siguienteDelJugador = (estado) => {
    if (pendientes.length) return pendientes.shift();
    if (estado.fase === FASE.DESCARTE) throw new AsaltoInvalido('faltan jugadas: la partida no llega al final');
    return { tipo: ACCION.PASAR, jugador: 0 };
  };

  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const faseInicial = s.fase;
      let pasos = 0;
      // EL ORDEN IMPORTA, y no es una suposición: medido sobre 40 semillas,
      // alternar jugador-jefe en vez de respetar el turno entero cambia el
      // resultado en 2 de ellas. En el navegador tú haces TODAS tus jugadas y
      // luego pulsas Listo; sólo entonces juega el rival. Si el servidor
      // alternase, reproduciría otra partida y te cobraría un daño que no es el
      // que viste.
      while (s.fase === faseInicial) {
        let actuo = false;

        // Tu turno entero: de la lista que mandaste, hasta que pasas o se acaba.
        // Cada jugada pasa por validar(): no hay forma de colar una ilegal.
        let tuyas = 0;
        while (s.fase === faseInicial && legales(s, 0).length > 0) {
          const a = { ...siguienteDelJugador(s), jugador: 0 };
          const motivo = validar(s, a);
          if (motivo) throw new AsaltoInvalido('jugada ilegal', { accion: a.tipo, motivo });
          s = reduce(s, a);
          actuo = true;
          if (a.tipo === ACCION.PASAR || a.tipo === ACCION.DESCARTAR) break;
          if (++tuyas > LIMITES.pasosPorFase) throw new AsaltoInvalido('la fase no converge');
        }

        // Y ahora el jefe, su turno entero. Lo decide el SERVIDOR con su propia
        // IA: lo que el cliente diga de este bando ni se lee.
        let suyas = 0;
        while (s.fase === faseInicial && legales(s, 1).length > 0) {
          const d = decidir(vistaDe(s, 1), 1, rngIA, PERFIL.HEURISTICA);
          rngIA = d.rng;
          if (!d.accion) break;
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
          if (++suyas > LIMITES.pasosPorFase) throw new AsaltoInvalido('la fase no converge');
        }

        if (!actuo) break;
        if (++pasos > LIMITES.pasosPorFase) throw new AsaltoInvalido('la fase no converge');
      }
      if (s.fase === faseInicial) throw new AsaltoInvalido('la fase se quedó bloqueada');
      continue;
    }
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }

  const ganada = s.ganador === 0;
  const danoAlHabitat = habitatDeAsalto() - Math.max(0, s.jugadores[1].habitat);
  const trofeos = s.jugadores[0].trofeos;

  return {
    dano: danoDeAsalto({ danoAlHabitat, trofeos, ganada }),
    danoAlHabitat,
    trofeos,
    turnos: s.turno,
    ganada,
    motivoFin: s.motivoFin,
  };
}

/** Sólo para mensajes de error legibles. */
export const cartasDelSet = () => Object.keys(CARTAS).length;
