// DinoWar — reducer del motor: (estado, acción) → estado. Puro y sin DOM.
// Una acción ilegal NO lanza: devuelve el estado intacto con un evento
// RECHAZADA. Así ni la interfaz puede romper el motor ni la IA hacer trampa.

import { BALANCE } from '../data/balance.js';
import { TIPO, OBJETIVO, CLADO, RASGO, carta } from '../data/cards.js';
import {
  FASE, FASES_INTERACTIVAS, rival,
  ranuraValida, unidadesDe, ranurasLibres, buscablesDe, buscaEnElMazo, ataqueEfectivo,
  puedeReciclar, campoEs, mecanicaDe, inmuneA,
} from './state.js';
import { INMUNE } from '../data/mecanicas.js';
import { barajar } from './rng.js';
import { DIETA } from '../data/dietas.js';
import {
  MODO, modoActual as modoEconomia, puedePagar, pagar, devolver, ingresar,
  esCartaDeBiomasa, dietaDeCarta,
} from './economia.js';
import {
  ev, descartarDeMano,
  faseRenta, faseRobo, faseRevelacion, faseCombate, faseChequeo,
} from './resolve.js';

export const ACCION = Object.freeze({
  DESPLEGAR: 'DESPLEGAR',
  MOVER: 'MOVER',
  EVENTO: 'EVENTO',
  CLIMA: 'CLIMA',
  RECURSO: 'RECURSO',
  RETIRAR: 'RETIRAR',
  MULLIGAN: 'MULLIGAN',
  PASAR: 'PASAR',
  DESCARTAR: 'DESCARTAR',
  // Devolver una carta de la mano al fondo del mazo. Sólo con la Llanura de
  // inundación en el campo, una vez por turno y por jugador.
  RECICLAR: 'RECICLAR',
  AVANZAR: 'AVANZAR',
  // Sólo en las variantes de economía (BALANCE.economia.modo distinto de FIJA).
  BIOMASA: 'BIOMASA',       // bajar una carta de recurso (modo CARTAS)
  PRODUCIR: 'PRODUCIR',     // declarar qué produces el turno que viene (TIPADA)
});

const CLADOS = Object.values(CLADO);

/**
 * Cuántas cartas roba este cambio de mano. El primero sale gratis y a partir de
 * ahí cuesta una carta: sin penalización, el jugador barajaría hasta encontrar
 * la mano perfecta y el azar dejaría de existir.
 */
