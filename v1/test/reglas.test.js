// Reglas de zona, bucle de turno, estaciones y condiciones de fin.

import test from 'node:test';
import assert from 'node:assert/strict';

import { BALANCE } from '../src/data/balance.js';
import {
  crearPartida, dominacion, produccionDe, costeDespliegue,
  FASE, MOTIVO_FIN, consumoHidricoDe,
} from '../src/engine/state.js';
import { reduce, ACCION, avanzar, opcionesSequia, validar } from '../src/engine/actions.js';
import { tableroVacio, colocar, enMano, ejecutarFase, vivo } from './helpers.js';

const [Z1, Z2, Z3, Z4] = [1, 2, 3, 4];

// ------------------------------------------------------------------ dominación

test('Empate de Poder deja la zona neutral y sin bajas', () => {
  const s = tableroVacio();
  const a = colocar(s, 'stegosaurus', 0, Z1);   // 3
  const b = colocar(s, 'stegosaurus', 1, Z1);   // 3

  assert.equal(dominacion(s)[0].dominador, null);

  const r = ejecutarFase(s, FASE.RESOLUCION);
  assert.equal(vivo(r, a), true);
  assert.equal(vivo(r, b), true);
});

test('Zona vacía: neutral, sin producción para nadie', () => {
  const s = tableroVacio();
  assert.deepEqual(dominacion(s).map((d) => d.dominador), [null, null, null, null]);
  assert.equal(produccionDe(s, 0).biomasaZonas, 0);
});

test('Zona con un solo bando: domina y no hay baja que cobrar', () => {
  const s = tableroVacio();
  const solo = colocar(s, 'dryosaurus', 0, Z4);

  assert.equal(dominacion(s)[3].dominador, 0);

  const r = ejecutarFase(s, FASE.RESOLUCION);
  assert.equal(vivo(r, solo), true);
});

test('Modelo A: hay baja cada turno en zona disputada aunque nadie despliegue', () => {
  const s = tableroVacio();
  colocar(s, 'torvosaurus', 0, Z1);                    // 6
  const debil = colocar(s, 'dryosaurus', 1, Z1);       // 1
  const otro = colocar(s, 'ceratosaurus', 1, Z1);      // 4 → total 5

  // Ningún despliegue nuevo: los pendientes están vacíos.
  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, debil), false, 'cae la de menor Poder del perdedor');
  assert.equal(vivo(r, otro), true);
});

// ------------------------------------------------------------------ producción

test('Producción: sólo cobra quien domina, y el Territorio se acumula', () => {
  const s = tableroVacio();
  colocar(s, 'dryosaurus', 0, Z4);

  const r = ejecutarFase(s, FASE.PRODUCCION);

  // La cifra sale de balance.js: el test comprueba la regla, no el número.
  assert.equal(r.jugadores[0].territorio, BALANCE.zonas[Z4 - 1].territorio);
  assert.equal(r.jugadores[1].territorio, 0);
  assert.ok(BALANCE.zonas[Z4 - 1].territorio > 0, 'la Sabana debe producir Territorio');
});

test('D3: el suelo de ingreso rescata al bando sin zonas', () => {
  const s = tableroVacio();
  colocar(s, 'torvosaurus', 0, Z1);   // el jugador 1 no domina nada

  const p = produccionDe(s, 1);
  assert.equal(p.biomasaZonas, 0);
  assert.equal(p.biomasa, BALANCE.ingresoMinimoBiomasa);
  assert.equal(p.suelo, true);

  const r = ejecutarFase(s, FASE.PRODUCCION);
  assert.equal(r.jugadores[1].biomasa, BALANCE.ingresoMinimoBiomasa);
});

test('D3: el suelo no toca a quien ya produce por encima de él', () => {
  const s = tableroVacio();
  colocar(s, 'torvosaurus', 0, Z1);   // llanura: 3 Biomasa

  const p = produccionDe(s, 0);
  assert.equal(p.biomasa, 3);
  assert.equal(p.suelo, false);
});

// ------------------------------------------------------------------ estaciones

