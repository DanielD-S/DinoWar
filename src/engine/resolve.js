// DinoWar — fases automáticas del turno.
// Todas estas funciones mutan un BORRADOR del estado (una copia ya hecha por
// reduce() en actions.js). Nunca se las llama sobre un estado compartido.

import { BALANCE } from '../data/balance.js';
import { RASGO, carta } from '../data/cards.js';
import { barajar } from './rng.js';
import {
  FASE, MOTIVO_FIN, CAUSA, rival,
  unidadEn, unidadesDe, todasLasUnidades,
  ataqueEfectivo, vidaActual, danoEntre, danoAlHabitat, espinasDe,
  curacionDe, rentaDe, inmuneSequia, haySequia, hayCrecida, campoEs,
} from './state.js';

export function ev(s, tipo, datos = {}) {
  s.eventos.push({ turno: s.turno, tipo, ...datos });
}

// ------------------------------------------------------------------ heridas

/** Aplica heridas. No mata por sí sola: las bajas se recogen en bloque. */
function herir(s, iid, cantidad, causa, porBando) {
  if (cantidad <= 0) return;
  const inst = s.instancias[iid];
  inst.heridas += cantidad;
  ev(s, 'DANO', { iid, cardId: inst.cardId, dueno: inst.dueno, cantidad, causa, porBando });
}

/**
 * Retira del campo a las unidades sin Vida. Cada baja es un trofeo para el
 * rival: es el registro fósil, el equivalente a los premios de Pokémon.
 */
function recogerBajas(s, causa) {
  let muertes = 0;

  for (const bando of [0, 1]) {
    s.ranuras[bando] = s.ranuras[bando].map((iid) => {
      if (iid === null || vidaActual(s, iid) > 0) return iid;

      const inst = s.instancias[iid];
      for (const aid of inst.adherencias) {
        const a = s.instancias[aid];
        a.adheridoA = null;
        s.jugadores[a.dueno].descarte.push(aid);
      }
      inst.adherencias = [];
      inst.ranura = null;
      inst.heridas = 0;
      inst.modAtaque = 0;
      inst.modVida = 0;
      inst.desplegadoEnTurno = null;
      s.jugadores[inst.dueno].descarte.push(iid);

      s.jugadores[rival(bando)].trofeos += 1;
      muertes += 1;
      ev(s, 'MUERTE', { iid, cardId: inst.cardId, dueno: bando, causa });
      return null;
    });
  }

  // Oportunista: el carroñero engorda con cada muerte del campo, sea de quien sea.
  if (muertes > 0) {
    const ganancia = muertes * BALANCE.rasgos.oportunistaVidaPorMuerte;
    for (const inst of todasLasUnidades(s)) {
      if (carta(inst.cardId).rasgo !== RASGO.OPORTUNISTA) continue;
      inst.modVida += ganancia;
      ev(s, 'OPORTUNISTA', { iid: inst.iid, dueno: inst.dueno, vida: ganancia });
    }
  }
  return muertes;
}

export function golpearHabitat(s, bando, cantidad) {
  if (cantidad <= 0) return;
  s.jugadores[bando].habitat -= cantidad;
  ev(s, 'HABITAT', { bando, cantidad, restante: s.jugadores[bando].habitat });
}

// -------------------------------------------------------------------- robo

