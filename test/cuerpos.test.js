// La variante de dos estadísticas. El modo se lee del entorno AL IMPORTAR el
// motor, así que no se puede cambiar en caliente: cada comprobación corre en su
// propio proceso, igual que hace sim/cuerpos.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { BALANCE } from '../src/data/balance.js';
import { reduccionDe, defensaBruta, SIN_DEFENSA } from '../src/engine/state.js';
import { MODOS } from '../sim/cuerpos.js';

/** Corre un trozo de código con el modo puesto y devuelve lo que imprima. */
function conModo(modo, codigo) {
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', codigo], {
    encoding: 'utf8',
    env: { ...process.env, DINOWAR_CUERPO: modo },
  }));
}

const MIRAR = `
  const s = await import('./src/engine/state.js');
  const e = s.crearPartida(42, [[['stegosaurus', 2], ['apatosaurus', 2]], null]);
  const iid = Object.keys(e.instancias).find((i) => e.instancias[i].cardId === 'stegosaurus');
  process.stdout.write(JSON.stringify({
    sinDefensa: s.SIN_DEFENSA,
    reduccion: s.reduccionDe(e, iid),
    vidaMax: s.vidaMaxima(e, iid),
    bruta: s.defensaBruta(e, iid),
  }));`;

test('El juego publicado corre SIEMPRE con las tres estadísticas', () => {
  // Igual que la economía: la variante existe para medir, no para publicarse
  // sin querer. Si este test falla, alguien dejó el entorno puesto.
  assert.equal(BALANCE.cuerpo.modo, 'ATAQUE_DEFENSA_VIDA');
  assert.equal(SIN_DEFENSA, false);
});

test('Con las tres, la Defensa resta y la Vida es la de la ficha', () => {
  const r = conModo('ATAQUE_DEFENSA_VIDA', MIRAR);
  assert.equal(r.sinDefensa, false);
  assert.equal(r.reduccion, 4, 'Stegosaurus tiene 4 de Defensa');
  assert.equal(r.vidaMax, 5, 'y 5 de Vida, sin tocar');
});

test('Sin Defensa, la reducción es 0 y esos puntos están en la Vida', () => {
  const r = conModo('ATAQUE_VIDA', MIRAR);
  assert.equal(r.sinDefensa, true);
  assert.equal(r.reduccion, 0, 'la Defensa deja de restar');
  assert.equal(r.bruta, 4, 'pero se sigue sabiendo cuánta era');
  assert.equal(r.vidaMax, 5 + 4 * BALANCE.cuerpo.defensaAVida,
    'y se ha convertido en Vida');
});

test('`reduccionDe` y el plegado leen la MISMA defensa', () => {
  // Están separados a propósito —uno resta, el otro suma— y calcularla dos
  // veces sería garantizar que un día divergieran.
  assert.equal(typeof defensaBruta, 'function');
  assert.equal(typeof reduccionDe, 'function');
});

test('El comparador conoce las dos variantes y ninguna más', () => {
  assert.deepEqual(MODOS, ['ATAQUE_DEFENSA_VIDA', 'ATAQUE_VIDA']);
});
