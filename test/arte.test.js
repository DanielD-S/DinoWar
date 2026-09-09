// Las siluetas son el respaldo del arte, pero además son el ancla que permite
// cambiarlas por la ilustración cuando el índice llega tarde. Ese contrato
// —cada silueta dice de qué carta es— no se ve en ninguna pantalla, así que se
// rompe sin que nada chille: de ahí este test.

import test from 'node:test';
import assert from 'node:assert/strict';

import { arte } from '../src/ui/art.js';
import { CARTAS } from '../src/data/cards.js';

test('Toda silueta dice de qué carta es', () => {
  for (const id of Object.keys(CARTAS)) {
    const svg = arte(id);
    assert.match(svg, /^<svg /, `${id}: sin ilustración detectada, arte() debe dar la silueta`);
    assert.ok(
      svg.includes(`data-carta="${id}"`),
      `${id}: la silueta no lleva su carta, así que refrescarFotos() no podrá cambiarla`,
    );
  }
});

test('El color de bando no borra la marca de la carta', () => {
  const svg = arte('allosaurus', 'var(--rival)');
  assert.ok(svg.includes('data-carta="allosaurus"'));
  assert.ok(svg.includes('var(--rival)'));
});
