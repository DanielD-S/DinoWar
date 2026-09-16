// Las cartas de soporte —climas, eventos, recursos— son las únicas que llevan
// mecánica. Las 52 criaturas son coste, Ataque y Vida y nada más.
//
// Aquí vivían los tests de Gola, Muro de placas, Caza en grupo, Manada, Vuelo y
// Desgarro. Se fueron con sus rasgos. El motor sigue sabiendo hacer esas cosas
// —el vocabulario está— pero ninguna carta las pide, así que no hay escenario
// que montar.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FASE, vidaActual, vidaMaxima, ataqueEfectivo, vuela, rentaDe, puedeReciclar,
} from '../src/engine/state.js';
import { legales, reduce, validar, ACCION } from '../src/engine/actions.js';
import { BALANCE } from '../src/data/balance.js';
import { CARTAS, carta } from '../src/data/cards.js';
import { tablero, poner, enMano, ejecutar, vivo } from './helpers.js';
import { vidaActual as vidaAhora } from '../src/engine/state.js';

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

// ------------------------------------------------- la ronda del control

/** Juega un evento sin objetivo y resuelve la revelación. */
function soltar(s, cardId, jugador = 0) {
  const iid = enMano(s, cardId, jugador);
  s.jugadores[jugador].biomasa = 9;
  s.fase = FASE.DESPLIEGUE;
  return ejecutar(reduce(s, { tipo: ACCION.EVENTO, jugador, iid }), FASE.REVELACION);
}

test('La Tormenta de polvo reparte la MISMA mano a los dos, y por el mazo', () => {
  // No es la Deriva árida: aquélla te devuelve tantas como tenías —el que la
  // tenía peor sale ganando— y ésta reparte un número fijo, así que castiga a
  // quien iba acumulando y rescata a quien se quedó seco. Y pasa por el MAZO:
  // lo que sueltas vuelve a estar disponible, no se pierde.
  const s = tablero();
  for (let k = 0; k < 7; k++) enMano(s, 'troodon', 0);
  for (let k = 0; k < 2; k++) enMano(s, 'troodon', 1);
  const r = soltar(s, 'tormenta_polvo');

  const n = BALANCE.rasgos.tormentaPolvoRoba;
  assert.equal(r.jugadores[0].mano.length, n, 'el que la juega se queda con las suyas');
  assert.equal(r.jugadores[1].mano.length, n, 'y el rival con las mismas');
  // Al rival no le va NADA al descarte; al que la juega, sólo la propia carta,
  // que se gasta al resolverse como cualquier evento.
  assert.equal(r.jugadores[1].descarte.length, 0);
  assert.deepEqual(r.jugadores[0].descarte.map((iid) => r.instancias[iid].cardId),
    ['tormenta_polvo']);
});

test('La Avenida de lodo recorta la mano rival al tope, y sólo la suya', () => {
  const s = tablero();
  for (let k = 0; k < 6; k++) enMano(s, 'troodon', 1);
  for (let k = 0; k < 6; k++) enMano(s, 'troodon', 0);
  const r = soltar(s, 'avenida_lodo');

  const tope = BALANCE.rasgos.avenidaLodoTope;
  assert.equal(r.jugadores[1].mano.length, tope);
  assert.equal(r.jugadores[1].descarte.length, 6 - tope);
  // La mano propia queda como estaba menos la carta jugada.
  assert.equal(r.jugadores[0].mano.length, 6);

  // Con la mano ya corta no le quita ninguna, y tampoco le da.
  const t = tablero();
  enMano(t, 'troodon', 1);
  const u = soltar(t, 'avenida_lodo');
  assert.equal(u.jugadores[1].mano.length, 1);
  assert.equal(u.jugadores[1].descarte.length, 0);
});

