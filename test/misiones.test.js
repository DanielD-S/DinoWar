// Misiones diarias. Tres guardianes y cada uno vigila una forma distinta de
// romperlas en silencio:
//
//   1. Una misión que mide un contador que no existe se juega, se enseña y
//      NUNCA avanza. Es el mismo fallo que `entrda: { roba: 1 }` en una
//      mecánica: no es un error de sintaxis, es una carta muerta.
//   2. El sorteo del día tiene que ser estable. Si cambia entre dos llamadas,
//      el navegador pinta unas misiones y el servidor acredita otras.
//   3. El premio del día tiene techo. Un catálogo que se va inflando convierte
//      abrir el juego un rato en la forma barata de tenerlo todo, y eso no
//      falla en ningún sitio: sólo se nota meses después en la economía.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATALOGO, POR_ID, MISIONES, VOCABULARIO, misionesDelDia, parteVacio,
  anotarEventos, cerrarParte, avancesDelParte, mideAlgoConocido, diaUTC,
} from '../src/data/misiones.js';
import { ECONOMIA } from '../src/data/coleccion.js';
import { CARTAS, TIPO, CLADO } from '../src/data/cards.js';
import { validarSolitario } from '../supabase/functions/_compartido/validarSolitario.js';
import { jugarSolo } from './helpers.js';

// ------------------------------------------------------------- el catálogo

test('Toda misión mide un contador del vocabulario', () => {
  for (const m of CATALOGO) {
    assert.ok(mideAlgoConocido(m),
      `la misión «${m.id}» mide «${m.mide}», que no está en el vocabulario`);
  }
});

test('Los identificadores no se repiten', () => {
  assert.equal(Object.keys(POR_ID).length, CATALOGO.length);
});

test('Toda misión tiene nombre, texto, meta y premio de verdad', () => {
  for (const m of CATALOGO) {
    assert.ok(m.nombre && m.texto, `«${m.id}» sin nombre o sin texto`);
    assert.ok(Number.isInteger(m.meta) && m.meta > 0, `«${m.id}» con meta rara`);
    assert.ok(Number.isInteger(m.premio) && m.premio > 0, `«${m.id}» sin premio`);
  }
});

test('El texto de la misión cita su meta, como el de una carta cita su número', () => {
  for (const m of CATALOGO) {
    assert.match(m.texto, new RegExp(`\\b${m.meta}\\b`),
      `«${m.id}» pide ${m.meta} y su texto no lo dice: «${m.texto}»`);
  }
});

test('Hay misiones de sobra para no repetir en el día', () => {
  assert.ok(CATALOGO.length > MISIONES.porDia * 2);
});

// ------------------------------------------------------------- el sorteo

test('El mismo día da siempre las mismas misiones', () => {
  for (const dia of ['2026-09-12', '2026-01-01', '2027-12-31']) {
    assert.deepEqual(misionesDelDia(dia), misionesDelDia(dia));
  }
});

test('Son tres y no se repiten entre ellas', () => {
  for (const dia of ['2026-09-12', '2026-02-28', '2026-06-06']) {
    const hoy = misionesDelDia(dia);
    assert.equal(hoy.length, MISIONES.porDia);
    assert.equal(new Set(hoy.map((m) => m.id)).size, MISIONES.porDia);
  }
});

test('Días distintos no dan siempre lo mismo', () => {
  // No se exige que TODOS difieran —con 16 misiones y 3 al día hay colisiones
  // legítimas— sino que el sorteo se mueva de verdad a lo largo de un mes.
  const vistas = new Set();
  for (let d = 1; d <= 28; d++) {
    vistas.add(misionesDelDia(`2026-04-${String(d).padStart(2, '0')}`).map((m) => m.id).join());
  }
  assert.ok(vistas.size >= 20, `sólo ${vistas.size} combinaciones distintas en 28 días`);
});

test('El día se pide en UTC y con la forma que espera el sorteo', () => {
  assert.match(diaUTC(new Date('2026-09-12T23:30:00Z')), /^2026-09-12$/);
  assert.match(diaUTC(), /^\d{4}-\d{2}-\d{2}$/);
});

// -------------------------------------------------------------- el techo

test('Tres misiones de un día no pagan más que sobre y medio', () => {
  const techo = ECONOMIA.precioSobre * 1.5;
  // Se comprueba el peor día POSIBLE, no el de hoy: lo que importa es que el
  // catálogo no pueda juntar tres caras, no que hoy no lo haya hecho.
  const caras = CATALOGO.map((m) => m.premio).sort((a, b) => b - a)
    .slice(0, MISIONES.porDia).reduce((a, b) => a + b, 0);
  assert.ok(caras <= techo,
    `el día más caro posible paga ${caras} y el techo son ${techo}`);
});

// --------------------------------------------------------------- el parte

