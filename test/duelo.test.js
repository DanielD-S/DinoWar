// El Duelo, probado sin servidor: dos jugadores llevados por la heurística
// mandando sus jugadas de una en una al módulo que la Edge Function usa. Si
// esto pasa, dos personas pueden jugar una partida entera por el servidor sin
// ver la mano de la otra; si deja de pasar, alguna de las dos cosas se rompió.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  crearDuelo, aplicarAccion, vistaDuelo, deciden, comprobarTiempo, rendirse,
  resultado, terminado, restante, PartidaInvalida,
} from '../supabase/functions/_compartido/duelo.js';
import { decidir, PERFIL } from '../src/engine/ai.js';
import { ACCION } from '../src/engine/actions.js';
import { FASE } from '../src/engine/state.js';
import { semilla } from '../src/engine/rng.js';
import { MAZO } from '../src/data/balance.js';
import { DUELO, FIN_DUELO } from '../src/data/duelo.js';
import { desdeMiLado } from '../supabase/functions/_compartido/duelo.js';
import { hayPartida } from '../src/ui/emparejado.js';
import { enMazo, enMano, comprometidas } from '../src/ui/ocultas.js';
import {
  LIGAS, ELO, ESCUDO, TEMPORADA, ligaDe, rangoDe, nombreDeRango, eloTras,
  conEscudo, temporadaDe, finDeTemporada, reinicioDe, eloVigente,
} from '../src/data/ligas.js';
import { partesDe } from '../supabase/functions/_compartido/duelo.js';
import { VOCABULARIO } from '../src/data/misiones.js';

const M = MAZO.map(([id, n]) => [id, n]);

/**
 * Juega el duelo entero como lo jugarían dos clientes: cada uno decide sobre
 * SU vista —lo único que recibiría del servidor— y manda una jugada. Devuelve
 * el duelo terminado y cuántas jugadas hicieron falta.
 */
function jugarEntero(seed, { ahora = 1000, paso = 1000 } = {}) {
  const d = crearDuelo(seed, M, M, ahora);
  const rng = [semilla(seed ^ 0x1111), semilla(seed ^ 0x2222)];
  let jugadas = 0;
  let t = ahora;
  let guardia = 0;
  while (!terminado(d) && guardia++ < 5000) {
    const quienes = deciden(d);
    assert.ok(quienes.length > 0, 'nadie decide y el duelo no ha terminado');
    for (const j of quienes) {
      const v = vistaDuelo(d, j, 0, t);
      // La vista viene desde SU lado: para la IA, como para el cliente, él es el 0.
      const dec = decidir(v.estado, 0, rng[j], PERFIL.HEURISTICA);
      rng[j] = dec.rng;
      const accion = dec.accion ?? { tipo: ACCION.PASAR };
      t += paso;
      aplicarAccion(d, j, accion, t);
      jugadas += 1;
      if (terminado(d)) break;
    }
  }
  return { d, jugadas, t };
}

test('Dos jugadores llevan un duelo entero por el servidor hasta el final', () => {
  const { d, jugadas } = jugarEntero(7);
  assert.equal(d.estado.fase, FASE.FIN);
  const r = resultado(d);
  assert.ok(r.ganador === 0 || r.ganador === 1);
  assert.ok(jugadas > 20, `sólo ${jugadas} jugadas: eso no es una partida`);
});

test('La vista de cada uno no lleva la mano ni el mazo del otro, ni el rng', () => {
  const d = crearDuelo(3, M, M, 0);
  for (const j of [0, 1]) {
    // La vista llega siempre desde el lado de quien la pide: él es el 0.
    const v = vistaDuelo(d, j, 0, 0).estado;
    assert.equal(v.jugadores[1].mano.length, 0);
    assert.equal(typeof v.jugadores[1].mazo, 'number');
    assert.ok(v.jugadores[1].manoOculta > 0);
    assert.equal(v.rng, undefined);
    // El propio mazo se ve —hace falta para las búsquedas— pero ordenado, no
    // en orden de robo.
    const mio = v.jugadores[0].mazo;
    assert.deepEqual(mio, [...mio].sort((a, b) => a - b));
    assert.notDeepEqual(mio, d.estado.jugadores[j].mazo, 'el orden real no debe viajar');
  }
});

