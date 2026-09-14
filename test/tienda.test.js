// La tienda: el catálogo, lo que se cobra en el servidor y el arte.
//
// Lo que se vigila es lo que se equivoca en silencio: un precio del SQL que no
// es el del código, una compra que no bloquea la fila o que acepta el precio
// del cliente, un equipado que deja ponerse lo que no es tuyo, y el
// interruptor de arte mintiendo sobre el disco.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  COSMETICOS, TIPO_COSMETICO, porDefecto, loTiene, equipadoDe,
} from '../src/data/cosmeticos.js';
import { SALIDA } from '../tools/generar-cartas.mjs';

test('Cada tipo tiene su artículo gratuito y el resto cuesta dinomonedas', () => {
  for (const tipo of Object.values(TIPO_COSMETICO)) {
    const gratis = porDefecto(tipo);
    assert.ok(gratis, `${tipo} sin artículo gratuito`);
    assert.equal(gratis.precio, 0);
  }
  for (const c of COSMETICOS.filter((x) => !x.porDefecto)) assert.ok(c.precio > 0, `${c.id} gratis sin serlo`);
});

test('Lo equipado que no es tuyo cae al gratuito', () => {
  const nadie = { cosmeticos: [], equipado: {} };
  assert.equal(equipadoDe(nadie, 'DORSO').id, 'dorso_clasico');
  // Equipado a mano en una caché, sin haberlo comprado: no cuenta.
  const tramposo = { cosmeticos: [], equipado: { DORSO: 'dorso_ambar' } };
  assert.equal(equipadoDe(tramposo, 'DORSO').id, 'dorso_clasico');
  assert.equal(loTiene(tramposo, 'dorso_ambar'), false);
  const comprador = { cosmeticos: ['dorso_ambar'], equipado: { DORSO: 'dorso_ambar' } };
  assert.equal(equipadoDe(comprador, 'DORSO').id, 'dorso_ambar');
  // Un id que ya no existe tampoco deja a nadie sin dorso.
  assert.equal(equipadoDe({ cosmeticos: ['viejo'], equipado: { DORSO: 'viejo' } }, 'DORSO').id, 'dorso_clasico');
});

test('El SQL del catálogo lleva exactamente los precios del código', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  const bloque = sql.split('insert into public.catalogo_cosmeticos ')[1].split(';')[0];
  const filas = [...bloque.matchAll(/\('([a-z_]+)', '([A-Z]+)', (\d+), (true|false)\)/g)]
    .map(([, id, tipo, precio, def]) => `${id}:${tipo}:${precio}:${def}`).sort();
  const esperadas = COSMETICOS.map((c) => `${c.id}:${c.tipo}:${c.precio}:${!!c.porDefecto}`).sort();
  assert.deepEqual(filas, esperadas);
});

const MIGRACION = readFileSync('supabase/migrations/0024_tienda.sql', 'utf8');
const funcion = (nombre) => MIGRACION.split(`create or replace function ${nombre}(`)[1]?.split('$$;')[0] ?? '';

test('Comprar cobra el precio del catálogo, con la fila bloqueada, y no dos veces', () => {
  const cuerpo = funcion('public.comprar_cosmetico');
  assert.ok(cuerpo, 'la 0024 no define comprar_cosmetico');
  assert.match(cuerpo, /from public\.catalogo_cosmeticos where id = p_id/);
  assert.match(cuerpo, /where id = v_id for update/);
  assert.match(cuerpo, /ya lo tienes/);
  assert.match(cuerpo, /v_monedas < v_precio/);
  // La función recibe sólo el id: un precio en la firma sería un precio del cliente.
  assert.match(MIGRACION, /function public\.comprar_cosmetico\(p_id text\)/);
});

test('Equipar sólo deja ponerse lo que es tuyo o el gratuito', () => {
  const cuerpo = funcion('public.equipar_cosmetico');
  assert.match(cuerpo, /not v_defecto and not exists/);
  assert.match(cuerpo, /no es tuyo/);
});

test('Las dos funciones son sólo para quien ha entrado', () => {
  for (const f of ['comprar_cosmetico', 'equipar_cosmetico']) {
    assert.match(MIGRACION, new RegExp(`revoke all on function public\\.${f}\\(text\\) from public, anon;`));
    assert.match(MIGRACION, new RegExp(`grant execute on function public\\.${f}\\(text\\) to authenticated;`));
  }
});

test('El perfil dice qué has comprado y qué llevas puesto', () => {
  const cuerpo = funcion('public.mi_perfil');
  assert.match(cuerpo, /'cosmeticos'/);
  assert.match(cuerpo, /'equipado', j\.equipado/);
  // Y conserva lo que ya decía la 0023.
  assert.match(cuerpo, /'sembrado', j\.sembrado/);
});

test('El menú tiene la placa de la tienda', () => {
  assert.match(readFileSync('index.html', 'utf8'), /<button id="btn-tienda" class="placa placa-tienda">/);
});

// ---------------------------------------------------------------- el arte
// tienda.js importa perfil.js, que lee `location` al cargar: el interruptor y
// la lista se leen como texto para no arrastrar el navegador a Node.
const js = readFileSync('src/ui/tienda.js', 'utf8');
const ARTE_LISTO = /export const ARTE_LISTO = true;/.test(js);
const PIEZAS = JSON.parse(js.match(/export const PIEZAS = Object\.freeze\((\[[^\]]*\])\)/)[1].replace(/'/g, '"'));

test('tools/tienda.py sirve exactamente las piezas que la tienda conoce', () => {
  const py = readFileSync('tools/tienda.py', 'utf8');
  const bloque = py.split('PIEZAS = {')[1].split('}')[0];
  const servidas = [...bloque.matchAll(/'([a-z_]+)':/g)].map((m) => m[1]).sort();
  assert.deepEqual(servidas, [...PIEZAS].sort());
});

test('ARTE_LISTO dice la verdad sobre el disco', () => {
  const ruta = (p) => (p.startsWith('placa_') ? `assets/piel/${p}.webp` : `assets/piel/tienda/${p}.webp`);
  const faltan = PIEZAS.filter((p) => !existsSync(ruta(p)));
  if (ARTE_LISTO) assert.deepEqual(faltan, [], 'ARTE_LISTO está encendido y faltan piezas');
  else assert.ok(faltan.length > 0, 'están todas las piezas de la tienda: pon ARTE_LISTO = true en src/ui/tienda.js');
});

test('Cada dorso de pago apunta a una pieza que la herramienta conoce', () => {
  for (const c of COSMETICOS.filter((x) => x.tipo === 'DORSO' && !x.porDefecto)) {
    const nombre = c.arte.split('/').pop().replace('.webp', '');
    assert.ok(PIEZAS.includes(nombre), `${c.id} pide «${c.arte}» y no está en PIEZAS`);
  }
});
