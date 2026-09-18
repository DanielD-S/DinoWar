// Los TORNEOS: que la regla exista, que deje construir, y que el premio no se
// coma la economía.
//
// El fallo contra el que existe este fichero es el de siempre en este
// proyecto: un torneo con un campo mal escrito —`costeMaxx: 2`— no es un error
// de sintaxis, es una semana entera en la que la regla no filtra nada y nadie
// se entera. Y el que le sigue: una regla bien escrita que no deja armar 55
// cartas es una entrada que cobra 50 monedas por un botón que no se puede
// pulsar.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CARTAS, TIPO } from '../src/data/cards.js';
import { TAM_MAZO, ECONOMIA, limiteDe } from '../src/data/coleccion.js';
import {
  CATALOGO, FORMAS, PREMIOS, TORNEOS,
  cartaLegal, cartasLegales, copiasMaxEn, llaveDeRacha, premioDeRacha,
  rachaCerrada, textoDeRegla, torneoDe, torneoPorId, validarMazoEnTorneo,
} from '../src/data/torneos.js';

/** Las copias legales del set entero para un torneo, y cuántas son criatura. */
function cupo(torneo) {
  let copias = 0;
  let criaturas = 0;
  for (const id of cartasLegales(torneo)) {
    const n = copiasMaxEn(torneo, id);
    copias += n;
    if (CARTAS[id].tipo === TIPO.DINOSAURIO) criaturas += n;
  }
  return { copias, criaturas };
}

// ------------------------------------------------------------ vocabulario

test('Toda regla usa sólo formas del vocabulario', () => {
  for (const t of CATALOGO) {
    for (const forma of Object.keys(t.regla)) {
      assert.ok(FORMAS.includes(forma),
        `«${t.nombre}» declara «${forma}», que no está en FORMAS: no lo lee nadie`);
    }
  }
});

test('Toda forma del vocabulario la usa algún torneo', () => {
  // Una forma que nadie usa es código de filtrado que nunca se ejecuta, y por
  // tanto nunca se prueba. La misma regla que en `lugares.test.js`.
  for (const forma of FORMAS) {
    assert.ok(CATALOGO.some((t) => t.regla[forma] !== undefined),
      `ningún torneo usa «${forma}»`);
  }
});

test('Ningún torneo se queda sin regla', () => {
  for (const t of CATALOGO) {
    assert.ok(Object.keys(t.regla).length > 0, `«${t.nombre}» no filtra nada`);
  }
});

test('Los ids y los nombres son únicos', () => {
  assert.equal(new Set(CATALOGO.map((t) => t.id)).size, CATALOGO.length);
  assert.equal(new Set(CATALOGO.map((t) => t.nombre)).size, CATALOGO.length);
});

// ------------------------------------------------------------ construibles

test('Todo torneo deja armar un mazo de 55 con el set entero', () => {
  for (const t of CATALOGO) {
    const { copias } = cupo(t);
    assert.ok(copias >= TAM_MAZO,
      `«${t.nombre}» sólo deja ${copias} copias legales y un mazo son ${TAM_MAZO}`);
  }
});

test('Todo torneo deja cuerpos suficientes para jugar', () => {
  // Un mazo sin criaturas no pierde: no juega. El suelo son 20 copias —el
  // mínimo lo pone «El cielo y el mar», que son las 22 de pterosaurio y
  // marino— y está puesto ahí a sabiendas: ese torneo es un formato de apoyo a
  // propósito. Por debajo de veinte no es un formato raro, es un mazo roto.
  for (const t of CATALOGO) {
    const { criaturas } = cupo(t);
    assert.ok(criaturas >= 20,
      `«${t.nombre}» deja ${criaturas} copias de criatura: no hay con qué pelear`);
  }
});

test('La regla filtra de verdad: ningún torneo deja pasar el set entero', () => {
  const todas = Object.values(CARTAS).reduce((a, c) => a + limiteDe(c.id), 0);
  for (const t of CATALOGO) {
    assert.ok(cupo(t).copias < todas, `«${t.nombre}» no quita ni una copia`);
  }
});

// -------------------------------------------------------------- validación

