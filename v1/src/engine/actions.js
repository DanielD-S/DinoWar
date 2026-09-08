// Reducer del motor: (estado, acción) → estado. Puro y sin DOM.
// Una acción ilegal NO lanza: devuelve el estado intacto con un evento
// RECHAZADA. Así ni la interfaz puede romper el motor ni la IA hacer trampa.

import { BALANCE } from '../data/balance.js';
import { TIPO, RASGO, carta } from '../data/cards.js';
import {
  FASE, FASES_INTERACTIVAS,
  indiceZona, costeDespliegue, inmuneSequia, sinSinergias, unidadesDe,
} from './state.js';
import {
  ev, matar, descartarDeMano, cobrarOportunistas,
  faseEstacion, faseProduccion, faseRobo, faseRevelacion, faseResolucion, faseChequeo,
} from './resolve.js';
import { CAUSA_MUERTE } from './state.js';

export const ACCION = Object.freeze({
  DESPLEGAR: 'DESPLEGAR',
  REUBICAR: 'REUBICAR',
  ADAPTAR: 'ADAPTAR',
  PASAR: 'PASAR',
  PAGAR_SEQUIA: 'PAGAR_SEQUIA',
  DESCARTAR: 'DESCARTAR',
  AVANZAR: 'AVANZAR',
});

const zonaValida = (z) => Number.isInteger(z) && z >= 1 && z <= BALANCE.zonas.length;

/** Zona donde acabará el objetivo de una adaptación, contando el despliegue oculto. */
function zonaDeObjetivo(s, jugador, objetivoIid) {
  const inst = s.instancias[objetivoIid];
  if (!inst) return null;
  if (inst.zona !== null) return inst.zona;
  const p = s.jugadores[jugador].pendientes.find((x) => x.iid === objetivoIid && x.tipo === 'DESPLIEGUE');
  return p ? p.zona : null;
}

/** @returns {string|null} motivo del rechazo, o null si la acción es legal. */
export function validar(s, a) {
  if (s.fase === FASE.FIN) return 'partida terminada';
  if (a.tipo === ACCION.AVANZAR) {
    return FASES_INTERACTIVAS.includes(s.fase) ? 'la fase espera una acción de jugador' : null;
  }

  const jug = s.jugadores[a.jugador];
  if (!jug) return 'jugador inexistente';

  switch (a.tipo) {
    case ACCION.PASAR:
      if (s.fase !== FASE.DESPLIEGUE) return 'fuera de la fase de despliegue';
      if (jug.listo) return 'ya has pasado';
      return null;

    case ACCION.DESPLEGAR: {
      if (s.fase !== FASE.DESPLIEGUE) return 'fuera de la fase de despliegue';
      if (jug.listo) return 'ya has pasado';
      if (!jug.mano.includes(a.iid)) return 'la carta no está en tu mano';
      const c = carta(s.instancias[a.iid].cardId);
      if (c.tipo !== TIPO.DINOSAURIO) return 'esa carta no se despliega en una zona';
      if (!zonaValida(a.zona)) return 'zona inexistente';
      if (jug.desplieguesPorZona[indiceZona(a.zona)] >= BALANCE.maxDesplieguesPorZona) {
        return 'ya has jugado el máximo de cartas en esa zona este turno';
      }
      if (jug.biomasa < costeDespliegue(s, s.instancias[a.iid].cardId, a.zona)) return 'Biomasa insuficiente';
      return null;
    }

    case ACCION.REUBICAR: {
      if (s.fase !== FASE.DESPLIEGUE) return 'fuera de la fase de despliegue';
      if (jug.listo) return 'ya has pasado';
      const inst = s.instancias[a.iid];
      if (!inst || inst.dueno !== a.jugador) return 'esa unidad no es tuya';
      if (inst.zona === null) return 'esa unidad no está en el tablero';
      if (carta(inst.cardId).rasgo !== RASGO.MIGRADOR) return 'esa unidad no puede reubicarse';
      if (!zonaValida(a.zona)) return 'zona inexistente';
      if (!BALANCE.adyacencia[inst.zona].includes(a.zona)) return 'la zona de destino no es adyacente';
      if (jug.pendientes.some((p) => p.iid === a.iid)) return 'esa unidad ya se mueve este turno';
      if (jug.desplieguesPorZona[indiceZona(a.zona)] >= BALANCE.maxDesplieguesPorZona) {
        return 'ya has jugado el máximo de cartas en esa zona este turno';
      }
      return null;
    }

    case ACCION.ADAPTAR: {
      if (s.fase !== FASE.DESPLIEGUE) return 'fuera de la fase de despliegue';
      if (jug.listo) return 'ya has pasado';
      if (!jug.mano.includes(a.iid)) return 'la carta no está en tu mano';
      const c = carta(s.instancias[a.iid].cardId);
      if (c.tipo !== TIPO.ADAPTACION) return 'esa carta no es una adaptación';
      const objetivo = s.instancias[a.objetivo];
      if (!objetivo || objetivo.dueno !== a.jugador) return 'el objetivo no es tuyo';
      if (carta(objetivo.cardId).tipo !== TIPO.DINOSAURIO) return 'el objetivo no es un dinosaurio';
      if (sinSinergias(objetivo)) return 'ese dinosaurio no admite sinergias';
      const zona = zonaDeObjetivo(s, a.jugador, a.objetivo);
      if (zona === null) return 'el objetivo no está desplegado';
      if (jug.desplieguesPorZona[indiceZona(zona)] >= BALANCE.maxDesplieguesPorZona) {
        return 'ya has jugado el máximo de cartas en esa zona este turno';
      }
      if (jug.biomasa < c.coste) return 'Biomasa insuficiente';
      return null;
    }

    case ACCION.PAGAR_SEQUIA: {
      if (s.fase !== FASE.SEQUIA_PAGO) return 'no hay una sequía que pagar';
      if (!s.sequiaPendiente.includes(a.jugador)) return 'tu bando ya ha pagado la sequía';
      const sac = a.sacrificios ?? [];
      const vistos = new Set();
      let minimo = Infinity;
      for (const iid of sac) {
        const inst = s.instancias[iid];
        if (!inst || inst.dueno !== a.jugador || inst.zona === null) return 'sacrificio inválido';
        if (inmuneSequia(inst)) return 'Camarasaurus es inmune a la sequía';
        if (vistos.has(iid)) return 'sacrificio repetido';
        vistos.add(iid);
        minimo = Math.min(minimo, carta(inst.cardId).consumoHidrico);
      }
      const total = unidadesDe(s, a.jugador)
        .filter((u) => !inmuneSequia(u) && !vistos.has(u.iid))
        .reduce((n, u) => n + carta(u.cardId).consumoHidrico, 0);
      if (total > jug.agua) return 'sigues sin poder pagar el consumo hídrico';
      if (sac.length > 0 && total + minimo <= jug.agua) return 'estás sacrificando más de lo necesario';
      return null;
    }

    case ACCION.DESCARTAR: {
      if (s.fase !== FASE.DESCARTE) return 'no toca descartar';
      if (jug.mano.length <= BALANCE.manoMaxima) return 'tu mano no excede el límite';
      if (!jug.mano.includes(a.iid)) return 'la carta no está en tu mano';
      return null;
    }

    default:
      return 'acción desconocida';
  }
}

