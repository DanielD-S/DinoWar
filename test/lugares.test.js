// Los LUGARES: terreno por columna, sorteado con la semilla y a la vista de los
// dos. Son datos con un vocabulario de formas, como las mecánicas de las
// criaturas, y por eso tienen los mismos guardianes: un campo mal escrito
// produce un lugar que se sortea, se pinta y no hace nada.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { BALANCE } from '../src/data/balance.js';
import { CLADO, RASGO, CARTAS, TIPO } from '../src/data/cards.js';
import {
  LUGARES, LUGARES_IDS, FORMAS, lugarPorId, efectoDeLugar, bonoDeLugar,
} from '../src/data/lugares.js';
import {
  crearPartida, vistaDe, FASE, unidadEn, ataqueEfectivo, vidaMaxima, vidaActual,
  espinasDe, curacionDe, danoAlHabitat, efectosDe,
} from '../src/engine/state.js';
import { reduce, validar, legales, ACCION } from '../src/engine/actions.js';
import { decidir } from '../src/engine/ai.js';
import { semilla } from '../src/engine/rng.js';
import { jugarPartida } from '../sim/partida.js';
import { desdeMiLado } from '../supabase/functions/_compartido/duelo.js';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';

const CLADOS = Object.values(CLADO);

/** Una criatura del set por clado, para los escenarios. */
const unaDe = (clado, filtro = () => true) => Object.values(CARTAS)
  .find((c) => c.tipo === TIPO.DINOSAURIO && c.clado === clado && filtro(c)).id;

// --------------------------------------------------------------- catálogo

test('Todo lugar usa sólo formas del vocabulario, y al menos una', () => {
  for (const l of Object.values(LUGARES)) {
    const claves = Object.keys(l.efecto);
    assert.ok(claves.length > 0, `${l.id} no hace nada`);
    for (const k of claves) {
      assert.ok(FORMAS.includes(k), `${l.id} declara "${k}", que no es una forma: el motor no lo leería`);
    }
    if (l.efecto.ataque) assert.ok(Number.isInteger(l.efecto.ataque.n), `${l.id}: ataque sin n`);
    if (l.efecto.vida) assert.ok(Number.isInteger(l.efecto.vida.n), `${l.id}: vida sin n`);
    for (const forma of [l.efecto.ataque, l.efecto.vida]) {
      for (const c of forma?.clados ?? []) assert.ok(CLADOS.includes(c), `${l.id}: clado "${c}" no existe`);
    }
  }
});

test('Todo número del efecto sale en el texto, y el id coincide con la llave', () => {
  const numeros = (obj) => Object.values(obj).flatMap((v) => (typeof v === 'number' ? [v]
    : v && typeof v === 'object' && !Array.isArray(v) ? numeros(v) : []));
  for (const [id, l] of Object.entries(LUGARES)) {
    assert.equal(l.id, id);
    assert.ok(l.nombre && l.texto, `${id} sin nombre o sin texto`);
    // Por el valor absoluto: un −1 se escribe con el signo tipográfico y lo
    // que se vigila es que la cifra esté, no cómo va el signo.
    for (const n of numeros(l.efecto)) {
      assert.match(l.texto, new RegExp(`(^|[^\\d])${Math.abs(n)}(?!\\d)`), `${id}: el texto no cita el ${n}`);
    }
  }
});

