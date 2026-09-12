// La colección se mudó al servidor. Lo que se puede probar en Node es la parte
// pura: que el catálogo de cartas en SQL no se separe del código, y que la
// partida en solitario se re-juegue igual que ya se re-juega un asalto.
//
// Lo que NO se prueba aquí es el SQL —hace falta una base de datos— así que la
// comprobación de propiedad tiene tests de forma, no de ejecución: que la
// migración contenga la regla y que la Edge Function la llame antes de pagar.
// Es poco, y es más de lo que había.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { generar, SALIDA, coleccionables } from '../tools/generar-cartas.mjs';
import { validarSolitario } from '../supabase/functions/_compartido/validarSolitario.js';
import { perfilValido, PartidaInvalida } from '../supabase/functions/_compartido/validarPartida.js';
import { ECONOMIA, coleccionInicial } from '../src/data/coleccion.js';
import { BALANCE } from '../src/data/balance.js';
import { PERFIL } from '../src/engine/ai.js';
import { jugarSolo, MAZO_OK } from './helpers.js';

// -------------------------------------------------------------- el catálogo

test('La migración del catálogo de cartas es la que saldría hoy del código', () => {
  assert.equal(
    readFileSync(SALIDA, 'utf8'),
    generar(),
    'El catálogo de cartas en SQL se quedó atrás. Corre `node tools/generar-cartas.mjs`.',
  );
});

test('La migración del catálogo se puede aplicar sobre una base con jugadores', () => {
  // Aquí hubo un `truncate public.catalogo_cartas cascade`. Escrito con la base
  // recién creada, cuando vaciarla no costaba nada, y seguía ahí cuando ya había
  // ocho cuentas dentro — con `coleccion` apuntando a esa tabla por clave
  // foránea. Aplicarlo se habría llevado por delante las cartas de todo el mundo
  // y habría dejado los mazos guardados apuntando al vacío. No llegó a correrse.
  //
  // Una migración de catálogo se vuelve a aplicar cada vez que el set cambia, o
  // sea que tiene que ser idempotente Y no destructiva. `truncate` no es ninguna
  // de las dos cosas.
  const sql = readFileSync(SALIDA, 'utf8');
  assert.doesNotMatch(sql, /truncate/i, 'una migración de catálogo no vacía tablas');
  for (const tabla of ['catalogo_cartas', 'catalogo_inicial', 'catalogo_economia']) {
    assert.match(sql, new RegExp(`insert into public\\.${tabla}`), `${tabla} no se rellena`);
  }
  // Y cada insert cierra con su `on conflict`, que es lo que lo hace repetible.
  assert.equal((sql.match(/on conflict/g) ?? []).length, 3);
});

test('Todas las cartas coleccionables están en el SQL con su rareza', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  for (const c of coleccionables()) {
    // Si una carta falta, el servidor la rechazaría como «carta desconocida» y
    // el mazo que la lleve dejaría de poder guardarse, sin que nadie entienda
    // por qué.
    assert.match(sql, new RegExp(`\\('${c.id}', '[A-Z]+', '${c.rareza}', `),
      `${c.id} no está en catalogo_cartas con su rareza`);
  }
});

test('La colección de salida del SQL es la misma que la del código', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  const bloque = sql.split('insert into public.catalogo_inicial')[1].split(';')[0];
  for (const [id, copias] of Object.entries(coleccionInicial())) {
    assert.match(bloque, new RegExp(`\\('${id}', ${copias}\\)`),
      `${id} × ${copias} no está en catalogo_inicial`);
  }
});

test('Los precios del SQL son los de ECONOMIA, no unos copiados a mano', () => {
  const sql = readFileSync(SALIDA, 'utf8');
  assert.match(sql, new RegExp(
    `values \\(1, ${ECONOMIA.precioSobre}, ${ECONOMIA.cartasPorSobre}, `
    + `${ECONOMIA.monedasInicio}, ${ECONOMIA.monedasVictoria}, `
    + `${ECONOMIA.monedasDerrota}, ${BALANCE.tamanoMazo}, `));
});

