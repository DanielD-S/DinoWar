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
import { tablero, poner, ejecutar, vivo } from './helpers.js';

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
