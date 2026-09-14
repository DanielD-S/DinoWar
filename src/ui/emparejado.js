// DinoWar — ¿esta respuesta del Duelo trae ya una partida?
//
// Va aparte del panel, sin DOM, para que se pueda probar en Node contra la
// respuesta tal y como la monta la Edge Function. Existe porque la primera
// versión miraba `r.estado === 'jugando'` y nunca se cumplía: la respuesta
// junta la fila del duelo con la vista de la partida, y las dos traen un
// `estado`. El de la fila es un texto —«esperando», «jugando»—; el de la
// vista es el tablero entero, y al juntarlas pisa al otro. Dos cuentas
// quedaron emparejadas en el servidor y las dos pantallas siguieron diciendo
// «Buscando rival…» para siempre.
//
// No vive en `src/data/duelo.js` a propósito: ése entra en el paquete de la
// Edge Function, y tocarlo obliga a re-anclar y redesplegar por un cambio que
// sólo es del navegador.

/**
 * Hay partida cuando la respuesta trae la vista: el número de paso y el
 * tablero como objeto. Una respuesta de espera sólo trae la fila, con `estado`
 * en texto y sin `n`.
 */
export function hayPartida(r) {
  return Boolean(r)
    && Number.isInteger(r.n)
    && r.estado !== null
    && typeof r.estado === 'object'
    && Array.isArray(r.estado.jugadores);
}
