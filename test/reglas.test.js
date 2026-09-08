// DinoWar — reglas de combate, ranuras, victorias y cartas.

import test from 'node:test';
import assert from 'node:assert/strict';

import { BALANCE, TOTAL_MAZO } from '../src/data/balance.js';
import { CARTAS, CLADO, RASGO } from '../src/data/cards.js';
import {
  crearPartida, FASE, MOTIVO_FIN,
  unidadEn, unidadesDe, ataqueEfectivo, vidaActual, danoEntre,
  espinasDe, reduccionDe, rentaDe, curacionDe,
} from '../src/engine/state.js';
import { reduce, ACCION, avanzar, validar } from '../src/engine/actions.js';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';

// --------------------------------------------------------------- economía

test('La renta sube por turno hasta el tope y es igual para los dos bandos', () => {
  const s = tablero();
  for (const [turno, esperado] of [[1, 1], [4, 4], [8, 8], [12, BALANCE.rentaTope]]) {
    s.turno = turno;
    assert.equal(rentaDe(s), Math.min(turno, BALANCE.rentaTope));
    const r = ejecutar(s, FASE.RENTA);
    assert.equal(r.jugadores[0].biomasa, esperado);
    assert.equal(r.jugadores[1].biomasa, esperado, 'los dos cobran lo mismo');
  }
});

test('La renta NO depende de ir ganando: es la corrección central de la v2', () => {
  const s = tablero();
  s.turno = 5;
  poner(s, 'allosaurus', 0, 0);
  poner(s, 'allosaurus', 0, 1);
  s.jugadores[0].trofeos = 8;

  const r = ejecutar(s, FASE.RENTA);
  assert.equal(r.jugadores[0].biomasa, r.jugadores[1].biomasa);
});

test('La renta no se acumula: lo que no gastas se pierde', () => {
  const s = tablero();
  s.turno = 6;
  s.jugadores[0].biomasa = 99;
  const r = ejecutar(s, FASE.RENTA);
  assert.equal(r.jugadores[0].biomasa, 6);
});

// ---------------------------------------------------------------- combate

test('Ranuras enfrentadas: se hacen daño a la vez', () => {
  const s = tablero();
  const a = poner(s, 'ceratosaurus', 0, 1);   // 4/3
  const b = poner(s, 'ceratosaurus', 1, 1);   // 4/3

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(vivo(r, a), false, 'un intercambio mutuo mata a los dos');
  assert.equal(vivo(r, b), false);
  assert.equal(r.jugadores[0].trofeos, 1);
  assert.equal(r.jugadores[1].trofeos, 1);
});

test('Ranura enfrentada vacía: el ocupante golpea el habitat rival', () => {
  const s = tablero();
  const a = poner(s, 'allosaurus', 0, 2);   // Poder 6

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - 6);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat, 'el tuyo no se toca');
  assert.equal(vivo(r, a), true);
});

test('Sólo se enfrentan las ranuras del mismo índice', () => {
  const s = tablero();
  poner(s, 'allosaurus', 0, 0);
  poner(s, 'allosaurus', 1, 3);

  const r = ejecutar(s, FASE.COMBATE);

  // Ninguno tiene rival enfrente: los dos biomas reciben.
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat - 6);
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - 6);
});

test('Las heridas persisten entre turnos', () => {
  const s = tablero();
  const grande = poner(s, 'apatosaurus', 0, 0);   // 4 atq / 3+1 def / 12 vida
  poner(s, 'torvosaurus', 1, 0);                  // 8 atq: de los pocos que le hacen mella

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(vivo(r, grande), true);
  assert.ok(r.instancias[grande].heridas > 0, 'queda herido, no intacto');
  assert.ok(vidaActual(r, grande) < 12);
});

// ------------------------------------------------------------ red trófica

