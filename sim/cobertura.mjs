// DinoWar — mide TODAS las cartas, no sólo las del mazo de referencia.
//
//   node sim/cobertura.mjs            500 partidas
//   node sim/cobertura.mjs 1500
//   node sim/cobertura.mjs 500 --json
//
// `sim/run.js` juega siempre el mazo de referencia, que son 27 entradas de un
// set de 67: treinta y seis criaturas no salen nunca y sus cifras no las
// comprueba nadie. Aquí cada partida arma un mazo legal al azar del set
// entero, y de cada carta se mira cuántas veces se desplegó frente a cuántas
// veces la tuvo alguien en el mazo.
//
// El índice es esa tasa dividida por la media, así que 1 significa «se juega
// tanto como su presencia da a entender» y por debajo de 0,7 es una carta que
// se queda en la mano. Es el mismo criterio que usa run.js, medido sobre todo
// el set en vez de sobre un mazo.
//
// Además ajusta por mínimos cuadrados cuánto vale un punto de cada
// estadística. Ese número es el que dice si el «cuerpo» de una carta se puede
// sumar como A+D+V o si hay que pesarlo: si la Defensa vale cuatro veces el
// Ataque, contarlos por igual condena a cualquier carta ofensiva.

import { CARTAS, TIPO } from '../src/data/cards.js';
import { BALANCE } from '../src/data/balance.js';
import { limiteDe } from '../src/data/coleccion.js';
import { jugarPartida } from './partida.js';

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) ?? 500);
const JSON_OUT = args.includes('--json');
const ids = Object.keys(CARTAS);

/** PRNG propio: la cobertura no debe depender de la semilla de la partida. */
function prng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mazo legal al azar: tamanoMazo cartas, respetando el tope de cada rareza. */
function mazoAlAzar(rnd) {
  const mazo = {};
  let total = 0;
  for (let vueltas = 0; total < BALANCE.tamanoMazo && vueltas < 20000; vueltas++) {
    const id = ids[Math.floor(rnd() * ids.length)];
    const n = mazo[id] ?? 0;
    if (n >= limiteDe(id)) continue;
    mazo[id] = n + 1;
    total += 1;
  }
  return Object.entries(mazo);
}

const enMazo = Object.fromEntries(ids.map((i) => [i, 0]));
const jugadas = Object.fromEntries(ids.map((i) => [i, 0]));

for (let p = 0; p < N; p++) {
  const rnd = prng(1000 + p);
  // jugarPartida reparte el mismo mazo a los dos bandos, así que se sortea uno
  // por partida; la cobertura sale de que son cientos de mazos distintos.
  const mazo = mazoAlAzar(rnd);
  for (const [id, n] of mazo) enMazo[id] += n * 2;

  const { estado } = jugarPartida(9000 + p, undefined, null, true, mazo);
  for (const inst of Object.values(estado.instancias)) {
    if (inst.ranura !== null || inst.heridas > 0 || inst.desplegadoEnTurno !== null) {
      jugadas[inst.cardId] += 1;
    }
  }
}

const filas = ids.filter((id) => enMazo[id] > 0)
  .map((id) => ({ id, c: CARTAS[id], tasa: jugadas[id] / enMazo[id] }));
const media = filas.reduce((n, f) => n + f.tasa, 0) / filas.length;
for (const f of filas) f.indice = f.tasa / media;

const bichos = filas.filter((f) => f.c.tipo === TIPO.DINOSAURIO);

/**
 * Mínimos cuadrados: indice ~ b0 + bA·A + bD·D + bV·V − bC·coste.
 * Sin librerías; son cinco incógnitas y se resuelve por Gauss.
 */
function pesos(muestra) {
  const X = muestra.map((f) => [1, f.c.ataque, f.c.defensa, f.c.vida, -f.c.coste]);
  const y = muestra.map((f) => f.indice);
  const k = 5;
  const M = Array.from({ length: k }, (_, r) => [
    ...Array.from({ length: k }, (_, c) => X.reduce((s, fila, i) => s + fila[r] * fila[c], 0)),
    X.reduce((s, fila, i) => s + fila[r] * y[i], 0),
  ]);
  for (let col = 0; col < k; col++) {
    let piv = col;
    for (let r = col; r < k; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) continue;
    for (let r = 0; r < k; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= k; c++) M[r][c] -= f * M[col][c];
    }
  }
  const b = M.map((fila, r) => (Math.abs(fila[r]) > 1e-12 ? fila[k] / fila[r] : 0));
  return { base: b[0], ataque: b[1], defensa: b[2], vida: b[3], coste: b[4] };
}

const p = pesos(bichos);
const fuera = bichos.filter((f) => f.indice < 0.7 || f.indice > 1.3);

if (JSON_OUT) {
  process.stdout.write(`${JSON.stringify({ n: N, media, pesos: p, filas: bichos }, null, 2)}\n`);
} else {
  console.log(`${N} partidas con mazos aleatorios · tasa media de despliegue ${(media * 100).toFixed(1)} %\n`);
  console.log(`${'carta'.padEnd(20)} ${'C'.padStart(2)} ${'A/D/V'.padStart(7)} ${'índice'.padStart(6)}`);
  console.log('-'.repeat(40));
  for (const f of bichos.slice().sort((a, b) => a.indice - b.indice)) {
    const marca = (f.indice < 0.7 || f.indice > 1.3) ? ' <<' : '';
    const adv = `${f.c.ataque}/${f.c.defensa}/${f.c.vida}`;
    console.log(`${f.id.padEnd(20)} ${String(f.c.coste).padStart(2)} ${adv.padStart(7)} ${f.indice.toFixed(2).padStart(6)}${marca}`);
  }
  console.log(`\ncriaturas fuera de banda: ${fuera.length} de ${bichos.length}`);
  console.log('\nlo que vale un punto de cada cosa:');
  console.log(`  Ataque   ${p.ataque.toFixed(3)}`);
  console.log(`  Defensa  ${p.defensa.toFixed(3)}`);
  console.log(`  Vida     ${p.vida.toFixed(3)}`);
  console.log(`  coste    −${p.coste.toFixed(3)}`);
  if (p.ataque > 0) {
    console.log(`\nen unidades de Ataque:  1 A = 1,00 · 1 D = ${(p.defensa / p.ataque).toFixed(2)} · 1 V = ${(p.vida / p.ataque).toFixed(2)}`);
    console.log(`el «cuerpo» de una carta no es A+D+V sino A + ${(p.defensa / p.ataque).toFixed(1)}·D + ${(p.vida / p.ataque).toFixed(1)}·V`);
  }
}
