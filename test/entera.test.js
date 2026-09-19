/**
 * La carta ENTERA —a sangre— y los marcos dibujados, que son lo que se pelea
 * con ella: una la enmarca y la otra le quita el marco, y ninguna carta puede
 * ser las dos cosas a la vez. Pasó dos veces: las legendarias dejaron de ir a
 * sangre el 18-09-2026 y las cinco de jefe el 19, las dos al estrenar marco
 * propio, y las dos veces ganó el marco.
 *
 * Así que HOY no hay ninguna carta entera, y eso es lo primero que se vigila.
 * Lo segundo es que la maquinaria siga en pie: es el molde del cosmético de
 * «arte alternativo» y encenderla es añadir un id a `ENTERAS`, así que el CSS
 * y el velo tienen que sobrevivir intactos a quien pase por aquí a limpiar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CARTAS, CARTAS_DE_JEFE } from '../src/data/cards.js';
import { esEntera } from '../src/ui/art.js';
import { cartaHTML } from '../src/ui/render.js';

const css = readFileSync(new URL('../carta.css', import.meta.url), 'utf8');

test('hoy NINGUNA carta va a sangre: las de jefe fueron las últimas', () => {
  for (const c of Object.values(CARTAS)) assert.equal(esEntera(c.id), false, c.id);
  for (const c of Object.values(CARTAS_DE_JEFE)) assert.equal(esEntera(c.id), false, c.id);
});

test('una legendaria del set NO es entera: lleva su marco', () => {
  const html = cartaHTML('tyrannosaurus', { variante: 'col' });
  assert.ok(!/class="[^"]*\bentera\b/.test(html));
  assert.ok(!html.includes('c-velo'), 'ni el velo, que sólo viaja en las que pueden ir a sangre');
  assert.ok(html.includes('m-dino_legendaria'));
});

test('una carta de jefe lleva su marco y ni el velo ni el fondo de la carta entera', () => {
  const html = cartaHTML('jefe_saurophaganax', { variante: 'col' });
  assert.ok(!/class="[^"]*\bentera\b/.test(html));
  assert.ok(html.includes('m-dino_jefe'), 'el marco de jefe, que desde el 19-09-2026 no es de reserva');
  assert.ok(!html.includes('c-velo'), 'el velo sólo viaja en las que pueden ir a sangre, y no hay ninguna');
  assert.ok(!html.includes('c-fondo'));
});

test('la maquinaria de la carta entera sigue entera, que es el molde del cosmético', () => {
  // Encenderla para una carta es añadir su id a `ENTERAS`: si alguien borra el
  // emisor o el CSS creyendo que sobra, esa línea deja de bastar.
  const art = readFileSync(new URL('../src/ui/art.js', import.meta.url), 'utf8');
  assert.match(art, /const ENTERAS = new Set\(\)/, 'la lista vacía es el interruptor');
  const render = readFileSync(new URL('../src/ui/render.js', import.meta.url), 'utf8');
  assert.ok(render.includes('c-velo') && render.includes('c-fondo'), 'cartaHTML sigue sabiendo emitirlos');
  assert.ok(render.includes("esEntera(cardId) && hayFoto(cardId) ? ' entera'"), 'y clasesCarta, ponerla');
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

test('las CUATRO rarezas de criatura comparten geometría, y el jefe tiene la suya', () => {
  for (const [id, clase] of [['stegosaurus', 'm-dino_comun'], ['allosaurus', 'm-dino_rara'],
    ['torvosaurus', 'm-dino_epica'], ['tyrannosaurus', 'm-dino_legendaria']]) {
    const html = cartaHTML(id, { variante: 'col' });
    assert.ok(html.includes(clase), id);
    assert.ok(html.includes('m-cria'), `${id} sin la clase que comparte la geometría`);
  }
  assert.ok(!cartaHTML('jefe_saurophaganax', { variante: 'col' }).includes('m-cria'),
    'el jefe no: su ventana es más baja porque la banda arranca abajo y la piedra del pie es más honda');
  assert.ok(!cartaHTML('trampa', { variante: 'col' }).includes('m-cria'), 'las de soporte tampoco');
  // El aro del coste es lo único que cambia de una rareza a otra, así que cada
  // una escribe el suyo —sola o compartiendo regla con la que coincide—.
  for (const r of ['comun', 'rara', 'epica', 'legendaria']) {
    assert.match(css, new RegExp(`\\.carta\\.con-marco\\.m-dino_${r}[^{]*\\{[^}]*--cos-cx:`), r);
  }
});

test('las tres familias de soporte llevan su marco, con el aro del coste dentro', () => {
  for (const [id, clase] of [['llanura', 'm-clima'], ['trampa', 'm-evento'],
    ['rebrote', 'm-recurso'], ['biomasa', 'm-recurso']]) {
    const html = cartaHTML(id, { variante: 'col' });
    assert.ok(html.includes(clase), id);
    assert.ok(html.includes('no-dino'), `${id} sin la clase que comparte la geometría`);
  }
  // Los tres marcos midieron el mismo aro dentro de medio punto, así que va una
  // sola vez y no una por familia, como sí pasa en las criaturas.
  assert.match(css, /\.carta\.con-marco\.no-dino\s*\{[^}]*--cos-cx:/);
  // Y viene dibujado: la chapa de Biomasa que lo suplía se apaga, igual que las
  // tres de las criaturas.
  assert.match(css, /\.carta\.con-marco\.no-dino \.c-chapa\s*\{\s*display:\s*none/);
  // Aquí TODO es papel pintado en el PNG —el aro del coste también, al revés
  // que en las criaturas— así que las tres tintas van oscuras.
  assert.match(css, /\.carta\.con-marco\.no-dino \.c-nombre\s*\{\s*color:\s*#38200c/);
  assert.match(css, /\.carta\.con-marco\.no-dino \.c-texto\s*\{\s*color:\s*#2e2113/);
  assert.match(css, /\.carta\.con-marco\.no-dino \.c-coste\s*\{\s*color:\s*#2b1706/);
  // La ventana sube hasta el borde: sin banda de nombre, arranca mucho más
  // arriba que la de una criatura y es más alta.
  const bloque = css.match(/\.carta\.con-marco\.no-dino\s*\{([^}]*)\}/)[1];
  assert.ok(Number(bloque.match(/--ven-y0:\s*([\d.]+)%/)[1]) < 6, 'la ventana de soporte arranca arriba');
  assert.ok(Number(bloque.match(/--ven-alto:\s*([\d.]+)%/)[1]) > 50, 'y es más alta que la de una criatura');
});

test('el marco de jefe trae sus cinco huecos en PAPEL: chapas apagadas y tinta oscura', () => {
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe\s*\{[^}]*--ven-alto:\s*40\.9%/);
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe \.c-chapa\s*\{\s*display:\s*none/);
  // Ni una cifra cae sobre hueco aquí, así que las cinco tintas van oscuras:
  // es lo contrario que en las criaturas y lo mismo que en las de soporte.
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe \.c-genero\s*\{\s*color:\s*#38200c/);
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe \.c-hab\s*\{\s*color:\s*#5d2d08/);
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe \.st-a b[^{]*\{\s*color:\s*#2b1706/);
  // Y sin chapa que cambiar, los dos estados del Ataque los cuenta el color.
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe \.st-a\.mejorado b\s*\{\s*color:/);
  assert.match(css, /\.carta\.con-marco\.m-dino_jefe \.st-a\.mermado b\s*\{\s*color:/);
});
