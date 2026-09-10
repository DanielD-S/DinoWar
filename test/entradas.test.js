// Las habilidades de criatura: las declaradas por el autor sobre la hoja de
// recoste y las que se inventaron para rellenar las diecisiete que dejó en
// blanco.
//
// Son datos —cada carta lleva su `mecanica`— así que hay dos clases de test y
// las dos hacen falta. Los de ABAJO prueban que el motor sabe aplicar cada
// FORMA: un contador, un aura, una inmunidad. Los de ARRIBA prueban que el
// vocabulario y los datos casan, y son los que van a saltar cuando alguien
// escriba una carta con un campo que el motor no mira: sin ellos la carta se
// jugaría sin hacer nada y nadie se enteraría.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { BALANCE } from '../src/data/balance.js';
import { CARTAS, CARTAS_DE_JEFE, TIPO, CLADO, carta } from '../src/data/cards.js';
import { QUE, CUANDO, INMUNE, TODOS } from '../src/data/mecanicas.js';
import {
  FASE, ataqueEfectivo, vidaMaxima, vidaActual, curacionDe, espinasDe,
  inmuneA, mecanicaDe, buscablesDe,
} from '../src/engine/state.js';
import { reduce, validar, legales, ACCION } from '../src/engine/actions.js';
import { EFECTOS, esEntrada, valorDeEntrada, HAY_ENTRADAS } from '../src/engine/entradas.js';
import { CON_ENTRADA } from '../sim/entradas.js';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';

const CRIATURAS = Object.values(CARTAS).filter((c) => c.tipo === TIPO.DINOSAURIO);
const CAMPOS = new Set([
  'cuenta', 'aura', 'si', 'trio', 'inmune', 'regenera', 'espinas', 'costeExtra',
  'busca', 'entrada',
]);

// ----------------------------------------------- el vocabulario y los datos

test('Toda criatura tiene habilidad, y toda habilidad tiene nombre y texto', () => {
  for (const c of CRIATURAS) {
    assert.ok(c.mecanica, `${c.id} se quedó sin mecánica`);
    assert.ok(c.rasgoNombre, `${c.id} no tiene nombre de rasgo`);
    assert.ok(c.rasgoTexto, `${c.id} no tiene texto`);
  }
  assert.equal(CRIATURAS.length, 50);
});

test('Ninguna mecánica usa un campo que el motor no mire', () => {
  // Es EL test de esta forma de rasgo. Escribir `entrda: { roba: 1 }` produce
  // una carta que se juega, se paga y no hace nada, y en una partida suelta no
  // se distingue de la mala suerte.
  for (const c of CRIATURAS) {
    for (const campo of Object.keys(c.mecanica)) {
      assert.ok(CAMPOS.has(campo), `${c.id}: «${campo}» no es una forma que el motor conozca`);
    }
    for (const efecto of Object.keys(c.mecanica.entrada ?? {})) {
      assert.ok(EFECTOS.includes(efecto), `${c.id}: la entrada «${efecto}» no existe`);
    }
  }
});

test('Toda entrada vale algo para la IA, o la carta no se juega jamás', () => {
  // Le pasó a la Llanura de inundación: cero usos en 300 partidas hasta que se
  // le puso número. Un efecto sin peso es una carta invisible.
  for (const efecto of EFECTOS) {
    assert.ok(Number.isFinite(BALANCE.valorEntrada[efecto]),
      `valorEntrada.${efecto} no es un número`);
  }
  for (const c of CRIATURAS) {
    if (!c.mecanica.entrada) continue;
    assert.ok(valorDeEntrada(c.id) !== 0, `${c.id} vale 0 para la IA`);
  }
  assert.equal(HAY_ENTRADAS, true);
});

test('Las etiquetas de las mecánicas son las del vocabulario', () => {
  const clados = new Set(Object.values(CLADO));
  for (const c of CRIATURAS) {
    const m = c.mecanica;
    if (m.cuenta) assert.ok(m.cuenta.que === QUE.MISMA || m.cuenta.que === QUE.CLADO, c.id);
    if (m.si) assert.ok(Object.values(CUANDO).includes(m.si.cuando), c.id);
    if (m.inmune) assert.ok(Object.values(INMUNE).includes(m.inmune), c.id);
    if (m.aura) assert.ok(m.aura.clado === TODOS || clados.has(m.aura.clado), c.id);
    if (m.busca) {
      const vale = m.busca === QUE.EVENTO || m.busca === QUE.CLIMA || m.busca === QUE.MISMA
        || clados.has(m.busca);
      assert.ok(vale, `${c.id}: busca «${m.busca}», que no es nada`);
    }
  }
});

