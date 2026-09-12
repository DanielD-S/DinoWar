// DinoWar — re-jugar una partida en el servidor.
//
// EL CLIENTE NO DICE CÓMO ACABÓ LA PARTIDA. Manda la semilla, su mazo y SUS
// PROPIAS jugadas; el servidor la re-juega entera con el mismo motor y saca el
// resultado por su cuenta. Lo que el navegador afirme no se lee en ningún sitio.
//
// Esto vivía dentro de validarAsalto.js, atado a los jefes. Salió aquí cuando
// hubo que validar también las partidas en solitario: son la misma máquina con
// otro rival enfrente, y tener dos copias del bucle era garantizar que un día
// se calculasen dos partidas distintas con las mismas jugadas.
//
// Es puro y sin dependencias de plataforma: corre igual en Node (los tests) y
// en Deno (la Edge Function).

import { crearPartida, vistaDe, FASE } from '../../../src/engine/state.js';
import { reduce, ACCION, legales, validar } from '../../../src/engine/actions.js';
import { decidir, PERFIL } from '../../../src/engine/ai.js';
import { semilla } from '../../../src/engine/rng.js';
import { BALANCE } from '../../../src/data/balance.js';
import { existeCarta, carta } from '../../../src/data/cards.js';
import { parteVacio, anotarEventos, nuevosEventos, cerrarParte } from '../../../src/data/misiones.js';

/** Topes de gasto. Un cliente hostil manda listas enormes para quemar CPU. */
export const LIMITES = Object.freeze({
  acciones: 4000,       // una partida normal no pasa de unos cientos
  pasosPorFase: 200,    // el mismo tope que usa el simulador
});

export class PartidaInvalida extends Error {
  constructor(motivo, detalle = null) {
    super(motivo);
    this.name = 'PartidaInvalida';
    this.detalle = detalle;
  }
}

/**
 * Un mazo LEGAL: las cartas exactas y ninguna por encima de su rareza.
 *
 * No comprueba que sean tuyas y no puede: la propiedad es una consulta a la
 * base de datos y esto es una función pura. De eso se encarga
 * `private.validar_mazo()` en el servidor, contra tu colección real.
 */
export function validarMazoLegal(mazo) {
  if (!Array.isArray(mazo) || mazo.length === 0) throw new PartidaInvalida('mazo ausente');
  let total = 0;
  for (const entrada of mazo) {
    if (!Array.isArray(entrada) || entrada.length !== 2) throw new PartidaInvalida('mazo mal formado');
    const [cardId, copias] = entrada;
    if (typeof cardId !== 'string' || !existeCarta(cardId)) {
      throw new PartidaInvalida('carta desconocida', cardId);
    }
    if (!Number.isInteger(copias) || copias <= 0) throw new PartidaInvalida('copias inválidas', cardId);
    const tope = BALANCE.copiasPorRareza[carta(cardId).rareza];
    if (copias > tope) throw new PartidaInvalida('copias por encima de la rareza', cardId);
    total += copias;
  }
  if (total !== BALANCE.tamanoMazo) {
    throw new PartidaInvalida('el mazo no suma las cartas exactas', total);
  }
  return true;
}

/**
 * El perfil de IA con el que juega el rival. Llega del cliente porque la
 * dificultad la elige el jugador y es una opción legítima del menú: jugar en
 * fácil no es hacer trampa. Lo que no se acepta es un valor que no esté en la
 * lista, que sería una IA inventada.
 */
export function perfilValido(nombre, porDefecto = PERFIL.HEURISTICA) {
  if (nombre === undefined || nombre === null) return porDefecto;
  const conocidos = Object.values(PERFIL);
  if (!conocidos.includes(nombre)) throw new PartidaInvalida('perfil de IA desconocido', nombre);
  return nombre;
}

/**
 * Re-juega la partida y devuelve cómo acabó.
 *
 * @param {object} envio            lo que mandó el cliente
 * @param {number} envio.semilla
 * @param {Array<[string,number]>} envio.mazo
 * @param {object[]} envio.acciones  SÓLO las del jugador, en orden
 * @param {object} opciones
 * @param {Array<[string,number]>|null} [opciones.mazoRival]  null = el de referencia
 * @param {number|null} [opciones.habitatRival]  null = el de siempre
 * @param {string} [opciones.perfil]  con qué IA juega el rival
 * @returns {{turnos:number, ganada:boolean, trofeos:number,
 *            danoAlHabitat:number, motivoFin:string, parte:object}}
 */