test('Un mazo legal en abierto puede ser ilegal en un torneo', () => {
  const t = torneoPorId('cada_hueso_uno');
  // Una carta con dos copias: legal siempre, ilegal en el singleton.
  const id = Object.values(CARTAS).find((c) => limiteDe(c.id) >= 2).id;
  const mazo = { [id]: 2 };
  const cartas = { [id]: 2 };
  const r = validarMazoEnTorneo(mazo, cartas, t);
  assert.ok(!r.valido);
  assert.ok(r.problemas.some((p) => p.includes(t.nombre)),
    `la regla del torneo no aparece en los problemas: ${r.problemas.join(' / ')}`);
});

test('Una carta fuera del filtro se nombra con el torneo', () => {
  const t = torneoPorId('el_muro');
  const fuera = Object.values(CARTAS)
    .find((c) => c.tipo === TIPO.DINOSAURIO && !cartaLegal(t, c.id));
  const r = validarMazoEnTorneo({ [fuera.id]: 1 }, { [fuera.id]: 1 }, t);
  assert.ok(r.problemas.some((p) => p.includes(`no entra en «${t.nombre}»`)));
});

test('Lo de siempre se sigue comprobando', () => {
  // La regla del torneo SUMA: no sustituye al validador de toda la vida. Un
  // mazo de una carta legal sigue estando incompleto.
  const t = torneoPorId('sin_trampas');
  const id = cartasLegales(t)[0];
  const r = validarMazoEnTorneo({ [id]: 1 }, { [id]: 1 }, t);
  assert.ok(r.problemas.some((p) => p.includes(String(TAM_MAZO))));
});

// ---------------------------------------------------------------- rotación

test('La rotación es determinista y recorre los siete', () => {
  const vistos = new Set();
  // Siete semanas seguidas desde un lunes.
  for (let s = 0; s < CATALOGO.length; s++) {
    const dia = new Date(Date.UTC(2026, 8, 14) + s * 7 * 86400000).toISOString().slice(0, 10);
    vistos.add(torneoDe(dia).id);
    assert.equal(torneoDe(dia).id, torneoDe(dia).id);
  }
  assert.equal(vistos.size, CATALOGO.length, 'la rotación no llega a todos');
});

test('Toda la semana trae el mismo torneo', () => {
  const lunes = Date.UTC(2026, 8, 14);
  const cual = torneoDe(new Date(lunes).toISOString().slice(0, 10)).id;
  for (let d = 1; d < 7; d++) {
    const dia = new Date(lunes + d * 86400000).toISOString().slice(0, 10);
    assert.equal(torneoDe(dia).id, cual, `el día ${dia} cambia de torneo a media semana`);
  }
});

test('La llave de una racha lleva el torneo Y la semana', () => {
  // Sin la semana, la racha del torneo de hace siete semanas bloquearía la de
  // hoy: es la misma trampa que el ciclo de los jefes de la Cuenca.
  const a = llaveDeRacha('2026-09-14');
  const b = new Date(Date.UTC(2026, 8, 14) + 7 * CATALOGO.length * 86400000)
    .toISOString().slice(0, 10);
  assert.notEqual(a, llaveDeRacha(b));
  assert.equal(a.split('@')[0], llaveDeRacha(b).split('@')[0], 'y aun así es el mismo torneo');
});

// ----------------------------------------------------------------- premios

test('La escalera de premios no baja', () => {
  const vale = (p) => p.monedas + p.sobres * ECONOMIA.precioSobre;
  for (let i = 1; i < PREMIOS.length; i++) {
    assert.ok(vale(PREMIOS[i]) >= vale(PREMIOS[i - 1]),
      `${i} victorias pagan menos que ${i - 1}`);
  }
});

test('La escalera cubre exactamente las victorias posibles', () => {
  assert.equal(PREMIOS.length, TORNEOS.victoriasParaCerrar + 1);
  assert.deepEqual(premioDeRacha(99), PREMIOS[PREMIOS.length - 1]);
  assert.deepEqual(premioDeRacha(-1), PREMIOS[0]);
});

test('Una racha mediocre devuelve la entrada y una mala no', () => {
  // Si perder no costara nada, la entrada dejaría de ser una decisión.
  assert.equal(premioDeRacha(0).monedas, 0);
  assert.equal(premioDeRacha(1).monedas, 0);
  assert.ok(premioDeRacha(2).monedas >= TORNEOS.entrada,
    'a las dos victorias hay que recuperar lo puesto');
});

