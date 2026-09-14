// DinoWar — las Expediciones: el solitario como un camino de rivales.
//
// Antes el solitario era un solo rival —el mazo de referencia— con dos
// cabezas: «Fácil» jugaba al azar y «Normal» con la heurística. Se sentía
// plano porque lo era. Ahora cada formación geológica es un mapa con rivales
// en fila, cada uno con SU mazo y su manera de jugar, y ganar a uno abre el
// siguiente. La dificultad la da el camino, no un botón.
//
// Es un fichero de DATOS, como las misiones y las ligas, y lo usan los dos
// lados: el navegador para pintar el mapa y el servidor para re-jugar. Por
// eso el mazo del rival NUNCA viaja en la petición: el navegador manda el id
// del nodo y el servidor busca aquí el mazo. Si lo mandara el cliente,
// cualquiera jugaría contra cincuenta y cinco cartas elegidas para perder.
//
// Los perfiles van como texto y no importando `PERFIL` de la IA: `src/data/`
// no depende del motor. `test/expediciones.test.js` comprueba que existen.

import { carta } from './cards.js';
import { BALANCE } from './balance.js';

/** La familia de Biomasa con la que se completa un mazo, en este orden. */
const RELLENO = ['biomasa', 'araucarias', 'cicadas', 'ginkgos', 'equisetos', 'galeria', 'helechal'];

/** Tope de copias, con el propio de la Pradera. */
const topeDe = (id) => carta(id).copiasMax ?? BALANCE.copiasPorRareza[carta(id).rareza];

/**
 * Completa un mazo temático hasta las cartas exactas con Biomasa común. Un
 * rival se escribe por lo que lo hace distinto, no por su relleno: así cada
 * mazo cabe en tres líneas y se lee de qué va.
 */
function completar(lista) {
  const cuenta = new Map(lista.map(([id, n]) => [id, n]));
  let total = [...cuenta.values()].reduce((a, b) => a + b, 0);
  for (const id of RELLENO) {
    while (total < BALANCE.tamanoMazo && (cuenta.get(id) ?? 0) < topeDe(id)) {
      cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
      total += 1;
    }
  }
  return Object.freeze([...cuenta.entries()].map((e) => Object.freeze(e)));
}

const rival = (o) => Object.freeze({ ...o, mazo: completar(o.mazo) });

// ------------------------------------------------------------ la Morrison

