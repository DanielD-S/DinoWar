// Los logros: objetivos de una vez con recompensa que no son monedas.
//
// Lo que se vigila es lo que se equivoca en silencio: un logro que mide un
// contador que no existe nunca avanza; una recompensa que apunta a un cosmético
// que no está en el catálogo se «entrega» y no da nada; el servidor tiene que
// apuntar el progreso por los tres caminos —partida, asalto y duelo— y por el
// cuarto, reclamar la carta de jefe; y la copia del catálogo que lleva la 0028
// no puede quedarse atrás.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LOGROS, LOGRO_POR_ID, RECOMPENSA, avancesDeLogros, logroMideAlgoConocido, textoDeRecompensa,
} from '../src/data/logros.js';
import { parteVacio, VOCABULARIO } from '../src/data/misiones.js';
import { COSMETICOS, cosmeticoPorId } from '../src/data/cosmeticos.js';
import { CARTAS_DE_JEFE } from '../src/data/cards.js';
import { readdirSync } from 'node:fs';

test('Todo logro mide un contador del vocabulario', () => {
  for (const l of LOGROS) assert.ok(logroMideAlgoConocido(l), `«${l.id}» mide «${l.mide}», que no existe`);
});

test('Los identificadores no se repiten y todo logro tiene nombre, texto y meta', () => {
  assert.equal(Object.keys(LOGRO_POR_ID).length, LOGROS.length);
  for (const l of LOGROS) {
    assert.ok(l.nombre && l.texto, `«${l.id}» sin nombre o sin texto`);
    assert.ok(Number.isInteger(l.meta) && l.meta > 0, `«${l.id}» con meta rara`);
    assert.match(l.texto, new RegExp(`\\b${l.meta}\\b`), `el texto de «${l.id}» no cita su meta`);
  }
});

test('Toda recompensa es entregable: un cosmético exclusivo suyo, un mazo o sobres', () => {
  for (const l of LOGROS) {
    const r = l.recompensa;
    assert.ok(Object.values(RECOMPENSA).includes(r.tipo), `«${l.id}» da «${r.tipo}»`);
    if (r.tipo === RECOMPENSA.TITULO || r.tipo === RECOMPENSA.COSMETICO) {
      const c = cosmeticoPorId(r.id);
      assert.ok(c?.exclusivo && c.logro === l.id, `«${l.id}» da «${r.id}», que no es un exclusivo suyo`);
      assert.equal(c.tipo === 'TITULO', r.tipo === RECOMPENSA.TITULO, `«${l.id}»: el tipo de recompensa no casa con «${r.id}»`);
    }
    if (r.tipo === RECOMPENSA.SOBRES) assert.ok(Number.isInteger(r.n) && r.n > 0);
    assert.ok(textoDeRecompensa(r, (id) => cosmeticoPorId(id)?.nombre ?? id).length > 0);
  }
  // Y al revés: todo cosmético exclusivo lo da algún logro.
  for (const c of COSMETICOS.filter((x) => x.exclusivo)) {
    assert.ok(LOGROS.some((l) => l.recompensa.id === c.id), `nadie da «${c.id}»`);
  }
});

test('Los contadores nuevos están en el parte vacío y sólo avanza lo que se toca', () => {
  const p = parteVacio();
  for (const k of ['asaltos', 'danoJefe', 'jefesVencidos', 'duelos', 'duelosGanados', 'expedicionNuevos',
    'jefe:saurophaganax', 'jefe:barosaurus', 'cartasJefe']) {
    assert.ok(VOCABULARIO.includes(k), k);
    assert.equal(p[k], 0);
  }
  assert.deepEqual(avancesDeLogros(p), []);
  const a = avancesDeLogros({ ...p, duelos: 1, duelosGanados: 1 });
  assert.deepEqual(a.map((x) => x.id).sort(), ['campeon', 'duelista', 'leyenda', 'veterano']);
  for (const x of a) assert.ok(x.meta > 0 && x.recompensa.tipo);
});

// -------------------------------------------------------------- el servidor
const SQL = readFileSync('supabase/migrations/0027_logros.sql', 'utf8');
const TROFEOS = readFileSync('supabase/migrations/0028_trofeos_de_jefe.sql', 'utf8');
const EDGE = readFileSync('supabase/functions/asalto/index.ts', 'utf8');

