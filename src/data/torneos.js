// DinoWar — los torneos: una regla fija, una racha, y un set que se despierta.
//
// POR QUÉ EXISTEN. El juego tiene 139 cartas y 108 de ellas están fuera del
// mazo de referencia, o sea sin calibración comprobada y, lo que importa más,
// sin motivo para jugarlas. Los pterosaurios y los marinos no pueden ser un
// mazo tribal; las cartas de coste 0 y 1 son relleno de curva; el Río y el
// Acantilado —dos de los diecisiete lugares— miden 1,00 exacto en
// `sim/lugares.mjs` porque el mazo que se usa para medir no lleva a quién
// afectar. Un torneo es una semana en la que construir con eso no es una
// excentricidad: es la única forma de entrar.
//
// QUÉ ES UN TORNEO. Una REGLA DE CONSTRUCCIÓN y nada más. No cambia el motor,
// no cambia el tablero, no cambia los umbrales de victoria. Se juega el mismo
// Duelo de siempre contra gente que entró al mismo torneo.
//
// CUATRO DECISIONES QUE CONVIENE CONOCER ANTES DE DISCUTIRLAS:
//
// 1. LA REGLA ES UN DATO, como las mecánicas de las criaturas y como los
//    lugares. Un objeto con un vocabulario corto —`FORMAS`— y `test/torneos.test.js`
//    exige que todo torneo use sólo formas del vocabulario y que toda forma la
//    use algún torneo. Un campo mal escrito, `costeMaxx: 2`, no es un error de
//    sintaxis: es un torneo sin regla que deja entrar cualquier mazo.
//
// 2. SÓLO FILTRAN EL MAZO, y esa frontera decide el coste de mantenerlo.
//    Una regla que filtra cartas es una función pura sobre una lista: se
//    comprueba en el navegador y en SQL, y el motor no se entera de que los
//    torneos existen. Una regla que cambiara la PARTIDA —un lugar fijo en las
//    cuatro columnas, un clima puesto desde el turno 1, el hábitat a 50, el
//    mazo a 35 cartas— tendría que viajar a `_compartido/duelo.js`, que es el
//    paquete de la Edge Function, y eso son re-empaquetar, re-anclar y
//    desplegar CADA VEZ que se toca un torneo. Las hay pensadas y no están:
//    primero que el formato demuestre que se juega.
//
// 3. LA RACHA, Y NO UN CUADRO. Se gana `victoriasParaCerrar` antes de perder
//    `derrotasParaCerrar`, y el premio sube con las victorias. Es el formato de
//    la Arena de Hearthstone y está elegido por una razón operativa: con nueve
//    cuentas no hay forma de juntar a dieciséis personas a la misma hora. Una
//    racha es asíncrona —entras cuando puedes, tu run se queda guardado— y
//    funciona con la gente que haya.
//
// 4. SE PAGA ENTRADA, Y ES EL PUNTO. Las dinomonedas sólo compraban sobres,
//    así que ahorrar era lo único que se podía hacer con ellas. Una entrada
//    barata —`entrada`, hoy 50, menos de dos victorias— obliga a elegir: seis
//    entradas son un sobre. Y como el premio de una racha buena pasa de lo que
//    costó, jugar bien devuelve más de lo que se puso; jugar mal, no. Eso es
//    lo que hace que sea una decisión y no un peaje.
//
// EL TORNEO NO ES PARA UNA CUENTA NUEVA, y conviene decirlo aquí. La colección
// de salida son 55 cartas exactas: CUALQUIER filtro la deja por debajo de las
// 55 que pide un mazo. Medido: sin legendarias le quedan 53, con coste máximo
// 3 le quedan 51-54. No es un descuido del catálogo, es aritmética. Por eso
// `entrar_en_torneo` valida el mazo Y cobra en la MISMA llamada: un mazo
// ilegal no cobra nada, y el botón dice cuántas cartas faltan en vez de
// tragarse las monedas de quien todavía no puede jugar.

import { CARTAS, CLADO, RAREZA, RAREZA_NOMBRE, TIPO, TIPO_NOMBRE, carta, existeCarta } from './cards.js';
import { TAM_MAZO, limiteDe, validarMazo } from './coleccion.js';
import { semanaDe } from './expediciones.js';

// --------------------------------------------------------------- números

