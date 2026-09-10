// DinoWar — el GUIÓN: qué se ve cuando pasa cada cosa.
//
// El motor emite treinta y un tipos de evento. Hasta ahora se animaban CUATRO
// —choque, avance, golpe al hábitat y muerte— porque el animador era una
// sucesión de `if` escrita a mano contra esos cuatro. Todo lo demás cambiaba el
// tablero de golpe y salía como un renglón de texto abajo.
//
// Eso se notaba justo donde más duele. Las once habilidades al entrar en juego,
// la Tijera que se lleva un dinosaurio del campo, el rebaño que completa su
// trío, las dos cartas que descartan de tu mano: el jugador las LEÍA. Cada carta
// nueva que se diseñaba nacía invisible, y arreglarlo pedía volver a tocar el
// animador.
//
// Aquí cada evento declara su compás: cuánto ocupa, a qué suena y qué toca en el
// DOM. Añadir una carta ya no pide tocar el animador; pide, como mucho, una
// entrada en esta tabla. Y una entrada que falte no rompe nada: el evento pasa
// sin compás, como pasaba antes.
//
// Las funciones reciben `api` en vez de importar nada del DOM —los mismos
// ayudantes que ya usaba `animarCombate`— por el mismo motivo por el que
// `alEntrar()` recibe sus ayudas en el motor: este fichero describe QUÉ se ve, y
// `animate.js` sabe CÓMO tocarlo. Sin esa costura, el guión acabaría siendo otro
// animador.

import { carta } from '../data/cards.js';

/**
 * @typedef {object} Compas
 * @property {number} dura      milisegundos que ocupa antes del siguiente
 * @property {string} [sonido]  qué suena al empezar
 * @property {(e: object, api: object) => void} [hacer]
 */

/** Cuánto dura un compás corriente. Un turno entero no puede irse en esto. */
const BREVE = 260;
const MEDIO = 380;
const LARGO = 520;

/** El bando de un evento, mirado por sus campos, que no se llaman igual. */
const bandoDe = (e) => e.dueno ?? e.jugador ?? e.bando ?? null;

/**
 * Lo que se ve al dispararse una habilidad de entrada. Cada efecto trae su
 * frase y su gesto; el que no esté aquí sale con el nombre del rasgo, que
 * siempre es mejor que nada.
 */
const ENTRADAS = {
  roba: (e, api) => api.enMazo(e.dueno, `+${e.n}`),
  muele: (e, api) => api.enMazo(api.contrario(e.dueno), `−${e.n}`, 'malo'),
  muelePropio: (e, api) => api.enMazo(e.dueno, `−${e.n}`, 'malo'),
  manoRival: (e, api) => api.enMano(api.contrario(e.dueno), `−${e.n}`, 'malo'),
  curaHabitat: (e, api) => api.enHabitat(e.dueno, `+${e.n}`, 'cura'),
  emboscada: (e, api) => {
    if (e.n > 0) api.embiste(e.iid);
  },
  fulmina: (e, api) => {
    if (e.objetivo) api.fulmina(e.objetivo);
  },
};

/**
 * El compás de cada tipo de evento. Lo que no está aquí no se anima y no pasa
 * nada: el tablero se pinta igual y la línea del registro se escribe igual.
 *
 * El COMBATE no está: lo lleva `animarCombate`, que recorre el tablero ranura a
 * ranura y necesita su propio ritmo. Meterlo aquí habría convertido esta tabla
 * en un caso especial con forma de tabla.
 */
