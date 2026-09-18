// DinoWar — fases automáticas del turno.
// Todas estas funciones mutan un BORRADOR del estado (una copia ya hecha por
// reduce() en actions.js). Nunca se las llama sobre un estado compartido.

import { BALANCE } from '../data/balance.js';
import { RASGO, carta } from '../data/cards.js';
import { barajar, entero } from './rng.js';
import { MODO, modoActual as economiaModo, rentaTipada, ingresar } from './economia.js';
import {
  FASE, MOTIVO_FIN, CAUSA, rival,
  unidadEn, unidadesDe, todasLasUnidades,
  ataqueEfectivo, vidaActual, danoEntre, espinasDe,
  curacionDe, curacionPropia, rentaDe, hayAridez, campoEs, vuela, mecanicaDe, inmuneA, guardiaDe,
  ajustarGolpeDeLugar, sobranteDeLugar,
} from './state.js';
import { efectoDeLugar } from '../data/lugares.js';
import { alEntrar } from './entradas.js';

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
      inst.marcas = [];
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
      marcar(inst, inst.cardId, 0, ganancia);
      ev(s, 'OPORTUNISTA', { iid: inst.iid, dueno: inst.dueno, vida: ganancia });
    }
  }
  return muertes;
}

/**
 * Deja constancia de quién le ha cambiado las cifras a una unidad. Varias
 * copias de la misma carta se acumulan en un solo apunte: «Competencia trófica
 * ×2, −4 de Ataque» se lee mejor que dos renglones iguales.
 */
export function marcar(inst, cardId, ataque, vida) {
  const previo = inst.marcas.find((m) => m.cardId === cardId);
  if (previo) {
    previo.ataque += ataque; previo.vida += vida; previo.veces += 1;
    return;
  }
  inst.marcas.push({ cardId, ataque, vida, veces: 1 });
}

export function golpearHabitat(s, bando, cantidad) {
  if (cantidad <= 0) return;
  s.jugadores[bando].habitat -= cantidad;
  ev(s, 'HABITAT', { bando, cantidad, restante: s.jugadores[bando].habitat });
}

// -------------------------------------------------------------------- robo

/**
 * Saca cartas del mazo directas al descarte, sin pasar por la mano. Es lo que
 * convierte la extinción en una vía que se puede buscar: con 50 cartas y robo
 * de 1, el mazo por sí solo no se vacía antes del turno 44 y las partidas duran
 * once. Van al descarte, que es público, así que el rival ve lo que ha perdido.
 */
export function perderDelMazo(s, j, n) {
  const jug = s.jugadores[j];
  const perdidas = Math.min(n, jug.mazo.length);
  for (let k = 0; k < perdidas; k++) jug.descarte.push(jug.mazo.shift());
  if (perdidas > 0) {
    ev(s, 'MAZO_PERDIDO', { jugador: j, cartas: perdidas, restante: jug.mazo.length });
  }
}

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

export function faseRenta(s) {
  for (const jug of s.jugadores) {
    jug.biomasaJugadaEsteTurno = 0;
    jug.recicladasEsteTurno = 0;
  }

  // CARTAS: la renta no existe, la Biomasa la traen las cartas de recurso.
  // Sólo se reparte el fondo de salida, para que el turno 1 no sea en blanco.
  if (economiaModo() === MODO.CARTAS) {
    if (s.turno === 1) {
      for (const jug of s.jugadores) {
        jug.biomasa = 0;
        jug.animal = 0;
      }
    }
    ev(s, 'RENTA', { biomasa: 0, modo: MODO.CARTAS });
    s.fase = FASE.ROBO;
    return;
  }

  // El primer turno no cobra renta: reparte el fondo inicial.
  const renta = s.turno === 1 ? BALANCE.biomasaInicial : rentaDe(s);

  // TIPADA: la renta es la misma para los dos y está garantizada —eso no se
  // toca, es la corrección de la v2—, pero viene con tipo, y el tipo lo eligió
  // cada uno el turno pasado. Producir animal renta menos que producir vegetal.
  if (economiaModo() === MODO.TIPADA) {
    for (const jug of s.jugadores) {
      const { cantidad, tipo } = rentaTipada(jug.produccion);
      const escala = s.turno === 1 ? BALANCE.biomasaInicial / BALANCE.rentaPorTurno : 1;
      if (!BALANCE.rentaAcumula || s.turno === 1) { jug.biomasa = 0; jug.animal = 0; }
      ingresar(jug, Math.round(cantidad * escala), tipo);
      // La declaración se consume: sin volver a declarar, se sigue produciendo
      // lo mismo. Un turno despistado no te deja a cero, te deja sin cambiar.
    }
    ev(s, 'RENTA', { biomasa: renta, modo: MODO.TIPADA });
    s.fase = FASE.ROBO;
    return;
  }

  for (const jug of s.jugadores) {
    // El tope es de lo ahorrado, no de la renta: nadie puede sentarse veinte
    // turnos a acumular, pero guardar dos o tres turnos sí tiene que valer.
    jug.biomasa = BALANCE.rentaAcumula && s.turno > 1
      ? Math.min(jug.biomasa + renta, BALANCE.rentaTope)
      : Math.min(renta, BALANCE.rentaTope);
  }
  ev(s, 'RENTA', { biomasa: renta });
  s.fase = FASE.ROBO;
}