test('La entrada es barata de verdad', () => {
  // «Un monto bajo»: menos de dos victorias, y seis entradas un sobre.
  assert.ok(TORNEOS.entrada <= 2 * ECONOMIA.monedasVictoria,
    `la entrada son ${(TORNEOS.entrada / ECONOMIA.monedasVictoria).toFixed(1)} victorias`);
  assert.ok(ECONOMIA.precioSobre / TORNEOS.entrada >= 4,
    'una entrada no puede ser una parte gorda de un sobre');
});

test('El torneo no deshace la economía endurecida', () => {
  // Una racha perfecta por semana, que es el techo: dos sobres. Repartido por
  // día tiene que quedarse muy por debajo del techo diario, que `grifos.test.js`
  // deja entre uno y dos sobres.
  const mejor = PREMIOS[PREMIOS.length - 1];
  const porDia = (mejor.sobres + mejor.monedas / ECONOMIA.precioSobre) / 7;
  assert.ok(porDia <= 0.5,
    `el torneo añade ${porDia.toFixed(2)} sobres al día y eso es medio grifo nuevo`);
});

test('La esperanza de una racha no regala sobres', () => {
  // Cuánto paga el torneo a alguien que gana la mitad de sus duelos, contando
  // la entrada. Si esto sale positivo y gordo, entrar deja de ser una decisión
  // y pasa a ser obligatorio.
  const p = 0.5;
  let esperado = 0;
  // Recorrido del árbol: se para a las 5 victorias o a las 3 derrotas.
  const anda = (g, d, prob) => {
    if (g >= TORNEOS.victoriasParaCerrar || d >= TORNEOS.derrotasParaCerrar) {
      const x = premioDeRacha(g);
      esperado += prob * (x.monedas + x.sobres * ECONOMIA.precioSobre);
      return;
    }
    anda(g + 1, d, prob * p);
    anda(g, d + 1, prob * (1 - p));
  };
  anda(0, 0, 1);
  const neto = esperado - TORNEOS.entrada;
  assert.ok(neto <= ECONOMIA.precioSobre / 2,
    `al 50 % de victorias el torneo paga ${neto.toFixed(0)} monedas netas: es un grifo`);
  assert.ok(neto > -TORNEOS.entrada,
    'al 50 % de victorias el torneo no puede ser una pérdida segura');
});

test('La racha se cierra por arriba y por abajo', () => {
  assert.ok(!rachaCerrada(0, 0));
  assert.ok(!rachaCerrada(4, 2));
  assert.ok(rachaCerrada(TORNEOS.victoriasParaCerrar, 0));
  assert.ok(rachaCerrada(0, TORNEOS.derrotasParaCerrar));
});

// ------------------------------------------------------------------ textos

test('Todo torneo se explica solo', () => {
  for (const t of CATALOGO) {
    assert.ok(t.nombre && t.lema, `«${t.id}» sin nombre o sin lema`);
    const texto = textoDeRegla(t);
    assert.ok(texto.length > 3, `«${t.nombre}» no sabe decir su regla`);
    assert.match(texto, /\.$/);
  }
});

test('El texto de la regla cita sus números', () => {
  // La misma vigilancia que `textos.test.js` le hace a las cartas: un número
  // en la regla que no sale en el texto es una regla que miente.
  for (const t of CATALOGO) {
    const texto = textoDeRegla(t);
    for (const clave of ['costeMax', 'copiasMax']) {
      if (t.regla[clave] === undefined) continue;
      const n = t.regla[clave];
      const dicho = texto.includes(String(n)) || (n === 1 && /una copia/i.test(texto));
      assert.ok(dicho, `«${t.nombre}» no dice su ${clave} (${n}): ${texto}`);
    }
  }
});

// ---------------------------------------------------------------- y el SQL
//
// Los torneos viven en dos sitios —`torneos.js` para pintar y elegir, el
// catálogo generado para cobrar y validar— y la semana se calcula en los dos.
// Es la trampa de «regenerar no es aplicar» por otra puerta: aquí el fichero
// generado sí se compara, pero la FÓRMULA de la semana está escrita a mano en
// la 0038 y nada la ataba a la del navegador.

const MIGRACION = readFileSync('supabase/migrations/0038_torneos.sql', 'utf8');
const CATALOGO_SQL = readFileSync('supabase/migrations/0006_catalogo_cartas.sql', 'utf8');

