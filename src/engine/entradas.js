// DinoWar — habilidades AL ENTRAR EN JUEGO.
//
// Un efecto que se dispara una vez, cuando la criatura llega al campo, y se
// acabó. Nada de estado que llevar en la cabeza.
//
// Por qué esta forma y no un rasgo pasivo. Los pasivos —«+1 de Vida si tienes
// otro Stegosaurus»— tienen dos problemas, y los dos están medidos:
//
//   1. No se leen. Es la misma clase de regla invisible que la Defensa, que se
//      quitó justo por eso: había que hacer aritmética contra un número de la
//      OTRA carta.
//   2. Falsean la medición. La IA valora una unidad multiplicando por los
//      turnos que espera que aguante (`IA.horizonte`), así que todo lo pasivo se
//      infla. De ahí salió el «la Defensa vale 4 veces el Ataque», que era un
//      artefacto. Un disparo al entrar es valor inmediato y discreto: se tasa
//      directo, sin multiplicador.
//
// El set tiene las dos familias porque el autor las quiso: hay auras y
// contadores, que viven en `state.js`, y hay once cartas que disparan al llegar,
// que son éstas.
//
// Se disparan en la FASE DE REVELACIÓN, que ya es simultánea y con un orden
// determinista (por tipo y luego por iid). Eso importa más de lo que parece: el
// servidor re-juega cada partida para validarla, y sin un orden fijo dos
// máquinas llegarían a resultados distintos con las mismas jugadas. Por lo mismo
// ninguna de éstas pregunta nada: el objetivo de Tijera sale de una regla fija
// —el de más Ataque entre los que caben— y no de una elección del jugador, que
// en una fase simultánea habría que resolver a ciegas.

import { BALANCE } from '../data/balance.js';
import { carta } from '../data/cards.js';
import { mecanicaDe } from './state.js';
import { entero, barajar } from './rng.js';

/** ¿Están encendidas? Se apagan por entorno para poder medir con y sin. */
export const HAY_ENTRADAS = !(typeof process !== 'undefined' && process.env
  && process.env.DINOWAR_ENTRADAS === '0');

/**
 * Los efectos que puede llevar una `entrada`. La lista es la llave de todo lo
 * demás: `valorDeEntrada` recorre esto para tasar y `alEntrar` para aplicar, así
 * que un efecto nuevo sin su peso en `BALANCE.valorEntrada` lo caza un test en
 * vez de morir en silencio dentro de la IA.
 */
export const EFECTOS = Object.freeze([
  'roba', 'muelePropio', 'mueleRival', 'manoRival', 'curaHabitat', 'emboscada', 'fulmina',
  // Los cuatro del control de mano. Los tres primeros mueven manos enteras y
  // el cuarto va al descarte a por lo que ya se perdió, que es lo que hace que
  // molerte a ti mismo deje de ser sólo un coste.
  'manoNueva', 'manosNuevas', 'topeManoRival', 'rescata',
  // Los tres de la ronda del rebote. `devuelve` es el único que lleva objeto
  // en vez de número: son dos cantidades y un filtro, y partirlo en tres claves
  // planas —`devuelvePropio`, `devuelveRival`, `devuelveRivalMax`— habría
  // metido un FILTRO en una lista que se tasa multiplicando por su cifra.
  'devuelve', 'golpeHabitat', 'entierra',
]);

export const entradaDe = (cardId) => mecanicaDe(cardId)?.entrada ?? null;

export const esEntrada = (cardId) => entradaDe(cardId) !== null;

/**
 * Cuánto vale, a ojo, dispararla. NO decide nada del juego: sólo sirve para que
 * la IA no ignore estas cartas, que es lo que le pasó a la Llanura hasta que se
 * le puso número —cero usos en 300 partidas—.
 *
 * Es una estimación deliberadamente burda: cada punto de efecto por su peso.
 * Afinarla es tarea del recoste, no de aquí.
 */
export function valorDeEntrada(cardId) {
  if (!HAY_ENTRADAS) return 0;
  const e = entradaDe(cardId);
  if (!e) return 0;
  const V = BALANCE.valorEntrada;
  let valor = 0;
  for (const efecto of EFECTOS) {
    // `topeManoRival` va al revés que todos los demás: su número es lo que le
    // DEJA al rival, así que cuanto más bajo, más fuerte. Tasarlo por su cifra
    // haría que un tope de 6 —que no quita nada— valiera más que uno de 2. Se
    // cuenta lo que se lleva por delante desde una mano típica, y por eso un
    // tope de 0 es un número legítimo y no «sin efecto».
    if (efecto === 'topeManoRival') {
      const tope = e.topeManoRival;
      if (tope === undefined) continue;
      valor += Math.max(0, BALANCE.manoInicial - tope) * V.topeManoRival;
      continue;
    }
    // `devuelve` lleva objeto: dos cantidades que valen distinto —quitarle uno
    // del campo al rival no es lo mismo que recoger el tuyo— y un `ataqueMax`
    // que es un FILTRO, no una cantidad. Multiplicarlo por su peso haría que
    // una carta que sólo alcanza a los pequeños valiera más cuanto más alto
    // fuera el listón que no usa.
    if (efecto === 'devuelve') {
      const d = e.devuelve;
      if (!d) continue;
      valor += (d.propio ?? 0) * V.devuelvePropio + (d.rival ?? 0) * V.devuelveRival;
      continue;
    }
    const n = e[efecto] ?? 0;
    if (n === 0) continue;
    const peso = efecto === 'golpeHabitat' || efecto === 'curaHabitat'
      ? V[efecto] * BALANCE.ia.pesoHabitat
      : V[efecto];
    valor += n * peso;
  }
  return valor;
}

