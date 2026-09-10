// DinoWar — reglas de combate, ranuras, victorias y cartas.

import test from 'node:test';
import assert from 'node:assert/strict';

import { BALANCE, TOTAL_MAZO } from '../src/data/balance.js';
import { CARTAS, CLADO, RASGO, TIPO, ES_DINOSAURIO, carta } from '../src/data/cards.js';
import {
  crearPartida, FASE, MOTIVO_FIN,
  unidadEn, unidadesDe, ataqueEfectivo, vidaActual, danoEntre,
  espinasDe, rentaDe, curacionDe, efectosDe, adheridasA, buscablesDe, vidaMaxima,
} from '../src/engine/state.js';
import { reduce, ACCION, avanzar, validar } from '../src/engine/actions.js';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';

// --------------------------------------------------------------- economía

test('La renta es plana y es igual para los dos bandos', () => {
  const s = tablero();
  for (const turno of [1, 4, 8, 12]) {
    s.turno = turno;
    assert.equal(rentaDe(s), BALANCE.rentaPorTurno, 'la renta no depende del turno');
    const r = ejecutar(s, FASE.RENTA);
    assert.equal(r.jugadores[0].biomasa, r.jugadores[1].biomasa, 'los dos cobran lo mismo');
  }
});

test('El turno 1 reparte el fondo inicial y a partir de ahí acumula de una en una', () => {
  let s = tablero();
  for (let turno = 1; turno <= 5; turno++) {
    s.turno = turno;
    s = ejecutar(s, FASE.RENTA);
    const esperado = BALANCE.biomasaInicial + (turno - 1) * BALANCE.rentaPorTurno;
    assert.equal(s.jugadores[0].biomasa, esperado,
      `en el turno ${turno} sin gastar debería haber ${esperado}`);
  }
});

test('La renta NO depende de ir ganando: es la corrección central de la v2', () => {
  const s = tablero();
  s.turno = 5;
  poner(s, 'allosaurus', 0, 0);
  poner(s, 'allosaurus', 0, 1);
  s.jugadores[0].trofeos = 8;

  const r = ejecutar(s, FASE.RENTA);
  assert.equal(r.jugadores[0].biomasa, r.jugadores[1].biomasa);
});

test('Lo que no gastas sigue ahí al turno siguiente', () => {
  const s = tablero();
  s.turno = 6;
  s.jugadores[0].biomasa = 3;
  const r = ejecutar(s, FASE.RENTA);
  assert.equal(r.jugadores[0].biomasa, 3 + BALANCE.rentaPorTurno,
    'gastar poco un turno tiene que valer para el siguiente');
});

test('Lo ahorrado tiene tope: no se puede acampar veinte turnos', () => {
  const s = tablero();
  s.turno = 30;
  s.jugadores[0].biomasa = BALANCE.rentaTope;
  const r = ejecutar(s, FASE.RENTA);
  assert.equal(r.jugadores[0].biomasa, BALANCE.rentaTope);
});

// ---------------------------------------------------------------- combate

test('Ranuras enfrentadas: se hacen daño a la vez', () => {
  const s = tablero();
  const a = poner(s, 'ceratosaurus', 0, 1);   // 4/3
  const b = poner(s, 'ceratosaurus', 1, 1);   // 4/3

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(vivo(r, a), false, 'un intercambio mutuo mata a los dos');
  assert.equal(vivo(r, b), false);
  assert.equal(r.jugadores[0].trofeos, 1);
  assert.equal(r.jugadores[1].trofeos, 1);
});

test('Ranura enfrentada vacía: el ocupante golpea el habitat rival', () => {
  const s = tablero();
  const a = poner(s, 'allosaurus', 0, 2);

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - carta('allosaurus').ataque);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat, 'el tuyo no se toca');
  assert.equal(vivo(r, a), true);
});

