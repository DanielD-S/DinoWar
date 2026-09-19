/**
 * La carta ENTERA: las cinco de jefe van a sangre, con la ilustración
 * cubriendo la carta y el marco reducido a un filete. Lo que se vigila es la
 * frontera —qué cartas lo son y qué cartas no— y que la clase sólo aparezca
 * con foto: una silueta SVG a sangre sería un rectángulo de color con un
 * nombre encima.
 *
 * Las criaturas LEGENDARIAS lo fueron hasta el 18-09-2026 y dejaron de serlo
 * al estrenar marco propio: las dos cosas se pelean por la misma carta, una la
 * enmarca y la otra le quita el marco. Ese test está aquí para que no vuelvan
 * a ser las dos cosas a la vez sin que alguien lo decida.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARTAS, CARTAS_DE_JEFE } from '../src/data/cards.js';
import { esEntera } from '../src/ui/art.js';
import { cartaHTML } from '../src/ui/render.js';

const css = readFileSync(new URL('../carta.css', import.meta.url), 'utf8');

test('son enteras exactamente las cinco cartas de jefe', () => {
  for (const c of Object.values(CARTAS)) assert.equal(esEntera(c.id), false, c.id);
  for (const c of Object.values(CARTAS_DE_JEFE)) assert.ok(esEntera(c.id), c.id);
});

test('una legendaria del set NO es entera: lleva su marco', () => {
  const html = cartaHTML('tyrannosaurus', { variante: 'col' });
  assert.ok(!/class="[^"]*\bentera\b/.test(html));
  assert.ok(!html.includes('c-velo'), 'ni el velo, que sólo viaja en las que pueden ir a sangre');
  assert.ok(html.includes('m-dino_legendaria'));
});

test('sin foto detectada la de jefe sale con su marco: la clase `entera` no se emite', () => {
  // En node no hay índice de fotos, así que `hayFoto` es falso para todas.
  const html = cartaHTML('jefe_saurophaganax', { variante: 'col' });
  assert.ok(!/class="[^"]*\bentera\b/.test(html), 'la clase entera sólo va con foto');
  assert.ok(html.includes('m-dino_jefe'), 'el marco de jefe sigue puesto de reserva');
  assert.ok(html.includes('c-velo'), 'el velo viaja siempre: la clase puede llegar con la foto');
  assert.ok(html.includes('c-fondo'), 'el fondo desenfocado también');
});

test('carta.css tiene la geometría de la carta entera y apaga el marco dibujado', () => {
  assert.match(css, /\.carta\.con-marco\.entera\s*\{[^}]*--ven-alto:\s*100%/);
  assert.match(css, /\.entera \.c-marco\s*\{[^}]*background-image:\s*none/);
  assert.match(css, /\.entera \.c-cuerpo\s*\{[^}]*backdrop-filter/);
  assert.match(css, /\.entera \.c-velo\s*\{[^}]*display:\s*block/);
  assert.match(css, /\.entera \.c-arte \.foto\s*\{[^}]*object-fit:\s*contain/, 'la foto apaisada va entera, no recortada');
  assert.match(css, /\.entera \.c-fondo\s*\{[^}]*blur/);
});

test('el marco de criatura trae sus huecos dentro: sus chapas se apagan', () => {
  assert.match(css, /\.carta\.con-marco\.m-cria\s*\{[^}]*--ven-alto:\s*45\.9%/);
  assert.match(css, /\.carta\.con-marco\.m-cria \.c-chapa\s*\{\s*display:\s*none/);
  // La banda y la caja son papel pintado: ahí la tinta va oscura, y las tres
  // cifras, que caen sobre hueco, se quedan en claro.
  assert.match(css, /\.carta\.con-marco\.m-cria \.c-hab\s*\{\s*color:\s*#5d2d08/);
  assert.match(css, /\.carta\.con-marco\.m-cria \.st-a b[^{]*\{\s*color:\s*#ffe9b0/);
  // Sin chapa que cambiar, los dos estados del Ataque los cuenta el color.
  assert.match(css, /\.carta\.con-marco\.m-cria \.st-a\.mejorado b\s*\{\s*color:/);
  assert.match(css, /\.carta\.con-marco\.m-cria \.st-a\.mermado b\s*\{\s*color:/);
});

test('las CUATRO rarezas de criatura llevan el marco nuevo, y el jefe no', () => {
  for (const [id, clase] of [['stegosaurus', 'm-dino_comun'], ['allosaurus', 'm-dino_rara'],
    ['torvosaurus', 'm-dino_epica'], ['tyrannosaurus', 'm-dino_legendaria']]) {
    const html = cartaHTML(id, { variante: 'col' });
    assert.ok(html.includes(clase), id);
    assert.ok(html.includes('m-cria'), `${id} sin la clase que comparte la geometría`);
  }
  assert.ok(!cartaHTML('jefe_saurophaganax', { variante: 'col' }).includes('m-cria'));
  assert.ok(!cartaHTML('trampa', { variante: 'col' }).includes('m-cria'), 'las de soporte tampoco');
  // El aro del coste es lo único que cambia de una rareza a otra.
  for (const r of ['comun', 'rara', 'epica', 'legendaria']) {
    assert.match(css, new RegExp(`\\.carta\\.con-marco\\.m-dino_${r}\\s*\\{\\s*--cos-cx:`), r);
  }
});