export const TORNEOS = Object.freeze({
  // Lo que cuesta entrar, en dinomonedas. Una victoria paga 30 y un sobre
  // cuesta 300: la entrada es menos de dos partidas ganadas y seis entradas
  // son un sobre. Barato de verdad, pero se nota.
  entrada: 50,
  // La racha: cinco victorias la cierran arriba, tres derrotas la cierran
  // abajo. Son los números de la Arena y están bien: una racha perfecta son
  // cinco partidas, la media ronda las cinco, y nadie se queda atrapado en un
  // formato que no le gusta más de siete.
  victoriasParaCerrar: 5,
  derrotasParaCerrar: 3,
  // Una racha por torneo y semana. Sin esto, quien tiene monedas compra
  // veinte entradas y el premio deja de premiar nada.
  rachasPorTorneo: 1,
});

/**
 * Lo que paga una racha, por victorias conseguidas. El índice es el número de
 * victorias, así que el array tiene `victoriasParaCerrar + 1` entradas.
 *
 * Los premios son SOBRES y no monedas por encima de la devolución: si el
 * torneo pagara monedas, sería un grifo más en una economía que se acaba de
 * endurecer a propósito, y además desharía lo que la entrada quiere hacer
 * —que las monedas se gasten—. Devolver la entrada a las dos victorias es lo
 * que hace que una racha mediocre no duela; a partir de ahí se cobra en lo
 * que el torneo puede dar sin tocar el grifo diario: el sobre que la economía
 * ya sabe repartir, `sobres_gratis`, el mismo cajón que usan los logros.
 */
export const PREMIOS = Object.freeze([
  Object.freeze({ monedas: 0, sobres: 0 }),   // 0 victorias
  Object.freeze({ monedas: 0, sobres: 0 }),   // 1
  Object.freeze({ monedas: 50, sobres: 0 }),  // 2 — la entrada, de vuelta
  Object.freeze({ monedas: 100, sobres: 0 }), // 3
  Object.freeze({ monedas: 0, sobres: 1 }),   // 4
  Object.freeze({ monedas: 0, sobres: 2 }),   // 5 — la racha perfecta
]);

// ---------------------------------------------------------- el vocabulario
//
// Las cinco formas que una regla puede tomar. Igual que `FORMAS` en
// `lugares.js` y que el `VOCABULARIO` de las misiones: la lista está escrita
// porque un campo que nadie lee falla en silencio.

export const FORMAS = Object.freeze([
  // Qué clados de CRIATURA caben. No toca el soporte: no tiene clado, y
  // aplicárselo dejaría un torneo sin una sola carta de apoyo.
  'soloClados',
  // Coste impreso máximo, para TODA carta. El soporte cuesta de 0 a 3 y las
  // criaturas de 0 a 4, así que un tope también le recorta la curva al apoyo,
  // que es lo que se quiere: un torneo barato es barato entero.
  'costeMax',
  // Rarezas vetadas, para toda carta.
  'sinRareza',
  // Familias vetadas, para toda carta.
  'sinTipo',
  // Copias por carta, por encima del tope de rareza. Es el único campo que no
  // es un filtro —no quita cartas, cambia cuántas caben— y por eso es el único
  // que el whitelist generado para SQL no puede expresar: viaja como número.
  'copiasMax',
]);

// ------------------------------------------------------------- el catálogo

const t = (o) => Object.freeze({ ...o, regla: Object.freeze({ ...o.regla }) });

/**
 * Siete torneos. Rotan de uno en uno por semana, así que el ciclo dura siete
 * semanas y NO cae en fase con los cinco visitantes de las expediciones: un
 * jugador no ve nunca la misma pareja dos semanas seguidas.
 *
 * Cada uno lleva escrito a qué parte dormida del set apunta, que es la razón
 * de que exista y lo que hay que volver a mirar si alguien quiere cambiarlo.
 */