test('D1: la estación se voltea antes de la producción, no después', () => {
  const s = tableroVacio();
  s.turno = BALANCE.turnoPrimeraEstacion;
  s.estacion.mazo = ['CRECIDA'];
  colocar(s, 'diplodocus', 0, Z1);   // 4, domina la llanura

  const tras = ejecutarFase(s, FASE.ESTACION);
  assert.equal(tras.estacion.actual, 'CRECIDA');
  assert.equal(tras.fase, FASE.PRODUCCION, 'la producción viene después');

  const conProduccion = ejecutarFase(tras, FASE.PRODUCCION);
  // Llanura duplicada (3×2) + Ramoneo bajo (+1).
  assert.equal(conProduccion.jugadores[0].biomasa, 3 * 2 + BALANCE.rasgos.ramoneoBajoBiomasa);
});

test('No hay estación antes del turno indicado', () => {
  const s = tableroVacio();
  s.turno = BALANCE.turnoPrimeraEstacion - 1;
  const r = ejecutarFase(s, FASE.ESTACION);
  assert.equal(r.estacion.actual, null);
  assert.equal(r.fase, FASE.PRODUCCION);
});

test('Crecida — desplegar en la Sabana de helechos cuesta +1 Biomasa', () => {
  const s = tableroVacio();
  s.estacion.actual = 'CRECIDA';

  const recargo = BALANCE.estacion.crecida.recargo;
  assert.equal(costeDespliegue(s, 'stegosaurus', Z4), 3 + recargo);
  assert.equal(costeDespliegue(s, 'stegosaurus', Z1), 3);
});

test('Crecida — duplica también el Agua del canal fluvial', () => {
  const s = tableroVacio();
  s.estacion.actual = 'CRECIDA';
  colocar(s, 'dryosaurus', 0, Z2);

  const p = produccionDe(s, 0);
  assert.equal(p.agua, 3 * 2);
});

test('Sequía — se paga el consumo hídrico y Camarasaurus es inmune', () => {
  const s = tableroVacio();
  s.turno = BALANCE.turnoPrimeraEstacion;
  s.estacion.mazo = ['SEQUIA'];
  s.jugadores[0].agua = 10;
  s.jugadores[1].agua = 10;
  colocar(s, 'apatosaurus', 0, Z1);     // consumo 3
  colocar(s, 'camarasaurus', 0, Z1);    // inmune

  assert.equal(consumoHidricoDe(s, 0), 3);

  const r = ejecutarFase(s, FASE.ESTACION);
  assert.equal(r.jugadores[0].agua, 7);
  assert.equal(r.fase, FASE.PRODUCCION, 'si se puede pagar, no se interrumpe el turno');
});

test('Sequía — sin Agua suficiente hay que sacrificar, y la elección es del dueño', () => {
  const s = tableroVacio();
  s.turno = BALANCE.turnoPrimeraEstacion;
  s.estacion.mazo = ['SEQUIA'];
  s.jugadores[0].agua = 3;
  s.jugadores[1].agua = 99;
  const apato = colocar(s, 'apatosaurus', 0, Z1);   // 3
  const diplo = colocar(s, 'diplodocus', 0, Z1);    // 3 → total 6 > 3

  const tras = ejecutarFase(s, FASE.ESTACION);
  assert.equal(tras.fase, FASE.SEQUIA_PAGO);
  assert.deepEqual(tras.sequiaPendiente, [0]);

  const opciones = opcionesSequia(tras, 0);
  assert.ok(opciones.length > 0);
  for (const op of opciones) assert.equal(validar(tras, { tipo: ACCION.PAGAR_SEQUIA, jugador: 0, sacrificios: op }), null);

  const r = reduce(tras, { tipo: ACCION.PAGAR_SEQUIA, jugador: 0, sacrificios: [apato] });
  assert.equal(vivo(r, apato), false);
  assert.equal(vivo(r, diplo), true);
  assert.equal(r.jugadores[0].agua, 0, 'y se paga lo que queda');
  assert.equal(r.fase, FASE.PRODUCCION);
});

test('Sequía — no se admite sacrificar de más', () => {
  const s = tableroVacio();
  s.jugadores[0].agua = 3;
  s.fase = FASE.SEQUIA_PAGO;
  s.sequiaPendiente = [0];
  s.estacion.actual = 'SEQUIA';
  const apato = colocar(s, 'apatosaurus', 0, Z1);
  const diplo = colocar(s, 'diplodocus', 0, Z1);

  const motivo = validar(s, { tipo: ACCION.PAGAR_SEQUIA, jugador: 0, sacrificios: [apato, diplo] });
  assert.match(motivo, /más de lo necesario/);
});