test('Sólo se enfrentan las ranuras del mismo índice', () => {
  const s = tablero();
  poner(s, 'allosaurus', 0, 0);
  poner(s, 'allosaurus', 1, 3);

  const r = ejecutar(s, FASE.COMBATE);

  // Ninguno tiene rival enfrente: los dos biomas reciben.
  const atq = carta('allosaurus').ataque;
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat - atq);
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - atq);
});

test('Las heridas persisten entre turnos', () => {
  const s = tablero();
  const grande = poner(s, 'apatosaurus', 0, 0);   // 4 atq / 3+1 def / 12 vida
  poner(s, 'torvosaurus', 1, 0);                  // 8 atq: de los pocos que le hacen mella

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(vivo(r, grande), true);
  assert.ok(r.instancias[grande].heridas > 0, 'queda herido, no intacto');
  assert.ok(vidaActual(r, grande) < 12);
});

// ------------------------------------------------------------ red trófica

test('El daño es el Ataque y nada más: no hay resta que adivinar', () => {
  const s = tablero();
  // Es la razón de haber quitado la Defensa. Antes esto daba 1 —el suelo— y no
  // había forma de deducirlo mirando las dos cartas: Ornitholestes pega 2 y
  // Loricatosaurus reducía 6.
  const debil = poner(s, 'ornitholestes', 0, 0);
  const muro = poner(s, 'loricatosaurus', 1, 0);

  assert.equal(danoEntre(s, debil, muro), CARTAS.ornitholestes.ataque);
  assert.equal(BALANCE.danoMinimo, undefined,
    'el suelo de daño se fue con la Defensa: sólo existía para que no hiciera inmune');
});

test('Una criatura es coste, Ataque y Vida: nada más', () => {
  // Los rasgos de criatura se quitaron enteros. Aquí se comprobaba que Manada
  // sumaba Vida con otro saurópodo al lado; ya no suma nada nadie.
  const s = tablero();
  const sauropodo = poner(s, 'camarasaurus', 0, 0);
  const colosal = poner(s, 'apatosaurus', 0, 1);
  const agil = poner(s, 'dryosaurus', 0, 2);

  assert.equal(vidaMaxima(s, sauropodo), CARTAS.camarasaurus.vida);
  assert.equal(vidaMaxima(s, agil), CARTAS.dryosaurus.vida);
  assert.equal(vidaMaxima(s, colosal), CARTAS.apatosaurus.vida,
    'tener otro saurópodo al lado ya no suma: Manada dejó de existir');

  for (const c of Object.values(CARTAS)) {
    if (c.tipo !== TIPO.DINOSAURIO) continue;
    assert.equal(c.rasgo, 'NINGUNO', `${c.id} conserva un rasgo`);
  }
});

test('El primer turno no hay combate', () => {
  const s = tablero();
  s.turno = 1;
  const a = poner(s, 'torvosaurus', 0, 0);
  const b = poner(s, 'dryosaurus', 1, 0);
  poner(s, 'allosaurus', 0, 3);        // sin nadie enfrente

  const r = ejecutar(s, FASE.COMBATE);

  assert.equal(vivo(r, a), true);
  assert.equal(vivo(r, b), true, 'nadie muere en el turno 1');
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat, 'ni el habitat recibe');
  assert.ok(r.eventos.some((e) => e.tipo === 'SIN_COMBATE'));
});

test('Registro fósil: cada baja rival es un trofeo', () => {
  const s = tablero();
  poner(s, 'torvosaurus', 0, 0);    // 8/6
  poner(s, 'dryosaurus', 1, 0);     // 1/2

  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.jugadores[0].trofeos, 1);
  assert.equal(r.jugadores[1].trofeos, 0);
});

test('Se gana al reunir los trofeos del objetivo', () => {
  const s = tablero();
  s.jugadores[0].trofeos = BALANCE.trofeosParaGanar;
  const r = ejecutar(s, FASE.CHEQUEO);
  assert.equal(r.fase, FASE.FIN);
  assert.equal(r.ganador, 0);
  assert.equal(r.motivoFin, MOTIVO_FIN.TROFEOS);
});