export const CATALOGO = Object.freeze([
  t({
    id: 'cada_hueso_uno',
    nombre: 'Cada hueso uno',
    lema: 'Una copia de cada. Cincuenta y cinco cartas distintas.',
    // Un mazo normal son ~19 cartas distintas a 2,4 copias de media. Éste pide
    // 55, o sea el 40 % del set en una sola partida. Es el que más cartas
    // despierta de golpe y el único en el que una carta que nadie juega entra
    // porque no queda otra.
    regla: { copiasMax: 1 },
  }),
  t({
    id: 'sin_colmillos',
    nombre: 'Sin colmillos',
    lema: 'Nada por encima de 2 de coste. Las legendarias se quedan fuera.',
    // El tope de tres legendarias por mazo deja de mandar y la curva baja
    // entera: las comunes de 0 y 1, que hoy son relleno, pasan a ser el mazo.
    regla: { costeMax: 2, sinRareza: [RAREZA.LEGENDARIO] },
  }),
  t({
    id: 'cielo_y_mar',
    nombre: 'El cielo y el mar',
    lema: 'Sólo pterosaurios y marinos. Lo que compartía paisaje, sin dinosaurios.',
    // Nueve cartas y 22 copias: el set los tiene como fauna de acompañamiento y
    // nunca van a ser un tribal fuera de aquí. Y con ellos despiertan el Río y
    // el Acantilado, los dos lugares que miden 1,00 exacto en `LUGARES.md`
    // porque el mazo de referencia no lleva a quién afectar.
    //
    // Es el torneo más raro de los siete a propósito: con 22 copias de criatura
    // el resto son 33 de apoyo, o sea un mazo que pelea con eventos. No es un
    // defecto del filtro, es el formato.
    regla: { soloClados: [CLADO.PTEROSAURIO, CLADO.MARINO] },
  }),
  t({
    id: 'el_muro',
    nombre: 'El muro',
    lema: 'Sólo tireóforos y saurópodos. Aguantar es el plan.',
    // 27 cartas y 65 copias, la mitad del cuerpo del set. Y es el único sitio
    // donde no matar no te hace perder por trofeos, porque enfrente tampoco
    // mata nadie: las dos cartas de Ataque 0 —Brachylophosaurus y
    // Loricatosaurus— dejan de ser un lastre por una semana.
    regla: { soloClados: [CLADO.TIREOFORO, CLADO.SAUROPODO] },
  }),
  t({
    id: 'sin_trampas',
    nombre: 'Sin trampas',
    lema: 'Ni un evento. Lo que traiga la carta impresa.',
    // 29 eventos fuera. Lo que queda son los rasgos y las mecánicas de las
    // criaturas peleando solos, sin la respuesta que hoy tapa media partida.
    regla: { sinTipo: [TIPO.EVENTO] },
  }),
  t({
    id: 'a_dentelladas',
    nombre: 'A dentelladas',
    lema: 'Criaturas y Biomasa. Nada más.',
    // Fuera los 41 de apoyo enteros: eventos, climas y recursos. Es el combate
    // desnudo, y el único formato donde los cinco climas no existen y por tanto
    // las inmunidades al clima —que hoy no muerden— tampoco estorban.
    regla: { sinTipo: [TIPO.EVENTO, TIPO.CLIMA, TIPO.RECURSO] },
  }),
  t({
    id: 'los_pequenos',
    nombre: 'Los pequeños',
    lema: 'Coste 0 y 1. Los que nunca llegan a la mesa.',
    // 49 cartas y 131 copias. Es `sin_colmillos` un escalón más abajo y no es
    // lo mismo: a coste 1 la renta deja de ser el cuello de botella y el
    // cuello pasa a ser la MANO, que es la mitad del juego que la ronda del
    // control escribió y que ningún mazo ha llegado a usar.
    regla: { costeMax: 1 },
  }),
]);

export const torneoPorId = (id) => CATALOGO.find((x) => x.id === id) ?? null;

/** El torneo de la semana a la que pertenece `dia` ('AAAA-MM-DD'). */
export const torneoDe = (dia) => CATALOGO[semanaDe(dia) % CATALOGO.length];

/** La llave con la que el servidor cuenta una racha: el torneo Y la semana. */
export const llaveDeRacha = (dia) => `${torneoDe(dia).id}@${semanaDe(dia)}`;

// ---------------------------------------------------------------- la regla

/** ¿Cabe esta carta en este torneo? `torneo` es una entrada del CATALOGO. */
export function cartaLegal(torneo, cardId) {
  if (!existeCarta(cardId)) return false;
  const c = carta(cardId);
  const r = torneo.regla;
  if (r.soloClados && c.tipo === TIPO.DINOSAURIO && !r.soloClados.includes(c.clado)) return false;
  if (r.costeMax !== undefined && c.coste > r.costeMax) return false;
  if (r.sinRareza && r.sinRareza.includes(c.rareza)) return false;
  if (r.sinTipo && r.sinTipo.includes(c.tipo)) return false;
  return true;
}

/** Los ids que caben, en orden de catálogo. Es lo que se vuelca a SQL. */
export const cartasLegales = (torneo) =>
  Object.keys(CARTAS).filter((id) => cartaLegal(torneo, id));

/** Copias de una carta en este torneo: el tope de siempre, o el del torneo. */
export const copiasMaxEn = (torneo, cardId) =>
  Math.min(limiteDe(cardId), torneo.regla.copiasMax ?? Infinity);

