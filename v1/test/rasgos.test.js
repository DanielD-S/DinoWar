// Un test por rasgo de carta (§6 y §7 de la spec).

import test from 'node:test';
import assert from 'node:assert/strict';

import { poderEfectivo, dominacion, produccionDe, FASE } from '../src/engine/state.js';
import { BALANCE } from '../src/data/balance.js';
import { tableroVacio, colocar, adherir, enMano, ejecutarFase, vivo, reduce, ACCION } from './helpers.js';

const ZONA_LLANURA = 1;
const ZONA_CANAL = 2;
const ZONA_BOSQUE = 3;
const ZONA_SABANA = 4;

test('Allosaurus — Depredador dominante: al ganar la zona elimina una segunda baja rival', () => {
  const s = tableroVacio();
  colocar(s, 'allosaurus', 0, ZONA_LLANURA);        // Poder 5
  const presa1 = colocar(s, 'dryosaurus', 1, ZONA_LLANURA);      // 1
  const presa2 = colocar(s, 'ornitholestes', 1, ZONA_LLANURA);   // 1
  const presa3 = colocar(s, 'ornitholestes', 1, ZONA_LLANURA);   // 1 → total 3

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, presa1), false, 'la baja normal cae');
  assert.equal(vivo(r, presa2), false, 'Allosaurus se lleva una segunda');
  assert.equal(vivo(r, presa3), true, 'pero no una tercera');
});

test('Allosaurus — sin ganar la zona no dispara', () => {
  const s = tableroVacio();
  const allo = colocar(s, 'allosaurus', 0, ZONA_LLANURA);   // 5
  const a = colocar(s, 'torvosaurus', 1, ZONA_LLANURA);     // 6
  const b = colocar(s, 'dryosaurus', 1, ZONA_LLANURA);      // 1 → total 7

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, allo), false);
  assert.equal(vivo(r, a), true);
  assert.equal(vivo(r, b), true);
});

test('Ceratosaurus — Ribereño: +2 Poder sólo en el Canal fluvial', () => {
  const s = tableroVacio();
  const enCanal = colocar(s, 'ceratosaurus', 0, ZONA_CANAL);
  const enLlanura = colocar(s, 'ceratosaurus', 0, ZONA_LLANURA);

  assert.equal(poderEfectivo(s, enCanal), 4 + BALANCE.rasgos.riberenoPoder);
  assert.equal(poderEfectivo(s, enLlanura), 4);
});

test('Torvosaurus — Escaso: sólo una copia en el mazo', () => {
  const copias = BALANCE.mazo.find(([id]) => id === 'torvosaurus')[1];
  assert.equal(copias, 1);
});

test('Torvosaurus — Sin sinergias: no admite adaptaciones ni recibe Gregarismo', () => {
  const s = tableroVacio();
  const torvo = colocar(s, 'torvosaurus', 0, ZONA_LLANURA);
  const otroTorvo = colocar(s, 'torvosaurus', 0, ZONA_LLANURA);
  adherir(s, 'gregarismo', otroTorvo);

  assert.equal(poderEfectivo(s, torvo), 6, 'ignora el Gregarismo de su misma especie');

  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const adaptacion = enMano(s, 'gregarismo', 0);
  const r = reduce(s, { tipo: ACCION.ADAPTAR, jugador: 0, iid: adaptacion, objetivo: torvo });

  assert.equal(r.eventos.at(-1).tipo, 'RECHAZADA');
  assert.equal(r.jugadores[0].biomasa, 10, 'una acción rechazada no cuesta nada');
});

test('Ornitholestes — Oportunista: +1 Biomasa por cada muerte en su zona', () => {
  const s = tableroVacio();
  colocar(s, 'allosaurus', 0, ZONA_LLANURA);
  const carroniero = colocar(s, 'ornitholestes', 0, ZONA_LLANURA);
  colocar(s, 'dryosaurus', 1, ZONA_LLANURA);
  colocar(s, 'dryosaurus', 1, ZONA_LLANURA);

  const r = ejecutarFase(s, FASE.RESOLUCION);

  // Mueren dos (baja normal + Depredador dominante); el carroñero sobrevive.
  assert.equal(vivo(r, carroniero), true);
  assert.equal(r.jugadores[0].biomasa, 2 * BALANCE.rasgos.oportunistaBiomasaPorMuerte);
});

test('Ornitholestes — si muere, no cobra', () => {
  const s = tableroVacio();
  const carroniero = colocar(s, 'ornitholestes', 0, ZONA_LLANURA);
  colocar(s, 'allosaurus', 1, ZONA_LLANURA);

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, carroniero), false);
  assert.equal(r.jugadores[0].biomasa, 0);
});

