// DinoWar — mide los ARQUETIPOS, que es lo que `sim/carta.mjs` no puede.
//
//   node sim/arquetipos.mjs           400 partidas por cruce
//   node sim/arquetipos.mjs 1000
//
// Por qué existe. `sim/carta.mjs` responde «¿esta carta está rota?» metiéndola
// en el mazo de REFERENCIA, y eso tiene un punto ciego que se midió a pulso:
// la Ceniza volcánica sale al 45,3 % y la Trampa de depredadores, que lleva
// meses en el set, al 46,0 %. No es que las dos sean malas — es que el mazo de
// referencia gana por hábitat y por trofeos a los once turnos, con la extinción
// en el 0 %, así que quitarle cartas a un mazo que nunca se acaba no hace nada.
// Medir molienda ahí es medirla en el único sitio donde no sirve.
//
// Aquí se mide lo contrario: mazos ENTEROS construidos alrededor de una idea,
// unos contra otros. Es la única forma de saber si la vía de la extinción —cero
// por ciento desde la v2— existe de verdad o sólo está escrita en las cartas.
//
// Lo que sale no es un porcentaje, son DOS cosas, y la segunda importa más:
// cuánto gana cada mazo, y POR QUÉ vía gana. Un mazo de molienda que gane el
// 55 % por hábitat no ha abierto ninguna vía: ha construido otro mazo de daño.

