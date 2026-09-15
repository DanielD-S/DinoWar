// La tienda: el catálogo, lo que se cobra en el servidor y el arte.
//
// Lo que se vigila es lo que se equivoca en silencio: un precio del SQL que no
// es el del código, una compra que no bloquea la fila o que acepta el precio
// del cliente, un equipado que deja ponerse lo que no es tuyo, lo del rival
// contado a quien no está en el duelo, y el interruptor de arte mintiendo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  COSMETICOS, TIPO_COSMETICO, PACKS, precioDePack, porDefecto, loTiene, equipadoDe,
} from '../src/data/cosmeticos.js';
import { SALIDA } from '../tools/generar-cartas.mjs';
import { ECONOMIA } from '../src/data/coleccion.js';
import { LOGRO_POR_ID } from '../src/data/logros.js';

test('Cada tipo tiene su artículo gratuito y el resto cuesta dinomonedas', () => {
  for (const tipo of Object.values(TIPO_COSMETICO)) {
    const gratis = porDefecto(tipo);
    assert.ok(gratis, `${tipo} sin artículo gratuito`);
    assert.equal(gratis.precio, 0);
  }
  for (const c of COSMETICOS.filter((x) => !x.porDefecto && !x.gratis && !x.exclusivo)) assert.ok(c.precio > 0, `${c.id} gratis sin serlo`);
});

test('Lo gratuito de cada tipo es lo que el juego enseñaba antes de la tienda', () => {
  // Si cambiara, todo jugador que no ha comprado nada vería otra cosa.
  assert.equal(porDefecto('DORSO').arte, 'assets/piel/dorso.webp');
  assert.equal(porDefecto('TAPETE').arte, 'assets/piel/piedra.webp');
  assert.equal(porDefecto('TAPETE').medallon, 'assets/piel/simbolo_huella.webp');
  assert.equal(porDefecto('ESTANDARTE').arte, 'assets/piel/vs/estandarte_propio.webp');
});

test('Lo equipado que no es tuyo cae al gratuito', () => {
  const nadie = { cosmeticos: [], equipado: {} };
  assert.equal(equipadoDe(nadie, 'DORSO').id, 'dorso_clasico');
  assert.equal(equipadoDe(nadie, 'TAPETE').id, 'tapete_clasico');
  // Equipado a mano en una caché, sin haberlo comprado: no cuenta.
  const tramposo = { cosmeticos: [], equipado: { DORSO: 'dorso_ambar', TAPETE: 'tapete_volcan' } };
  assert.equal(equipadoDe(tramposo, 'DORSO').id, 'dorso_clasico');
  assert.equal(equipadoDe(tramposo, 'TAPETE').id, 'tapete_clasico');
  assert.equal(loTiene(tramposo, 'dorso_ambar'), false);
  const comprador = { cosmeticos: ['dorso_ambar'], equipado: { DORSO: 'dorso_ambar' } };
  assert.equal(equipadoDe(comprador, 'DORSO').id, 'dorso_ambar');
  // Un id que ya no existe tampoco deja a nadie sin dorso, ni uno de otro tipo.
  assert.equal(equipadoDe({ cosmeticos: ['viejo'], equipado: { DORSO: 'viejo' } }, 'DORSO').id, 'dorso_clasico');
  assert.equal(equipadoDe({ cosmeticos: ['tapete_ambar'], equipado: { DORSO: 'tapete_ambar' } }, 'DORSO').id, 'dorso_clasico');
});

