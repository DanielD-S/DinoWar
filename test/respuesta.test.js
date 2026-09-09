// La primera vez que un asalto llegó al servidor, la respuesta no traía daño y
// la pantalla pintó «NaN de daño a Saurophaganax maximus» con toda naturalidad,
// como si el asalto hubiera contado. No contó: el jefe seguía intacto.
//
// Un número roto enseñado como si fuera bueno es peor que un error, porque
// nadie va a mirar. Esto fija que no vuelva a pasar.

import test from 'node:test';
import assert from 'node:assert/strict';

import { danoDeRespuesta } from '../src/ui/red.js';

test('Un daño que es un número se acepta', () => {
  assert.equal(danoDeRespuesta({ dano: 294 }), 294);
  assert.equal(danoDeRespuesta({ dano: 0 }), 0, 'cero daño es un resultado, no un fallo');
  assert.equal(danoDeRespuesta({ dano: '150' }), 150, 'JSON puede traerlo como texto');
});

test('Cualquier otra cosa es un error, nunca un NaN', () => {
  // `dano: null` va en la lista a propósito: Number(null) es 0, así que sin un
  // descarte explícito colaría como «cero daño», que es otra cosa.
  for (const malo of [{}, null, undefined, 'ok', { dano: null }, { dano: 'hola' },
    { dano: NaN }, { dano: '' }, { error: 'algo' }, [], { dano: Infinity }]) {
    assert.throws(
      () => danoDeRespuesta(malo),
      (e) => {
        assert.match(e.message, /no devolvió el daño/);
        return true;
      },
      `${JSON.stringify(malo)} debería haber fallado y no lo hizo`,
    );
  }
});

test('El error enseña lo que contestó el servidor, que es lo que se necesita', () => {
  // Sin esto, un fallo del servidor sólo dice «algo salió mal» y no hay por
  // dónde empezar a mirar.
  try {
    danoDeRespuesta({ code: 401, message: 'Invalid JWT' });
    assert.fail('debería haber lanzado');
  } catch (e) {
    assert.match(e.message, /Invalid JWT/);
    assert.deepEqual(e.cuerpo, { code: 401, message: 'Invalid JWT' });
  }
});
