// Los efectos del tablero son imágenes, y el código las nombra por fichero.
// Un flipbook cuyo WebP no existe no rompe nada: el golpe pasa, la carta se
// sacude y el sitio del destello se queda vacío. Y al revés, un WebP que ya no
// pide nadie se queda pesando en la caché para siempre.
//
// Es el mismo guardián que `marcado.test.js` hace con las placas, para los
// efectos: lo que se pide existe, y lo que existe se pide.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const CARPETA = 'assets/piel/efectos';

/** Los que la herramienta sabe generar, leídos de su código. */
function generables() {
  const py = readFileSync('tools/efectos.py', 'utf8');
  return new Set([...py.matchAll(/^\s+'([a-z]+)': \((?:NEGRO|BLANCO), \d+\),/gm)].map((m) => m[1]));
}

/**
 * Lo que el código nombra. En JS un efecto es una cadena —`hoja('choque'`,
 * `garra ? 'garra' : 'pisoton'`— así que se busca cada nombre conocido entre
 * comillas simples; en CSS, por su ruta.
 */
function pedidos() {
  const nombres = new Set();
  const js = ['src/ui/efectos.js', 'src/ui/animate.js', 'src/main.js']
    .map((f) => readFileSync(f, 'utf8')).join(' ');
  for (const n of generables()) if (js.includes(`'${n}'`)) nombres.add(n);
  const css = readFileSync('efectos.css', 'utf8');
  for (const m of css.matchAll(/efectos\/([a-z]+)\.webp/g)) nombres.add(m[1]);
  return nombres;
}

test('Cada efecto que pide el código tiene su WebP', () => {
  const faltan = [...pedidos()].filter((n) => !existsSync(`${CARPETA}/${n}.webp`));
  assert.deepEqual(faltan, [], `se piden y no están servidos: ${faltan.join(', ')}`);
});

test('No sobra ningún efecto: lo que está servido, se usa', () => {
  const usados = pedidos();
  const sobran = readdirSync(CARPETA).filter((f) => f.endsWith('.webp') && !usados.has(f.replace('.webp', '')));
  assert.deepEqual(sobran, [], `servidos y sin uso: ${sobran.join(', ')}`);
});

test('Todo efecto servido lo sabe regenerar tools/efectos.py', () => {
  // Un fichero que la herramienta no conoce se queda huérfano en el primer
  // «regenerar todo»: el original cambia y el servido no.
  const sabe = generables();
  const huerfanos = readdirSync(CARPETA).filter((f) => f.endsWith('.webp') && !sabe.has(f.replace('.webp', '')));
  assert.deepEqual(huerfanos, [], `sin entrada en tools/efectos.py: ${huerfanos.join(', ')}`);
});

test('La hoja de efectos se sirve y se precarga', () => {
  const html = readFileSync('index.html', 'utf8');
  assert.match(html, /href="efectos\.css"/, 'index.html no enlaza efectos.css');
  const sw = readFileSync('sw.js', 'utf8');
  assert.match(sw, /'\.\/efectos\.css'/, 'sw.js no precarga efectos.css');
});
