// DinoWar — las reglas del Duelo que no son del motor.
//
// El motor no sabe que existen dos personas: sabe de dos bandos y de acciones.
// Lo que va aquí es lo que hace falta alrededor para que esos dos bandos sean
// dos cuentas en dos sitios distintos: el reloj, el plazo por turno, cuánto
// se paga, cada cuánto pregunta el cliente. Datos, no código, y compartidos
// por el cliente y por la Edge Function.

export const DUELO = Object.freeze({
  // El reloj de la partida en solitario, en milisegundos. Es el mismo número
  // que `BALANCE.relojPorJugador`; vive aquí en ms porque el servidor cuenta
  // en ms y porque el Duelo tiene que poder cambiarlo sin tocar el balance.
  relojMs: 15 * 60 * 1000,
  // Tope por decisión. Sin esto, quien se va a comer se lleva los quince
  // minutos del otro en espera; con esto, a los tres minutos sin contestar la
  // partida se da por perdida.
  turnoMaxMs: 3 * 60 * 1000,
  // Cada cuánto pregunta el cliente si el rival ya jugó.
  sondeoMs: 2500,
  // Cuánto se queda uno en la cola antes de rendirse a que no hay nadie.
  esperaMaxMs: 3 * 60 * 1000,
  // Pasos de fases automáticas que el servidor guarda para que el cliente los
  // anime: un turno son unos cinco, y un cliente que recarga no necesita más
  // de dos turnos atrás.
  pasosGuardados: 12,
});

/** Motivos de fin que el motor no conoce: los pone el servidor del Duelo. */
export const FIN_DUELO = Object.freeze({
  TIEMPO: 'TIEMPO',
  ABANDONO: 'ABANDONO',
});
