// Colección, sobres y mazos. Todo lo de src/data/coleccion.js es puro, así que
// se puede medir aquí: las probabilidades de un sobre y la legalidad de un mazo
// no deberían depender de haber abierto un navegador.

import test from 'node:test';
import assert from 'node:assert/strict';

import { CARTAS, RAREZA } from '../src/data/cards.js';
import { MAZO, TOTAL_MAZO } from '../src/data/balance.js';
import {
  ECONOMIA, PROBABILIDAD, GARANTIA, TAM_MAZO, POR_RAREZA,
  abrirSobre, excedente, valorFusion, limiteDe, validarMazo,
  mazoPorDefecto, coleccionInicial, aListaDeMazo,
} from '../src/data/coleccion.js';
import { crearPartida } from '../src/engine/state.js';

/** Azar reproducible: sin semilla fija, un test de probabilidades es folclore. */
function azarDe(semilla) {
  let r = semilla >>> 0 || 1;
  return () => {
    r = (r * 48271) % 2147483647;
    return r / 2147483647;
  };
}

test('Las probabilidades de rareza suman 1', () => {
  const suma = Object.values(PROBABILIDAD).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(suma - 1) < 1e-9, `suman ${suma}`);
});

test('Toda rareza tiene al menos una carta que sortear', () => {
  for (const r of Object.values(RAREZA)) {
    assert.ok(POR_RAREZA[r].length > 0, `no hay cartas ${r}`);
  }
});

test('Un sobre trae cinco cartas y siempre una rara o mejor', () => {
  const azar = azarDe(20240907);
  const escala = [RAREZA.COMUN, RAREZA.RARO, RAREZA.EPICO, RAREZA.LEGENDARIO];
  const minimo = escala.indexOf(GARANTIA);

  for (let i = 0; i < 3000; i++) {
    const s = abrirSobre(azar);
    assert.equal(s.length, ECONOMIA.cartasPorSobre);
    assert.ok(s.every((id) => CARTAS[id]), 'una carta del sobre no existe en el set');
    assert.ok(
      s.some((id) => escala.indexOf(CARTAS[id].rareza) >= minimo),
      'un sobre salió sin la rareza garantizada',
    );
  }
});

test('Cuanto más rara, menos sale', () => {
  const azar = azarDe(7);
  const cuenta = { COMUN: 0, RARO: 0, EPICO: 0, LEGENDARIO: 0 };
  const N = 4000;
  for (let i = 0; i < N; i++) for (const id of abrirSobre(azar)) cuenta[CARTAS[id].rareza] += 1;

  assert.ok(cuenta.COMUN > cuenta.RARO, 'las comunes deberían salir más que las raras');
  assert.ok(cuenta.RARO > cuenta.EPICO, 'las raras deberían salir más que las épicas');
  assert.ok(cuenta.EPICO > cuenta.LEGENDARIO, 'las épicas deberían salir más que las legendarias');
});

test('Abrir sobres no es rentable: fundirlo entero devuelve menos de lo que cuesta', () => {
  const esperado = ECONOMIA.cartasPorSobre * Object.entries(PROBABILIDAD)
    .reduce((n, [r, p]) => n + p * ECONOMIA.fusion[r], 0);
  assert.ok(esperado < ECONOMIA.precioSobre,
    `un sobre devuelve ${esperado.toFixed(1)} y cuesta ${ECONOMIA.precioSobre}`);
});

test('El excedente es lo que ya no cabe en un mazo', () => {
  const col = { ...mazoPorDefecto(), dryosaurus: 7, torvosaurus: 3, allosaurus: 2 };
  const sobra = excedente(col);

  assert.equal(sobra.dryosaurus, 7 - limiteDe('dryosaurus'));
  assert.equal(sobra.torvosaurus, 3 - limiteDe('torvosaurus'));
  assert.equal(sobra.allosaurus, undefined, 'dos épicas caben, no sobran');
  assert.equal(
    valorFusion(col),
    sobra.dryosaurus * ECONOMIA.fusion[CARTAS.dryosaurus.rareza]
      + sobra.torvosaurus * ECONOMIA.fusion[CARTAS.torvosaurus.rareza],
  );
});

test('La colección inicial monta exactamente el mazo por defecto', () => {
  const col = coleccionInicial();
  const v = validarMazo(mazoPorDefecto(), col);

  assert.equal(v.valido, true, v.problemas.join(' '));
  assert.equal(v.total, TAM_MAZO);
  assert.equal(TOTAL_MAZO, TAM_MAZO, 'el mazo de referencia debe sumar un mazo legal');
});

test('Un mazo ilegal dice POR QUÉ lo es', () => {
  const col = { ...mazoPorDefecto(), torvosaurus: 3 };

  const corto = validarMazo({ dryosaurus: 3 }, col);
  assert.equal(corto.valido, false);
  assert.match(corto.problemas.join(' '), new RegExp(`${TAM_MAZO - 3} cartas`));

  const pasado = validarMazo({ ...mazoPorDefecto(), torvosaurus: 3 }, col);
  assert.equal(pasado.valido, false);
  assert.match(pasado.problemas.join(' '), /el máximo es 1/);

  const sinTener = validarMazo({ ...mazoPorDefecto(), torvosaurus: 3 }, mazoPorDefecto());
  assert.match(sinTener.problemas.join(' '), /tienes 1 y el mazo pide 3/);
});

test('Falta UNA carta, no "faltan 1 cartas"', () => {
  const m = { ...mazoPorDefecto() };
  m.dryosaurus -= 1;
  assert.match(validarMazo(m, mazoPorDefecto()).problemas.join(' '), /Falta 1 carta:/);
});

test('El mazo del jugador entra en la partida sin tocar el motor', () => {
  const mono = { dryosaurus: 3, ceratosaurus: 3 };
  const s = crearPartida(9, [aListaDeMazo(mono), null]);

  const idsA = new Set(s.jugadores[0].mazo.concat(s.jugadores[0].mano)
    .map((iid) => s.instancias[iid].cardId));
  assert.deepEqual([...idsA].sort(), ['ceratosaurus', 'dryosaurus']);
  assert.equal(s.jugadores[0].mazo.length + s.jugadores[0].mano.length, 6);

  // El rival sigue con el mazo de referencia, que es el que mide el simulador.
  assert.equal(s.jugadores[1].mazo.length + s.jugadores[1].mano.length, TOTAL_MAZO);
});
