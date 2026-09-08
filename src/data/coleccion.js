// DinoWar — colección, sobres y mazos del jugador.
//
// Todo lo de aquí es puro: recibe el azar como argumento, no lo busca. La
// persistencia vive en src/ui/almacen.js, que es el único que toca el
// navegador. Así las probabilidades y la economía se pueden testear.

import { BALANCE, MAZO, TOTAL_MAZO } from './balance.js';
import { CARTAS, RAREZA, carta } from './cards.js';

/** Tamaño exacto de un mazo legal. */
export const TAM_MAZO = BALANCE.tamanoMazo;

/**
 * Copias de una carta que caben en un mazo. Es su rareza, no un número aparte:
 * el límite de mazo y la rareza son la misma regla mirada desde dos sitios.
 */
export const limiteDe = (cardId) => BALANCE.copiasPorRareza[carta(cardId).rareza];

export const ECONOMIA = Object.freeze({
  // Un sobre son cinco cartas. El precio está por encima de lo que devuelve
  // fundirlo entero (unas 56 monedas), porque si no el bucle se alimenta solo
  // y abrir sobres deja de ser una decisión.
  precioSobre: 120,
  cartasPorSobre: 5,

  // Las monedas salen de jugar, no de fundir. Fundir sólo recicla lo que ya no
  // te cabe en ningún mazo.
  monedasInicio: 240,
  monedasVictoria: 60,
  monedasDerrota: 20,

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

/** Copias que aporta cada rareza a una colección completa. */
export const CUOTA = Object.freeze(Object.fromEntries(
  ESCALA.map((r) => [r, POR_RAREZA[r].length * BALANCE.copiasPorRareza[r]]),
));

/** Copias distintas que hay que reunir para tener el set entero. */
export const COLECCION_COMPLETA = ESCALA.reduce((n, r) => n + CUOTA[r], 0);

/**
 * Cuánto se estrecha cada rareza respecto a lo que pesa en el set. Es el único
 * número a mano de todo esto: lo demás sale de la forma del set.
 *
 * Con peso 1 en todas, cada carta saldría con la misma frecuencia y la rareza
 * no significaría nada. Los pesos la inclinan: una común concreta sale unas
 * veinte veces más que una legendaria concreta.
 */
const PESO = Object.freeze({
  [RAREZA.COMUN]: 3,
  [RAREZA.RARO]: 2,
  [RAREZA.EPICO]: 1,
  [RAREZA.LEGENDARIO]: 0.45,
});

/**
 * Probabilidad de que una carta del sobre salga de cada rareza. Suma 1.
 *
 * Sale de la forma del set, no de una tabla escrita a mano, porque escrita a
 * mano estaba al revés: el set son 15 épicas y 8 legendarias frente a 4 comunes
 * y 4 raras, pero los sobres repartían el 88 % entre esas ocho cartas. Es
 * decir, el 88 % de lo que abrías caía sobre el 19 % del set, y las épicas
 * —que son la mitad de la colección— salían el 10 % de las veces.
 *
 * Ahora cada rareza recibe lo que pesa en el set multiplicado por su PESO, así
 * que añadir cartas al set reajusta la tabla sola. Lo que hay que mirar no es
 * este número sino el de por carta, que es el que nota quien abre el sobre.
 */
export const PROBABILIDAD = Object.freeze((() => {
  const bruto = ESCALA.map((r) => CUOTA[r] * PESO[r]);
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
 * Si se le pasa la colección, una vez elegida la rareza el sorteo se hace sólo
 * entre las cartas de esa rareza que aún caben en un mazo. No cambia lo raro
 * que es que salga una legendaria: cambia que, cuando sale, sea una que te
 * falta en vez de la cuarta copia de la misma. Sin ese sesgo el 94 % de todo
 * lo que abrías era una copia que no podías jugar. Cuando ya tienes toda la
 * rareza se sortea entre todas: eso es lo que alimenta la fusión.
 *
 * @param {() => number} azar
 * @param {Record<string, number>} [tengo] copias por carta que ya posee el jugador
 * @returns {string[]} cardIds, en el orden en que se revelan
 */
export function abrirSobre(azar, tengo = null) {
  const salida = [];
  // Copia local: dos cartas del mismo sobre no deberían ignorarse entre sí.
  const cuenta = tengo ? { ...tengo } : null;

  for (let i = 0; i < ECONOMIA.cartasPorSobre; i++) {
    const ultima = i === ECONOMIA.cartasPorSobre - 1;
    const cumplida = salida.some((id) => nivel(carta(id).rareza) >= nivel(GARANTIA));
    const r = rarezaAlAzar(azar, ultima && !cumplida ? GARANTIA : RAREZA.COMUN);

    let pool = POR_RAREZA[r];
    if (cuenta) {
      const faltan = pool.filter((id) => (cuenta[id] ?? 0) < limiteDe(id));
      if (faltan.length) pool = faltan;
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
    if (!CARTAS[cardId] || copias <= 0) continue;
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
