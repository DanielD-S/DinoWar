// DinoWar — IA rival. Heurística pura, sin ML.
//
// Recibe SIEMPRE una vista redactada (state.vistaDe): no ve la mano, el mazo ni
// el despliegue oculto del rival. Todo lo que estima sale de lo que cualquier
// jugador vería.

import { BALANCE } from '../data/balance.js';
import { TIPO, OBJETIVO, CLADO, RASGO, carta } from '../data/cards.js';
import {
  FASE, rival, unidadEn, unidadesDe,
  ataqueEfectivo, vidaActual, reduccionDe, espinasDe, danoAlHabitat, campoEs,
} from './state.js';
import { ACCION, legales } from './actions.js';
import { elegir } from './rng.js';

export const PERFIL = Object.freeze({
  ALEATORIA: 'aleatoria',
  HEURISTICA: 'heuristica',
});

const IA = BALANCE.ia;

// --------------------------------------------------- estadísticas hipotéticas

/** Poder que tendría esta carta si se desplegase ahora, sin estar aún en campo. */
function ataqueHipotetico(vista, j, cardId) {
  const c = carta(cardId);
  let poder = c.ataque;
  if (c.rasgo === RASGO.GREGARIO) {
    poder += unidadesDe(vista, j).filter((u) => u.cardId === cardId).length
      * BALANCE.rasgos.gregarioAtaquePorCompanero;
  }
  if (c.rasgo === RASGO.RIBERENO && campoEs(vista, RASGO.CAMPO_CANAL)) {
    poder += BALANCE.rasgos.riberenoAtaque;
  }
  return poder;
}

function reduccionHipotetica(cardId) {
  const c = carta(cardId);
  let d = c.defensa ?? 0;
  if (c.rasgo === RASGO.MASA_COLOSAL) d += BALANCE.rasgos.masaColosalDefensa;
  return d;
}

function espinasHipoteticas(cardId) {
  const c = carta(cardId);
  let e = c.clado === CLADO.TIREOFORO ? BALANCE.clados.espinasTireoforo : 0;
  if (c.rasgo === RASGO.TAGOMIZADOR) e += BALANCE.rasgos.tagomizadorExtra;
  return e;
}

const bonusTrofico = (cladoA, cladoB) =>
  (BALANCE.clados.presaDe[cladoA] === cladoB ? BALANCE.clados.bonusDepredacion : 0);

// ------------------------------------------------------------------- valor

/** Cartas que le quedan a un bando. La vista redacta el mazo rival a un número. */
function mazoDe(vista, j) {
  const m = vista.jugadores[j].mazo;
  return typeof m === 'number' ? m : m.length;
}


/**
 * Qué pasa en una ranura si pongo ahí una carta con estas estadísticas.
 * Incluye el valor DEFENSIVO: tapar una ranura evita que el rival de enfrente
 * golpee tu habitat, y eso vale tanto como pegar.
 */
function valorEnRanura(vista, j, ranura, mio) {
  const b = unidadEn(vista, rival(j), ranura);
  const extraSabana = campoEs(vista, RASGO.CAMPO_SABANA) ? BALANCE.efectosCampo.sabanaDanoHabitat : 0;

  if (!b) {
    // Sin nadie enfrente golpea el habitat, y seguirá haciéndolo mientras aguante.
    // Se descuenta porque el rival puede taparlo el turno que viene.
    const turnos = 1 + (IA.horizonte - 1) * 0.5;
    return (mio.poder + extraSabana) * IA.pesoHabitat * turnos;
  }

  // Lo que ese rival me haría al habitat si dejo la ranura vacía.
  const evitado = danoAlHabitat(vista, b.iid) * IA.pesoHabitat;

  const dA = Math.max(0, mio.poder + bonusTrofico(mio.clado, carta(b.cardId).clado) - reduccionDe(vista, b.iid));
  const dB = Math.max(0, ataqueEfectivo(vista, b.iid)
    + bonusTrofico(carta(b.cardId).clado, mio.clado) - mio.reduccion) + mio.espinasRecibidas;

  const mata = dA + mio.espinasPropias >= vidaActual(vista, b.iid);
  const muere = dB >= mio.vida;

  // Cuántos turnos aguantará. Es la corrección que hace visibles a los muros.
  const turnos = muere ? 1 : Math.min(IA.horizonte, Math.ceil(mio.vida / Math.max(1, dB)));

  const ofensiva = mata ? IA.pesoTrofeo : dA * IA.pesoDano * turnos;
  const defensiva = evitado * turnos;
  const perdida = muere ? IA.pesoPerdida : 0;

  return ofensiva + defensiva - perdida;
}

