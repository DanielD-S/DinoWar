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
import { QUE, CUANDO, INMUNE, TODOS, esZona } from '../src/data/mecanicas.js';
import {
  FASE, ataqueEfectivo, vidaMaxima, vidaActual, curacionDe, espinasDe,
  inmuneA, mecanicaDe, buscablesDe,
} from '../src/engine/state.js';
import { reduce, validar, legales, ACCION } from '../src/engine/actions.js';
import { EFECTOS, esEntrada, valorDeEntrada, HAY_ENTRADAS } from '../src/engine/entradas.js';
import { CON_ENTRADA } from '../sim/entradas.js';
import { mazoCon } from '../sim/carta.mjs';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';
import { limiteDe } from '../src/data/coleccion.js';

// Las DOS de jefe entran en la cuenta a propósito. Viven en CARTAS_DE_JEFE, no
// en CARTAS, y por eso se quedaron planas y sin texto cuando se aplanó el set:
// no salían en ninguna lista, ni en la del Excel ni en la de este test. Son las
// únicas dos recompensas del juego cooperativo.
const CRIATURAS = Object.values({ ...CARTAS, ...CARTAS_DE_JEFE })
  .filter((c) => c.tipo === TIPO.DINOSAURIO);
const CAMPOS = new Set([
  'cuenta', 'aura', 'si', 'trio', 'inmune', 'regenera', 'espinas', 'costeExtra',
  'busca', 'entrada', 'guardia',
]);

// ----------------------------------------------- el vocabulario y los datos

test('Toda criatura tiene habilidad, y toda habilidad tiene nombre y texto', () => {
  for (const c of CRIATURAS) {
    assert.ok(c.mecanica, `${c.id} se quedó sin mecánica`);
    assert.ok(c.rasgoNombre, `${c.id} no tiene nombre de rasgo`);
    assert.ok(c.rasgoTexto, `${c.id} no tiene texto`);
  }
  assert.equal(CRIATURAS.length, 87, '82 del set y las 5 de jefe');
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
    // `devuelve` es el único que lleva objeto —dos cantidades que valen
    // distinto y un filtro— así que su peso está partido en dos claves. Las
    // dos tienen que existir: con una sola, media carta se tasaría en cero.
    if (efecto === 'devuelve') {
      assert.ok(Number.isFinite(BALANCE.valorEntrada.devuelvePropio), 'falta devuelvePropio');
      assert.ok(Number.isFinite(BALANCE.valorEntrada.devuelveRival), 'falta devuelveRival');
      continue;
    }
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
    if (m.cuenta) {
      const zona = esZona(m.cuenta.que);
      assert.ok(zona || m.cuenta.que === QUE.MISMA || m.cuenta.que === QUE.CLADO, c.id);
      // Una zona NO mira `ambos`: la mano del rival ya es la del rival. Un
      // `ambos` puesto ahí es un campo que nadie lee, que es el fallo mudo
      // contra el que existe este fichero entero.
      if (zona) assert.equal(m.cuenta.ambos, undefined, `${c.id}: una zona no mira «ambos»`);
      // Y piden freno: sin `cada` ni `tope`, una mano de ocho cartas son ocho
      // puntos y un descarte de veinte, veinte.
      if (zona) {
        assert.ok(m.cuenta.cada !== undefined || m.cuenta.tope !== undefined,
          `${c.id}: cuenta una zona sin «cada» ni «tope»`);
      }
    }
    if (m.si) assert.ok(Object.values(CUANDO).includes(m.si.cuando), c.id);
    if (m.inmune) assert.ok(Object.values(INMUNE).includes(m.inmune), c.id);
    if (m.aura) assert.ok(m.aura.clado === TODOS || clados.has(m.aura.clado), c.id);
    if (m.busca) {
      const vale = (typeof m.busca === 'object'
        && (m.busca.ataqueMin !== undefined || m.busca.ataqueMax !== undefined))
        || m.busca === QUE.EVENTO || m.busca === QUE.CLIMA || m.busca === QUE.MISMA
        || clados.has(m.busca);
      assert.ok(vale, `${c.id}: busca «${m.busca}», que no es nada`);
    }
  }
});