test('Los retratos: uno por defecto, otro gratis para elegir, y el resto de pago', () => {
  assert.equal(porDefecto('RETRATO').id, 'retrato_paleontologa');
  const nadie = { cosmeticos: [], equipado: {} };
  assert.equal(equipadoDe(nadie, 'RETRATO').id, 'retrato_paleontologa');
  // El gratuito se lleva sin comprarlo; uno de pago, no.
  assert.equal(loTiene(nadie, 'retrato_buscador'), true);
  assert.equal(equipadoDe({ cosmeticos: [], equipado: { RETRATO: 'retrato_buscador' } }, 'RETRATO').id, 'retrato_buscador');
  assert.equal(equipadoDe({ cosmeticos: [], equipado: { RETRATO: 'retrato_amonite' } }, 'RETRATO').id, 'retrato_paleontologa');
  for (const c of COSMETICOS.filter((x) => x.precio === 0)) {
    assert.ok(c.porDefecto || c.gratis || c.exclusivo, `${c.id} cuesta 0 sin decir que es gratis`);
  }
});

test('Lo gratuito no se compra y se equipa sin comprarlo (0026)', () => {
  const RETRATOS = readFileSync('supabase/migrations/0026_retratos.sql', 'utf8');
  assert.match(funcion(RETRATOS, 'public.comprar_cosmetico'), /if v_defecto or v_precio = 0 then raise exception 'ese ya es tuyo'/);
  const equipar = funcion(RETRATOS, 'public.equipar_cosmetico');
  assert.match(equipar, /not v_defecto and v_precio > 0 and not exists/);
  assert.match(equipar, /no es tuyo/);
  for (const f of ['comprar_cosmetico', 'equipar_cosmetico']) {
    assert.match(RETRATOS, new RegExp(`revoke all on function public\\.${f}\\(text\\) from public, anon;`));
  }
});

test('Las legendarias y las de jefe llevan la lámina holográfica, con la ilustración aislada', () => {
  const css = readFileSync('carta.css', 'utf8');
  const regla = css.match(/\.con-marco\.rareza-LEGENDARIO \.c-arte::before,\s*\.con-marco\.jefe \.c-arte::before \{([^}]*)\}/)?.[1];
  assert.ok(regla, 'no hay lámina holográfica');
  assert.match(regla, /mix-blend-mode: color-dodge/);
  // Sin imagen: la textura que hubo traía una línea dibujada que, al moverse,
  // cruzaba la ilustración como una costura. Un degradado no tiene.
  assert.doesNotMatch(regla, /url\(/, 'la lámina vuelve a llevar una imagen');
  assert.match(css, /\.con-marco\.jefe \.c-arte \{ overflow: hidden; isolation: isolate; \}/);
});

test('Los packs de sobres no llevan descuento: n sobres cuestan n veces uno', () => {
  assert.ok(PACKS.length > 0);
  for (const n of PACKS) {
    assert.ok(Number.isInteger(n) && n > 1, `un pack de ${n} no es un pack`);
    assert.equal(precioDePack(n), n * ECONOMIA.precioSobre, `el pack de ${n} sale más barato por sobre`);
  }
  // Y los packs no son cosméticos: no entran en el catálogo que cobra el servidor.
  assert.ok(!COSMETICOS.some((c) => /pack/.test(c.id)));
});

test('El SQL del catálogo lleva exactamente los precios del código', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  const bloque = sql.split('insert into public.catalogo_cosmeticos ')[1].split(';')[0];
  const filas = [...bloque.matchAll(/\('([a-z_]+)', '([A-Z]+)', (\d+), (true|false), (true|false)\)/g)]
    .map(([, id, tipo, precio, def, ex]) => `${id}:${tipo}:${precio}:${def}:${ex}`).sort();
  const esperadas = COSMETICOS.map((c) => `${c.id}:${c.tipo}:${c.precio}:${!!c.porDefecto}:${!!c.exclusivo}`).sort();
  assert.deepEqual(filas, esperadas);
});