export const EXPEDICIONES = Object.freeze([
  Object.freeze({
    id: 'morrison',
    nombre: 'Formación Morrison',
    era: 'Jurásico Superior · 155–148 Ma',
    mapa: 'mapa_morrison',
    rivales: Object.freeze([
      // El ORDEN sale de medirlos (`node sim/expediciones.mjs`), no de cómo
      // suenan: el rebaño de saurópodos parecía un cuarto nodo y resultó más
      // duro que el clan de Ceratosaurus. Jugar con cabeza apenas endurece un
      // mazo flojo —el muro pasa del 99 % al 95 %—: la dificultad la da el mazo.
      rival({
        id: 'cria_dryosaurus',
        nombre: 'La cría de Dryosaurus',
        lema: 'Muchos, pequeños y nerviosos. Corren más de lo que pegan.',
        retrato: 'dryosaurus',
        perfil: 'aleatoria',
        premio: 30,
        mazo: [
          ['dryosaurus', 3], ['eosinopteryx', 3], ['bienosaurus', 3], ['troodon', 3],
          ['platyceratops', 3], ['liaoceratops', 3], ['shuangmiaosaurus', 3], ['athenar', 3],
          ['nido', 3], ['insectos', 3], ['sabana_helechos', 3], ['gregarismo', 3],
        ],
      }),
      rival({
        id: 'muro_de_placas',
        nombre: 'El muro de placas',
        lema: 'Tireóforos que no avanzan: esperan a que te rompas contra ellos.',
        retrato: 'stegosaurus',
        perfil: 'heuristica',
        premio: 40,
        mazo: [
          ['stegosaurus', 3], ['kentrosaurus', 3], ['bienosaurus', 3], ['loricatosaurus', 3],
          ['gargoyleosaurus', 3], ['invictarx', 3], ['nodosaurus', 2], ['euoplocephalus', 3],
          ['gastrolitos', 2], ['fractura', 2], ['canal_trenzado', 3], ['rebrote', 3],
        ],
      }),
      rival({
        id: 'cazadores_de_orilla',
        nombre: 'Cazadores de orilla',
        lema: 'Terópodos pequeños en jauría. Si los dejas crecer, muerden.',
        retrato: 'ornitholestes',
        perfil: 'heuristica',
        premio: 50,
        mazo: [
          ['ornitholestes', 3], ['ceratosaurus', 3], ['dromaeosaurus', 3], ['troodon', 3],
          ['velociraptor', 3], ['ojoraptorsaurus', 3], ['halszkaraptor', 3], ['tongtianlong', 3],
          ['allosaurus', 2], ['riparovenator', 2], ['trampa', 3], ['fractura', 2],
          ['gregarismo', 3], ['crecimiento_acelerado', 1],
        ],
      }),
      rival({
        id: 'clan_ceratosaurus',
        nombre: 'El clan de Ceratosaurus',
        lema: 'Todo dientes y ninguna paciencia. Si sobrevives al turno 5, es tuyo.',
        retrato: 'ceratosaurus',
        perfil: 'heuristica',
        premio: 60,
        mazo: [
          ['ceratosaurus', 3], ['ornitholestes', 3], ['allosaurus', 3], ['torvosaurus', 2],
          ['riparovenator', 2], ['dromaeosaurus', 3], ['velociraptor', 3], ['monolophosaurus', 3],
          ['carnotaurus', 2], ['fractura', 2], ['competencia', 2], ['gregarismo', 3],
          ['trampa', 2],
        ],
      }),
      rival({
        id: 'lago_toodichi',
        nombre: 'El lago T’oo’dichi’',
        lema: 'Lo que vuela y lo que nada. Llegan por donde no miras.',
        retrato: 'huaxiadraco',
        perfil: 'heuristica',
        premio: 80,
        mazo: [
          ['plesiopleurodon', 2], ['scanisaurus', 3], ['elasmosaurus', 3], ['huaxiadraco', 3],
          ['pteranodon', 3], ['quetzalcoatlus', 2], ['halszkaraptor', 3], ['suchomimus', 2],
          ['lago', 2], ['humedal', 2], ['inundacion', 3], ['canal_trenzado', 2],
        ],
      }),
      rival({
        id: 'rebano_de_cuellos',
        nombre: 'El rebaño de cuellos largos',
        lema: 'Saurópodos que se curan y no se caen. Hay que ganarles por fósiles.',
        retrato: 'diplodocus',
        perfil: 'heuristica',
        premio: 100,
        mazo: [
          ['diplodocus', 3], ['apatosaurus', 3], ['camarasaurus', 3], ['amargasaurus', 3],
          ['plateosauravus', 3], ['athenar', 2], ['atlasaurus', 2], ['mamenchisaurus', 3],
          ['brachiosaurus', 1], ['gastrolitos', 2], ['canal_trenzado', 3], ['sabana', 1],
          ['rebrote', 3],
        ],
      }),
      rival({
        id: 'cantera_cleveland',
        nombre: 'La cantera Cleveland-Lloyd',
        lema: 'El barro se lo traga todo. Cuida tu mazo: aquí se pierde por extinción.',
        retrato: 'allosaurus',
        perfil: 'heuristica',
        premio: 120,
        mazo: [
          ['trampa', 3], ['mortandad', 1], ['deriva_arida', 2], ['inundacion', 3],
          ['aridez', 1], ['suchomimus', 2], ['quetzalcoatlus', 2], ['spinosaurus', 1],
          ['allosaurus', 3], ['ceratosaurus', 3], ['stegoceras', 3], ['gargoyleosaurus', 3],
          ['manada_paso', 3], ['dryosaurus', 3], ['huaxiadraco', 3],
        ],
      }),
      rival({
        id: 'big_al',
        nombre: 'Big Al',
        lema: 'El Allosaurus más famoso de la Morrison: diecinueve heridas y ninguna le paró.',
        retrato: 'allosaurus',
        perfil: 'heuristica',
        premio: 200,
        mazo: [
          ['allosaurus', 3], ['torvosaurus', 2], ['tyrannotitan', 1], ['ceratosaurus', 3],
          ['ornitholestes', 3], ['stegosaurus', 3], ['nodosaurus', 2], ['diplodocus', 3],
          ['apatosaurus', 3], ['camarasaurus', 2], ['lokiceratops', 1],
          ['crecimiento_acelerado', 1], ['neumaticidad', 2], ['fractura', 2], ['gregarismo', 3],
          ['trampa', 3], ['gastrolitos', 2], ['sabana', 1],
        ],
      }),
    ]),
  }),
]);

// ------------------------------------------------------- los de la semana

/**
 * Visitantes de otras eras. Uno por semana, fuera del camino: no abre nada ni
 * lo cierra nada, y paga su premio una vez por semana. La semana la cuenta el
 * servidor desde el día UTC, como las misiones: con la fecha del navegador,
 * adelantar el reloj traería al de la semana que viene.
 */