test('El servidor pone el bando: lo que diga el cliente en `jugador` no cuenta', () => {
  const d = crearDuelo(5, M, M, 0);
  // El jugador 1 intenta pasar POR el 0.
  aplicarAccion(d, 1, { tipo: ACCION.PASAR, jugador: 0 }, 10);
  assert.equal(d.estado.jugadores[1].listo, true);
  assert.equal(d.estado.jugadores[0].listo, false);
});

test('Una jugada ilegal se rechaza y el duelo no cambia', () => {
  const d = crearDuelo(5, M, M, 0);
  const antes = JSON.stringify(d.estado);
  assert.throws(() => aplicarAccion(d, 0, { tipo: ACCION.DESPLEGAR, iid: 999, ranura: 0 }, 10),
    (e) => e instanceof PartidaInvalida);
  assert.throws(() => aplicarAccion(d, 0, { tipo: ACCION.AVANZAR }, 10),
    (e) => e instanceof PartidaInvalida && /avanza el servidor/.test(e.message));
  assert.equal(JSON.stringify(d.estado), antes);
});

test('Quien ya pasó no puede seguir jugando hasta la siguiente fase', () => {
  const d = crearDuelo(5, M, M, 0);
  aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 10);
  assert.throws(() => aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 20),
    (e) => /no te toca/.test(e.message));
  assert.deepEqual(deciden(d), [1]);
});

test('Cuando los dos han pasado, el servidor resuelve y guarda un paso por fase', () => {
  const d = crearDuelo(11, M, M, 0);
  aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 10);
  assert.equal(d.pasos.length, 0, 'con uno solo listo no se resuelve nada');
  aplicarAccion(d, 1, { tipo: ACCION.PASAR }, 20);
  assert.ok(d.pasos.length >= 3, `${d.pasos.length} pasos: revelación, combate y robo como mínimo`);
  assert.equal(d.pasos[0].fase, FASE.REVELACION);
  assert.equal(d.estado.fase, FASE.DESPLIEGUE, 'y se queda esperando al turno siguiente');
  assert.equal(d.estado.turno, 2);
  // El cliente pide «desde n» y recibe sólo lo que no ha visto.
  const todos = vistaDuelo(d, 0, 0, 20).pasos;
  const nada = vistaDuelo(d, 0, d.n, 20).pasos;
  assert.equal(todos.length, d.pasos.length);
  assert.equal(nada.length, 0);
  // Y los pasos también van limpios: sin la mano del otro.
  for (const p of todos) assert.equal(p.estado.jugadores[1].mano.length, 0);
});

test('Los pasos guardados no crecen sin límite', () => {
  const { d } = jugarEntero(21);
  assert.ok(d.pasos.length <= DUELO.pasosGuardados);
});

test('El reloj sólo corre a quien le toca, y cobra al pasar', () => {
  const d = crearDuelo(5, M, M, 0);
  assert.equal(restante(d, 0, 5000), DUELO.relojMs - 5000);
  aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 8000);
  assert.equal(d.tiempos[0], DUELO.relojMs - 8000);
  // Ya no decide: su reloj no sigue bajando.
  assert.equal(restante(d, 0, 20000), DUELO.relojMs - 8000);
  // Al otro sí.
  assert.equal(restante(d, 1, 20000), DUELO.relojMs - 20000);
});

test('Tres minutos sin contestar y el duelo se da por perdido', () => {
  const d = crearDuelo(5, M, M, 0);
  aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 1000);
  assert.equal(comprobarTiempo(d, DUELO.turnoMaxMs), false);
  assert.equal(comprobarTiempo(d, DUELO.turnoMaxMs + 2000), true);
  assert.deepEqual(resultado(d), { ganador: 0, motivo: FIN_DUELO.TIEMPO });
  assert.throws(() => aplicarAccion(d, 1, { tipo: ACCION.PASAR }, 999999), /terminado/);
});

test('Rendirse cierra el duelo a favor del otro', () => {
  const d = crearDuelo(5, M, M, 0);
  rendirse(d, 1);
  assert.deepEqual(resultado(d), { ganador: 0, motivo: FIN_DUELO.ABANDONO });
  assert.equal(vistaDuelo(d, 0, 0, 0).deciden.length, 0);
});

test('Un mazo ilegal no abre duelo', () => {
  assert.throws(() => crearDuelo(1, [['dryosaurus', 55]], M, 0), (e) => e instanceof PartidaInvalida);
});