test('Sequía — Masa colosal no protege de la deshidratación', () => {
  const s = tableroVacio();
  s.jugadores[0].agua = 0;
  s.fase = FASE.SEQUIA_PAGO;
  s.sequiaPendiente = [0];
  const apato = colocar(s, 'apatosaurus', 0, Z1);

  const r = reduce(s, { tipo: ACCION.PAGAR_SEQUIA, jugador: 0, sacrificios: [apato] });
  assert.equal(vivo(r, apato), false);
});

// ----------------------------------------------------------------- despliegue

test('Máximo de cartas por zona y turno', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 20;
  const cartas = [enMano(s, 'dryosaurus', 0), enMano(s, 'dryosaurus', 0), enMano(s, 'dryosaurus', 0)];

  let r = s;
  for (const iid of cartas) r = reduce(r, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, zona: Z1 });

  assert.equal(r.jugadores[0].pendientes.length, BALANCE.maxDesplieguesPorZona);
  assert.equal(r.eventos.at(-1).tipo, 'RECHAZADA');
});

test('No se puede desplegar sin Biomasa', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 3;
  const iid = enMano(s, 'torvosaurus', 0);   // coste 6

  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, zona: Z1 });
  assert.match(r.eventos.at(-1).motivo, /Biomasa insuficiente/);
  assert.equal(r.jugadores[0].biomasa, 3);
});

test('El despliegue permanece oculto hasta la revelación', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 5;
  const iid = enMano(s, 'stegosaurus', 0);

  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, zona: Z1 });
  assert.equal(r.zonas[0].unidades.length, 0, 'no está en la zona todavía');
  assert.equal(r.instancias[iid].zona, null);

  const rev = ejecutarFase(r, FASE.REVELACION);
  assert.equal(rev.zonas[0].unidades.includes(iid), true);
});

test('Cuando ambos bandos pasan, se revela', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  let r = reduce(s, { tipo: ACCION.PASAR, jugador: 0 });
  assert.equal(r.fase, FASE.DESPLIEGUE);
  r = reduce(r, { tipo: ACCION.PASAR, jugador: 1 });
  assert.equal(r.fase, FASE.REVELACION);
});

// ------------------------------------------------------------------ fin y robo

test('Robo: 2 cartas si no dominas ninguna zona, 1 si dominas alguna', () => {
  const s = tableroVacio();
  colocar(s, 'dryosaurus', 0, Z1);
  const antes = s.jugadores.map((j) => j.mano.length);

  const r = ejecutarFase(s, FASE.ROBO);

  assert.equal(r.jugadores[0].mano.length - antes[0], BALANCE.robo.normal);
  assert.equal(r.jugadores[1].mano.length - antes[1], BALANCE.robo.sinZonas);
});

test('D4: quedarse sin mazo y sin descarte es perder', () => {
  const s = tableroVacio();
  s.jugadores[0].mazo = [];
  s.jugadores[0].descarte = [];
  s.jugadores[0].territorio = 99;   // aunque vayas ganando en Territorio

  const r = ejecutarFase(s, FASE.ROBO);

  assert.equal(r.fase, FASE.FIN);
  assert.equal(r.motivoFin, MOTIVO_FIN.SIN_CARTAS);
  assert.equal(r.ganador, 1);
});

test('D4: con mazo vacío pero descarte lleno, se rebaraja y se sigue', () => {
  const s = tableroVacio();
  const cartas = s.jugadores[0].mazo.slice(0, 5);
  s.jugadores[0].mazo = [];
  s.jugadores[0].descarte = cartas;

  const r = ejecutarFase(s, FASE.ROBO);

  assert.equal(r.fase, FASE.DESPLIEGUE);
  assert.equal(r.jugadores[0].descarte.length, 0);
  assert.ok(r.eventos.some((e) => e.tipo === 'REBARAJADO'));
});

