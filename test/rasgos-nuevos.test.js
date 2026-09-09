// Los cuatro rasgos que llegaron con la fauna de fuera de la Morrison. Son los
// únicos que tocan el motor —vuelo y desgarro cambian la fase de combate—, así
// que son los que hay que sujetar con tests.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FASE, vidaActual, vidaMaxima, ataqueEfectivo, vuela, rentaDe, puedeReciclar,
} from '../src/engine/state.js';
import { legales, reduce, validar, ACCION } from '../src/engine/actions.js';
import { BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';
import { tablero, poner, ejecutar, vivo } from './helpers.js';

test('La Gola necesita a otro Lokiceratops delante', () => {
  const s = tablero(101);
  const nodo = poner(s, 'nodosaurus', 0, 0);
  const loki = poner(s, 'lokiceratops', 0, 1);

  assert.equal(vidaMaxima(s, nodo), CARTAS.nodosaurus.vida,
    'Nodosaurus perdió la Coraza al pasar a buscador');
  assert.equal(vidaMaxima(s, loki), CARTAS.lokiceratops.vida,
    'solo, la gola no vale de nada');

  poner(s, 'lokiceratops', 0, 2);
  assert.equal(vidaMaxima(s, loki), CARTAS.lokiceratops.vida + BALANCE.rasgos.golaVida,
    'con otro de los suyos delante, sí');
});

test('Los rasgos de compañía sólo cuentan a los tuyos', () => {
  const s = tablero(111);
  const mio = poner(s, 'stegosaurus', 0, 0);
  const base = CARTAS.stegosaurus.vida;

  poner(s, 'stegosaurus', 1, 0);
  assert.equal(vidaMaxima(s, mio), base, 'un Stegosaurus del rival no te hace de muro');

  poner(s, 'stegosaurus', 0, 1);
  assert.equal(vidaMaxima(s, mio), base + BALANCE.rasgos.muroDePlacasVida);
});

test('Caza en grupo: con dos Ceratosaurus no basta, con tres sí', () => {
  const s = tablero(112);
  const uno = poner(s, 'ceratosaurus', 0, 0);
  const base = CARTAS.ceratosaurus.ataque;

  assert.equal(ataqueEfectivo(s, uno), base, 'uno solo caza igual que siempre');
  poner(s, 'ceratosaurus', 0, 1);
  assert.equal(ataqueEfectivo(s, uno), base, 'dos tampoco');
  poner(s, 'ceratosaurus', 0, 2);
  assert.equal(ataqueEfectivo(s, uno), base + BALANCE.rasgos.cazaEnGrupoAtaque,
    `hacen falta ${BALANCE.rasgos.cazaEnGrupoMinimo}`);
});

test('Manada: al Apatosaurus le vale cualquier otro saurópodo', () => {
  const s = tablero(113);
  const apato = poner(s, 'apatosaurus', 0, 0);
  const base = CARTAS.apatosaurus.vida + BALANCE.rasgos.manadaVida;

  assert.equal(vidaMaxima(s, apato), CARTAS.apatosaurus.vida, 'solo, no');
  poner(s, 'diplodocus', 0, 1);
  assert.equal(vidaMaxima(s, apato), base, 'con un Diplodocus al lado, sí');
});

test('Los climas nuevos alcanzan a los dos bandos', () => {
  const s = tablero(114);
  const mio = poner(s, 'allosaurus', 0, 0);
  const suyo = poner(s, 'allosaurus', 1, 0);

  // La sabana da Biomasa a los DOS, cada turno, mientras siga en el campo. Fue
  // «+1 al daño contra los biomas» —cuya constante alguien borró, dejando a la
  // IA calculando NaN durante un día— y luego Defensa, que ya no existe.
  const renta = rentaDe(s);
  s.campo = 'sabana';
  assert.equal(rentaDe(s), renta + BALANCE.efectosCampo.sabanaBiomasa,
    'la sabana sube la renta');
  assert.equal(vidaMaxima(s, mio), vidaMaxima(s, suyo),
    'y no toca la Vida de nadie');

  s.campo = 'canal';
  assert.equal(vidaMaxima(s, mio), CARTAS.allosaurus.vida + BALANCE.efectosCampo.canalVida);
  assert.equal(vidaMaxima(s, suyo), CARTAS.allosaurus.vida + BALANCE.efectosCampo.canalVida);
});

test('Lo que vuela golpea el habitat, pero el de tierra le pega igual', () => {
  const s = tablero(102);
  const pterosaurio = poner(s, 'huaxiadraco', 0, 0);
  const bloqueo = poner(s, 'allosaurus', 1, 0);
  const habitatAntes = s.jugadores[1].habitat;

  const r = ejecutar(s, FASE.COMBATE);

  assert.ok(vuela(r, pterosaurio), 'el rasgo debería identificarse como vuelo');
  assert.ok(r.jugadores[1].habitat < habitatAntes,
    'el daño tiene que haber ido al habitat rival');
  assert.ok(r.eventos.some((e) => e.tipo === 'SOBREVUELO'));
  // Volar ya no es ser intocable: sobrevuela la ranura, no al que la ocupa.
  assert.ok(vidaActual(r, pterosaurio) < vidaMaxima(r, pterosaurio) || !vivo(r, pterosaurio),
    'el Allosaurus de debajo tiene que haberle alcanzado');
  assert.ok(vivo(r, bloqueo), 'y el de tierra no recibe nada del que vuela');
});

test('Si el rival vuela, el de tierra tiene la ranura libre delante', () => {
  const s = tablero(103);
  poner(s, 'huaxiadraco', 1, 2);
  poner(s, 'ceratosaurus', 0, 2);
  const habitatAntes = [s.jugadores[0].habitat, s.jugadores[1].habitat];

  const r = ejecutar(s, FASE.COMBATE);

  assert.ok(r.jugadores[0].habitat < habitatAntes[0], 'el pterosaurio golpea tu habitat');
  assert.ok(r.jugadores[1].habitat < habitatAntes[1], 'y el terópodo avanza contra el suyo');
});

test('Desgarro impide la curación del turno a quien hiere', () => {
  const s = tablero(104);
  // El Bosque cura a los saurópodos al final de cada turno: es el escenario en
  // el que se nota que la herida no cierra.
  s.campo = 'bosque';
  // Apatosaurus y no Camarasaurus: con 9 de Poder, el Tyrannotitan mata al
  // segundo de un golpe y un muerto no se cura, que no es lo que se mide.
  const sauropodo = poner(s, 'apatosaurus', 1, 0, { heridas: 3 });

  const sinDesgarro = ejecutar(s, FASE.COMBATE);
  const heridasSinDesgarro = sinDesgarro.instancias[sauropodo].heridas;

  const conDesgarro = structuredClone(s);
  poner(conDesgarro, 'tyrannotitan', 0, 0);
  const r = ejecutar(conDesgarro, FASE.COMBATE);

  assert.ok(heridasSinDesgarro < 3, 'sin desgarro el Bosque debería curarle');
  assert.ok(r.instancias[sauropodo].heridas > heridasSinDesgarro,
    'con desgarro no puede curarse ese turno');
  assert.equal(r.instancias[sauropodo].sinCuracion, false,
    'la marca dura un turno, no se queda pegada');
});

test('Volar no libra de lo que no se esquiva volando', () => {
  const s = tablero(105);
  const pterosaurio = poner(s, 'huaxiadraco', 0, 0);
  s.jugadores[1].pendientes = [];

  // Mortandad estacional golpea a TODO el campo, vuele o no.
  const conMortandad = structuredClone(s);
  const iid = conMortandad.siguienteInstId++;
  conMortandad.instancias[iid] = {
    iid, cardId: 'mortandad', dueno: 1, ranura: null, heridas: 0,
    modAtaque: 0, modVida: 0, adherencias: [], adheridoA: null, desplegadoEnTurno: null,
  };
  conMortandad.jugadores[1].pendientes = [{ tipo: 'PRESION', iid, jugador: 1 }];

  const r = ejecutar(conMortandad, FASE.REVELACION);
  assert.ok(r.instancias[pterosaurio].heridas >= BALANCE.rasgos.mortandadDano
    || !vivo(r, pterosaurio), 'la mortandad debería alcanzarle');
});

test('La Llanura deja CAMBIAR una carta: al fondo va una y entra otra', () => {
  // La sabana pasó a dar Biomasa a los dos y eso era, letra por letra, lo que
  // hacía la llanura. Reciclar es lo único que ningún otro clima hace, y apunta
  // a lo que está flojo: la extinción se quedó cerca del suelo del 15 %.
  const s = tablero(230);
  s.fase = FASE.DESPLIEGUE;
  // `tablero()` deja la mano vacía a propósito; aquí hace falta que haya algo
  // que devolver, así que se roban tres del mazo.
  for (let i = 0; i < 3; i++) s.jugadores[0].mano.push(s.jugadores[0].mazo.shift());

  assert.equal(puedeReciclar(s, 0), false, 'sin llanura no se recicla');
  assert.equal(legales(s, 0).filter((a) => a.tipo === ACCION.RECICLAR).length, 0);

  s.campo = 'llanura';
  const opciones = legales(s, 0).filter((a) => a.tipo === ACCION.RECICLAR);
  assert.equal(opciones.length, s.jugadores[0].mano.length, 'se puede devolver cualquiera de la mano');

  const iid = opciones[0].iid;
  const mazo = s.jugadores[0].mazo.length;
  const mano = s.jugadores[0].mano.length;
  const arriba = s.jugadores[0].mazo[0];
  const post = reduce(s, opciones[0]);

  // Cambio, no pérdida: sale una y entra otra, así que la mano no encoge.
  // Sin el robo, `sim/climas.js` midió cero usos en 300 partidas.
  assert.equal(post.jugadores[0].mano.length, mano, 'la mano no encoge');
  assert.equal(post.jugadores[0].mazo.length, mazo, 'el mazo tampoco');
  assert.ok(!post.jugadores[0].mano.includes(iid), 'la soltada se va');
  assert.ok(post.jugadores[0].mano.includes(arriba), 'y entra la de arriba del mazo');
  assert.equal(post.jugadores[0].mazo[post.jugadores[0].mazo.length - 1], iid,
    'al FONDO: arriba te devolvería la misma que acabas de soltar');
  assert.equal(puedeReciclar(post, 0), false, 'una por turno');
});

test('Reciclar no cuesta Biomasa', () => {
  // Cobrar por devolver una carta al mazo sería lo contrario de lo que hace
  // falta cuando vas corto, que es justo cuando esto sirve.
  const s = tablero(231);
  s.fase = FASE.DESPLIEGUE;
  s.jugadores[0].mano.push(s.jugadores[0].mazo.shift());
  s.campo = 'llanura';
  s.jugadores[0].biomasa = 0;
  const opcion = legales(s, 0).find((a) => a.tipo === ACCION.RECICLAR);
  assert.ok(opcion, 'con 0 de Biomasa se sigue pudiendo');
  assert.equal(validar(s, opcion), null);
  assert.equal(reduce(s, opcion).jugadores[0].biomasa, 0);
});