/** Aplica una fase automática sobre el borrador. */
function aplicarFaseAutomatica(s) {
  switch (s.fase) {
    case FASE.ESTACION: return faseEstacion(s);
    case FASE.PRODUCCION: return faseProduccion(s);
    case FASE.ROBO: return faseRobo(s);
    case FASE.REVELACION: return faseRevelacion(s);
    case FASE.RESOLUCION: return faseResolucion(s);
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

    case ACCION.DESPLEGAR: {
      const cardId = s.instancias[action.iid].cardId;
      jug.biomasa -= costeDespliegue(s, cardId, action.zona);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: 'DESPLIEGUE', iid: action.iid, zona: action.zona });
      jug.desplieguesPorZona[indiceZona(action.zona)] += 1;
      break;
    }

    case ACCION.REUBICAR:
      jug.pendientes.push({ tipo: 'REUBICACION', iid: action.iid, zona: action.zona });
      jug.desplieguesPorZona[indiceZona(action.zona)] += 1;
      break;

    case ACCION.ADAPTAR: {
      const cardId = s.instancias[action.iid].cardId;
      const zona = zonaDeObjetivo(s, action.jugador, action.objetivo);
      jug.biomasa -= carta(cardId).coste;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: 'ADAPTACION', iid: action.iid, objetivo: action.objetivo, zona });
      jug.desplieguesPorZona[indiceZona(zona)] += 1;
      break;
    }

    case ACCION.PASAR:
      jug.listo = true;
      if (s.jugadores.every((j) => j.listo)) s.fase = FASE.REVELACION;
      break;

    case ACCION.PAGAR_SEQUIA: {
      const porZona = {};
      for (const iid of action.sacrificios ?? []) {
        const zona = s.instancias[iid].zona;
        if (matar(s, iid, CAUSA_MUERTE.SEQUIA)) porZona[zona] = (porZona[zona] ?? 0) + 1;
      }
      for (const zona of Object.keys(porZona)) cobrarOportunistas(s, Number(zona), porZona[zona]);

      const restante = unidadesDe(s, action.jugador)
        .filter((u) => !inmuneSequia(u))
        .reduce((n, u) => n + carta(u.cardId).consumoHidrico, 0);
      jug.agua -= restante;
      ev(s, 'SEQUIA_PAGADA', {
        jugador: action.jugador, agua: restante, sacrificios: (action.sacrificios ?? []).length,
      });

      s.sequiaPendiente = s.sequiaPendiente.filter((j) => j !== action.jugador);
      if (s.sequiaPendiente.length === 0) s.fase = FASE.PRODUCCION;
      break;
    }

    case ACCION.DESCARTAR:
      descartarDeMano(s, action.jugador, action.iid);
      if (!s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima)) s.fase = FASE.CHEQUEO;
      break;

    default:
      break;
  }

  return s;
}