test('Se gana al derrumbar el habitat rival', () => {
  const s = tablero();
  s.jugadores[1].habitat = 0;
  const r = ejecutar(s, FASE.CHEQUEO);
  assert.equal(r.ganador, 0);
  assert.equal(r.motivoFin, MOTIVO_FIN.HABITAT);
});

test('Extinción: quedarse sin mazo al robar es perder, y no se rebaraja', () => {
  const s = tablero();
  s.jugadores[0].mazo = [];
  s.jugadores[0].descarte = [1, 2, 3];   // con rebarajado esto le salvaría

  const r = ejecutar(s, FASE.ROBO);

  assert.equal(BALANCE.rebarajarDescarte, false);
  assert.equal(r.fase, FASE.FIN);
  assert.equal(r.motivoFin, MOTIVO_FIN.EXTINCION);
  assert.equal(r.ganador, 1);
});

// ------------------------------------------------------------------ cartas

test('Allosaurus: el daño sobrante al matar pasa al habitat', () => {
  const s = tablero();
  poner(s, 'allosaurus', 0, 0);      // Poder 6
  poner(s, 'dryosaurus', 1, 0);      // 1/2, sobran 6-2 = 4 (+2 de depredación)

  const r = ejecutar(s, FASE.COMBATE);
  assert.ok(r.jugadores[1].habitat < BALANCE.vidaHabitat, 'el exceso llega al habitat');
});

test('Cualquier dinosaurio propio admite una adaptación', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const torvo = poner(s, 'torvosaurus', 0, 0);
  const adap = enMano(s, 'neumaticidad', 0);

  // Torvosaurus tenía el rasgo Escaso, que se lo impedía. Se le quitó a
  // propósito al pasar a Rastreador.
  assert.equal(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: torvo }), null);
});

test('Neumaticidad ósea sólo se da en terópodos y saurópodos', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const stego = poner(s, 'stegosaurus', 0, 0);
  const allo = poner(s, 'allosaurus', 0, 1);
  const adap = enMano(s, 'neumaticidad', 0);

  assert.match(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: stego }), /terópodos y saurópodos/);
  assert.equal(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: allo }), null);
});

test('Fractura consolidada baja el Ataque de un rival, no de un propio', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const propio = poner(s, 'allosaurus', 0, 0);
  const ajeno = poner(s, 'allosaurus', 1, 0);
  const evento = enMano(s, 'fractura', 0);

  assert.match(validar(s, { tipo: ACCION.EVENTO, jugador: 0, iid: evento, objetivo: propio }), /no es del rival/);

  let r = reduce(s, { tipo: ACCION.EVENTO, jugador: 0, iid: evento, objetivo: ajeno });
  r = ejecutar(r, FASE.REVELACION);
  assert.equal(ataqueEfectivo(r, ajeno), carta('allosaurus').ataque - BALANCE.rasgos.fracturaAtaque);
});

test('Las cartas de recurso resuelven al instante: la Biomasa se puede gastar este turno', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 1;
  const herido = poner(s, 'stegosaurus', 0, 0);
  const iid = enMano(s, 'rebrote', 0);

  const r = reduce(s, { tipo: ACCION.RECURSO, jugador: 0, iid });

  assert.equal(r.jugadores[0].biomasa, 1 + BALANCE.recursos.rebroteBiomasa, 'la Biomasa entra ya');
  assert.equal(r.jugadores[0].pendientes.length, 0, 'no espera a la revelación');
  assert.equal(r.instancias[herido].heridas, BALANCE.recursos.rebroteHeridas, 'y cobra su precio');
  assert.ok(r.jugadores[0].descarte.includes(iid));
});

test('Carroña abundante también da Biomasa al rival', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  const iid = enMano(s, 'carrona', 0);

  const r = reduce(s, { tipo: ACCION.RECURSO, jugador: 0, iid });

  assert.equal(r.jugadores[0].biomasa, BALANCE.recursos.carronaBiomasa);
  assert.equal(r.jugadores[1].biomasa, BALANCE.recursos.carronaBiomasaRival);
});

