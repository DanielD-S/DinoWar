// DinoWar — reducer del motor: (estado, acción) → estado. Puro y sin DOM.
// Una acción ilegal NO lanza: devuelve el estado intacto con un evento
// RECHAZADA. Así ni la interfaz puede romper el motor ni la IA hacer trampa.

import { BALANCE } from '../data/balance.js';
import { TIPO, OBJETIVO, CLADO, RASGO, carta } from '../data/cards.js';
import {
  FASE, FASES_INTERACTIVAS, rival,
  ranuraValida, unidadesDe, ranurasLibres, sinSinergias,
} from './state.js';
import {
  ev, descartarDeMano,
  faseEstacion, faseRenta, faseRobo, faseRevelacion, faseCombate, faseChequeo,
} from './resolve.js';

export const ACCION = Object.freeze({
  DESPLEGAR: 'DESPLEGAR',
  MOVER: 'MOVER',
  EVENTO: 'EVENTO',
  CLIMA: 'CLIMA',
  RECURSO: 'RECURSO',
  PASAR: 'PASAR',
  DESCARTAR: 'DESCARTAR',
  AVANZAR: 'AVANZAR',
});

const CLADOS = Object.values(CLADO);

/** Ranura que ocupará una unidad tras revelar, contando el despliegue oculto. */
function ranuraProyectada(s, jugador, iid) {
  const inst = s.instancias[iid];
  if (inst.ranura !== null) return inst.ranura;
  const p = s.jugadores[jugador].pendientes.find((x) => x.iid === iid && x.tipo === 'DESPLIEGUE');
  return p ? p.ranura : null;
}

const ranuraReservada = (s, jugador, ranura) =>
  s.jugadores[jugador].pendientes.some((p) => p.ranura === ranura && (p.tipo === 'DESPLIEGUE' || p.tipo === 'MOVIMIENTO'));

/** @returns {string|null} motivo del rechazo, o null si la acción es legal. */
export function validar(s, a) {
  if (s.fase === FASE.FIN) return 'partida terminada';
  if (a.tipo === ACCION.AVANZAR) {
    return FASES_INTERACTIVAS.includes(s.fase) ? 'la fase espera una acción de jugador' : null;
  }

  const jug = s.jugadores[a.jugador];
  if (!jug) return 'jugador inexistente';

  if (a.tipo === ACCION.DESCARTAR) {
    if (s.fase !== FASE.DESCARTE) return 'no toca descartar';
    if (jug.mano.length <= BALANCE.manoMaxima) return 'tu mano no excede el límite';
    if (!jug.mano.includes(a.iid)) return 'la carta no está en tu mano';
    return null;
  }

  if (s.fase !== FASE.DESPLIEGUE) return 'fuera de la fase de despliegue';
  if (jug.listo) return 'ya has pasado';
  if (a.tipo === ACCION.PASAR) return null;

  const inst = s.instancias[a.iid];
  if (!inst) return 'carta inexistente';

  if (a.tipo === ACCION.MOVER) {
    if (inst.dueno !== a.jugador) return 'esa unidad no es tuya';
    if (inst.ranura === null) return 'esa unidad no está en el campo';
    if (carta(inst.cardId).rasgo !== RASGO.MIGRADOR) return 'esa unidad no puede moverse';
    if (!ranuraValida(a.ranura)) return 'ranura inexistente';
    if (s.ranuras[a.jugador][a.ranura] !== null) return 'esa ranura está ocupada';
    if (ranuraReservada(s, a.jugador, a.ranura)) return 'ya has comprometido esa ranura';
    if (jug.pendientes.some((p) => p.iid === a.iid)) return 'esa unidad ya se mueve este turno';
    return null;
  }

  if (!jug.mano.includes(a.iid)) return 'la carta no está en tu mano';
  const c = carta(inst.cardId);
  if (jug.biomasa < c.coste) return 'Biomasa insuficiente';

  switch (a.tipo) {
    case ACCION.DESPLEGAR:
      if (c.tipo !== TIPO.DINOSAURIO) return 'esa carta no se despliega en una ranura';
      if (!ranuraValida(a.ranura)) return 'ranura inexistente';
      if (s.ranuras[a.jugador][a.ranura] !== null) return 'esa ranura está ocupada';
      if (ranuraReservada(s, a.jugador, a.ranura)) return 'ya has comprometido esa ranura';
      return null;

    case ACCION.RECURSO:
      if (c.tipo !== TIPO.RECURSO) return 'esa carta no es de recurso';
      return null;

    case ACCION.CLIMA:
      if (c.tipo !== TIPO.CLIMA) return 'esa carta no es de clima';
      if (jug.pendientes.some((p) => p.tipo === 'CAMPO')) return 'ya has comprometido un clima este turno';
      return null;

    // Un solo caso para los eventos: lo que cambia entre ellos es su objetivo,
    // no su familia.
    case ACCION.EVENTO: {
      if (c.tipo !== TIPO.EVENTO) return 'esa carta no es un evento';

      if (c.objetivo === OBJETIVO.PROPIO) {
        const objetivo = s.instancias[a.objetivo];
        if (!objetivo || objetivo.dueno !== a.jugador) return 'el objetivo no es tuyo';
        if (carta(objetivo.cardId).tipo !== TIPO.DINOSAURIO) return 'el objetivo no es un dinosaurio';
        if (sinSinergias(objetivo)) return 'ese dinosaurio no admite eventos de mejora';
        if (ranuraProyectada(s, a.jugador, a.objetivo) === null) return 'el objetivo no está en el campo';
        if (c.rasgo === RASGO.NEUMATICIDAD) {
          const clado = carta(objetivo.cardId).clado;
          if (clado !== CLADO.TEROPODO && clado !== CLADO.SAUROPODO) {
            return 'la neumaticidad sólo se da en terópodos y saurópodos';
          }
        }
      } else if (c.objetivo === OBJETIVO.RIVAL) {
        const objetivo = s.instancias[a.objetivo];
        if (!objetivo || objetivo.dueno !== rival(a.jugador)) return 'el objetivo no es del rival';
        if (objetivo.ranura === null) return 'el objetivo no está en el campo';
      } else if (c.objetivo === OBJETIVO.CLADO) {
        if (!CLADOS.includes(a.clado)) return 'clado inexistente';
      }
      return null;
    }

    default:
      return 'acción desconocida';
  }
}

