// DinoWar — el Duelo entre dos personas, llevado por el servidor.
//
// Es la misma máquina que valida las partidas en solitario, con una diferencia
// que lo cambia todo: aquí el servidor no RE-JUEGA una partida terminada, la
// LLEVA mientras se juega. Es el único que ve las dos manos. Cada jugador le
// manda sus jugadas de una en una y recibe su vista —la que ya calcula
// `vistaDe()`, sin la mano ni el mazo del otro—, y cuando los dos han pulsado
// Listo, el servidor resuelve las fases automáticas y guarda un PASO por cada
// una, con el estado de después, para que los dos clientes animen lo mismo
// que animan hoy contra la IA: la revelación, el combate, el robo.
//
// No hay tiempo real. El despliegue es simultáneo y a ciegas, así que el
// único momento que hay que sincronizar es «los dos han pulsado Listo», y para
// eso basta con que cada cliente pregunte cada dos segundos. Sin websockets,
// sin librería, sin nada que se caiga al cambiar de red en el móvil.
//
// Puro y sin plataforma: corre en Node (los tests) y en Deno (la función). La
// hora entra siempre por parámetro, que un `Date.now()` aquí dentro haría que
// los tests dependieran del reloj de la máquina.

import { crearPartida, vistaDe, FASE, FASES_INTERACTIVAS } from '../../../src/engine/state.js';
import { reduce, ACCION, validar, avanzar } from '../../../src/engine/actions.js';
import { BALANCE } from '../../../src/data/balance.js';
import { DUELO, FIN_DUELO } from '../../../src/data/duelo.js';
import { validarMazoLegal, PartidaInvalida } from './validarPartida.js';

export { PartidaInvalida };

/** Lo que el servidor guarda de un duelo en marcha. */
export function crearDuelo(semilla, mazoA, mazoB, ahora) {
  if (!Number.isInteger(semilla)) throw new PartidaInvalida('semilla inválida');
  validarMazoLegal(mazoA);
  validarMazoLegal(mazoB);
  const estado = crearPartida(semilla, [mazoA, mazoB]);
  const d = {
    semilla,
    estado,
    // Lo que le queda a cada uno, y desde cuándo está decidiendo (null si no
    // le toca). El reloj sólo corre mientras te toca a ti, como en el ajedrez.
    tiempos: [DUELO.relojMs, DUELO.relojMs],
    desde: [null, null],
    // Los pasos de fases automáticas, numerados: el cliente pide «desde n».
    pasos: [],
    n: 0,
    fin: null,     // { ganador, motivo } cuando lo decide el reloj o una rendición
  };
  // La partida nace en la renta del turno 1: hasta el primer despliegue no
  // hay nada que decidir. Esos pasos no se guardan, que no hay nada que animar.
  resolverAutomaticas(d);
  d.pasos = [];
  d.n = 0;
  abrirDecision(d, ahora);
  return d;
}

/** A quién le toca decidir en la fase actual. */
export function deciden(d) {
  const s = d.estado;
  if (s.fase === FASE.DESPLIEGUE) return [0, 1].filter((j) => !s.jugadores[j].listo);
  if (s.fase === FASE.DESCARTE) {
    return [0, 1].filter((j) => s.jugadores[j].mano.length > BALANCE.manoMaxima);
  }
  return [];
}

function abrirDecision(d, ahora) {
  const quienes = deciden(d);
  for (const j of [0, 1]) d.desde[j] = quienes.includes(j) ? ahora : null;
}

/** Cierra la decisión de `j`: le cobra el tiempo y deja de correrle el reloj. */
function cerrarDecision(d, j, ahora) {
  if (d.desde[j] === null) return;
  d.tiempos[j] -= Math.max(0, ahora - d.desde[j]);
  d.desde[j] = null;
}

