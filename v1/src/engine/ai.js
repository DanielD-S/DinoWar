// IA rival. Heurística pura, sin ML (§11).
//
// La IA recibe SIEMPRE una vista redactada del estado (state.vistaDe): no ve la
// mano, el mazo ni el despliegue oculto del rival. Todo lo que estima sobre él
// sale de lo que cualquier jugador vería: su tablero, su Biomasa y su descarte.

import { BALANCE } from '../data/balance.js';
import { TIPO, RASGO, carta } from '../data/cards.js';
import {
  FASE, rival, zonaDef, dominacion, unidadesEnZona, poderDeZona,
} from './state.js';
import { ACCION, legales, opcionesSequia } from './actions.js';
import { elegir } from './rng.js';

export const PERFIL = Object.freeze({
  ALEATORIA: 'aleatoria',
  TERRITORIAL: 'territorial',
  ECONOMISTA: 'economista',
  REACTIVA: 'reactiva',
});

const IA = BALANCE.ia;
const sigmoide = (x) => 1 / (1 + Math.exp(-x));

// --------------------------------------------------------------- proyección

/**
 * Unidades propias que habrá en la zona tras revelar, contando el despliegue
 * oculto de este turno. La IA sí conoce el suyo.
 */
function proyeccionPropia(vista, zona, j) {
  const unidades = unidadesEnZona(vista, zona, j).map((u) => u.cardId);
  for (const p of vista.jugadores[j].pendientes) {
    if (p.tipo === 'DESPLIEGUE' && p.zona === zona) unidades.push(vista.instancias[p.iid].cardId);
    if (p.tipo === 'REUBICACION' && p.zona === zona) unidades.push(vista.instancias[p.iid].cardId);
  }
  return unidades;
}

function poderProyectado(vista, zona, j) {
  let poder = poderDeZona(vista, zona, j);
  for (const p of vista.jugadores[j].pendientes) {
    if (p.tipo !== 'DESPLIEGUE' || p.zona !== zona) continue;
    poder += deltaPorDesplegar(vista, vista.instancias[p.iid].cardId, zona, j, false);
  }
  return poder;
}

/**
 * Cuánto sube el Poder TOTAL del bando en esa zona al desplegar la carta.
 * No es su Poder impreso: Dryosaurus sube también el de sus compañeros.
 */
