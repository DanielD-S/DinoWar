// DinoWar — lo que paga REJUGAR un nodo de expedición que ya venciste.
//
// Hasta hoy: la primera victoria pagaba el premio del nodo —de 30 a 450 según
// el rival— y volver a ganarle pagaba las 50 de cualquier partida. O sea que
// el rival más duro del juego pagaba lo mismo que el primero de la Morrison,
// y ganarle costaba el triple de partidas. Los cuatro mapas se recorrían una
// vez y se acababan: 32 nodos de contenido de un solo uso, y las misiones
// diarias mandaban al jugador al nodo MÁS FÁCIL, que era el que menos costaba.
//
// Ahora rejugar paga **el premio del nodo partido por cinco**, y nunca menos
// que una victoria normal. Tres decisiones que no se deducen de los números:
//
// - **El divisor se elige para que la MEDIA no suba.** El premio medio de los
//   37 rivales es 166, así que con las victorias a 30 el divisor que deja la
//   media en una victoria es cinco: sale 39, o sea 1,3 victorias. Lo que
//   cambia no es cuánto se gana en total, es que el nodo ELEGIDO importa —de
//   30 en los flojos a 90 en el último de Kem Kem—. Empezó siendo un tercio
//   con las victorias a 50, y bajó a un quinto el 18-09-2026 cuando bajaron
//   las victorias: es el mismo criterio con otros números.
// - **Nunca menos de una victoria normal**, que es lo que evita que esto sea
//   un recorte encubierto: los nodos baratos siguen pagando sus 50. El SQL
//   paga la DIFERENCIA, y por eso `aplicar_expedicion` conserva su firma y no
//   hay que re-empaquetar ni desplegar nada.
// - **Tope por nodo y día**, no global: sin él, rejugar el mejor nodo
//   cincuenta veces daría 7.500 monedas al día contra las 2.500 de ahora. Con
//   él hay que rotar, que es exactamente lo que hace que el mapa se vuelva a
//   jugar. El tope de victorias pagadas del día sigue mandando por encima.
//
// Vive FUERA de `expediciones.js` a propósito: ese fichero va dentro del
// paquete de la Edge Function y tocarlo cuesta re-empaquetar, re-anclar y
// desplegar. Aquí sólo lo lee la pantalla; quien paga es el SQL de la 0035, y
// `test/rejugar.test.js` compara los dos números con los de la migración.

import { ECONOMIA } from './coleccion.js';

export const REJUGAR = Object.freeze({
  // Rejugar paga el premio del nodo partido por esto.
  divisor: 5,
  // Victorias pagadas por nodo y día.
  porDia: 3,
});

/** Lo que paga ganarle otra vez a un nodo ya vencido, en total. */
export const pagoDeRejugar = (premio, victoria = ECONOMIA.monedasVictoria) =>
  Math.max(victoria, Math.round(Math.max(0, premio) / REJUGAR.divisor));

/** Lo que pone la expedición por encima de la victoria normal. Es lo que paga el SQL. */
export const extraDeRejugar = (premio, victoria = ECONOMIA.monedasVictoria) =>
  pagoDeRejugar(premio, victoria) - victoria;
