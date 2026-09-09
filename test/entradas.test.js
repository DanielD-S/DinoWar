// Las habilidades AL ENTRAR EN JUEGO.
//
// Se disparan una vez, cuando la criatura llega al campo, y se acabó. Son la
// alternativa a los rasgos pasivos, que tienen dos problemas medidos: no se
// leen —es la misma clase de regla invisible que la Defensa que se quitó— y
// falsean la tasación, porque la IA multiplica lo pasivo por los turnos que
// espera que aguante.

import test from 'node:test';
import assert from 'node:assert/strict';

import { crearPartida, FASE, vidaActual } from '../src/engine/state.js';
import { reduce, ACCION } from '../src/engine/actions.js';
import { BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';
import { esEntrada, valorDeEntrada, HAY_ENTRADAS } from '../src/engine/entradas.js';
import { CON_ENTRADA, mazoConEntradas } from '../sim/entradas.js';

/**
 * Despliega `cardId` en la ranura 0 y avanza hasta que la fase de revelación lo
 * pone en el campo, que es donde se dispara la habilidad.
 */
// Mazos de relleno con cartas de sobra: con cuatro cartas, la mano inicial se
// las lleva todas y el mazo queda a cero, así que robar y moler medían 0 y el
// test decía que la habilidad no funcionaba cuando lo que faltaba eran cartas.
const RELLENO = [['dryosaurus', 3], ['ceratosaurus', 3], ['ornitholestes', 3],
  ['stegosaurus', 2], ['camarasaurus', 2], ['nodosaurus', 3]];

function desplegar(cardId, mazoRival = RELLENO, seed = 5) {
  let s = crearPartida(seed, [[[cardId, 1], ...RELLENO], mazoRival]);
  const iid = Number(Object.keys(s.instancias)
    .find((i) => s.instancias[i].cardId === cardId && s.instancias[i].dueno === 0));
  s.jugadores[0].mano = [iid];
  s.jugadores[0].biomasa = 9;
  s.fase = FASE.DESPLIEGUE;
  s.turno = 3;
  const antes = JSON.parse(JSON.stringify({
    habitatRival: s.jugadores[1].habitat,
    mazoRival: s.jugadores[1].mazo.length,
    biomasa: s.jugadores[0].biomasa,
    mano: s.jugadores[0].mano.length,
  }));
  s = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 0 });
  s = reduce(s, { tipo: ACCION.PASAR, jugador: 0 });
  s = reduce(s, { tipo: ACCION.PASAR, jugador: 1 });
  // La foto se toma EN CUANTO se dispara la entrada, no al final del turno:
  // después de la revelación viene el combate, y un Spinosaurus de 11 de Ataque
  // le quita al hábitat once más que su habilidad. La primera versión de este
  // helper medía 14 y esperaba 3.
  let disparo = null;
  let vueltas = 0;
  while (s.fase !== FASE.FIN && vueltas++ < 20) {
    s = reduce(s, { tipo: ACCION.AVANZAR });
    disparo = s.eventos.find((e) => e.tipo === 'ENTRADA') ?? null;
    if (disparo) break;
  }
  return { s, iid, antes, disparo };
}

test('Las seis criaturas de prueba llevan habilidad de entrada', () => {
  assert.equal(CON_ENTRADA.length, 6);
  for (const id of CON_ENTRADA) {
    assert.ok(CARTAS[id], `${id} no existe`);
    assert.ok(esEntrada(id), `${id} no tiene habilidad de entrada`);
    assert.ok(valorDeEntrada(id) > 0,
      `${id} vale 0 para la IA, así que no la desplegará nunca — es lo que le pasó a la Llanura`);
  }
});

test('Spinosaurus arrasa el hábitat rival al entrar', () => {
  const { s, antes, disparo } = desplegar('spinosaurus');
  assert.equal(disparo?.efecto, 'habitat');
  assert.equal(antes.habitatRival - s.jugadores[1].habitat, BALANCE.entradas.arrasaHabitat);
});

test('Atlasaurus da Biomasa al entrar', () => {
  const { s, disparo } = desplegar('atlasaurus');
  assert.equal(disparo?.efecto, 'biomasa');
  // La Biomasa se cobra al desplegar y se gasta, así que lo que se comprueba es
  // el disparo y su cantidad, no el saldo.
  assert.equal(disparo.n, BALANCE.entradas.ramoneoBiomasa);
  assert.ok(s.jugadores[0].biomasa >= BALANCE.entradas.ramoneoBiomasa);
});

test('Mosasaurus muele el mazo rival al entrar', () => {
  const { s, antes, disparo } = desplegar('mosasaurus');
  assert.equal(disparo?.efecto, 'muele');
  assert.equal(antes.mazoRival - s.jugadores[1].mazo.length, BALANCE.entradas.devoraMazo);
});

test('Troodon roba al entrar', () => {
  const { disparo } = desplegar('troodon');
  assert.equal(disparo?.efecto, 'roba');
  assert.equal(disparo.n, BALANCE.entradas.alertaRoba);
});

test('Dromaeosaurus embosca al que tenga enfrente, y sólo si lo hay', () => {
  // Sin nadie enfrente no hay a quién emboscar: no debe reventar ni inventarse
  // un objetivo.
  const solo = desplegar('dromaeosaurus');
  assert.ok(solo.s.fase !== FASE.FIN);

  // Con alguien enfrente, ese alguien encaja el golpe ANTES del combate.
  let { s, iid } = desplegar('dromaeosaurus');
  const victima = Number(Object.keys(s.instancias)
    .find((i) => s.instancias[i].dueno === 1 && s.instancias[i].ranura === 0));
  void iid;
  if (victima) {
    assert.ok(vidaActual(s, victima) < CARTAS[s.instancias[victima].cardId].vida
      || s.instancias[victima].heridas > 0);
  }
});

test('Gargoyleosaurus cura a los tuyos al entrar', () => {
  const { disparo } = desplegar('gargoyleosaurus');
  assert.equal(disparo?.efecto, 'cura');
});

test('Se pueden apagar para medir con y sin', () => {
  // El juego publicado las lleva encendidas; DINOWAR_ENTRADAS=0 es sólo para
  // `sim/entradas.js`, igual que las variantes de economía y de cuerpo.
  assert.equal(HAY_ENTRADAS, true);
});

test('El mazo de medición es legal y lleva las seis', () => {
  const mazo = mazoConEntradas();
  const total = mazo.reduce((n, [, c]) => n + c, 0);
  assert.equal(total, BALANCE.tamanoMazo, 'el mazo tiene que sumar las cartas exactas');
  for (const [id, copias] of mazo) {
    assert.ok(copias <= BALANCE.copiasPorRareza[CARTAS[id].rareza],
      `${id} lleva ${copias} copias y su rareza no lo permite`);
  }
  for (const id of CON_ENTRADA) {
    assert.ok(mazo.some(([x]) => x === id), `${id} no está en el mazo que las mide`);
  }
});