test('Un parte vacío tiene todos los contadores a cero', () => {
  const p = parteVacio();
  for (const clave of VOCABULARIO) assert.equal(p[clave], 0, clave);
});

test('Las bajas son las del RIVAL, no las tuyas', () => {
  const p = parteVacio();
  anotarEventos(p, [
    { tipo: 'MUERTE', dueno: 1, cardId: 'x' },
    { tipo: 'MUERTE', dueno: 1, cardId: 'x' },
    { tipo: 'MUERTE', dueno: 0, cardId: 'x' },
  ]);
  assert.equal(p.bajas, 2);
});

test('El daño al hábitat es el que recibe el rival', () => {
  const p = parteVacio();
  anotarEventos(p, [
    { tipo: 'HABITAT', bando: 1, cantidad: 4 },
    { tipo: 'HABITAT', bando: 0, cantidad: 7 },
    { tipo: 'HABITAT', bando: 1, cantidad: 2 },
  ]);
  assert.equal(p.danoHabitat, 6);
});

test('Una criatura revelada suma a su clado y al total', () => {
  const dino = Object.values(CARTAS).find((c) => c.tipo === TIPO.DINOSAURIO
    && c.clado === CLADO.SAUROPODO);
  const p = parteVacio();
  anotarEventos(p, [
    { tipo: 'REVELADA', jugador: 0, cardId: dino.id },
    { tipo: 'REVELADA', jugador: 1, cardId: dino.id },   // la del rival no cuenta
  ]);
  assert.equal(p.desplegados, 1);
  assert.equal(p[`clado:${CLADO.SAUROPODO}`], 1);
});

test('Un clima puesto por ti cuenta; el del rival no', () => {
  const clima = Object.values(CARTAS).find((c) => c.tipo === TIPO.CLIMA);
  const p = parteVacio();
  anotarEventos(p, [
    { tipo: 'CAMPO', jugador: 0, cardId: clima.id },
    { tipo: 'CAMPO', jugador: 1, cardId: clima.id },
  ]);
  assert.equal(p.climas, 1);
});

test('Una carta desconocida en un evento no rompe el parte', () => {
  const p = parteVacio();
  anotarEventos(p, [{ tipo: 'REVELADA', jugador: 0, cardId: 'no_existe' }]);
  assert.equal(p.desplegados, 0);
});

test('Cerrar el parte marca la victoria relámpago sólo si se ganó', () => {
  const ganada = cerrarParte(parteVacio(), { ganada: true, turnos: 8, trofeos: 3 });
  assert.equal(ganada.victorias, 1);
  assert.equal(ganada.relampago, 1);
  assert.equal(ganada.trofeos, 3);

  const lenta = cerrarParte(parteVacio(), { ganada: true, turnos: 40, trofeos: 1 });
  assert.equal(lenta.relampago, 0);

  const perdida = cerrarParte(parteVacio(), { ganada: false, turnos: 5, trofeos: 0 });
  assert.equal(perdida.victorias, 0);
  assert.equal(perdida.relampago, 0);
  assert.equal(perdida.partidas, 1);
});

// ------------------------------------------------- el parte de una partida real

test('Re-jugar una partida deja un parte con cosas dentro', () => {
  // Una partida entera jugada como la juega el navegador y mandada al
  // validador tal cual: es el camino exacto de una victoria cobrada.
  const envio = jugarSolo(20260912);
  const r = validarSolitario(envio);

  assert.ok(r.parte, 'el validador no devuelve parte');
  assert.equal(r.parte.partidas, 1);
  assert.equal(r.parte.victorias, r.ganada ? 1 : 0);
  assert.ok(r.parte.desplegados > 0, 'una partida entera sin desplegar nada');
  assert.equal(r.parte.trofeos, r.trofeos);
  assert.equal(r.ganada, envio.ganada, 'el servidor no llegó al mismo ganador');

  // Y los contadores por clado suman lo mismo que el total: si alguno se
  // escapa de su clado, es que `REVELADA` trajo una carta sin clado conocido.
  const porClado = Object.values(CLADO)
    .reduce((n, c) => n + r.parte[`clado:${c}`], 0);
  assert.equal(porClado, r.parte.desplegados);
});

test('Los avances sólo incluyen lo que de verdad se movió', () => {
  const dia = '2026-09-12';
  const parte = parteVacio();
  const avances = avancesDelParte(dia, parte);
  assert.deepEqual(avances, [], 'un parte vacío no avanza nada');

  const conVictoria = cerrarParte(parteVacio(), { ganada: true, turnos: 9, trofeos: 2 });
  for (const a of avancesDelParte(dia, conVictoria)) {
    assert.ok(a.avance > 0, `«${a.id}» aparece con avance ${a.avance}`);
    assert.ok(POR_ID[a.id], `«${a.id}» no está en el catálogo`);
  }
});