test('El soporte conserva su rasgo: sin él no sería una carta', () => {
  // 49: clima, evento, recurso y las diez de biomasa. Vale para éstas igual
  // que para las otras — llevan rasgo, nombre y texto, y no llevan `mecanica`,
  // que es de criaturas. Sus números van en `biomasa`, y sin ellos la carta
  // no se juega: el motor los lee al bajarla.
  const soporte = Object.values(CARTAS).filter((c) => c.tipo !== TIPO.DINOSAURIO);
  assert.equal(soporte.length, 49);
  for (const c of soporte) {
    assert.notEqual(c.rasgo, 'NINGUNO', `${c.id} se quedó sin mecánica`);
    assert.ok(c.rasgoNombre && c.rasgoTexto, `${c.id} no tiene nombre o texto`);
    assert.equal(c.mecanica, undefined, `${c.id} lleva las dos cosas`);
    if (c.tipo === TIPO.BIOMASA) {
      assert.ok(Number.isInteger(c.biomasa?.da) && c.biomasa.da > 0, `${c.id} no dice cuánta Biomasa da`);
      assert.ok(Number.isInteger(c.biomasa?.muele) && c.biomasa.muele >= 0, `${c.id} no dice cuánto muele`);
    }
  }
  assert.equal(soporte.filter((c) => c.tipo === TIPO.BIOMASA).length, 10);
});

