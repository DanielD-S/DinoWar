/**
 * Los marcos dibujados: que cada clase que puede emitir `claseMarco()` tenga su
 * fichero, y que ningún fichero sobre.
 *
 * El primer juego de marcos tenía catorce ficheros y el CSS los nombraba uno a
 * uno; al rehacerlo quedaron ocho y una clase —`m-dino_fullart`— que ninguna
 * carta usaba pero seguía en la hoja. Un marco que el CSS nombra y no existe es
 * una carta sin borde que nadie ve hasta que le toca salir; uno que existe y
 * nadie nombra son 70 KB que se descargan para nada.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { CARTAS, CARTAS_DE_JEFE, TIPO, RAREZA } from '../src/data/cards.js';

const css = readFileSync(new URL('../carta.css', import.meta.url), 'utf8');
const REGLA = /\.m-([a-z_]+)\s*\{\s*--marco:\s*url\('assets\/marcos\/([a-z_]+\.webp)'\)/g;
const reglas = new Map([...css.matchAll(REGLA)].map((m) => [m[1], m[2]]));

// Lo mismo que hace `claseMarco()` en render.js, dicho como datos.
const RAREZA_MARCO = { COMUN: 'comun', RARO: 'rara', EPICO: 'epica', LEGENDARIO: 'legendaria' };
function claseDe(c, esJefe) {
  if (esJefe) return 'dino_jefe';
  if (c.tipo === TIPO.DINOSAURIO) return `dino_${RAREZA_MARCO[c.rareza]}`;
  return c.tipo.toLowerCase();
}

test('toda carta del set tiene un marco dibujado con su fichero en disco', () => {
  const clases = new Set([
    ...Object.values(CARTAS).map((c) => claseDe(c, false)),
    ...Object.values(CARTAS_DE_JEFE).map((c) => claseDe(c, true)),
  ]);
  for (const clase of clases) {
    assert.ok(reglas.has(clase), `carta.css no tiene regla para .m-${clase}`);
    const ruta = new URL(`../assets/marcos/${reglas.get(clase)}`, import.meta.url);
    assert.ok(existsSync(ruta), `falta assets/marcos/${reglas.get(clase)} para .m-${clase}`);
  }
});

test('ningún marco en assets/marcos/ se queda sin usar', () => {
  const enDisco = readdirSync(new URL('../assets/marcos', import.meta.url)).filter((f) => f.endsWith('.webp'));
  const usados = new Set(reglas.values());
  for (const f of enDisco) assert.ok(usados.has(f), `assets/marcos/${f} no lo nombra ningún .m-* de carta.css`);
});

test('las cuatro rarezas de criatura y el jefe tienen marco propio', () => {
  for (const r of Object.values(RAREZA)) assert.ok(reglas.has(`dino_${RAREZA_MARCO[r]}`), r);
  assert.ok(reglas.has('dino_jefe'));
});
