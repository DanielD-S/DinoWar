// Rejugar un nodo de expedición paga según el RIVAL, no plano.
//
// Lo que no puede fallar en silencio son dos cosas. Una, que los números se
// separen: quien paga es el SQL de la 0035 y el cliente enseña `rejugar.js`,
// así que un cambio en uno y no en el otro deja la pantalla mintiendo —la
// misma trampa que «regenerar no es aplicar»—. Y dos, que la media suba: un
// tercio del premio está elegido porque el premio medio de los 37 rivales es
// 166, o sea casi las 50 de una victoria normal.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { REJUGAR, pagoDeRejugar, extraDeRejugar } from '../src/data/rejugar.js';
import { ECONOMIA } from '../src/data/coleccion.js';
import { EXPEDICIONES, VISITANTES } from '../src/data/expediciones.js';

const TODOS = [...EXPEDICIONES.flatMap((e) => e.rivales), ...VISITANTES];
// El divisor lo manda la ÚLTIMA migración que reescribe la función, no la que
// la estrenó: la 0035 la creó con 3, la 0036 la dejó en 5 al bajar las
// victorias y la 0037 la devolvió a 3 al recortar los premios. Apuntar a una
// concreta obliga a acordarse de cambiar esta línea, que es justo lo que nadie
// hace: se busca sola, como la copia del catálogo de logros.
const SQL = readdirSync(new URL('../supabase/migrations', import.meta.url))
  .filter((f) => f.endsWith('.sql')).sort()
  .map((f) => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), 'utf8'))
  .filter((x) => x.includes('c_divisor')).pop();

test('Los dos números viven en el SQL con el mismo valor que en los datos', () => {
  assert.match(SQL, new RegExp(`c_divisor\\s+constant int := ${REJUGAR.divisor};`));
  assert.match(SQL, new RegExp(`c_por_dia\\s+constant int := ${REJUGAR.porDia};`));
});

test('La firma de aplicar_expedicion no cambia: la llama la Edge Function', () => {
  assert.match(SQL, /aplicar_expedicion\(\s*\n?\s*p_jugador uuid, p_clave text, p_rival text, p_requisito text, p_premio int/);
});

test('Rejugar nunca paga menos que una victoria normal, ni más del triple', () => {
  for (const r of TODOS) {
    const pago = pagoDeRejugar(r.premio);
    assert.ok(pago >= ECONOMIA.monedasVictoria, `${r.id} pagaría ${pago}`);
    assert.ok(pago <= 3 * ECONOMIA.monedasVictoria, `${r.id} pagaría ${pago}, más del triple`);
    assert.equal(extraDeRejugar(r.premio), pago - ECONOMIA.monedasVictoria);
  }
});

test('La media de rejugar se queda donde estaba: el reparto cambia, el grifo no', () => {
  const media = TODOS.reduce((n, r) => n + pagoDeRejugar(r.premio), 0) / TODOS.length;
  assert.ok(media >= ECONOMIA.monedasVictoria, `la media baja a ${media.toFixed(0)}`);
  assert.ok(media <= ECONOMIA.monedasVictoria * 1.35,
    `la media sube a ${media.toFixed(0)}, que es inflar el grifo y no repartirlo`);
});

test('El último nodo de cada mapa paga más que el primero', () => {
  for (const e of EXPEDICIONES) {
    const primero = pagoDeRejugar(e.rivales[0].premio);
    const ultimo = pagoDeRejugar(e.rivales[e.rivales.length - 1].premio);
    assert.ok(ultimo > primero, `${e.id}: ${ultimo} contra ${primero}`);
  }
});