test('Ranuras cruzadas: cada uno pega al hábitat contrario, y con el Ataque a 0 no pega', () => {
  const s = tablero();
  s.turno = BALANCE.turnoPrimerCombate;
  const mio = poner(s, 'dryosaurus', 0, 3);     // nadie enfrente
  poner(s, 'dryosaurus', 1, 0);                 // nadie enfrente
  // Su Ataque no se escribe a mano: Dryosaurus cuenta a los suyos, y a los del
  // rival, así que depende de quién esté puesto. Lo que prueba este test es el
  // CRUCE, no la cifra.
  const pega = ataqueEfectivo(s, mio);
  assert.ok(pega > 0);

  const r = ejecutar(s, FASE.COMBATE);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat - pega);
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - pega, 'el cruce es simétrico');

  // Con el Ataque a 0 avanza y no hace nada.
  s.instancias[mio].modAtaque = -pega;
  assert.equal(ataqueEfectivo(s, mio), 0);
  const r2 = ejecutar(s, FASE.COMBATE);
  assert.equal(r2.jugadores[1].habitat, BALANCE.vidaHabitat, 'sin Ataque no hay daño al hábitat');
  assert.equal(r2.jugadores[0].habitat, BALANCE.vidaHabitat - pega, 'el suyo sí pega');
  const avance = r2.eventos.find((e) => e.tipo === 'AVANCE' && e.bando === 0);
  assert.equal(avance.dano, 0, 'el evento se emite igual, con 0: el registro lo cuenta');
});

// --------------------------------------------------------------- mulligan

test('Cambiar la mano: el primero sale gratis y los siguientes cuestan una carta', () => {
  // avanzar() deja la partida en el despliegue del turno 1, con el robo hecho:
  // es el momento en que el jugador ve su mano por primera vez.
  const s = avanzar(crearPartida(7));
  assert.equal(s.fase, FASE.DESPLIEGUE);
  const inicial = s.jugadores[0].mano.length;

  const uno = reduce(s, { tipo: ACCION.MULLIGAN, jugador: 0 });
  assert.equal(uno.jugadores[0].mano.length, inicial, 'el primero roba las mismas');
  assert.equal(uno.jugadores[0].mulligans, 1);

  const dos = reduce(uno, { tipo: ACCION.MULLIGAN, jugador: 0 });
  assert.equal(dos.jugadores[0].mano.length, inicial - 1, 'el segundo, una menos');
  const tres = reduce(dos, { tipo: ACCION.MULLIGAN, jugador: 0 });
  assert.equal(tres.jugadores[0].mano.length, inicial - 2);
});

test('La mano vuelve al mazo entera: ni se pierden cartas ni se cuelan copias', () => {
  const s = avanzar(crearPartida(11));
  const antes = s.jugadores[0].mano.length + s.jugadores[0].mazo.length;

  const r = reduce(s, { tipo: ACCION.MULLIGAN, jugador: 0 });
  assert.equal(r.jugadores[0].mano.length + r.jugadores[0].mazo.length, antes);
  const iids = new Set([...r.jugadores[0].mano, ...r.jugadores[0].mazo]);
  assert.equal(iids.size, antes, 'sin duplicados');
});

test('La mano sólo se cambia en el turno 1 y antes de comprometer nada', () => {
  const s = avanzar(crearPartida(3));
  s.jugadores[0].biomasa = 9;

  const tarde = structuredClone(s);
  tarde.turno = 2;
  assert.ok(validar(tarde, { tipo: ACCION.MULLIGAN, jugador: 0 }));

  // Con una carta ya comprometida tampoco: el rival ya sabe algo de tu mano.
  const dino = s.jugadores[0].mano.find((iid) => CARTAS[s.instancias[iid].cardId].tipo === 'DINOSAURIO'
    && CARTAS[s.instancias[iid].cardId].coste <= 9);
  if (dino) {
    const puesto = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: dino, ranura: 0 });
    assert.ok(validar(puesto, { tipo: ACCION.MULLIGAN, jugador: 0 }));
  }
});

