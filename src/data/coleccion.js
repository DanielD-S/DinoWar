// DinoWar — colección, sobres y mazos del jugador.
//
// Todo lo de aquí es puro: recibe el azar como argumento, no lo busca. La
// persistencia vive en src/ui/almacen.js, que es el único que toca el
// navegador. Así las probabilidades y la economía se pueden testear.

import { BALANCE, MAZO, TOTAL_MAZO } from './balance.js';
import { CARTAS, RAREZA, TIPO, carta, existeCarta } from './cards.js';

/** Tamaño exacto de un mazo legal. */
export const TAM_MAZO = BALANCE.tamanoMazo;

/**
 * Copias de una carta que caben en un mazo. Sale de su rareza, porque el límite
 * de mazo y la rareza son la misma regla mirada desde dos sitios.
 *
 * La excepción se declara en la propia carta, con `copiasMax`, y hoy sólo la
 * usa la Pradera de helechos: una carta de Biomasa con tres copias no llega a
 * mover la aguja, y su tope es una decisión de diseño, no de rareza.
 */
export const limiteDe = (cardId) => {
  const c = carta(cardId);
  return c.copiasMax ?? BALANCE.copiasPorRareza[c.rareza];
};

/** Cuántas criaturas legendarias caben en un mazo, entre todas. */
export const LEGENDARIAS_DINO_MAX = BALANCE.legendariasDinoPorMazo;

/**
 * ¿Cuenta esta carta para el tope de criaturas legendarias? Es criatura Y
 * legendaria; las de jefe cumplen las dos cosas y por eso entran, y las
 * legendarias de soporte —climas, eventos, recursos, Biomasa— no.
 */
export const esLegendariaDino = (cardId) => {
  const c = carta(cardId);
  return c.tipo === TIPO.DINOSAURIO && c.rareza === RAREZA.LEGENDARIO;
};

/**
 * Criaturas legendarias que lleva un mazo, contando copias. Acepta el mapa
 * {cardId: copias} y la lista de pares, que son las dos formas en que un mazo
 * viaja por el juego.
 */
export const legendariasDinoEn = (mazo) => {
  const pares = Array.isArray(mazo) ? mazo : Object.entries(mazo);
  let n = 0;
  for (const [cardId, copias] of pares) {
    if (existeCarta(cardId) && copias > 0 && esLegendariaDino(cardId)) n += copias;
  }
  return n;
};

export const ECONOMIA = Object.freeze({
  // Un sobre son cinco cartas. El precio está por encima de lo que devuelve
  // fundirlo entero (unas 77 monedas, que lo comprueba un test), porque si no
  // el bucle se alimenta solo y abrir sobres deja de ser una decisión.
  precioSobre: 100,
  cartasPorSobre: 5,

  // Las monedas salen de GANAR, no de jugar y tampoco de fundir. Fundir sólo
  // recicla lo que ya no te cabe en ningún mazo.
  //
  // Perder no paga: dos victorias son un sobre y una derrota no es medio paso
  // hacia él. El precio de eso es que quien no gana nunca se queda con los dos
  // sobres de salida y su colección inicial, que es un mazo legal y completo
  // —jugar nunca se bloquea—, pero la colección deja de crecer sola.
  monedasInicio: 240,
  monedasVictoria: 50,
  monedasDerrota: 0,

  // Tope de victorias PAGADAS al día. No es una regla de juego —jugar no se
  // limita— sino una cota al abuso: el servidor re-juega cada partida que cobra
  // y eso cuesta CPU, así que un cliente hostil no puede pedir mil.
  victoriasPorDia: 50,

  // Qué parte de cada sobre mira tu colección antes de sortear la carta. Con 1
  // —como fue hasta el 16-09-2026— no sale una copia repetida mientras te falte
  // algo de esa rareza: la colección se completa en unos 116 sobres y el
  // crafteo no pinta nada, porque en 50 sobres se juntan 64 esquirlas. Con 0 es
  // el sorteo de Pokémon TCG Live —puro azar y lo repetido se funde— y más de
  // la mitad de las épicas y legendarias que salen ya las tenías. Medido con
  // 400 cuentas sobre las mismas semillas, 0,7 deja el 80 % de los hits nuevos,
  // siete veces más esquirlas (432 en 50 sobres) y la colección en unos 128.
  // Es el número que reparte el camino entre abrir sobres y crear cartas.
  sesgoFaltan: 0.7,

  fusion: Object.freeze({
    [RAREZA.COMUN]: 4,
    [RAREZA.RARO]: 12,
    [RAREZA.EPICO]: 35,
    [RAREZA.LEGENDARIO]: 100,
  }),
});

/** Todo sobre trae al menos una carta de esta rareza o mejor. */
export const GARANTIA = RAREZA.RARO;

const ESCALA = Object.freeze([RAREZA.COMUN, RAREZA.RARO, RAREZA.EPICO, RAREZA.LEGENDARIO]);
const nivel = (rareza) => ESCALA.indexOf(rareza);