test('Muerte permanente: la baja sale del juego y no vuelve a barajarse', () => {
  const s = tableroVacio();
  const debil = colocar(s, 'dryosaurus', 0, Z1);
  colocar(s, 'torvosaurus', 1, Z1);

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, debil), false);
  if (BALANCE.muertePermanente) {
    assert.ok(r.jugadores[0].extintos.includes(debil), 'va a la pila de extintos');
    assert.equal(r.jugadores[0].descarte.includes(debil), false, 'y no al descarte');

    // Con mazo vacío, el rebarajado no puede recuperarla.
    const sinMazo = structuredClone(r);
    sinMazo.jugadores[0].mazo = [];
    const tras = ejecutarFase(sinMazo, FASE.ROBO);
    assert.equal(tras.jugadores[0].mazo.includes(debil), false, 'un extinto no vuelve al mazo');
  } else {
    assert.ok(r.jugadores[0].descarte.includes(debil));
  }
});

test('Victoria por Territorio al alcanzar el umbral', () => {
  const s = tableroVacio();
  s.jugadores[0].territorio = BALANCE.objetivoTerritorio;

  const r = ejecutarFase(s, FASE.CHEQUEO);

  assert.equal(r.fase, FASE.FIN);
  assert.equal(r.ganador, 0);
  assert.equal(r.motivoFin, MOTIVO_FIN.TERRITORIO);
});

test('Empate a Territorio en el umbral: gana el segundo jugador', () => {
  const s = tableroVacio();
  s.jugadores[0].territorio = BALANCE.objetivoTerritorio;
  s.jugadores[1].territorio = BALANCE.objetivoTerritorio;

  const r = ejecutarFase(s, FASE.CHEQUEO);
  assert.equal(r.ganador, 1);
});

test('El chequeo avanza de turno y limpia el estado por turno', () => {
  const s = tableroVacio();
  s.jugadores[0].listo = true;
  s.jugadores[0].desplieguesPorZona = [2, 0, 0, 0];
  s.estacion.actual = 'SEQUIA';

  const r = ejecutarFase(s, FASE.CHEQUEO);

  assert.equal(r.turno, 2);
  assert.equal(r.fase, FASE.ESTACION);
  assert.equal(r.jugadores[0].listo, false);
  assert.deepEqual(r.jugadores[0].desplieguesPorZona, [0, 0, 0, 0]);
  assert.equal(r.estacion.actual, null);
});

test('Límite de mano: hay que descartar el exceso antes del chequeo', () => {
  const s = tableroVacio();
  for (let k = 0; k < BALANCE.manoMaxima + 2; k++) enMano(s, 'dryosaurus', 0);

  const r = ejecutarFase(s, FASE.RESOLUCION);
  assert.equal(r.fase, FASE.DESCARTE);

  let d = r;
  while (d.jugadores[0].mano.length > BALANCE.manoMaxima) {
    d = reduce(d, { tipo: ACCION.DESCARTAR, jugador: 0, iid: d.jugadores[0].mano[0] });
  }
  assert.equal(d.fase, FASE.CHEQUEO);
});

// -------------------------------------------------------------------- reparto

test('Reparto inicial conforme a §9', () => {
  const s = crearPartida(7);

  assert.equal(s.jugadores[0].mano.length, BALANCE.manoInicial);
  assert.equal(s.jugadores[1].mano.length, BALANCE.manoInicial);
  assert.equal(s.jugadores[0].biomasa, BALANCE.recursosIniciales.biomasa);
  assert.equal(
    s.jugadores[1].biomasa,
    BALANCE.recursosIniciales.biomasa + BALANCE.compensacionSegundoJugador.biomasa,
    'el segundo jugador arranca con +1 Biomasa',
  );
  for (const jug of s.jugadores) {
    assert.equal(jug.mazo.length + jug.mano.length, 20);
  }
  assert.equal(s.turno, 1);
  assert.equal(s.fase, FASE.ESTACION);
});

test('El turno 1 arranca sin estación y llega al despliegue', () => {
  const s = avanzar(crearPartida(3));
  assert.equal(s.fase, FASE.DESPLIEGUE);
  assert.equal(s.estacion.actual, null);
  assert.equal(s.jugadores[0].mano.length, BALANCE.manoInicial + BALANCE.robo.sinZonas);
});
