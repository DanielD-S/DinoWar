// Pureza y determinismo del motor. Es la verificación que H2 convierte en
// permanente: si algún día el motor toca el DOM o muta su argumento, falla aquí.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { crearPartida, vistaDe, FASE } from '../src/engine/state.js';
import { reduce, ACCION, avanzar } from '../src/engine/actions.js';
import { jugarPartida } from '../sim/partida.js';
import { tableroVacio, enMano } from './helpers.js';

test('reduce() no muta el estado que recibe', () => {
  const s = avanzar(crearPartida(11));
  const antes = JSON.stringify(s);

  reduce(s, { tipo: ACCION.PASAR, jugador: 0 });
  reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: s.jugadores[0].mano[0], zona: 1 });
  reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: -1, zona: 9 });   // ilegal

  assert.equal(JSON.stringify(s), antes);
});

test('Una acción ilegal no lanza y deja el estado funcionalmente intacto', () => {
  const s = avanzar(crearPartida(12));
  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: 99999, zona: 2 });

  assert.equal(r.eventos.at(-1).tipo, 'RECHAZADA');
  assert.deepEqual(r.jugadores[0].mano, s.jugadores[0].mano);
  assert.equal(r.jugadores[0].biomasa, s.jugadores[0].biomasa);
  assert.equal(r.fase, s.fase);
});

test('Misma semilla, misma partida', () => {
  const a = jugarPartida(2024);
  const b = jugarPartida(2024);

  assert.equal(a.estado.turno, b.estado.turno);
  assert.equal(a.estado.ganador, b.estado.ganador);
  assert.deepEqual(a.jugadas, b.jugadas);
  assert.equal(JSON.stringify(a.estado), JSON.stringify(b.estado));
});

test('Semillas distintas producen partidas distintas', () => {
  const a = jugarPartida(1);
  const b = jugarPartida(2);
  assert.notEqual(JSON.stringify(a.estado), JSON.stringify(b.estado));
});

test('El estado es serializable: nada de funciones, Map, Set ni referencias cíclicas', () => {
  const { estado } = jugarPartida(5);
  const round = JSON.parse(JSON.stringify(estado));
  assert.deepEqual(round, JSON.parse(JSON.stringify(estado)));

  const recorrer = (v, ruta) => {
    if (v === null || typeof v !== 'object') {
      assert.notEqual(typeof v, 'function', `función en ${ruta}`);
      return;
    }
    assert.ok(!(v instanceof Map) && !(v instanceof Set), `colección no serializable en ${ruta}`);
    for (const k of Object.keys(v)) recorrer(v[k], `${ruta}.${k}`);
  };
  recorrer(estado, 'estado');
});

test('vistaDe() oculta la mano y el despliegue del rival', () => {
  const s0 = tableroVacio();
  s0.fase = FASE.DESPLIEGUE;
  s0.jugadores[1].biomasa = 5;
  enMano(s0, 'allosaurus', 1);
  const oculta = enMano(s0, 'stegosaurus', 1);
  const s = reduce(s0, { tipo: ACCION.DESPLEGAR, jugador: 1, iid: oculta, zona: 1 });

  const v = vistaDe(s, 0);

  assert.equal(v.jugadores[1].mano.length, 0);
  assert.equal(v.jugadores[1].manoOculta, 1);
  assert.equal(v.jugadores[1].pendientes.length, 0);
  assert.equal(v.jugadores[1].pendientesOcultos, 1);
  assert.equal(typeof v.jugadores[1].mazo, 'number');
  assert.equal(v.instancias[oculta], undefined, 'la carta oculta ni siquiera aparece');
  assert.equal(v.jugadores[0].mano.length, s.jugadores[0].mano.length, 'la propia sí se ve');
});

test('Motor y datos no referencian el DOM ni APIs de navegador', () => {
  // La frontera es explícita: engine/ y data/ tienen que correr en Node.
  // ui/ y main.js son la capa de interfaz y sí pueden tocar el DOM.
  const ruta = (p) => new URL(`../${p}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const prohibido = /\b(document|window|localStorage|sessionStorage|navigator|requestAnimationFrame|alert)\b/;

  const revisar = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const hijo = join(dir, entrada.name);
      if (entrada.isDirectory()) { revisar(hijo); continue; }
      if (!entrada.name.endsWith('.js')) continue;
      assert.equal(prohibido.test(readFileSync(hijo, 'utf8')), false, `${hijo} referencia el DOM`);
    }
  };

  revisar(ruta('src/engine'));
  revisar(ruta('src/data'));
  revisar(ruta('sim'));
});