test('El Enterramiento saca del descarte, y no inventa cartas si está vacío', () => {
  const s = tablero();
  s.jugadores[0].descarte.push(...s.jugadores[0].mazo.splice(0, 5));
  const r = soltar(s, 'enterramiento');
  const n = BALANCE.rasgos.enterramientoRescata;
  // Las 5 menos las rescatadas, más la propia carta: se gasta DESPUÉS de
  // rescatar, así que no puede rescatarse a sí misma.
  assert.equal(r.jugadores[0].descarte.length, 5 - n + 1);
  assert.equal(r.jugadores[0].mano.length, n);
  assert.ok(!r.jugadores[0].mano.some((iid) => r.instancias[iid].cardId === 'enterramiento'));

  const t = tablero();
  const u = soltar(t, 'enterramiento');
  assert.equal(u.jugadores[0].mano.length, 0);
  const e = u.eventos.find((x) => x.tipo === 'RESCATE');
  assert.equal(e.cartas, 0, 'deja constancia de que no sacó nada');
});

test('El Cauce suelta ANTES de robar, que si no se descartaría lo robado', () => {
  const s = tablero();
  for (let k = 0; k < 4; k++) enMano(s, 'troodon', 0);
  const r = soltar(s, 'cauce_abandonado');
  const { cauceDescarta, cauceRoba } = BALANCE.rasgos;
  assert.equal(r.jugadores[0].descarte.length, cauceDescarta + 1, 'y la propia carta gastada');
  assert.equal(r.jugadores[0].mano.length, 4 - cauceDescarta + cauceRoba);
  // Lo soltado salió de las que YA tenía —todas eran troodon— y no de lo
  // robado: si se robara primero, la carta haría otra cosa que la que dice.
  const soltadas = r.jugadores[0].descarte
    .map((iid) => r.instancias[iid].cardId).filter((id) => id !== 'cauce_abandonado');
  assert.deepEqual(soltadas, ['troodon', 'troodon']);
});

test('La Barrera de troncos dobla sólo si el rival va con más mano que tú', () => {
  const n = BALANCE.rasgos.barreraMazo;

  // Él con cuatro, tú con una (la carta jugada no cuenta: ya no está en la mano).
  const s = tablero();
  for (let k = 0; k < 4; k++) enMano(s, 'troodon', 1);
  enMano(s, 'troodon', 0);
  const antes = s.jugadores[1].mazo.length;
  const r = soltar(s, 'barrera_troncos');
  assert.equal(r.jugadores[1].mazo.length, antes - n * 2);
  assert.ok(r.eventos.find((x) => x.tipo === 'PRESION' && x.doble === true));

  // Empatados a mano: no dobla. «Más que tú» es más, no otro tanto.
  const t = tablero();
  for (let k = 0; k < 3; k++) enMano(t, 'troodon', 1);
  for (let k = 0; k < 3; k++) enMano(t, 'troodon', 0);
  const antesT = t.jugadores[1].mazo.length;
  const u = soltar(t, 'barrera_troncos');
  assert.equal(u.jugadores[1].mazo.length, antesT - n);
  assert.ok(u.eventos.find((x) => x.tipo === 'PRESION' && x.doble === false));
});

// --------------------------------------------------- la ronda del REBOTE

test('La Estampida barre a los pequeños de LOS DOS bandos, y sólo a ésos', () => {
  const tope = BALANCE.rasgos.estampidaAtaqueMax;
  const s = tablero();
  const chicoMio = poner(s, 'troodon', 0, 0);         // 1 de Ataque
  const grandeMio = poner(s, 'allosaurus', 0, 1);     // 5
  const chicoSuyo = poner(s, 'platyceratops', 1, 0);  // 1
  const grandeSuyo = poner(s, 'carnotaurus', 1, 1);   // 7
  assert.ok(carta('troodon').ataque <= tope && carta('allosaurus').ataque > tope);

  const r = soltar(s, 'estampida');
  assert.equal(r.instancias[chicoMio].ranura, null, 'de los tuyos tampoco te libras');
  assert.equal(r.instancias[chicoSuyo].ranura, null);
  assert.notEqual(r.instancias[grandeMio].ranura, null);
  assert.notEqual(r.instancias[grandeSuyo].ranura, null);
  assert.ok(r.jugadores[0].mano.includes(chicoMio));
  assert.ok(r.jugadores[1].mano.includes(chicoSuyo), 'cada uno vuelve a SU mano');
});