test('Lo exclusivo se gana con un logro que existe, y no es de nadie hasta entonces', () => {
  const exclusivos = COSMETICOS.filter((c) => c.exclusivo);
  assert.ok(exclusivos.length > 0);
  for (const c of exclusivos) {
    assert.equal(c.precio, 0);
    assert.ok(LOGRO_POR_ID[c.logro], `${c.id} se gana con «${c.logro}», que no es un logro`);
    assert.equal(loTiene({ cosmeticos: [], equipado: {} }, c.id), false, `${c.id} es de todos sin ganarlo`);
    assert.equal(loTiene({ cosmeticos: [c.id], equipado: {} }, c.id), true);
  }
  // Y un título otorgado se equipa; sin otorgar, cae al de por defecto.
  assert.equal(equipadoDe({ cosmeticos: ['titulo_duelista'], equipado: { TITULO: 'titulo_duelista' } }, 'TITULO').texto, 'Duelista');
  assert.equal(equipadoDe({ cosmeticos: [], equipado: { TITULO: 'titulo_duelista' } }, 'TITULO').id, 'titulo_ninguno');
  // El servidor rechaza comprar lo exclusivo y equiparlo sin tenerlo (0027).
  const LOGROS_SQL = readFileSync('supabase/migrations/0027_logros.sql', 'utf8');
  assert.match(funcion(LOGROS_SQL, 'public.comprar_cosmetico'), /v_exclusivo then raise exception 'ese se gana, no se compra'/);
  assert.match(funcion(LOGROS_SQL, 'public.equipar_cosmetico'), /\(v_precio > 0 or v_exclusivo\) and not exists/);
});

const TIENDA = readFileSync('supabase/migrations/0024_tienda.sql', 'utf8');
const RIVAL = readFileSync('supabase/migrations/0025_equipado_del_rival.sql', 'utf8');
function funcion(sql, nombre) {
  return sql.split(`create or replace function ${nombre}(`)[1]?.split('$$;')[0] ?? '';
}

test('Comprar cobra el precio del catálogo, con la fila bloqueada, y no dos veces', () => {
  const cuerpo = funcion(TIENDA, 'public.comprar_cosmetico');
  assert.ok(cuerpo, 'la 0024 no define comprar_cosmetico');
  assert.match(cuerpo, /from public\.catalogo_cosmeticos where id = p_id/);
  assert.match(cuerpo, /where id = v_id for update/);
  assert.match(cuerpo, /ya lo tienes/);
  assert.match(cuerpo, /v_monedas < v_precio/);
  // La función recibe sólo el id: un precio en la firma sería un precio del cliente.
  assert.match(TIENDA, /function public\.comprar_cosmetico\(p_id text\)/);
});

test('Equipar sólo deja ponerse lo que es tuyo o el gratuito', () => {
  const cuerpo = funcion(TIENDA, 'public.equipar_cosmetico');
  assert.match(cuerpo, /not v_defecto and not exists/);
  assert.match(cuerpo, /no es tuyo/);
});

test('Las funciones de la tienda son sólo para quien ha entrado', () => {
  for (const f of ['comprar_cosmetico', 'equipar_cosmetico']) {
    assert.match(TIENDA, new RegExp(`revoke all on function public\\.${f}\\(text\\) from public, anon;`));
    assert.match(TIENDA, new RegExp(`grant execute on function public\\.${f}\\(text\\) to authenticated;`));
  }
  assert.match(RIVAL, /revoke all on function public\.equipado_en_duelo\(uuid\) from public, anon;/);
  assert.match(RIVAL, /grant execute on function public\.equipado_en_duelo\(uuid\) to authenticated;/);
});

test('Lo que lleva puesto el rival sólo se cuenta a quien está en ese duelo, y sólo eso', () => {
  const cuerpo = funcion(RIVAL, 'public.equipado_en_duelo');
  assert.ok(cuerpo, 'la 0025 no define equipado_en_duelo');
  assert.match(cuerpo, /v_id = d\.jugador_a/);
  assert.match(cuerpo, /v_id = d\.jugador_b/);
  assert.match(cuerpo, /ese duelo no es tuyo/);
  // Devuelve lo equipado y nada más de la fila del rival.
  assert.match(cuerpo, /select equipado from public\.jugadores where id = v_rival/);
  assert.doesNotMatch(cuerpo, /monedas|coleccion|select \*/);
});

