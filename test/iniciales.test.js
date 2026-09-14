// Los mazos iniciales: lo que se elige al crear la cuenta.
//
// Lo que se vigila es lo que se equivoca en silencio: un inicial que no es del
// clado que dice, el SQL que siembra otro mazo que el que se enseña, y la
// migración que vuelve a sembrar sola en `entrar()` —con lo que nadie llegaría
// a ver la elección—. El balance no se prueba aquí: se mide con
// `node sim/iniciales.mjs`, que tarda minutos.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MAZOS_INICIALES, inicialPorId } from '../src/data/iniciales.js';
import { carta, TIPO } from '../src/data/cards.js';
import { SALIDA } from '../tools/generar-cartas.mjs';

test('Son tres, con ids distintos, y se encuentran por id', () => {
  assert.equal(MAZOS_INICIALES.length, 3);
  assert.equal(new Set(MAZOS_INICIALES.map((m) => m.id)).size, 3);
  for (const m of MAZOS_INICIALES) assert.equal(inicialPorId(m.id), m);
  assert.equal(inicialPorId('el_que_me_regala_todo'), null);
});

test('Cada inicial es de verdad del clado que anuncia', () => {
  // El emblema de la pantalla de mazos es el clado DOMINANTE. Un «Manadas» con
  // más terópodos que ornitópodos saldría con el emblema de otro.
  for (const m of MAZOS_INICIALES) {
    const cuenta = new Map();
    for (const [id, n] of m.mazo) {
      const c = carta(id);
      if (c.tipo === TIPO.DINOSAURIO) cuenta.set(c.clado, (cuenta.get(c.clado) ?? 0) + n);
    }
    const [dominante] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
    assert.equal(dominante, m.clado, `${m.id} dice ${m.clado} y domina ${dominante}`);
  }
});

test('El SQL siembra exactamente los mazos que enseña la pantalla', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  const bloque = sql.split('insert into public.catalogo_iniciales ')[1].split(';')[0];
  const filas = [...bloque.matchAll(/\('([a-z_]+)', '[^']+', '([a-z_0-9]+)', (\d+)\)/g)];
  const esperadas = MAZOS_INICIALES.flatMap((m) => m.mazo.map(([id, n]) => `${m.id}:${id}:${n}`));
  assert.deepEqual(filas.map(([, m, id, n]) => `${m}:${id}:${n}`).sort(), esperadas.sort());
});

const MIGRACION = readFileSync('supabase/migrations/0023_mazo_inicial.sql', 'utf8');
const funcion = (nombre) => MIGRACION.split(`create or replace function ${nombre}(`)[1]?.split('$$;')[0] ?? '';

test('entrar() ya no siembra: si sembrara, nadie llegaría a elegir', () => {
  const cuerpo = funcion('public.entrar');
  assert.ok(cuerpo, 'la 0023 no redefine entrar()');
  assert.doesNotMatch(cuerpo, /sembrar/);
});

test('Sembrar lee el mazo de la tabla y no siembra dos veces', () => {
  const cuerpo = funcion('private.sembrar_inicial');
  assert.match(cuerpo, /from public\.catalogo_iniciales where mazo = p_mazo/);
  assert.match(cuerpo, /not sembrado for update/);
});

test('Elegir sólo lo puede llamar quien ha entrado', () => {
  assert.match(MIGRACION, /revoke all on function public\.elegir_mazo_inicial\(text\) from public, anon;/);
  assert.match(MIGRACION, /grant execute on function public\.elegir_mazo_inicial\(text\) to authenticated;/);
  assert.match(MIGRACION, /revoke all on function private\.sembrar_inicial\(uuid, text\) from public, anon, authenticated;/);
});

test('El perfil dice si la cuenta está sembrada', () => {
  assert.match(funcion('public.mi_perfil'), /'sembrado', j\.sembrado/);
});