/** Tiempo que le queda a `j` ahora mismo. */
export function restante(d, j, ahora) {
  const corriendo = d.desde[j] === null ? 0 : Math.max(0, ahora - d.desde[j]);
  return Math.max(0, d.tiempos[j] - corriendo);
}

export const terminado = (d) => d.estado.fase === FASE.FIN || d.fin !== null;

/**
 * ¿Se le ha acabado el tiempo a alguien? Se mira en cada lectura y en cada
 * jugada, así que no hace falta ningún proceso que vigile relojes: el primero
 * que pregunte después del plazo se encuentra el duelo cerrado.
 */
export function comprobarTiempo(d, ahora) {
  if (terminado(d)) return false;
  for (const j of deciden(d)) {
    const lleva = d.desde[j] === null ? 0 : ahora - d.desde[j];
    if (restante(d, j, ahora) <= 0 || lleva > DUELO.turnoMaxMs) {
      cerrar(d, 1 - j, FIN_DUELO.TIEMPO);
      return true;
    }
  }
  return false;
}

/** Se rinde `j`. */
export function rendirse(d, j) {
  if (terminado(d)) return;
  cerrar(d, 1 - j, FIN_DUELO.ABANDONO);
}

function cerrar(d, ganador, motivo) {
  d.fin = { ganador, motivo };
  d.desde = [null, null];
}

/** Quién ganó y por qué, decida lo que decida el motor o el reloj. */
export function resultado(d) {
  if (d.fin) return { ganador: d.fin.ganador, motivo: d.fin.motivo };
  if (d.estado.fase === FASE.FIN) return { ganador: d.estado.ganador, motivo: d.estado.motivoFin };
  return null;
}

/**
 * Una jugada de `j`. Se valida con el mismo `validar()` del motor, así que no
 * hay forma de colar una ilegal, y el bando lo pone el servidor: lo que diga
 * el cliente en `accion.jugador` no se lee.
 *
 * Si con ella los dos quedan servidos, el servidor resuelve las fases
 * automáticas hasta la siguiente interactiva —o el final— y guarda un paso
 * por cada una. Muta `d`; quien llama guarda.
 */
export function aplicarAccion(d, j, accion, ahora) {
  if (terminado(d)) throw new PartidaInvalida('el duelo ha terminado');
  if (!accion || typeof accion !== 'object') throw new PartidaInvalida('jugada vacía');
  if (accion.tipo === ACCION.AVANZAR) throw new PartidaInvalida('las fases las avanza el servidor');
  if (!deciden(d).includes(j)) throw new PartidaInvalida('no te toca');

  const a = { ...accion, jugador: j };
  const motivo = validar(d.estado, a);
  if (motivo) throw new PartidaInvalida('jugada ilegal', { accion: a.tipo, motivo });
  d.estado = reduce(d.estado, a);

  if (!deciden(d).includes(j)) cerrarDecision(d, j, ahora);

  if (!FASES_INTERACTIVAS.includes(d.estado.fase) && d.estado.fase !== FASE.FIN) {
    resolverAutomaticas(d);
    abrirDecision(d, ahora);
  }
  return d;
}

/**
 * Las fases que no piden a nadie, una a una, guardando el estado tras cada
 * una. El cliente anima con «antes» y «después», como hace su propio bucle
 * contra la IA; sin los pasos sólo podría pintar el resultado de golpe.
 */
function resolverAutomaticas(d) {
  let guardia = 0;
  while (!FASES_INTERACTIVAS.includes(d.estado.fase) && d.estado.fase !== FASE.FIN) {
    const fase = d.estado.fase;
    const desde = d.estado.eventos.length;
    d.estado = reduce(d.estado, { tipo: ACCION.AVANZAR });
    d.n += 1;
    // `eventosDesde` es cuántos eventos había antes de esta fase: el cliente
    // anima `estado.eventos.slice(eventosDesde)`. El chequeo vacía la lista al
    // pasar de turno, y por eso se guarda el número y no los eventos.
    d.pasos.push({ n: d.n, fase, eventosDesde: desde, estado: structuredClone(d.estado) });
    if (++guardia > 64) throw new PartidaInvalida('las fases no convergen');
  }
  while (d.pasos.length > DUELO.pasosGuardados) d.pasos.shift();
}