test('El servidor apunta el progreso y entrega la recompensa que viaja en la llamada', () => {
  assert.match(SQL, /create table if not exists public\.logros/);
  assert.match(SQL, /create or replace function private\.avanzar_logros\(p_jugador uuid, p_logros jsonb\)/);
  // Las recompensas, entregadas en SQL: la 0028 añade `cosmetico` y ya no
  // da por cobrado un tipo que no sabe entregar.
  assert.match(TROFEOS, /when 'titulo' then perform private\.otorgar_cosmetico/);
  assert.match(TROFEOS, /when 'cosmetico' then perform private\.otorgar_cosmetico/);
  assert.match(TROFEOS, /when 'mazo' then update public\.jugadores set mazos_extra = mazos_extra \+ 1/);
  assert.match(TROFEOS, /when 'sobres' then update public\.jugadores set sobres_gratis = sobres_gratis \+/);
  assert.match(TROFEOS, /else\s+update public\.logros set cobrado = false/);
  // Y por los tres caminos: la partida, el asalto y el duelo.
  assert.match(SQL, /function public\.aplicar_partida\([^)]*p_logros jsonb/s);
  assert.match(SQL, /function public\.aplicar_avances\(/);
  assert.match(SQL, /function public\.duelo_cerrar\([^)]*p_logros_b jsonb/s);
  assert.match(SQL, /drop function if exists public\.duelo_cerrar\(uuid, int, text, int, int, int, int\)/);
});

test('Reclamar una carta de jefe por primera vez avanza sus logros', () => {
  const cuerpo = TROFEOS.split('create or replace function public.reclamar_jefe(')[1].split('$$;')[0];
  // La primera copia se mira ANTES de darla, o nunca sería la primera.
  assert.ok(cuerpo.indexOf('v_nueva := not exists') < cuerpo.indexOf('private.dar_cartas'));
  assert.match(cuerpo, /if v_nueva then\s+perform private\.avanzar_logros/);
  assert.match(cuerpo, /'jefe:' \|\| substr\(v_recompensa, 6\), 'cartasJefe'/);
  // Todo contador de carta de jefe que mida un logro lo escribe este camino.
  // `reclamar_jefe` deriva el contador de la carta: `jefe_x` avanza `jefe:x`.
  // Un logro de jefe cuya carta no existe no avanzaría nunca, y una carta de
  // jefe sin su logro dejaría su retrato sin forma de ganarse.
  const deJefe = LOGROS.filter((x) => x.mide.startsWith('jefe:'));
  for (const l of deJefe) {
    assert.ok(CARTAS_DE_JEFE[`jefe_${l.mide.slice(5)}`], `«${l.id}» mide una carta de jefe que no existe`);
  }
  for (const id of Object.keys(CARTAS_DE_JEFE)) {
    assert.ok(deJefe.some((l) => l.mide === `jefe:${id.slice(5)}`), `«${id}» no tiene logro de trofeo`);
  }
});

test('La copia del catálogo de la 0028 es exactamente src/data/logros.js', () => {
  // La copia que vale es la de la ÚLTIMA migración que la escribe.
  const ultima = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort()
    .map((f) => readFileSync(`supabase/migrations/${f}`, 'utf8'))
    .filter((s) => s.includes('-- LOGROS:INICIO')).pop();
  const literal = ultima.split('-- LOGROS:INICIO')[1].split('-- LOGROS:FIN')[0];
  const json = literal.match(/select '([^]*)'::jsonb/)[1].replace(/''/g, "'");
  const copia = JSON.parse(json);
  const esperado = LOGROS.map((l) => ({ id: l.id, mide: l.mide, meta: l.meta, recompensa: l.recompensa }));
  assert.deepEqual(copia, JSON.parse(JSON.stringify(esperado)),
    'la 0028 lleva otro catálogo de logros: vuelve a generar su copia');
});

test('La Edge Function manda los logros en la partida, el asalto y el duelo', () => {
  assert.match(EDGE, /import \{ avancesDeLogros \} from '\.\.\/\.\.\/\.\.\/src\/data\/logros\.js'/);
  assert.match(EDGE, /p_logros: avancesDeLogros\(/);
  assert.match(EDGE, /rpc\('aplicar_avances'/);
  assert.match(EDGE, /p_logros_a: avancesDeLogros\(/);
  assert.match(EDGE, /p_logros_b: avancesDeLogros\(/);
  // El golpe final al jefe y la primera victoria de expedición son lo que el
  // servidor sabe y el parte no: van escritos ahí.
  assert.match(EDGE, /jefesVencidos: fila\?\.cayo \? 1 : 0/);
  assert.match(EDGE, /expedicionNuevos: expedicion\?\.primera \? 1 : 0/);
  // Y el contador del MAPA, que es lo que miden los logros de «entera»: sin
  // él, siete nodos y un visitante pagarían un mapa.
  assert.match(EDGE, /\[`expedicion:\$\{mapa\}`\]: expedicion\?\.primera \? 1 : 0/);
  for (const l of LOGROS.filter((x) => x.mide.startsWith('expedicion:'))) {
    assert.equal(l.meta, 8, `«${l.id}» pide ${l.meta} y un mapa son 8 nodos`);
  }
});

test('Los sobres gratis se descuentan antes que las monedas, y el mazo extra pide uno que no tengas', () => {
  const sobre = SQL.split('create or replace function public.aplicar_sobre(')[1].split('$$;')[0];
  assert.match(sobre, /if v_gratis > 0 then/);
  assert.match(sobre, /sobres_gratis = sobres_gratis - 1/);
  const mazo = SQL.split('create or replace function public.elegir_mazo_extra(')[1].split('$$;')[0];
  assert.match(mazo, /v_extra <= 0 then raise exception/);
  assert.match(mazo, /p_mazo = any\(v_tomados\)/);
  assert.match(SQL, /revoke all on function public\.elegir_mazo_extra\(text\) from public, anon;/);
  assert.match(SQL, /revoke all on function public\.aplicar_avances\([^)]*\)\s+from public, anon, authenticated;/);
});