test('El mismo duelo da la misma partida se guarde y se recargue las veces que sea', () => {
  // Lo que la Edge Function hace en cada petición: leer el JSON, aplicar,
  // volver a escribir. Si el duelo dependiera de algo fuera de sus datos, dos
  // peticiones darían dos partidas.
  const seed = 9;
  const a = jugarEntero(seed).d;
  const d0 = crearDuelo(seed, M, M, 1000);
  const rng = [semilla(seed ^ 0x1111), semilla(seed ^ 0x2222)];
  let d = d0;
  let t = 1000;
  let guardia = 0;
  while (!terminado(d) && guardia++ < 5000) {
    for (const j of deciden(d)) {
      d = JSON.parse(JSON.stringify(d));       // como si volviera de la base
      const dec = decidir(vistaDuelo(d, j, 0, t).estado, 0, rng[j], PERFIL.HEURISTICA);
      rng[j] = dec.rng;
      t += 1000;
      aplicarAccion(d, j, dec.accion ?? { tipo: ACCION.PASAR }, t);
      if (terminado(d)) break;
    }
  }
  assert.deepEqual(resultado(d), resultado(a));
  assert.equal(d.estado.turno, a.estado.turno);
});

test('El jugador 1 recibe el tablero dado la vuelta: él es siempre el 0', () => {
  const d = crearDuelo(13, M, M, 0);
  aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 10);
  aplicarAccion(d, 1, { tipo: ACCION.PASAR }, 20);
  const v0 = vistaDuelo(d, 0, 0, 20);
  const v1 = vistaDuelo(d, 1, 0, 20);
  // Su mano es la mano del bando 1 de verdad, pero en su vista va en el 0.
  assert.deepEqual(v1.estado.jugadores[0].mano, d.estado.jugadores[1].mano);
  assert.equal(v1.estado.jugadores[1].mano.length, 0, 'y la del rival no viaja');
  assert.deepEqual(v1.estado.ranuras[0], d.estado.ranuras[1]);
  assert.equal(v1.estado.perspectiva, 0);
  // Las instancias propias llevan dueno 0 en su vista.
  for (const iid of v1.estado.jugadores[0].mano) assert.equal(v1.estado.instancias[iid].dueno, 0);
  // Los eventos también: un REVELADA del bando 1 real es jugador 0 para él.
  const rev0 = v0.estado.eventos.filter((e) => e.tipo === 'REVELADA');
  const rev1 = v1.estado.eventos.filter((e) => e.tipo === 'REVELADA');
  assert.equal(rev0.length, rev1.length);
  for (let i = 0; i < rev0.length; i++) assert.equal(rev1[i].jugador, 1 - rev0[i].jugador);
  // Y el que decide, dado la vuelta.
  assert.deepEqual(v0.deciden, [0, 1]);
  assert.deepEqual(v1.deciden, [0, 1]);
  // desdeMiLado es involutivo: dos vueltas dejan lo que había.
  const ida = desdeMiLado(v0.estado, 1);
  assert.deepEqual(desdeMiLado(ida, 1), v0.estado);
});

test('Al jugador 1 el resultado y los relojes le llegan desde su lado', () => {
  const d = crearDuelo(5, M, M, 0);
  aplicarAccion(d, 0, { tipo: ACCION.PASAR }, 4000);
  rendirse(d, 0);
  assert.deepEqual(vistaDuelo(d, 1, 0, 4000).fin, { ganador: 0, motivo: FIN_DUELO.ABANDONO });
  assert.deepEqual(vistaDuelo(d, 0, 0, 4000).fin, { ganador: 1, motivo: FIN_DUELO.ABANDONO });
  const t1 = vistaDuelo(d, 1, 0, 4000).tiempos;
  assert.equal(t1[1], DUELO.relojMs - 4000, 'el reloj del 0 real es el del rival para el 1');
});

test('El cliente reconoce la partida en la respuesta tal y como la monta la función', () => {
  // La función responde `{ ...fila, ...vistaDuelo() }`, y las dos traen
  // `estado`: la fila en texto y la vista con el tablero. Mirar
  // `r.estado === 'jugando'` no se cumplía nunca y las dos pantallas se
  // quedaban en «Buscando rival…» con el duelo ya creado en el servidor.
  const fila = { id: 'x', estado: 'jugando', codigo: null, bando: 0, yo: null, rival: null, eloInicial: 1200 };
  const d = crearDuelo(3, M, M, 0);
  for (const j of [0, 1]) {
    const respuesta = { ...fila, bando: j, ...vistaDuelo(d, j, 0, 0) };
    assert.equal(typeof respuesta.estado, 'object', 'la vista pisa el estado de la fila');
    assert.equal(hayPartida(respuesta), true);
  }
  assert.equal(hayPartida({ id: 'x', estado: 'esperando', codigo: 'ABC123' }), false);
  assert.equal(hayPartida({ id: 'x', estado: 'jugando' }), false, 'emparejado pero sin datos aún: se sigue preguntando');
  assert.equal(hayPartida({ id: 'x', estado: 'preparando' }), false);
  assert.equal(hayPartida(null), false);
});

