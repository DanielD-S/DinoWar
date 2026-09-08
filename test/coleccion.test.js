// Colección, sobres y mazos. Todo lo de src/data/coleccion.js es puro, así que
// se puede medir aquí: las probabilidades de un sobre y la legalidad de un mazo
// no deberían depender de haber abierto un navegador.

import test from 'node:test';
import assert from 'node:assert/strict';

import { CARTAS, RAREZA } from '../src/data/cards.js';
import { MAZO, TOTAL_MAZO } from '../src/data/balance.js';
import {
  ECONOMIA, PROBABILIDAD, GARANTIA, TAM_MAZO, POR_RAREZA, CUOTA, COLECCION_COMPLETA,
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

// Lo que se compara es la frecuencia POR CARTA, no por rareza: el set tiene 15
// épicas y sólo 4 raras, así que las épicas suman más aunque cada una concreta
// salga bastante menos. Por rareza la comparación diría lo contrario y estaría
// midiendo el tamaño del grupo, no lo rara que es una carta.
test('Cuanto más rara una carta, menos sale esa carta', () => {
  const azar = azarDe(7);
  const cuenta = {};
  const N = 8000;
  for (let i = 0; i < N; i++) for (const id of abrirSobre(azar)) cuenta[id] = (cuenta[id] ?? 0) + 1;

  const media = (r) => {
    const ids = POR_RAREZA[r];
    return ids.reduce((n, id) => n + (cuenta[id] ?? 0), 0) / ids.length;
  };
  assert.ok(media(RAREZA.COMUN) > media(RAREZA.RARO), 'una común debería salir más que una rara');
  assert.ok(media(RAREZA.RARO) > media(RAREZA.EPICO), 'una rara debería salir más que una épica');
  assert.ok(media(RAREZA.EPICO) > media(RAREZA.LEGENDARIO), 'una épica debería salir más que una legendaria');
});

test('Las probabilidades siguen la forma del set y suman 1', () => {
  const total = Object.values(RAREZA).reduce((n, r) => n + PROBABILIDAD[r], 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `las probabilidades suman ${total}`);

  // Ninguna rareza puede recibir menos de lo que le hace falta para completarse
  // antes que las demás: si una recibe menos cuota de la que aporta al set,
  // la colección se queda esperándola para siempre.
  for (const r of Object.values(RAREZA)) {
    const aporta = CUOTA[r] / COLECCION_COMPLETA;
    assert.ok(PROBABILIDAD[r] > aporta / 4,
      `${r} aporta el ${(aporta * 100).toFixed(0)} % del set y sólo recibe el ${(PROBABILIDAD[r] * 100).toFixed(0)} %`);
  }
});

test('Con la colección delante, el sobre no da copias que ya no caben en un mazo', () => {
  const azar = azarDe(31);
  // Al tope todo menos una carta de cada rareza. La rareza se sortea igual que
  // siempre; lo que cambia es que, salga la que salga, ha de tocarle a la única
  // que aún falta de ese grupo.
  const pendiente = {};
  const llenas = {};
  for (const r of Object.values(RAREZA)) {
    const ids = POR_RAREZA[r];
    pendiente[r] = ids[ids.length - 1];
    for (const id of ids) if (id !== pendiente[r]) llenas[id] = limiteDe(id);
  }

  let inservibles = 0;
  for (let i = 0; i < 400; i++) {
    // Se lleva la cuenta dentro del sobre igual que la lleva abrirSobre: si la
    // única carta que faltaba de una rareza se completa a mitad del sobre, que
    // el resto salga repetido es lo correcto, no un fallo.
    const cuenta = { ...llenas };
    for (const id of abrirSobre(azar, llenas)) {
      const grupo = POR_RAREZA[CARTAS[id].rareza];
      const quedaba = grupo.some((x) => (cuenta[x] ?? 0) < limiteDe(x));
      if (quedaba && (cuenta[id] ?? 0) >= limiteDe(id)) inservibles += 1;
      cuenta[id] = (cuenta[id] ?? 0) + 1;
    }
  }
  assert.equal(inservibles, 0, `salieron ${inservibles} copias inservibles habiendo alternativa`);
});

test('Dos cartas del mismo sobre se tienen en cuenta entre sí', () => {
  const azar = azarDe(1234);
  // Sólo queda por completar una legendaria, de la que falta una única copia.
  // Aunque el sobre saque la rareza legendaria cinco veces, no puede dar cinco
  // copias de esa carta como si cada tirada empezara de cero.
  const casi = Object.fromEntries(Object.keys(CARTAS).map((id) => [id, limiteDe(id)]));
  const hueco = POR_RAREZA[RAREZA.LEGENDARIO][0];
  casi[hueco] = 0;

  let veces = 0;
  for (let i = 0; i < 300; i++) {
    const s = abrirSobre(azar, casi);
    veces = Math.max(veces, s.filter((id) => id === hueco).length);
  }
  assert.ok(veces <= limiteDe(hueco),
    `un solo sobre dio ${veces} copias de ${hueco}, que admite ${limiteDe(hueco)}`);
});

test('Cuando una rareza está completa el sobre vuelve a repartirla: la fusión sigue teniendo de qué comer', () => {
  const azar = azarDe(77);
  const todo = Object.fromEntries(Object.keys(CARTAS).map((id) => [id, limiteDe(id)]));
  const s = abrirSobre(azar, todo);
  assert.equal(s.length, ECONOMIA.cartasPorSobre);
  assert.ok(s.every((id) => CARTAS[id]), 'con la colección llena el sobre debe seguir dando cartas');
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
