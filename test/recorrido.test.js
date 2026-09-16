// El recorrido de la ficha: la lista sale del DOM, y por eso puede salir DOBLE.
//
// `cartaHTML()` pone `data-card` en la propia carta. Las celdas que la envuelven
// —`.col-carta` en la colección, `.sobre-carta` en la tirada, `.mazo-celda` en
// el editor— lo ponen OTRA VEZ en el envoltorio, porque el toque tiene que
// funcionar también sobre el pie con el nombre y el contador.
//
// Consecuencia: un `querySelectorAll('[data-card]')` a secas devuelve el mismo
// id dos veces por cada carta que tienes —la de fuera y la de dentro—, y como
// `indexOf` da siempre la primera, el botón «siguiente» cae en el gemelo. Se
// veía en pantalla como «238 / 241» y «239 / 241» con la misma carta, y el
// total decía 241 cuando el set tiene 144.
//
// No lo caza ningún test de motor: las cifras son correctas, la carta es
// correcta, y lo único que está mal es cuántas veces sale. Por eso el guardián
// mira el código: toda lista de recorrido tiene que acotarse a la CELDA.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/** Los ficheros que construyen un recorrido para `abrirFicha`. */
const FICHEROS = ['src/ui/meta.js', 'src/ui/mazos.js'];

/**
 * El fichero sin comentarios. Hace falta: el propio aviso de meta.js explica
 * el fallo CITANDO la llamada mala, y sin esto el guardián se caza a sí mismo
 * leyendo la explicación de por qué existe.
 */
const codigo = (f) => readFileSync(f, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').map((l) => l.replace(/(^|[^:])\/\/.*$/, '$1')).join('\n');

test('ninguna lista de recorrido se lee con `[data-card]` a secas', () => {
  for (const f of FICHEROS) {
    const src = codigo(f);
    // `querySelectorAll('[data-card]')` sin nada delante del corchete: eso
    // recoge el envoltorio Y la carta de dentro.
    const sueltos = [...src.matchAll(/querySelectorAll\(\s*(['"`])\[data-card\][^'"`]*\1/g)];
    assert.equal(sueltos.length, 0,
      `${f} lee el recorrido con '[data-card]' a secas: devolverá cada carta`
      + ' dos veces, porque cartaHTML() también lo emite. Acótalo a la celda'
      + " (por ejemplo '.col-carta[data-card]').");
  }
});

test('cada recorrido se acota a una celda que existe en su plantilla', () => {
  const meta = codigo('src/ui/meta.js');
  const mazos = codigo('src/ui/mazos.js');
  for (const [src, celda, fichero] of [
    [meta, '.col-carta[data-card]', 'src/ui/meta.js'],
    [meta, '.sobre-carta[data-card]', 'src/ui/meta.js'],
    [mazos, '.mazo-celda[data-card]', 'src/ui/mazos.js'],
  ]) {
    assert.ok(src.includes(celda), `${fichero} ya no acota con ${celda}`);
    // Y la clase de la celda tiene que existir de verdad en la plantilla que
    // ese mismo fichero pinta: un selector que no casa con nada deja la ficha
    // sin recorrido y sin decirlo.
    // La clase puede no ir la primera —la celda del editor es
    // `class="col-carta mazo-celda …"`— así que se busca dentro del atributo.
    const clase = celda.slice(1, celda.indexOf('['));
    const enAlgunaClase = new RegExp(`class="[^"]*\\b${clase}\\b`).test(src);
    assert.ok(enAlgunaClase,
      `${fichero} acota con ${celda} pero no pinta ninguna ${clase}`);
  }
});

test('la carta que emite cartaHTML lleva data-card, que es de donde viene el lío', () => {
  const render = readFileSync('src/ui/render.js', 'utf8');
  assert.ok(/class="\$\{clasesCarta\([^)]*\)\}" data-card=/.test(render),
    'cartaHTML() ya no emite data-card: si se quitó, este guardián y los'
    + ' selectores acotados de meta.js y mazos.js sobran — pero compruébalo,'
    + ' que el toque sobre la carta depende de ese atributo.');
});