export function validarPartida(envio, opciones = {}) {
  if (!envio || typeof envio !== 'object') throw new PartidaInvalida('envío vacío');
  const { semilla: seed, mazo, acciones } = envio;
  const { mazoRival = null, habitatRival = null, perfil = PERFIL.HEURISTICA } = opciones;

  if (!Number.isInteger(seed)) throw new PartidaInvalida('semilla inválida');
  if (!Array.isArray(acciones)) throw new PartidaInvalida('faltan las jugadas');
  if (acciones.length > LIMITES.acciones) {
    throw new PartidaInvalida('demasiadas jugadas', acciones.length);
  }
  validarMazoLegal(mazo);

  // Mismo arranque que el navegador: si esto difiere en un solo detalle, la
  // partida diverge y el resultado no es el que vio el jugador.
  let s = crearPartida(seed, [mazo, mazoRival]);
  const habitatInicial = habitatRival ?? s.jugadores[1].habitat;
  s.jugadores[1].habitat = habitatInicial;

  // Al rival lo juega el SERVIDOR, con su propia IA y su propio RNG derivado de
  // la semilla. Es la mitad de la partida que el cliente no toca: si se
  // aceptaran sus jugadas, la trampa sería mandar un rival que pasa siempre.
  let rngIA = semilla(seed ^ 0x5bf03635);

  const pendientes = acciones.slice();

  // El PARTE de la partida: lo que deja escrito para las misiones diarias. Se
  // saca de los eventos que el motor ya emitía, así que el motor no se entera
  // de que las misiones existen. Y se saca AQUÍ, re-jugando, por lo mismo que
  // el premio: el progreso compra monedas y las monedas compran sobres, así que
  // un progreso que dijera el navegador sería una carta regalada.
  const parte = parteVacio();
  /** Un reduce, anotando en el parte lo que emita. */
  const aplicar = (estado, accion) => {
    const desde = estado.eventos.length;
    const siguiente = reduce(estado, accion);
    anotarEventos(parte, nuevosEventos(siguiente, desde));
    return siguiente;
  };

  /**
   * La siguiente jugada del jugador. Si la lista se acaba, sólo vale seguir si
   * pasar es legal: en la fase de descarte descartar es OBLIGATORIO y el
   * servidor no puede elegir por ti sin decidir qué carta pierdes. Un envío que
   * se queda corto ahí está incompleto y se rechaza en vez de inventárselo.
   */
  const siguienteDelJugador = (estado) => {
    if (pendientes.length) return pendientes.shift();
    if (estado.fase === FASE.DESCARTE) {
      throw new PartidaInvalida('faltan jugadas: la partida no llega al final');
    }
    return { tipo: ACCION.PASAR, jugador: 0 };
  };

  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const faseInicial = s.fase;
      let pasos = 0;
      // EL ORDEN IMPORTA, y no es una suposición: medido sobre 40 semillas,
      // alternar jugador-rival en vez de respetar el turno entero cambia el
      // resultado en 2 de ellas. En el navegador tú haces TODAS tus jugadas y
      // luego pulsas Listo; sólo entonces juega el rival. Si el servidor
      // alternase, reproduciría otra partida y te cobraría otro resultado.
      while (s.fase === faseInicial) {
        let actuo = false;

        // Tu turno entero: de la lista que mandaste, hasta que pasas o se acaba.
        // Cada jugada pasa por validar(): no hay forma de colar una ilegal.
        let tuyas = 0;
        while (s.fase === faseInicial && legales(s, 0).length > 0) {
          const a = { ...siguienteDelJugador(s), jugador: 0 };
          const motivo = validar(s, a);
          if (motivo) throw new PartidaInvalida('jugada ilegal', { accion: a.tipo, motivo });
          s = aplicar(s, a);
          actuo = true;
          if (a.tipo === ACCION.PASAR || a.tipo === ACCION.DESCARTAR) break;
          if (++tuyas > LIMITES.pasosPorFase) throw new PartidaInvalida('la fase no converge');
        }

        // Y ahora el rival, su turno entero, decidido por el servidor.
        let suyas = 0;
        while (s.fase === faseInicial && legales(s, 1).length > 0) {
          const d = decidir(vistaDe(s, 1), 1, rngIA, perfil);
          rngIA = d.rng;
          if (!d.accion) break;
          s = aplicar(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
          if (++suyas > LIMITES.pasosPorFase) throw new PartidaInvalida('la fase no converge');
        }

        if (!actuo) break;
        if (++pasos > LIMITES.pasosPorFase) throw new PartidaInvalida('la fase no converge');
      }
      if (s.fase === faseInicial) throw new PartidaInvalida('la fase se quedó bloqueada');
      continue;
    }
    s = aplicar(s, { tipo: ACCION.AVANZAR });
  }

  cerrarParte(parte, {
    ganada: s.ganador === 0, turnos: s.turno, trofeos: s.jugadores[0].trofeos,
  });

  return {
    parte,
    ganada: s.ganador === 0,
    danoAlHabitat: habitatInicial - Math.max(0, s.jugadores[1].habitat),
    trofeos: s.jugadores[0].trofeos,
    turnos: s.turno,
    motivoFin: s.motivoFin,
  };
}
