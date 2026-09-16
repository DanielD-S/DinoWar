// DinoWar — IA rival. Heurística pura, sin ML.
//
// Recibe SIEMPRE una vista redactada (state.vistaDe): no ve la mano, el mazo ni
// el despliegue oculto del rival. Todo lo que estima sale de lo que cualquier
// jugador vería.

import { BALANCE } from '../data/balance.js';
import { valorDeEntrada } from './entradas.js';
import { TIPO, OBJETIVO, CLADO, RASGO, carta } from '../data/cards.js';
import {
  FASE, rival, unidadEn, unidadesDe,
  ataqueEfectivo, vidaActual, espinasDe, danoAlHabitat, campoEs, vuela, mecanicaDe,
} from './state.js';
import { QUE, CUANDO, TODOS } from '../data/mecanicas.js';
import { ACCION, legales } from './actions.js';
import { DIETA } from '../data/dietas.js';
import { puedePagar, dietaDeCarta, MODO, modoActual as modoEconomia } from './economia.js';
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
  return poder + pasivoHipotetico(vista, j, cardId).ataque;
}

/**
 * Lo que le sumarán a esta carta sus pasivos EN CUANTO ENTRE, calculado desde
 * la mano: cuenta lo que ya hay en el campo y se cuenta a sí misma, porque va a
 * estar. Sin esto la IA tasa a Medusaceratops por sus cifras impresas y no
 * entiende por qué el segundo Stegosaurus vale más que el primero.
 *
 * Es una estimación y no la verdad: `ataqueEfectivo` y `vidaMaxima` son las que
 * mandan una vez la carta está puesta. Lo que se busca aquí es sólo que la IA
 * no las ignore.
 */
function pasivoHipotetico(vista, j, cardId) {
  const c = carta(cardId);
  const m = mecanicaDe(cardId);
  let ataque = 0;
  let vida = 0;
  if (!m) return { ataque, vida };

  if (m.cuenta) {
    const bandos = m.cuenta.ambos ? [0, 1] : [j];
    let n = 1;   // ella misma, que es la que está a punto de entrar
    for (const b of bandos) {
      for (const u of unidadesDe(vista, b)) {
        const uc = carta(u.cardId);
        if (m.cuenta.que === QUE.CLADO ? uc.clado === c.clado : u.cardId === cardId) n += 1;
      }
    }
    ataque += n * (m.cuenta.ataque ?? 0);
    vida += n * (m.cuenta.vida ?? 0);
  }

  if (m.si) {
    const jug = vista.jugadores[j];
    const otro = vista.jugadores[rival(j)];
    const vale = m.si.cuando === CUANDO.CLIMA ? vista.campo !== null
      : m.si.cuando === CUANDO.HABITAT_DETRAS ? jug.habitat < otro.habitat
        : unidadesDe(vista, j).some((u) => carta(u.cardId).vida > m.si.umbral);
    if (vale) { ataque += m.si.ataque ?? 0; vida += m.si.vida ?? 0; }
  }

  // El aura se la da a sí misma si es de su clado, y también a los que ya están
  // puestos — pero eso último no se tasa aquí: esto valora UNA carta.
  if (m.aura && (m.aura.clado === TODOS || m.aura.clado === c.clado)) {
    ataque += m.aura.ataque ?? 0;
    vida += m.aura.vida ?? 0;
  }
  for (const u of unidadesDe(vista, j)) {
    const a = mecanicaDe(u.cardId)?.aura;
    if (!a || (a.clado !== TODOS && a.clado !== c.clado)) continue;
    ataque += a.ataque ?? 0;
    vida += a.vida ?? 0;
  }

  return { ataque, vida };
}

const espinasHipoteticas = (cardId) => mecanicaDe(cardId)?.espinas ?? 0;

