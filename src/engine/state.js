// DinoWar — creación del estado y selectores de sólo lectura.
// Ninguna función de este módulo muta su argumento.

import { BALANCE, MAZO } from '../data/balance.js';
import { CARTAS, TIPO, CLADO, RASGO, INMUNE_SEQUIA, carta } from '../data/cards.js';
import { barajar, semilla } from './rng.js';

export const FASE = Object.freeze({
  ESTACION: 'ESTACION',
  RENTA: 'RENTA',
  ROBO: 'ROBO',
  DESPLIEGUE: 'DESPLIEGUE',
  REVELACION: 'REVELACION',
  COMBATE: 'COMBATE',
  DESCARTE: 'DESCARTE',
  CHEQUEO: 'CHEQUEO',
  FIN: 'FIN',
});

export const FASES_INTERACTIVAS = Object.freeze([FASE.DESPLIEGUE, FASE.DESCARTE]);

export const MOTIVO_FIN = Object.freeze({
  TROFEOS: 'TROFEOS',
  HABITAT: 'HABITAT',
  EXTINCION: 'EXTINCION',
  LIMITE_TURNOS: 'LIMITE_TURNOS',
});

export const CAUSA = Object.freeze({
  COMBATE: 'COMBATE',
  ESPINAS: 'ESPINAS',
  SEQUIA: 'SEQUIA',
  MORTANDAD: 'MORTANDAD',
});

export const rival = (j) => (j === 0 ? 1 : 0);

function nuevaInstancia(iid, cardId, dueno) {
  return {
    iid, cardId, dueno,
    ranura: null,
    heridas: 0,
    modAtaque: 0,
    modVida: 0,
    adherencias: [],
    adheridoA: null,
    desplegadoEnTurno: null,
  };
}

export function crearPartida(seedEntrada = 1) {
  let rng = semilla(seedEntrada);
  const instancias = {};
  let siguienteInstId = 1;
  const jugadores = [];

  for (let j = 0; j < 2; j++) {
    const mazo = [];
    for (const [cardId, copias] of MAZO) {
      for (let k = 0; k < copias; k++) {
        const iid = siguienteInstId++;
        instancias[iid] = nuevaInstancia(iid, cardId, j);
        mazo.push(iid);
      }
    }
    const b = barajar(mazo, rng);
    rng = b.rng;
    jugadores.push({
      id: j,
      biomasa: 0,
      habitat: BALANCE.vidaHabitat,
      trofeos: 0,
      mazo: b.lista,
      mano: [],
      descarte: [],
      pendientes: [],
      listo: false,
      sinCartas: false,
    });
  }

  for (const jug of jugadores) {
    // El segundo jugador compensa la iniciativa con una carta, no con recursos:
    // con renta fija por turno, dar Biomasa extra no compensaría nada.
    const extra = jug.id === 1 ? BALANCE.compensacionSegundoJugador.cartas : 0;
    for (let k = 0; k < BALANCE.manoInicial + extra; k++) jug.mano.push(jug.mazo.shift());
  }

  const estacional = [];
  for (const [id, copias] of BALANCE.mazoEstacional) {
    for (let k = 0; k < copias; k++) estacional.push(id);
  }
  const be = barajar(estacional, rng);
  rng = be.rng;

  return {
    seed: semilla(seedEntrada),
    rng,
    turno: 1,
    fase: FASE.ESTACION,
    campo: null,
    estacion: { mazo: be.lista, actual: null, descarte: [] },
    siguienteInstId,
    instancias,
    ranuras: [
      Array.from({ length: BALANCE.ranuras }, () => null),
      Array.from({ length: BALANCE.ranuras }, () => null),
    ],
    jugadores,
    eventos: [],
    ganador: null,
    motivoFin: null,
  };
}

// ---------------------------------------------------------------- selectores

export const ranuraValida = (r) => Number.isInteger(r) && r >= 0 && r < BALANCE.ranuras;

export function unidadEn(state, bando, ranura) {
  const iid = state.ranuras[bando][ranura];
  return iid === null ? null : state.instancias[iid];
}

export function unidadesDe(state, bando) {
  return state.ranuras[bando].filter((x) => x !== null).map((iid) => state.instancias[iid]);
}

export function todasLasUnidades(state) {
  return [...unidadesDe(state, 0), ...unidadesDe(state, 1)];
}

export const cladoDe = (inst) => carta(inst.cardId).clado;
export const inmuneSequia = (inst) => INMUNE_SEQUIA.includes(inst.cardId);
export const sinSinergias = (inst) => carta(inst.cardId).rasgo === RASGO.ESCASO;

export const campoEs = (state, rasgo) => state.campo !== null && carta(state.campo).rasgo === rasgo;
export const hayCrecida = (state) => state.estacion.actual === 'CRECIDA';
export const haySequia = (state) => state.estacion.actual === 'SEQUIA';

function adherenciasCon(state, inst, rasgo) {
  let n = 0;
  for (const aid of inst.adherencias) {
    const a = state.instancias[aid];
    if (a && carta(a.cardId).rasgo === rasgo) n += 1;
  }
  return n;
}