export function faseRobo(s) {
  // La aridez muerde antes del robo: lo que se lleva no llega a la mano.
  if (hayAridez(s)) {
    for (let j = 0; j < 2; j++) perderDelMazo(s, j, BALANCE.efectosCampo.aridezMazo);
  }
  // Un clima con `duracion` gasta un turno por cada fase de robo que ve, y se
  // va después de la última: puesto en el turno T, muerde en T+1, T+2 y T+3.
  // Aquí y no en el chequeo para que el último turno sea uno entero.
  if (s.campo !== null && s.campoTurnos !== null) {
    s.campoTurnos -= 1;
    if (s.campoTurnos <= 0) {
      const cardId = s.campo;
      s.jugadores[s.campoDe].descarte.push(s.campoIid);
      ev(s, 'CAMPO_FIN', { jugador: s.campoDe, cardId });
      s.campo = null;
      s.campoIid = null;
      s.campoDe = null;
      s.campoTurnos = null;
    }
  }
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

      // Y su habilidad de entrada, si tiene. Aquí y no antes: la criatura ya
      // está en su ranura, así que una emboscada puede mirar quién tiene
      // enfrente. El orden de disparo es el de `pendientes`, que está fijado por
      // tipo y luego por iid — sin ese orden, dos máquinas re-jugando la misma
      // partida llegarían a resultados distintos, y el servidor las valida
      // re-jugándolas.
      alEntrar(s, inst, {
        ev, herir, rival, unidadEn, unidadesDe, CAUSA, vidaActual,
        devolverAMano, enterrar, golpearHabitat,
      });

      // Y lo que el LUGAR de esa columna hace al recibirla. Después de la
      // entrada de la carta, que es lo que el jugador lee primero.
      const roba = efectoDeLugar(s, p.ranura).roba ?? 0;
      if (roba > 0) {
        const antes = s.jugadores[p.jugador].mano.length;
        robar(s, p.jugador, roba);
        ev(s, 'LUGAR', {
          jugador: p.jugador, ranura: p.ranura, lugar: s.lugares[p.ranura],
          efecto: 'roba', n: s.jugadores[p.jugador].mano.length - antes, iid: p.iid,
        });
      }

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
      s.campoTurnos = carta(inst.cardId).duracion ?? null;
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
        marcar(objetivo, inst.cardId, BALANCE.rasgos.crecimientoAtaque, BALANCE.rasgos.crecimientoVida);
      }
      if (r === RASGO.NEUMATICIDAD) {
        objetivo.modAtaque += BALANCE.rasgos.neumaticidadAtaque;
        marcar(objetivo, inst.cardId, BALANCE.rasgos.neumaticidadAtaque, 0);
      }
      ev(s, 'ADAPTACION', {
        jugador: p.jugador, iid: p.iid, cardId: inst.cardId,
        objetivo: objetivo.iid, objetivoCardId: objetivo.cardId,
      });

    } else if (p.tipo === 'PRESION') {
      aplicarPresion(s, p);
      s.jugadores[p.jugador].descarte.push(p.iid);
    }
  }

  aplicarUmbrales(s);
  recogerBajas(s, CAUSA.MORTANDAD);
  s.fase = FASE.COMBATE;
}

