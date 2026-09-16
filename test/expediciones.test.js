// Las Expediciones: el solitario como un camino de rivales con su propio mazo.
//
// Lo que se prueba aquí es lo que no puede fallar en silencio: que los mazos
// de los rivales sean legales, que el servidor re-juegue contra el mazo que
// ÉL busca por el id del rival y no contra el que diga el navegador, y que la
// primera victoria se apunte con una clave que no se pueda cobrar dos veces.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  EXPEDICIONES, VISITANTES, rivalPorId, requisitoDe, claveDeVictoria, semanaDe, visitanteDe,
} from '../src/data/expediciones.js';
import { validarSolitario } from '../supabase/functions/_compartido/validarSolitario.js';
import { PartidaInvalida } from '../supabase/functions/_compartido/validarPartida.js';
import { validarMazoLegal } from '../supabase/functions/_compartido/validarPartida.js';
import { PERFIL } from '../src/engine/ai.js';
import { MAZO } from '../src/data/balance.js';
import { jugarSolo } from './helpers.js';

const TODOS = [...EXPEDICIONES.flatMap((e) => e.rivales), ...VISITANTES];

// ---------------------------------------------------------------- los datos

test('Todo rival tiene un mazo legal, un perfil que existe y un premio', () => {
  const perfiles = new Set(Object.values(PERFIL));
  for (const r of TODOS) {
    assert.doesNotThrow(() => validarMazoLegal(r.mazo.map((e) => [...e])), r.id);
    assert.ok(perfiles.has(r.perfil), `${r.id}: perfil «${r.perfil}» no existe`);
    assert.ok(Number.isInteger(r.premio) && r.premio > 0, `${r.id}: sin premio`);
    assert.ok(r.nombre && r.lema, `${r.id}: sin nombre o lema`);
  }
});