test('La semana del SQL es la misma que la del navegador', () => {
  // La función es `floor(((dia - 1970-01-01) + 3) / 7.0)`, y `semanaDe()` hace
  // `Math.floor((ms / 86400000 + 3) / 7)`. Se comprueba reimplementando la de
  // SQL sobre los mismos días: si alguien cambia el desplazamiento en un lado,
  // el torneo del servidor y el del cliente dejan de ser el mismo durante una
  // semana entera y el jugador paga por uno y juega otro.
  assert.match(MIGRACION, /\(p_dia - date '1970-01-01'\) \+ 3\) \/ 7\.0/,
    'la fórmula de private.semana_de cambió: compárala con semanaDe()');
  const comoSql = (dia) => Math.floor(((Date.parse(`${dia}T00:00:00Z`) / 86400000) + 3) / 7);
  for (const dia of ['2026-09-14', '2026-09-20', '2026-09-21', '2027-01-04', '1970-01-01']) {
    const porTorneo = CATALOGO[comoSql(dia) % CATALOGO.length];
    assert.equal(torneoDe(dia).id, porTorneo.id, `el ${dia} no cae en el mismo torneo`);
  }
});

test('El catálogo generado lleva los siete torneos en su orden', () => {
  CATALOGO.forEach((t, i) => {
    assert.match(CATALOGO_SQL, new RegExp(`\\('${t.id}', '[^']+', ${i}, `),
      `${t.id} no está en catalogo_torneos con orden ${i}. Corre \`node tools/generar-cartas.mjs\`.`);
  });
});

test('El catálogo generado lleva las cartas legales de cada torneo', () => {
  // Una carta que falte aquí la rechaza `entrar_en_torneo` con «no entran», y
  // el navegador la habría dejado meter: el jugador ve un mazo legal que el
  // servidor no acepta, que es el fallo silencioso de siempre.
  for (const t of CATALOGO) {
    const legales = cartasLegales(t);
    for (const id of [legales[0], legales[legales.length - 1]]) {
      assert.ok(CATALOGO_SQL.includes(`('${t.id}', '${id}')`),
        `${id} no está como legal de ${t.id} en el SQL`);
    }
    // Y lo que la regla veta no puede estar.
    const fuera = Object.keys(CARTAS).find((id) => !cartaLegal(t, id));
    if (fuera) {
      assert.ok(!CATALOGO_SQL.includes(`('${t.id}', '${fuera}')`),
        `${fuera} no entra en ${t.id} y el SQL lo deja pasar`);
    }
  }
});

test('La entrada y los topes del SQL son los del código', () => {
  assert.match(CATALOGO_SQL, new RegExp(`torneo_entrada int not null default ${TORNEOS.entrada}`));
  assert.match(CATALOGO_SQL, new RegExp(`torneo_victorias int not null default ${TORNEOS.victoriasParaCerrar}`));
  assert.match(CATALOGO_SQL, new RegExp(`torneo_derrotas int not null default ${TORNEOS.derrotasParaCerrar}`));
  PREMIOS.forEach((p, i) => {
    assert.ok(CATALOGO_SQL.includes(`  (${i}, ${p.monedas}, ${p.sobres})`),
      `el premio de ${i} victorias no está en catalogo_torneo_premios`);
  });
});

test('El torneo no toca la Edge Function', () => {
  // La razón entera de que las reglas sólo filtren el mazo. Si `torneos.js`
  // entra en el paquete, cada torneo nuevo cuesta re-empaquetar, re-anclar y
  // desplegar — y este test es el que lo avisa el mismo día.
  const paquete = readFileSync('supabase/functions/asalto/paquete.ts', 'utf8');
  assert.ok(!paquete.includes('src/data/torneos.js'),
    'torneos.js entró en el paquete de la Edge Function: mira qué lo importa');
  assert.match(MIGRACION, /create or replace function public\.duelo_buscar\(p_jugador uuid, p_mazo jsonb, p_semilla bigint\)/,
    'duelo_buscar cambió de firma y la llama la Edge Function');
  assert.match(MIGRACION, /p_id uuid, p_ganador int, p_motivo text, p_turnos int,\n\s*p_elo_a int, p_elo_b int, p_monedas_victoria int/,
    'duelo_cerrar cambió de firma y la llama la Edge Function');
});