test('Todo lugar tiene su color en piel.css, y no sobra ninguno', () => {
  // El color es de la piel y no del dato —lugares.js entra en la Edge
  // Function— así que nadie lo comprueba al cargar: un lugar nuevo sin tinte
  // saldría con el fondo pelado y sin que nada avisara.
  const css = readFileSync(new URL('../piel.css', import.meta.url), 'utf8');
  const tintes = [...css.matchAll(/\.lugar\[data-lugar="([a-z_]+)"\][^{]*\{\s*--lugar-tinte:\s*(#[0-9a-f]{6})/g)];
  const porId = new Map(tintes.map((m) => [m[1], m[2]]));
  for (const id of LUGARES_IDS) assert.ok(porId.has(id), `${id} no tiene --lugar-tinte en piel.css`);
  for (const id of porId.keys()) assert.ok(LUGARES[id], `piel.css tiñe "${id}", que no es un lugar`);
  assert.equal(new Set(porId.values()).size, porId.size, 'dos lugares con el mismo color');
  // Y la ranura lleva el mismo tinte que el botón: es el color de la COLUMNA.
  for (const [id, tinte] of porId) {
    assert.ok(css.includes(`.ranura[data-lugar="${id}"]`), `la ranura de ${id} no lleva color`);
    assert.ok(tinte, id);
  }
});

test('Hay lugares de sobra para llenar las columnas sin repetir', () => {
  assert.ok(LUGARES_IDS.length >= BALANCE.ranuras * 2,
    'con menos del doble de lugares que columnas cada partida sería casi la misma');
});

test('Toda forma del vocabulario la usa algún lugar', () => {
  // Una forma sin lugar es código del motor que nadie ejercita.
  for (const f of FORMAS) {
    assert.ok(Object.values(LUGARES).some((l) => f in l.efecto), `ninguna carta de lugar usa "${f}"`);
  }
});

// ----------------------------------------------------------------- sorteo

test('Los lugares salen de la semilla: uno por columna, sin repetir, y los mismos dos veces', () => {
  const a = crearPartida(77);
  const b = crearPartida(77);
  assert.equal(a.lugares.length, BALANCE.ranuras);
  assert.deepEqual(a.lugares, b.lugares);
  assert.equal(new Set(a.lugares).size, a.lugares.length, 'repetido');
  for (const id of a.lugares) assert.ok(LUGARES[id], `${id} no es un lugar`);
  assert.notDeepEqual(crearPartida(78).lugares, a.lugares, 'dos semillas, el mismo mapa: sospechoso');
});

test('Los lugares se sortean DESPUÉS de los mazos: forzarlos no cambia ninguna mano', () => {
  // Es lo que permite medir el tablero plano contra el de lugares con las
  // mismas semillas y leer la diferencia como de los lugares y no del reparto.
  const con = crearPartida(123);
  const sin = crearPartida(123);
  sin.lugares = sin.lugares.map(() => null);
  assert.deepEqual(sin.jugadores.map((j) => j.mano), con.jugadores.map((j) => j.mano));
  assert.deepEqual(sin.jugadores.map((j) => j.mazo), con.jugadores.map((j) => j.mazo));
});

test('La vista del rival y la vuelta del duelo conservan los lugares por columna', () => {
  const s = crearPartida(5);
  assert.deepEqual(vistaDe(s, 1).lugares, s.lugares);
  // El duelo le da la vuelta a los bandos, no a las columnas: el lugar de la
  // columna 3 es el mismo mirado desde los dos lados.
  const v = desdeMiLado(vistaDe(s, 1), 1);
  assert.deepEqual(v.lugares, s.lugares);
});

test('El tablero de los escenarios es plano, y un lugar se pone a mano', () => {
  const s = tablero();
  assert.deepEqual(s.lugares, s.lugares.map(() => null));
  assert.deepEqual(efectoDeLugar(s, 0), {});
  assert.deepEqual(bonoDeLugar(s, 0, CLADO.TEROPODO), { ataque: 0, vida: 0 });
  assert.equal(lugarPorId(null), null);
});

// ----------------------------------------------------------------- formas

test('ataque y vida: suman a lo que esté en la columna, de los dos bandos, y sólo a su clado', () => {
  const s = tablero();
  s.lugares[0] = 'ladera_volcanica';   // +2 a todos
  s.lugares[1] = 'rio';                // +2 marinos
  s.lugares[2] = 'roquedal';           // +2 Vida tireóforos
  const mio = poner(s, unaDe(CLADO.TEROPODO), 0, 0);
  const suyo = poner(s, unaDe(CLADO.SAUROPODO), 1, 0);
  const marino = poner(s, unaDe(CLADO.MARINO), 0, 1);
  const terrestre = poner(s, unaDe(CLADO.TEROPODO), 1, 1);
  const tireoforo = poner(s, unaDe(CLADO.TIREOFORO), 0, 2);
  const otro = poner(s, unaDe(CLADO.ORNITOPODO), 1, 2);
  const impreso = (iid) => CARTAS[s.instancias[iid].cardId];

  assert.equal(ataqueEfectivo(s, mio), impreso(mio).ataque + 2, 'la ladera suma a los míos');
  assert.equal(ataqueEfectivo(s, suyo), impreso(suyo).ataque + 2, 'y a los del rival: es de la columna');
  assert.equal(ataqueEfectivo(s, marino), impreso(marino).ataque + 2, 'el río suma al marino');
  assert.equal(ataqueEfectivo(s, terrestre), impreso(terrestre).ataque, 'y no al terrestre');
  assert.equal(vidaMaxima(s, tireoforo), impreso(tireoforo).vida + 2, 'el roquedal da Vida al tireóforo');
  assert.equal(vidaMaxima(s, otro), impreso(otro).vida, 'y a nadie más');

  const fuera = efectosDe(s, mio).find((e) => e.fuente === 'Ladera volcánica');
  assert.ok(fuera, 'la ficha explica de dónde salen los +2');
  assert.equal(fuera.ataque, 2);
  assert.equal(efectosDe(s, terrestre).some((e) => e.fuente === 'Río'), false, 'lo que no aplica no se enseña');
});

test('cura y sinCuracion: el bosque cura al final del turno y las salinas no dejan curar', () => {
  const s = tablero();
  s.lugares[0] = 'bosque_coniferas';
  s.lugares[1] = 'salinas';
  const sinCura = (c) => c.rasgo !== RASGO.RAMONEO_BAJO && !c.mecanica?.regenera;
  const enBosque = poner(s, unaDe(CLADO.SAUROPODO, sinCura), 0, 0, { heridas: 2 });
  // Uno que cura por sí mismo, para que las salinas tengan algo que tapar.
  const ramonea = Object.values(CARTAS).find((c) => c.rasgo === RASGO.RAMONEO_BAJO)?.id
    ?? Object.values(CARTAS).find((c) => c.mecanica?.regenera?.propia)?.id;
  assert.ok(ramonea, 'hace falta una carta que se cure sola');
  const enSalinas = poner(s, ramonea, 0, 1, { heridas: 2 });
  assert.equal(curacionDe(s, enBosque), 1);
  assert.equal(curacionDe(s, enSalinas), 0, 'ni su propia curación');
  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.instancias[enBosque].heridas, 1);
  assert.equal(r.instancias[enSalinas].heridas, 2);
});

test('espinas: lo que está en el pedregal devuelve 1 a quien lo hiere', () => {
  const s = tablero();
  s.lugares[0] = 'pedregal';
  const a = poner(s, unaDe(CLADO.SAUROPODO, (c) => c.ataque > 0 && !c.mecanica?.espinas), 0, 0);
  const b = poner(s, unaDe(CLADO.TEROPODO, (c) => c.ataque > 0 && c.vida > 3 && !c.mecanica?.espinas), 1, 0);
  assert.equal(espinasDe(s, a), 1);
  assert.equal(espinasDe(s, b), 1, 'también el del rival: es la columna');
  const r = ejecutar(s, FASE.COMBATE);
  const espinas = r.eventos.filter((e) => e.tipo === 'DANO' && e.causa === 'ESPINAS');
  assert.equal(espinas.length, 2, 'los dos se pinchan');
});

test('sobrante: en la llanura abierta lo que sobra al matar se dobla', () => {
  const s = tablero();
  const grande = unaDe(CLADO.TEROPODO, (c) => c.ataque >= 8 && c.rasgo !== RASGO.DEPREDADOR_DOMINANTE && !c.mecanica?.espinas && !c.mecanica?.guardia);
  const pequeno = unaDe(CLADO.ORNITOPODO, (c) => c.vida <= 3 && c.ataque <= 2 && !c.mecanica?.espinas);
  const ataque = CARTAS[grande].ataque;
  const vida = CARTAS[pequeno].vida;

  const plano = ejecutar((() => { poner(s, grande, 0, 0); poner(s, pequeno, 1, 0); return s; })(), FASE.COMBATE);
  const s2 = tablero();
  s2.lugares[0] = 'llanura_abierta';
  poner(s2, grande, 0, 0); poner(s2, pequeno, 1, 0);
  const llano = ejecutar(s2, FASE.COMBATE);

  assert.equal(BALANCE.vidaHabitat - plano.jugadores[1].habitat, ataque - vida);
  assert.equal(BALANCE.vidaHabitat - llano.jugadores[1].habitat, 2 * (ataque - vida));
});

test('guardia y golpeHabitat: el desfiladero quita 1 a cada golpe desde ahí y el barranco lo pone', () => {
  const s = tablero();
  s.lugares[0] = 'desfiladero';
  s.lugares[1] = 'barranco';
  s.lugares[2] = 'desfiladero';
  const cero = Object.values(CARTAS).find((c) => c.tipo === TIPO.DINOSAURIO && c.ataque === 0 && !c.mecanica?.guardia)?.id;
  const a = poner(s, unaDe(CLADO.TEROPODO, (c) => c.ataque >= 3 && !c.mecanica?.guardia), 0, 0);
  const b = poner(s, unaDe(CLADO.TEROPODO, (c) => c.ataque >= 3 && !c.mecanica?.guardia), 0, 1);
  const c0 = cero ? poner(s, cero, 0, 2) : null;
  const ataque = CARTAS[s.instancias[a].cardId].ataque;
  assert.equal(danoAlHabitat(s, a, 1), ataque - 1);
  assert.equal(danoAlHabitat(s, b, 1), ataque + 1);
  if (c0 !== null) assert.equal(danoAlHabitat(s, c0, 1), 0, 'un Ataque de 0 no pega 1 por el barranco ni baja de 0');
  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(BALANCE.vidaHabitat - r.jugadores[1].habitat, 2 * ataque);
});

test('inmovil: de la ciénaga no se sale ni se entra, y el barro resta 1', () => {
  // Hoy ninguna carta lleva el rasgo Migrador, así que lo que se comprueba es
  // que la columna manda ANTES que el rasgo: el motivo que sale es el de la
  // ciénaga, y el día que vuelva un migrador la regla ya está puesta.
  const s = tablero();
  s.lugares[1] = 'cienaga';
  s.fase = FASE.DESPLIEGUE;
  const dentro = poner(s, unaDe(CLADO.TEROPODO, (c) => c.ataque >= 2), 0, 1);
  const fuera = poner(s, unaDe(CLADO.TEROPODO), 0, 0);
  assert.match(validar(s, { tipo: ACCION.MOVER, jugador: 0, iid: dentro, ranura: 2 }), /no se puede salir/);
  assert.match(validar(s, { tipo: ACCION.MOVER, jugador: 0, iid: fuera, ranura: 1 }), /no se puede entrar/);
  assert.match(validar(s, { tipo: ACCION.MOVER, jugador: 0, iid: fuera, ranura: 2 }), /no puede moverse/);
  assert.equal(ataqueEfectivo(s, dentro), CARTAS[s.instancias[dentro].cardId].ataque - 1);
  assert.equal(legales(s, 0).filter((x) => x.tipo === ACCION.MOVER).length, 0);
});

test('roba: revelarse en la nidada roba 1 y lo cuenta un evento LUGAR', () => {
  const s = tablero();
  s.lugares[0] = 'nidada';
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  const iid = enMano(s, unaDe(CLADO.ORNITOPODO, (c) => !c.mecanica?.entrada && !c.mecanica?.costeExtra), 0);
  let r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 0 });
  const antes = r.jugadores[0].mano.length;
  const mazoAntes = r.jugadores[0].mazo.length;
  r.fase = FASE.REVELACION;
  r = reduce(r, { tipo: ACCION.AVANZAR });
  assert.equal(r.jugadores[0].mano.length, antes + 1);
  assert.equal(r.jugadores[0].mazo.length, mazoAntes - 1);
  const e = r.eventos.find((x) => x.tipo === 'LUGAR');
  assert.deepEqual({ efecto: e.efecto, n: e.n, lugar: e.lugar, jugador: e.jugador }, { efecto: 'roba', n: 1, lugar: 'nidada', jugador: 0 });
});

test('muele: el cauce seco muele 1 a quien tenga algo ahí al final del turno, a los dos', () => {
  const s = tablero();
  s.lugares[3] = 'cauce_seco';
  poner(s, unaDe(CLADO.SAUROPODO, (c) => c.vida > 6), 0, 3);
  poner(s, unaDe(CLADO.SAUROPODO, (c) => c.vida > 6), 1, 3);
  poner(s, unaDe(CLADO.SAUROPODO, (c) => c.vida > 6), 0, 0);
  const antes = s.jugadores.map((j) => j.mazo.length);
  const r = ejecutar(s, FASE.COMBATE);
  assert.deepEqual(r.jugadores.map((j) => j.mazo.length), [antes[0] - 1, antes[1] - 1]);
  assert.equal(r.eventos.filter((e) => e.tipo === 'LUGAR' && e.efecto === 'muele').length, 2);
});

test('Cada lugar que ACTÚA lo cuenta un evento LUGAR: cura, sin curación, espinas, sobrante, guardia y golpe', () => {
  // Es el mismo guardián que las habilidades al entrar: sin evento, el lugar
  // curaba y pinchaba en silencio y el jugador sólo lo veía en los números.
  // Dos cuerpos sin nada que altere el combate: Lokiceratops 4/7 y Platyceratops 1/2.
  const grande = 'lokiceratops';
  const chico = 'platyceratops';
  const tipos = (r) => r.eventos.filter((e) => e.tipo === 'LUGAR').map((e) => `${e.efecto}@${e.ranura}`);

  // Bosque: el herido se cura y el evento dice cuánto puso el bosque.
  let s = tablero();
  s.lugares[0] = 'bosque_coniferas';
  const herido = poner(s, grande, 0, 0, { heridas: 2 });
  poner(s, chico, 1, 0);
  let r = ejecutar(s, FASE.COMBATE);
  assert.ok(tipos(r).includes('cura@0'), tipos(r));
  assert.equal(r.eventos.find((e) => e.tipo === 'LUGAR' && e.efecto === 'cura').iid, herido);

  // Salinas: habría curado por lo suyo y no le dejan; eso también se dice.
  s = tablero();
  s.lugares[1] = 'salinas';
  const regenera = Object.values(CARTAS).find((c) => c.tipo === TIPO.DINOSAURIO && c.mecanica?.regenera?.propia > 0);
  if (regenera) {
    poner(s, regenera.id, 0, 1, { heridas: 1 });
    r = ejecutar(s, FASE.COMBATE);
    assert.ok(tipos(r).includes('sinCuracion@1'), tipos(r));
  }

  // Pedregal: dos que chocan y el terreno pincha, una vez por columna y sin bando.
  s = tablero();
  s.lugares[2] = 'pedregal';
  poner(s, grande, 0, 2);
  poner(s, grande, 1, 2);
  r = ejecutar(s, FASE.COMBATE);
  const esp = r.eventos.filter((e) => e.tipo === 'LUGAR' && e.efecto === 'espinas');
  assert.equal(esp.length, 1);
  assert.equal(esp[0].jugador, undefined);

  // Llanura: el grande mata al chico y lo que sobra se dobla.
  s = tablero();
  s.lugares[3] = 'llanura_abierta';
  poner(s, grande, 0, 3);
  poner(s, chico, 1, 3);
  r = ejecutar(s, FASE.COMBATE);
  assert.ok(tipos(r).includes('sobrante@3'), tipos(r));
  assert.equal(r.eventos.find((e) => e.tipo === 'LUGAR' && e.efecto === 'sobrante').jugador, 0);

  // Desfiladero y Barranco: el golpe a la ranura vacía pega 1 menos o 1 más, y se dice.
  s = tablero();
  s.lugares[0] = 'desfiladero';
  s.lugares[1] = 'barranco';
  poner(s, grande, 0, 0);
  poner(s, grande, 0, 1);
  r = ejecutar(s, FASE.COMBATE);
  assert.ok(tipos(r).includes('guardia@0'), tipos(r));
  assert.ok(tipos(r).includes('golpeHabitat@1'), tipos(r));
  const avances = r.eventos.filter((e) => e.tipo === 'AVANCE');
  const ataque = CARTAS[grande].ataque;
  assert.equal(avances.find((e) => e.ranura === 0).dano, ataque - 1);
  assert.equal(avances.find((e) => e.ranura === 1).dano, ataque + 1);

  // Y en el tablero plano no se dice nada: ningún LUGAR sin lugar.
  s = tablero();
  poner(s, grande, 0, 0, { heridas: 2 });
  poner(s, grande, 1, 0);
  r = ejecutar(s, FASE.COMBATE);
  assert.deepEqual(tipos(r), []);
});

test('La Vida de lugar es dinámica: sin la laguna debajo, una unidad al límite se cae', () => {
  const s = tablero();
  s.lugares[0] = 'laguna';
  const id = unaDe(CLADO.ORNITOPODO, (c) => !c.mecanica?.cuenta && !c.mecanica?.si);
  const iid = poner(s, id, 0, 0, { heridas: CARTAS[id].vida });
  assert.equal(vidaActual(s, iid), 1, 'vivo por el punto de la laguna');
  // Es lo mismo que le pasa al Muro de placas sin congénere: la Vida se
  // recalcula, y la siguiente recogida de bajas se la lleva.
  s.lugares[0] = null;
  assert.equal(vidaActual(s, iid), 0);
  const r = ejecutar(s, FASE.REVELACION);
  assert.equal(vivo(r, iid), false);
});

// --------------------------------------------------------------------- IA

test('La IA tasa el lugar: con dos columnas iguales, lleva la carta a la que le pega más', () => {
  const s = tablero(7);
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  s.lugares[2] = 'ladera_volcanica';
  const carta = unaDe(CLADO.TEROPODO, (c) => c.coste <= 4 && !c.mecanica?.entrada && !c.mecanica?.costeExtra);
  enMano(s, carta, 0);
  const d = decidir(vistaDe(s, 0), 0, semilla(1));
  assert.equal(d.accion.tipo, ACCION.DESPLEGAR);
  assert.equal(d.accion.ranura, 2, 'la ladera vale +2 y las otras tres columnas, nada');
});

test('La IA evita el cauce seco cuando tiene otra columna igual de buena', () => {
  const s = tablero(7);
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  s.lugares[0] = 'cauce_seco';
  const carta = unaDe(CLADO.TEROPODO, (c) => c.coste <= 4 && !c.mecanica?.entrada && !c.mecanica?.costeExtra);
  enMano(s, carta, 0);
  const d = decidir(vistaDe(s, 0), 0, semilla(1));
  assert.equal(d.accion.tipo, ACCION.DESPLEGAR);
  assert.notEqual(d.accion.ranura, 0, 'la primera columna es la que cogería por orden, y la evita');
});

test('Toda forma tiene su peso para la IA, salvo las que ya entran en las cifras', () => {
  // ataque y vida entran por `statsDeCarta`; inmovil no se tasa a propósito:
  // no cambia lo que la carta hace, sólo lo que podrá hacer un migrador.
  for (const f of FORMAS) {
    if (['ataque', 'vida', 'inmovil'].includes(f)) continue;
    assert.equal(typeof BALANCE.valorLugar[f], 'number', `la IA no sabe lo que vale "${f}"`);
  }
});

// -------------------------------------------------------------- partidas

test('Una partida entera con lugares es determinista y se puede forzar el tablero plano', () => {
  const a = jugarPartida(31);
  const b = jugarPartida(31);
  assert.equal(JSON.stringify(a.estado), JSON.stringify(b.estado));
  const plano = jugarPartida(31, undefined, null, true, null, [null, null, null, null]);
  assert.deepEqual(plano.estado.lugares, [null, null, null, null]);
  assert.ok(plano.jugadas.every((j) => j.ranura === null || Number.isInteger(j.ranura)));
});