function aplicarRecurso(s, j, iid) {
  const jug = s.jugadores[j];
  const cardId = s.instancias[iid].cardId;
  const r = carta(cardId).rasgo;
  const P = BALANCE.recursos;

  jug.mano = jug.mano.filter((x) => x !== iid);
  jug.descarte.push(iid);

  if (r === RASGO.REBROTE) {
    jug.biomasa += P.rebroteBiomasa;
    for (const u of unidadesDe(s, j)) u.heridas += P.rebroteHeridas;
  } else if (r === RASGO.CARRONA) {
    jug.biomasa += P.carronaBiomasa;
    s.jugadores[rival(j)].biomasa += P.carronaBiomasaRival;
  } else if (r === RASGO.LAGO) {
    jug.biomasa += P.lagoBiomasa;
    jug.habitat -= P.lagoHabitat;
  }

  ev(s, 'RECURSO', { jugador: j, cardId, biomasa: jug.biomasa });
}

function aplicarFaseAutomatica(s) {
  switch (s.fase) {
    case FASE.ESTACION: return faseEstacion(s);
    case FASE.RENTA: return faseRenta(s);
    case FASE.ROBO: return faseRobo(s);
    case FASE.REVELACION: return faseRevelacion(s);
    case FASE.COMBATE: return faseCombate(s);
    case FASE.CHEQUEO: return faseChequeo(s);
    default: return undefined;
  }
}