import { pathToFileURL } from 'node:url';
import { MAZO, BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';
import { limiteDe, legendariasDinoEn } from '../src/data/coleccion.js';
import { jugar } from './expediciones.mjs';

// --------------------------------------------------------------- los mazos

/**
 * MOLIENDA. La apuesta: vaciar el mazo del rival antes de que te mate.
 *
 * Las tres cartas que lo sostienen —Ceniza, Barrera y Sedimento— muerden 38 y
 * no te cuestan ni una carta propia, que es lo que las separa de la Trampa y
 * de la Inundación: ésas muelen a los dos y en un mazo que va a durar quince
 * turnos te matan a ti primero. Por eso no están aquí, aunque sean las que el
 * set tenía de antes.
 *
 * El resto es MURO. «Un mazo que sólo muele no gana, y encima estorba» está
 * medido desde Hell Creek —«El invierno del impacto» perdía el 82 %—: si no
 * aguantas hasta el turno doce no llegas a gastar la molienda.
 */
export const MOLIENDA = [
  // El motor: 38 cartas de mazo rival y cero propias.
  ['ceniza', 3], ['barrera_troncos', 3], ['sedimento', 2],
  // Molienda con cuerpo, que ocupa ranura y también muerde.
  ['quetzalcoatlus', 2], ['ouranosaurus', 3], ['suchomimus', 2],
  // El muro. Sin esto la molienda no llega a tiempo.
  ['brachylophosaurus', 3], ['loricatosaurus', 3], ['stegoceras', 3],
  ['apatosaurus', 3], ['camarasaurus', 3], ['mamenchisaurus', 3],
  ['medusaceratops', 2], ['atlasaurus', 2], ['antarctosaurus', 1],
  ['elasmosaurus', 3], ['diplodocus', 3], ['euoplocephalus', 2],
  // NUEVE de Biomasa, como el mazo de referencia, y no catorce. Se escribieron
  // catorce «porque un mazo lento las quiere» y está medido que no: doce gana
  // el 44,8 % y catorce el 39,8 %. Desplazan criaturas, y un mazo de molienda
  // que no aguanta no llega a gastar la molienda.
  ['biomasa', 5], ['araucarias', 2], ['cicadas', 2],
];

/**
 * ENTIERRO. La respuesta a la molienda, y la razón de ser de la ronda del
 * rebote: devolver del descarte al MAZO es lo único que alarga un mazo.
 *
 * Quince cartas de vuelta —Osario 6, Rugops 6, Carroñeros 3— contra las 38 que
 * muerde el de enfrente. No basta para ignorarla, y es a propósito: si bastara,
 * la vía quedaría cerrada otra vez y por el otro lado.
 *
 * Gana por hábitat: Carcharodontosaurus y Tupandactylus pegan sin pasar por el
 * combate, que es lo que un muro no puede parar.
 */
export const ENTIERRO = [
  ['osario', 3], ['carroneros', 3], ['rugops', 3],
  ['oleada', 3], ['carcharodontosaurus', 1], ['tupandactylus', 2],
  ['brachylophosaurus', 3], ['loricatosaurus', 3], ['stegoceras', 3],
  ['apatosaurus', 3], ['euoplocephalus', 3], ['parasaurolophus', 3],
  ['triceratops', 2], ['wendiceratops', 2], ['argentinosaurus', 2],
  ['giraffatitan', 1], ['nodosaurus', 2], ['mamenchisaurus', 3],
  ['medusaceratops', 1],
  ['biomasa', 5], ['araucarias', 2], ['cicadas', 2],
];

/**
 * CONTROL. La ronda de la mano: que el rival no llegue a jugar lo que tiene.
 * Está aquí para la misma pregunta que las otras dos — si quince cartas de
 * control de mano cambian una partida o sólo la decoran.
 */
export const CONTROL = [
  ['tormenta_polvo', 3], ['avenida_lodo', 2], ['bosque_ribereno', 2],
  ['cauce_abandonado', 3], ['enterramiento', 3],
  ['anzu', 3], ['gallimimus', 3], ['allosaurus', 3], ['tyrannosaurus', 1],
  ['dakotaraptor', 2], ['deinocheirus', 2], ['thescelosaurus', 3],
  ['shuvuuia', 3], ['psittacosaurus', 3], ['velociraptor', 3],
  ['dromaeosaurus', 3], ['carnotaurus', 2], ['ornitholestes', 2],
  ['biomasa', 5], ['araucarias', 2], ['cicadas', 2],
];

export const ARQUETIPOS = Object.freeze({
  REFERENCIA: MAZO.map((e) => [...e]),
  MOLIENDA, ENTIERRO, CONTROL,
});

// ------------------------------------------------------------ la medición

/** Un mazo legal: 55 exactas, ninguna por encima de su tope, 3 legendarias. */
export function problemasDe(mazo) {
  const mal = [];
  const total = mazo.reduce((n, [, c]) => n + c, 0);
  if (total !== BALANCE.tamanoMazo) mal.push(`suma ${total} y no ${BALANCE.tamanoMazo}`);
  for (const [id, c] of mazo) {
    if (!CARTAS[id]) mal.push(`${id} no existe`);
    else if (c > limiteDe(id)) mal.push(`${id} lleva ${c} y su tope es ${limiteDe(id)}`);
  }
  const leg = legendariasDinoEn(mazo);
  if (leg > BALANCE.legendariasDinoPorMazo) {
    mal.push(`${leg} criaturas legendarias y el tope es ${BALANCE.legendariasDinoPorMazo}`);
  }
  return mal;
}

/** Cruza dos mazos con bandos alternados y devuelve victorias y vías. */
export function cruzar(mazoA, mazoB, n) {
  let gana = 0;
  let turnos = 0;
  const vias = {};
  for (let p = 0; p < n; p++) {
    const r = jugar(77000 + Math.floor(p / 2), p % 2, mazoB, 'heuristica', mazoA);
    if (r.gana) gana += 1;
    turnos += r.turnos;
    const clave = `${r.gana ? '+' : '-'}${r.motivo}`;
    vias[clave] = (vias[clave] ?? 0) + 1;
  }
  return { gana: gana / n, turnos: turnos / n, vias, n };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = Number(process.argv[2]) || 400;
  const pares = n % 2 === 0 ? n : n + 1;
  const nombres = Object.keys(ARQUETIPOS);

  let roto = false;
  for (const [nombre, mazo] of Object.entries(ARQUETIPOS)) {
    const mal = problemasDe(mazo);
    if (mal.length) { roto = true; process.stdout.write(`${nombre}: ${mal.join('; ')}\n`); }
  }
  if (roto) process.exit(1);

  process.stdout.write(`${pares} partidas por cruce, bandos alternados.\n\n`);
  process.stdout.write(`${'mazo'.padEnd(12)}${'contra'.padEnd(12)}  gana   turnos  vías (+ las suyas, − las del rival)\n`);
  for (const a of nombres) {
    for (const b of nombres) {
      if (a === b) continue;
      const r = cruzar(ARQUETIPOS[a], ARQUETIPOS[b], pares);
      const vias = Object.entries(r.vias).sort((x, y) => y[1] - x[1])
        .map(([k, v]) => `${k} ${Math.round((100 * v) / pares)}%`).join('  ');
      process.stdout.write(`${a.padEnd(12)}${b.padEnd(12)}${`${(100 * r.gana).toFixed(1)} %`.padStart(7)}`
        + `${r.turnos.toFixed(1).padStart(9)}  ${vias}\n`);
    }
  }
  process.stdout.write('\nLo que hay que mirar no es el porcentaje: es si aparece EXTINCION.\n');
}