test('El perfil dice qué has comprado y qué llevas puesto', () => {
  const cuerpo = funcion(TIENDA, 'public.mi_perfil');
  assert.match(cuerpo, /'cosmeticos'/);
  assert.match(cuerpo, /'equipado', j\.equipado/);
  assert.match(cuerpo, /'sembrado', j\.sembrado/);
});

test('El menú tiene la placa de la tienda', () => {
  assert.match(readFileSync('index.html', 'utf8'), /<button id="btn-tienda" class="placa placa-tienda">/);
});

test('Las reglas que pintan lo equipado leen sus variables y conservan lo de siempre', () => {
  const css = ['style.css', 'piel.css', 'efectos.css'].map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const [variable, siempre] of [
    ['--tapete', 'assets/piel/piedra.webp'],
    ['--tapete-medallon', 'assets/piel/simbolo_huella.webp'],
    ['--estandarte-propio', 'assets/piel/vs/estandarte_propio.webp'],
    ['--estandarte-rival', 'assets/piel/vs/estandarte_rival.webp'],
    ['--cinta-propia', 'assets/piel/fin/cinta_propia.webp'],
    ['--cinta-rival', 'assets/piel/fin/cinta_rival.webp'],
    ['--dorso-rival', 'assets/piel/dorso.webp'],
  ]) {
    assert.ok(css.includes(`var(${variable}, url('${siempre}'))`), `ninguna regla lee ${variable} con ${siempre} de reserva`);
  }
  // El retrato no tiene «lo de siempre»: sin variable, la presentación deja la portada del mazo.
  assert.ok(css.includes('var(--retrato-propio, none)'));
  assert.ok(css.includes('var(--retrato-rival, none)'));
});

// ---------------------------------------------------------------- el arte
// tienda.js importa perfil.js, que lee `location` al cargar: el interruptor y
// la lista se leen como texto para no arrastrar el navegador a Node.
const js = readFileSync('src/ui/tienda.js', 'utf8');
const ARTE_LISTO = /export const ARTE_LISTO = true;/.test(js);
const PIEZAS = JSON.parse(js.match(/export const PIEZAS = Object\.freeze\((\[[^\]]*\])\)/)[1]
  .replace(/'/g, '"').replace(/,\s*\]/, ']'));
const ruta = (p) => (p.startsWith('placa_') ? `assets/piel/${p}.webp` : `assets/piel/tienda/${p}.webp`);

test('tools/tienda.py sirve exactamente las piezas que la tienda conoce', () => {
  const py = readFileSync('tools/tienda.py', 'utf8');
  const bloque = py.split('PIEZAS = {')[1].split('}')[0];
  const servidas = [...bloque.matchAll(/'([a-z_]+)':/g)].map((m) => m[1]).sort();
  assert.deepEqual(servidas, [...PIEZAS].sort());
});

test('ARTE_LISTO dice la verdad sobre el disco', () => {
  const faltan = PIEZAS.filter((p) => !existsSync(ruta(p)));
  if (ARTE_LISTO) assert.deepEqual(faltan, [], 'ARTE_LISTO está encendido y faltan piezas');
  else assert.ok(faltan.length > 0, 'están todas las piezas de la tienda: pon ARTE_LISTO = true en src/ui/tienda.js');
});

test('Cada artículo de pago pide piezas que la herramienta conoce', () => {
  for (const c of COSMETICOS.filter((x) => !x.porDefecto)) {
    for (const campo of ['arte', 'medallon', 'cinta']) {
      if (!c[campo]) continue;
      assert.ok(c[campo].startsWith('assets/piel/tienda/'), `${c.id}.${campo} fuera de assets/piel/tienda/`);
      const nombre = c[campo].split('/').pop().replace('.webp', '');
      assert.ok(PIEZAS.includes(nombre), `${c.id} pide «${c[campo]}» y no está en PIEZAS`);
    }
  }
});