test('El soporte conserva su rasgo: sin él no sería una carta', () => {
  const soporte = Object.values(CARTAS).filter((c) => c.tipo !== TIPO.DINOSAURIO);
  assert.equal(soporte.length, 16);
  for (const c of soporte) {
    assert.notEqual(c.rasgo, 'NINGUNO', `${c.id} se quedó sin mecánica`);
    assert.ok(c.rasgoNombre && c.rasgoTexto, `${c.id} no tiene nombre o texto`);
    assert.equal(c.mecanica, undefined, `${c.id} lleva las dos cosas`);
  }
});

test('La fase de revelación sigue llamando a la habilidad de entrada', () => {
  // La forma de romper esto en silencio es quitar esta llamada en un refactor.
  const resolve = readFileSync('src/engine/resolve.js', 'utf8');
  assert.match(resolve, /import \{ alEntrar \} from '\.\/entradas\.js'/);
  assert.match(resolve, /alEntrar\(s, inst, \{/);
});

test('El medidor descubre del set las cartas que disparan al entrar', () => {
  const esperadas = CRIATURAS.filter((c) => c.mecanica.entrada).map((c) => c.id);
  assert.deepEqual([...CON_ENTRADA].sort(), esperadas.sort());
  assert.ok(CON_ENTRADA.length >= 10);
});

// --------------------------------------------------------------- contadores

test('Un contador se cuenta a sí mismo, que es lo que dice su texto', () => {
  const s = tablero();
  const uno = poner(s, 'troodon', 0, 0);
  assert.equal(ataqueEfectivo(s, uno), carta('troodon').ataque + 1);

  poner(s, 'troodon', 0, 1);
  assert.equal(ataqueEfectivo(s, uno), carta('troodon').ataque + 2, 'el segundo suma a los dos');
});

test('«tanto tuyos como del rival» cuenta los dos bandos; los demás, no', () => {
  const s = tablero();
  const mio = poner(s, 'dryosaurus', 0, 0);
  const solo = ataqueEfectivo(s, mio);
  poner(s, 'dryosaurus', 1, 0);
  assert.equal(ataqueEfectivo(s, mio), solo + 1, 'Dryosaurus cuenta también los ajenos');

  const t = tablero();
  const tuyo = poner(t, 'troodon', 0, 0);
  const suyo = ataqueEfectivo(t, tuyo);
  poner(t, 'troodon', 1, 0);
  assert.equal(ataqueEfectivo(t, tuyo), suyo, 'Troodon sólo cuenta los suyos');
});

test('Un contador por clado mira el clado, no la especie', () => {
  const s = tablero();
  const iid = poner(s, 'titanoceratops', 0, 0);
  const solo = ataqueEfectivo(s, iid);
  poner(s, 'chasmosaurus', 0, 1);          // otro marginocéfalo
  assert.equal(ataqueEfectivo(s, iid), solo + 1);
  poner(s, 'allosaurus', 0, 2);            // un terópodo: no cuenta
  assert.equal(ataqueEfectivo(s, iid), solo + 1);
});

// -------------------------------------------------------------------- auras

test('Un aura alcanza a los de su clado, a ella misma y a nadie más', () => {
  const s = tablero();
  const aura = poner(s, 'monolophosaurus', 0, 0);     // tus terópodos +1 de Vida
  const compi = poner(s, 'allosaurus', 0, 1);
  const ajeno = poner(s, 'allosaurus', 1, 1);
  const otroClado = poner(s, 'stegosaurus', 0, 2);

  assert.equal(vidaMaxima(s, compi), carta('allosaurus').vida + 1);
  assert.equal(vidaMaxima(s, ajeno), carta('allosaurus').vida, 'el aura no cruza el campo');
  assert.equal(vidaMaxima(s, aura), carta('monolophosaurus').vida + 1, 'y se incluye a sí misma');
  assert.equal(vidaMaxima(s, otroClado), carta('stegosaurus').vida,
    'el tireóforo no ve el aura de terópodos');

  // Si el aura cae, la Vida extra se va con ella: es dinámica, como lo era el
  // Canal desde siempre.
  s.ranuras[0][0] = null;
  s.instancias[aura].ranura = null;
  assert.equal(vidaMaxima(s, compi), carta('allosaurus').vida);
});

// ------------------------------------------------------------ condicionales

test('Un «si» de clima se enciende y se apaga con la carta del campo', () => {
  const s = tablero();
  const iid = poner(s, 'tongtianlong', 0, 0);
  const seco = ataqueEfectivo(s, iid);
  s.campo = 'sabana';
  assert.equal(ataqueEfectivo(s, iid), seco + 2);
  s.campo = null;
  assert.equal(ataqueEfectivo(s, iid), seco);
});

test('Rhinorex sólo pega de más mientras va perdiendo', () => {
  // Es la única condición del set que premia ir por detrás, y está puesta a
  // propósito: la bola de nieve es el problema de balance más viejo del juego.
  const s = tablero();
  const iid = poner(s, 'rhinorex', 0, 0);
  const base = carta('rhinorex').ataque;
  assert.equal(ataqueEfectivo(s, iid), base, 'empatados, nada');

  s.jugadores[0].habitat -= 10;
  assert.equal(ataqueEfectivo(s, iid), base + 2);

  s.jugadores[1].habitat -= 20;
  assert.equal(ataqueEfectivo(s, iid), base, 'ya va ganando: se apaga');
});

test('El umbral de tres se cobra UNA vez y no se pierde al morir el tercero', () => {
  const s = tablero();
  const uno = poner(s, 'brachylophosaurus', 0, 0);
  const dos = poner(s, 'brachylophosaurus', 0, 1);
  const base = carta('brachylophosaurus').ataque;
  let r = ejecutar(s, FASE.REVELACION);
  assert.equal(ataqueEfectivo(r, uno), base, 'con dos todavía no');

  poner(s, 'brachylophosaurus', 0, 2);
  r = ejecutar(s, FASE.REVELACION);
  assert.equal(ataqueEfectivo(r, uno), base + 6);
  assert.equal(ataqueEfectivo(r, dos), base + 6, 'lo ganan los tres');

  // Se va uno: los otros conservan lo ganado. Es lo que lo separa de un
  // contador, que se recalcularía a la baja.
  r.ranuras[0][2] = null;
  assert.equal(ataqueEfectivo(r, uno), base + 6);

  // Y no se cobra dos veces por volver a pasar por la revelación.
  const otra = ejecutar(r, FASE.REVELACION);
  assert.equal(ataqueEfectivo(otra, uno), base + 6);
});

// --------------------------------------------------------------- inmunidades

test('La inmunidad a eventos tapa las presiones del rival', () => {
  const s = tablero();
  const iid = poner(s, 'lokiceratops', 0, 0);
  assert.equal(inmuneA(s, iid, INMUNE.EVENTO), true);

  // Ni siquiera se le puede señalar: la carta que apunta a uno inmune no es
  // una jugada legal, y `legales` tampoco la ofrece.
  const fractura = enMano(s, 'fractura', 1);
  s.jugadores[1].biomasa = 9;
  s.fase = FASE.DESPLIEGUE;
  assert.ok(validar(s, { tipo: ACCION.EVENTO, jugador: 1, iid: fractura, objetivo: iid }));
  assert.ok(!legales(s, 1).some((a) => a.objetivo === iid));

  // Y la Mortandad, que no elige, le pasa por encima sin tocarlo.
  const suyo = poner(s, 'allosaurus', 1, 1);
  const mortandad = enMano(s, 'mortandad', 1);
  let r = reduce(s, { tipo: ACCION.EVENTO, jugador: 1, iid: mortandad });
  r = ejecutar(r, FASE.REVELACION);
  assert.equal(r.instancias[iid].heridas, 0, 'el inmune sale ileso');
  assert.ok(r.instancias[suyo].heridas > 0, 'el propio del que la juega, no');
});

test('Un aura de inmunidad protege a todo el bando', () => {
  const s = tablero();
  poner(s, 'antarctosaurus', 0, 0);
  const compi = poner(s, 'allosaurus', 0, 1);
  const ajeno = poner(s, 'allosaurus', 1, 1);
  s.campo = 'canal';                        // +1 de Vida a todo el campo

  assert.equal(inmuneA(s, compi, INMUNE.CLIMA), true);
  assert.equal(vidaMaxima(s, compi), carta('allosaurus').vida, 'el clima no le llega');
  assert.equal(vidaMaxima(s, ajeno), carta('allosaurus').vida + BALANCE.efectosCampo.canalVida);
});

// ----------------------------------------------- curación, espinas, búsqueda

test('Camarasaurus se cura solo; Maiasaura cura a todos los tuyos', () => {
  const s = tablero();
  const solo = poner(s, 'camarasaurus', 0, 0);
  assert.equal(curacionDe(s, solo), 1);

  const t = tablero();
  const madre = poner(t, 'maiasaura', 0, 0);
  const cria = poner(t, 'allosaurus', 0, 1);
  const ajeno = poner(t, 'allosaurus', 1, 1);
  assert.equal(curacionDe(t, cria), 1);
  assert.equal(curacionDe(t, madre), 1, 'ella también es de los suyos');
  assert.equal(curacionDe(t, ajeno), 0);
});

test('Las espinas devuelven daño a quien las hiere en combate', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimerCombate;
  const pinchoso = poner(s, 'gargoyleosaurus', 0, 0);
  // Uno que aguante el intercambio: al que se cae le limpian las heridas al
  // recogerlo, y entonces no queda nada que mirar.
  const atacante = poner(s, 'apatosaurus', 1, 0);
  assert.equal(espinasDe(s, pinchoso), 3);

  const r = ejecutar(s, FASE.COMBATE);
  assert.ok(r.instancias[atacante].heridas >= 3, 'le vuelven las púas');
  assert.ok(r.eventos.some((e) => e.tipo === 'DANO' && e.causa === 'ESPINAS'));
});

test('Cada búsqueda encuentra lo suyo y sólo lo suyo', () => {
  const s = tablero();
  const evento = s.jugadores[0].mazo.find((iid) => carta(s.instancias[iid].cardId).tipo === TIPO.EVENTO);
  const clima = s.jugadores[0].mazo.find((iid) => carta(s.instancias[iid].cardId).tipo === TIPO.CLIMA);

  assert.ok(buscablesDe(s, 0, 'athenar').includes(evento));
  assert.ok(!buscablesDe(s, 0, 'athenar').includes(clima));
  assert.ok(buscablesDe(s, 0, 'sanjuansaurus').includes(clima));

  // Por clado, y por especie.
  for (const iid of buscablesDe(s, 0, 'liaoceratops')) {
    assert.equal(carta(s.instancias[iid].cardId).clado, CLADO.MARGINOCEFALO);
  }
  for (const iid of buscablesDe(s, 0, 'platyceratops')) {
    assert.equal(s.instancias[iid].cardId, 'platyceratops');
  }
});

// ------------------------------------------------------------- coste añadido

test('Carnotaurus no se juega sin soltar dos cartas de la mano', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  const carno = enMano(s, 'carnotaurus', 0);

  const jugada = { tipo: ACCION.DESPLEGAR, jugador: 0, iid: carno, ranura: 0 };
  assert.ok(validar(s, jugada), 'sin pagar el extra no es legal');
  assert.ok(!legales(s, 0).some((a) => a.iid === carno), 'y con la mano vacía no se ofrece');

  const a = enMano(s, 'dryosaurus', 0);
  const b = enMano(s, 'troodon', 0);
  const conPago = { ...jugada, descartes: [a, b] };
  assert.equal(validar(s, conPago), null);

  const r = reduce(s, conPago);
  assert.equal(r.jugadores[0].mano.length, 0, 'se van las dos');
  assert.ok(r.jugadores[0].descarte.includes(a) && r.jugadores[0].descarte.includes(b));
  assert.ok(r.eventos.some((e) => e.tipo === 'COSTE_EXTRA'));
});