// ---------------------------------------------------------------- retirar

test('Retirar devuelve la carta a la mano y la Biomasa, y libera la ranura', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 6;
  const iid = enMano(s, 'allosaurus', 0);
  const coste = CARTAS.allosaurus.coste;

  const puesto = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 2 });
  assert.equal(puesto.jugadores[0].biomasa, 6 - coste);
  assert.equal(puesto.jugadores[0].pendientes.length, 1);
  assert.ok(!puesto.jugadores[0].mano.includes(iid));

  const r = reduce(puesto, { tipo: ACCION.RETIRAR, jugador: 0, iid });
  assert.equal(r.jugadores[0].biomasa, 6, 'devuelve la Biomasa entera');
  assert.deepEqual(r.jugadores[0].pendientes, []);
  assert.ok(r.jugadores[0].mano.includes(iid), 'la carta vuelve a la mano');
  assert.equal(validar(r, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 2 }), null,
    'la ranura queda libre otra vez');
});

test('No se retira lo que ya está boca arriba ni lo que no se ha comprometido', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 6;
  const recurso = enMano(s, 'rebrote', 0);
  const enLaMano = enMano(s, 'allosaurus', 0);

  const tras = reduce(s, { tipo: ACCION.RECURSO, jugador: 0, iid: recurso });
  assert.ok(validar(tras, { tipo: ACCION.RETIRAR, jugador: 0, iid: recurso }),
    'un recurso ya jugado no se deshace: el rival lo ha visto');
  assert.ok(validar(s, { tipo: ACCION.RETIRAR, jugador: 0, iid: enLaMano }));
});

test('Retirar un despliegue con un evento encima pide retirar antes el evento', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 12;
  const dino = enMano(s, 'allosaurus', 0);
  const adap = enMano(s, 'gastrolitos', 0);

  let r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: dino, ranura: 0 });
  r = reduce(r, { tipo: ACCION.EVENTO, jugador: 0, iid: adap, objetivo: dino });
  assert.equal(r.jugadores[0].pendientes.length, 2);

  assert.ok(validar(r, { tipo: ACCION.RETIRAR, jugador: 0, iid: dino }),
    'primero el evento, para que no se quede apuntando a una carta en la mano');

  const sinEvento = reduce(r, { tipo: ACCION.RETIRAR, jugador: 0, iid: adap });
  assert.equal(validar(sinEvento, { tipo: ACCION.RETIRAR, jugador: 0, iid: dino }), null);
});

test('Retirar un movimiento no toca la Biomasa: no costó nada', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 4;
  const migrador = Object.values(CARTAS).find((c) => c.rasgo === RASGO.MIGRADOR);
  if (!migrador) return;                          // el set puede no tener migradores
  const iid = poner(s, migrador.id, 0, 0);

  const movido = reduce(s, { tipo: ACCION.MOVER, jugador: 0, iid, ranura: 3 });
  assert.equal(movido.jugadores[0].pendientes.length, 1);
  const r = reduce(movido, { tipo: ACCION.RETIRAR, jugador: 0, iid });
  assert.deepEqual(r.jugadores[0].pendientes, []);
  assert.equal(r.jugadores[0].biomasa, 4);
  assert.ok(!r.jugadores[0].mano.includes(iid), 'sigue en el campo, no vuelve a la mano');
});

test('Sin nadie enfrente, el daño llega al hábitat rival', () => {
  const s = tablero();
  poner(s, 'allosaurus', 0, 0);

  const r = ejecutar(s, FASE.COMBATE);
  assert.ok(r.jugadores[1].habitat < BALANCE.vidaHabitat,
    'una ranura vacía enfrente deja pasar el golpe');
});

// ---------------------------------------------------------------- despliegue