function statsDeCarta(vista, j, cardId, rivalIid) {
  const c = carta(cardId);
  return {
    poder: ataqueHipotetico(vista, j, cardId),
    vida: c.vida,
    clado: c.clado,
    reduccion: reduccionHipotetica(cardId),
    espinasPropias: espinasHipoteticas(cardId),
    espinasRecibidas: rivalIid === null ? 0 : espinasDe(vista, rivalIid),
  };
}

function valorDeAccion(vista, j, a) {
  const contrario = rival(j);

  switch (a.tipo) {
    case ACCION.DESPLEGAR: {
      const cardId = vista.instancias[a.iid].cardId;
      const b = unidadEn(vista, contrario, a.ranura);
      const mio = statsDeCarta(vista, j, cardId, b ? b.iid : null);
      return valorEnRanura(vista, j, a.ranura, mio) - carta(cardId).coste * IA.pesoCoste;
    }

    case ACCION.MOVER: {
      const inst = vista.instancias[a.iid];
      const cardId = inst.cardId;
      const bDestino = unidadEn(vista, contrario, a.ranura);
      const bOrigen = unidadEn(vista, contrario, inst.ranura);
      const mio = statsDeCarta(vista, j, cardId, bDestino ? bDestino.iid : null);
      const mioOrigen = statsDeCarta(vista, j, cardId, bOrigen ? bOrigen.iid : null);
      return valorEnRanura(vista, j, a.ranura, mio) - valorEnRanura(vista, j, inst.ranura, mioOrigen);
    }

    case ACCION.EVENTO: {
      const cardId = vista.instancias[a.iid].cardId;
      const c = carta(cardId);
      const r = c.rasgo;
      let delta = 0;

      if (c.objetivo === OBJETIVO.PROPIO) {
        const objetivo = vista.instancias[a.objetivo];
        if (r === RASGO.CRECIMIENTO_ACELERADO) delta = BALANCE.rasgos.crecimientoAtaque + BALANCE.rasgos.crecimientoVida;
        else if (r === RASGO.NEUMATICIDAD) delta = BALANCE.rasgos.neumaticidadAtaque;
        else if (r === RASGO.GASTROLITOS) delta = BALANCE.rasgos.gastrolitosCura * 2;
        else if (r === RASGO.GREGARISMO) {
          delta = unidadesDe(vista, j).filter((u) => u.cardId === objetivo?.cardId).length
            * BALANCE.rasgos.gregarismoAtaque;
        }
      } else if (r === RASGO.FRACTURA) {
        delta = BALANCE.rasgos.fracturaAtaque;
      } else if (r === RASGO.COMPETENCIA) {
        delta = unidadesDe(vista, contrario).filter((u) => carta(u.cardId).clado === a.clado).length
          * BALANCE.rasgos.competenciaAtaque;
      } else if (r === RASGO.TRAMPA) {
        // Vale por lo que acerca al rival al mazo vacío, menos lo que te acerca
        // a ti. Con los dos mazos llenos casi no vale nada; al final, decide.
        const restante = mazoDe(vista, contrario);
        const acerca = BALANCE.rasgos.trampaMazoRival / Math.max(1, restante);
        const arriesga = BALANCE.rasgos.trampaMazoPropio / Math.max(1, mazoDe(vista, j));
        delta = (acerca - arriesga) * IA.pesoTrofeo / IA.pesoDano * 3;

      } else if (r === RASGO.MORTANDAD) {
        // Sólo interesa si mata a más rivales que propios.
        const mueren = (bando) => unidadesDe(vista, bando)
          .filter((u) => vidaActual(vista, u.iid) <= BALANCE.rasgos.mortandadDano).length;
        delta = (mueren(contrario) - mueren(j)) * IA.pesoTrofeo / IA.pesoDano;
      }

      return delta * IA.pesoDano * 2 - c.coste * IA.pesoCoste;
    }

    case ACCION.RECURSO: {
      // Un pulso vale por la Biomasa que desbloquea: cuántas cartas de la mano
      // pasarían a ser pagables. Se le resta el inconveniente.
      const cardId = vista.instancias[a.iid].cardId;
      const r = carta(cardId).rasgo;
      const P = BALANCE.recursos;
      let gana = 0; let cuesta = 0;
      if (r === RASGO.REBROTE) { gana = P.rebroteBiomasa; cuesta = unidadesDe(vista, j).length * P.rebroteHeridas * IA.pesoDano; }
      if (r === RASGO.CARRONA) { gana = P.carronaBiomasa; cuesta = P.carronaBiomasaRival * 0.6; }
      if (r === RASGO.LAGO) { gana = P.lagoBiomasa; cuesta = P.lagoHabitat * IA.pesoHabitat; }

      const biomasa = vista.jugadores[j].biomasa;
      const desbloquea = vista.jugadores[j].mano
        .filter((iid) => { const c = carta(vista.instancias[iid].cardId);
          return c.coste > biomasa && c.coste <= biomasa + gana; }).length;
      return desbloquea * 1.4 + gana * 0.25 - cuesta;
    }

    case ACCION.CLIMA: {
      const cardId = vista.instancias[a.iid].cardId;
      if (vista.campo === cardId) return -Infinity;
      const r = carta(cardId).rasgo;
      let valor = 0;
      if (r === RASGO.CAMPO_LLANURA) valor = BALANCE.efectosCampo.llanuraBiomasa * 1.2;
      if (r === RASGO.CAMPO_SABANA) {
        valor = (unidadesDe(vista, j).length - unidadesDe(vista, contrario).length) * IA.pesoHabitat;
      }
      if (r === RASGO.CAMPO_BOSQUE) {
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).clado === CLADO.SAUROPODO).length * 0.8;
      }
      if (r === RASGO.CAMPO_ARIDEZ) {
        // Es una carrera: sólo la pone quien va por delante en cartas.
        valor = (mazoDe(vista, contrario) - mazoDe(vista, j)) * 0.4;
      }
      if (r === RASGO.CAMPO_CANAL) {
        // Lo que de verdad hace: anular la Sequía. Se valora por las heridas
        // que ahorraría a los propios, más el empujón a los ribereños.
        const enRiesgo = unidadesDe(vista, j)
          .reduce((n, u) => n + carta(u.cardId).consumoHidrico, 0);
        valor = enRiesgo * IA.pesoDano * 1.5
          + unidadesDe(vista, j).filter((u) => carta(u.cardId).rasgo === RASGO.RIBERENO).length
            * BALANCE.rasgos.riberenoAtaque * IA.pesoDano;
      }
      // Un campo propio se queda puesto: paga varios turnos, no uno.
      return valor * IA.horizonte - carta(cardId).coste * IA.pesoCoste;
    }

    default:
      return 0;
  }
}