/**
 * Lo que ve `j`: su vista del estado, los pasos que aún no ha visto, los
 * relojes y a quién le toca. El mazo propio va ORDENADO por iid y no en su
 * orden real: se ve qué cartas quedan —hace falta para las búsquedas— pero no
 * cuál viene ahora, que con la IA daba igual y con una persona enfrente no.
 * El rng tampoco viaja: con él se predice el barajado.
 */
export function vistaDuelo(d, j, desde = 0, ahora = 0) {
  const limpiar = (estado) => {
    const v = vistaDe(estado, j);
    v.jugadores[j].mazo = [...v.jugadores[j].mazo].sort((x, y) => x - y);
    delete v.rng;
    return desdeMiLado(v, j);
  };
  const r = resultado(d);
  const mio = (b) => (b === null || b === undefined ? b : (j === 0 ? b : 1 - b));
  return {
    n: d.n,
    estado: limpiar(d.estado),
    pasos: d.pasos.filter((p) => p.n > desde).map((p) => ({
      n: p.n, fase: p.fase, eventosDesde: p.eventosDesde, estado: limpiar(p.estado),
    })),
    deciden: terminado(d) ? [] : deciden(d).map(mio).sort(),
    tiempos: j === 0
      ? [restante(d, 0, ahora), restante(d, 1, ahora)]
      : [restante(d, 1, ahora), restante(d, 0, ahora)],
    fin: r ? { ganador: mio(r.ganador), motivo: r.motivo } : null,
  };
}

/** Claves que llevan un bando. Las de CHOQUE van aparte: son iids con lado. */
const CLAVES_DE_BANDO = new Set(['jugador', 'dueno', 'bando', 'porBando', 'ganador', 'campoDe', 'perspectiva']);

/**
 * La vista con los bandos DADOS LA VUELTA, para que quien la recibe sea
 * siempre el jugador 0. El cliente da por hecho que él es el 0 —el tablero, el
 * guión y el animador lo llevan escrito— y en un duelo la mitad de las veces
 * eres el 1. Antes que enseñar al cliente a mirar desde el otro lado, se le da
 * la vuelta al estado aquí, que es un recorrido y se prueba solo: el servidor
 * sigue sabiendo quién es quién, y al recibir una jugada pone el bando él.
 */
export function desdeMiLado(v, j) {
  if (j === 0) return v;
  const flip = (b) => (b === 0 ? 1 : b === 1 ? 0 : b);
  const andar = (x, clave = null) => {
    if (Array.isArray(x)) return x.map((e) => andar(e));
    if (x && typeof x === 'object') {
      const o = {};
      for (const [k, val] of Object.entries(x)) {
        if (CLAVES_DE_BANDO.has(k) && (val === 0 || val === 1)) o[k] = flip(val);
        else o[k] = andar(val, k);
      }
      // El choque de una ranura lleva los dos iids con su lado y el daño de
      // cada uno: al darle la vuelta al tablero, a es b.
      if (o.tipo === 'CHOQUE' && 'a' in o && 'b' in o) {
        [o.a, o.b] = [o.b, o.a];
        [o.danoA, o.danoB] = [o.danoB, o.danoA];
      }
      return o;
    }
    return x;
  };
  const w = andar(v);
  w.jugadores = [w.jugadores[1], w.jugadores[0]];
  w.ranuras = [w.ranuras[1], w.ranuras[0]];
  for (const jug of w.jugadores) jug.id = flip(jug.id);
  return w;
}

/** Recibe el duelo tal cual se guardó (JSON) y lo deja usable. */
export const desdeJson = (datos) => datos;
