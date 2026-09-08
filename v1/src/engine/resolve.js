// Fases automáticas del turno. Todas estas funciones mutan un BORRADOR del
// estado (una copia ya hecha por reduce() en actions.js). Nunca se las llama
// sobre un estado compartido.

import { BALANCE } from '../data/balance.js';
import { RASGO, TIPO, carta } from '../data/cards.js';
import { barajar } from './rng.js';
import {
  FASE, MOTIVO_FIN, CAUSA_MUERTE,
  indiceZona, rival, zonaDef,
  dominacion, zonasDominadasPor, produccionDe, consumoHidricoDe,
  poderEfectivo, unidadesEnZona, inmuneSequia, haySequia,
} from './state.js';

export function ev(s, tipo, datos = {}) {
  s.eventos.push({ turno: s.turno, tipo, ...datos });
}

// ------------------------------------------------------------------ muertes

/**
 * Elimina una unidad del tablero. Devuelve true si murió de verdad.
 * "Masa colosal" absorbe únicamente bajas de combate: no se puede sobrevivir a
 * la deshidratación por ser grande.
 */
export function matar(s, iid, causa) {
  const inst = s.instancias[iid];
  if (!inst || inst.zona === null) return false;
  const c = carta(inst.cardId);

  if (causa !== CAUSA_MUERTE.SEQUIA && c.rasgo === RASGO.MASA_COLOSAL && !inst.colosalGastado) {
    inst.colosalGastado = true;
    ev(s, 'MASA_COLOSAL', { iid, cardId: inst.cardId, dueno: inst.dueno, zona: inst.zona });
    return false;
  }

  const zona = inst.zona;
  const z = s.zonas[indiceZona(zona)];
  z.unidades = z.unidades.filter((x) => x !== iid);

  for (const aid of inst.adherencias) {
    const a = s.instancias[aid];
    a.adheridoA = null;
    a.zona = null;
    a.pendienteCrecimiento = false;
    s.jugadores[a.dueno].descarte.push(aid);
  }
  inst.adherencias = [];

  // Se limpia el estado propio de la instancia: si la carta vuelve a entrar en
  // juego (sólo posible sin muerte permanente) lo hace como población nueva,
  // sin el +2 de Crecimiento acelerado ni la carga de Masa colosal.
  inst.zona = null;
  inst.modPoder = 0;
  inst.colosalGastado = false;
  inst.desplegadoEnTurno = null;

  // Con muerte permanente la carta abandona el juego. Es lo que convierte
  // "quedarse sin cartas" (D4) en una vía de derrota real y no en una anécdota.
  const extinta = BALANCE.muertePermanente;
  s.jugadores[inst.dueno][extinta ? 'extintos' : 'descarte'].push(iid);

  ev(s, 'MUERTE', { iid, cardId: inst.cardId, dueno: inst.dueno, zona, causa, extinta });
  return true;
}

/**
 * Oportunista: cada Ornitholestes que SIGA en pie en la zona cobra por cada
 * muerte real ocurrida en ella, sea de quien sea. Se cobra en bloque, después
 * de aplicar las muertes, para que el resultado no dependa del orden.
 */
export function cobrarOportunistas(s, zonaId, muertes) {
  if (muertes <= 0) return;
  for (const inst of unidadesEnZona(s, zonaId)) {
    if (carta(inst.cardId).rasgo !== RASGO.OPORTUNISTA) continue;
    const ganancia = muertes * BALANCE.rasgos.oportunistaBiomasaPorMuerte;
    s.jugadores[inst.dueno].biomasa += ganancia;
    ev(s, 'OPORTUNISTA', { jugador: inst.dueno, iid: inst.iid, zona: zonaId, biomasa: ganancia });
  }
}

/** Devuelve la carta de la mano al descarte (límite de mano). */
export function descartarDeMano(s, j, iid) {
  const jug = s.jugadores[j];
  jug.mano = jug.mano.filter((x) => x !== iid);
  jug.descarte.push(iid);
  ev(s, 'DESCARTE', { jugador: j, iid, cardId: s.instancias[iid].cardId });
}

// -------------------------------------------------------------------- robo

export function robar(s, j, n) {
  const jug = s.jugadores[j];
  for (let k = 0; k < n; k++) {
    if (jug.mazo.length === 0) {
      if (jug.descarte.length === 0) {
        // D4: sin mazo y sin descarte, quien debe robar pierde.
        jug.sinCartas = true;
        ev(s, 'SIN_CARTAS', { jugador: j });
        return;
      }
      const b = barajar(jug.descarte, s.rng);
      s.rng = b.rng;
      jug.mazo = b.lista;
      jug.descarte = [];
      ev(s, 'REBARAJADO', { jugador: j, cartas: jug.mazo.length });
    }
    const iid = jug.mazo.shift();
    jug.mano.push(iid);
    ev(s, 'ROBO', { jugador: j, iid });
  }
}

// ------------------------------------------------------------------- fases

