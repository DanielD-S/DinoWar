// Las cartas de soporte —climas, eventos, recursos— son las únicas que llevan
// mecánica. Las 52 criaturas son coste, Ataque y Vida y nada más.
//
// Aquí vivían los tests de Gola, Muro de placas, Caza en grupo, Manada, Vuelo y
// Desgarro. Se fueron con sus rasgos. El motor sigue sabiendo hacer esas cosas
// —el vocabulario está— pero ninguna carta las pide, así que no hay escenario
// que montar.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FASE, vidaActual, vidaMaxima, ataqueEfectivo, vuela, rentaDe, puedeReciclar,
} from '../src/engine/state.js';
import { legales, reduce, validar, ACCION } from '../src/engine/actions.js';
import { BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';

test('Los climas nuevos alcanzan a los dos bandos', () => {
  const s = tablero(114);
  const mio = poner(s, 'allosaurus', 0, 0);
  const suyo = poner(s, 'allosaurus', 1, 0);

  // La sabana da Biomasa a los DOS, cada turno, mientras siga en el campo. Fue
  // «+1 al daño contra los biomas» —cuya constante alguien borró, dejando a la
  // IA calculando NaN durante un día— y luego Defensa, que ya no existe.
  const renta = rentaDe(s);
  s.campo = 'sabana';
  assert.equal(rentaDe(s), renta + BALANCE.efectosCampo.sabanaBiomasa,
    'la sabana sube la renta');
  assert.equal(vidaMaxima(s, mio), vidaMaxima(s, suyo),
    'y no toca la Vida de nadie');

  s.campo = 'canal';
  assert.equal(vidaMaxima(s, mio), CARTAS.allosaurus.vida + BALANCE.efectosCampo.canalVida);
  assert.equal(vidaMaxima(s, suyo), CARTAS.allosaurus.vida + BALANCE.efectosCampo.canalVida);
});

test('La Llanura deja CAMBIAR una carta: al fondo va una y entra otra', () => {
  // La sabana pasó a dar Biomasa a los dos y eso era, letra por letra, lo que
  // hacía la llanura. Reciclar es lo único que ningún otro clima hace, y apunta
  // a lo que está flojo: la extinción se quedó cerca del suelo del 15 %.
  const s = tablero(230);
  s.fase = FASE.DESPLIEGUE;
  // `tablero()` deja la mano vacía a propósito; aquí hace falta que haya algo
  // que devolver, así que se roban tres del mazo.
  for (let i = 0; i < 3; i++) s.jugadores[0].mano.push(s.jugadores[0].mazo.shift());

  assert.equal(puedeReciclar(s, 0), false, 'sin llanura no se recicla');
  assert.equal(legales(s, 0).filter((a) => a.tipo === ACCION.RECICLAR).length, 0);

  s.campo = 'llanura';
  const opciones = legales(s, 0).filter((a) => a.tipo === ACCION.RECICLAR);
  assert.equal(opciones.length, s.jugadores[0].mano.length, 'se puede devolver cualquiera de la mano');

  const iid = opciones[0].iid;
  const mazo = s.jugadores[0].mazo.length;
  const mano = s.jugadores[0].mano.length;
  const arriba = s.jugadores[0].mazo[0];
  const post = reduce(s, opciones[0]);

  // Cambio, no pérdida: sale una y entra otra, así que la mano no encoge.
  // Sin el robo, `sim/climas.js` midió cero usos en 300 partidas.
  assert.equal(post.jugadores[0].mano.length, mano, 'la mano no encoge');
  assert.equal(post.jugadores[0].mazo.length, mazo, 'el mazo tampoco');
  assert.ok(!post.jugadores[0].mano.includes(iid), 'la soltada se va');
  assert.ok(post.jugadores[0].mano.includes(arriba), 'y entra la de arriba del mazo');
  assert.equal(post.jugadores[0].mazo[post.jugadores[0].mazo.length - 1], iid,
    'al FONDO: arriba te devolvería la misma que acabas de soltar');
  assert.equal(puedeReciclar(post, 0), false, 'una por turno');
});

test('Reciclar no cuesta Biomasa', () => {
  // Cobrar por devolver una carta al mazo sería lo contrario de lo que hace
  // falta cuando vas corto, que es justo cuando esto sirve.
  const s = tablero(231);
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].mano.push(s.jugadores[0].mazo.shift());
  s.campo = 'llanura';
  s.jugadores[0].biomasa = 0;
  const opcion = legales(s, 0).find((a) => a.tipo === ACCION.RECICLAR);
  assert.ok(opcion, 'con 0 de Biomasa se sigue pudiendo');
  assert.equal(validar(s, opcion), null);
  assert.equal(reduce(s, opcion).jugadores[0].biomasa, 0);
});

// ------------------------------------------------- la ronda del control

/** Juega un evento sin objetivo y resuelve la revelación. */
function soltar(s, cardId, jugador = 0) {
  const iid = enMano(s, cardId, jugador);
  s.jugadores[jugador].biomasa = 9;
  s.fase = FASE.DESPLIEGUE;
  return ejecutar(reduce(s, { tipo: ACCION.EVENTO, jugador, iid }), FASE.REVELACION);
}