const bonusTrofico = () => 0;

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
  if (!b) {
    // Sin nadie enfrente golpea el habitat, y seguirá haciéndolo mientras aguante.
    // Se descuenta porque el rival puede taparlo el turno que viene.
    const turnos = 1 + (IA.horizonte - 1) * 0.5;
    return mio.poder * IA.pesoHabitat * turnos;
  }

  // Lo que vuela no negocia con la ranura: pasa por encima. Vale su daño al
  // habitat sin riesgo, pero no tapa nada, así que lo de enfrente también pasa.
  if (mio.vuela) {
    const turnos = 1 + (IA.horizonte - 1) * 0.5;
    return mio.poder * IA.pesoHabitat * turnos;
  }

  // Si el de enfrente vuela, esta ranura está de hecho vacía para mí.
  if (vuela(vista, b.iid)) {
    const turnos = 1 + (IA.horizonte - 1) * 0.5;
    return mio.poder * IA.pesoHabitat * turnos;
  }

  // Lo que ese rival me haría al habitat si dejo la ranura vacía. Con `j` de
  // defensor, para que la guardia propia se descuente: si no, la IA sobrevalora
  // tapar ranuras cuando ya tiene puesto quien amortigua.
  const evitado = danoAlHabitat(vista, b.iid, j) * IA.pesoHabitat;

  const dA = Math.max(0, mio.poder + bonusTrofico(mio.clado, carta(b.cardId).clado));
  const dB = Math.max(0, ataqueEfectivo(vista, b.iid)
    + bonusTrofico(carta(b.cardId).clado, mio.clado)) + mio.espinasRecibidas;

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
    vida: c.vida + pasivoHipotetico(vista, j, cardId).vida,
    clado: c.clado,
    vuela: c.rasgo === RASGO.VUELO,
    espinasPropias: espinasHipoteticas(cardId),
    espinasRecibidas: rivalIid === null ? 0 : espinasDe(vista, rivalIid),
  };
}

/**
 * Lo que vale amortiguar el hábitat. No sube ni el Ataque ni la Vida de quien lo
 * trae, así que `pasivoHipotetico` no lo ve y sin esto la IA no bajaría nunca la
 * carta — el mismo agujero que dejó a la Llanura con cero usos en 300 partidas.
 *
 * Se tasa por lo que de verdad ahorra: un punto por cada dinosaurio rival que
 * hoy podría llegar al hábitat, y por los turnos que se espera que aguante.
 */
function valorDeGuardia(vista, j, cardId) {
  const g = mecanicaDe(cardId)?.guardia?.habitat ?? 0;
  if (!g) return 0;
  const amenazas = Math.max(1, unidadesDe(vista, rival(j)).length);
  return g * amenazas * IA.pesoHabitat * IA.horizonte;
}