test('Los contadores del rival salen de la vista aunque sus cartas no viajen', () => {
  // En el primer duelo el mazo del rival salió en blanco y su mano en cero: el
  // tablero contaba listas y la vista manda cifras. Se comprueba contra lo que
  // el servidor manda de verdad, en las dos direcciones.
  const d = crearDuelo(17, M, M, 0);
  aplicarAccion(d, 1, { tipo: ACCION.PASAR }, 10);      // el 1 compromete «nada» y pasa
  for (const j of [0, 1]) {
    const v = vistaDuelo(d, j, 0, 10).estado;
    const real = d.estado.jugadores[1 - j];
    assert.equal(enMazo(v.jugadores[1]), real.mazo.length, 'mazo del rival');
    assert.equal(enMano(v.jugadores[1]), real.mano.length, 'mano del rival');
    assert.equal(comprometidas(v.jugadores[1]), real.pendientes.length, 'comprometidas del rival');
    // Y los propios se siguen contando por la lista.
    const mio = d.estado.jugadores[j];
    assert.equal(enMazo(v.jugadores[0]), mio.mazo.length);
    assert.equal(enMano(v.jugadores[0]), mio.mano.length);
  }
  // Contra la IA el estado es entero y las listas mandan.
  assert.equal(enMano({ mano: [1, 2, 3] }), 3);
  assert.equal(enMano({ mano: [], manoOculta: 5 }), 5);
  assert.equal(enMazo({ mazo: 12 }), 12);
});

// ------------------------------------------------------------------- ligas

test('Las ligas cubren todo el ELO y suben con él', () => {
  assert.equal(ligaDe(0).id, 'triasico');
  assert.equal(ligaDe(ELO.inicial).id, 'jurasico');
  assert.equal(ligaDe(1449).id, 'jurasico');
  assert.equal(ligaDe(1450).id, 'cretacico');
  assert.equal(ligaDe(5000).id, 'extincion');
  for (let i = 1; i < LIGAS.length; i++) assert.ok(LIGAS[i].desde > LIGAS[i - 1].desde);
});

test('División y puntos: de III a I, y de 0 a 100', () => {
  const r0 = rangoDe(1150);
  assert.equal(r0.division, 3);
  assert.equal(r0.puntos, 0);
  assert.equal(nombreDeRango(1150), 'Jurásico III');
  const r1 = rangoDe(1449);
  assert.equal(r1.division, 1);
  assert.ok(r1.puntos >= 99);
  assert.equal(nombreDeRango(1800), 'Extinción');
  // Nunca se sale del tramo: ni negativo ni por encima de 100.
  for (let elo = 0; elo < 2500; elo += 7) {
    const r = rangoDe(elo);
    assert.ok(r.puntos >= 0 && (r.liga.id === 'extincion' || r.puntos <= 100), `${elo}`);
  }
});

test('El ELO se mueve como debe: gana el favorito y casi no cambia; gana el otro y cambia mucho', () => {
  const poco = eloTras(1400, 1000, 1);
  assert.ok(poco.a - 1400 < 5, 'el favorito gana poco');
  const mucho = eloTras(1400, 1000, 0);
  assert.ok(1400 - mucho.a > 25, 'perder contra el débil cuesta');
  assert.ok(mucho.b - 1000 > 25);
  // Suma cero entre iguales con el mismo K.
  const par = eloTras(1200, 1200, 1);
  assert.equal(par.a - 1200, 1200 - par.b);
  // El novato se mueve el doble.
  const novato = eloTras(1200, 1200, 1, 0, 99);
  assert.equal(novato.a - 1200, 2 * (par.a - 1200));
  // Y nadie baja del suelo.
  assert.equal(eloTras(ELO.suelo, 2000, 0).a, ELO.suelo);
});

// ------------------------------------------------- escudo y temporadas