/**
 * Dispara la habilidad de entrada de `inst`, si tiene. Muta el estado, como el
 * resto de la fase de revelación.
 *
 * @param {object} s        estado en curso
 * @param {object} inst     la instancia que acaba de entrar
 * @param {object} ayudas   lo que hace falta del resto del motor
 */
export function alEntrar(s, inst, ayudas) {
  if (!HAY_ENTRADAS) return;
  const e = entradaDe(inst.cardId);
  if (!e) return;

  const {
    ev, herir, rival, unidadEn, unidadesDe, CAUSA, vidaActual,
    devolverAMano, enterrar, golpearHabitat,
  } = ayudas;
  const j = inst.dueno;
  const contrario = rival(j);
  const jug = s.jugadores[j];
  const otro = s.jugadores[contrario];

  // El evento se emite SIEMPRE, con `n` a cero si el efecto no encontró nada
  // que hacer. Callarlo dejaba la habilidad sin rastro en el registro: el
  // jugador veía entrar la carta y nada más, sin poder distinguir un fallo de
  // un rasgo que no existe.
  const contar = (efecto, n) => ev(s, 'ENTRADA', {
    iid: inst.iid, cardId: inst.cardId, dueno: j, efecto, n,
  });

  /** Del mazo al descarte, sin pasar por la mano. Es el reloj de la extinción. */
  const moler = (quien, cuantas) => {
    let molidas = 0;
    for (let k = 0; k < cuantas && quien.mazo.length > 0; k++) {
      quien.descarte.push(quien.mazo.shift());
      molidas += 1;
    }
    return molidas;
  };

  /**
   * Suelta la mano DENTRO del mazo, lo baraja y roba otras tantas. No es lo
   * mismo que descartarla: lo que sueltas vuelve a estar disponible, y por eso
   * una mano impagable se cambia por otra sin perder cartas del mazo.
   *
   * Roba a mano —y no con `robar()` de resolve.js— porque aquí no puede haber
   * rebarajado del descarte: el mazo acaba de crecer con la mano entera, así
   * que si aun así no llega a `cuantas` es que quedaban menos cartas que eso
   * en todo el montón y robar más sería inventárselas.
   *
   * El rng sale del estado, no de Math.random: el servidor re-juega la partida.
   */
  const manoNuevaDe = (quien, cuantas) => {
    quien.mazo.push(...quien.mano);
    quien.mano = [];
    const b = barajar(quien.mazo, s.rng);
    s.rng = b.rng;
    quien.mazo = b.lista;
    let robadas = 0;
    for (let k = 0; k < cuantas && quien.mazo.length > 0; k++) {
      quien.mano.push(quien.mazo.shift());
      robadas += 1;
    }
    return robadas;
  };

  /** Le tira al azar de la mano hasta dejarle `tope` cartas. */
  const recortarMano = (quien, tope) => {
    let quitadas = 0;
    while (quien.mano.length > tope) {
      const d = entero(s.rng, quien.mano.length);
      s.rng = d.rng;
      quien.descarte.push(quien.mano.splice(d.valor, 1)[0]);
      quitadas += 1;
    }
    return quitadas;
  };

  /** Del descarte a la mano, al azar. Lo enterrado que vuelve a salir. */
  const rescatar = (quien, cuantas) => {
    let sacadas = 0;
    for (let k = 0; k < cuantas && quien.descarte.length > 0; k++) {
      const d = entero(s.rng, quien.descarte.length);
      s.rng = d.rng;
      quien.mano.push(quien.descarte.splice(d.valor, 1)[0]);
      sacadas += 1;
    }
    return sacadas;
  };

  if (e.roba) {
    let robadas = 0;
    for (let k = 0; k < e.roba && jug.mazo.length > 0; k++) {
      jug.mano.push(jug.mazo.shift());
      robadas += 1;
    }
    contar('roba', robadas);
  }

  if (e.mueleRival) contar('muele', moler(otro, e.mueleRival));
  if (e.muelePropio) contar('muelePropio', moler(jug, e.muelePropio));

  // Manos nuevas. Se resuelve PRIMERO el rival y luego quien la juega, en orden
  // fijo: los dos barajan y roban del mismo rng, y sin un orden escrito dos
  // máquinas re-jugando la misma partida llegarían a manos distintas.
  if (e.manosNuevas) {
    contar('manosNuevas', manoNuevaDe(otro, e.manosNuevas));
    contar('manoNueva', manoNuevaDe(jug, e.manosNuevas));
  }
  if (e.manoNueva) contar('manoNueva', manoNuevaDe(jug, e.manoNueva));

  // El tope va DESPUÉS de `manosNuevas`, que es lo único que le llena la mano
  // al rival: recortarle a cuatro y devolverle cinco después dejaría el tope
  // en nada. Se escribe `!== undefined` porque un tope de 0 es un tope.
  if (e.topeManoRival !== undefined) {
    contar('topeManoRival', recortarMano(otro, e.topeManoRival));
  }

  if (e.rescata) contar('rescata', rescatar(jug, e.rescata));

  // Al AZAR de la mano rival, así que sale del rng del estado y no de
  // Math.random: la partida tiene que poder re-jugarse igual en el servidor.
  if (e.manoRival) {
    let quitadas = 0;
    for (let k = 0; k < e.manoRival && otro.mano.length > 0; k++) {
      const d = entero(s.rng, otro.mano.length);
      s.rng = d.rng;
      otro.descarte.push(otro.mano.splice(d.valor, 1)[0]);
      quitadas += 1;
    }
    contar('manoRival', quitadas);
  }

  // El hábitat no pasa de su tope: curar por encima sería una reserva invisible.
  if (e.curaHabitat) {
    const antes = jug.habitat;
    jug.habitat = Math.min(BALANCE.vidaHabitat, jug.habitat + e.curaHabitat);
    contar('curaHabitat', jug.habitat - antes);
  }

  // Del descarte al mazo: lo único que alarga un mazo en todo el juego.
  if (e.entierra) contar('entierra', enterrar(s, j, e.entierra));

  // Directo al hábitat, sin pasar por el combate. Es la vía más corta que hay
  // a una de las tres victorias, así que las cifras son pequeñas a propósito.
  if (e.golpeHabitat) {
    golpearHabitat(s, contrario, e.golpeHabitat);
    contar('golpeHabitat', e.golpeHabitat);
  }

  // El REBOTE: del campo a la mano. Ninguno pregunta, como el resto de la fase
  // de revelación, así que los dos objetivos salen de una regla fija.
  if (e.devuelve) {
    let n = 0;
    // El tuyo: el que peor lo lleva. Recoger al herido es lo que un jugador
    // haría, y además es lo que hace la carta útil —vuelve entero— sin tener
    // que preguntar. Desempate por iid, que la fase es simultánea.
    for (let k = 0; k < (e.devuelve.propio ?? 0); k++) {
      const mios = unidadesDe(s, j)
        .filter((u) => u.iid !== inst.iid)
        .sort((a, b) => vidaActual(s, a.iid) - vidaActual(s, b.iid) || a.iid - b.iid);
      if (!mios[0] || !devolverAMano(s, mios[0].iid)) break;
      n += 1;
    }
    // El suyo: el que más pega DE LOS QUE CABEN bajo el listón, que es la misma
    // regla que usa Tijera. Quitarle el pequeño de adorno no sería una carta.
    for (let k = 0; k < (e.devuelve.rival ?? 0); k++) {
      const suyos = unidadesDe(s, contrario)
        .filter((u) => e.devuelve.ataqueMax === undefined
          || carta(u.cardId).ataque <= e.devuelve.ataqueMax)
        .sort((a, b) => carta(b.cardId).ataque - carta(a.cardId).ataque || a.iid - b.iid);
      if (!suyos[0] || !devolverAMano(s, suyos[0].iid)) break;
      n += 1;
    }
    contar('devuelve', n);
  }

  // Cae encima del que tiene enfrente antes de que empiece el combate.
  if (e.emboscada) {
    const enfrente = unidadEn(s, contrario, inst.ranura);
    if (enfrente) herir(s, enfrente.iid, e.emboscada, CAUSA.ENTRADA, j);
    contar('emboscada', enfrente ? e.emboscada : 0);
  }

  // Se lleva por delante a uno que ya no aguanta. Entre los que caben elige el
  // de más Ataque —desempate por iid— y no lo pregunta: ver arriba.
  if (e.fulmina) {
    const candidatos = unidadesDe(s, contrario)
      .filter((u) => vidaActual(s, u.iid) <= e.fulmina)
      .sort((a, b) => ataqueDe(s, b) - ataqueDe(s, a) || a.iid - b.iid);
    const victima = candidatos[0] ?? null;
    if (victima) {
      s.ranuras[contrario][victima.ranura] = null;
      victima.ranura = null;
      otro.descarte.push(victima.iid);
    }
    ev(s, 'ENTRADA', {
      iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'fulmina',
      n: victima ? 1 : 0,
      objetivo: victima ? victima.iid : null,
      objetivoCardId: victima ? victima.cardId : null,
    });
  }
}

/** El Ataque impreso basta para desempatar a quién fulminar, y no arrastra ciclos. */
const ataqueDe = (s, inst) => carta(inst.cardId).ataque + inst.modAtaque;