export function robar(s, j, n) {
  const jug = s.jugadores[j];
  for (let k = 0; k < n; k++) {
    if (jug.mazo.length === 0) {
      if (!BALANCE.rebarajarDescarte || jug.descarte.length === 0) {
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
    jug.mano.push(jug.mazo.shift());
  }
}

// ------------------------------------------------------------------- fases

export function faseEstacion(s) {
  s.estacion.actual = null;

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

  // La sequía ya no cobra un recurso de bolsillo: cobra heridas. El Canal
  // fluvial, con agua permanente, la anula por completo.
  if (haySequia(s) && !campoEs(s, RASGO.CAMPO_CANAL)) {
    for (const inst of todasLasUnidades(s)) {
      if (inmuneSequia(inst)) continue;
      herir(s, inst.iid, carta(inst.cardId).consumoHidrico, CAUSA.SEQUIA, null);
    }
    recogerBajas(s, CAUSA.SEQUIA);
  }

  s.fase = FASE.RENTA;
}

export function faseRenta(s) {
  const renta = rentaDe(s);
  for (const jug of s.jugadores) {
    jug.biomasa = BALANCE.rentaAcumula ? jug.biomasa + renta : renta;
  }
  ev(s, 'RENTA', { biomasa: renta });
  s.fase = FASE.ROBO;
}

export function faseRobo(s) {
  for (let j = 0; j < 2; j++) robar(s, j, BALANCE.robo.normal);
  if (s.jugadores.some((j) => j.sinCartas)) {
    finalizar(s, MOTIVO_FIN.EXTINCION);
    return;
  }
  s.fase = FASE.DESPLIEGUE;
}

/** Se voltea todo a la vez: dinosaurios → movimientos → campo → adaptaciones → presiones. */
export function faseRevelacion(s) {
  const orden = { DESPLIEGUE: 0, MOVIMIENTO: 1, CAMPO: 2, ADAPTACION: 3, PRESION: 4 };
  const pendientes = [];
  for (let j = 0; j < 2; j++) {
    for (const p of s.jugadores[j].pendientes) pendientes.push({ ...p, jugador: j });
    s.jugadores[j].pendientes = [];
  }
  pendientes.sort((a, b) => orden[a.tipo] - orden[b.tipo] || a.iid - b.iid);

  for (const p of pendientes) {
    const inst = s.instancias[p.iid];

    if (p.tipo === 'DESPLIEGUE') {
      if (s.ranuras[p.jugador][p.ranura] !== null) {
        s.jugadores[p.jugador].descarte.push(p.iid);
        continue;
      }
      inst.ranura = p.ranura;
      inst.desplegadoEnTurno = s.turno;
      s.ranuras[p.jugador][p.ranura] = p.iid;
      ev(s, 'REVELADA', { jugador: p.jugador, iid: p.iid, cardId: inst.cardId, ranura: p.ranura });

    } else if (p.tipo === 'MOVIMIENTO') {
      if (inst.ranura === null || s.ranuras[p.jugador][p.ranura] !== null) continue;
      s.ranuras[p.jugador][inst.ranura] = null;
      s.ranuras[p.jugador][p.ranura] = p.iid;
      ev(s, 'MOVIDA', { jugador: p.jugador, iid: p.iid, cardId: inst.cardId, desde: inst.ranura, hasta: p.ranura });
      inst.ranura = p.ranura;

    } else if (p.tipo === 'CAMPO') {
      if (s.campo !== null) s.jugadores[s.campoDe].descarte.push(s.campoIid);
      s.campo = inst.cardId;
      s.campoIid = p.iid;
      s.campoDe = p.jugador;
      ev(s, 'CAMPO', { jugador: p.jugador, cardId: inst.cardId });

    } else if (p.tipo === 'ADAPTACION') {
      const objetivo = s.instancias[p.objetivo];
      if (!objetivo || objetivo.ranura === null) {
        s.jugadores[p.jugador].descarte.push(p.iid);
        ev(s, 'ADAPTACION_PERDIDA', { jugador: p.jugador, iid: p.iid });
        continue;
      }
      inst.adheridoA = objetivo.iid;
      objetivo.adherencias.push(p.iid);
      const r = carta(inst.cardId).rasgo;
      if (r === RASGO.CRECIMIENTO_ACELERADO) {
        objetivo.modAtaque += BALANCE.rasgos.crecimientoAtaque;
        objetivo.modVida += BALANCE.rasgos.crecimientoVida;
      }
      if (r === RASGO.NEUMATICIDAD) objetivo.modAtaque += BALANCE.rasgos.neumaticidadAtaque;
      ev(s, 'ADAPTACION', {
        jugador: p.jugador, iid: p.iid, cardId: inst.cardId,
        objetivo: objetivo.iid, objetivoCardId: objetivo.cardId,
      });

    } else if (p.tipo === 'PRESION') {
      aplicarPresion(s, p);
      s.jugadores[p.jugador].descarte.push(p.iid);
    }
  }

  recogerBajas(s, CAUSA.MORTANDAD);
  s.fase = FASE.COMBATE;
}

function aplicarPresion(s, p) {
  const cardId = s.instancias[p.iid].cardId;
  const r = carta(cardId).rasgo;
  const contrario = rival(p.jugador);

  if (r === RASGO.FRACTURA) {
    const objetivo = s.instancias[p.objetivo];
    if (!objetivo || objetivo.ranura === null) return;
    objetivo.modAtaque -= BALANCE.rasgos.fracturaAtaque;
    ev(s, 'PRESION', { jugador: p.jugador, cardId, objetivo: objetivo.iid, objetivoCardId: objetivo.cardId });

  } else if (r === RASGO.COMPETENCIA) {
    let n = 0;
    for (const inst of unidadesDe(s, contrario)) {
      if (carta(inst.cardId).clado !== p.clado) continue;
      inst.modAtaque -= BALANCE.rasgos.competenciaAtaque;
      n += 1;
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId, clado: p.clado, afectados: n });

  } else if (r === RASGO.MORTANDAD) {
    for (const inst of todasLasUnidades(s)) {
      herir(s, inst.iid, BALANCE.rasgos.mortandadDano, CAUSA.MORTANDAD, p.jugador);
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId });
  }
}

/**
 * Combate: ranura contra ranura. Todo el daño se calcula sobre el estado PREVIO
 * y se aplica a la vez, así que un intercambio mutuo puede matar a los dos.
 * Ranura enfrentada vacía = el ocupante golpea el habitat contrario.
 */