test('Terópodo contra ornitópodo: bonificación de depredación', () => {
  const s = tablero();
  const teropodo = poner(s, 'ceratosaurus', 0, 0);
  const presa = poner(s, 'dryosaurus', 1, 0);
  const otro = poner(s, 'stegosaurus', 1, 1);

  // El Dryosaurus no tiene Defensa; el Stegosaurus sí, y además no es su presa.
  assert.equal(danoEntre(s, teropodo, presa), 4 + BALANCE.clados.bonusDepredacion);
  assert.equal(danoEntre(s, teropodo, otro), 4 - CARTAS.stegosaurus.defensa, 'sólo aplica sobre su presa');
});

test('La Defensa sale de la carta, no del clado', () => {
  const s = tablero();
  const sauropodo = poner(s, 'camarasaurus', 0, 0);
  const colosal = poner(s, 'apatosaurus', 0, 1);
  const agil = poner(s, 'dryosaurus', 0, 2);

  assert.equal(reduccionDe(s, sauropodo), CARTAS.camarasaurus.defensa);
  assert.equal(reduccionDe(s, agil), 0, 'el que corre no para golpes');
  assert.equal(reduccionDe(s, colosal),
    CARTAS.apatosaurus.defensa + BALANCE.rasgos.masaColosalDefensa,
    'Masa colosal suma encima de la Defensa de su carta');
});

test('El primer turno no hay combate', () => {
  const s = tablero();
  s.turno = 1;
  const a = poner(s, 'torvosaurus', 0, 0);
  const b = poner(s, 'dryosaurus', 1, 0);
  poner(s, 'allosaurus', 0, 3);        // sin nadie enfrente

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(vivo(r, a), true);
  assert.equal(vivo(r, b), true, 'nadie muere en el turno 1');
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat, 'ni el habitat recibe');
  assert.ok(r.eventos.some((e) => e.tipo === 'SIN_COMBATE'));
});

test('Tireóforo: devuelve daño a quien lo ataca, y Stegosaurus devuelve más', () => {
  const s = tablero();
  const stego = poner(s, 'stegosaurus', 1, 0);
  assert.equal(espinasDe(s, stego),
    BALANCE.clados.espinasTireoforo + BALANCE.rasgos.tagomizadorExtra);

  const atacante = poner(s, 'ceratosaurus', 0, 0);   // 4/3
  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(vivo(r, atacante), false, 'las púas lo rematan');
});

// -------------------------------------------------------------- victorias

test('Registro fósil: cada baja rival es un trofeo', () => {
  const s = tablero();
  poner(s, 'torvosaurus', 0, 0);    // 8/6
  poner(s, 'dryosaurus', 1, 0);     // 1/2

  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.jugadores[0].trofeos, 1);
  assert.equal(r.jugadores[1].trofeos, 0);
});

test('Se gana al reunir los trofeos del objetivo', () => {
  const s = tablero();
  s.jugadores[0].trofeos = BALANCE.trofeosParaGanar;
  const r = ejecutar(s, FASE.CHEQUEO);
  assert.equal(r.fase, FASE.FIN);
  assert.equal(r.ganador, 0);
  assert.equal(r.motivoFin, MOTIVO_FIN.TROFEOS);
});

test('Se gana al derrumbar el habitat rival', () => {
  const s = tablero();
  s.jugadores[1].habitat = 0;
  const r = ejecutar(s, FASE.CHEQUEO);
  assert.equal(r.ganador, 0);
  assert.equal(r.motivoFin, MOTIVO_FIN.HABITAT);
});

test('Extinción: quedarse sin mazo al robar es perder, y no se rebaraja', () => {
  const s = tablero();
  s.jugadores[0].mazo = [];
  s.jugadores[0].descarte = [1, 2, 3];   // con rebarajado esto le salvaría

  const r = ejecutar(s, FASE.ROBO);

  assert.equal(BALANCE.rebarajarDescarte, false);
  assert.equal(r.fase, FASE.FIN);
  assert.equal(r.motivoFin, MOTIVO_FIN.EXTINCION);
  assert.equal(r.ganador, 1);
});

// ------------------------------------------------------------------ cartas

test('Allosaurus: el daño sobrante al matar pasa al habitat', () => {
  const s = tablero();
  poner(s, 'allosaurus', 0, 0);      // Poder 6
  poner(s, 'dryosaurus', 1, 0);      // 1/2, sobran 6-2 = 4 (+2 de depredación)

  const r = ejecutar(s, FASE.COMBATE);
  assert.ok(r.jugadores[1].habitat < BALANCE.vidaHabitat, 'el exceso llega al habitat');
});

