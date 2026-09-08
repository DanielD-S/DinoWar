// Creación del estado y selectores de sólo lectura.
// Ninguna función de este módulo muta su argumento.

import { BALANCE } from '../data/balance.js';
import { CARTAS, TIPO, RASGO, INMUNE_SEQUIA, carta } from '../data/cards.js';
import { barajar, semilla } from './rng.js';

export const FASE = Object.freeze({
  ESTACION: 'ESTACION',
  SEQUIA_PAGO: 'SEQUIA_PAGO',
  PRODUCCION: 'PRODUCCION',
  ROBO: 'ROBO',
  DESPLIEGUE: 'DESPLIEGUE',
  REVELACION: 'REVELACION',
  RESOLUCION: 'RESOLUCION',
  DESCARTE: 'DESCARTE',
  CHEQUEO: 'CHEQUEO',
  FIN: 'FIN',
});

/** Fases que esperan una acción de jugador. El resto las ejecuta AVANZAR. */
export const FASES_INTERACTIVAS = Object.freeze([
  FASE.SEQUIA_PAGO,
  FASE.DESPLIEGUE,
  FASE.DESCARTE,
]);

export const MOTIVO_FIN = Object.freeze({
  TERRITORIO: 'TERRITORIO',
  SIN_CARTAS: 'SIN_CARTAS',
  LIMITE_TURNOS: 'LIMITE_TURNOS',
});

export const CAUSA_MUERTE = Object.freeze({
  COMBATE: 'COMBATE',
  DEPREDADOR_DOMINANTE: 'DEPREDADOR_DOMINANTE',
  TAGOMIZADOR: 'TAGOMIZADOR',
  SEQUIA: 'SEQUIA',
});

function nuevaInstancia(iid, cardId, dueno) {
  return {
    iid,
    cardId,
    dueno,
    zona: null,
    modPoder: 0,
    colosalGastado: false,
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
    for (const [cardId, copias] of BALANCE.mazo) {
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
      biomasa: BALANCE.recursosIniciales.biomasa,
      agua: BALANCE.recursosIniciales.agua,
      territorio: BALANCE.recursosIniciales.territorio,
      mazo: b.lista,
      mano: [],
      descarte: [],
      extintos: [],   // salen del juego: no vuelven a barajarse
      pendientes: [],
      desplieguesPorZona: BALANCE.zonas.map(() => 0),
      listo: false,
      sinCartas: false,
    });
  }

  // Compensación del segundo jugador (§9).
  jugadores[1].biomasa += BALANCE.compensacionSegundoJugador.biomasa;
  jugadores[1].agua += BALANCE.compensacionSegundoJugador.agua;

  for (const jug of jugadores) {
    const extra = jug.id === 1 ? BALANCE.compensacionSegundoJugador.cartas : 0;
    for (let k = 0; k < BALANCE.manoInicial + extra; k++) {
      jug.mano.push(jug.mazo.shift());
    }
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
    estacion: { mazo: be.lista, actual: null, descarte: [] },
    siguienteInstId,
    instancias,
    jugadores,
    zonas: BALANCE.zonas.map((z) => ({ id: z.id, unidades: [] })),
    eventos: [],
    ganador: null,
    motivoFin: null,
  };
}

// ---------------------------------------------------------------- selectores

export const rival = (j) => (j === 0 ? 1 : 0);

export const indiceZona = (zonaId) => zonaId - 1;

export function zonaDef(zonaId) {
  const z = BALANCE.zonas[indiceZona(zonaId)];
  if (!z) throw new Error(`Zona desconocida: ${zonaId}`);
  return z;
}

export const esDinosaurio = (inst) => carta(inst.cardId).tipo === TIPO.DINOSAURIO;

export const sinSinergias = (inst) => carta(inst.cardId).rasgo === RASGO.ESCASO;

export const inmuneSequia = (inst) => INMUNE_SEQUIA.includes(inst.cardId);

/** Dinosaurios desplegados (visibles) en una zona, opcionalmente de un bando. */
export function unidadesEnZona(state, zonaId, dueno = null) {
  const z = state.zonas[indiceZona(zonaId)];
  const salida = [];
  for (const iid of z.unidades) {
    const inst = state.instancias[iid];
    if (dueno === null || inst.dueno === dueno) salida.push(inst);
  }
  return salida;
}

/**
 * Bonificación de Gregarismo aplicable a `inst`: +1 por cada carta Gregarismo
 * adherida a un dinosaurio propio de su misma especie en su misma zona.
 */
function bonusGregarismo(state, inst) {
  let bonus = 0;
  for (const otro of unidadesEnZona(state, inst.zona, inst.dueno)) {
    if (otro.cardId !== inst.cardId) continue;
    for (const aid of otro.adherencias) {
      if (carta(state.instancias[aid].cardId).rasgo === RASGO.GREGARISMO) {
        bonus += BALANCE.rasgos.gregarismoPoder;
      }
    }
  }
  return bonus;
}

/** Poder de una unidad ya desplegada, con todos los modificadores estáticos. */
export function poderEfectivo(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return 0;
  if (inst.zona === null) return c.poder;

  let poder = c.poder + inst.modPoder;

  if (c.rasgo === RASGO.RIBERENO && inst.zona === BALANCE.zonasEspeciales.canalFluvial) {
    poder += BALANCE.rasgos.riberenoPoder;
  }

  if (c.rasgo === RASGO.GREGARIO) {
    const companeros = unidadesEnZona(state, inst.zona, inst.dueno)
      .filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
    poder += companeros * BALANCE.rasgos.gregarioPoderPorCompanero;
  }

  // "Sin sinergias": Torvosaurus no recibe bonificaciones de otras cartas.
  if (!sinSinergias(inst)) poder += bonusGregarismo(state, inst);

  return poder;
}

