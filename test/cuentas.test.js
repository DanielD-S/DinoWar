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
import { BALANCE, MAZO } from '../src/data/balance.js';
import { PERFIL } from '../src/engine/ai.js';
import { crearPartida, FASE, vistaDe } from '../src/engine/state.js';
import { reduce, ACCION, legales } from '../src/engine/actions.js';
import { decidir } from '../src/engine/ai.js';
import { semilla } from '../src/engine/rng.js';

const MAZO_OK = MAZO.map((e) => [...e]);

// -------------------------------------------------------------- el catálogo

test('La migración del catálogo de cartas es la que saldría hoy del código', () => {
  assert.equal(
    readFileSync(SALIDA, 'utf8'),
    generar(),
    'El catálogo de cartas en SQL se quedó atrás. Corre `node tools/generar-cartas.mjs`.',
  );
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

/**
 * Juega una partida entera contra la IA y devuelve la grabación, igual que la
 * hace el navegador: sólo TUS jugadas, en el orden en que las haces.
 */
function jugarSolo(seed, perfil = PERFIL.HEURISTICA) {
  let s = crearPartida(seed, [MAZO_OK, null]);
  let rngIA = semilla(seed ^ 0x5bf03635);
  const acciones = [];

  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const faseInicial = s.fase;
      let pasos = 0;
      while (s.fase === faseInicial) {
        let actuo = false;
        let rngYo = semilla(seed ^ 0x1234abcd);
        while (s.fase === faseInicial && legales(s, 0).length > 0) {
          const d = decidir(vistaDe(s, 0), 0, rngYo, perfil);
          rngYo = d.rng;
          if (!d.accion) break;
          acciones.push(d.accion);
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
        }
        let suyas = 0;
        while (s.fase === faseInicial && legales(s, 1).length > 0) {
          const d = decidir(vistaDe(s, 1), 1, rngIA, perfil);
          rngIA = d.rng;
          if (!d.accion) break;
          s = reduce(s, d.accion);
          actuo = true;
          if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
          if (++suyas > 200) break;
        }
        if (!actuo) break;
        if (++pasos > 200) break;
      }
      if (s.fase === faseInicial) break;
      continue;
    }
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }
  return { semilla: seed, mazo: MAZO_OK, acciones, perfil, ganada: s.ganador === 0 };
}

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

test('La versión corta no es más permisiva que la larga', () => {
  const corta = readFileSync('supabase/functions/asalto/desde-url.ts', 'utf8');
  // Ya pasó una vez que lo desplegado no era lo que se creía. Una versión de
  // repuesto que se salta la comprobación es peor que no tenerla.
  assert.match(corta, /validar_mazo_de/);
});