function deltaPorDesplegar(vista, cardId, zona, j, contarPendientes = true) {
  const c = carta(cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return 0;

  let delta = c.poder;
  if (c.rasgo === RASGO.RIBERENO && zona === BALANCE.zonasEspeciales.canalFluvial) {
    delta += BALANCE.rasgos.riberenoPoder;
  }

  const presentes = contarPendientes
    ? proyeccionPropia(vista, zona, j)
    : unidadesEnZona(vista, zona, j).map((u) => u.cardId);

  if (c.rasgo === RASGO.GREGARIO) {
    // El recién llegado gana +1 por cada compañero, y cada compañero gana +1.
    const companeros = presentes.filter((id) => id === cardId).length;
    delta += 2 * companeros * BALANCE.rasgos.gregarioPoderPorCompanero;
  }

  if (c.rasgo !== RASGO.ESCASO) {
    for (const u of unidadesEnZona(vista, zona, j)) {
      if (u.cardId !== cardId) continue;
      for (const aid of u.adherencias) {
        if (carta(vista.instancias[aid].cardId).rasgo === RASGO.GREGARISMO) {
          delta += BALANCE.rasgos.gregarismoPoder;
        }
      }
    }
  }

  return delta;
}

/** Poder que el rival puede añadir a esta zona con la Biomasa que se le ve. */
function amenaza(vista, zona, j) {
  const suya = vista.jugadores[rival(j)].biomasa;
  return suya * IA.amenazaPorBiomasa * IA.fraccionAmenazaZona;
}

// ------------------------------------------------------------------ valor

/** Peso del Territorio según lo avanzada que esté la carrera. */
function pesoTerritorio(vista) {
  const puntos = Math.max(vista.jugadores[0].territorio, vista.jugadores[1].territorio);
  const avance = Math.min(1, puntos / BALANCE.objetivoTerritorio);
  return IA.pesoTerritorioBase + (IA.pesoTerritorioFinal - IA.pesoTerritorioBase) * avance;
}

/** Cuánto vale dominar esta zona, según el perfil. */
function valorDeZona(vista, zona, j, perfil) {
  const z = zonaDef(zona);
  const cfg = IA.perfiles[perfil] ?? {};
  const produccion = (z.biomasa + z.agua * IA.valorAgua) * IA.pesoProduccion * (cfg.pesoProduccion ?? 1);
  const territorio = z.territorio * pesoTerritorio(vista) * (cfg.pesoTerritorio ?? 1);

  let valor = (produccion + territorio) * IA.horizonte;
  if (cfg.favoritas?.includes(zona)) valor *= cfg.multiplicador;

  if (cfg.bonusZonaPerdida) {
    // Reactiva: tras la resolución, "la zona que domina el rival" ES la zona
    // que perdió el turno anterior.
    const d = dominacion(vista).find((x) => x.zona === zona);
    if (d.dominador === rival(j)) valor *= cfg.bonusZonaPerdida;
    if (d.disputada) valor *= cfg.bonusDisputada;
  }

  return valor;
}

/** Ganancia marginal de probabilidad de dominar la zona. */
function gananciaDeControl(vista, zona, j, delta) {
  const suyo = poderDeZona(vista, zona, rival(j)) + amenaza(vista, zona, j);
  const mio = poderProyectado(vista, zona, j);
  const antes = sigmoide((mio - suyo) / IA.escalaPoder);
  const despues = sigmoide((mio + delta - suyo) / IA.escalaPoder);
  return despues - antes;
}

/** Poder extra que aporta una adaptación sobre su objetivo, en su zona. */
function deltaAdaptacion(vista, cardId, objetivoIid, zona, j) {
  const objetivo = vista.instancias[objetivoIid];
  const rasgo = carta(cardId).rasgo;

  if (rasgo === RASGO.GREGARISMO) {
    const mismos = unidadesEnZona(vista, zona, j).filter((u) => u.cardId === objetivo.cardId
      && carta(u.cardId).rasgo !== RASGO.ESCASO).length;
    return mismos * BALANCE.rasgos.gregarismoPoder;
  }
  if (rasgo === RASGO.CRECIMIENTO_ACELERADO) {
    // No puntúa en la resolución de este turno: se descuenta.
    return BALANCE.rasgos.crecimientoPoder * IA.descuentoCrecimiento;
  }
  return 0;   // Gastrolitos no da Poder; su valor va aparte
}

function valorDeAccion(vista, j, a, perfil) {
  switch (a.tipo) {
    case ACCION.DESPLEGAR: {
      const cardId = vista.instancias[a.iid].cardId;
      const delta = deltaPorDesplegar(vista, cardId, a.zona, j);
      const ganancia = gananciaDeControl(vista, a.zona, j, delta);
      const coste = carta(cardId).coste * IA.pesoCoste;
      return ganancia * valorDeZona(vista, a.zona, j, perfil) - coste;
    }

    case ACCION.ADAPTAR: {
      const cardId = vista.instancias[a.iid].cardId;
      const objetivo = vista.instancias[a.objetivo];
      const zona = objetivo.zona
        ?? vista.jugadores[j].pendientes.find((p) => p.iid === a.objetivo)?.zona;
      if (!zona) return -Infinity;

      const delta = deltaAdaptacion(vista, cardId, a.objetivo, zona, j);
      let valor = gananciaDeControl(vista, zona, j, delta) * valorDeZona(vista, zona, j, perfil);

      if (carta(cardId).rasgo === RASGO.GASTROLITOS) {
        // Renta, no combate: vale si esperamos conservar la zona.
        const suyo = poderDeZona(vista, zona, rival(j)) + amenaza(vista, zona, j);
        const p = sigmoide((poderProyectado(vista, zona, j) - suyo) / IA.escalaPoder);
        valor += BALANCE.rasgos.gastrolitosBiomasa * IA.pesoProduccion * p;
      }
      return valor - carta(cardId).coste * IA.pesoCoste;
    }

    case ACCION.REUBICAR: {
      const inst = vista.instancias[a.iid];
      const origen = inst.zona;
      const delta = deltaPorDesplegar(vista, inst.cardId, a.zona, j);
      const gana = gananciaDeControl(vista, a.zona, j, delta) * valorDeZona(vista, a.zona, j, perfil);
      const pierde = gananciaDeControl(vista, origen, j, -delta) * valorDeZona(vista, origen, j, perfil);
      return gana + pierde;   // `pierde` ya sale negativo
    }

    default:
      return 0;
  }
}

// ------------------------------------------------------------- decisiones

/** Sacrificio de sequía: conserva el Poder por unidad de Agua liberada. */
function mejorSacrificio(vista, j) {
  const opciones = opcionesSequia(vista, j);
  let mejor = opciones[0];
  let mejorCoste = Infinity;
  for (const op of opciones) {
    const coste = op.reduce((n, iid) => n + carta(vista.instancias[iid].cardId).poder, 0);
    if (coste < mejorCoste) { mejorCoste = coste; mejor = op; }
  }
  return mejor;
}

/** Descarte por límite de mano: suelta lo que menos valor tiene sobre el tablero. */
function peorCartaDeMano(vista, j, perfil) {
  const mano = vista.jugadores[j].mano;
  let peor = mano[0];
  let peorValor = Infinity;
  for (const iid of mano) {
    const posibles = legales(vista, j).filter((a) => a.iid === iid && a.tipo !== ACCION.PASAR);
    const c = carta(vista.instancias[iid].cardId);
    // Si no es jugable ahora, se valora por su potencial bruto menos su coste.
    const valor = posibles.length > 0
      ? Math.max(...posibles.map((a) => valorDeAccion(vista, j, a, perfil)))
      : c.poder - c.coste;
    if (valor < peorValor) { peorValor = valor; peor = iid; }
  }
  return peor;
}

/**
 * @returns {{rng:number, accion:object|null}}
 */
export function decidir(vista, j, rng, perfil = PERFIL.ALEATORIA) {
  if (vista.fase === FASE.SEQUIA_PAGO) {
    if (perfil === PERFIL.ALEATORIA) {
      const opciones = opcionesSequia(vista, j);
      const e = elegir(rng, opciones);
      return { rng: e.rng, accion: { tipo: ACCION.PAGAR_SEQUIA, jugador: j, sacrificios: e.valor } };
    }
    return { rng, accion: { tipo: ACCION.PAGAR_SEQUIA, jugador: j, sacrificios: mejorSacrificio(vista, j) } };
  }

  const opciones = legales(vista, j);
  if (opciones.length === 0) return { rng, accion: null };

  if (perfil === PERFIL.ALEATORIA) {
    const e = elegir(rng, opciones);
    return { rng: e.rng, accion: e.valor };
  }

  if (vista.fase === FASE.DESCARTE) {
    return { rng, accion: { tipo: ACCION.DESCARTAR, jugador: j, iid: peorCartaDeMano(vista, j, perfil) } };
  }

  let mejor = null;
  let mejorValor = IA.umbralJugar;
  for (const a of opciones) {
    if (a.tipo === ACCION.PASAR) continue;
    const valor = valorDeAccion(vista, j, a, perfil);
    if (valor > mejorValor) { mejorValor = valor; mejor = a; }
  }

  return { rng, accion: mejor ?? { tipo: ACCION.PASAR, jugador: j } };
}