test('No se puede desplegar en una ranura ocupada ni comprometida', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 20;
  poner(s, 'dryosaurus', 0, 0);
  const a = enMano(s, 'dryosaurus', 0);
  const b = enMano(s, 'dryosaurus', 0);

  assert.match(validar(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: a, ranura: 0 }), /ocupada/);

  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: a, ranura: 1 });
  assert.match(validar(r, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: b, ranura: 1 }), /comprometido/);
});

test('El despliegue permanece oculto hasta la revelación', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  const iid = enMano(s, 'allosaurus', 0);

  const r = reduce(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid, ranura: 2 });
  assert.equal(r.ranuras[0][2], null, 'todavía no está en el campo');
  assert.equal(r.jugadores[0].biomasa, 10 - carta('allosaurus').coste, 'pero ya se ha pagado');

  const rev = ejecutar(r, FASE.REVELACION);
  assert.equal(rev.ranuras[0][2], iid);
});

test('Reparto inicial y arranque del turno 1', () => {
  const s = crearPartida(7);
  assert.equal(s.jugadores[0].mano.length, BALANCE.manoInicial);
  assert.equal(s.jugadores[1].mano.length, BALANCE.manoInicial + BALANCE.compensacionSegundoJugador.cartas);
  assert.equal(s.jugadores[0].habitat, BALANCE.vidaHabitat);
  for (const jug of s.jugadores) assert.equal(jug.mazo.length + jug.mano.length, TOTAL_MAZO);

  const tras = avanzar(s);
  assert.equal(tras.fase, FASE.DESPLIEGUE);
  assert.equal(tras.jugadores[0].biomasa, BALANCE.biomasaInicial,
    `turno 1 → ${BALANCE.biomasaInicial} de Biomasa`);
});

// ------------------------------------------------------- lectura de efectos

test('efectosDe dice quién le ha cambiado las cifras a una unidad', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  const victima = poner(s, 'allosaurus', 1, 0);
  const fractura = enMano(s, 'fractura', 0);

  const jugada = reduce(s, { tipo: ACCION.EVENTO, jugador: 0, iid: fractura, objetivo: victima });
  const r = ejecutar(jugada, FASE.REVELACION);

  const efectos = efectosDe(r, victima);
  assert.equal(efectos.length, 1, 'una sola causa');
  assert.equal(efectos[0].fuente, carta('fractura').binomial);
  assert.equal(efectos[0].ataque, -BALANCE.rasgos.fracturaAtaque);
  assert.equal(
    ataqueEfectivo(r, victima),
    carta('allosaurus').ataque - BALANCE.rasgos.fracturaAtaque,
    'lo que dice el efecto y lo que vale la carta tienen que cuadrar',
  );
});

test('efectosDe suma las copias de una misma carta en un solo apunte', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 20;
  const victima = poner(s, 'allosaurus', 1, 0);

  let r = s;
  for (let i = 0; i < 2; i++) {
    const f = enMano(r, 'fractura', 0);
    r = reduce(r, { tipo: ACCION.EVENTO, jugador: 0, iid: f, objetivo: victima });
  }
  r = ejecutar(r, FASE.REVELACION);

  const efectos = efectosDe(r, victima);
  assert.equal(efectos.length, 1, 'dos Fracturas son un renglón, no dos');
  assert.equal(efectos[0].veces, 2);
  assert.equal(efectos[0].ataque, -2 * BALANCE.rasgos.fracturaAtaque);
});

test('Una unidad sin nada encima sólo enseña lo suyo', () => {
  // Ya no hay ninguna carta muda: las cincuenta criaturas tienen habilidad. Lo
  // que este test defiende sigue siendo lo de antes —que `efectosDe` no invente
  // renglones— pero ahora se dice así: el único apunte que puede salir es el de
  // su propio rasgo, y nada pegado encima.
  const s = tablero();
  const iid = poner(s, 'stegosaurus', 0, 0);
  const efectos = efectosDe(s, iid);
  assert.equal(efectos.length, 1);
  assert.equal(efectos[0].fuente, CARTAS.stegosaurus.rasgoNombre);
  assert.deepEqual(adheridasA(s, iid), []);
});

