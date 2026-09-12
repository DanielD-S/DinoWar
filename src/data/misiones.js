// DinoWar — misiones diarias: tres cada día, elegidas por el calendario.
//
// Por qué existen: hasta ahora la única razón de volver era querer jugar otra.
// Las dinomonedas salen de ganar y nada más, así que quien pierde tres seguidas
// se queda igual que estaba. Una misión es un motivo pequeño para abrir el
// juego hoy y un objetivo que no es «gana», que es el único que había.
//
// TRES DECISIONES QUE CONVIENE CONOCER ANTES DE DISCUTIRLAS:
//
// 1. La misión es un DATO, no una rama. Igual que las mecánicas de las
//    criaturas: un objeto con lo que mide y cuánto pide. El motor no sabe que
//    existen las misiones y no debe saberlo — lo que las alimenta es el PARTE,
//    que se saca de los eventos que el motor ya emitía.
//
// 2. El parte lo hace SIEMPRE el servidor, re-jugando la partida. Nunca el
//    navegador. Es la misma puerta que cerró `validarSolitario`: si el progreso
//    de una misión saliera de lo que el cliente afirma, con él se cobran
//    monedas, con las monedas se compran sobres y las cartas que salen son
//    legítimas. Por eso aquí no hay ninguna función que el navegador llame para
//    sumar progreso: sólo para LEER el catálogo y pintarlo.
//
// 3. Qué misiones tocan hoy sale del DÍA, no de una tirada guardada. Dos sitios
//    —el servidor al cobrar, el navegador al pintar— calculan lo mismo sin
//    hablarlo. Lo que sí viene del servidor es QUÉ DÍA ES: con la fecha local
//    del navegador, alguien en Auckland vería las misiones de mañana y el
//    servidor le acreditaría las de hoy. El día lo dice quien paga.

import { CLADO, CLADO_NOMBRE, TIPO, carta, existeCarta } from './cards.js';

/** Cuántas misiones se ofrecen al día y qué se considera una victoria rápida. */
export const MISIONES = Object.freeze({
  porDia: 3,
  // Una victoria por debajo de esto es una partida que fue a por el rival desde
  // el principio. La media ronda los 15 turnos (`BALANCE.md`), así que 11 pide
  // intención sin pedir suerte.
  turnosRelampago: 11,
});

// --------------------------------------------------------------- el parte
//
// El PARTE es lo que una partida deja escrito: un puñado de contadores planos.
// Sale de los eventos que el motor ya emitía —no hubo que añadir ninguno— y se
// acumula fuera del estado, así que el motor sigue siendo `(estado, acción) →
// estado` y `test/pureza.test.js` no se entera de que esto existe.
//
// El VOCABULARIO es la lista de contadores que una misión puede medir. Está
// aquí y no en la cabeza de nadie porque una misión que mida `bajass` no es un
// error de sintaxis: es una misión que nunca avanza. Lo caza `misiones.test.js`
// comparando cada `mide` contra esta lista, igual que `entradas.test.js` compara
// los campos de las mecánicas contra el suyo.

/** Un contador por clado: «despliega cinco saurópodos». */
const porClado = (clado) => `clado:${clado}`;

export const VOCABULARIO = Object.freeze([
  'partidas',      // jugadas, se ganen o no
  'victorias',
  'relampago',     // victorias en MISIONES.turnosRelampago turnos o menos
  'bajas',         // criaturas rivales derribadas
  'desplegados',   // tus criaturas que llegaron al campo
  'climas',        // climas tuyos que se impusieron
  'danoHabitat',   // daño que le hiciste al hábitat rival
  'trofeos',
  ...Object.values(CLADO).map(porClado),
]);

const ES_VOCABULARIO = new Set(VOCABULARIO);

/** Un parte vacío. Todos los contadores empiezan a cero, incluidos los clados. */
export function parteVacio() {
  const p = {};
  for (const clave of VOCABULARIO) p[clave] = 0;
  return p;
}

/**
 * Anota los eventos nuevos de un `reduce`. Se llama con lo que devuelva
 * `estado.eventos.slice(desde)`, igual que hace el animador.
 *
 * OJO con el `slice`: el motor VACÍA `estado.eventos` al empezar cada turno, así
 * que un `desde` de antes del cambio de turno se queda por encima de la lista
 * nueva y `slice` devuelve vacío. Quien llame tiene que detectarlo —la lista
 * encogió— y pasar la lista entera. Lo hace `nuevosEventos()`, aquí abajo, que
 * está para que no haya que acordarse.
 *
 * @param {object} parte  se MUTA; es un acumulador local, no estado de juego
 * @param {object[]} eventos
 * @param {number} [bando] quién eres en esta partida
 */
