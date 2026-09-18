/**
 * La carta ENTERA: las criaturas legendarias y las de jefe van a sangre, con
 * la ilustración cubriendo la carta y el marco reducido a un filete. Lo que
 * se vigila es la frontera —qué cartas lo son y qué cartas no— y que la clase
 * sólo aparezca con foto: una silueta SVG a sangre sería un rectángulo de
 * color con un nombre encima.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARTAS, CARTAS_DE_JEFE, TIPO, RAREZA } from '../src/data/cards.js';
import { esEntera } from '../src/ui/art.js';
import { cartaHTML } from '../src/ui/render.js';

const css = readFileSync(new URL('../carta.css', import.meta.url), 'utf8');

test('son enteras exactamente las criaturas legendarias y las cinco de jefe', () => {
  for (const c of Object.values(CARTAS)) {
    const debe = c.tipo === TIPO.DINOSAURIO && c.rareza === RAREZA.LEGENDARIO;
    assert.equal(esEntera(c.id), debe, c.id);
  }
  for (const c of Object.values(CARTAS_DE_JEFE)) assert.ok(esEntera(c.id), c.id);
});

test('una legendaria de soporte NO es entera: lo que va a sangre es el animal', () => {
  const soporte = Object.values(CARTAS).filter((c) => c.tipo !== TIPO.DINOSAURIO && c.rareza === RAREZA.LEGENDARIO);
  assert.ok(soporte.length > 0, 'el set tiene legendarias de soporte');
  for (const c of soporte) assert.ok(!esEntera(c.id), c.id);
});

test('sin foto detectada la carta sale con su marco: la clase `entera` no se emite', () => {
  // En node no hay índice de fotos, así que `hayFoto` es falso para todas.
  const html = cartaHTML('tyrannosaurus', { variante: 'col' });
  assert.ok(!/class="[^"]*\bentera\b/.test(html), 'la clase entera sólo va con foto');
  assert.ok(html.includes('m-dino_legendaria'), 'el marco legendario sigue puesto de reserva');
  assert.ok(html.includes('c-velo'), 'el velo viaja siempre: la clase puede llegar con la foto');
  assert.ok(html.includes('c-fondo'), 'el fondo desenfocado también');
});

test('una carta que no puede ser entera no lleva velo', () => {
  assert.ok(!cartaHTML('allosaurus', { variante: 'col' }).includes('c-velo'));
});

test('carta.css tiene la geometría de la carta entera y apaga el marco dibujado', () => {
  assert.match(css, /\.carta\.con-marco\.entera\s*\{[^}]*--ven-alto:\s*100%/);
  assert.match(css, /\.entera \.c-marco\s*\{[^}]*background-image:\s*none/);
  assert.match(css, /\.entera \.c-cuerpo\s*\{[^}]*backdrop-filter/);
  assert.match(css, /\.entera \.c-velo\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.entera \.c-arte \.foto\s*\{[^}]*object-fit:\s*contain/, 'la foto apaisada va entera, no recortada');
  assert.match(css, /\.entera \.c-fondo\s*\{[^}]*blur/);
});