export const VISITANTES = Object.freeze([
  rival({
    id: 'visitante_tyrannosaurus',
    nombre: 'El rey de Hell Creek',
    lema: 'Sesenta y seis millones de años de adelanto, y hambre de todos ellos.',
    retrato: 'tyrannosaurus',
    perfil: 'heuristica',
    premio: 150,
    mazo: [
      // Sin Triceratops ni Ankylosaurus: con ellos se le ganaba el 37 % y los
      // otros visitantes rondan el 50 %. Rotan por semana y tienen que costar
      // parecido, que si no la semana del rey es la semana de no jugar.
      ['tyrannosaurus', 1], ['liaoceratops', 2], ['stegoceras', 1], ['pachycephalosaurus', 3],
      ['parasaurolophus', 3], ['edmontosaurus', 1], ['quetzalcoatlus', 2], ['troodon', 3],
      ['dromaeosaurus', 3], ['velociraptor', 3], ['chasmosaurus', 3], ['euoplocephalus', 3],
      ['fractura', 2], ['bosque_ribereno', 2], ['crecimiento_acelerado', 1],
    ],
  }),
  rival({
    id: 'visitante_spinosaurus',
    nombre: 'El señor del Kem Kem',
    lema: 'Del río no sale nada vivo. Tampoco tus cartas.',
    retrato: 'spinosaurus',
    perfil: 'heuristica',
    premio: 150,
    mazo: [
      ['spinosaurus', 1], ['suchomimus', 2], ['carnotaurus', 2], ['sanjuansaurus', 3],
      // Con Allosaurus en vez de Scanisaurus y los eventos de presión se le gana
      // el 52 %; como estaba al principio, el 73 %, la semana regalada.
      ['elasmosaurus', 3], ['allosaurus', 3], ['plesiopleurodon', 2], ['torvosaurus', 2],
      ['fractura', 2], ['competencia', 1], ['crecimiento_acelerado', 1],
      ['trampa', 3], ['inundacion', 3], ['lago', 2], ['humedal', 2], ['vega', 2],
    ],
  }),
  rival({
    id: 'visitante_mosasaurus',
    nombre: 'Lo que sube del mar',
    lema: 'Un mar interior entero detrás. Aguanta la marea o te arrastra.',
    retrato: 'mosasaurus',
    perfil: 'heuristica',
    premio: 150,
    mazo: [
      ['mosasaurus', 1], ['elasmosaurus', 3], ['plesiopleurodon', 2], ['scanisaurus', 3],
      ['quetzalcoatlus', 2], ['pteranodon', 3], ['huaxiadraco', 3], ['argentinosaurus', 2],
      ['amargasaurus', 3], ['canal_trenzado', 3], ['gastrolitos', 2], ['manada_paso', 3],
      ['manantial', 1],
    ],
  }),
]);

/** Número de semana desde el 1 de enero de 1970 (UTC), a partir de 'AAAA-MM-DD'. */
export function semanaDe(dia) {
  const ms = Date.parse(`${dia}T00:00:00Z`);
  if (!Number.isFinite(ms)) throw new Error(`día inválido: ${dia}`);
  // El 1 de enero de 1970 fue jueves: se desplaza para que la semana empiece en lunes.
  return Math.floor((ms / 86400000 + 3) / 7);
}

/** El visitante de la semana a la que pertenece `dia`. */
export const visitanteDe = (dia) => VISITANTES[semanaDe(dia) % VISITANTES.length];

// ----------------------------------------------------------------- consultas

const TODOS = new Map([
  ...EXPEDICIONES.flatMap((e) => e.rivales.map((r, i) => [r.id, { rival: r, expedicion: e, indice: i }])),
  ...VISITANTES.map((r) => [r.id, { rival: r, expedicion: null, indice: -1 }]),
]);

/** Un rival por su id, con la expedición a la que pertenece y su puesto; null si no existe. */
export const rivalPorId = (id) => TODOS.get(id) ?? null;

/**
 * El rival que hay que haber vencido antes, o null si es el primero del camino
 * o un visitante. El servidor lo usa para no pagar la primera victoria de un
 * nodo que aún estaba cerrado: jugarlo se puede, cobrarlo no.
 */
export function requisitoDe(id) {
  const r = rivalPorId(id);
  if (!r || r.indice <= 0) return null;
  return r.expedicion.rivales[r.indice - 1].id;
}

/**
 * La clave con la que se apunta una primera victoria. Los del camino, una vez
 * para siempre; el visitante, una vez por semana.
 */
export function claveDeVictoria(id, dia) {
  const r = rivalPorId(id);
  if (!r) return null;
  return r.expedicion ? id : `${id}@${semanaDe(dia)}`;
}

// Un mazo mal escrito no debe llegar a una partida: falla al importar, que es
// el único momento en que el error todavía es barato. Lo mismo que MAZO.
for (const [id, { rival: r }] of TODOS) {
  const total = r.mazo.reduce((a, [, n]) => a + n, 0);
  if (total !== BALANCE.tamanoMazo) throw new Error(`EXPEDICIONES: ${id} suma ${total} cartas`);
  for (const [cardId, n] of r.mazo) {
    if (n > topeDe(cardId)) throw new Error(`EXPEDICIONES: ${id} lleva ${n} ${cardId} y admite ${topeDe(cardId)}`);
  }
  carta(r.retrato);
}