/**
 * Los umbrales que, una vez alcanzados, ya no se pierden. Hoy sólo el rebaño de
 * tres del Brachylophosaurus.
 *
 * Va aparte de `ataqueEfectivo` porque NO es lo mismo que un contador: un
 * contador se recalcula y baja cuando el compañero muere; esto se cobra una vez
 * y se queda. Se guarda en `modAtaque` —con su marca, para que el jugador vea
 * de dónde salen los puntos— y la marca es además lo que impide cobrarlo dos
 * veces: el segundo turno con tres en el campo ya no suma nada.
 */
function aplicarUmbrales(s) {
  for (const inst of todasLasUnidades(s)) {
    const trio = mecanicaDe(inst.cardId)?.trio;
    if (!trio) continue;
    if (inst.marcas.some((m) => m.cardId === inst.cardId)) continue;
    const suyos = unidadesDe(s, inst.dueno).filter((o) => o.cardId === inst.cardId).length;
    if (suyos < trio.copias) continue;
    inst.modAtaque += trio.ataque ?? 0;
    inst.modVida += trio.vida ?? 0;
    marcar(inst, inst.cardId, trio.ataque ?? 0, trio.vida ?? 0);
    ev(s, 'UMBRAL', {
      iid: inst.iid, dueno: inst.dueno, cardId: inst.cardId,
      ataque: trio.ataque ?? 0, vida: trio.vida ?? 0,
    });
  }
}