test('Dryosaurus: +1 Poder por cada congénere propio en el campo', () => {
  const s = tablero();
  const a = poner(s, 'dryosaurus', 0, 0);
  poner(s, 'dryosaurus', 0, 1);
  poner(s, 'dryosaurus', 1, 2);   // del rival: no cuenta

  assert.equal(ataqueEfectivo(s, a), 1 + BALANCE.rasgos.gregarioAtaquePorCompanero);
});

test('Ornitholestes: engorda con cada muerte del campo', () => {
  const s = tablero();
  const carroniero = poner(s, 'ornitholestes', 0, 3);
  poner(s, 'torvosaurus', 0, 0);
  poner(s, 'dryosaurus', 1, 0);

  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(vivo(r, carroniero), true);
  assert.ok(r.instancias[carroniero].modVida > 0);
});

test('Diplodocus y Gastrolitos curan heridas al final del turno', () => {
  const s = tablero();
  const diplo = poner(s, 'diplodocus', 0, 0);
  assert.equal(curacionDe(s, diplo), BALANCE.rasgos.ramoneoBajoCura);

  s.instancias[diplo].heridas = 4;
  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.instancias[diplo].heridas, 4 - BALANCE.rasgos.ramoneoBajoCura);
});

test('Torvosaurus no admite eventos de mejora', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const torvo = poner(s, 'torvosaurus', 0, 0);
  const adap = enMano(s, 'neumaticidad', 0);

  const motivo = validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: torvo });
  assert.match(motivo, /no admite eventos de mejora/);
});

test('Neumaticidad ósea sólo se da en terópodos y saurópodos', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const stego = poner(s, 'stegosaurus', 0, 0);
  const allo = poner(s, 'allosaurus', 0, 1);
  const adap = enMano(s, 'neumaticidad', 0);

  assert.match(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: stego }), /terópodos y saurópodos/);
  assert.equal(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: allo }), null);
});

test('Fractura consolidada baja el Ataque de un rival, no de un propio', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const propio = poner(s, 'allosaurus', 0, 0);
  const ajeno = poner(s, 'allosaurus', 1, 0);
  const carta = enMano(s, 'fractura', 0);

  assert.match(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: carta, objetivo: propio }), /no es del rival/);

  let r = reduce(s, { tipo: ACCION.EVENTO, jugador: 0, iid: carta, objetivo: ajeno });
  r = ejecutar(r, FASE.REVELACION);
  assert.equal(ataqueEfectivo(r, ajeno), 6 - BALANCE.rasgos.fracturaAtaque);
});

test('Las cartas de recurso resuelven al instante: la Biomasa se puede gastar este turno', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 1;
  const herido = poner(s, 'stegosaurus', 0, 0);
  const iid = enMano(s, 'rebrote', 0);

  const r = reduce(s, { tipo: ACCION.RECURSO, jugador: 0, iid });

  assert.equal(r.jugadores[0].biomasa, 1 + BALANCE.recursos.rebroteBiomasa, 'la Biomasa entra ya');
  assert.equal(r.jugadores[0].pendientes.length, 0, 'no espera a la revelación');
  assert.equal(r.instancias[herido].heridas, BALANCE.recursos.rebroteHeridas, 'y cobra su precio');
  assert.ok(r.jugadores[0].descarte.includes(iid));
});

test('Carroña abundante también da Biomasa al rival', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  const iid = enMano(s, 'carrona', 0);

  const r = reduce(s, { tipo: ACCION.RECURSO, jugador: 0, iid });

  assert.equal(r.jugadores[0].biomasa, BALANCE.recursos.carronaBiomasa);
  assert.equal(r.jugadores[1].biomasa, BALANCE.recursos.carronaBiomasaRival);
});