/**
 * Valida un mazo PARA un torneo: primero todo lo de siempre —copias, rarezas,
 * el tope de legendarias, las 55 cartas, que sean tuyas— y encima la regla.
 *
 * Va aquí y no en `coleccion.js` por el motivo de siempre en este proyecto:
 * `coleccion.js` entra en el paquete de la Edge Function, así que una línea
 * suya cuesta re-empaquetar, re-anclar y desplegar. Los torneos no tocan la
 * función, y no van a empezar a tocarla por vivir en el fichero equivocado.
 */
export function validarMazoEnTorneo(mazo, cartas, torneo) {
  const base = validarMazo(mazo, cartas);
  const problemas = base.problemas.slice();

  for (const [cardId, copias] of Object.entries(mazo)) {
    if (!existeCarta(cardId) || copias <= 0) continue;
    if (!cartaLegal(torneo, cardId)) {
      problemas.push(`${carta(cardId).binomial} no entra en «${torneo.nombre}».`);
      continue;
    }
    const tope = copiasMaxEn(torneo, cardId);
    if (copias > tope) {
      problemas.push(`${carta(cardId).binomial}: ${copias} copias, en «${torneo.nombre}» el máximo es ${tope}.`);
    }
  }

  return { valido: problemas.length === 0, total: base.total, problemas };
}

/**
 * Cuántas cartas legales tiene una colección para este torneo. Es lo que
 * decide si el botón de entrar se puede pulsar: por debajo de `TAM_MAZO` no
 * hay mazo posible y cobrar la entrada sería cobrar por nada.
 */
export function copiasDisponibles(cartas, torneo) {
  let n = 0;
  for (const [cardId, tengo] of Object.entries(cartas ?? {})) {
    if (!existeCarta(cardId) || tengo <= 0) continue;
    if (!cartaLegal(torneo, cardId)) continue;
    n += Math.min(tengo, copiasMaxEn(torneo, cardId));
  }
  return n;
}

export const puedeConstruir = (cartas, torneo) => copiasDisponibles(cartas, torneo) >= TAM_MAZO;

// ----------------------------------------------------------------- premios

/** Lo que paga una racha con `ganadas` victorias. */
export const premioDeRacha = (ganadas) =>
  PREMIOS[Math.max(0, Math.min(PREMIOS.length - 1, ganadas | 0))];

/** ¿Se cerró la racha? Cinco victorias o tres derrotas. */
export const rachaCerrada = (ganadas, perdidas) =>
  ganadas >= TORNEOS.victoriasParaCerrar || perdidas >= TORNEOS.derrotasParaCerrar;

// ------------------------------------------------------------- para pintar

/**
 * La regla en una línea, para la cartela del torneo. Se arma del DATO y no se
 * escribe a mano en cada torneo: un lema que se quedara atrás de su regla
 * sería la misma mentira que `test/textos.test.js` persigue en las cartas.
 */
const PLURAL = Object.freeze({
  [CLADO.TEROPODO]: 'terópodos',
  [CLADO.SAUROPODO]: 'saurópodos',
  [CLADO.TIREOFORO]: 'tireóforos',
  [CLADO.ORNITOPODO]: 'ornitópodos',
  [CLADO.MARGINOCEFALO]: 'marginocéfalos',
  [CLADO.PTEROSAURIO]: 'pterosaurios',
  // `CLADO_NOMBRE` dice «Reptil marino» y el plural no sale de añadirle una
  // letra. Con siete clados, escribirlos es más corto que la regla.
  [CLADO.MARINO]: 'reptiles marinos',
});

export function textoDeRegla(torneo) {
  const r = torneo.regla;
  const partes = [];
  if (r.soloClados) {
    partes.push(`sólo ${r.soloClados.map((c) => PLURAL[c]).join(' y ')}`);
  }
  if (r.costeMax !== undefined) partes.push(`coste ${r.costeMax} como máximo`);
  if (r.sinRareza) {
    partes.push(`sin ${r.sinRareza.map((x) => `${RAREZA_NOMBRE[x].toLowerCase()}s`).join(' ni ')}`);
  }
  if (r.sinTipo) {
    partes.push(`sin ${r.sinTipo.map((x) => `${TIPO_NOMBRE[x].toLowerCase()}s`).join(' ni ')}`);
  }
  if (r.copiasMax !== undefined) {
    partes.push(r.copiasMax === 1 ? 'una copia de cada carta' : `${r.copiasMax} copias por carta`);
  }
  const frase = partes.join(', ');
  return frase.charAt(0).toUpperCase() + frase.slice(1) + '.';
}