export function cartasTrasMulligan(jug) {
  return BALANCE.manoInicial + BALANCE.robo.normal - jug.mulligans;
}

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

  // Declarar producción no gasta carta ni Biomasa, así que se resuelve antes de
  // todo lo que da por hecho que la acción trae una carta de la mano.
  if (a.tipo === ACCION.PRODUCIR) {
    if (modoEconomia() !== MODO.TIPADA) return 'aquí la Biomasa no tiene tipo';
    if (a.produccion !== DIETA.CARNIVORO && a.produccion !== DIETA.HERBIVORO) {
      return 'sólo se produce vegetal o animal';
    }
    return null;
  }

  // Cambiar la mano inicial. Sólo en el turno 1 y antes de tocar nada: una vez
  // has comprometido una carta, el rival ya sabe algo de tu mano.
  if (a.tipo === ACCION.MULLIGAN) {
    if (s.turno !== 1) return 'la mano sólo se cambia en el primer turno';
    if (jug.pendientes.length > 0) return 'ya has comprometido una carta este turno';
    if (cartasTrasMulligan(jug) <= 0) return 'no quedan cambios de mano';
    return null;
  }

  const inst = s.instancias[a.iid];
  if (!inst) return 'carta inexistente';

  // Retirar lo comprometido antes de pasar. Nada de esto ha ocurrido todavía
  // —se resuelve en la revelación y el rival no ve qué es— así que devolverlo
  // no filtra nada. Lo que ya está boca arriba, un recurso, no se puede
  // deshacer: el rival lo ha visto y la Biomasa ya se ha podido gastar.
  if (a.tipo === ACCION.RETIRAR) {
    const p = jug.pendientes.find((x) => x.iid === a.iid);
    if (!p) return 'esa carta no está comprometida este turno';
    if (p.tipo === 'DESPLIEGUE'
      && jug.pendientes.some((x) => x.tipo === 'ADAPTACION' && x.objetivo === a.iid)) {
      return 'retira antes el evento que le has puesto encima';
    }
    return null;
  }

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

  // Reciclar no cuesta Biomasa, así que se resuelve antes del cobro: cobrar por
  // devolver una carta al mazo sería justo lo contrario de lo que hace falta
  // cuando vas corto.
  if (a.tipo === ACCION.RECICLAR) {
    if (!puedeReciclar(s, a.jugador)) {
      return campoEs(s, RASGO.CAMPO_LLANURA)
        ? 'ya has devuelto tu carta de este turno'
        : 'hace falta la Llanura de inundación en el campo';
    }
    return null;
  }

  if (a.tipo === ACCION.BIOMASA) {
    if (modoEconomia() !== MODO.CARTAS) return 'aquí la Biomasa no se juega, se cobra';
    if (!esCartaDeBiomasa(inst.cardId)) return 'esa carta no da Biomasa';
    if (jug.biomasaJugadaEsteTurno >= BALANCE.economia.cartas.porTurno) {
      return 'ya has bajado tu recurso de este turno';
    }
    return null;
  }
  if (esCartaDeBiomasa(inst.cardId)) return 'esa carta sólo se baja como recurso';

  // El coste ya no es una resta: en las economías tipadas un carnívoro no come
  // helechos por mucha Biomasa que tenga ahorrada.
  if (!puedePagar(jug, inst.cardId)) return 'Biomasa insuficiente';

  switch (a.tipo) {
    case ACCION.DESPLEGAR: {
      if (c.tipo !== TIPO.DINOSAURIO) return 'esa carta no se despliega en una ranura';
      if (!ranuraValida(a.ranura)) return 'ranura inexistente';
      if (s.ranuras[a.jugador][a.ranura] !== null) return 'esa ranura está ocupada';
      if (ranuraReservada(s, a.jugador, a.ranura)) return 'ya has comprometido esa ranura';

      // Coste añadido: hay cartas que además de Biomasa piden cartas de la
      // mano. Se comprueba ANTES de la búsqueda porque si no puedes pagarlo la
      // carta no llega a jugarse y no hay nada que buscar.
      const extra = mecanicaDe(inst.cardId)?.costeExtra;
      if (extra?.descartar) {
        const dan = a.descartes ?? [];
        if (!Array.isArray(dan) || dan.length !== extra.descartar) {
          return `esta carta pide descartar ${extra.descartar} cartas de tu mano`;
        }
        if (new Set(dan).size !== dan.length) return 'no puedes descartar dos veces la misma';
        for (const did of dan) {
          if (did === a.iid) return 'no puedes pagarla con ella misma';
          if (!jug.mano.includes(did)) return 'esa carta no está en tu mano';
        }
      }

      // La búsqueda es opcional en el sentido de que puede no haber nada que
      // buscar, pero si se nombra una carta tiene que valer.
      if (a.busca !== undefined && a.busca !== null) {
        if (!buscaEnElMazo(a.cardId ?? inst.cardId)) return 'esa carta no busca nada en el mazo';
        if (!buscablesDe(s, a.jugador, inst.cardId).includes(a.busca)) {
          return 'esa carta no está en tu mazo o no es de las que puede buscar';
        }
      }
      return null;
    }

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
        if (inmuneA(s, a.objetivo, INMUNE.EVENTO)) return 'a ése no le afectan tus eventos';
      } else if (c.objetivo === OBJETIVO.CLADO) {
        if (!CLADOS.includes(a.clado)) return 'clado inexistente';
      } else if (c.objetivo === OBJETIVO.RIVALES) {
        // Se permiten menos objetivos de los que admite la carta: si al rival
        // sólo le queda uno en pie, la carta sigue jugándose.
        const tope = BALANCE.rasgos.competenciaObjetivos;
        const os = a.objetivos ?? [];
        if (!Array.isArray(os) || os.length === 0) return 'elige al menos un dinosaurio rival';
        if (os.length > tope) return `esta carta alcanza a ${tope} como mucho`;
        if (new Set(os).size !== os.length) return 'no se puede señalar dos veces al mismo';
        for (const oid of os) {
          const o = s.instancias[oid];
          if (!o || o.dueno !== rival(a.jugador)) return 'el objetivo no es del rival';
          if (o.ranura === null) return 'el objetivo no está en el campo';
          if (inmuneA(s, oid, INMUNE.EVENTO)) return 'a ése no le afectan tus eventos';
        }
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

    // Bajar un recurso (modo CARTAS). Boca arriba y al instante, como las
    // cartas de recurso del set: la Biomasa que da se gasta este mismo turno.
    case ACCION.BIOMASA: {
      const cardId = s.instancias[action.iid].cardId;
      const t = BALANCE.economia.cartas;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.descarte.push(action.iid);
      jug.biomasaJugadaEsteTurno += 1;
      ingresar(jug, t.valor, dietaDeCarta(cardId) ?? DIETA.HERBIVORO);
      ev(s, 'BIOMASA', { jugador: action.jugador, cardId, biomasa: jug.biomasa });
      break;
    }

    // Declarar qué se produce el turno que viene (modo TIPADA). No cuesta nada
    // y no se ve: es la parte de la economía que también se juega a ciegas.
    case ACCION.PRODUCIR:
      jug.produccion = action.produccion === DIETA.CARNIVORO
        ? DIETA.CARNIVORO : DIETA.HERBIVORO;
      ev(s, 'PRODUCCION', { jugador: action.jugador, produccion: jug.produccion });
      break;

    case ACCION.DESPLEGAR: {
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: 'DESPLIEGUE', iid: action.iid, ranura: action.ranura });
      // El coste añadido se cobra AHORA, no en la revelación: es parte de jugar
      // la carta, igual que la Biomasa, y al rival le da lo mismo verlo —lo que
      // sigue oculto es qué carta ha bajado, no cuántas ha soltado—.
      const extra = mecanicaDe(s.instancias[action.iid].cardId)?.costeExtra;
      if (extra?.descartar) {
        for (const did of action.descartes ?? []) descartarDeMano(s, action.jugador, did);
        ev(s, 'COSTE_EXTRA', {
          jugador: action.jugador,
          cardId: s.instancias[action.iid].cardId,
          cartas: extra.descartar,
        });
      }
      // Lo buscado pasa del mazo a la mano ahora mismo: cuesta una carta de
      // mazo, igual que robar, y el mazo es el reloj de la extinción.
      if (action.busca !== undefined && action.busca !== null) {
        jug.mazo = jug.mazo.filter((x) => x !== action.busca);
        jug.mano.push(action.busca);
        ev(s, 'BUSQUEDA', {
          jugador: action.jugador,
          porCardId: s.instancias[action.iid].cardId,
          cardId: s.instancias[action.busca].cardId,
        });
      }
      break;
    }

    case ACCION.MOVER:
      jug.pendientes.push({ tipo: 'MOVIMIENTO', iid: action.iid, ranura: action.ranura });
      break;

    case ACCION.RECURSO:
      // Boca arriba y al instante: la Biomasa que da tiene que poder gastarse
      // este mismo turno, así que no puede esperar a la revelación.
      aplicarRecurso(s, action.jugador, action.iid);
      break;

    case ACCION.CLIMA:
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({ tipo: 'CAMPO', iid: action.iid });
      break;

    case ACCION.EVENTO: {
      const c = carta(s.instancias[action.iid].cardId);
      pagar(jug, s.instancias[action.iid].cardId);
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.pendientes.push({
        tipo: c.objetivo === OBJETIVO.PROPIO ? 'ADAPTACION' : 'PRESION',
        iid: action.iid,
        objetivo: action.objetivo ?? null,
        clado: action.clado ?? null,
        objetivos: action.objetivos ?? null,
      });
      break;
    }

    case ACCION.RETIRAR: {
      const p = jug.pendientes.find((x) => x.iid === action.iid);
      jug.pendientes = jug.pendientes.filter((x) => x !== p);
      // Un movimiento no costó Biomasa y la unidad nunca salió del campo:
      // retirarlo es sólo cancelar la orden.
      if (p.tipo !== 'MOVIMIENTO') {
        devolver(jug, s.instancias[action.iid].cardId);
        jug.mano.push(action.iid);
      }
      ev(s, 'RETIRADA', { jugador: action.jugador, iid: action.iid, tipo: p.tipo });
      break;
    }

    case ACCION.MULLIGAN: {
      const cuantas = cartasTrasMulligan(jug);
      // La mano vuelve al mazo y se baraja todo: si volviera al fondo, contar
      // cartas bastaría para saber qué le viene al rival.
      const b = barajar([...jug.mazo, ...jug.mano], s.rng);
      s.rng = b.rng;
      jug.mazo = b.lista;
      jug.mano = [];
      jug.mulligans += 1;
      for (let k = 0; k < cuantas && jug.mazo.length > 0; k++) jug.mano.push(jug.mazo.shift());
      ev(s, 'MULLIGAN', { jugador: action.jugador, cartas: jug.mano.length, numero: jug.mulligans });
      break;
    }

    case ACCION.PASAR:
      jug.listo = true;
      if (s.jugadores.every((j) => j.listo)) s.fase = FASE.REVELACION;
      break;

    // Devuelve una y ROBA una. Sin el robo era una pérdida seca —la carta salía
    // de la mano, iba al fondo de veinte y no volvía— y medido no la usaba
    // nadie: cero devoluciones en 300 partidas. Con el robo deja de ser
    // «pierdes una carta» y pasa a ser «cambias la que no puedes pagar».
    //
    // Al FONDO, no arriba: arriba te devolvería la misma que acabas de soltar.
    // Y el robo va DESPUÉS de meterla, para que en un mazo de una carta te
    // lleves la tuya y no se quede el mazo vacío.
    case ACCION.RECICLAR: {
      const cardId = s.instancias[action.iid].cardId;
      jug.mano = jug.mano.filter((x) => x !== action.iid);
      jug.mazo.push(action.iid);
      jug.recicladasEsteTurno += 1;
      const robada = jug.mazo.shift() ?? null;
      if (robada !== null) jug.mano.push(robada);
      ev(s, 'RECICLA', { jugador: action.jugador, iid: action.iid, cardId, robada });
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
/** La carta que más conviene rescatar, o null si esta carta no busca nada. */
function mejorBusqueda(s, j, cardId) {
  const opciones = buscablesDe(s, j, cardId);
  if (opciones.length === 0) return null;
  let mejor = opciones[0];
  for (const iid of opciones) {
    if (carta(s.instancias[iid].cardId).coste > carta(s.instancias[mejor].cardId).coste) mejor = iid;
  }
  return mejor;
}

/**
 * Qué cartas suelta de la mano para pagar el coste añadido, o null si no le
 * llegan. Las más baratas primero, y a igualdad la de menor iid: la misma
 * semilla tiene que dar la misma partida en el navegador y en el servidor.
 */
function pagoExtra(s, j, cardId, iid) {
  const extra = mecanicaDe(cardId)?.costeExtra;
  if (!extra?.descartar) return undefined;
  const resto = s.jugadores[j].mano.filter((x) => x !== iid);
  if (resto.length < extra.descartar) return null;
  return resto
    .sort((a, b) => carta(s.instancias[a].cardId).coste - carta(s.instancias[b].cardId).coste
      || a - b)
    .slice(0, extra.descartar);
}

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

  const cambiar = { tipo: ACCION.MULLIGAN, jugador: j };
  if (!validar(s, cambiar)) salida.push(cambiar);

  // Devolver una carta al mazo, si la Llanura de inundación está en el campo.
  if (puedeReciclar(s, j)) {
    for (const iid of jug.mano) salida.push({ tipo: ACCION.RECICLAR, jugador: j, iid });
  }

  // Declarar producción (TIPADA): dos opciones y ningún coste.
  if (modoEconomia() === MODO.TIPADA) {
    for (const produccion of [DIETA.HERBIVORO, DIETA.CARNIVORO]) {
      if (jug.produccion !== produccion) salida.push({ tipo: ACCION.PRODUCIR, jugador: j, produccion });
    }
  }

  const libres = ranurasLibres(s, j).filter((r) => !ranuraReservada(s, j, r));
  const propias = [
    ...unidadesDe(s, j).map((u) => u.iid),
    ...jug.pendientes.filter((p) => p.tipo === 'DESPLIEGUE').map((p) => p.iid),
  ];
  // Las inmunes a eventos se caen de la lista aquí y no en `validar`: los
  // eventos que apuntan al rival se ofrecen sin validar —son siempre legales—
  // así que sin esto la IA gastaría la carta contra alguien a quien no le hace
  // nada, y el jugador vería un objetivo que no lo es.
  const ajenas = unidadesDe(s, rival(j))
    .filter((u) => !inmuneA(s, u.iid, INMUNE.EVENTO))
    .map((u) => u.iid);

  for (const iid of jug.mano) {
    const c = carta(s.instancias[iid].cardId);

    if (c.tipo === TIPO.BIOMASA) {
      const a = { tipo: ACCION.BIOMASA, jugador: j, iid };
      if (!validar(s, a)) salida.push(a);
      continue;
    }
    // La comprobación es la de la economía activa, no una resta: en las
    // tipadas «me llega» y «me llega DE LO SUYO» no son lo mismo.
    if (!puedePagar(jug, s.instancias[iid].cardId)) continue;

    if (c.tipo === TIPO.DINOSAURIO) {
      // Si la carta busca, se ofrece ya elegido a quién: enumerar cada ranura
      // por cada carta buscable multiplicaría las opciones sin enseñarle nada
      // nuevo a la IA. Se coge la más cara, que es la que menos veces vas a
      // poder pagar por tu cuenta, y a igualdad la primera del mazo, para que
      // la misma semilla siga dando la misma partida.
      const busca = mejorBusqueda(s, j, s.instancias[iid].cardId);
      // Y lo mismo con el coste añadido: se ofrece ya pagado. Suelta lo más
      // barato que le queda en la mano, que es el criterio con el que la IA
      // descarta de todos modos cuando se pasa del límite.
      const descartes = pagoExtra(s, j, s.instancias[iid].cardId, iid);
      if (descartes === null) continue;
      for (const r of libres) {
        salida.push({ tipo: ACCION.DESPLEGAR, jugador: j, iid, ranura: r, busca, descartes });
      }
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
      } else if (c.objetivo === OBJETIVO.RIVALES) {
        // Se ofrece un solo par, el de los rivales que más pegan: enumerar
        // todas las combinaciones de dos entre cinco multiplicaría por diez las
        // opciones de la IA para elegir casi siempre lo mismo.
        const duros = [...ajenas]
          .sort((x, y) => ataqueEfectivo(s, y) - ataqueEfectivo(s, x))
          .slice(0, BALANCE.rasgos.competenciaObjetivos);
        if (duros.length) salida.push({ tipo: ACCION.EVENTO, jugador: j, iid, objetivos: duros });
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
