// DinoWar — tutorial de tres turnos.
//
// No es una partida guionizada: es una partida normal con un cartel que va
// explicando lo que acaba de pasar. Un guion cerrado obligaría a jugar como
// dice el guion, y lo que hay que enseñar —que el despliegue es simultáneo y
// oculto— sólo se entiende jugándolo de verdad.
//
// Los pasos no avanzan solos por tiempo: los dispara main.js cuando ocurre lo
// que cada paso explica. Si el jugador hace otra cosa, el paso espera.

import { BALANCE } from '../data/balance.js';

const CLAVE = 'dinowar.tutorial.v1';

/**
 * Cada paso se muestra cuando llega su evento. `una` marca los que sólo tienen
 * sentido la primera vez que ocurre lo que cuentan.
 */
const PASOS = [
  {
    evento: 'inicio',
    texto: 'El círculo dorado de cada carta es lo que cuesta, y hoy tienes <b>1 de Biomasa</b>. '
      + '<b>Arrastra un dinosaurio a una de tus ranuras</b>, las de abajo. Si no te llega para ninguna, '
      + 'pulsa Listo: en el turno 2 tendrás 2.',
  },
  {
    evento: 'desplegada',
    texto: 'Queda <b>boca abajo</b>: el rival no ve qué es ni dónde. Tú sí ves lo tuyo, con el borde discontinuo. '
      + 'Si te has equivocado de ranura, <b>«tú: 1 comprometida»</b> en la franja del centro te la devuelve. '
      + 'Cuando termines, pulsa <b>Listo</b>.',
  },
  {
    evento: 'revelado',
    texto: 'Se revela <b>todo a la vez</b>: por eso el juego va de adivinar, no de reaccionar. '
      + `Las ${BALANCE.ranuras} ranuras se enfrentan una a una, la 1 contra la 1.`,
  },
  {
    evento: 'combate',
    texto: 'Enfrente vacío: el Ataque entero va al <b>hábitat</b> rival. Enfrente ocupado: se golpean <b>a la vez</b>, '
      + '<b>Ataque − Defensa</b>, y las heridas <b>se acumulan</b> hasta llegar a la Vida. '
      + 'Un muro con mucha Defensa no gana: <b>tapa</b>.',
  },
  {
    evento: 'turno',
    turno: 2,
    texto: 'Turno 2: cobras <b>2 de Biomasa</b>. No es una hucha — cada turno vale el número de turno, '
      + `hasta ${BALANCE.rentaTope}, hayas gastado o no. Lo que no gastes <b>se pierde</b>.`,
  },
  {
    evento: 'turno',
    turno: BALANCE.turnoPrimeraEstacion,
    texto: `Desde el turno ${BALANCE.turnoPrimeraEstacion} entra una <b>estación</b> que no controla nadie. `
      + `Ya sabes jugar: gana quien reúna <b>${BALANCE.trofeosParaGanar} trofeos</b>, tumbe el <b>hábitat</b> `
      + 'rival o deje al otro <b>sin mazo</b>. Suerte.',
    ultimo: true,
  },
];

let dom = null;
let activo = false;
let indice = 0;
let esperandoConfirmacion = false;
// Lo que ha pasado mientras el jugador leía el cartel anterior. Sin esto, un
// paso que llega tarde se pierde para siempre: el turno 2 sólo ocurre una vez.
let enEspera = null;

export function montarTutorial() {
  const id = (x) => document.getElementById(x);
  dom = {
    panel: id('tutorial'), texto: id('tutorial-texto'),
    siguiente: id('tutorial-siguiente'), saltar: id('tutorial-saltar'),
  };
  dom.siguiente.addEventListener('click', ocultar);
  dom.saltar.addEventListener('click', terminarTutorial);
}

/** ¿Ya lo ha visto? Se guarda para no repetirlo en cada partida. */
export function tutorialHecho() {
  try { return localStorage.getItem(CLAVE) === 'hecho'; } catch { return true; }
}

export function empezarTutorial() {
  activo = true;
  indice = 0;
  esperandoConfirmacion = false;
  enEspera = null;
}

export function terminarTutorial() {
  activo = false;
  esperandoConfirmacion = false;
  enEspera = null;
  if (dom) dom.panel.classList.add('oculta');
  try { localStorage.setItem(CLAVE, 'hecho'); } catch { /* sin persistencia */ }
}

export const tutorialActivo = () => activo;

/** ¿El tablero está esperando a que el jugador lea un cartel? */
export const tutorialEspera = () => activo && esperandoConfirmacion;

/**
 * Le cuenta al tutorial que ha pasado algo. Si el paso que toca es ese, lo
 * enseña; si no, no pasa nada y el paso sigue esperando su momento.
 * @param {string} evento
 * @param {{turno?: number}} [datos]
 */
export function pasoTutorial(evento, datos = {}) {
  if (!activo) return;
  if (esperandoConfirmacion) { enEspera = { evento, datos }; return; }
  const paso = PASOS[indice];
  if (!paso || paso.evento !== evento) return;
  // El turno es un mínimo, no una igualdad: si el paso del turno 2 se perdió
  // porque el jugador seguía leyendo, se enseña en el 3 en vez de nunca.
  if (paso.turno !== undefined && datos.turno < paso.turno) return;

  dom.texto.innerHTML = paso.texto;
  dom.siguiente.textContent = paso.ultimo ? 'Entendido' : 'Siguiente';
  dom.saltar.hidden = !!paso.ultimo;
  dom.panel.classList.remove('oculta');
  esperandoConfirmacion = true;
  indice += 1;
}

function ocultar() {
  esperandoConfirmacion = false;
  dom.panel.classList.add('oculta');
  if (indice >= PASOS.length) { terminarTutorial(); return; }
  const pendiente = enEspera;
  enEspera = null;
  if (pendiente) pasoTutorial(pendiente.evento, pendiente.datos);
}