export function anotarEventos(parte, eventos, bando = 0) {
  const rival = bando === 0 ? 1 : 0;
  for (const e of eventos) {
    switch (e.tipo) {
      // Una criatura rival que se cae es una baja tuya. `dueno` es de quién ERA,
      // no quién la mató: matarte una propia con tu Mortandad no cuenta.
      case 'MUERTE':
        if (e.dueno === rival) parte.bajas += 1;
        break;

      // El daño al hábitat se cuenta por el bando que lo RECIBE.
      case 'HABITAT':
        if (e.bando === rival) parte.danoHabitat += e.cantidad ?? 0;
        break;

      // REVELADA y no la acción de desplegar: lo que cuenta es la criatura que
      // LLEGÓ al campo. Una carta comprometida y luego rechazada se pagó igual,
      // pero no se desplegó, y una misión que la contara mentiría.
      case 'REVELADA': {
        if (e.jugador !== bando || !existeCarta(e.cardId)) break;
        const c = carta(e.cardId);
        if (c.tipo !== TIPO.DINOSAURIO) break;
        parte.desplegados += 1;
        const clave = porClado(c.clado);
        if (clave in parte) parte[clave] += 1;
        break;
      }

      // El clima es del campo, no de un bando, pero lo pone alguien: cuenta
      // para quien lo jugó.
      case 'CAMPO':
        if (e.jugador === bando && existeCarta(e.cardId)
            && carta(e.cardId).tipo === TIPO.CLIMA) parte.climas += 1;
        break;

      default: break;
    }
  }
  return parte;
}

/**
 * Los eventos que un `reduce` acaba de añadir, con la trampa del vaciado ya
 * resuelta: si la lista encogió es que el motor cambió de turno y la vació, así
 * que lo nuevo es TODO lo que hay.
 */
export function nuevosEventos(estado, desde) {
  return estado.eventos.length >= desde ? estado.eventos.slice(desde) : estado.eventos.slice(0);
}

/**
 * Cierra el parte con lo que sólo se sabe al final. `relampago` es el único
 * contador derivado: es una victoria Y un número de turnos, y ninguna misión
 * puede pedir dos cosas —una misión mide UN contador— así que la combinación se
 * resuelve aquí, donde se ve entera.
 */
export function cerrarParte(parte, { ganada, turnos, trofeos }) {
  parte.partidas += 1;
  parte.trofeos += trofeos ?? 0;
  if (ganada) {
    parte.victorias += 1;
    if (turnos <= MISIONES.turnosRelampago) parte.relampago += 1;
  }
  return parte;
}

// ------------------------------------------------------------- el catálogo
//
// Una misión pide UN contador del vocabulario y una cantidad. Sin condiciones
// compuestas y sin ramas: lo compuesto se resuelve en el parte —ahí está
// `relampago`— porque una misión con dos condiciones es una que el jugador no
// sabe si está cumpliendo.
//
// El `premio` va por dificultad y el techo del día lo vigila un test: tres
// misiones no pueden pagar más que un sobre y medio, o abrir el juego un rato
// deja de ser un extra y pasa a ser la forma barata de tenerlo todo.

const M = (id, nombre, texto, mide, meta, premio) => Object.freeze({
  id, nombre, texto, mide, meta, premio,
});