test('La Crecida se lleva al del rival que más pega bajo el listón, y a ninguno tuyo', () => {
  const tope = BALANCE.rasgos.crecidaAtaqueMax;
  const s = tablero();
  const mio = poner(s, 'troodon', 0, 0);
  const enorme = poner(s, 'tyrannotitan', 1, 0);      // 10: no cabe
  const medio = poner(s, 'allosaurus', 1, 1);         // 5: cabe y es el que más pega
  const chico = poner(s, 'troodon', 1, 2);            // 1
  assert.ok(carta('allosaurus').ataque <= tope && carta('tyrannotitan').ataque > tope);

  const r = soltar(s, 'crecida_delta');
  assert.equal(r.instancias[medio].ranura, null);
  assert.notEqual(r.instancias[enorme].ranura, null, 'el de 10 no cabe bajo el listón');
  assert.notEqual(r.instancias[chico].ranura, null, 'y sólo se lleva a uno');
  assert.notEqual(r.instancias[mio].ranura, null, 'los tuyos no se tocan');
});

test('La Migración recoge al tuyo más herido y roba', () => {
  const s = tablero();
  const sano = poner(s, 'apatosaurus', 0, 0);
  const herido = poner(s, 'diplodocus', 0, 1, { heridas: 6 });
  assert.ok(vidaAhora(s, herido) < vidaAhora(s, sano));

  const r = soltar(s, 'migracion');
  assert.equal(r.instancias[herido].ranura, null);
  assert.notEqual(r.instancias[sano].ranura, null);
  // Vuelve entero: eso es lo que hace de la carta un rescate y no un descarte.
  assert.equal(r.instancias[herido].heridas, 0);
  assert.equal(r.jugadores[0].mano.length, 1 + BALANCE.rasgos.migracionRoba);
});

test('El Osario y los Carroñeros devuelven al MAZO, que es lo contrario de moler', () => {
  const s = tablero();
  s.jugadores[0].descarte.push(...s.jugadores[0].mazo.splice(0, 6));
  const mazo = s.jugadores[0].mazo.length;
  const r = soltar(s, 'osario');
  const n = BALANCE.rasgos.osarioEntierra;
  // El mazo crece n, y el descarte pierde n pero gana la propia carta gastada.
  assert.equal(r.jugadores[0].mazo.length, mazo + n);
  assert.equal(r.jugadores[0].descarte.length, 6 - n + 1);
  assert.equal(r.jugadores[0].mano.length, 0, 'al mazo, no a la mano');

  const t = tablero();
  t.jugadores[0].descarte.push(...t.jugadores[0].mazo.splice(0, 2));
  const mazoT = t.jugadores[0].mazo.length;
  const u = soltar(t, 'carroneros');
  const { carronerosEntierra: e, carronerosRoba: rb } = BALANCE.rasgos;
  // Entierra y luego roba, así que el mazo queda en +entierra −roba.
  assert.equal(u.jugadores[0].mazo.length, mazoT + e - rb);
  assert.equal(u.jugadores[0].mano.length, rb);
});

test('La Oleada pega al hábitat rival sin pasar por el combate', () => {
  const s = tablero();
  const suyo = poner(s, 'apatosaurus', 1, 0);
  const antes = s.jugadores[1].habitat;
  const r = soltar(s, 'oleada');
  assert.equal(r.jugadores[1].habitat, antes - BALANCE.rasgos.oleadaHabitat);
  assert.equal(r.jugadores[0].habitat, antes, 'el tuyo no se toca');
  assert.equal(r.instancias[suyo].heridas, 0, 'y el que defiende, tampoco');
});