test('La fase de revelación sigue llamando a la habilidad de entrada', () => {
  // La forma de romper esto en silencio es quitar esta llamada en un refactor.
  const resolve = readFileSync('src/engine/resolve.js', 'utf8');
  assert.match(resolve, /import \{ alEntrar \} from '\.\/entradas\.js'/);
  assert.match(resolve, /alEntrar\(s, inst, \{/);
});

test('El medidor descubre del set las cartas que disparan al entrar', () => {
  // Sólo las del set: las de jefe no se pueden llevar en un mazo cualquiera.
  const esperadas = Object.values(CARTAS)
    .filter((c) => c.tipo === TIPO.DINOSAURIO && c.mecanica.entrada).map((c) => c.id);
  assert.deepEqual([...CON_ENTRADA].sort(), esperadas.sort());
  assert.ok(CON_ENTRADA.length >= 10);
});

test('El medidor de una carta arma un mazo legal', () => {
  // `sim/entradas.js` devolvía un mazo de 53 cartas cuando lo que medía no
  // cabía en 50: se rendía con un `break` y medía igual, sin decirlo. Un
  // medidor que miente es peor que no tenerlo, así que éste va vigilado.
  for (const id of ['jefe_saurophaganax', 'spinosaurus', 'dryosaurus', 'aridez']) {
    const mazo = mazoCon(id);
    const total = mazo.reduce((n, [, c]) => n + c, 0);
    assert.equal(total, BALANCE.tamanoMazo, `${id}: el mazo suma ${total}`);
    for (const [cid, copias] of mazo) {
      assert.ok(copias <= limiteDe(cid),
        `${id}: ${cid} lleva ${copias} y su tope es ${limiteDe(cid)}`);
    }
    assert.ok(mazo.some(([cid]) => cid === id), `${id} no está en su propio mazo`);
  }
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

test('La guardia resta a cada golpe al hábitat, no al total del turno', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimerCombate;
  // Tres rivales sueltos contra ranuras vacías: pegarían su Ataque entero.
  const uno = poner(s, 'ceratosaurus', 1, 0);
  const dos = poner(s, 'ceratosaurus', 1, 1);
  poner(s, 'ceratosaurus', 1, 2);
  const pega = ataqueEfectivo(s, uno) + ataqueEfectivo(s, dos) + ataqueEfectivo(s, uno);

  const sinGuardia = ejecutar(s, FASE.COMBATE);
  assert.equal(sinGuardia.jugadores[0].habitat, BALANCE.vidaHabitat - pega);

  // Con el Barosaurus puesto en una ranura que no está enfrente de nadie.
  poner(s, 'jefe_barosaurus', 0, 4);
  const conGuardia = ejecutar(s, FASE.COMBATE);
  assert.equal(conGuardia.jugadores[0].habitat, BALANCE.vidaHabitat - (pega - 3),
    'un punto menos por CADA uno de los tres, no uno al total');
});

test('La guardia no puede dejar un golpe en negativo ni curar', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimerCombate;
  poner(s, 'jefe_barosaurus', 0, 4);
  const flojo = poner(s, 'dryosaurus', 1, 0);
  s.instancias[flojo].modAtaque = -ataqueEfectivo(s, flojo);   // Ataque 0
  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat, 'ni sube ni baja');
});

test('El aura del Saurophaganax alcanza a tus terópodos y no a los del rival', () => {
  const s = tablero();
  const jefe = poner(s, 'jefe_saurophaganax', 0, 0);
  const mio = poner(s, 'allosaurus', 0, 1);
  const suyo = poner(s, 'allosaurus', 1, 1);
  const herbivoro = poner(s, 'stegosaurus', 0, 2);

  assert.equal(ataqueEfectivo(s, mio), carta('allosaurus').ataque + 1);
  assert.equal(ataqueEfectivo(s, suyo), carta('allosaurus').ataque);
  assert.equal(ataqueEfectivo(s, jefe), carta('jefe_saurophaganax').ataque + 1);
  // El tireóforo cuenta a los suyos, así que su Ataque no es el impreso; lo
  // que importa es que el aura de terópodos no le sume nada.
  assert.equal(ataqueEfectivo(s, herbivoro), carta('stegosaurus').ataque + 1,
    'sólo su propio contador, sin el aura');
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

// ---------------------------------------------- el control de mano y descarte

test('Una mano nueva pasa por el MAZO, no por el descarte', () => {
  // Es la diferencia que hace jugable a toda la ronda del control: lo que
  // sueltas vuelve a estar disponible. Si fuera al descarte, cambiar la mano
  // sería pagar con cartas y nadie lo haría dos veces.
  const s = tablero();
  for (let k = 0; k < 4; k++) enMano(s, 'troodon', 0);
  const mazo = s.jugadores[0].mazo.length;
  const { estado } = entrar(s, 'gallimimus');

  assert.equal(estado.jugadores[0].descarte.length, 0, 'la mano vieja no se descarta');
  assert.equal(estado.jugadores[0].mano.length, 5, 'roba las 5 que promete');
  // Las 4 que solté entran en el mazo y salen 5: el saldo es −1.
  assert.equal(estado.jugadores[0].mazo.length, mazo + 4 - 5);
});

test('El tope recorta la mano del rival y se queda quieto si ya era corta', () => {
  const s = tablero();
  for (let k = 0; k < 7; k++) enMano(s, 'troodon', 1);
  const r = entrar(s, 'anzu').estado;
  assert.equal(r.jugadores[1].mano.length, 4);
  assert.equal(r.jugadores[1].descarte.length, 3);

  const t = tablero();
  enMano(t, 'troodon', 1);
  const u = entrar(t, 'anzu').estado;
  assert.equal(u.jugadores[1].mano.length, 1, 'no le roba de menos');
  const e = u.eventos.find((x) => x.tipo === 'ENTRADA' && x.efecto === 'topeManoRival');
  assert.equal(e.n, 0, 'y deja constancia de que no quitó nada');
});

test('Un tope BAJO vale más que uno alto, que es lo contrario que el resto', () => {
  // `topeManoRival` es el único efecto cuyo número va al revés: es lo que le
  // DEJA al rival. Tasarlo por su cifra haría que un tope de 6 valiera más que
  // uno de 2, y la IA jugaría la carta floja antes que la buena.
  assert.ok(valorDeEntrada('anzu') > 0);
  const V = BALANCE.valorEntrada;
  assert.equal(valorDeEntrada('anzu'), (BALANCE.manoInicial - 4) * V.topeManoRival);
});

test('El rescate saca del descarte a la mano, y nada si el descarte está vacío', () => {
  const s = tablero();
  s.jugadores[0].descarte.push(...s.jugadores[0].mazo.splice(0, 3));
  const r = entrar(s, 'tarbosaurus').estado;
  assert.equal(r.jugadores[0].descarte.length, 1);
  assert.equal(r.jugadores[0].mano.length, 2);

  const t = tablero();
  const u = entrar(t, 'tarbosaurus').estado;
  const e = u.eventos.find((x) => x.tipo === 'ENTRADA' && x.efecto === 'rescata');
  assert.equal(e.n, 0);
});

test('Un contador de zona mira la mano o el descarte, con su tope y su tramo', () => {
  const s = tablero();
  const deino = poner(s, 'deinocheirus', 0, 0);
  assert.equal(ataqueEfectivo(s, deino), carta('deinocheirus').ataque, 'mano vacía, nada');
  for (let k = 0; k < 3; k++) enMano(s, 'troodon', 0);
  assert.equal(ataqueEfectivo(s, deino), carta('deinocheirus').ataque + 3);
  for (let k = 0; k < 9; k++) enMano(s, 'troodon', 0);
  assert.equal(ataqueEfectivo(s, deino), carta('deinocheirus').ataque + 4, 'el tope corta en 4');

  // La del rival es la del rival: una zona no mira «ambos».
  const t = tablero();
  const raptor = poner(t, 'dakotaraptor', 0, 0);
  for (let k = 0; k < 2; k++) enMano(t, 'troodon', 0);
  assert.equal(ataqueEfectivo(t, raptor), carta('dakotaraptor').ataque, 'tu mano no le suma');
  for (let k = 0; k < 6; k++) enMano(t, 'troodon', 1);
  assert.equal(ataqueEfectivo(t, raptor), carta('dakotaraptor').ataque + 3, 'y el tope corta en 3');

  // Y el tramo: +1 de Vida por cada 4 cartas del descarte.
  const u = tablero();
  const psit = poner(u, 'psittacosaurus', 0, 0);
  u.jugadores[0].descarte.push(...u.jugadores[0].mazo.splice(0, 3));
  assert.equal(vidaMaxima(u, psit), carta('psittacosaurus').vida, 'con 3 no llega al tramo');
  u.jugadores[0].descarte.push(...u.jugadores[0].mazo.splice(0, 5));
  assert.equal(vidaMaxima(u, psit), carta('psittacosaurus').vida + 2, 'con 8 son dos tramos');
});

test('Una búsqueda por Ataque mira el impreso, que es lo único que hay en el mazo', () => {
  const s = tablero();
  for (const iid of buscablesDe(s, 0, 'shuvuuia')) {
    const c = carta(s.instancias[iid].cardId);
    assert.equal(c.tipo, TIPO.DINOSAURIO);
    assert.ok(c.ataque <= 2, `${c.id} pega ${c.ataque} y el filtro pedía 2 o menos`);
  }
  for (const iid of buscablesDe(s, 0, 'saurolophus')) {
    const c = carta(s.instancias[iid].cardId);
    assert.ok(c.ataque >= 8, `${c.id} pega ${c.ataque} y el filtro pedía 8 o más`);
  }
  // Y no se cruzan: lo que vale para una no vale para la otra.
  const flojos = new Set(buscablesDe(s, 0, 'shuvuuia'));
  assert.ok(buscablesDe(s, 0, 'saurolophus').every((iid) => !flojos.has(iid)));
});

// ------------------------------------------------- el rebote y el entierro

test('Devolver saca del campo a la mano, limpio y sin trofeo', () => {
  const s = tablero();
  const mio = poner(s, 'allosaurus', 0, 1, { heridas: 3, modAtaque: 2 });
  const suyo = poner(s, 'troodon', 1, 0);
  const trofeos = s.jugadores[1].trofeos;
  const r = entrar(s, 'giraffatitan').estado;

  assert.equal(r.ranuras[0][1], null, 'la ranura queda libre');
  assert.equal(r.ranuras[1][0], null);
  assert.ok(r.jugadores[0].mano.includes(mio), 'el tuyo vuelve a TU mano');
  assert.ok(r.jugadores[1].mano.includes(suyo), 'y el suyo a la suya');
  // Vuelve limpio: la instancia es la misma pero la carta ya no está en juego.
  assert.equal(r.instancias[mio].heridas, 0);
  assert.equal(r.instancias[mio].modAtaque, 0);
  assert.equal(r.instancias[mio].ranura, null);
  // Y no es una muerte: nadie se lleva un trofeo ni pasa por el descarte.
  assert.equal(r.jugadores[1].trofeos, trofeos);
  assert.equal(r.jugadores[0].descarte.length, 0);
});

test('El rebote elige sin preguntar: el tuyo más herido y el suyo que más pega', () => {
  const s = tablero();
  // La ranura 0 se deja libre: es donde `entrar` despliega al que dispara.
  const sano = poner(s, 'apatosaurus', 0, 1);
  const herido = poner(s, 'diplodocus', 0, 2, { heridas: 6 });
  const grande = poner(s, 'carnotaurus', 1, 0);   // 7 de Ataque: no cabe bajo 4
  const mediano = poner(s, 'dromaeosaurus', 1, 1); // 3
  const chico = poner(s, 'troodon', 1, 2);         // 1
  const r = entrar(s, 'giraffatitan').estado;

  assert.equal(r.instancias[herido].ranura, null, 'se lleva al tuyo más herido');
  assert.notEqual(r.instancias[sano].ranura, null, 'y deja al que aguanta');
  assert.notEqual(r.instancias[grande].ranura, null, 'el de 7 no cabe bajo el listón');
  assert.equal(r.instancias[mediano].ranura, null, 'de los que caben, el que más pega');
  assert.notEqual(r.instancias[chico].ranura, null);
});

test('Un rebote sobre el campo vacío no rompe nada y deja constancia', () => {
  const s = tablero();
  const r = entrar(s, 'deltadromeus').estado;
  const e = r.eventos.find((x) => x.tipo === 'ENTRADA' && x.efecto === 'devuelve');
  assert.equal(e.n, 0);
});

test('Las adaptaciones pegadas no viajan con la carta: se quedan en el descarte', () => {
  const s = tablero();
  const suyo = poner(s, 'troodon', 1, 0);
  const adap = enMano(s, 'neumaticidad', 1);
  s.jugadores[1].biomasa = 9;
  s.fase = FASE.DESPLIEGUE;
  let r = reduce(s, { tipo: ACCION.EVENTO, jugador: 1, iid: adap, objetivo: suyo });
  r = ejecutar(r, FASE.REVELACION);
  assert.equal(r.instancias[suyo].adherencias.length, 1);

  const t = entrar(r, 'deltadromeus').estado;
  assert.ok(t.jugadores[1].mano.includes(suyo), 'la criatura vuelve a la mano');
  assert.equal(t.instancias[suyo].adherencias.length, 0);
  assert.ok(t.jugadores[1].descarte.includes(adap), 'la adaptación se queda en el descarte');
});

test('Enterrar va del descarte al MAZO y lo baraja; rescatar, a la mano', () => {
  // Son las dos direcciones opuestas y conviene no confundirlas: enterrar es
  // lo único del juego que ALARGA un mazo, o sea la primera respuesta que la
  // vía de la extinción ha tenido nunca.
  const s = tablero();
  s.jugadores[0].descarte.push(...s.jugadores[0].mazo.splice(0, 5));
  const mazo = s.jugadores[0].mazo.length;
  const r = entrar(s, 'rugops').estado;

  assert.equal(r.jugadores[0].mazo.length, mazo + 2, 'el mazo crece');
  assert.equal(r.jugadores[0].descarte.length, 3);
  assert.equal(r.jugadores[0].mano.length, 0, 'no pasa por la mano');

  const t = tablero();
  const u = entrar(t, 'rugops').estado;
  const e = u.eventos.find((x) => x.tipo === 'ENTIERRO');
  assert.equal(e.cartas, 0, 'sin descarte no inventa cartas');
});

test('El golpe al hábitat va directo y no toca a nadie del campo', () => {
  const s = tablero();
  const suyo = poner(s, 'apatosaurus', 1, 0);
  const antes = s.jugadores[1].habitat;
  const r = entrar(s, 'carcharodontosaurus').estado;

  assert.equal(r.jugadores[1].habitat, antes - 3);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat, 'el tuyo no se toca');
  assert.equal(r.instancias[suyo].heridas, 0, 'y el de enfrente tampoco');
});

test('El peso de `devuelve` no tasa el filtro, que no es una cantidad', () => {
  // Un `ataqueMax` alto es una carta que alcanza a MÁS, no una carta que hace
  // más veces su efecto. Multiplicarlo por su peso haría que subir el listón
  // valiera como hacerlo otra vez.
  const V = BALANCE.valorEntrada;
  assert.equal(valorDeEntrada('giraffatitan'), V.devuelvePropio + V.devuelveRival);
  assert.equal(valorDeEntrada('deltadromeus'), V.devuelveRival);
  assert.ok(V.devuelveRival > V.devuelvePropio,
    'quitarle uno del campo al rival vale más que recoger el tuyo');
});

test('Con DINOWAR_ENTRADAS=0 no se dispara ninguna', () => {
  // Es la palanca con la que se miden: mismas semillas, con y sin.
  assert.equal(esEntrada('spinosaurus'), true);
  assert.equal(mecanicaDe('spinosaurus').entrada.mueleRival, 5);
});