/** (estado, acción) → estado. No muta el argumento. */
export function reduce(state, action) {
  const s = structuredClone(state);
  const motivo = validar(s, action);

  if (motivo) {
    ev(s, 'RECHAZADA', { accion: action.tipo, jugador: action.jugador ?? null, motivo });
    return s;
  }

  const jug = s.jugadores[action.jugador];

  switch (action.tipo) {
    case ACCION.AVANZAR:
      aplicarFaseAutomatica(s);
      break;

    case ACCION.DESPLEGAR:
      jug.biomasa -= carta(s.instancias[action.iid].cardId).coste;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: 'DESPLIEGUE', iid: action.iid, ranura: action.ranura });
      break;

    case ACCION.MOVER:
      jug.pendientes.push({ tipo: 'MOVIMIENTO', iid: action.iid, ranura: action.ranura });
      break;

    case ACCION.RECURSO:
      // Boca arriba y al instante: la Biomasa que da tiene que poder gastarse
      // este mismo turno, así que no puede esperar a la revelación.
      aplicarRecurso(s, action.jugador, action.iid);
      break;

    case ACCION.CLIMA:
      jug.biomasa -= carta(s.instancias[action.iid].cardId).coste;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: 'CAMPO', iid: action.iid });
      break;

    case ACCION.EVENTO: {
      const c = carta(s.instancias[action.iid].cardId);
      jug.biomasa -= c.coste;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({
        tipo: c.objetivo === OBJETIVO.PROPIO ? 'ADAPTACION' : 'PRESION',
        iid: action.iid,
        objetivo: action.objetivo ?? null,
        clado: action.clado ?? null,
      });
      break;
    }

    case ACCION.PASAR:
      jug.listo = true;
      if (s.jugadores.every((j) => j.listo)) s.fase = FASE.REVELACION;
      break;

    case ACCION.DESCARTAR:
      descartarDeMano(s, action.jugador, action.iid);
      if (!s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima)) s.fase = FASE.CHEQUEO;
      break;

    default:
      break;
  }

  return s;
}

/** Ejecuta fases automáticas hasta que haga falta un jugador o termine. */
export function avanzar(state, maxPasos = 64) {
  let s = state;
  for (let i = 0; i < maxPasos; i++) {
    if (s.fase === FASE.FIN || FASES_INTERACTIVAS.includes(s.fase)) return s;
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }
  throw new Error(`avanzar() no converge desde la fase ${s.fase}`);
}

/** Acciones legales para un bando en la fase actual. Base de la IA. */
export function legales(state, j) {
  const s = state;
  const jug = s.jugadores[j];
  const salida = [];

  if (s.fase === FASE.DESCARTE && jug.mano.length > BALANCE.manoMaxima) {
    for (const iid of jug.mano) salida.push({ tipo: ACCION.DESCARTAR, jugador: j, iid });
    return salida;
  }

  if (s.fase !== FASE.DESPLIEGUE || jug.listo) return salida;
  salida.push({ tipo: ACCION.PASAR, jugador: j });

  const libres = ranurasLibres(s, j).filter((r) => !ranuraReservada(s, j, r));
  const propias = [
    ...unidadesDe(s, j).map((u) => u.iid),
    ...jug.pendientes.filter((p) => p.tipo === 'DESPLIEGUE').map((p) => p.iid),
  ];
  const ajenas = unidadesDe(s, rival(j)).map((u) => u.iid);

  for (const iid of jug.mano) {
    const c = carta(s.instancias[iid].cardId);
    if (c.coste > jug.biomasa) continue;

    if (c.tipo === TIPO.DINOSAURIO) {
      for (const r of libres) salida.push({ tipo: ACCION.DESPLEGAR, jugador: j, iid, ranura: r });
    } else if (c.tipo === TIPO.RECURSO) {
      salida.push({ tipo: ACCION.RECURSO, jugador: j, iid });
    } else if (c.tipo === TIPO.CLIMA) {
      const a = { tipo: ACCION.CLIMA, jugador: j, iid };
      if (!validar(s, a)) salida.push(a);
    } else if (c.tipo === TIPO.EVENTO) {
      if (c.objetivo === OBJETIVO.PROPIO) {
        for (const objetivo of propias) {
          const a = { tipo: ACCION.EVENTO, jugador: j, iid, objetivo };
          if (!validar(s, a)) salida.push(a);
        }
      } else if (c.objetivo === OBJETIVO.RIVAL) {
        for (const objetivo of ajenas) salida.push({ tipo: ACCION.EVENTO, jugador: j, iid, objetivo });
      } else if (c.objetivo === OBJETIVO.CLADO) {
        for (const clado of CLADOS) salida.push({ tipo: ACCION.EVENTO, jugador: j, iid, clado });
      } else {
        salida.push({ tipo: ACCION.EVENTO, jugador: j, iid });
      }
    }
  }

  for (const u of unidadesDe(s, j)) {
    if (carta(u.cardId).rasgo !== RASGO.MIGRADOR) continue;
    for (const r of libres) {
      const a = { tipo: ACCION.MOVER, jugador: j, iid: u.iid, ranura: r };
      if (!validar(s, a)) salida.push(a);
    }
  }

  return salida;
}
