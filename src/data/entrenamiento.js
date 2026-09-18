// DinoWar — el ENTRENAMIENTO: la partida de emergencia del Duelo.
//
// Quien busca rival y no encuentra a nadie se quedaba tres minutos mirando un
// reloj y un «prueba más tarde». Con nueve cuentas ése es el caso normal, no
// el raro. Ahora, pasado `ofrecerMs` en la cola, el panel ofrece entrenar
// contra la IA mientras tanto: una partida en solitario de las de siempre,
// que paga las monedas de una victoria y no toca el ELO —ni al ganar, ni al
// perder, ni al retirarse—, porque pasa por el tipo `victoria` de la Edge
// Function y el ELO sólo lo mueve `duelo_cerrar`.
//
// Tres decisiones:
//
// - El rival es uno de los DUROS de las expediciones, sorteado: los dos
//   últimos nodos de cada mapa. Siempre el mismo sería monótono, y uno flojo
//   no sería un sustituto del duelo. Son ids de `expediciones.js`, así que el
//   servidor los re-juega con el mazo que él busca y no hay nada nuevo que
//   empaquetar ni anclar.
// - No se sigue en cola mientras se entrena: si apareciera una persona la
//   emparejaría con alguien a mitad de otra partida. Pulsar el botón cancela
//   la búsqueda.
// - Paga lo mismo que cualquier victoria en solitario. Pagar más «porque era
//   un duelo» abriría la puerta de siempre: buscar, no encontrar, cobrar el
//   extra contra la IA. Lo que cambia es el rival, no el premio.
//
// Este fichero NO entra en el paquete de la Edge Function: importa de
// `expediciones.js`, que sí va, pero nadie del servidor importa de aquí.

import { EXPEDICIONES } from './expediciones.js';

export const ENTRENAMIENTO = Object.freeze({
  // Cuánto se espera en la cola antes de ofrecer entrenar. Menos que los
  // tres minutos de rendirse: el botón tiene que llegar antes que el aviso.
  ofrecerMs: 30 * 1000,
  // Cuántos rivales del final de cada mapa entran en el sorteo.
  porMapa: 2,
});

/** Los ids de los rivales entre los que se sortea el entrenamiento. */
export const rivalesDeEntrenamiento = () =>
  EXPEDICIONES.flatMap((e) => e.rivales.slice(-ENTRENAMIENTO.porMapa).map((r) => r.id));

/**
 * Un rival sorteado, distinto de `salvo` si se puede: el de la partida
 * anterior, para que «Otra partida» no repita.
 */
export function rivalDeEntrenamiento(salvo = null, azar = Math.random) {
  const todos = rivalesDeEntrenamiento();
  const ids = todos.filter((id) => id !== salvo);
  const lista = ids.length ? ids : todos;
  return lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];
}