test('La Tormenta de polvo reparte la MISMA mano a los dos, y por el mazo', () => {
  // No es la Deriva árida: aquélla te devuelve tantas como tenías —el que la
  // tenía peor sale ganando— y ésta reparte un número fijo, así que castiga a
  // quien iba acumulando y rescata a quien se quedó seco. Y pasa por el MAZO:
  // lo que sueltas vuelve a estar disponible, no se pierde.
  const s = tablero();
  for (let k = 0; k < 7; k++) enMano(s, 'troodon', 0);
  for (let k = 0; k < 2; k++) enMano(s, 'troodon', 1);
  const r = soltar(s, 'tormenta_polvo');

  const n = BALANCE.rasgos.tormentaPolvoRoba;
  assert.equal(r.jugadores[0].mano.length, n, 'el que la juega se queda con las suyas');
  assert.equal(r.jugadores[1].mano.length, n, 'y el rival con las mismas');
  // Al rival no le va NADA al descarte; al que la juega, sólo la propia carta,
  // que se gasta al resolverse como cualquier evento.
  assert.equal(r.jugadores[1].descarte.length, 0);
  assert.deepEqual(r.jugadores[0].descarte.map((iid) => r.instancias[iid].cardId),
    ['tormenta_polvo']);
});

test('La Avenida de lodo recorta la mano rival al tope, y sólo la suya', () => {
  const s = tablero();
  for (let k = 0; k < 6; k++) enMano(s, 'troodon', 1);
  for (let k = 0; k < 6; k++) enMano(s, 'troodon', 0);
  const r = soltar(s, 'avenida_lodo');

  const tope = BALANCE.rasgos.avenidaLodoTope;
  assert.equal(r.jugadores[1].mano.length, tope);
  assert.equal(r.jugadores[1].descarte.length, 6 - tope);
  // La mano propia queda como estaba menos la carta jugada.
  assert.equal(r.jugadores[0].mano.length, 6);

  // Con la mano ya corta no le quita ninguna, y tampoco le da.
  const t = tablero();
  enMano(t, 'troodon', 1);
  const u = soltar(t, 'avenida_lodo');
  assert.equal(u.jugadores[1].mano.length, 1);
  assert.equal(u.jugadores[1].descarte.length, 0);
});

test('El Enterramiento saca del descarte, y no inventa cartas si está vacío', () => {
  const s = tablero();
  s.jugadores[0].descarte.push(...s.jugadores[0].mazo.splice(0, 5));
  const r = soltar(s, 'enterramiento');
  const n = BALANCE.rasgos.enterramientoRescata;
  // Las 5 menos las rescatadas, más la propia carta: se gasta DESPUÉS de
  // rescatar, así que no puede rescatarse a sí misma.
  assert.equal(r.jugadores[0].descarte.length, 5 - n + 1);
  assert.equal(r.jugadores[0].mano.length, n);
  assert.ok(!r.jugadores[0].mano.some((iid) => r.instancias[iid].cardId === 'enterramiento'));

  const t = tablero();
  const u = soltar(t, 'enterramiento');
  assert.equal(u.jugadores[0].mano.length, 0);
  const e = u.eventos.find((x) => x.tipo === 'RESCATE');
  assert.equal(e.cartas, 0, 'deja constancia de que no sacó nada');
});

test('El Cauce suelta ANTES de robar, que si no se descartaría lo robado', () => {
  const s = tablero();
  for (let k = 0; k < 4; k++) enMano(s, 'troodon', 0);
  const r = soltar(s, 'cauce_abandonado');
  const { cauceDescarta, cauceRoba } = BALANCE.rasgos;
  assert.equal(r.jugadores[0].descarte.length, cauceDescarta + 1, 'y la propia carta gastada');
  assert.equal(r.jugadores[0].mano.length, 4 - cauceDescarta + cauceRoba);
  // Lo soltado salió de las que YA tenía —todas eran troodon— y no de lo
  // robado: si se robara primero, la carta haría otra cosa que la que dice.
  const soltadas = r.jugadores[0].descarte
    .map((iid) => r.instancias[iid].cardId).filter((id) => id !== 'cauce_abandonado');
  assert.deepEqual(soltadas, ['troodon', 'troodon']);
});

test('La Barrera de troncos dobla sólo si el rival va con más mano que tú', () => {
  const n = BALANCE.rasgos.barreraMazo;

  // Él con cuatro, tú con una (la carta jugada no cuenta: ya no está en la mano).
  const s = tablero();
  for (let k = 0; k < 4; k++) enMano(s, 'troodon', 1);
  enMano(s, 'troodon', 0);
  const antes = s.jugadores[1].mazo.length;
  const r = soltar(s, 'barrera_troncos');
  assert.equal(r.jugadores[1].mazo.length, antes - n * 2);
  assert.ok(r.eventos.find((x) => x.tipo === 'PRESION' && x.doble === true));

  // Empatados a mano: no dobla. «Más que tú» es más, no otro tanto.
  const t = tablero();
  for (let k = 0; k < 3; k++) enMano(t, 'troodon', 1);
  for (let k = 0; k < 3; k++) enMano(t, 'troodon', 0);
  const antesT = t.jugadores[1].mazo.length;
  const u = soltar(t, 'barrera_troncos');
  assert.equal(u.jugadores[1].mazo.length, antesT - n);
  assert.ok(u.eventos.find((x) => x.tipo === 'PRESION' && x.doble === false));
});
