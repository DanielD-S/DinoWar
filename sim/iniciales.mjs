// ¿Están parejos los mazos iniciales?
//
//   node sim/iniciales.mjs [n]     n partidas por cruce (par; 400 por defecto)
//
// Cada mazo contra el de referencia y contra los otros dos, con bandos
// alternados y las mismas semillas: `duelo()` de sim/carta.mjs. Lo que se
// busca es que nadie elija mal sin saberlo: un inicial por encima del 55 %
// contra los otros es el que elegirá todo el mundo en cuanto se corra la voz.

import { MAZO } from '../src/data/balance.js';
import { MAZOS_INICIALES } from '../src/data/iniciales.js';
import { duelo } from './carta.mjs';

const n = Number(process.argv[2]) || 400;
const pct = (x) => `${(x * 100).toFixed(1)} %`;

console.log(`${n} partidas por cruce, bandos alternados\n`);
for (const m of MAZOS_INICIALES) {
  const r = await duelo(n, m.mazo, MAZO);
  console.log(`${m.nombre.padEnd(10)} contra referencia  ${pct(r.gana)}  (${r.turnos?.toFixed?.(1) ?? r.turnos} turnos)`);
}
console.log('');
for (let i = 0; i < MAZOS_INICIALES.length; i++) {
  for (let j = i + 1; j < MAZOS_INICIALES.length; j++) {
    const a = MAZOS_INICIALES[i];
    const b = MAZOS_INICIALES[j];
    const r = await duelo(n, a.mazo, b.mazo);
    console.log(`${a.nombre.padEnd(10)} contra ${b.nombre.padEnd(10)} ${pct(r.gana)}`);
  }
}
