// El final de la partida: el marcador y las piezas que lo visten.
//
// Las piezas llegan después del código, así que el CSS tiene dos pieles y un
// interruptor, `ARTE_LISTO`. Lo que se vigila aquí es que el interruptor no
// mienta: encendido con una pieza que falta deja un hueco en el marcador, y
// apagado con todas en el disco deja el arte servido y sin usar, que es como
// se quedaron meses las cartas de jefe.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PIEZAS, ARTE_LISTO, marcadorHTML } from '../src/ui/fin.js';

const CARPETA = 'assets/piel/fin';

test('tools/fin.py sirve exactamente las piezas que el juego conoce', () => {
  const py = readFileSync('tools/fin.py', 'utf8');
  const servidas = [...py.matchAll(/:\s*\('([a-z_]+)',\s*\d+\)/g)].map((m) => m[1]).sort();
  assert.deepEqual(servidas, [...PIEZAS].sort());
});

test('El CSS sólo pide piezas del final que existen en la lista, y las usa todas', () => {
  const css = ['style.css', 'efectos.css'].map((f) => readFileSync(f, 'utf8')).join('\n');
  const pedidas = new Set([...css.matchAll(/assets\/piel\/fin\/([a-z_]+)\.webp/g)].map((m) => m[1]));
  for (const p of pedidas) assert.ok(PIEZAS.includes(p), `el CSS pide «${p}» y fin.js no la conoce`);
  for (const p of PIEZAS) assert.ok(pedidas.has(p), `«${p}» está en la lista y ninguna regla la pinta`);
});

test('ARTE_LISTO dice la verdad sobre el disco', () => {
  const faltan = PIEZAS.filter((p) => !existsSync(`${CARPETA}/${p}.webp`));
  if (ARTE_LISTO) {
    assert.deepEqual(faltan, [], 'ARTE_LISTO está encendido y faltan piezas');
  } else {
    assert.ok(faltan.length > 0,
      'están todas las piezas en assets/piel/fin/: pon ARTE_LISTO = true en src/ui/fin.js');
  }
});

const bando = (o) => ({ nombre: 'X', emblema: 'clado_teropodo', trofeos: 0, habitat: 0, ...o });

test('El marcador pone el sello al que gana y rasga el mazo del que cae', () => {
  const html = marcadorHTML({ gane: false, turnos: 9, yo: bando(), rival: bando() });
  assert.match(html, /marcador-mazo propio cae/);
  assert.match(html, /marcador-mazo rival vence"><span class="marcador-dorso"[^]*?marcador-sello/);
  assert.equal(html.match(/marcador-sello/g).length, 1);
  assert.match(html, /9 turnos/);
});

test('Cada fila resalta la cifra mayor, y un hábitat hundido se lee como 0', () => {
  const html = marcadorHTML({
    gane: true, turnos: 1,
    yo: bando({ trofeos: 8, habitat: -4 }), rival: bando({ trofeos: 3, habitat: 12 }),
  });
  assert.match(html, /<span class="rombo mejor">8<\/span><small>Trofeos<\/small><span class="rombo">3<\/span>/);
  assert.match(html, /<span class="rombo">0<\/span><small>Hábitat<\/small><span class="rombo mejor">12<\/span>/);
  assert.match(html, /1 turno</);
});

test('El retrato sale sólo en el bando que lo lleva', () => {
  const html = marcadorHTML({ gane: true, turnos: 4, yo: bando({ retrato: true }), rival: bando() });
  assert.match(html, /marcador-bando propio"><i class="retrato-medallon marcador-retrato"/);
  assert.equal(html.match(/marcador-retrato/g).length, 1);
});

test('El nombre del rival se escapa y un emblema que no es clave no entra', () => {
  // En un duelo el nombre lo escribió otra persona.
  const html = marcadorHTML({
    gane: true, turnos: 3,
    yo: bando({ emblema: null }),
    rival: bando({ nombre: '<img src=x onerror=alert(1)>', emblema: 'x" onclick="y' }),
  });
  assert.ok(!html.includes('<img'), 'el nombre entró como marcado');
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.ok(!html.includes('onclick'), 'el emblema entró como atributo');
  assert.equal(html.match(/class="emblema/g), null);
});