// ------------------------------------------------- la partida en solitario

const PARTIDA = jugarSolo(20260909);

test('El servidor re-juega la partida y llega al mismo ganador', () => {
  const r = validarSolitario(PARTIDA);
  assert.equal(r.ganada, PARTIDA.ganada,
    'El servidor no reprodujo la misma partida que se jugó');
  assert.ok(r.turnos > 0);
});

test('Sólo se paga si el servidor ve que ganaste', () => {
  const r = validarSolitario(PARTIDA);
  assert.equal(r.premio, r.ganada ? ECONOMIA.monedasVictoria : ECONOMIA.monedasDerrota);
});

test('Decir que ganaste no hace que ganes: el premio sale de re-jugar', () => {
  // El cliente puede afirmar lo que quiera en el envío; nada de eso se lee.
  const mentiroso = { ...PARTIDA, ganada: true, premio: 9999, dano: 9999 };
  assert.deepEqual(validarSolitario(mentiroso), validarSolitario(PARTIDA));
});

test('Un mazo que no suma las cartas exactas no llega ni a jugarse', () => {
  const corto = MAZO_OK.slice(0, 5);
  assert.throws(() => validarSolitario({ ...PARTIDA, mazo: corto }), PartidaInvalida);
});

test('Una carta inventada en el mazo se rechaza', () => {
  assert.throws(
    () => validarSolitario({ ...PARTIDA, mazo: [['tyrannosaurus_de_mentira', 50]] }),
    (e) => e instanceof PartidaInvalida && /desconocida/.test(e.message),
  );
});

test('La misma partida da siempre el mismo resultado', () => {
  assert.deepEqual(validarSolitario(PARTIDA), validarSolitario({ ...PARTIDA }));
});

test('El perfil de IA que llega del cliente tiene que ser uno de los que hay', () => {
  assert.equal(perfilValido(undefined), PERFIL.HEURISTICA);
  assert.equal(perfilValido(PERFIL.ALEATORIA), PERFIL.ALEATORIA);
  // Una IA inventada haría que el servidor reprodujese otra partida.
  assert.throws(() => perfilValido('la_que_me_deja_ganar'), PartidaInvalida);
});

// ------------------------------------------- que la propiedad no se caiga

test('La migración de cuentas lleva la comprobación de propiedad', () => {
  const sql = readFileSync('supabase/migrations/0007_cuentas.sql', 'utf8');
  // Es la razón de ser de toda la migración: comparar el mazo con la colección
  // REAL del jugador. Si esta consulta desaparece, el servidor vuelve a
  // aceptar cualquier mazo legal aunque no tenga las cartas.
  assert.match(sql, /left join public\.coleccion col/);
  assert.match(sql, /ese mazo no es tuyo/);
  assert.match(sql, /create table if not exists public\.coleccion/);
});

test('La Edge Function comprueba la propiedad antes de pagar nada', () => {
  const ts = readFileSync('supabase/functions/asalto/index.ts', 'utf8');
  // Dos veces: una por el asalto y otra por la victoria. Una partida que paga
  // sin pasar por aquí es una carta regalada.
  assert.equal((ts.match(/validar_mazo_de/g) ?? []).length, 2,
    'Falta la comprobación de propiedad en alguno de los dos caminos que pagan');
});

test('La versión por URL hace lo mismo que la empaquetada', () => {
  const corta = readFileSync('supabase/functions/asalto/desde-url.ts', 'utf8');
  // Es la que está DESPLEGADA, no una de repuesto: se creyó lo contrario y por
  // eso estuvo un rato capada a asaltos. Tiene que despachar los tres tipos y
  // comprobar la propiedad en los dos caminos que pagan.
  for (const tipo of ['asalto', 'victoria', 'sobre']) {
    assert.match(corta, new RegExp(`tipo === '${tipo}'`), `no despacha «${tipo}»`);
  }
  assert.equal((corta.match(/validar_mazo_de/g) ?? []).length, 2,
    'Falta la comprobación de propiedad en alguno de los dos caminos que pagan');
});
