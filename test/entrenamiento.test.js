// El Entrenamiento: la partida de emergencia del Duelo. Lo que no puede fallar
// en silencio es que el rival sorteado exista para el servidor —un id que no
// está en `expediciones.js` es una partida inválida, no una contra la
// referencia— y que el botón llegue antes que el aviso de rendirse.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { ENTRENAMIENTO, rivalesDeEntrenamiento, rivalDeEntrenamiento } from '../src/data/entrenamiento.js';
import { EXPEDICIONES, rivalPorId } from '../src/data/expediciones.js';
import { DUELO } from '../src/data/duelo.js';

test('Los rivales de entrenamiento son los últimos de cada mapa y todos existen', () => {
  const ids = rivalesDeEntrenamiento();
  assert.equal(ids.length, EXPEDICIONES.length * ENTRENAMIENTO.porMapa);
  for (const id of ids) {
    const r = rivalPorId(id);
    assert.ok(r, `${id} no es un rival`);
    assert.ok(r.indice >= r.expedicion.rivales.length - ENTRENAMIENTO.porMapa, `${id} no es del final de su mapa`);
  }
  assert.equal(new Set(ids).size, ids.length);
});

test('El sorteo no repite el anterior, recorre todos, y con uno solo lo devuelve igual', () => {
  const ids = rivalesDeEntrenamiento();
  const vistos = new Set();
  for (let i = 0; i < ids.length; i++) vistos.add(rivalDeEntrenamiento(null, () => i / ids.length));
  assert.deepEqual([...vistos].sort(), [...ids].sort());
  for (let i = 0; i < 50; i++) assert.notEqual(rivalDeEntrenamiento(ids[0], Math.random), ids[0]);
  // El azar en 1 exacto no se sale de la lista.
  assert.ok(ids.includes(rivalDeEntrenamiento(null, () => 1)));
});

test('El botón de entrenar llega antes que el aviso de que no hay nadie', () => {
  assert.ok(ENTRENAMIENTO.ofrecerMs < DUELO.esperaMaxMs);
  assert.ok(ENTRENAMIENTO.ofrecerMs >= DUELO.sondeoMs);
});

test('El fichero no entra en el paquete de la Edge Function: cambiarlo no pide re-anclar', () => {
  const paquete = readFileSync(new URL('../supabase/functions/asalto/paquete.ts', import.meta.url), 'utf8');
  assert.ok(!paquete.includes('src/data/entrenamiento.js'));
});
