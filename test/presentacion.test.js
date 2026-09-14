// La presentación de la partida: sus piezas y lo que enseña.
//
// Mismo guardián que test/fin.test.js: el arte llega después del código y
// `ARTE_LISTO` no puede mentir sobre el disco.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PIEZAS, ARTE_LISTO, presentacionHTML } from '../src/ui/presentacion.js';

const CARPETA = 'assets/piel/vs';

test('tools/presentacion.py sirve exactamente las piezas que el juego conoce', () => {
  const py = readFileSync('tools/presentacion.py', 'utf8');
  const servidas = [...py.matchAll(/:\s*\('([a-z_]+)',\s*\d+\)/g)].map((m) => m[1]).sort();
  assert.deepEqual(servidas, [...PIEZAS].sort());
});

test('El CSS sólo pide piezas de la presentación que conoce, y las usa todas', () => {
  const css = ['style.css', 'efectos.css'].map((f) => readFileSync(f, 'utf8')).join('\n');
  const pedidas = new Set([...css.matchAll(/assets\/piel\/vs\/([a-z_]+)\.webp/g)].map((m) => m[1]));
  for (const p of pedidas) assert.ok(PIEZAS.includes(p), `el CSS pide «${p}» y presentacion.js no la conoce`);
  for (const p of PIEZAS) assert.ok(pedidas.has(p), `«${p}» está en la lista y ninguna regla la pinta`);
});

test('ARTE_LISTO dice la verdad sobre el disco', () => {
  const faltan = PIEZAS.filter((p) => !existsSync(`${CARPETA}/${p}.webp`));
  if (ARTE_LISTO) {
    assert.deepEqual(faltan, [], 'ARTE_LISTO está encendido y faltan piezas');
  } else {
    assert.ok(faltan.length > 0,
      'están todas las piezas en assets/piel/vs/: pon ARTE_LISTO = true en src/ui/presentacion.js');
  }
});

const bando = (o) => ({ nombre: 'X', subtitulo: 'Jurásico II', retrato: '', emblema: 'clado_sauropodo', ...o });

test('El rival va arriba y tú abajo, con el modo y el objetivo en la costura', () => {
  const html = presentacionHTML({
    yo: bando({ nombre: 'Chocoplat4no' }), rival: bando({ nombre: 'Big Al', emblema: 'clado_teropodo' }),
    modo: 'Expedición', objetivo: '8 trofeos o su hábitat a cero',
  });
  assert.ok(html.indexOf('pres-mitad rival') < html.indexOf('pres-mitad propio'));
  assert.match(html, /pres-mitad rival[^]*emb-clado_teropodo[^]*Big Al/);
  assert.match(html, /pres-mitad propio[^]*emb-clado_sauropodo[^]*Chocoplat4no/);
  assert.match(html, /<b>Expedición<\/b><small>8 trofeos o su hábitat a cero<\/small>/);
});

test('No dice quién empieza: el despliegue es simultáneo', () => {
  const html = presentacionHTML({ yo: bando(), rival: bando(), modo: 'Solitario', objetivo: 'x' });
  assert.doesNotMatch(html, /empiezas|empieza/i);
});

test('El nombre de un rival de duelo se escapa, y un emblema que no es clave no entra', () => {
  const html = presentacionHTML({
    yo: bando(),
    rival: bando({ nombre: '<img src=x onerror=alert(1)>', emblema: 'x" onclick="y', retrato: '' }),
    modo: 'Duelo', objetivo: 'x',
  });
  assert.ok(!html.includes('<img'), 'el nombre entró como marcado');
  assert.ok(!html.includes('onclick'), 'el emblema entró como atributo');
  assert.equal(html.match(/emb-/g).length, 1);
});