test('Ningún id se repite, ni entre expediciones ni con los visitantes', () => {
  const ids = TODOS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('Ningún rival lleva el mazo de referencia: sería el solitario de antes con otro nombre', () => {
  const clave = (m) => JSON.stringify([...m].map((e) => [...e]).sort());
  const referencia = clave(MAZO);
  for (const r of TODOS) assert.notEqual(clave(r.mazo), referencia, r.id);
});

test('El camino se abre en orden y los visitantes no piden nada', () => {
  for (const e of EXPEDICIONES) {
    for (let i = 1; i < e.rivales.length; i++) {
      assert.equal(requisitoDe(e.rivales[i].id), e.rivales[i - 1].id, e.id);
    }
  }
  for (const v of VISITANTES) assert.equal(requisitoDe(v.id), null);
  assert.equal(rivalPorId('no_existe'), null);
});

test('Una expedición encadenada pide el ÚLTIMO nodo de la que la abre', () => {
  const porId = new Map(EXPEDICIONES.map((e) => [e.id, e]));
  let encadenadas = 0;
  for (const e of EXPEDICIONES) {
    const primero = e.rivales[0].id;
    if (!e.requiere) {
      assert.equal(requisitoDe(primero), null, `${e.id}: sin requiere y aun así pide algo`);
      continue;
    }
    const previa = porId.get(e.requiere);
    assert.ok(previa, `${e.id}: requiere «${e.requiere}», que no existe`);
    assert.equal(requisitoDe(primero), previa.rivales[previa.rivales.length - 1].id, e.id);
    encadenadas += 1;
  }
  // Sin esta línea el test pasaría en vacío el día que alguien quitase el
  // `requiere` de todas: comprobaría cero encadenados y diría que bien.
  assert.ok(encadenadas > 0, 'ninguna expedición encadenada: ¿se perdió el requiere?');
});

test('Al menos una expedición queda abierta de entrada: si no, no se puede empezar', () => {
  assert.ok(EXPEDICIONES.some((e) => !e.requiere));
});

test('La primera victoria se apunta una vez para siempre en el camino y una por semana con el visitante', () => {
  const [morrison] = EXPEDICIONES;
  const nodo = morrison.rivales[2].id;
  assert.equal(claveDeVictoria(nodo, '2026-09-14'), claveDeVictoria(nodo, '2027-01-01'));
  const v = VISITANTES[0].id;
  assert.equal(claveDeVictoria(v, '2026-09-14'), claveDeVictoria(v, '2026-09-20'), 'lunes y domingo, misma semana');
  assert.notEqual(claveDeVictoria(v, '2026-09-14'), claveDeVictoria(v, '2026-09-21'), 'el lunes siguiente, otra');
});

test('La semana empieza en lunes y el visitante rota entre todos', () => {
  assert.equal(semanaDe('2026-09-13') + 1, semanaDe('2026-09-14'), 'del domingo al lunes cambia');
  assert.equal(semanaDe('2026-09-14'), semanaDe('2026-09-20'));
  const vistos = new Set();
  for (let d = 0; d < 7 * VISITANTES.length; d += 7) {
    const dia = new Date(Date.UTC(2026, 8, 14) + d * 86400000).toISOString().slice(0, 10);
    vistos.add(visitanteDe(dia).id);
  }
  assert.equal(vistos.size, VISITANTES.length);
});

// ------------------------------------------------------------- el servidor

test('El servidor re-juega contra el mazo y el perfil del rival, y llega al mismo ganador', () => {
  for (const r of [EXPEDICIONES[0].rivales[0], EXPEDICIONES[0].rivales[7]]) {
    const partida = jugarSolo(4321, PERFIL.HEURISTICA, r);
    const v = validarSolitario(partida);
    assert.equal(v.ganada, partida.ganada, `${r.id}: el servidor jugó otra partida`);
    assert.equal(v.rival, r.id);
  }
});

test('Lo que diga el navegador del mazo o la dificultad del rival no se lee', () => {
  const r = EXPEDICIONES[0].rivales[5];
  const partida = jugarSolo(777, PERFIL.HEURISTICA, r);
  const trampa = {
    ...partida,
    perfil: PERFIL.ALEATORIA,
    mazoRival: [['dryosaurus', 55]],
  };
  assert.deepEqual(validarSolitario(trampa), validarSolitario(partida));
});

test('Un rival que no existe es una partida inválida, no una contra el mazo de referencia', () => {
  const partida = jugarSolo(99, PERFIL.HEURISTICA);
  assert.throws(() => validarSolitario({ ...partida, rival: 'el_que_se_deja' }),
    (e) => e instanceof PartidaInvalida && /desconocido/.test(e.message));
});

test('Sin rival, el solitario sigue siendo el de siempre', () => {
  const partida = jugarSolo(123, PERFIL.HEURISTICA);
  const v = validarSolitario(partida);
  assert.equal(v.rival, null);
  assert.equal(v.ganada, partida.ganada);
});

// ------------------------------------------------------------------ el SQL

test('La migración paga una vez, pide el nodo anterior y va revocada', () => {
  const sql = readFileSync('supabase/migrations/0012_expediciones.sql', 'utf8');
  assert.match(sql, /primary key \(jugador_id, clave\)/);
  assert.match(sql, /on conflict \(jugador_id, clave\) do nothing/);
  assert.match(sql, /p_requisito is not null and not exists/);
  assert.match(sql, /revoke all on function public\.aplicar_expedicion\([^)]*\) from public, anon, authenticated/);
  assert.match(sql, /revoke all on function public\.mis_expediciones\(\) from public, anon/);
  assert.doesNotMatch(sql, /truncate/i);
});

test('La Edge Function saca rival, premio y requisito de los datos, en las dos versiones', () => {
  for (const f of ['supabase/functions/asalto/index.ts', 'supabase/functions/asalto/desde-url.ts']) {
    const ts = readFileSync(f, 'utf8');
    assert.match(ts, /aplicar_expedicion/, f);
    assert.match(ts, /p_premio: r\.premio/, `${f}: el premio tiene que salir de los datos`);
    assert.match(ts, /p_requisito: requisitoDe\(r\.id\)/, f);
    assert.match(ts, /resultado\.ganada && resultado\.rival/, `${f}: sólo se paga lo que la re-jugada dio por ganado`);
  }
});
