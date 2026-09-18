// La PREVISIÓN del combate: lo que el tablero dice que va a pasar en cada
// columna si nadie cambia nada. Juega el turno sobre una copia con el mismo
// motor, así que lo que hay que probar es que lee bien lo que salió, que no
// toca el estado de verdad, y que calla cuando no toca.

import test from 'node:test';
import assert from 'node:assert/strict';

import { FASE, vistaDe } from '../src/engine/state.js';
import { prever, SUERTE } from '../src/ui/prevision.js';
import { tablero, poner, enMano, reduce, ACCION } from './helpers.js';

// Lokiceratops 4/7 y Platyceratops 1/2: dos cuerpos sin nada que altere el combate.
const GRANDE = 'lokiceratops';
const CHICO = 'platyceratops';

function enDespliegue(s) {
  s.fase = FASE.DESPLIEGUE;
  s.jugadores.forEach((j) => { j.listo = false; });
  return s;
}

test('Cada columna dice lo suyo: mata, muere, ambos, choca, avanza; y cuánto baja cada hábitat', () => {
  const s = enDespliegue(tablero());
  poner(s, GRANDE, 0, 0); poner(s, CHICO, 1, 0);   // mato
  poner(s, CHICO, 0, 1); poner(s, GRANDE, 1, 1);   // muero
  poner(s, CHICO, 0, 2); poner(s, CHICO, 1, 2);    // chocan (1 contra 2 de Vida)
  poner(s, GRANDE, 0, 3);                           // avanzo
  const p = prever(s);
  assert.ok(p);
  assert.deepEqual(p.columnas.map((c) => c.mia?.suerte), [SUERTE.MATA, SUERTE.MUERE, SUERTE.CHOCA, SUERTE.AVANZA]);
  assert.equal(p.columnas[3].mia.dano, 4);
  // Lo que sobra al matar en la columna 0 (4 − 2 = 2) más el avance de la 3.
  assert.equal(p.habitat[1], 2 + 4);
  // Y lo que le sobra al suyo al matarme en la 1 (4 − 2 = 2).
  assert.equal(p.habitat[0], 2);
  assert.deepEqual(p.trofeos, [1, 1]);
  // La columna donde muero no lleva golpe rival: chocó, no avanzó.
  assert.equal(p.columnas[1].rival, null);
});

test('El golpe del rival a mi hábitat se apunta en SU columna', () => {
  const s = enDespliegue(tablero());
  poner(s, GRANDE, 1, 2);
  const p = prever(s);
  assert.equal(p.columnas[2].mia, null);
  assert.deepEqual(p.columnas[2].rival, { dano: 4 });
  assert.equal(p.habitat[0], 4);
});

test('Mis despliegues pendientes cuentan: la previsión los revela antes de combatir', () => {
  const s = enDespliegue(tablero());
  s.jugadores[0].biomasa = 9;
  poner(s, CHICO, 1, 1);
  const iid = enMano(s, GRANDE, 0);
  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 1 });
  const p = prever(r);
  assert.equal(p.columnas[1].mia.suerte, SUERTE.MATA);
  // Y la copia es una copia: el estado sigue en despliegue con la carta pendiente.
  assert.equal(r.fase, FASE.DESPLIEGUE);
  assert.equal(r.jugadores[0].pendientes.length, 1);
  assert.equal(r.ranuras[0][1], null);
});

test('Ambos caen cuando se matan a la vez', () => {
  const s = enDespliegue(tablero());
  poner(s, GRANDE, 0, 0, { heridas: 6 });
  poner(s, CHICO, 1, 0);
  assert.equal(prever(s).columnas[0].mia.suerte, SUERTE.AMBOS);
});

test('Calla cuando no toca: fuera del despliegue, ya en Listo, en el turno sin combate y con el campo vacío', () => {
  const s = enDespliegue(tablero());
  poner(s, GRANDE, 0, 0);
  assert.ok(prever(s));
  const listo = structuredClone(s); listo.jugadores[0].listo = true;
  assert.equal(prever(listo), null);
  const combate = structuredClone(s); combate.fase = FASE.COMBATE;
  assert.equal(prever(combate), null);
  const primero = structuredClone(s); primero.turno = 1;
  assert.equal(prever(primero), null);
  assert.equal(prever(enDespliegue(tablero())), null, 'sin unidades no hay nada que prever');
});

test('Funciona sobre la vista de un duelo: sin rng y con el mazo rival como cifra', () => {
  const s = enDespliegue(tablero());
  poner(s, GRANDE, 0, 0); poner(s, CHICO, 1, 0);
  poner(s, CHICO, 1, 3);
  const v = vistaDe(s, 0);
  delete v.rng;
  const p = prever(v);
  assert.ok(p);
  assert.equal(p.columnas[0].mia.suerte, SUERTE.MATA);
  assert.deepEqual(p.columnas[3].rival, { dano: 1 });
});