/**
 * Ejecuta fases automáticas hasta que la partida necesite una acción de
 * jugador o termine. Es el único bucle que comparten simulador e interfaz.
 */
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

  if (s.fase === FASE.DESPLIEGUE && !jug.listo) {
    salida.push({ tipo: ACCION.PASAR, jugador: j });
    for (const iid of jug.mano) {
      const c = carta(s.instancias[iid].cardId);
      if (c.tipo === TIPO.DINOSAURIO) {
        for (const z of BALANCE.zonas) {
          const a = { tipo: ACCION.DESPLEGAR, jugador: j, iid, zona: z.id };
          if (!validar(s, a)) salida.push(a);
        }
      } else {
        const objetivos = [
          ...unidadesDe(s, j).map((u) => u.iid),
          ...jug.pendientes.filter((p) => p.tipo === 'DESPLIEGUE').map((p) => p.iid),
        ];
        for (const objetivo of objetivos) {
          const a = { tipo: ACCION.ADAPTAR, jugador: j, iid, objetivo };
          if (!validar(s, a)) salida.push(a);
        }
      }
    }
    for (const u of unidadesDe(s, j)) {
      if (carta(u.cardId).rasgo !== RASGO.MIGRADOR) continue;
      for (const destino of BALANCE.adyacencia[u.zona]) {
        const a = { tipo: ACCION.REUBICAR, jugador: j, iid: u.iid, zona: destino };
        if (!validar(s, a)) salida.push(a);
      }
    }
  }

  if (s.fase === FASE.DESCARTE && jug.mano.length > BALANCE.manoMaxima) {
    for (const iid of jug.mano) salida.push({ tipo: ACCION.DESCARTAR, jugador: j, iid });
  }

  return salida;
}

/**
 * Conjuntos de sacrificio válidos frente a una sequía impagable, uno por
 * criterio razonable (menos bajas / proteger al fuerte / soltar al débil).
 * Todos salen podados: ningún sacrificio sobra, que es lo que exige validar().
 */
export function opcionesSequia(state, j) {
  const s = state;
  const agua = s.jugadores[j].agua;
  const unidades = unidadesDe(s, j).filter((u) => !inmuneSequia(u));
  const consumo = (u) => carta(u.cardId).consumoHidrico;
  const total = unidades.reduce((n, u) => n + consumo(u), 0);
  if (total <= agua) return [[]];

  const criterios = [
    (a, b) => consumo(b) - consumo(a) || a.iid - b.iid,                       // menos bajas
    (a, b) => carta(a.cardId).poder - carta(b.cardId).poder || a.iid - b.iid, // proteger al fuerte
    (a, b) => consumo(b) / (carta(b.cardId).poder + 1) - consumo(a) / (carta(a.cardId).poder + 1) || a.iid - b.iid,
  ];

  const salida = [];
  const vistos = new Set();

  for (const criterio of criterios) {
    const orden = unidades.slice().sort(criterio);
    let restante = total;
    let conjunto = [];
    for (const u of orden) {
      if (restante <= agua) break;
      conjunto.push(u);
      restante -= consumo(u);
    }
    // Poda: quita de menor a mayor consumo lo que no haga falta.
    for (const u of conjunto.slice().sort((a, b) => consumo(a) - consumo(b))) {
      if (restante + consumo(u) <= agua) {
        restante += consumo(u);
        conjunto = conjunto.filter((x) => x.iid !== u.iid);
      }
    }
    const iids = conjunto.map((u) => u.iid).sort((a, b) => a - b);
    const clave = iids.join(',');
    if (!vistos.has(clave)) {
      vistos.add(clave);
      salida.push(iids);
    }
  }

  return salida;
}