// --------------------------------------------- la ranura de clima es sólo eso

test('Un clima no elige objetivo, y todo lo que sí se juega elige uno', () => {
  for (const c of Object.values(CARTAS)) {
    if (c.tipo === TIPO.CLIMA) {
      assert.equal(c.objetivo, undefined,
        `${c.id}: un clima ocupa su ranura por ser clima, no por su objetivo`);
    } else if (c.tipo !== TIPO.DINOSAURIO) {
      assert.ok(c.objetivo, `${c.id}: un evento o un recurso tiene que decir sobre qué cae`);
    }
  }
});

test('Un clima y un evento caben en el mismo turno', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  const victima = poner(s, 'allosaurus', 1, 0);
  const cl = enMano(s, 'sabana', 0);
  const ev = enMano(s, 'fractura', 0);

  let r = reduce(s, { tipo: ACCION.CLIMA, jugador: 0, iid: cl });
  assert.equal(validar(r, { tipo: ACCION.EVENTO, jugador: 0, iid: ev, objetivo: victima }), null,
    'poner clima no puede impedir jugar un evento');

  r = reduce(r, { tipo: ACCION.EVENTO, jugador: 0, iid: ev, objetivo: victima });
  r = ejecutar(r, FASE.REVELACION);

  assert.equal(r.campo, 'sabana', 'el clima queda puesto');
  assert.equal(ataqueEfectivo(r, victima), carta('allosaurus').ataque - BALANCE.rasgos.fracturaAtaque,
    'y el evento también surtió efecto');
});

test('Dos climas en el mismo turno, no', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 9;
  const uno = enMano(s, 'sabana', 0);
  const dos = enMano(s, 'canal', 0);

  const r = reduce(s, { tipo: ACCION.CLIMA, jugador: 0, iid: uno });
  assert.match(validar(r, { tipo: ACCION.CLIMA, jugador: 0, iid: dos }), /clima/);
});

// ------------------------------------------------------------- la búsqueda

test('Cada buscador saca lo suyo y nada más', () => {
  const s = tablero();
  const deTipo = (jug, cid) => buscablesDe(s, jug, cid)
    .map((iid) => carta(s.instancias[iid].cardId));

  assert.ok(deTipo(0, 'camarasaurus').every((c) => c.tipo === TIPO.EVENTO));
  assert.ok(deTipo(0, 'torvosaurus').every((c) => c.tipo === TIPO.CLIMA));
  assert.ok(deTipo(0, 'nodosaurus').every((c) => c.id === 'gregarismo'));
  assert.deepEqual(buscablesDe(s, 0, 'allosaurus'), [], 'un dinosaurio normal no busca nada');
});

test('Un buscador se puede jugar aunque no haya nada que buscar', () => {
  const s = tablero();
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].biomasa = 10;
  s.jugadores[0].mazo = [];
  const nodo = enMano(s, 'nodosaurus', 0);

  assert.deepEqual(buscablesDe(s, 0, 'nodosaurus'), []);
  assert.equal(validar(s, { tipo: ACCION.DESPLEGAR, jugador: 0, iid: nodo, ranura: 0 }), null);
});

test('Todo clado dice si es de dinosaurio, y las cifras nunca son negativas', () => {
  for (const c of Object.values(CARTAS)) {
    if (c.tipo !== TIPO.DINOSAURIO) continue;
    assert.equal(typeof ES_DINOSAURIO[c.clado], 'boolean', `${c.id}: clado «${c.clado}» sin clasificar`);
    for (const k of ['coste', 'ataque', 'vida']) {
      assert.ok(Number.isInteger(c[k]) && c[k] >= 0, `${c.id}: ${k} debería ser un entero no negativo`);
    }
  }
});
