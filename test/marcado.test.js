// Las clases de PANTALLA no pueden aterrizar en un trozo de texto.
//
// `.meta` es la clase de las pantallas de colección, sobres y mazos, y lleva
// `background: var(--fondo)`: una pantalla entera tiene que tapar lo que haya
// debajo. El tope de trofeos del marcador —el «/10» que va detrás del número—
// se escribió también como `class="meta"`, por el `data-meta` que lo rellena,
// y se llevó el fondo opaco con él: un rectángulo negro de cinco píxeles
// pintado encima del cuero de la cinta, visible sólo desde que la cinta tiene
// cuero. El hábitat hacía lo mismo con su «/70» y usaba `tope`, que no choca
// con nada; ahora los dos topes usan `tope`.
//
// Un fallo así no lo caza ningún test de motor: el juego funciona, las cifras
// son correctas y sólo se ve mirando la pantalla. Por eso el guardián mira el
// marcado.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

/** Cada etiqueta de apertura con `class`, ENTERA: los atributos que se miran
    —`data-meta`— van detrás de la clase, así que recortar el tag en el atributo
    de clase los dejaba fuera y el guardián no veía ninguno. */
function elementosConClase() {
  const salida = [];
  for (const m of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const clase = m[2].match(/\bclass="([^"]*)"/);
    if (!clase) continue;
    salida.push({ etiqueta: m[1].toLowerCase(), clases: clase[1].trim().split(/\s+/), tag: m[0] });
  }
  return salida;
}

test('La clase `meta` sólo la llevan pantallas, que es a lo que pinta el fondo', () => {
  for (const e of elementosConClase()) {
    if (!e.clases.includes('meta')) continue;
    assert.ok(e.etiqueta === 'section' && e.clases.includes('pantalla'),
      `«${e.tag}» lleva la clase de pantalla \`meta\`, y con ella un fondo `
      + 'opaco. Para un tope de cifra la clase es `tope`.');
  }
});

test('Los dos topes de cifra usan la misma clase', () => {
  const topes = elementosConClase().filter((e) => e.tag.includes('data-meta='));
  assert.equal(topes.length, 4, 'dos topes de trofeos y dos de hábitat');
  for (const t of topes) {
    assert.ok(t.clases.includes('tope'), `«${t.tag}» debería llevar \`tope\``);
  }
});