export const GUION = Object.freeze({
  // ------------------------------------------------ habilidades al entrar
  ENTRADA: {
    dura: (e) => (e.efecto === 'fulmina' || e.efecto === 'emboscada' ? MEDIO : BREVE),
    sonido: (e) => (e.efecto === 'fulmina' ? 'muerte' : 'entrada'),
    hacer: (e, api) => {
      const nodo = api.carta(e.iid);
      if (nodo) {
        api.marcar(nodo, 'dispara', 520);
        api.rotulo(nodo, carta(e.cardId).rasgoNombre);
      }
      ENTRADAS[e.efecto]?.(e, api);
    },
  },

  // Un umbral que ya no se pierde merece verse una vez y no volver a salir.
  UMBRAL: {
    dura: LARGO,
    sonido: 'trofeo',
    hacer: (e, api) => {
      const nodo = api.carta(e.iid);
      if (!nodo) return;
      api.marcar(nodo, 'crece', 700);
      api.flota(nodo, `+${e.ataque}`, 'bueno');
      api.rotulo(nodo, carta(e.cardId).rasgoNombre);
    },
  },

  // ------------------------------------------------------ eventos y clima
  ADAPTACION: {
    dura: MEDIO,
    sonido: 'adaptar',
    hacer: (e, api) => {
      const nodo = api.carta(e.objetivo);
      if (!nodo) return;
      api.marcar(nodo, 'crece', 700);
      api.rotulo(nodo, carta(e.cardId).rasgoNombre, 'bueno');
    },
  },

  PRESION: {
    dura: MEDIO,
    sonido: 'presion',
    hacer: (e, api) => {
      const objetivos = e.objetivos ?? (e.objetivo ? [e.objetivo] : []);
      for (const iid of objetivos) {
        const nodo = api.carta(iid);
        if (nodo) api.marcar(nodo, 'merma', 700);
      }
      // Mortandad y Trampa no señalan a nadie: se anuncian sobre el tablero.
      if (objetivos.length === 0) api.anuncio(carta(e.cardId).rasgoNombre, 'malo');
    },
  },

  CAMPO: {
    dura: LARGO,
    sonido: 'clima',
    hacer: (e, api) => api.anuncio(carta(e.cardId).binomial, 'clima'),
  },

  // ------------------------------------------------- mazo, mano y hábitat
  MAZO_PERDIDO: {
    dura: BREVE,
    sonido: 'mazo',
    hacer: (e, api) => api.enMazo(e.jugador, `−${e.cartas}`, 'malo'),
  },

  COSTE_EXTRA: {
    dura: BREVE,
    sonido: 'descarte',
    hacer: (e, api) => api.enMano(e.jugador, `−${e.cartas}`, 'malo'),
  },

  BUSQUEDA: {
    dura: BREVE,
    sonido: 'buscar',
    hacer: (e, api) => api.enMazo(e.jugador, '→', 'bueno'),
  },

  RECICLA: {
    dura: BREVE,
    sonido: 'reciclar',
    hacer: (e, api) => api.enMazo(e.jugador, '↻'),
  },

  RECURSO: {
    dura: BREVE,
    sonido: 'biomasa',
    hacer: (e, api) => api.anuncio(carta(e.cardId).binomial, 'bueno'),
  },

  // La curación llega en bloque al final del turno: se marca a todos a la vez.
  CURACION: {
    dura: BREVE,
    sonido: 'curar',
    hacer: (e, api) => {
      const nodo = api.carta(e.iid);
      if (nodo) { api.marcar(nodo, 'cura', 600); api.flota(nodo, `+${e.cura}`, 'bueno'); }
    },
  },

  OPORTUNISTA: {
    dura: BREVE,
    hacer: (e, api) => {
      const nodo = api.carta(e.iid);
      if (nodo) api.flota(nodo, `+${e.vida}`, 'bueno');
    },
  },

  SIN_CARTAS: {
    dura: LARGO,
    sonido: 'muerte',
    hacer: (e, api) => api.anuncio('Se acabó el mazo', 'malo'),
  },
});

/** El compás de un evento, con sus campos ya resueltos, o null si no tiene. */
export function compasDe(evento) {
  const c = GUION[evento.tipo];
  if (!c) return null;
  const valor = (x) => (typeof x === 'function' ? x(evento) : x);
  return { dura: valor(c.dura) ?? BREVE, sonido: valor(c.sonido) ?? null, hacer: c.hacer ?? null };
}

/** ¿Este evento tiene algo que enseñar? Lo usa el animador para no esperar en balde. */
export const seVe = (evento) => GUION[evento.tipo] !== undefined;

export { bandoDe };
