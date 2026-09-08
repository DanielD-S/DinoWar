// Los cuatro rasgos que llegaron con la fauna de fuera de la Morrison. Son los
// únicos que tocan el motor —vuelo y desgarro cambian la fase de combate—, así
// que son los que hay que sujetar con tests.

import test from 'node:test';
import assert from 'node:assert/strict';

import { FASE, vidaActual, reduccionDe, vuela } from '../src/engine/state.js';
import { BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';
import { tablero, poner, ejecutar, vivo } from './helpers.js';

test('Coraza y Gola suman Defensa a la que ya trae la carta', () => {
  const s = tablero(101);
  const nodo = poner(s, 'nodosaurus', 0, 0);
  const loki = poner(s, 'lokiceratops', 0, 1);

  assert.equal(reduccionDe(s, nodo), CARTAS.nodosaurus.defensa + BALANCE.rasgos.corazaDefensa);
  assert.equal(reduccionDe(s, loki), CARTAS.lokiceratops.defensa + BALANCE.rasgos.golaDefensa);
});

test('Lo que vuela pasa por encima: golpea el habitat y no recibe combate', () => {
  const s = tablero(102);
  const pterosaurio = poner(s, 'huaxiadraco', 0, 0);
  const bloqueo = poner(s, 'allosaurus', 1, 0);
  const habitatAntes = s.jugadores[1].habitat;

  const r = ejecutar(s, FASE.COMBATE);

  assert.ok(vuela(r, pterosaurio), 'el rasgo debería identificarse como vuelo');
  assert.equal(vidaActual(r, pterosaurio), CARTAS.huaxiadraco.vida,
    'un Allosaurus enfrente no debería poder tocarlo');
  assert.ok(r.jugadores[1].habitat < habitatAntes,
    'el daño tiene que haber ido al habitat rival');
  assert.ok(r.eventos.some((e) => e.tipo === 'SOBREVUELO'));
  assert.ok(vivo(r, bloqueo), 'el que se queda en tierra no recibe nada del que vuela');
});

test('Si el rival vuela, el de tierra tiene la ranura libre delante', () => {
  const s = tablero(103);
  poner(s, 'huaxiadraco', 1, 2);
  poner(s, 'ceratosaurus', 0, 2);
  const habitatAntes = [s.jugadores[0].habitat, s.jugadores[1].habitat];

  const r = ejecutar(s, FASE.COMBATE);

  assert.ok(r.jugadores[0].habitat < habitatAntes[0], 'el pterosaurio golpea tu habitat');
  assert.ok(r.jugadores[1].habitat < habitatAntes[1], 'y el terópodo avanza contra el suyo');
});

test('Desgarro impide la curación del turno a quien hiere', () => {
  const s = tablero(104);
  // El Bosque cura a los saurópodos al final de cada turno: es el escenario en
  // el que se nota que la herida no cierra.
  s.campo = 'bosque';
  // Apatosaurus y no Camarasaurus: con 9 de Poder, el Tyrannotitan mata al
  // segundo de un golpe y un muerto no se cura, que no es lo que se mide.
  const sauropodo = poner(s, 'apatosaurus', 1, 0, { heridas: 3 });

  const sinDesgarro = ejecutar(s, FASE.COMBATE);
  const heridasSinDesgarro = sinDesgarro.instancias[sauropodo].heridas;

  const conDesgarro = structuredClone(s);
  poner(conDesgarro, 'tyrannotitan', 0, 0);
  const r = ejecutar(conDesgarro, FASE.COMBATE);

  assert.ok(heridasSinDesgarro < 3, 'sin desgarro el Bosque debería curarle');
  assert.ok(r.instancias[sauropodo].heridas > heridasSinDesgarro,
    'con desgarro no puede curarse ese turno');
  assert.equal(r.instancias[sauropodo].sinCuracion, false,
    'la marca dura un turno, no se queda pegada');
});

test('Volar no libra de lo que no se esquiva volando', () => {
  const s = tablero(105);
  const pterosaurio = poner(s, 'huaxiadraco', 0, 0);
  s.jugadores[1].pendientes = [];

  // Mortandad estacional golpea a TODO el campo, vuele o no.
  const conMortandad = structuredClone(s);
  const iid = conMortandad.siguienteInstId++;
  conMortandad.instancias[iid] = {
    iid, cardId: 'mortandad', dueno: 1, ranura: null, heridas: 0,
    modAtaque: 0, modVida: 0, adherencias: [], adheridoA: null, desplegadoEnTurno: null,
  };
  conMortandad.jugadores[1].pendientes = [{ tipo: 'PRESION', iid, jugador: 1 }];

  const r = ejecutar(conMortandad, FASE.REVELACION);
  assert.ok(r.instancias[pterosaurio].heridas >= BALANCE.rasgos.mortandadDano
    || !vivo(r, pterosaurio), 'la mortandad debería alcanzarle');
});