export function faseCombate(s) {
  // Primer turno sin combate: se despliega, se revela, y nadie pega.
  if (s.turno < BALANCE.turnoPrimerCombate) {
    ev(s, 'SIN_COMBATE', { turno: s.turno });
    s.fase = s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima) ? FASE.DESCARTE : FASE.CHEQUEO;
    return;
  }

  const golpes = [];
  const alHabitat = [0, 0];

  for (let r = 0; r < BALANCE.ranuras; r++) {
    const a = unidadEn(s, 0, r);
    const b = unidadEn(s, 1, r);

    if (a && b) {
      const dA = danoEntre(s, a.iid, b.iid);
      const dB = danoEntre(s, b.iid, a.iid);
      golpes.push({ iid: b.iid, cantidad: dA, causa: CAUSA.COMBATE, por: 0 });
      golpes.push({ iid: a.iid, cantidad: dB, causa: CAUSA.COMBATE, por: 1 });
      golpes.push({ iid: a.iid, cantidad: espinasDe(s, b.iid), causa: CAUSA.ESPINAS, por: 1 });
      golpes.push({ iid: b.iid, cantidad: espinasDe(s, a.iid), causa: CAUSA.ESPINAS, por: 0 });

      // Depredador dominante: lo que sobra al matar sigue hacia el habitat.
      if (carta(a.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE) {
        alHabitat[1] += Math.max(0, dA - vidaActual(s, b.iid));
      }
      if (carta(b.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE) {
        alHabitat[0] += Math.max(0, dB - vidaActual(s, a.iid));
      }

      ev(s, 'CHOQUE', { ranura: r, a: a.iid, b: b.iid, danoA: dA, danoB: dB });

    } else if (a) {
      const d = danoAlHabitat(s, a.iid);
      alHabitat[1] += d;
      ev(s, 'AVANCE', { ranura: r, iid: a.iid, bando: 0, dano: d });

    } else if (b) {
      const d = danoAlHabitat(s, b.iid);
      alHabitat[0] += d;
      ev(s, 'AVANCE', { ranura: r, iid: b.iid, bando: 1, dano: d });
    }
  }

  for (const g of golpes) herir(s, g.iid, g.cantidad, g.causa, g.por);
  recogerBajas(s, CAUSA.COMBATE);

  // La Crecida rehace el paisaje: este turno ningún habitat recibe daño.
  if (!hayCrecida(s)) {
    golpearHabitat(s, 0, alHabitat[0]);
    golpearHabitat(s, 1, alHabitat[1]);
  }

  for (const inst of todasLasUnidades(s)) {
    const cura = curacionDe(s, inst.iid);
    if (cura > 0 && inst.heridas > 0) {
      inst.heridas = Math.max(0, inst.heridas - cura);
      ev(s, 'CURACION', { iid: inst.iid, dueno: inst.dueno, cura });
    }
  }

  s.fase = s.jugadores.some((j) => j.mano.length > BALANCE.manoMaxima) ? FASE.DESCARTE : FASE.CHEQUEO;
}

export function descartarDeMano(s, j, iid) {
  const jug = s.jugadores[j];
  jug.mano = jug.mano.filter((x) => x !== iid);
  jug.descarte.push(iid);
  ev(s, 'DESCARTE', { jugador: j, iid, cardId: s.instancias[iid].cardId });
}

export function faseChequeo(s) {
  const [a, b] = s.jugadores;

  if (a.trofeos >= BALANCE.trofeosParaGanar || b.trofeos >= BALANCE.trofeosParaGanar) {
    finalizar(s, MOTIVO_FIN.TROFEOS);
    return;
  }
  if (a.habitat <= 0 || b.habitat <= 0) {
    finalizar(s, MOTIVO_FIN.HABITAT);
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
  }
  s.fase = FASE.ESTACION;
}

/**
 * Desempates: trofeos, luego habitat. A igualdad absoluta gana el PRIMER jugador,
 * que es quien no tiene ninguna otra ventaja: con despliegue simultáneo y renta
 * fija, la iniciativa no vale nada.
 */
export function finalizar(s, motivo) {
  const [a, b] = s.jugadores;
  let ganador;

  if (motivo === MOTIVO_FIN.EXTINCION && a.sinCartas !== b.sinCartas) {
    ganador = a.sinCartas ? 1 : 0;
  } else if (motivo === MOTIVO_FIN.TROFEOS && a.trofeos !== b.trofeos) {
    ganador = a.trofeos > b.trofeos ? 0 : 1;
  } else if (motivo === MOTIVO_FIN.HABITAT && a.habitat !== b.habitat) {
    ganador = a.habitat > b.habitat ? 0 : 1;
  } else if (a.trofeos !== b.trofeos) {
    ganador = a.trofeos > b.trofeos ? 0 : 1;
  } else if (a.habitat !== b.habitat) {
    ganador = a.habitat > b.habitat ? 0 : 1;
  } else {
    ganador = 0;
  }

  s.ganador = ganador;
  s.motivoFin = motivo;
  s.fase = FASE.FIN;
  ev(s, 'FIN', { ganador, motivo, trofeos: [a.trofeos, b.trofeos], habitat: [a.habitat, b.habitat] });
}