function valorDeAccion(vista, j, a) {
  const contrario = rival(j);

  switch (a.tipo) {
    // Bajar la Biomasa del turno es como jugar la tierra en Magic: casi nunca
    // hay nada mejor que hacer con esa acción, porque no compite con jugar
    // cartas — compite con no poder jugarlas el turno que viene.
    //
    // Con el mazo en las últimas deja de compensar, y por un margen enorme: la
    // Pradera muerde tu propio mazo, así que la última copia se cambia por un
    // punto de Biomasa y la derrota por extinción.
    //
    // Con varias en la mano, primero la que más da: sólo una se baja por turno
    // y las otras esperan igual. Y la que muele tres pide tres de reserva.
    case ACCION.BIOMASA: {
      const { da, muele: cuesta } = carta(vista.instancias[a.iid].cardId).biomasa;
      const muele = modoEconomia() === MODO.CARTAS ? 0 : cuesta;
      if (muele > 0 && vista.jugadores[j].mazo.length <= IA.mazoDeReserva + muele - 1) return -Infinity;
      return 100 + da;
    }

    // Declarar producción no cuesta nada, así que la pregunta no es «¿vale la
    // pena?» sino «¿de cuál me falta?». Se mira la mano: qué tipo desbloquea
    // más Biomasa de cartas que ahora mismo no puedo pagar. A igualdad, vegetal,
    // que renta el doble.
    case ACCION.PRODUCIR: {
      const jug = vista.jugadores[j];
      let bloqueadoCarne = 0;
      let bloqueadoPlanta = 0;
      for (const iid of jug.mano) {
        const cardId = vista.instancias[iid].cardId;
        if (puedePagar(jug, cardId)) continue;
        const d = dietaDeCarta(cardId);
        if (d === DIETA.CARNIVORO) bloqueadoCarne += carta(cardId).coste;
        else bloqueadoPlanta += carta(cardId).coste;
      }
      const quiere = bloqueadoCarne > bloqueadoPlanta ? DIETA.CARNIVORO : DIETA.HERBIVORO;
      return a.produccion === quiere ? 1 : -1;
    }

    case ACCION.DESPLEGAR: {
      const cardId = vista.instancias[a.iid].cardId;
      const b = unidadEn(vista, contrario, a.ranura);
      const mio = statsDeCarta(vista, j, cardId, b ? b.iid : null);
      // La habilidad de entrada se suma APARTE y sin multiplicar por los turnos
      // que aguante: se dispara una vez y punto. Ahí está media gracia de esta
      // forma de rasgo — lo pasivo se infla con `IA.horizonte` y por eso el
      // ajuste de cobertura llegó a «decir» que la Defensa valía 4 veces el
      // Ataque. Y sin este sumando la IA las ignoraría, que es lo que le pasó a
      // la Llanura hasta que se le puso número: cero usos en 300 partidas.
      return valorEnRanura(vista, j, a.ranura, mio)
        + valorDeEntrada(cardId)
        + valorDeGuardia(vista, j, cardId)
        - carta(cardId).coste * IA.pesoCoste;
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
        // Ya no muerde el Ataque de un clado entero, sino la Defensa de dos
        // señalados: vale por lo que dejan de parar, no por lo que dejan de pegar.
        delta = (a.objetivos ?? []).length * BALANCE.rasgos.competenciaDefensa;
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

      // Los seis de la ronda de las cien cartas mueven cartas, y una carta en
      // la mano se tasa como en `valorEntrada.roba`: algo más que un punto.
      } else if (r === RASGO.SABANA_HELECHOS) {
        delta = BALANCE.rasgos.sabanaHelechosRoba * 0.7 - BALANCE.rasgos.sabanaHelechosDescarta * 0.5;
      } else if (r === RASGO.NIDO) {
        delta = BALANCE.rasgos.nidoRoba * 0.7;
      } else if (r === RASGO.INUNDACION) {
        const acerca = BALANCE.rasgos.inundacionMazo / Math.max(1, mazoDe(vista, contrario));
        const arriesga = BALANCE.rasgos.inundacionMazo / Math.max(1, mazoDe(vista, j));
        delta = (acerca - arriesga) * IA.pesoTrofeo / IA.pesoDano * 3 + BALANCE.rasgos.inundacionRoba * 0.7;
      } else if (r === RASGO.CANAL_TRENZADO) {
        delta = unidadesDe(vista, j)
          .reduce((n, u) => n + Math.min(u.heridas, BALANCE.rasgos.canalTrenzadoCura), 0) * 0.5;
      } else if (r === RASGO.BOSQUE_RIBERENO) {
        delta = Math.min(BALANCE.rasgos.bosqueRiberenoMano, vista.jugadores[contrario].mano.length) * 0.6;
      // La ronda del control. Ninguno mueve una cifra del campo, así que se
      // tasan por cartas: una carta en la mano vale algo más que un punto
      // —`valorEntrada.roba`— y una carta menos en la del rival, parecido.
      } else if (r === RASGO.TORMENTA_POLVO) {
        // Reparte lo mismo a los dos, así que vale la DIFERENCIA: lo que te
        // sube a ti menos lo que le sube a él. Con la mano llena es una carta
        // muerta, y con la mano seca y el rival cargado, la mejor del mazo.
        const n = BALANCE.rasgos.tormentaPolvoRoba;
        const mia = vista.jugadores[j].mano.filter((iid) => iid !== a.iid).length;
        delta = (Math.min(n, mazoDe(vista, j) + mia) - mia) * 0.7
          - Math.max(0, n - vista.jugadores[contrario].mano.length) * 0.5;

      } else if (r === RASGO.AVENIDA_LODO) {
        delta = Math.max(0, vista.jugadores[contrario].mano.length - BALANCE.rasgos.avenidaLodoTope) * 0.7;

      } else if (r === RASGO.ENTERRAMIENTO) {
        delta = Math.min(BALANCE.rasgos.enterramientoRescata,
          vista.jugadores[j].descarte.length) * 0.8;

      } else if (r === RASGO.CAUCE_ABANDONADO) {
        // Suelta antes de robar, así que lo que gana es la diferencia. Plana a
        // propósito: mirar si lo soltado se podía pagar exigiría saber QUÉ se
        // suelta, y se sortea al resolver. La IA no puede tasar un azar que
        // todavía no ha ocurrido, y fingir que sí es peor que no intentarlo.
        delta = BALANCE.rasgos.cauceRoba * 0.7 - BALANCE.rasgos.cauceDescarta * 0.5;

      } else if (r === RASGO.BARRERA_TRONCOS) {
        const mia = vista.jugadores[j].mano.filter((iid) => iid !== a.iid).length;
        const doble = vista.jugadores[contrario].mano.length > mia;
        const cartas = BALANCE.rasgos.barreraMazo * (doble ? 2 : 1);
        delta = cartas / Math.max(1, mazoDe(vista, contrario)) * IA.pesoTrofeo / IA.pesoDano * 3;

      // La ronda del rebote. Lo que se le quita del campo al rival se tasa como
      // se tasa una unidad puesta —no es matarla, pero es hacerle pagar otra
      // vez el turno y la Biomasa—, y lo que se devuelve al mazo, por lo poco
      // que vale alargarlo mientras sobren cartas.
      } else if (r === RASGO.CENIZA) {
        delta = BALANCE.rasgos.cenizaMazo / Math.max(1, mazoDe(vista, contrario))
          * IA.pesoTrofeo / IA.pesoDano * 3;

      } else if (r === RASGO.SEDIMENTO) {
        delta = BALANCE.rasgos.sedimentoMazo / Math.max(1, mazoDe(vista, contrario))
            * IA.pesoTrofeo / IA.pesoDano * 3
          + Math.min(BALANCE.rasgos.sedimentoMano, vista.jugadores[contrario].mano.length) * 0.6;

      } else if (r === RASGO.OSARIO || r === RASGO.CARRONEROS) {
        // Alargar el mazo sólo vale cuando el mazo se acaba; con cuarenta
        // cartas dentro, dos más no cambian ninguna partida. Por eso se mide
        // contra lo que queda y no en absoluto.
        const n = r === RASGO.OSARIO
          ? BALANCE.rasgos.osarioEntierra
          : BALANCE.rasgos.carronerosEntierra;
        const devueltas = Math.min(n, vista.jugadores[j].descarte.length);
        delta = devueltas * (12 / Math.max(1, mazoDe(vista, j)))
          + (r === RASGO.CARRONEROS ? BALANCE.rasgos.carronerosRoba * 0.7 : 0);

      } else if (r === RASGO.OLEADA) {
        delta = BALANCE.rasgos.oleadaHabitat * IA.pesoHabitat;

      } else if (r === RASGO.ESTAMPIDA) {
        // Barre a los dos bandos, así que vale la diferencia. Lo del rival se
        // tasa entero y lo tuyo a la mitad: lo tuyo vuelve a tu mano y lo suyo
        // también a la suya, pero el que eligió el momento eres tú.
        const cabe = (u) => carta(u.cardId).ataque <= BALANCE.rasgos.estampidaAtaqueMax;
        delta = unidadesDe(vista, contrario).filter(cabe).length * 1.2
          - unidadesDe(vista, j).filter(cabe).length * 0.6;

      } else if (r === RASGO.MIGRACION) {
        // Sólo vale si hay a quién recoger, y vale más cuanto peor lo lleve.
        const mio = unidadesDe(vista, j)
          .map((u) => vidaActual(vista, u.iid)).sort((a, b) => a - b)[0];
        delta = (mio === undefined ? 0 : 1.2) + BALANCE.rasgos.migracionRoba * 0.7;

      } else if (r === RASGO.CRECIDA_DELTA) {
        const cabe = unidadesDe(vista, contrario)
          .filter((u) => carta(u.cardId).ataque <= BALANCE.rasgos.crecidaAtaqueMax);
        delta = cabe.length > 0 ? 2.2 : 0;

      // La ronda del hábitat. Se tasa como `curaHabitat` y el golpe al entrar:
      // por `IA.pesoHabitat`, que es lo que vale un punto de hábitat rival.
      } else if (r === RASGO.INCENDIO) {
        delta = BALANCE.rasgos.incendioHabitat * IA.pesoHabitat;

      } else if (r === RASGO.ACUIFERO) {
        const { acuiferoPorDino, acuiferoTope } = BALANCE.rasgos;
        delta = Math.min(acuiferoTope, unidadesDe(vista, j).length * acuiferoPorDino)
          * IA.pesoHabitat;

      } else if (r === RASGO.DERIVA_ARIDA) {
        // Vale cuando el rival tiene más mano que tú, o la tuya no se puede
        // pagar: lo que se suelta no se pierde, se cambia.
        const mia = vista.jugadores[j].mano.filter((iid) => iid !== a.iid);
        const impagables = mia.filter((iid) => carta(vista.instancias[iid].cardId).coste > vista.jugadores[j].biomasa + 2).length;
        delta = (vista.jugadores[contrario].mano.length - mia.length) * 0.4 + impagables * 0.4;
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
      if (r === RASGO.INSECTOS) { gana = P.insectosBiomasa; cuesta = -P.insectosRoba * 0.7; }
      if (r === RASGO.MANADA_PASO) { gana = P.manadaPasoBiomasa; cuesta = P.manadaPasoMazo * 0.15; }
      if (r === RASGO.FRUTOS) { gana = P.frutosBiomasa; cuesta = P.frutosRobaRival * 0.8; }
      if (r === RASGO.CANTERA) { gana = P.canteraBiomasa; cuesta = P.canteraMazo * 0.15; }

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
      // La sabana hace lo mismo que la llanura: Biomasa para los dos.
      if (r === RASGO.CAMPO_SABANA) valor = BALANCE.efectosCampo.sabanaBiomasa * 1.2;
      if (r === RASGO.CAMPO_BOSQUE) {
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).clado === CLADO.SAUROPODO).length * 0.8;
      }
      if (r === RASGO.CAMPO_ARIDEZ) {
        // Tres turnos y una carta por turno: vale una partida sólo cuando el
        // mazo rival está a punto de acabarse y el tuyo no; el resto del
        // tiempo es acercar la extinción un poco a quien va por delante.
        const { aridezMazo, aridezTurnos } = BALANCE.efectosCampo;
        const rivalMazo = mazoDe(vista, contrario);
        const remata = rivalMazo <= aridezTurnos * (aridezMazo + BALANCE.robo.normal)
          && rivalMazo < mazoDe(vista, j);
        valor = remata ? 4 : Math.max(0, rivalMazo - mazoDe(vista, j)) * 0.15;
      }
      if (r === RASGO.CAMPO_CANAL) {
        // Ya sólo vale por los ribereños que tengas en pie: sin estaciones no
        // hay Sequía que anular, que era la otra mitad de su valor.
        valor = unidadesDe(vista, j).filter((u) => carta(u.cardId).rasgo === RASGO.RIBERENO).length
          * BALANCE.rasgos.riberenoAtaque * IA.pesoDano;
      }
      // Un campo propio se queda puesto: paga varios turnos, no uno. Si caduca,
      // paga como mucho los que dura.
      const turnos = Math.min(IA.horizonte, carta(cardId).duracion ?? IA.horizonte);
      return valor * turnos - carta(cardId).coste * IA.pesoCoste;
    }

    // Devolver una carta al mazo (Llanura de inundación). No es una jugada
    // ofensiva: es alargar el mazo. Vale algo sólo cuando el mazo escasea, y
    // sólo si lo que se devuelve no se iba a poder jugar.
    //
    // Se puntúa por debajo del umbral cuando queda mazo de sobra, para que la
    // IA no se dedique a reciclar en el turno 2 teniendo cosas que desplegar.
    case ACCION.RECICLAR: {
      const mazo = vista.jugadores[j].mazo.length;
      if (mazo > IA.reciclaDesdeMazo) return 0;
      const c = carta(vista.instancias[a.iid].cardId);
      const alcanzable = c.coste <= vista.jugadores[j].biomasa + IA.horizonte;
      if (alcanzable) return 0;
      // Cuanto menos mazo queda, más urge: en 0 se pierde la partida.
      return (IA.reciclaDesdeMazo - mazo) / IA.reciclaDesdeMazo;
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
/** ¿Hay algo en la mano que se pueda pagar en los dos primeros turnos? */
function manoImpagable(vista, j) {
  return !vista.jugadores[j].mano.some((iid) => carta(vista.instancias[iid].cardId).coste <= 2);
}

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

  // Cambiar la mano inicial es una decisión de sí o no, no una jugada que se
  // pueda puntuar contra las demás: se resuelve con una regla y aparte. Una
  // mano de la que no puedes pagar nada en los dos primeros turnos no es una
  // mano, es un turno perdido.
  const cambiar = opciones.find((a) => a.tipo === ACCION.MULLIGAN);
  if (cambiar && manoImpagable(vista, j)) return { rng, accion: cambiar };

  let mejor = null;
  let mejorValor = IA.umbralJugar;
  for (const a of opciones) {
    if (a.tipo === ACCION.PASAR) continue;
    const valor = valorDeAccion(vista, j, a);
    if (valor > mejorValor) { mejorValor = valor; mejor = a; }
  }

  return { rng, accion: mejor ?? { tipo: ACCION.PASAR, jugador: j } };
}