test('Ranuras cruzadas: cada uno pega al hábitat contrario, y con el Ataque a 0 no pega', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimerCombate;
  const mio = poner(s, 'dryosaurus', 0, 3);     // Ataque 1, nadie enfrente
  poner(s, 'dryosaurus', 1, 0);                 // Ataque 1, nadie enfrente

  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat - 1);
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - 1, 'el cruce es simétrico');

  // Una Fractura consolidada encima deja el Ataque en 0: avanza y no hace nada.
  s.instancias[mio].modAtaque = -BALANCE.rasgos.fracturaAtaque;
  assert.equal(ataqueEfectivo(s, mio), 0);
  const r2 = ejecutar(s, FASE.COMBATE);
  assert.equal(r2.jugadores[1].habitat, BALANCE.vidaHabitat, 'sin Ataque no hay daño al hábitat');
  assert.equal(r2.jugadores[0].habitat, BALANCE.vidaHabitat - 1, 'el suyo sí pega');
  const avance = r2.eventos.find((e) => e.tipo === 'AVANCE' && e.bando === 0);
  assert.equal(avance.dano, 0, 'el evento se emite igual, con 0: el registro lo cuenta');
});

// -------------------------------------------------------------- estaciones

test('Sequía: cobra heridas según la Vida, y Camarasaurus es inmune', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimeraEstacion;
  s.estacion.mazo = ['SEQUIA'];
  const diplo = poner(s, 'diplodocus', 0, 0);     // 10 de Vida: cuerpo grande
  const dryo = poner(s, 'dryosaurus', 0, 2);      // 2 de Vida
  const cama = poner(s, 'camarasaurus', 0, 1);    // inmune

  const r = ejecutar(s, FASE.ESTACION);
  assert.equal(r.instancias[diplo].heridas, BALANCE.estacion.sequiaHeridaGrande);
  assert.equal(r.instancias[dryo].heridas, BALANCE.estacion.sequiaHerida);
  assert.equal(r.instancias[cama].heridas, 0);
});

test('El Canal fluvial anula la Sequía por completo', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimeraEstacion;
  s.estacion.mazo = ['SEQUIA'];
  s.campo = 'canal';
  const diplo = poner(s, 'diplodocus', 0, 0);

  const r = ejecutar(s, FASE.ESTACION);
  assert.equal(r.instancias[diplo].heridas, 0);
});

test('La Crecida cura y frena el daño a los biomas', () => {
  const s = tablero();
  s.estacion.actual = 'CRECIDA';
  poner(s, 'allosaurus', 0, 0);   // sin rival enfrente

  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat, 'el agua frena el avance');
});

// ---------------------------------------------------------------- despliegue

test('No se puede desplegar en una ranura ocupada ni comprometida', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 20;
  poner(s, 'dryosaurus', 0, 0);
  const a = enMano(s, 'dryosaurus', 0);
  const b = enMano(s, 'dryosaurus', 0);

  assert.match(validar(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: a, ranura: 0 }), /ocupada/);

  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: a, ranura: 1 });
  assert.match(validar(r, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: b, ranura: 1 }), /comprometido/);
});

test('El despliegue permanece oculto hasta la revelación', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const iid = enMano(s, 'allosaurus', 0);

  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 2 });
  assert.equal(r.ranuras[0][2], null, 'todavía no está en el campo');
  assert.equal(r.jugadores[0].biomasa, 10 - 5, 'pero ya se ha pagado');

  const rev = ejecutar(r, FASE.REVELACION);
  assert.equal(rev.ranuras[0][2], iid);
});

test('Reparto inicial y arranque del turno 1', () => {
  const s = crearPartida(7);
  assert.equal(s.jugadores[0].mano.length, BALANCE.manoInicial);
  assert.equal(s.jugadores[1].mano.length, BALANCE.manoInicial + BALANCE.compensacionSegundoJugador.cartas);
  assert.equal(s.jugadores[0].habitat, BALANCE.vidaHabitat);
  for (const jug of s.jugadores) assert.equal(jug.mazo.length + jug.mano.length, TOTAL_MAZO);

  const tras = avanzar(s);
  assert.equal(tras.fase, FASE.DESPLIEGUE);
  assert.equal(tras.jugadores[0].biomasa, 1, 'turno 1 → 1 de Biomasa');
});
