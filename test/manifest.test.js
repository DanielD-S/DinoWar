// El manifest: lo que se ve al instalar el juego y, algún día, en las tiendas.
//
// Se quedó atrás una vez sin que nada fallara: seguía diciendo «sin cuenta y
// sin servidor, se juega sin conexión» cuando la cuenta ya era obligatoria y
// sin red no se entraba. Es el texto que enseña la ventana de instalación.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const html = readFileSync('index.html', 'utf8');

test('El manifest describe el juego que hay, no el de antes de las cuentas', () => {
  assert.doesNotMatch(manifest.description, /sin cuenta|sin servidor|sin conexi/i);
  assert.ok(manifest.id, 'sin `id`, cambiar start_url convertiría la app instalada en otra');
});

test('Todo icono y captura que declara el manifest existe', () => {
  for (const x of [...manifest.icons, ...manifest.screenshots]) {
    assert.ok(existsSync(x.src), `el manifest pide «${x.src}» y no está`);
  }
});

test('Hay un icono adaptable y capturas para móvil y para ordenador', () => {
  // Sin captura «narrow» Android enseña la instalación escueta; sin «wide»,
  // lo mismo en el escritorio.
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  for (const f of ['narrow', 'wide']) {
    assert.ok(manifest.screenshots.some((s) => s.form_factor === f), `falta una captura ${f}`);
  }
});

/** Ancho, alto y tipo de color de un PNG, de su cabecera IHDR. */
function cabeceraPng(ruta) {
  const b = readFileSync(ruta);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), color: b[25] };
}

test('Cada icono mide lo que declara, y los que se recortan son opacos', () => {
  for (const i of manifest.icons) {
    const { w, h } = cabeceraPng(i.src);
    assert.equal(`${w}x${h}`, i.sizes, `${i.src} mide ${w}x${h} y el manifest dice ${i.sizes}`);
  }
  // Android recorta el adaptable y iPhone rellena de negro lo transparente:
  // los dos tienen que llegar sin canal alfa (tipo de color 2, RGB).
  const maskable = manifest.icons.find((i) => i.purpose === 'maskable');
  assert.equal(cabeceraPng(maskable.src).color, 2, 'el icono adaptable trae transparencia');
  const apple = html.match(/<link rel="apple-touch-icon" href="([^"]+)"/)[1];
  assert.ok(existsSync(apple), `el icono de iPhone «${apple}» no está`);
  assert.equal(cabeceraPng(apple).color, 2, 'el icono de iPhone trae transparencia');
});

test('Las capturas miden lo que dicen', () => {
  // Chrome descarta una captura cuyo tamaño no coincide con el declarado. Se
  // lee el ancho y el alto de la cabecera del WebP (VP8, VP8L o VP8X).
  for (const s of manifest.screenshots) {
    const b = readFileSync(s.src);
    const tipo = b.toString('ascii', 12, 16);
    let w, h;
    if (tipo === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
    else if (tipo === 'VP8L') { const v = b.readUInt32LE(21); w = 1 + (v & 0x3fff); h = 1 + ((v >> 14) & 0x3fff); }
    else { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
    assert.equal(`${w}x${h}`, s.sizes, `${s.src} mide ${w}x${h} y el manifest dice ${s.sizes}`);
  }
});

test('El menú tiene el botón de instalar, oculto hasta que sirva', () => {
  assert.match(html, /<button id="btn-instalar" class="boton-fantasma" hidden>/);
});