// ------------------------------------------------------ disparos al entrar

/** Despliega `cardId` en la ranura 0 del jugador 0 y resuelve la revelación. */
function entrar(s, cardId, ranura = 0) {
  const iid = s.siguienteInstId;
  const enLaMano = enMano(s, cardId, 0);
  s.jugadores[0].pendientes.push({ tipo: 'DESPLIEGUE', iid: enLaMano, ranura });
  s.jugadores[0].mano = s.jugadores[0].mano.filter((x) => x !== enLaMano);
  return { estado: ejecutar(s, FASE.REVELACION), iid: enLaMano };
}

test('Moler saca cartas del mazo al descarte, del rival y del propio', () => {
  const s = tablero();
  const mio = s.jugadores[0].mazo.length;
  const suyo = s.jugadores[1].mazo.length;
  const { estado } = entrar(s, 'spinosaurus');

  assert.equal(estado.jugadores[1].mazo.length, suyo - 5);
  assert.equal(estado.jugadores[0].mazo.length, mio - 2);
  assert.equal(estado.jugadores[1].descarte.length, 5);
});

test('Robar, curar el hábitat y descartarle de la mano al rival', () => {
  const s = tablero();
  const mano = s.jugadores[0].mano.length;
  assert.equal(entrar(s, 'huaxiadraco').estado.jugadores[0].mano.length, mano + 1);

  const t = tablero();
  t.jugadores[0].habitat -= 5;
  assert.equal(entrar(t, 'loricatosaurus').estado.jugadores[0].habitat,
    BALANCE.vidaHabitat - 3, 'recupera 2 de los 5');

  // Y no sube del tope: curar por encima sería una reserva invisible.
  const u = tablero();
  assert.equal(entrar(u, 'loricatosaurus').estado.jugadores[0].habitat, BALANCE.vidaHabitat);

  const v = tablero();
  enMano(v, 'allosaurus', 1);
  enMano(v, 'troodon', 1);
  const r = entrar(v, 'allosaurus').estado;
  assert.equal(r.jugadores[1].mano.length, 1, 'le quita una al azar');
  assert.equal(r.jugadores[1].descarte.length, 1);
});