/** Cartas del set agrupadas por rareza, en orden de declaración. */
export const POR_RAREZA = Object.freeze(Object.fromEntries(
  ESCALA.map((r) => [r, Object.freeze(Object.values(CARTAS).filter((c) => c.rareza === r).map((c) => c.id))]),
));

/**
 * Copias que aporta cada rareza a una colección completa. Se suma carta a carta
 * y no se multiplica por el tope de la rareza: una carta con tope propio —la
 * Pradera de helechos, con 7— haría que «colección completa» pidiera menos
 * copias de las que de verdad caben.
 */
export const CUOTA = Object.freeze(Object.fromEntries(
  ESCALA.map((r) => [r, POR_RAREZA[r].reduce((n, id) => n + limiteDe(id), 0)]),
));

/** Copias distintas que hay que reunir para tener el set entero. */
export const COLECCION_COMPLETA = ESCALA.reduce((n, r) => n + CUOTA[r], 0);

/**
 * Cada cuánto sale UNA carta de esta rareza comparada con una legendaria. Es
 * el único número a mano de todo esto: una común concreta sale ocho veces más
 * que una legendaria concreta, pase lo que pase con el tamaño del set.
 *
 * Antes el peso se aplicaba a las COPIAS que cada rareza aporta a la colección,
 * y eso sólo aguanta mientras los grupos sean parecidos: al entrar treinta y
 * seis comunes de golpe, las comunes sumaban 123 copias contra 8 de las
 * legendarias y el reparto por rareza dejaba a éstas en el 0,8 % del sobre, por
 * debajo de lo que aportan al set. Contando por carta el orden no depende del
 * tamaño de cada grupo y no se puede romper añadiendo cartas.
 */
const PESO = Object.freeze({
  [RAREZA.COMUN]: 8,
  [RAREZA.RARO]: 4,
  [RAREZA.EPICO]: 2,
  [RAREZA.LEGENDARIO]: 1,
});

/**
 * Probabilidad de que una carta del sobre salga de cada rareza. Suma 1.
 *
 * Sale de cuántas cartas tiene cada rareza por lo que pesa una de ellas, así
 * que añadir cartas al set reajusta la tabla sola y sin invertir el orden. Lo
 * que hay que mirar no es este número sino el de por carta, que es el que nota
 * quien abre el sobre.
 */
export const PROBABILIDAD = Object.freeze((() => {
  const bruto = ESCALA.map((r) => POR_RAREZA[r].length * PESO[r]);
  const total = bruto.reduce((a, b) => a + b, 0);
  return Object.fromEntries(ESCALA.map((r, i) => [r, bruto[i] / total]));
})());



// ------------------------------------------------------------------- sobres

/**
 * Una rareza al azar según PROBABILIDAD.
 * @param {() => number} azar función que devuelve [0, 1)
 * @param {string} [minima] rareza mínima; renormaliza sobre las que quedan
 */
export function rarezaAlAzar(azar, minima = RAREZA.COMUN) {
  const desde = nivel(minima);
  const candidatas = ESCALA.slice(desde);
  const total = candidatas.reduce((n, r) => n + PROBABILIDAD[r], 0);
  let t = azar() * total;
  for (const r of candidatas) {
    t -= PROBABILIDAD[r];
    if (t < 0) return r;
  }
  return candidatas[candidatas.length - 1];
}

/**
 * Cinco cartas al azar. La última se tira con la garantía puesta sólo si
 * ninguna de las anteriores la cumplió, así que el sobre nunca sale vacío de
 * emoción pero tampoco regala una rara de más.
 *
 * Si se le pasa la colección, una vez elegida la rareza el sorteo mira —con la
 * probabilidad de `sesgo`— sólo las cartas de esa rareza que aún caben en un
 * mazo. No cambia lo raro que es que salga una legendaria: cambia que, cuando
 * sale, sea casi siempre una que te falta en vez de la cuarta copia de la
 * misma. Sin sesgo ninguno el 94 % de todo lo que abrías era una copia que no
 * podías jugar; con sesgo total nunca sobraba nada y el crafteo no tenía de
 * qué comer. Lo que no mira la colección, o sale cuando ya tienes toda la
 * rareza, se sortea entre todas: eso es lo que alimenta la fusión.
 *
 * Cada carta del sobre decide por su cuenta si mira la colección, y no el
 * sobre entero: una moneda por sobre daría sobres «buenos» y sobres «malos»
 * de cinco cartas, y lo que se quiere es que cada sobre traiga algo de las
 * dos cosas. Con sesgo 1 no se gasta azar y las tiradas de antes salen igual.
 *
 * @param {() => number} azar
 * @param {Record<string, number>} [tengo] copias por carta que ya posee el jugador
 * @param {number} [sesgo] probabilidad de que cada carta mire la colección
 * @returns {string[]} cardIds, en el orden en que se revelan
 */