test('El escudo: tres derrotas de margen en el umbral de la liga, y se rellena al subir', () => {
  const umbral = LIGAS[1].desde; // Jurásico
  // Perder en el umbral con escudo: te quedas en el umbral y gastas una.
  let r = conEscudo(umbral + 5, umbral - 20, ESCUDO.derrotas);
  assert.equal(r.elo, umbral);
  assert.equal(r.escudo, ESCUDO.derrotas - 1);
  // Sin escudo, se baja de verdad.
  r = conEscudo(umbral + 5, umbral - 20, 0);
  assert.equal(r.elo, umbral - 20);
  assert.equal(r.escudo, 0);
  // Perder DENTRO de la liga no gasta escudo: sólo protege el umbral de liga.
  r = conEscudo(umbral + 200, umbral + 170, 1);
  assert.equal(r.elo, umbral + 170);
  assert.equal(r.escudo, 1);
  // Subir de liga lo rellena.
  r = conEscudo(LIGAS[2].desde - 5, LIGAS[2].desde + 10, 0);
  assert.equal(r.elo, LIGAS[2].desde + 10);
  assert.equal(r.escudo, ESCUDO.derrotas);
  // Un escudo que no viene —cuenta de antes de la 0032— cuenta como entero.
  assert.equal(conEscudo(umbral + 5, umbral - 20, null).elo, umbral);
});

test('Las temporadas duran lo que dicen, empiezan en lunes y el ELO se reinicia a medio camino', () => {
  assert.equal(new Date(`${TEMPORADA.inicio}T00:00:00Z`).getUTCDay(), 1, 'la primera empieza en lunes');
  assert.equal(temporadaDe(TEMPORADA.inicio), 0);
  assert.equal(temporadaDe('2026-01-01'), 0, 'antes del inicio es la primera, no una negativa');
  const fin = finDeTemporada(TEMPORADA.inicio);
  assert.equal(temporadaDe(fin), 1);
  assert.equal((Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${TEMPORADA.inicio}T00:00:00Z`)) / 86400000, TEMPORADA.dias);
  // El reinicio: a medio camino del inicial, y nunca bajo el suelo.
  assert.equal(reinicioDe(1800), 1500);
  assert.equal(reinicioDe(1000), 1100);
  assert.equal(reinicioDe(ELO.suelo), Math.max(ELO.suelo, reinicioDe(ELO.suelo)));
  // Vigente: el guardado si es de esta temporada; el reiniciado si es de una anterior.
  assert.equal(eloVigente(1800, 1, fin), 1800);
  assert.equal(eloVigente(1800, 0, fin), 1500);
  assert.equal(eloVigente(1800, null, fin), 1800, 'sin temporada guardada no se reinicia nada');
  // Una sola vez aunque hayan pasado tres temporadas.
  const lejos = finDeTemporada(finDeTemporada(fin));
  assert.equal(eloVigente(1800, 0, lejos), 1500);
});

test('Un duelo deja el parte de cada bando: bajas, clados y clima, además de jugar y ganar', () => {
  const { d } = jugarEntero(11);
  const [pa, pb] = partesDe(d);
  for (const p of [pa, pb]) for (const clave of VOCABULARIO) assert.ok(clave in p, clave);
  assert.equal(pa.partidas + pb.partidas, 2);
  assert.equal(pa.victorias + pb.victorias, 1);
  assert.equal(pa.duelos, 1);
  assert.equal(pa.duelosGanados + pb.duelosGanados, 1);
  // Una partida entera despliega criaturas de los dos lados y alguien se lleva bajas.
  assert.ok(pa.desplegados > 0 && pb.desplegados > 0, 'nadie desplegó nada');
  assert.ok(pa.bajas + pb.bajas > 0, 'nadie derribó nada en una partida entera');
  const clados = Object.keys(pa).filter((k) => k.startsWith('clado:')).reduce((n, k) => n + pa[k], 0);
  assert.equal(clados, pa.desplegados, 'cada criatura desplegada es de un clado');
  // Lo que anota el duelo no toca el estado del motor.
  assert.ok(!('partes' in d.estado));
});

test('Un duelo cerrado por rendición deja el parte igual, con la victoria para el otro', () => {
  const d = crearDuelo(5, M, M, 1000);
  rendirse(d, 0);
  const [pa, pb] = partesDe(d);
  assert.equal(pa.victorias, 0);
  assert.equal(pb.victorias, 1);
  assert.equal(pb.duelosGanados, 1);
  assert.equal(pa.partidas, 1);
});