export const CATALOGO = Object.freeze([
  // Las de jugar: se cumplen solas si juegas, y están para que un día malo
  // pague algo. Son las baratas a propósito.
  M('jugar_tres', 'Trabajo de campo', 'Juega 3 partidas', 'partidas', 3, 25),
  M('ganar_una', 'Una buena jornada', 'Gana 1 partida', 'victorias', 1, 25),
  M('ganar_dos', 'Racha', 'Gana 2 partidas', 'victorias', 2, 45),

  // Las de jugar de una MANERA: piden armar el mazo pensando en ellas, que es
  // lo que las hace valer la pena. Los números salen de una partida normal de
  // 15 turnos, donde se despliegan entre 8 y 12 criaturas.
  M('bajas_seis', 'Depredación', 'Derriba 6 criaturas rivales', 'bajas', 6, 40),
  M('habitat_diez', 'Asedio', 'Hazle 10 de daño al hábitat rival', 'danoHabitat', 10, 40),
  M('trofeos_seis', 'Registro fósil', 'Consigue 6 trofeos', 'trofeos', 6, 40),
  M('desplegar_doce', 'Ecosistema', 'Despliega 12 criaturas', 'desplegados', 12, 35),
  M('climas_tres', 'Meteorología', 'Impón 3 climas', 'climas', 3, 35),

  // Las de clado: una por familia. Empujan a probar cartas que no están en el
  // mazo de siempre, que es el otro problema del set —39 de 66 cartas fuera del
  // mazo de referencia—. Los pterosaurios y los marinos piden menos: hay muchas
  // menos cartas suyas y no caben cinco en cualquier mazo.
  M('teropodos', 'Caza mayor', 'Despliega 5 terópodos', porClado(CLADO.TEROPODO), 5, 40),
  M('sauropodos', 'Manada', 'Despliega 5 saurópodos', porClado(CLADO.SAUROPODO), 5, 40),
  M('tireoforos', 'Coraza', 'Despliega 4 tireóforos', porClado(CLADO.TIREOFORO), 4, 40),
  M('ornitopodos', 'Ramoneo', 'Despliega 5 ornitópodos', porClado(CLADO.ORNITOPODO), 5, 40),
  M('marginocefalos', 'Testarazo', 'Despliega 4 marginocéfalos', porClado(CLADO.MARGINOCEFALO), 4, 40),
  M('pterosaurios', 'Sombra en el cielo', 'Despliega 3 pterosaurios', porClado(CLADO.PTEROSAURIO), 3, 45),
  M('marinos', 'Mar de Sundance', 'Despliega 3 reptiles marinos', porClado(CLADO.MARINO), 3, 45),

  // La difícil del día. Una sola, y paga como tal.
  // El texto dice «1 partida» y no «una» a propósito: el guardián de
  // `misiones.test.js` pide que el texto cite la meta, igual que el de las
  // cartas pide que cite su número, y con la letra no lo encuentra.
  M('relampago', 'Golpe seco', `Gana 1 partida en ${MISIONES.turnosRelampago} turnos o menos`,
    'relampago', 1, 60),
]);

export const POR_ID = Object.freeze(Object.fromEntries(CATALOGO.map((m) => [m.id, m])));

export const existeMision = (id) => Object.hasOwn(POR_ID, id);
export const mideAlgoConocido = (m) => ES_VOCABULARIO.has(m.mide);

/** El nombre legible de un clado, para las pantallas. */
export const nombreDeClado = (clado) => CLADO_NOMBRE[clado] ?? clado;

// ------------------------------------------------------------ las de hoy
//
// El sorteo del día es determinista y sin estado: la misma fecha da siempre las
// mismas tres. Así no hay que guardar «qué le tocó a quién» —sólo el progreso—
// y dos jugadores del mismo día hablan de las mismas misiones.
//
// El generador NO es `src/engine/rng.js`, aunque sea el mismo mulberry32. Es
// seis líneas y traerlo de allí pondría a `src/data/` importando de
// `src/engine/`, que hoy sólo va en la otra dirección: un ciclo entre los dos
// módulos más puros del proyecto, a cambio de ahorrar seis líneas.

/** Hash estable de la fecha. FNV-1a: cabe en tres líneas y reparte bien. */
function semillaDelDia(dia) {
  let h = 0x811c9dc5;
  for (let i = 0; i < dia.length; i++) {
    h ^= dia.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h || 1;
}

function siguiente(r) {
  let t = (r + 0x6d2b79f5) >>> 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return { r: t, valor: ((x ^ (x >>> 14)) >>> 0) / 4294967296 };
}

/**
 * Las misiones de un día. `dia` es 'AAAA-MM-DD' y VIENE DEL SERVIDOR: ver la
 * decisión 3 de la cabecera.
 *
 * @param {string} dia
 * @returns {object[]} MISIONES.porDia misiones del catálogo, sin repetir
 */
export function misionesDelDia(dia) {
  const lista = CATALOGO.slice();
  let r = semillaDelDia(String(dia));
  // Fisher-Yates parcial: sólo hacen falta las tres primeras.
  const cuantas = Math.min(MISIONES.porDia, lista.length);
  for (let i = 0; i < cuantas; i++) {
    const s = siguiente(r);
    r = s.r;
    const j = i + Math.floor(s.valor * (lista.length - i));
    const tmp = lista[i];
    lista[i] = lista[j];
    lista[j] = tmp;
  }
  return Object.freeze(lista.slice(0, cuantas));
}

/** El día de hoy en UTC, 'AAAA-MM-DD'. Lo usa el servidor; el cliente NO. */
export const diaUTC = (ahora = new Date()) => ahora.toISOString().slice(0, 10);

/**
 * Lo que una partida le suma a cada misión del día. Devuelve sólo lo que avanza:
 * una misión que no se ha tocado no tiene por qué escribir una fila.
 *
 * @param {string} dia
 * @param {object} parte
 * @returns {Array<{id:string, avance:number}>}
 */
export function avancesDelParte(dia, parte) {
  return misionesDelDia(dia)
    .map((m) => ({ id: m.id, avance: parte[m.mide] ?? 0 }))
    .filter((a) => a.avance > 0);
}
