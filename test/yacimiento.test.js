// La mejora del yacimiento se paga A PLAZOS. El motivo está en los números:
// el depósito nunca llega al coste de una vez, en ningún nivel, así que un
// «Mejorar» que pidiera el coste entero es un botón que no se pulsa nunca.
// Pasó en producción durante semanas sin que nadie lo notara, porque un botón
// apagado no es un error.

import test from 'node:test';
import assert from 'node:assert/strict';

import { CUENCA, costeDeMejora, depositoDe } from '../src/data/tribu.js';

// La cuenca local guarda en localStorage; aquí se le da uno de mentira.
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => memoria.get(k) ?? null,
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
};
const { mejorarYacimiento, estadoDeTribu } = await import('../src/ui/red-local.js');

const T0 = 1_700_000_000_000;
const HORA = 3600_000;

test('En ningún nivel cabe el coste de la mejora en el depósito: por eso va a plazos', () => {
  for (let n = 1; n < CUENCA.nivelMaximo; n++) {
    assert.ok(costeDeMejora(n) > depositoDe(n), `nivel ${n}: ${costeDeMejora(n)} cabría en ${depositoDe(n)}`);
  }
});

test('Invertir pone lo que hay, hasta lo que falta, y al juntar el coste sube el nivel', () => {
  memoria.clear();
  estadoDeTribu(T0);   // nace la cuenca: el yacimiento empieza a producir en T0
  const coste = costeDeMejora(1);
  // Depósito lleno (14 horas) y se invierte: sube lo invertido, no el nivel.
  let ahora = T0 + 14 * HORA;
  let c = estadoDeTribu(ahora);
  assert.equal(c.yacimiento.fosiles, depositoDe(1));
  let y = mejorarYacimiento(coste, ahora);
  assert.equal(y.nivel, 1);
  assert.equal(y.fosiles, 0);
  assert.equal(y.invertido, depositoDe(1));
  // Sin fósiles no se invierte nada.
  assert.equal(mejorarYacimiento(coste, ahora), null);
  // Otro depósito entero: sobra, así que sólo se pone lo que falta y sube.
  ahora += 14 * HORA;
  c = estadoDeTribu(ahora);
  const antes = c.yacimiento.fosiles;
  y = mejorarYacimiento(coste, ahora);
  assert.equal(y.nivel, 2);
  assert.equal(y.invertido, 0);
  assert.equal(y.fosiles, antes - (coste - depositoDe(1)));
  // Y lo que queda en el depósito sigue ahí para aportar.
  assert.equal(estadoDeTribu(ahora).yacimiento.fosiles, y.fosiles);
});