test('Apatosaurus — Masa colosal: sobrevive la primera baja, no la segunda', () => {
  const s = tableroVacio();
  const apato = colocar(s, 'apatosaurus', 0, ZONA_LLANURA);   // 6
  colocar(s, 'torvosaurus', 1, ZONA_LLANURA);                 // 6
  colocar(s, 'dryosaurus', 1, ZONA_LLANURA);                  // 1 → 7 gana el rival

  const r1 = ejecutarFase(s, FASE.RESOLUCION);
  assert.equal(vivo(r1, apato), true, 'absorbe la primera');
  assert.equal(r1.instancias[apato].colosalGastado, true);

  const r2 = ejecutarFase(r1, FASE.RESOLUCION);
  assert.equal(vivo(r2, apato), false, 'la segunda ya no');
});

test('Apatosaurus — la carga se recupera al salir del tablero', () => {
  const s = tableroVacio();
  const apato = colocar(s, 'apatosaurus', 0, ZONA_LLANURA, { colosalGastado: true });
  colocar(s, 'torvosaurus', 1, ZONA_LLANURA);
  colocar(s, 'dryosaurus', 1, ZONA_LLANURA);

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, apato), false);
  assert.equal(r.instancias[apato].colosalGastado, false, 'vuelve al mazo como población nueva');
});

test('Diplodocus — Ramoneo bajo: +1 Biomasa de producción en su zona dominada', () => {
  const s = tableroVacio();
  colocar(s, 'diplodocus', 0, ZONA_LLANURA);
  const p = produccionDe(s, 0);
  assert.equal(p.biomasaZonas, 3 + BALANCE.rasgos.ramoneoBajoBiomasa);
});

test('Diplodocus — si no domina la zona, no aporta nada', () => {
  const s = tableroVacio();
  colocar(s, 'diplodocus', 0, ZONA_LLANURA);     // 4
  colocar(s, 'torvosaurus', 1, ZONA_LLANURA);    // 6
  const p = produccionDe(s, 0);
  assert.equal(p.biomasaZonas, 0);
});

test('Camarasaurus — Migrador: se reubica sólo a una zona adyacente', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  const cama = colocar(s, 'camarasaurus', 0, ZONA_CANAL);

  const lejos = reduce(s, { tipo: ACCION.REUBICAR, jugador: 0, iid: cama, zona: ZONA_SABANA });
  assert.equal(lejos.eventos.at(-1).tipo, 'RECHAZADA');

  const cerca = reduce(s, { tipo: ACCION.REUBICAR, jugador: 0, iid: cama, zona: ZONA_BOSQUE });
  assert.equal(cerca.jugadores[0].pendientes.length, 1);

  const revelado = ejecutarFase(cerca, FASE.REVELACION);
  assert.equal(revelado.instancias[cama].zona, ZONA_BOSQUE);
  assert.equal(revelado.zonas[ZONA_CANAL - 1].unidades.includes(cama), false);
});

test('Camarasaurus — reubicarse no cuesta Biomasa pero ocupa hueco de zona', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 5;
  const cama = colocar(s, 'camarasaurus', 0, ZONA_CANAL);

  const r = reduce(s, { tipo: ACCION.REUBICAR, jugador: 0, iid: cama, zona: ZONA_BOSQUE });

  assert.equal(r.jugadores[0].biomasa, 5);
  assert.equal(r.jugadores[0].desplieguesPorZona[ZONA_BOSQUE - 1], 1);
});

test('Stegosaurus — Tagomizador: al perder la zona se lleva a un ganador por delante', () => {
  const s = tableroVacio();
  const stego = colocar(s, 'stegosaurus', 0, ZONA_LLANURA);   // 3
  const grande = colocar(s, 'torvosaurus', 1, ZONA_LLANURA);  // 6
  const pequeno = colocar(s, 'dryosaurus', 1, ZONA_LLANURA);  // 1

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, stego), false, 'el Stegosaurus cae igualmente');
  assert.equal(vivo(r, pequeno), false, 'y arrastra al de menor Poder del ganador');
  assert.equal(vivo(r, grande), true);
});

test('Stegosaurus — puede matar al Allosaurus que lo mata (muertes simultáneas)', () => {
  const s = tableroVacio();
  const stego = colocar(s, 'stegosaurus', 0, ZONA_LLANURA);   // 3
  const allo = colocar(s, 'allosaurus', 1, ZONA_LLANURA);     // 5

  const r = ejecutarFase(s, FASE.RESOLUCION);

  assert.equal(vivo(r, stego), false);
  assert.equal(vivo(r, allo), false, 'el tagomizador se resuelve sobre el tablero previo');
});

