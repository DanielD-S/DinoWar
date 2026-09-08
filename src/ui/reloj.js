// DinoWar — reloj de partida, al modo del ajedrez.
//
// Cada bando tiene un presupuesto de tiempo para toda la partida, no por turno:
// puedes gastarte cinco minutos en una decisión difícil si luego resuelves las
// fáciles al vuelo. Quien lo agota, pierde.
//
// Vive fuera del motor a propósito. El estado de una partida es una función de
// las acciones, y el tiempo no es una acción: meterlo dentro rompería que la
// misma semilla dé la misma partida, que es lo que sostiene el simulador y los
// tests. Aquí el reloj sólo mide y, cuando llega a cero, avisa; quien decide
// qué hacer con eso es main.js.

import { BALANCE } from '../data/balance.js';

const MS = 1000;

let restante = [0, 0];
let corriendo = null;     // bando cuyo reloj avanza, o null
let desde = 0;            // marca de tiempo del último arranque
let alAgotarse = null;
let alLatir = null;
let latido = null;

/** Tiempo que le queda a un bando, en milisegundos. */
export const restanteDe = (bando) => Math.max(0, restante[bando] - gastado(bando));

const gastado = (bando) => (corriendo === bando ? Date.now() - desde : 0);

/** «12:04», o «0:38» cuando apremia. */
export function comoTexto(ms) {
  const total = Math.ceil(ms / MS);
  const m = Math.floor(total / 60);
  return `${m}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Empieza una partida nueva.
 * @param {{alAgotarse: (bando: number) => void, alLatir: () => void}} avisos
 */
export function arrancar(avisos) {
  parar();
  restante = [BALANCE.relojPorJugador * MS, BALANCE.relojPorJugador * MS];
  alAgotarse = avisos.alAgotarse;
  alLatir = avisos.alLatir;
}

/** El reloj de este bando empieza a correr; el del otro se detiene. */
export function correr(bando) {
  if (corriendo === bando) return;
  detener();
  corriendo = bando;
  desde = Date.now();
  // Un segundo basta para el reloj de pared, pero el aviso de que se acabó
  // tiene que llegar en cuanto pase: se comprueba en cada latido.
  latido = setInterval(() => {
    if (restanteDe(corriendo) <= 0) {
      // El aviso se guarda ANTES de parar: parar() lo pone a null, y llamarlo
      // después dejaba el reloj a cero sin que nadie se enterase.
      const quien = corriendo;
      const avisar = alAgotarse;
      parar();
      restante[quien] = 0;
      avisar?.(quien);
      return;
    }
    alLatir?.();
  }, 250);
  alLatir?.();
}

/** Congela el reloj que corra, guardando lo consumido. */
export function detener() {
  if (corriendo === null) return;
  restante[corriendo] = restanteDe(corriendo);
  corriendo = null;
  clearInterval(latido);
  latido = null;
}

/** Se acabó la partida: ni corre ni avisa. */
export function parar() {
  detener();
  alAgotarse = null;
  alLatir = null;
}

/** ¿Está el reloj en marcha para alguien? */
export const enMarcha = () => corriendo !== null;

/**
 * Dejar el móvil en el bolsillo no es pensarse la jugada. El reloj se congela
 * al irse de la pestaña y vuelve donde estaba: en un juego que se abre y se
 * cierra veinte veces al día, perder por reloj sin haber mirado la pantalla
 * sería un castigo por nada.
 */
let suspendido = null;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (corriendo === null) return;
    suspendido = corriendo;
    detener();
  } else if (suspendido !== null) {
    const quien = suspendido;
    suspendido = null;
    if (alAgotarse) correr(quien);
  }
});