export function poderDeZona(state, zonaId, dueno) {
  let total = 0;
  for (const inst of unidadesEnZona(state, zonaId, dueno)) {
    total += poderEfectivo(state, inst.iid);
  }
  return total;
}

/**
 * Dominación de cada zona según el tablero actual.
 * @returns {Array<{zona:number, poder:[number,number], dominador:0|1|null, disputada:boolean}>}
 */
export function dominacion(state) {
  return BALANCE.zonas.map((z) => {
    const p0 = poderDeZona(state, z.id, 0);
    const p1 = poderDeZona(state, z.id, 1);
    const n0 = unidadesEnZona(state, z.id, 0).length;
    const n1 = unidadesEnZona(state, z.id, 1).length;
    let dominador = null;
    if (p0 > p1) dominador = 0;
    else if (p1 > p0) dominador = 1;
    return { zona: z.id, poder: [p0, p1], dominador, disputada: n0 > 0 && n1 > 0 };
  });
}

export const zonasDominadasPor = (state, j) =>
  dominacion(state).filter((d) => d.dominador === j).map((d) => d.zona);

/** ¿Está activa la Crecida monzónica este turno? */
export const hayCrecida = (state) => state.estacion.actual === 'CRECIDA';
export const haySequia = (state) => state.estacion.actual === 'SEQUIA';

/** Coste en Biomasa de desplegar una carta en una zona, con el clima actual. */
export function costeDespliegue(state, cardId, zonaId) {
  const c = carta(cardId);
  let coste = c.coste;
  const cre = BALANCE.estacion.crecida;
  if (hayCrecida(state) && c.tipo === TIPO.DINOSAURIO && zonaId === cre.zonaRecargo) {
    coste += cre.recargo;
  }
  return coste;
}

/** Producción de un bando este turno, ya con el suelo de ingreso aplicado (D3). */
export function produccionDe(state, j) {
  const dom = dominacion(state);
  const cre = BALANCE.estacion.crecida;
  const prod = { biomasa: 0, agua: 0, territorio: 0, detalle: [] };

  for (const d of dom) {
    if (d.dominador !== j) continue;
    const z = zonaDef(d.zona);
    const mult = hayCrecida(state) && cre.zonasDuplicadas.includes(d.zona) ? 2 : 1;
    let biomasa = z.biomasa * mult;

    for (const inst of unidadesEnZona(state, d.zona, j)) {
      if (carta(inst.cardId).rasgo === RASGO.RAMONEO_BAJO) {
        biomasa += BALANCE.rasgos.ramoneoBajoBiomasa;
      }
      for (const aid of inst.adherencias) {
        if (carta(state.instancias[aid].cardId).rasgo === RASGO.GASTROLITOS) {
          biomasa += BALANCE.rasgos.gastrolitosBiomasa;
        }
      }
    }

    prod.biomasa += biomasa;
    prod.agua += z.agua * mult;
    prod.territorio += z.territorio * mult;
    prod.detalle.push({ zona: d.zona, biomasa, agua: z.agua * mult, territorio: z.territorio * mult });
  }

  prod.biomasaZonas = prod.biomasa;
  prod.biomasa = Math.max(prod.biomasa, BALANCE.ingresoMinimoBiomasa);
  prod.suelo = prod.biomasa > prod.biomasaZonas;
  return prod;
}

/** Consumo hídrico total de un bando frente a una Sequía. */
export function consumoHidricoDe(state, j) {
  let total = 0;
  for (const z of state.zonas) {
    for (const iid of z.unidades) {
      const inst = state.instancias[iid];
      if (inst.dueno !== j || inmuneSequia(inst)) continue;
      total += carta(inst.cardId).consumoHidrico;
    }
  }
  return total;
}

/** Todas las unidades desplegadas de un bando, en cualquier zona. */
export function unidadesDe(state, j) {
  const salida = [];
  for (const z of state.zonas) {
    for (const iid of z.unidades) {
      const inst = state.instancias[iid];
      if (inst.dueno === j) salida.push(inst);
    }
  }
  return salida;
}

/**
 * Vista del estado tal y como puede verla un bando: sin la mano ni el
 * despliegue oculto del rival. La IA y la interfaz consumen esto, nunca el
 * estado completo — es lo que hace imposible hacer trampa por descuido.
 */
export function vistaDe(state, j) {
  const v = structuredClone(state);
  const r = v.jugadores[rival(j)];
  r.manoOculta = r.mano.length;
  r.mano = [];
  r.pendientesOcultos = r.pendientes.length;
  r.pendientes = [];
  r.mazo = r.mazo.length;   // el descarte y los extintos sí son públicos
  for (const iid of Object.keys(v.instancias)) {
    const inst = v.instancias[iid];
    if (inst.dueno !== j && inst.zona === null && !v.jugadores[inst.dueno].descarte.includes(inst.iid)) {
      delete v.instancias[iid];
    }
  }
  v.perspectiva = j;
  return v;
}

export { CARTAS, TIPO, RASGO, carta };
