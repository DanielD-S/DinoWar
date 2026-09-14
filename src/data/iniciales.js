// DinoWar — los mazos iniciales: lo que se elige al crear la cuenta.
//
// Antes todo jugador nuevo recibía el mismo mazo, el de referencia. Ahora
// elige uno de tres, cada uno de un clado, y esa elección es su colección de
// salida entera. Los otros dos no se regalan: se podrán ganar más adelante
// (con misiones), que es lo que le da valor a haber elegido.
//
// Es un fichero de DATOS, como las expediciones, y lo usan los dos lados: el
// navegador para pintar la elección y el generador del catálogo para escribir
// las filas que siembra el servidor. El servidor no se fía del cliente: recibe
// un id y busca aquí el mazo.
//
// Los tres llevan el MISMO soporte y la misma Biomasa que el mazo de
// referencia, y sólo cambian las 28 criaturas. Así lo que mide
// `node sim/iniciales.mjs` es el clado, no una lista de eventos distinta.

import { MAZO } from './balance.js';
import { BALANCE } from './balance.js';
import { carta, TIPO } from './cards.js';

/** Lo del mazo de referencia que no es criatura: soporte y Biomasa. */
const SOPORTE = Object.freeze(MAZO.filter(([id]) => carta(id).tipo !== TIPO.DINOSAURIO));

const inicial = (o) => Object.freeze({
  ...o,
  mazo: Object.freeze([...o.criaturas, ...SOPORTE].map((e) => Object.freeze([...e]))),
});

export const MAZOS_INICIALES = Object.freeze([
  inicial({
    id: 'teropodos',
    nombre: 'Cazadores',
    clado: 'TEROPODO',
    retrato: 'tyrannotitan',
    lema: 'Golpean primero y fuerte. Si la partida se alarga, se quedan sin dientes.',
    // Con dos Troodon ganaba el 39 % a la referencia: se deshacía antes de
    // pegar. Con Suchomimus y Therizinosaurus a la vez, el 68 %. Sólo el
    // Therizinosaurus —1/6, un cuerpo que aguanta— lo deja en el 49 %.
    criaturas: [
      ['ornitholestes', 3], ['ceratosaurus', 3], ['dromaeosaurus', 3], ['velociraptor', 3],
      ['therizinosaurus', 2], ['ojoraptorsaurus', 2], ['sanjuansaurus', 3], ['allosaurus', 3],
      ['riparovenator', 2], ['carnotaurus', 2], ['torvosaurus', 1], ['tyrannotitan', 1],
    ],
  }),
  inicial({
    id: 'sauropodos',
    nombre: 'Gigantes',
    clado: 'SAUROPODO',
    retrato: 'brachiosaurus',
    lema: 'Muros de Vida que no se caen. Ganan aguantando, no persiguiendo.',
    // Veintitrés muros ganaban el 69 % a la referencia y a los otros dos
    // iniciales. Con menos Apatosaurus, Camarasaurus y Atlasaurus y más
    // terópodos pequeños que pegan, el 56 %; con un Mamenchisaurus menos, se
    // caía al 48 % y perdía contra los dos.
    criaturas: [
      ['plateosauravus', 3], ['athenar', 3], ['amargasaurus', 3], ['diplodocus', 3],
      ['apatosaurus', 2], ['camarasaurus', 2], ['mamenchisaurus', 3], ['atlasaurus', 1],
      ['brachiosaurus', 1], ['ceratosaurus', 3], ['velociraptor', 3], ['ornitholestes', 1],
    ],
  }),
  inicial({
    id: 'ornitopodos',
    nombre: 'Manadas',
    clado: 'ORNITOPODO',
    retrato: 'maiasaura',
    lema: 'Muchos y resistentes. Llenan el campo antes de que el rival se dé cuenta.',
    // Sólo hay ocho ornitópodos en el set, así que se completa con terópodos
    // pequeños; los ornitópodos siguen siendo el clado dominante (19 de 28) y
    // el emblema es el suyo. Un Allosaurus en vez de un Ornitholestes lo sube
    // del 42 al 44,5 %; con dos, al 54 % y por encima de los otros iniciales.
    criaturas: [
      ['dryosaurus', 3], ['shuangmiaosaurus', 3], ['iguanodon', 3], ['brachylophosaurus', 3],
      ['parasaurolophus', 3], ['rhinorex', 2], ['maiasaura', 1], ['edmontosaurus', 1],
      ['pachycephalosaurus', 2], ['allosaurus', 1], ['ornitholestes', 1], ['velociraptor', 3],
      ['ceratosaurus', 2],
    ],
  }),
]);

export const inicialPorId = (id) => MAZOS_INICIALES.find((m) => m.id === id) ?? null;

// Un mazo inicial mal escrito le daría a un jugador nuevo una colección con la
// que no puede jugar: falla al importar, que es cuando el error es barato.
for (const m of MAZOS_INICIALES) {
  if (!m.mazo.some(([id]) => id === m.retrato)) {
    throw new Error(`MAZOS_INICIALES: ${m.id} se retrata con «${m.retrato}» y no la lleva`);
  }
  const total = m.mazo.reduce((a, [, n]) => a + n, 0);
  if (total !== BALANCE.tamanoMazo) throw new Error(`MAZOS_INICIALES: ${m.id} suma ${total} cartas`);
  const vistos = new Set();
  for (const [id, n] of m.mazo) {
    const c = carta(id);
    if (!c) throw new Error(`MAZOS_INICIALES: ${m.id} lleva «${id}», que no existe`);
    if (vistos.has(id)) throw new Error(`MAZOS_INICIALES: ${m.id} repite «${id}»`);
    vistos.add(id);
    const tope = c.copiasMax ?? BALANCE.copiasPorRareza[c.rareza];
    if (n > tope) throw new Error(`MAZOS_INICIALES: ${m.id} lleva ${n} «${id}» y el tope es ${tope}`);
  }
}
