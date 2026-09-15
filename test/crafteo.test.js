// El crafteo: fundir lo que sobra en esquirlas y crear lo que falta.
//
// Lo que se vigila es lo que rompería la economía sin avisar: un bucle en que
// fundir una carta pague crear otra de su rareza, crear por encima del tope
// —que convertiría lo creado en sobrante y se podría volver a fundir—, crear
// cartas de jefe, un precio del SQL que no es el del código, o fundir que
// siga dando monedas.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CRAFTEO, esquirlasDeFundir, costeDeCrear, sePuedeCrear } from '../src/data/crafteo.js';
import { CARTAS, RAREZA } from '../src/data/cards.js';
import { limiteDe } from '../src/data/coleccion.js';
import { SALIDA } from '../tools/generar-cartas.mjs';

const ESCALA = [RAREZA.COMUN, RAREZA.RARO, RAREZA.EPICO, RAREZA.LEGENDARIO];

test('Fundir una copia nunca paga crear otra de su misma rareza', () => {
  for (const r of ESCALA) {
    assert.ok(CRAFTEO.fundir[r] > 0 && CRAFTEO.crear[r] > 0, r);
    assert.ok(CRAFTEO.fundir[r] < CRAFTEO.crear[r], `${r}: fundir ${CRAFTEO.fundir[r]} y crear ${CRAFTEO.crear[r]} hacen bucle`);
  }
});

test('Cuanto más rara, más cuesta crearla y más da fundirla', () => {
  for (let i = 1; i < ESCALA.length; i++) {
    assert.ok(CRAFTEO.crear[ESCALA[i]] > CRAFTEO.crear[ESCALA[i - 1]]);
    assert.ok(CRAFTEO.fundir[ESCALA[i]] > CRAFTEO.fundir[ESCALA[i - 1]]);
  }
});

test('Sólo se funde lo que no cabe en un mazo', () => {
  const comun = Object.values(CARTAS).find((c) => c.rareza === RAREZA.COMUN && !c.copiasMax);
  const epica = Object.values(CARTAS).find((c) => c.rareza === RAREZA.EPICO);
  const col = { [comun.id]: limiteDe(comun.id) + 2, [epica.id]: limiteDe(epica.id) };
  assert.equal(esquirlasDeFundir(col), 2 * CRAFTEO.fundir[RAREZA.COMUN]);
});

test('Se crea una carta del set hasta su tope, y ninguna de jefe', () => {
  const c = Object.values(CARTAS).find((x) => x.rareza === RAREZA.RARO);
  assert.equal(costeDeCrear(c.id), CRAFTEO.crear[RAREZA.RARO]);
  assert.equal(sePuedeCrear(c.id, {}), true);
  assert.equal(sePuedeCrear(c.id, { [c.id]: limiteDe(c.id) - 1 }), true);
  assert.equal(sePuedeCrear(c.id, { [c.id]: limiteDe(c.id) }), false);
  assert.equal(sePuedeCrear('jefe_saurophaganax', {}), false);
  assert.equal(sePuedeCrear('no_existe', {}), false);
});

// -------------------------------------------------------------- el servidor
const SQL = readFileSync('supabase/migrations/0029_crafteo.sql', 'utf8');
const funcion = (nombre) => SQL.split(`create or replace function ${nombre}(`)[1]?.split('$$;')[0] ?? '';

test('El SQL del catálogo lleva exactamente los números del código', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  const bloque = sql.split('insert into public.catalogo_crafteo ')[1].split(';')[0];
  const filas = Object.fromEntries([...bloque.matchAll(/\('([A-Z]+)', (\d+), (\d+)\)/g)]
    .map(([, r, f, c]) => [r, { fundir: Number(f), crear: Number(c) }]));
  for (const r of ESCALA) assert.deepEqual(filas[r], { fundir: CRAFTEO.fundir[r], crear: CRAFTEO.crear[r] }, r);
});

test('Fundir da esquirlas y ya no da dinomonedas', () => {
  const cuerpo = funcion('public.fundir_excedente');
  assert.ok(cuerpo, 'la 0029 no define fundir_excedente');
  assert.match(cuerpo, /join public\.catalogo_crafteo k on k\.rareza = c\.rareza/);
  assert.match(cuerpo, /set esquirlas = esquirlas \+ v_esquirlas/);
  assert.match(cuerpo, /where id = v_id for update/);
  assert.doesNotMatch(cuerpo, /monedas/);
});

test('Crear cobra el catálogo, bloquea la fila, respeta el tope y no crea jefes', () => {
  const cuerpo = funcion('public.crear_carta');
  assert.ok(cuerpo, 'la 0029 no define crear_carta');
  assert.match(SQL, /function public\.crear_carta\(p_card text\)/, 'un coste en la firma sería un coste del cliente');
  assert.match(cuerpo, /select crear into v_coste from public\.catalogo_crafteo/);
  assert.match(cuerpo, /where id = v_id for update/);
  assert.match(cuerpo, /if v_jefe then raise exception/);
  assert.match(cuerpo, /if v_tengo >= v_max then/);
  assert.match(cuerpo, /if v_esquirlas < v_coste then/);
  assert.match(SQL, /revoke all on function public\.crear_carta\(text\) from public, anon;/);
  assert.match(funcion('public.mi_perfil'), /'esquirlas', j\.esquirlas/);
});