/** Paso 1 (D1): la estación se voltea ANTES de la producción. */
export function faseEstacion(s) {
  s.estacion.actual = null;
  s.sequiaPendiente = [];

  if (s.turno >= BALANCE.turnoPrimeraEstacion) {
    if (s.estacion.mazo.length === 0) {
      const b = barajar(s.estacion.descarte, s.rng);
      s.rng = b.rng;
      s.estacion.mazo = b.lista;
      s.estacion.descarte = [];
    }
    s.estacion.actual = s.estacion.mazo.shift();
    s.estacion.descarte.push(s.estacion.actual);
    ev(s, 'ESTACION', { estacion: s.estacion.actual });
  }

  if (haySequia(s)) {
    for (let j = 0; j < 2; j++) {
      const coste = consumoHidricoDe(s, j);
      if (coste <= s.jugadores[j].agua) {
        s.jugadores[j].agua -= coste;
        ev(s, 'SEQUIA_PAGADA', { jugador: j, agua: coste });
      } else {
        s.sequiaPendiente.push(j);
      }
    }
  }

  s.fase = s.sequiaPendiente.length > 0 ? FASE.SEQUIA_PAGO : FASE.PRODUCCION;
}

export function faseProduccion(s) {
  for (let j = 0; j < 2; j++) {
    const p = produccionDe(s, j);
    const jug = s.jugadores[j];
    jug.biomasa += p.biomasa;
    jug.agua += p.agua;
    jug.territorio += p.territorio;
    ev(s, 'PRODUCCION', {
      jugador: j, biomasa: p.biomasa, agua: p.agua, territorio: p.territorio,
      suelo: p.suelo, zonas: p.detalle.map((d) => d.zona),
    });
  }
  s.fase = FASE.ROBO;
}

export function faseRobo(s) {
  for (let j = 0; j < 2; j++) {
    const dom = zonasDominadasPor(s, j);
    robar(s, j, dom.length === 0 ? BALANCE.robo.sinZonas : BALANCE.robo.normal);
  }
  if (s.jugadores.some((j) => j.sinCartas)) {
    finalizar(s, MOTIVO_FIN.SIN_CARTAS);
    return;
  }
  s.fase = FASE.DESPLIEGUE;
}

/** Paso 5: se voltea todo a la vez. Normales → (Emboscada) → Adaptaciones. */
export function faseRevelacion(s) {
  const pendientes = [];
  for (let j = 0; j < 2; j++) {
    for (const p of s.jugadores[j].pendientes) pendientes.push({ ...p, jugador: j });
    s.jugadores[j].pendientes = [];
  }

  const orden = { DESPLIEGUE: 0, REUBICACION: 1, ADAPTACION: 2 };
  pendientes.sort((a, b) => orden[a.tipo] - orden[b.tipo] || a.iid - b.iid);

  for (const p of pendientes) {
    const inst = s.instancias[p.iid];
    if (p.tipo === 'DESPLIEGUE') {
      inst.zona = p.zona;
      inst.desplegadoEnTurno = s.turno;
      s.zonas[indiceZona(p.zona)].unidades.push(p.iid);
      ev(s, 'REVELADA', { jugador: p.jugador, iid: p.iid, cardId: inst.cardId, zona: p.zona });
    } else if (p.tipo === 'REUBICACION') {
      const origen = inst.zona;
      if (origen === null) continue; // murió antes de moverse: imposible hoy, defensivo
      s.zonas[indiceZona(origen)].unidades = s.zonas[indiceZona(origen)].unidades.filter((x) => x !== p.iid);
      inst.zona = p.zona;
      s.zonas[indiceZona(p.zona)].unidades.push(p.iid);
      for (const aid of inst.adherencias) s.instancias[aid].zona = p.zona;
      ev(s, 'REUBICADA', { jugador: p.jugador, iid: p.iid, cardId: inst.cardId, desde: origen, hasta: p.zona });
    } else {
      const objetivo = s.instancias[p.objetivo];
      if (!objetivo || objetivo.zona === null) {
        // El objetivo ya no está en juego: la adaptación se pierde.
        s.jugadores[p.jugador].descarte.push(p.iid);
        ev(s, 'ADAPTACION_PERDIDA', { jugador: p.jugador, iid: p.iid });
        continue;
      }
      inst.adheridoA = objetivo.iid;
      inst.zona = objetivo.zona;
      objetivo.adherencias.push(p.iid);
      if (carta(inst.cardId).rasgo === RASGO.CRECIMIENTO_ACELERADO) inst.pendienteCrecimiento = true;
      ev(s, 'ADAPTACION', {
        jugador: p.jugador, iid: p.iid, cardId: inst.cardId,
        objetivo: objetivo.iid, objetivoCardId: objetivo.cardId, zona: objetivo.zona,
      });
    }
  }

  s.fase = FASE.RESOLUCION;
}