function aplicarPresion(s, p) {
  const cardId = s.instancias[p.iid].cardId;
  const r = carta(cardId).rasgo;
  const contrario = rival(p.jugador);

  // Una unidad inmune a los eventos ni se elige ni se ve: la carta se juega
  // igual —ya se pagó y el rival la ha visto— pero sobre ella no pasa nada.
  const alcanzable = (iid) => {
    const o = s.instancias[iid];
    return o && o.ranura !== null && !inmuneA(s, iid, 'EVENTO');
  };

  if (r === RASGO.FRACTURA) {
    const objetivo = s.instancias[p.objetivo];
    if (!objetivo || !alcanzable(p.objetivo)) return;
    objetivo.modAtaque -= BALANCE.rasgos.fracturaAtaque;
    marcar(objetivo, cardId, -BALANCE.rasgos.fracturaAtaque, 0);
    ev(s, 'PRESION', { jugador: p.jugador, cardId, objetivo: objetivo.iid, objetivoCardId: objetivo.cardId });

  } else if (r === RASGO.COMPETENCIA) {
    // Dos rivales señalados uno a uno, y les muerde a la Vida: antes era todo
    // un clado y les quitaba Ataque, y entre medias fue Defensa, que ya no
    // existe. Quitar Vida es lo más parecido a lo que hacía —desgastar sin
    // matar— y además se ve en la carta.
    let n = 0;
    for (const oid of p.objetivos ?? []) {
      const inst = s.instancias[oid];
      if (!inst || !alcanzable(oid) || inst.dueno !== contrario) continue;
      inst.modVida -= BALANCE.rasgos.competenciaVida;
      marcar(inst, cardId, 0, -BALANCE.rasgos.competenciaVida);
      n += 1;
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId, objetivos: p.objetivos ?? [], afectados: n });

  } else if (r === RASGO.TRAMPA) {
    perderDelMazo(s, contrario, BALANCE.rasgos.trampaMazoRival);
    perderDelMazo(s, p.jugador, BALANCE.rasgos.trampaMazoPropio);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.MORTANDAD) {
    // Pega a TODOS, los propios incluidos, así que la inmunidad sólo tapa a los
    // del rival: la carta es tuya y de los tuyos no te libras.
    for (const inst of todasLasUnidades(s)) {
      if (inst.dueno === contrario && !alcanzable(inst.iid)) continue;
      herir(s, inst.iid, BALANCE.rasgos.mortandadDano, CAUSA.MORTANDAD, p.jugador);
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  // Los seis de la ronda de las cien cartas. Mueven cartas, no cifras, así que
  // no hay a quién marcar: se anuncian sobre el tablero como la Trampa.
  } else if (r === RASGO.SABANA_HELECHOS) {
    robar(s, p.jugador, BALANCE.rasgos.sabanaHelechosRoba);
    descartarAlAzar(s, p.jugador, BALANCE.rasgos.sabanaHelechosDescarta);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.INUNDACION) {
    perderDelMazo(s, contrario, BALANCE.rasgos.inundacionMazo);
    perderDelMazo(s, p.jugador, BALANCE.rasgos.inundacionMazo);
    robar(s, p.jugador, BALANCE.rasgos.inundacionRoba);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.CANAL_TRENZADO) {
    for (const inst of unidadesDe(s, p.jugador)) {
      inst.heridas = Math.max(0, inst.heridas - BALANCE.rasgos.canalTrenzadoCura);
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.BOSQUE_RIBERENO) {
    descartarAlAzar(s, contrario, BALANCE.rasgos.bosqueRiberenoMano);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.DERIVA_ARIDA) {
    // Los dos sueltan la mano y roban otras tantas: el que la tenía peor sale
    // ganando. Se resuelve primero el rival y luego quien la juega, en orden
    // fijo, que el robo consume el mazo y el mazo es lo que se re-juega.
    for (const j of [contrario, p.jugador]) {
      const jug = s.jugadores[j];
      const n = jug.mano.length;
      jug.descarte.push(...jug.mano);
      jug.mano = [];
      robar(s, j, n);
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.NIDO) {
    robar(s, p.jugador, BALANCE.rasgos.nidoRoba);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  // ------------------------------------------------- la ronda del control
  //
  // Ninguno de los cinco toca una cifra del campo, así que ninguno tiene a
  // quién marcar: se anuncian sobre el tablero como la Trampa.

  } else if (r === RASGO.TORMENTA_POLVO) {
    // Los dos sueltan la mano DENTRO del mazo y roban una mano nueva fija. No
    // es la Deriva árida: aquella devuelve tantas como tenías —el que la tenía
    // peor sale ganando— y ésta reparte el mismo número a los dos, así que
    // castiga al que iba acumulando y rescata al que se quedó seco. Orden fijo,
    // el rival primero, que los dos barajan del mismo rng.
    for (const j of [contrario, p.jugador]) manoNueva(s, j, BALANCE.rasgos.tormentaPolvoRoba);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.AVENIDA_LODO) {
    const tope = BALANCE.rasgos.avenidaLodoTope;
    descartarAlAzar(s, contrario, Math.max(0, s.jugadores[contrario].mano.length - tope));
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.ENTERRAMIENTO) {
    rescatarDelDescarte(s, p.jugador, BALANCE.rasgos.enterramientoRescata);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.CAUCE_ABANDONADO) {
    // Soltar antes de robar, que si no lo robado entra en el sorteo de lo que
    // se suelta y la carta deja de hacer lo que dice.
    descartarAlAzar(s, p.jugador, BALANCE.rasgos.cauceDescarta);
    robar(s, p.jugador, BALANCE.rasgos.cauceRoba);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  // ------------------------------------------------- la ronda del REBOTE

  } else if (r === RASGO.CENIZA) {
    perderDelMazo(s, contrario, BALANCE.rasgos.cenizaMazo);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.SEDIMENTO) {
    perderDelMazo(s, contrario, BALANCE.rasgos.sedimentoMazo);
    descartarAlAzar(s, contrario, BALANCE.rasgos.sedimentoMano);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.OSARIO) {
    enterrar(s, p.jugador, BALANCE.rasgos.osarioEntierra);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.CARRONEROS) {
    enterrar(s, p.jugador, BALANCE.rasgos.carronerosEntierra);
    robar(s, p.jugador, BALANCE.rasgos.carronerosRoba);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.OLEADA) {
    golpearHabitat(s, contrario, BALANCE.rasgos.oleadaHabitat);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.ESTAMPIDA) {
    // Barre a los pequeños de LOS DOS bandos. La inmunidad a eventos tapa sólo
    // a los del rival, como la Mortandad: la carta es tuya y de los tuyos no te
    // libras. Se recorre una copia de la lista porque devolver vacía ranuras.
    const tope = BALANCE.rasgos.estampidaAtaqueMax;
    for (const inst of [...todasLasUnidades(s)]) {
      if (carta(inst.cardId).ataque > tope) continue;
      if (inst.dueno === contrario && !alcanzable(inst.iid)) continue;
      devolverAMano(s, inst.iid);
    }
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.MIGRACION) {
    // El tuyo que peor lo lleva, con la misma regla que la entrada `devuelve`:
    // recoger al herido es lo que haría el jugador y no hace falta preguntar.
    const mios = unidadesDe(s, p.jugador)
      .sort((a, b) => vidaActual(s, a.iid) - vidaActual(s, b.iid) || a.iid - b.iid);
    if (mios[0]) devolverAMano(s, mios[0].iid);
    robar(s, p.jugador, BALANCE.rasgos.migracionRoba);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.CRECIDA_DELTA) {
    // El del rival que más pega de los que caben bajo el listón, como Tijera.
    const tope = BALANCE.rasgos.crecidaAtaqueMax;
    const suyos = unidadesDe(s, contrario)
      .filter((u) => carta(u.cardId).ataque <= tope && alcanzable(u.iid))
      .sort((a, b) => carta(b.cardId).ataque - carta(a.cardId).ataque || a.iid - b.iid);
    if (suyos[0]) devolverAMano(s, suyos[0].iid);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  // ------------------------------------------------ la ronda del HÁBITAT

  } else if (r === RASGO.INCENDIO) {
    golpearHabitat(s, contrario, BALANCE.rasgos.incendioHabitat);
    ev(s, 'PRESION', { jugador: p.jugador, cardId });

  } else if (r === RASGO.ACUIFERO) {
    // Escala con TU campo y no con el suyo: es el premio por haber ganado la
    // mesa, no un castigo por tenerla vacía. Con tope, que sin él cuatro
    // carriles llenos son ocho de hábitat gratis todos los turnos.
    const { acuiferoPorDino, acuiferoTope } = BALANCE.rasgos;
    const dano = Math.min(acuiferoTope, unidadesDe(s, p.jugador).length * acuiferoPorDino);
    golpearHabitat(s, contrario, dano);
    ev(s, 'PRESION', { jugador: p.jugador, cardId, dano });

  } else if (r === RASGO.BARRERA_TRONCOS) {
    // La mano propia se cuenta SIN esta carta: se está jugando, ya no está en
    // la mano, y contarla haría que la condición dependiera de sí misma.
    const mia = s.jugadores[p.jugador].mano.filter((iid) => iid !== p.iid).length;
    const doble = s.jugadores[contrario].mano.length > mia;
    perderDelMazo(s, contrario, BALANCE.rasgos.barreraMazo * (doble ? 2 : 1));
    ev(s, 'PRESION', { jugador: p.jugador, cardId, doble });
  }
}

/**
 * Suelta la mano DENTRO del mazo, lo baraja y roba `cuantas`. Hermana de la
 * que usa `alEntrar`, y aquí por lo mismo: lo que sueltas vuelve a estar
 * disponible, así que una mano impagable se cambia sin perder mazo.
 *
 * Roba a mano y no con `robar()`: el mazo acaba de crecer con la mano entera,
 * así que si aun así no llega es que quedaban menos cartas que eso en todo el
 * montón, y ahí rebarajar el descarte sería regalar cartas.
 */
function manoNueva(s, j, cuantas) {
  const jug = s.jugadores[j];
  const antes = jug.mano.length;
  jug.mazo.push(...jug.mano);
  jug.mano = [];
  const b = barajar(jug.mazo, s.rng);
  s.rng = b.rng;
  jug.mazo = b.lista;
  for (let k = 0; k < cuantas && jug.mazo.length > 0; k++) jug.mano.push(jug.mazo.shift());
  ev(s, 'MANO_NUEVA', { jugador: j, antes, ahora: jug.mano.length });
}

/**
 * Del CAMPO a la mano de su dueño. Es el primer gesto del juego que deshace un
 * despliegue, y por eso hace la misma limpieza que una muerte —heridas, marcas,
 * adherencias— menos las dos cosas que la separan de morir: no va al descarte y
 * no le da un trofeo a nadie.
 *
 * La carta vuelve LIMPIA. Se consideró devolverla con sus heridas puestas y no
 * se sostiene: la instancia es la misma pero la carta ya no está en juego, y un
 * Allosaurus que vuelve a la mano herido de 4 sería una carta distinta de la que
 * se compró en el sobre. Lo que sí se pierde son las adaptaciones pegadas
 * encima, que se van al descarte como cuando muere quien las llevaba.
 */
export function devolverAMano(s, iid) {
  const inst = s.instancias[iid];
  if (!inst || inst.ranura === null) return false;
  for (const aid of inst.adherencias) {
    const a = s.instancias[aid];
    a.adheridoA = null;
    s.jugadores[a.dueno].descarte.push(aid);
  }
  inst.adherencias = [];
  s.ranuras[inst.dueno][inst.ranura] = null;
  inst.ranura = null;
  inst.heridas = 0;
  inst.modAtaque = 0;
  inst.modVida = 0;
  inst.marcas = [];
  inst.desplegadoEnTurno = null;
  s.jugadores[inst.dueno].mano.push(iid);
  ev(s, 'DEVUELTA', { iid, cardId: inst.cardId, dueno: inst.dueno });
  return true;
}

/**
 * Del descarte al MAZO, barajado. Es lo contrario de moler y lo único del juego
 * que alarga un mazo, así que es la respuesta que a la vía de la extinción le
 * faltaba: hasta ahora molerte era un daño que no se podía deshacer.
 *
 * Va barajado y no encima: poner cartas conocidas encima del mazo sería
 * arreglar el robo de los próximos turnos, que es mucho más de lo que la carta
 * dice, y en un duelo el rival no puede ver el mazo para comprobarlo.
 */
export function enterrar(s, j, cuantas) {
  const jug = s.jugadores[j];
  let n = 0;
  for (let k = 0; k < cuantas && jug.descarte.length > 0; k++) {
    const d = entero(s.rng, jug.descarte.length);
    s.rng = d.rng;
    jug.mazo.push(jug.descarte.splice(d.valor, 1)[0]);
    n += 1;
  }
  if (n > 0) {
    const b = barajar(jug.mazo, s.rng);
    s.rng = b.rng;
    jug.mazo = b.lista;
  }
  ev(s, 'ENTIERRO', { jugador: j, cartas: n, mazo: jug.mazo.length });
  return n;
}

/** Del descarte a la mano, al azar. Lo enterrado que vuelve a salir. */
function rescatarDelDescarte(s, j, cuantas) {
  const jug = s.jugadores[j];
  let sacadas = 0;
  for (let k = 0; k < cuantas && jug.descarte.length > 0; k++) {
    const d = entero(s.rng, jug.descarte.length);
    s.rng = d.rng;
    jug.mano.push(jug.descarte.splice(d.valor, 1)[0]);
    sacadas += 1;
  }
  ev(s, 'RESCATE', { jugador: j, cartas: sacadas, descarte: jug.descarte.length });
}

/**
 * Descarta de la mano AL AZAR, con el rng del estado y no con Math.random: la
 * partida tiene que poder re-jugarse igual en el servidor. Es lo mismo que
 * hace la entrada `manoRival`, sacado a función para que lo usen los eventos.
 */
export function descartarAlAzar(s, j, n) {
  const jug = s.jugadores[j];
  let quitadas = 0;
  for (let k = 0; k < n && jug.mano.length > 0; k++) {
    const d = entero(s.rng, jug.mano.length);
    s.rng = d.rng;
    jug.descarte.push(jug.mano.splice(d.valor, 1)[0]);
    quitadas += 1;
  }
  return quitadas;
}

/**
 * Combate: ranura contra ranura. Todo el daño se calcula sobre el estado PREVIO
 * y se aplica a la vez, así que un intercambio mutuo puede matar a los dos.
 * Ranura enfrentada vacía = el ocupante golpea el habitat contrario.
 */
/** Un lugar que hace algo por su cuenta lo dice: el guión lo enseña sobre él. */
function avisarLugar(s, r, datos) {
  ev(s, 'LUGAR', { ranura: r, lugar: s.lugares[r], ...datos });
}

/**
 * Un golpe al hábitat que sale de esa columna, pasado por su lugar —el
 * Desfiladero le quita, el Barranco le pone— y CONTADO: si el lugar lo
 * cambió, queda un evento LUGAR con lo que quitó o puso. Es la misma cuenta
 * que `danoAlHabitat`, que no puede emitir nada porque la usa la IA.
 */
function golpeConLugar(s, r, bando, sinLugar) {
  const con = ajustarGolpeDeLugar(s, r, sinLugar);
  if (con !== sinLugar) {
    avisarLugar(s, r, {
      jugador: bando, efecto: con > sinLugar ? 'golpeHabitat' : 'guardia', n: Math.abs(con - sinLugar),
    });
  }
  return con;
}

/** Lo que pegaría al hábitat sin contar el lugar: el Ataque menos la guardia del defensor. */
const golpeSinLugar = (s, iid, defensor) => Math.max(0, ataqueEfectivo(s, iid) - guardiaDe(s, defensor));

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

    // Lo que vuela pasa por encima de la ranura y va al habitat en vez de
    // chocar, pero NO es intocable: quien tenga enfrente le pega igual. Antes
    // esquivaba también el golpe, y un volador barato salía gratis.
    const volA = a && vuela(s, a.iid);
    const volB = b && vuela(s, b.iid);
    if (volA || volB) {
      for (const [uno, bando, vuela1] of [[a, 0, volA], [b, 1, volB]]) {
        if (!uno) continue;
        const d = golpeConLugar(s, r, bando, golpeSinLugar(s, uno.iid, rival(bando)));
        alHabitat[rival(bando)] += d;
        ev(s, vuela1 ? 'SOBREVUELO' : 'AVANCE', { ranura: r, iid: uno.iid, bando, dano: d });
      }
      // El de tierra golpea al volador que le pasa por encima; el volador no
      // devuelve nada, que para eso ha volado.
      if (a && b) {
        if (!volA) golpes.push({ iid: b.iid, cantidad: danoEntre(s, a.iid, b.iid), causa: CAUSA.COMBATE, por: 0 });
        if (!volB) golpes.push({ iid: a.iid, cantidad: danoEntre(s, b.iid, a.iid), causa: CAUSA.COMBATE, por: 1 });
      }
      continue;
    }

    if (a && b) {
      const dA = danoEntre(s, a.iid, b.iid);
      const dB = danoEntre(s, b.iid, a.iid);
      golpes.push({ iid: b.iid, cantidad: dA, causa: CAUSA.COMBATE, por: 0 });
      golpes.push({ iid: a.iid, cantidad: dB, causa: CAUSA.COMBATE, por: 1 });
      golpes.push({ iid: a.iid, cantidad: espinasDe(s, b.iid), causa: CAUSA.ESPINAS, por: 1 });
      golpes.push({ iid: b.iid, cantidad: espinasDe(s, a.iid), causa: CAUSA.ESPINAS, por: 0 });
      // Las espinas del lugar las llevan los DOS, así que se dicen una vez
      // por columna y sin bando: es el terreno el que pincha.
      const espinasLugar = efectoDeLugar(s, r).espinas ?? 0;
      if (espinasLugar > 0) avisarLugar(s, r, { efecto: 'espinas', n: espinasLugar });

      // Desgarro: la herida no cierra en el mismo turno en que se abre.
      if (dA > 0 && carta(a.cardId).rasgo === RASGO.DESGARRO) s.instancias[b.iid].sinCuracion = true;
      if (dB > 0 && carta(b.cardId).rasgo === RASGO.DESGARRO) s.instancias[a.iid].sinCuracion = true;

      // Lo que sobra al matar sigue hacia el habitat: si pegas 5 a algo que
      // tenía 3 de Vida, pasan 2. Es la regla para todos.
      //
      // DEPREDADOR DOMINANTE lo DUPLICA, y sólo aquí. El rasgo se quedó sin
      // contenido cuando el sobrante pasó a ser general —su texto describía lo
      // que ya hacía todo el mundo— y esto se lo devuelve sin inventar una
      // mecánica nueva: la misma regla, el doble.
      //
      // Ojo a la condición: duplica el SOBRANTE, que sólo existe si venció al
      // que tenía enfrente. Contra una ranura vacía no hay nada que doblar y su
      // Ataque pasa tal cual, que es la rama de más abajo.
      // Y el LUGAR lo multiplica también —la Llanura abierta lo dobla—, sobre
      // el mismo sobrante y por la misma regla que el rasgo.
      const dobla = (uno) => (carta(uno.cardId).rasgo === RASGO.DEPREDADOR_DOMINANTE ? 2 : 1)
        * sobranteDeLugar(s, r);
      const sobraA = Math.max(0, dA - vidaActual(s, b.iid));
      const sobraB = Math.max(0, dB - vidaActual(s, a.iid));
      // La guardia también muerde aquí: lo que sobra al matar es daño de un
      // dinosaurio rival como cualquier otro, y cada atacante aporta una sola
      // vez por turno —o sobrante, o golpe a ranura vacía, o sobrevuelo— así
      // que restar en las tres ramas es restar una vez por dinosaurio. Y el
      // lugar de la columna ajusta el golpe en las tres por lo mismo.
      if (BALANCE.cuerpo.sobranteAlHabitat) {
        const porLugar = sobranteDeLugar(s, r);
        for (const [sobra, uno, bando] of [[sobraA, a, 0], [sobraB, b, 1]]) {
          if (sobra > 0 && porLugar !== 1) avisarLugar(s, r, { jugador: bando, efecto: 'sobrante', n: porLugar });
          alHabitat[rival(bando)] += golpeConLugar(s, r, bando, Math.max(0, sobra * dobla(uno) - guardiaDe(s, rival(bando))));
        }
      }

      ev(s, 'CHOQUE', { ranura: r, a: a.iid, b: b.iid, danoA: dA, danoB: dB });

    } else if (a) {
      const d = golpeConLugar(s, r, 0, golpeSinLugar(s, a.iid, 1));
      alHabitat[1] += d;
      ev(s, 'AVANCE', { ranura: r, iid: a.iid, bando: 0, dano: d });

    } else if (b) {
      const d = golpeConLugar(s, r, 1, golpeSinLugar(s, b.iid, 0));
      alHabitat[0] += d;
      ev(s, 'AVANCE', { ranura: r, iid: b.iid, bando: 1, dano: d });
    }
  }

  for (const g of golpes) herir(s, g.iid, g.cantidad, g.causa, g.por);
  recogerBajas(s, CAUSA.COMBATE);

  golpearHabitat(s, 0, alHabitat[0]);
  golpearHabitat(s, 1, alHabitat[1]);

  for (const inst of todasLasUnidades(s)) {
    if (inst.sinCuracion) { inst.sinCuracion = false; continue; }
    const cura = curacionDe(s, inst.iid);
    const lugar = efectoDeLugar(s, inst.ranura);
    if (cura > 0 && inst.heridas > 0) {
      // Lo que curó el lugar, como mucho lo que había que curar.
      const delLugar = Math.min(lugar.cura ?? 0, inst.heridas);
      inst.heridas = Math.max(0, inst.heridas - cura);
      ev(s, 'CURACION', { iid: inst.iid, dueno: inst.dueno, cura });
      if (delLugar > 0) avisarLugar(s, inst.ranura, { jugador: inst.dueno, efecto: 'cura', n: delLugar, iid: inst.iid });
    } else if (lugar.sinCuracion && inst.heridas > 0 && curacionPropia(s, inst.iid) > 0) {
      // Habría curado y las Salinas no dejaron: eso también se ve.
      avisarLugar(s, inst.ranura, { jugador: inst.dueno, efecto: 'sinCuracion', n: 0, iid: inst.iid });
    }
  }

  // El Cauce seco muerde al final del turno a quien tenga algo puesto en él.
  // Va después de las bajas: lo que murió en el combate ya no está «aquí».
  // Orden fijo —columna y luego bando— por lo de siempre: el servidor re-juega.
  for (let r = 0; r < BALANCE.ranuras; r++) {
    const muele = efectoDeLugar(s, r).muele ?? 0;
    if (!muele) continue;
    for (const bando of [0, 1]) {
      const u = unidadEn(s, bando, r);
      if (!u) continue;
      const antes = s.jugadores[bando].mazo.length;
      perderDelMazo(s, bando, muele);
      ev(s, 'LUGAR', {
        jugador: bando, ranura: r, lugar: s.lugares[r],
        efecto: 'muele', n: antes - s.jugadores[bando].mazo.length, iid: u.iid,
      });
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

  // El mazo a cero es la derrota, sin esperar a que toque robar: es un reloj
  // que el jugador puede ver bajar en el marcador.
  if (a.mazo.length === 0 || b.mazo.length === 0) {
    if (a.mazo.length === 0) a.sinCartas = true;
    if (b.mazo.length === 0) b.sinCartas = true;
    finalizar(s, MOTIVO_FIN.EXTINCION);
    return;
  }

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
  for (const jug of s.jugadores) {
    jug.listo = false;
    jug.pendientes = [];
  }
  s.fase = FASE.RENTA;
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