/** Poder de ataque con todos los modificadores estáticos. */
export function ataqueEfectivo(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return 0;

  let poder = c.ataque + inst.modAtaque;

  if (c.rasgo === RASGO.GREGARIO) {
    const companeros = unidadesDe(state, inst.dueno)
      .filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
    poder += companeros * BALANCE.rasgos.gregarioAtaquePorCompanero;
  }

  if (c.rasgo === RASGO.RIBERENO && campoEs(state, RASGO.CAMPO_CANAL)) {
    poder += BALANCE.rasgos.riberenoAtaque;
  }

  // Gregarismo: una carta adherida a un congénere beneficia a toda la especie.
  if (!sinSinergias(inst)) {
    for (const otro of unidadesDe(state, inst.dueno)) {
      if (otro.cardId !== inst.cardId) continue;
      poder += adherenciasCon(state, otro, RASGO.GREGARISMO) * BALANCE.rasgos.gregarismoAtaque;
    }
  }

  return Math.max(0, poder);
}

export function vidaMaxima(state, iid) {
  const inst = state.instancias[iid];
  return carta(inst.cardId).vida + inst.modVida;
}

export const vidaActual = (state, iid) => vidaMaxima(state, iid) - state.instancias[iid].heridas;

/**
 * Defensa: reducción plana del daño recibido. Sale de la propia carta —masa,
 * osteodermos, placas—, no del clado.
 */
export function reduccionDe(state, iid) {
  const c = carta(state.instancias[iid].cardId);
  let d = c.defensa ?? 0;
  if (c.rasgo === RASGO.MASA_COLOSAL) d += BALANCE.rasgos.masaColosalDefensa;
  return d;
}

/** Daño devuelto a quien ataca: púas caudales. */
export function espinasDe(state, iid) {
  const c = carta(state.instancias[iid].cardId);
  let e = c.clado === CLADO.TIREOFORO ? BALANCE.clados.espinasTireoforo : 0;
  if (c.rasgo === RASGO.TAGOMIZADOR) e += BALANCE.rasgos.tagomizadorExtra;
  return e;
}

/** Daño que `atacante` inflige a `defensor`, red trófica incluida. */
export function danoEntre(state, atacanteIid, defensorIid) {
  const a = carta(state.instancias[atacanteIid].cardId);
  const d = carta(state.instancias[defensorIid].cardId);
  let dano = ataqueEfectivo(state, atacanteIid);
  if (BALANCE.clados.presaDe[a.clado] === d.clado) dano += BALANCE.clados.bonusDepredacion;
  return Math.max(0, dano - reduccionDe(state, defensorIid));
}

/** Daño que una unidad sin rival enfrente inflige al habitat contrario. */
export function danoAlHabitat(state, iid) {
  if (hayCrecida(state)) return 0;   // el agua rehace el paisaje y frena el avance
  const extra = campoEs(state, RASGO.CAMPO_SABANA) ? BALANCE.efectosCampo.sabanaDanoHabitat : 0;
  return ataqueEfectivo(state, iid) + extra;
}

/** La deriva árida muerde el mazo de los dos bandos mientras siga en el campo. */
export const hayAridez = (state) => campoEs(state, RASGO.CAMPO_ARIDEZ);

/** Biomasa que le toca a cada bando este turno. */
export function rentaDe(state) {
  const base = Math.min(state.turno * BALANCE.rentaPorTurno, BALANCE.rentaTope);
  const extra = campoEs(state, RASGO.CAMPO_LLANURA) ? BALANCE.efectosCampo.llanuraBiomasa : 0;
  return base + extra;
}

/** Cuántas heridas cura una unidad al final del turno. */
export function curacionDe(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let cura = 0;
  if (c.rasgo === RASGO.RAMONEO_BAJO) cura += BALANCE.rasgos.ramoneoBajoCura;
  cura += adherenciasCon(state, inst, RASGO.GASTROLITOS) * BALANCE.rasgos.gastrolitosCura;
  if (campoEs(state, RASGO.CAMPO_BOSQUE) && c.clado === CLADO.SAUROPODO) {
    cura += BALANCE.efectosCampo.bosqueCura;
  }
  if (hayCrecida(state)) cura += BALANCE.estacion.crecidaCura;
  return cura;
}

/** Ranuras propias libres. */
export const ranurasLibres = (state, bando) =>
  state.ranuras[bando].map((x, i) => (x === null ? i : -1)).filter((i) => i >= 0);

/**
 * Vista del estado tal y como puede verla un bando: sin la mano ni el
 * despliegue oculto del rival. La IA consume esto, nunca el estado completo.
 */
export function vistaDe(state, j) {
  const v = structuredClone(state);
  const r = v.jugadores[rival(j)];
  r.manoOculta = r.mano.length;
  r.mano = [];
  r.pendientesOcultos = r.pendientes.length;
  r.pendientes = [];
  r.mazo = r.mazo.length;
  // Se oculta sólo lo que de verdad está oculto: la mano y el mazo del rival.
  // Lo que está en el campo, adherido a una unidad, es la carta de campo activa
  // o ya fue al descarte, lo ve cualquiera.
  const descarteRival = new Set(r.descarte);
  for (const iid of Object.keys(v.instancias)) {
    const inst = v.instancias[iid];
    if (inst.dueno === j) continue;
    const publica = inst.ranura !== null
      || inst.adheridoA !== null
      || inst.iid === v.campoIid
      || descarteRival.has(inst.iid);
    if (!publica) delete v.instancias[iid];
  }
  v.perspectiva = j;
  return v;
}

export { CARTAS, TIPO, CLADO, RASGO, carta };