/**
 * Paso 6. Modelo A (D2): desgaste continuo. En toda zona donde ambos bandos
 * tengan unidades, el perdedor pierde su unidad de menor Poder — haya
 * desplegado o no ese turno.
 *
 * Todas las eliminaciones de una zona se seleccionan sobre el estado PREVIO a
 * la resolución y se aplican a la vez: así Stegosaurus tagomiza aunque sea él
 * la baja, y Allosaurus puede morir el mismo turno en que mata.
 */
export function faseResolucion(s) {
  for (const zdef of BALANCE.zonas) {
    const zonaId = zdef.id;
    const dom = dominacion(s).find((d) => d.zona === zonaId);

    ev(s, 'ZONA_RESUELTA', {
      zona: zonaId, poder: dom.poder, dominador: dom.dominador, disputada: dom.disputada,
    });

    if (!dom.disputada || dom.dominador === null) continue;

    const ganador = dom.dominador;
    const perdedor = rival(ganador);

    // Poder congelado antes de aplicar ninguna muerte.
    const poder = {};
    for (const inst of unidadesEnZona(s, zonaId)) poder[inst.iid] = poderEfectivo(s, inst.iid);

    const porPrioridadDeMuerte = (a, b) =>
      poder[a.iid] - poder[b.iid] ||
      (b.desplegadoEnTurno ?? 0) - (a.desplegadoEnTurno ?? 0) ||
      a.iid - b.iid;

    const colaPerdedor = unidadesEnZona(s, zonaId, perdedor).sort(porPrioridadDeMuerte);
    const colaGanador = unidadesEnZona(s, zonaId, ganador).sort(porPrioridadDeMuerte);

    const sentencias = [];
    const tomar = (cola, n, causa) => {
      for (let k = 0; k < n && cola.length > 0; k++) {
        sentencias.push({ iid: cola.shift().iid, causa });
      }
    };

    tomar(colaPerdedor, 1, CAUSA_MUERTE.COMBATE);

    const depredadores = unidadesEnZona(s, zonaId, ganador)
      .filter((u) => carta(u.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE).length;
    tomar(colaPerdedor, depredadores * BALANCE.rasgos.depredadorDominanteBajasExtra,
      CAUSA_MUERTE.DEPREDADOR_DOMINANTE);

    const tagomizadores = unidadesEnZona(s, zonaId, perdedor)
      .filter((u) => carta(u.cardId).rasgo === RASGO.TAGOMIZADOR).length;
    tomar(colaGanador, tagomizadores * BALANCE.rasgos.tagomizadorBajas, CAUSA_MUERTE.TAGOMIZADOR);

    let muertes = 0;
    for (const sent of sentencias) {
      if (matar(s, sent.iid, sent.causa)) muertes++;
    }

    cobrarOportunistas(s, zonaId, muertes);
  }

  // Crecimiento acelerado: +2 permanente si el objetivo sobrevivió al turno.
  for (const iid of Object.keys(s.instancias)) {
    const inst = s.instancias[iid];
    if (!inst.pendienteCrecimiento) continue;
    inst.pendienteCrecimiento = false;
    const objetivo = s.instancias[inst.adheridoA];
    if (objetivo && objetivo.zona !== null) {
      objetivo.modPoder += BALANCE.rasgos.crecimientoPoder;
      ev(s, 'CRECIMIENTO', { iid: objetivo.iid, cardId: objetivo.cardId, dueno: objetivo.dueno });
    }
  }

  s.fase = FASE.DESCARTE;
  if (!s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima)) s.fase = FASE.CHEQUEO;
}

export function faseChequeo(s) {
  const [a, b] = s.jugadores;

  if (a.territorio >= BALANCE.objetivoTerritorio || b.territorio >= BALANCE.objetivoTerritorio) {
    finalizar(s, MOTIVO_FIN.TERRITORIO);
    return;
  }
  if (s.turno >= BALANCE.limiteTurnos) {
    finalizar(s, MOTIVO_FIN.LIMITE_TURNOS);
    return;
  }

  s.turno += 1;
  s.eventos = [];
  s.estacion.actual = null;
  for (const jug of s.jugadores) {
    jug.listo = false;
    jug.pendientes = [];
    jug.desplieguesPorZona = BALANCE.zonas.map(() => 0);
  }
  s.fase = FASE.ESTACION;
}

/**
 * Cierra la partida. Desempate (§3.20): más Territorio; si persiste el empate,
 * gana el SEGUNDO jugador, que es quien cede la iniciativa.
 */
export function finalizar(s, motivo) {
  const [a, b] = s.jugadores;
  let ganador;

  if (motivo === MOTIVO_FIN.SIN_CARTAS && a.sinCartas !== b.sinCartas) {
    ganador = a.sinCartas ? 1 : 0;
  } else if (a.territorio !== b.territorio) {
    ganador = a.territorio > b.territorio ? 0 : 1;
  } else {
    ganador = 1;
  }

  s.ganador = ganador;
  s.motivoFin = motivo;
  s.fase = FASE.FIN;
  ev(s, 'FIN', { ganador, motivo, territorio: [a.territorio, b.territorio] });
}
