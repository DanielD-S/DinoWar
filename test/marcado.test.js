// Guardianes de lo que sólo se ve en pantalla: el juego funciona, las cifras
// son correctas, los tests de motor pasan, y lo que está mal es el dibujo.
//
// ── 1 ─────────────────────────────────────────────────────────────────────
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
import { readFileSync, existsSync, readdirSync } from 'node:fs';

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

// ── 2 ─────────────────────────────────────────────────────────────────────
// Un selector con id gana a cualquier clase, así que `#campo > *` no puede
// fijar `position`.
//
// piel.css levantaba las piezas del campo por encima del velo con
// `#campo > * { position: relative }`. Esa regla vale (1,0,0) y le ganaba a
// `.anuncio { position: absolute }`, que vale (0,1,0): el cartel que
// `animate.js` cuelga del campo —la Mortandad, el clima que se impone— dejaba
// de estar fuera del flujo y pasaba a ser un hijo flex más. Las dos filas de
// ranuras reparten lo que sobra, así que encogían para hacerle sitio y el
// tablero entero daba un salto hacia arriba; y como el anuncio acaba su
// animación invisible, lo que quedaba a la vista era un hueco muerto abajo
// durante el segundo y pico que tarda en quitarse.
//
// La regla no se puede «desactivar» desde la clase: en CSS no hay forma de
// pedir que un selector no se aplique. Por eso el arreglo es nombrar las
// piezas estructurales una a una, y por eso esto es un guardián y no un
// comentario: la tentación de volver a escribir `> *` es evidente.

const HOJAS = ['style.css', 'piel.css'];

test('Ninguna regla `#id > *` fija `position`, que se la quitaría a las capas', () => {
  for (const hoja of HOJAS) {
    // SIN comentarios: la primera versión de este guardián se mordió a sí
    // misma, porque el comentario que explica el arreglo cita `#campo > *` y
    // el escaneo lo leyó como si fuera un selector.
    const css = readFileSync(hoja, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    // Selector y cuerpo de cada regla de primer nivel.
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim();
      if (!/#[\w-]+\s*>\s*\*/.test(selector)) continue;
      assert.ok(!/(^|[;\s])position\s*:/.test(m[2]),
        `«${selector}» fija \`position\` y gana por especificidad a toda clase. `
        + 'Nombra las piezas que lo necesitan en vez de usar `> *`.');
    }
  }
});

// ── 3 ─────────────────────────────────────────────────────────────────────
// Las PLACAS del menú y de la pantalla de jugar son imágenes, y el CSS las
// nombra por fichero. Una placa cuyo WebP no existe no rompe nada: el botón
// sigue ahí, se pulsa, suena y navega — sólo que sin dibujo, con el rótulo
// flotando sobre un hueco. Y al revés, un WebP que ya no usa nadie se queda
// pesando en la precarga del service worker para siempre.
//
// Es el mismo guardián que `marcos.test.js` hace con los marcos de carta, un
// piso más arriba.

const PLACAS = 'assets/piel';

test('Cada placa que declara el CSS tiene su fichero', () => {
  const css = readFileSync('style.css', 'utf8');
  const pedidas = [...css.matchAll(/--placa:\s*url\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(pedidas.length >= 8, `sólo ${pedidas.length} placas declaradas, ¿se perdió alguna?`);
  for (const ruta of new Set(pedidas)) {
    assert.ok(existsSync(ruta), `el CSS pide «${ruta}» y no está en el repositorio`);
  }
});

test('No sobra ninguna placa: lo que está servido, se usa', () => {
  const css = readFileSync('style.css', 'utf8');
  const enCss = new Set([...css.matchAll(/--placa:\s*url\('([^']+)'\)/g)]
    .map((m) => m[1].split('/').pop()));
  for (const f of readdirSync(PLACAS).filter((n) => n.startsWith('placa_') && n.endsWith('.webp'))) {
    assert.ok(enCss.has(f), `«${f}» está servido y no lo usa ninguna regla`);
  }
});

test('Todo lo que la pantalla pide por `src` está en el repositorio', () => {
  // Las dos portadas van por `src` y no por CSS, así que el guardián de arriba
  // no las ve. Una portada que falta deja la pantalla en degradado y nadie se
  // entera hasta que alguien la abre.
  for (const m of html.matchAll(/<img[^>]+src="(assets\/[^"]+)"/g)) {
    assert.ok(existsSync(m[1]), `el marcado pide «${m[1]}» y no está`);
  }
});

test('Lo que el service worker precarga existe', () => {
  // La precarga es `Promise.allSettled`, así que un fichero que no está NO
  // rompe la instalación: se pide en la primera visita y ya. Lo que pasa es
  // que deja de estar disponible sin conexión, que es justo para lo que está.
  const sw = readFileSync('sw.js', 'utf8');
  const bloque = sw.slice(sw.indexOf('const ESENCIALES'), sw.indexOf('];', sw.indexOf('const ESENCIALES')));
  for (const m of bloque.matchAll(/'\.\/(assets\/[^']+)'/g)) {
    assert.ok(existsSync(m[1]), `sw.js precarga «${m[1]}» y no está en el repositorio`);
  }
});