test('Dryosaurus — Gregario: +1 Poder por cada otro Dryosaurus propio en la zona', () => {
  const s = tableroVacio();
  const a = colocar(s, 'dryosaurus', 0, ZONA_LLANURA);
  colocar(s, 'dryosaurus', 0, ZONA_LLANURA);
  colocar(s, 'dryosaurus', 0, ZONA_LLANURA);
  colocar(s, 'dryosaurus', 1, ZONA_LLANURA);   // del rival: no cuenta

  assert.equal(poderEfectivo(s, a), 1 + 2 * BALANCE.rasgos.gregarioPoderPorCompanero);
});

test('Gregarismo — +1 Poder a los de la misma especie y bando en esa zona', () => {
  const s = tableroVacio();
  const a = colocar(s, 'stegosaurus', 0, ZONA_LLANURA);
  const b = colocar(s, 'stegosaurus', 0, ZONA_LLANURA);
  const otraEspecie = colocar(s, 'diplodocus', 0, ZONA_LLANURA);
  const otraZona = colocar(s, 'stegosaurus', 0, ZONA_CANAL);
  const delRival = colocar(s, 'stegosaurus', 1, ZONA_LLANURA);
  adherir(s, 'gregarismo', a);

  assert.equal(poderEfectivo(s, a), 3 + BALANCE.rasgos.gregarismoPoder);
  assert.equal(poderEfectivo(s, b), 3 + BALANCE.rasgos.gregarismoPoder);
  assert.equal(poderEfectivo(s, otraEspecie), 4);
  assert.equal(poderEfectivo(s, otraZona), 3);
  assert.equal(poderEfectivo(s, delRival), 3);
});

test('Gastrolitos — +1 Biomasa de producción mientras el portador siga en juego', () => {
  const s = tableroVacio();
  const cama = colocar(s, 'camarasaurus', 0, ZONA_SABANA);
  adherir(s, 'gastrolitos', cama);

  const conCarta = produccionDe(s, 0);
  assert.equal(conCarta.biomasaZonas, 1 + BALANCE.rasgos.gastrolitosBiomasa);

  const sinCarta = tableroVacio();
  colocar(sinCarta, 'camarasaurus', 0, ZONA_SABANA);
  assert.equal(produccionDe(sinCarta, 0).biomasaZonas, 1);
});

test('Crecimiento acelerado — no aporta Poder el turno en que se juega', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 5;
  const stego = colocar(s, 'stegosaurus', 0, ZONA_LLANURA);
  const carta = enMano(s, 'crecimiento_acelerado', 0);

  let r = reduce(s, { tipo: ACCION.ADAPTAR, jugador: 0, iid: carta, objetivo: stego });
  r = ejecutarFase(r, FASE.REVELACION);

  assert.equal(poderEfectivo(r, stego), 3, 'todavía no');

  r = ejecutarFase(r, FASE.RESOLUCION);
  assert.equal(poderEfectivo(r, stego), 3 + BALANCE.rasgos.crecimientoPoder, 'sobrevivió: +2 permanente');
});

test('Crecimiento acelerado — si el objetivo muere, no hay +2 y la carta se pierde', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 5;
  const stego = colocar(s, 'stegosaurus', 0, ZONA_LLANURA);
  colocar(s, 'torvosaurus', 1, ZONA_LLANURA);
  const carta = enMano(s, 'crecimiento_acelerado', 0);

  let r = reduce(s, { tipo: ACCION.ADAPTAR, jugador: 0, iid: carta, objetivo: stego });
  r = ejecutarFase(r, FASE.REVELACION);
  r = ejecutarFase(r, FASE.RESOLUCION);

  assert.equal(vivo(r, stego), false);
  assert.equal(r.instancias[stego].modPoder, 0);
  assert.ok(r.jugadores[0].descarte.includes(carta), 'la adaptación acompaña al portador al descarte');
});

test('Una adaptación se puede jugar sobre un dinosaurio desplegado el mismo turno', () => {
  const s = tableroVacio();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const dino = enMano(s, 'stegosaurus', 0);
  const adap = enMano(s, 'gregarismo', 0);

  let r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: dino, zona: ZONA_LLANURA });
  r = reduce(r, { tipo: ACCION.ADAPTAR, jugador: 0, iid: adap, objetivo: dino });

  assert.equal(r.jugadores[0].pendientes.length, 2, 'ambas cartas quedan ocultas');
  assert.equal(r.eventos.filter((e) => e.tipo === 'RECHAZADA').length, 0);
  r = ejecutarFase(r, FASE.REVELACION);
  assert.equal(poderEfectivo(r, dino), 3 + BALANCE.rasgos.gregarismoPoder);
});