test('La emboscada cae sobre el de enfrente antes del combate', () => {
  const s = tablero();
  const victima = poner(s, 'apatosaurus', 1, 0);   // aguanta, para poder mirarlo
  const { estado } = entrar(s, 'alaskacephale', 0);
  assert.ok(estado.instancias[victima].heridas >= 2);

  // Sin nadie enfrente el evento se emite igual, con 0: si no, la habilidad no
  // deja rastro y el jugador no distingue el fallo de la falta de rasgo.
  const t = tablero();
  const r = entrar(t, 'alaskacephale', 1).estado;
  const e = r.eventos.find((x) => x.tipo === 'ENTRADA' && x.efecto === 'emboscada');
  assert.equal(e.n, 0);
});

test('Tijera se lleva al que cabe y pega más, y no pregunta', () => {
  const s = tablero();
  const gordo = poner(s, 'apatosaurus', 1, 1);      // 10 de Vida: no cabe
  const flojo = poner(s, 'dryosaurus', 1, 2);       // poca Vida y poco Ataque
  const duro = poner(s, 'ceratosaurus', 1, 3);      // cabe y es el que más pega

  const { estado } = entrar(s, 'tyrannotitan', 0);
  assert.equal(vivo(estado, duro), false, 'se lleva al que más pega de los que caben');
  assert.equal(vivo(estado, flojo), true);
  assert.equal(vivo(estado, gordo), true, 'al grande no lo alcanza');
  assert.ok(estado.jugadores[1].descarte.includes(duro));

  // Determinista: la misma partida tiene que salir igual en el servidor.
  const otra = entrar(tablero(), 'tyrannotitan', 0).estado;
  assert.ok(otra.eventos.some((e) => e.tipo === 'ENTRADA' && e.efecto === 'fulmina'));
});

test('Con DINOWAR_ENTRADAS=0 no se dispara ninguna', () => {
  // Es la palanca con la que se miden: mismas semillas, con y sin.
  assert.equal(esEntrada('spinosaurus'), true);
  assert.equal(mecanicaDe('spinosaurus').entrada.mueleRival, 5);
});