/** Descarte: suelta lo que menos valor tendría sobre el tablero. */
function peorCartaDeMano(vista, j) {
  const mano = vista.jugadores[j].mano;
  const opciones = legales(vista, j);
  let peor = mano[0];
  let peorValor = Infinity;
  for (const iid of mano) {
    const suyas = opciones.filter((a) => a.iid === iid && a.tipo !== ACCION.PASAR && a.tipo !== ACCION.DESCARTAR);
    const c = carta(vista.instancias[iid].cardId);
    const valor = suyas.length > 0
      ? Math.max(...suyas.map((a) => valorDeAccion(vista, j, a)))
      : (c.tipo === TIPO.DINOSAURIO ? c.ataque + c.vida : 2) - c.coste;
    if (valor < peorValor) { peorValor = valor; peor = iid; }
  }
  return peor;
}

/** @returns {{rng:number, accion:object|null}} */
export function decidir(vista, j, rng, perfil = PERFIL.HEURISTICA) {
  const opciones = legales(vista, j);
  if (opciones.length === 0) return { rng, accion: null };

  if (perfil === PERFIL.ALEATORIA) {
    const e = elegir(rng, opciones);
    return { rng: e.rng, accion: e.valor };
  }

  if (vista.fase === FASE.DESCARTE) {
    return { rng, accion: { tipo: ACCION.DESCARTAR, jugador: j, iid: peorCartaDeMano(vista, j) } };
  }

  let mejor = null;
  let mejorValor = IA.umbralJugar;
  for (const a of opciones) {
    if (a.tipo === ACCION.PASAR) continue;
    const valor = valorDeAccion(vista, j, a);
    if (valor > mejorValor) { mejorValor = valor; mejor = a; }
  }

  return { rng, accion: mejor ?? { tipo: ACCION.PASAR, jugador: j } };
}