export function abrirSobre(azar, tengo = null, sesgo = ECONOMIA.sesgoFaltan) {
  const salida = [];
  // Copia local: dos cartas del mismo sobre no deberían ignorarse entre sí.
  const cuenta = tengo ? { ...tengo } : null;

  for (let i = 0; i < ECONOMIA.cartasPorSobre; i++) {
    const ultima = i === ECONOMIA.cartasPorSobre - 1;
    const cumplida = salida.some((id) => nivel(carta(id).rareza) >= nivel(GARANTIA));
    const r = rarezaAlAzar(azar, ultima && !cumplida ? GARANTIA : RAREZA.COMUN);

    let pool = POR_RAREZA[r];
    if (cuenta) {
      const mira = sesgo >= 1 || azar() < sesgo;
      const faltan = mira ? pool.filter((id) => (cuenta[id] ?? 0) < limiteDe(id)) : [];
      // Si no se mira la colección, o no falta ninguna de esa rareza, se
      // reparte entre todas —eso es lo que alimenta la fusión— pero sin repetir
      // dentro del mismo sobre mientras queden alternativas: sacar dos veces
      // la misma legendaria de una tirada se lee como un fallo, no como suerte.
      if (faltan.length) pool = faltan;
      else {
        const sinRepetir = pool.filter((id) => !salida.includes(id));
        if (sinRepetir.length) pool = sinRepetir;
      }
    }

    const id = pool[Math.min(pool.length - 1, Math.floor(azar() * pool.length))];
    if (cuenta) cuenta[id] = (cuenta[id] ?? 0) + 1;
    salida.push(id);
  }
  return salida;
}

// -------------------------------------------------------------------- fundir

/**
 * Copias que sobran de cada carta: las que superan el máximo que cabe en un
 * mazo. Una cuarta copia de Dryosaurus no la puedes jugar nunca, y una segunda
 * de Torvosaurus tampoco: eso es exactamente lo que se funde.
 */
export function excedente(cartas) {
  const sobra = {};
  for (const [cardId, n] of Object.entries(cartas)) {
    if (!CARTAS[cardId]) continue;
    const de = n - limiteDe(cardId);
    if (de > 0) sobra[cardId] = de;
  }
  return sobra;
}

/** Monedas que daría fundir todo el excedente. */
export function valorFusion(cartas) {
  return Object.entries(excedente(cartas))
    .reduce((n, [cardId, copias]) => n + copias * ECONOMIA.fusion[carta(cardId).rareza], 0);
}

// --------------------------------------------------------------------- mazos

/** Mazo por defecto: el que el simulador mide y el que arranca la colección. */
export const mazoPorDefecto = () => Object.fromEntries(MAZO);

/**
 * Colección de partida: justo lo necesario para montar el mazo por defecto, ni
 * una carta más. Las seis que no entran en él salen de los sobres, que es para
 * lo que están.
 */
export const coleccionInicial = () => mazoPorDefecto();

/**
 * ¿Es legal este mazo? Devuelve los problemas en vez de un booleano: la
 * pantalla necesita decir POR QUÉ no se puede jugar, no sólo que no.
 * @param {Record<string, number>} mazo copias por carta
 * @param {Record<string, number>} cartas colección del jugador
 */
export function validarMazo(mazo, cartas) {
  const problemas = [];
  let total = 0;

  for (const [cardId, copias] of Object.entries(mazo)) {
    // Las de jefe cuentan en el mazo aunque no estén en el set: se ganan
    // cooperando y para eso se ganan, para jugarlas.
    if (!existeCarta(cardId) || copias <= 0) continue;
    total += copias;
    const tope = limiteDe(cardId);
    if (copias > tope) {
      problemas.push(`${carta(cardId).binomial}: ${copias} copias, el máximo es ${tope}.`);
    }
    const tengo = cartas[cardId] ?? 0;
    if (copias > tengo) {
      problemas.push(`${carta(cardId).binomial}: tienes ${tengo} y el mazo pide ${copias}.`);
    }
  }

  const legendarias = legendariasDinoEn(mazo);
  if (legendarias > LEGENDARIAS_DINO_MAX) {
    problemas.push(`${legendarias} criaturas legendarias: el máximo es ${LEGENDARIAS_DINO_MAX} por mazo.`);
  }

  if (total !== TAM_MAZO) {
    const de = Math.abs(TAM_MAZO - total);
    const cuantas = de === 1 ? '1 carta' : `${de} cartas`;
    problemas.push(total < TAM_MAZO
      ? `${de === 1 ? 'Falta' : 'Faltan'} ${cuantas}: un mazo son ${TAM_MAZO} exactas.`
      : `${de === 1 ? 'Sobra' : 'Sobran'} ${cuantas}: un mazo son ${TAM_MAZO} exactas.`);
  }

  return { valido: problemas.length === 0, total, problemas };
}

/** Formato que entiende crearPartida: pares [cardId, copias]. */
export const aListaDeMazo = (mazo) => Object.entries(mazo).filter(([, n]) => n > 0);