test('La Ceniza y el Sedimento muerden el mazo rival, y sólo el rival', () => {
  const s = tablero();
  const suyo = s.jugadores[1].mazo.length;
  const mio = s.jugadores[0].mazo.length;
  const r = soltar(s, 'ceniza');
  assert.equal(r.jugadores[1].mazo.length, suyo - BALANCE.rasgos.cenizaMazo);
  assert.equal(r.jugadores[0].mazo.length, mio, 'a ti no te cuesta mazo');

  const t = tablero();
  for (let k = 0; k < 4; k++) enMano(t, 'troodon', 1);
  const suyoT = t.jugadores[1].mazo.length;
  const u = soltar(t, 'sedimento');
  const { sedimentoMazo, sedimentoMano } = BALANCE.rasgos;
  assert.equal(u.jugadores[1].mazo.length, suyoT - sedimentoMazo);
  assert.equal(u.jugadores[1].mano.length, 4 - sedimentoMano);
});

// -------------------------------------------------- la ronda del HÁBITAT

test('El Incendio pega al hábitat rival y a nadie más', () => {
  const s = tablero();
  const suyo = poner(s, 'apatosaurus', 1, 0);
  const antes = s.jugadores[1].habitat;
  const r = soltar(s, 'incendio');
  assert.equal(r.jugadores[1].habitat, antes - BALANCE.rasgos.incendioHabitat);
  assert.equal(r.jugadores[0].habitat, antes, 'el tuyo no se toca');
  assert.equal(r.instancias[suyo].heridas, 0, 'y no pasa por el combate');
});

test('El Acuífero escala con TU campo, no con el suyo, y tiene tope', () => {
  const { acuiferoPorDino: por, acuiferoTope: tope } = BALANCE.rasgos;

  // Con el campo vacío no hace nada: es el premio por haber ganado la mesa.
  const vacio = tablero();
  assert.equal(soltar(vacio, 'acuifero').jugadores[1].habitat, BALANCE.vidaHabitat);

  // Dos tuyos: dos tramos.
  const s = tablero();
  poner(s, 'troodon', 0, 0);
  poner(s, 'troodon', 0, 1);
  poner(s, 'allosaurus', 1, 0);   // los suyos no cuentan
  poner(s, 'allosaurus', 1, 1);
  assert.equal(soltar(s, 'acuifero').jugadores[1].habitat, BALANCE.vidaHabitat - 2 * por);

  // Y el campo lleno corta en el tope: sin él, cuatro carriles son ocho de
  // hábitat gratis y la carta deja de ser una carta.
  const lleno = tablero();
  for (let k = 0; k < 4; k++) poner(lleno, 'troodon', 0, k);
  const r = soltar(lleno, 'acuifero');
  assert.equal(r.jugadores[1].habitat, BALANCE.vidaHabitat - tope);
  assert.ok(4 * por > tope, 'si el tope no mordiera, este test no probaría nada');
});

test('La guardia de los blindados resta a CADA golpe, no al total', () => {
  // Es lo que separa la defensa de verdad de curar al entrar: contra cuatro
  // golpes por turno, restar 2 a cada uno son 8, y curar 4 son 4 y una vez.
  const s = tablero();
  const muro = poner(s, 'borealopelta', 0, 0);
  assert.equal(CARTAS.borealopelta.mecanica.guardia.habitat, 2);
  assert.equal(CARTAS.zuul.mecanica.guardia.habitat, 1);
  assert.notEqual(muro, null);

  // Y curar SÍ sube el hábitat, pero no por encima del tope.
  const t = tablero();
  t.jugadores[0].habitat -= 6;
  const iid = t.siguienteInstId;
  const enLaMano = enMano(t, 'sauropelta', 0);
  t.jugadores[0].pendientes.push({ tipo: 'DESPLIEGUE', iid: enLaMano, ranura: 0 });
  t.jugadores[0].mano = t.jugadores[0].mano.filter((x) => x !== enLaMano);
  const r = ejecutar(t, FASE.REVELACION);
  assert.equal(r.jugadores[0].habitat, BALANCE.vidaHabitat - 2, 'recupera 4 de los 6');
  assert.ok(iid <= enLaMano);
});
