// DinoWar — creación del estado y selectores de sólo lectura.
// Ninguna función de este módulo muta su argumento.

import { BALANCE, MAZO } from '../data/balance.js';
import { CARTAS, TIPO, CLADO, RASGO, carta } from '../data/cards.js';
import { barajar, semilla } from './rng.js';

export const FASE = Object.freeze({
  RENTA: 'RENTA',
  ROBO: 'ROBO',
  DESPLIEGUE: 'DESPLIEGUE',
  REVELACION: 'REVELACION',
  COMBATE: 'COMBATE',
  DESCARTE: 'DESCARTE',
  CHEQUEO: 'CHEQUEO',
  FIN: 'FIN',
});

export const FASES_INTERACTIVAS = Object.freeze([FASE.DESPLIEGUE, FASE.DESCARTE]);

export const MOTIVO_FIN = Object.freeze({
  TROFEOS: 'TROFEOS',
  HABITAT: 'HABITAT',
  EXTINCION: 'EXTINCION',
  LIMITE_TURNOS: 'LIMITE_TURNOS',
});

export const CAUSA = Object.freeze({
  COMBATE: 'COMBATE',
  ESPINAS: 'ESPINAS',
  MORTANDAD: 'MORTANDAD',
});

export const rival = (j) => (j === 0 ? 1 : 0);

/**
 * Una carta puesta en juego. Se exporta para que los tests no tengan que
 * repetir esta forma: cuando la repetían, añadir un campo aquí dejaba a los
 * tests construyendo instancias a medias y fallando por sitios raros.
 */
export function nuevaInstancia(iid, cardId, dueno) {
  return {
    iid, cardId, dueno,
    ranura: null,
    heridas: 0,
    modAtaque: 0,
    modVida: 0,
    // Qué le ha cambiado las cifras y quién se lo hizo. modAtaque y modVida son
    // dos números sin memoria: dicen «−2» pero no de dónde salió, y en la mesa
    // eso deja al jugador mirando una carta mermada sin saber qué le cayó
    // encima. Cada apunte es { cardId, ataque, vida }.
    marcas: [],
    adherencias: [],
    adheridoA: null,
    desplegadoEnTurno: null,
  };
}

/**
 * @param {number} [seedEntrada]
 * @param {Array<Array<[string, number]>>} [mazos] lista por jugador de pares
 *   [cardId, copias]. Sin ella los dos juegan el mazo por defecto, que es lo
 *   que mide el simulador; con ella entra el mazo que el jugador ha montado.
 */
export function crearPartida(seedEntrada = 1, mazos = null) {
  let rng = semilla(seedEntrada);
  const instancias = {};
  let siguienteInstId = 1;
  const jugadores = [];

  for (let j = 0; j < 2; j++) {
    const mazo = [];
    for (const [cardId, copias] of (mazos?.[j] ?? MAZO)) {
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
      biomasa: 0,
      // Parte del total que es Biomasa animal. En la economía FIJA no se mira:
      // la Biomasa no tiene tipo y todo se paga con todo.
      animal: 0,
      // Qué tipo produces el turno que viene. Se declara a ciegas, un turno
      // antes, igual que se despliega: comprometer la economía sin ver la
      // jugada del rival es la misma tensión que ya tiene el tablero.
      produccion: null,
      biomasaJugadaEsteTurno: 0,
      habitat: BALANCE.vidaHabitat,
      trofeos: 0,
      mazo: b.lista,
      mano: [],
      descarte: [],
      pendientes: [],
      listo: false,
      sinCartas: false,
      mulligans: 0,
    });
  }

  for (const jug of jugadores) {
    // El segundo jugador compensa la iniciativa con una carta, no con recursos:
    // con renta fija por turno, dar Biomasa extra no compensaría nada.
    const extra = jug.id === 1 ? BALANCE.compensacionSegundoJugador.cartas : 0;
    for (let k = 0; k < BALANCE.manoInicial + extra; k++) jug.mano.push(jug.mazo.shift());
  }

  return {
    seed: semilla(seedEntrada),
    rng,
    turno: 1,
    fase: FASE.RENTA,
    campo: null,
    siguienteInstId,
    instancias,
    ranuras: [
      Array.from({ length: BALANCE.ranuras }, () => null),
      Array.from({ length: BALANCE.ranuras }, () => null),
    ],
    jugadores,
    eventos: [],
    ganador: null,
    motivoFin: null,
  };
}

// ---------------------------------------------------------------- selectores

export const ranuraValida = (r) => Number.isInteger(r) && r >= 0 && r < BALANCE.ranuras;

export function unidadEn(state, bando, ranura) {
  const iid = state.ranuras[bando][ranura];
  return iid === null ? null : state.instancias[iid];
}

export function unidadesDe(state, bando) {
  return state.ranuras[bando].filter((x) => x !== null).map((iid) => state.instancias[iid]);
}

export function todasLasUnidades(state) {
  return [...unidadesDe(state, 0), ...unidadesDe(state, 1)];
}

export const cladoDe = (inst) => carta(inst.cardId).clado;

export const campoEs = (state, rasgo) => state.campo !== null && carta(state.campo).rasgo === rasgo;

function adherenciasCon(state, inst, rasgo) {
  let n = 0;
  for (const aid of inst.adherencias) {
    const a = state.instancias[aid];
    if (a && carta(a.cardId).rasgo === rasgo) n += 1;
  }
  return n;
}

/** Poder de ataque con todos los modificadores estáticos. */
export function ataqueEfectivo(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return 0;

  let poder = c.ataque + inst.modAtaque;

  if (c.rasgo === RASGO.GREGARIO) {
    const companeros = unidadesDe(state, inst.dueno)
      .filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
    poder += companeros * BALANCE.rasgos.gregarioAtaquePorCompanero;
  }

  if (c.rasgo === RASGO.RIBERENO && campoEs(state, RASGO.CAMPO_CANAL)) {
    poder += BALANCE.rasgos.riberenoAtaque;
  }

  // Caza en grupo: no basta con estar acompañado, hacen falta tres.
  if (c.rasgo === RASGO.CAZA_EN_GRUPO
      && conCompañía(state, inst, BALANCE.rasgos.cazaEnGrupoMinimo - 1)) {
    poder += BALANCE.rasgos.cazaEnGrupoAtaque;
  }

  // Gregarismo: una carta adherida a un congénere beneficia a toda la especie.
  for (const otro of unidadesDe(state, inst.dueno)) {
    if (otro.cardId !== inst.cardId) continue;
    poder += adherenciasCon(state, otro, RASGO.GREGARISMO) * BALANCE.rasgos.gregarismoAtaque;
  }

  return Math.max(0, poder);
}

/**
 * La Vida de esta unidad ahora mismo. Aquí es donde recalaron los rasgos y el
 * clima que antes daban Defensa: masa, osteodermos y placas siguen protegiendo,
 * pero aguantando más golpes en vez de restar de cada uno.
 *
 * Es DINÁMICA, y eso tiene una consecuencia que conviene tener a la vista: un
 * Muro de placas que se queda sin congénere pierde su Vida extra en el acto y,
 * si estaba herido, puede caerse ahí mismo. No es nuevo —el clima del Canal ya
 * hacía exactamente eso desde siempre— pero ahora pasa más veces.
 */
export function vidaMaxima(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let v = c.vida + inst.modVida;

  if (campoEs(state, RASGO.CAMPO_CANAL)) v += BALANCE.efectosCampo.canalVida;
  // La sabana abierta obliga a apiñarse: los dos bandos aguantan más.
  if (campoEs(state, RASGO.CAMPO_SABANA)) v += BALANCE.efectosCampo.sabanaVida;

  if (c.rasgo === RASGO.CORAZA) v += BALANCE.rasgos.corazaVida;
  // Las que piden compañía. Se cuentan sólo los propios: un Stegosaurus rival
  // no le sirve de muro al tuyo.
  if (c.rasgo === RASGO.MURO_DE_PLACAS && conCompañía(state, inst, 1)) {
    v += BALANCE.rasgos.muroDePlacasVida;
  }
  if (c.rasgo === RASGO.GOLA && conCompañía(state, inst, 1)) v += BALANCE.rasgos.golaVida;
  if (c.rasgo === RASGO.MANADA && delClado(state, inst, c.clado, 1)) {
    v += BALANCE.rasgos.manadaVida;
  }

  return Math.max(0, v);
}

export const vidaActual = (state, iid) => vidaMaxima(state, iid) - state.instancias[iid].heridas;

/** ¿Hay al menos `min` copias MÁS de esta misma carta entre las tuyas? */
function conCompañía(state, inst, min) {
  const n = unidadesDe(state, inst.dueno)
    .filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
  return n >= min;
}

/** ¿Hay al menos `min` unidades propias MÁS de este clado? */
function delClado(state, inst, clado, min) {
  const n = unidadesDe(state, inst.dueno)
    .filter((o) => o.iid !== inst.iid && carta(o.cardId).clado === clado).length;
  return n >= min;
}

/** Daño devuelto a quien ataca: púas caudales. */
export function espinasDe(state, iid) {
  const c = carta(state.instancias[iid].cardId);
  let e = c.clado === CLADO.TIREOFORO ? BALANCE.clados.espinasTireoforo : 0;
  return e;
}

/**
 * Daño que `atacante` inflige a `defensor`, red trófica incluida.
 *
 * Es su Ataque, y ya. No hay resta de Defensa —dejó de existir— ni suelo de
 * daño, que sólo estaba ahí para impedir que una Defensa alta hiciera inmune a
 * una criatura. Sin resta no hay nada de lo que protegerse, y el suelo pasaba a
 * ser una tercera regla invisible sin motivo: hacía que un Ataque de 0 pegara 1.
 */
export function danoEntre(state, atacanteIid, defensorIid) {
  const a = carta(state.instancias[atacanteIid].cardId);
  const d = carta(state.instancias[defensorIid].cardId);
  let dano = ataqueEfectivo(state, atacanteIid);
  if (BALANCE.clados.presaDe[a.clado] === d.clado) dano += BALANCE.clados.bonusDepredacion;
  return Math.max(0, dano);
}

/** Daño que una unidad sin rival enfrente inflige al habitat contrario. */
export function danoAlHabitat(state, iid) {
  return ataqueEfectivo(state, iid);
}

/** ¿Sobrevuela la ranura en vez de chocar con quien tiene enfrente? */
export const vuela = (state, iid) => carta(state.instancias[iid].cardId).rasgo === RASGO.VUELO;

/** La deriva árida muerde el mazo de los dos bandos mientras siga en el campo. */
export const hayAridez = (state) => campoEs(state, RASGO.CAMPO_ARIDEZ);

/** Biomasa que le entra a cada bando este turno. Plana: no depende del turno. */
export function rentaDe(state) {
  const extra = campoEs(state, RASGO.CAMPO_LLANURA) ? BALANCE.efectosCampo.llanuraBiomasa : 0;
  return BALANCE.rentaPorTurno + extra;
}

/** Cuántas heridas cura una unidad al final del turno. */
export function curacionDe(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  let cura = 0;
  if (c.rasgo === RASGO.RAMONEO_BAJO) cura += BALANCE.rasgos.ramoneoBajoCura;
  cura += adherenciasCon(state, inst, RASGO.GASTROLITOS) * BALANCE.rasgos.gastrolitosCura;
  if (campoEs(state, RASGO.CAMPO_BOSQUE) && c.clado === CLADO.SAUROPODO) {
    cura += BALANCE.efectosCampo.bosqueCura;
  }
  return cura;
}

/**
 * Todo lo que separa las cifras de esta unidad de las que trae impresas, con
 * nombre y signo. Es lo que hace legible una carta modificada: el tablero
 * enseña «4 · 1 · 2/3» y esto dice por qué no es «4 · 1 · 3».
 *
 * Mezcla dos clases de efecto y da igual desde fuera: los permanentes, que ya
 * están sumados en modAtaque y modVida y se recuerdan en `marcas`, y los vivos,
 * que se recalculan cada vez porque dependen del campo o de quién sigue en pie.
 *
 * @returns {{fuente: string, ataque: number, vida: number, nota: string, veces: number}[]}
 */
export function efectosDe(state, iid) {
  const inst = state.instancias[iid];
  const c = carta(inst.cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return [];
  const fuera = [];

  for (const m of inst.marcas) {
    if (m.ataque === 0 && m.vida === 0) continue;
    fuera.push({
      fuente: carta(m.cardId).binomial,
      ataque: m.ataque, vida: m.vida, veces: m.veces,
      nota: m.cardId === inst.cardId ? 'su propio rasgo' : '',
    });
  }

  if (c.rasgo === RASGO.GREGARIO) {
    const companeros = unidadesDe(state, inst.dueno)
      .filter((o) => o.iid !== inst.iid && o.cardId === inst.cardId).length;
    if (companeros > 0) {
      fuera.push({
        fuente: 'Gregario',
        ataque: companeros * BALANCE.rasgos.gregarioAtaquePorCompanero, defensa: 0, vida: 0, veces: 1,
        nota: `${companeros} de los suyos en el campo`,
      });
    }
  }

  if (c.rasgo === RASGO.RIBERENO && campoEs(state, RASGO.CAMPO_CANAL)) {
    fuera.push({
      fuente: 'Ribereño', ataque: BALANCE.rasgos.riberenoAtaque, defensa: 0, vida: 0, veces: 1,
      nota: 'el campo activo es el canal',
    });
  }

  {
    let n = 0;
    for (const otro of unidadesDe(state, inst.dueno)) {
      if (otro.cardId === inst.cardId) n += adherenciasCon(state, otro, RASGO.GREGARISMO);
    }
    if (n > 0) {
      fuera.push({
        fuente: 'Gregarismo', ataque: n * BALANCE.rasgos.gregarismoAtaque, defensa: 0, vida: 0, veces: n,
        nota: 'sobre un congénere',
      });
    }
  }

  return fuera;
}

/** Cartas pegadas a esta unidad que no le cambian las cifras pero sí lo que hace. */
export function adheridasA(state, iid) {
  return state.instancias[iid].adherencias
    .map((aid) => state.instancias[aid])
    .filter(Boolean)
    .map((a) => a.cardId);
}

/**
 * Qué puede rescatar del mazo una carta con rasgo de búsqueda, y nada si no lo
 * tiene. La búsqueda se resuelve AL JUGAR la carta, no al revelarla: el
 * despliegue es simultáneo y a ciegas, así que parar la revelación para
 * preguntar le enseñaría al rival que has buscado algo. Eligiendo antes, la
 * jugada sigue siendo secreta.
 *
 * @returns {number[]} iids del mazo del jugador que valen como objetivo
 */
export function buscablesDe(state, jugador, cardId) {
  const filtro = FILTRO_BUSQUEDA[carta(cardId).rasgo];
  if (!filtro) return [];
  return state.jugadores[jugador].mazo.filter((iid) => filtro(carta(state.instancias[iid].cardId)));
}

/** ¿Esta carta busca algo en el mazo al jugarse? */
export const buscaEnElMazo = (cardId) => FILTRO_BUSQUEDA[carta(cardId).rasgo] !== undefined;

const FILTRO_BUSQUEDA = Object.freeze({
  [RASGO.BUSCA_EVENTO]: (c) => c.tipo === TIPO.EVENTO,
  [RASGO.BUSCA_CLIMA]: (c) => c.tipo === TIPO.CLIMA,
  [RASGO.BUSCA_GREGARISMO]: (c) => c.rasgo === RASGO.GREGARISMO,
});

/** Ranuras propias libres. */
export const ranurasLibres = (state, bando) =>
  state.ranuras[bando].map((x, i) => (x === null ? i : -1)).filter((i) => i >= 0);

/**
 * Vista del estado tal y como puede verla un bando: sin la mano ni el
 * despliegue oculto del rival. La IA consume esto, nunca el estado completo.
 */
export function vistaDe(state, j) {
  const v = structuredClone(state);
  const r = v.jugadores[rival(j)];
  r.manoOculta = r.mano.length;
  r.mano = [];
  r.pendientesOcultos = r.pendientes.length;
  r.pendientes = [];
  r.mazo = r.mazo.length;
  // Se oculta sólo lo que de verdad está oculto: la mano y el mazo del rival.
  // Lo que está en el campo, adherido a una unidad, es la carta de campo activa
  // o ya fue al descarte, lo ve cualquiera.
  const descarteRival = new Set(r.descarte);
  for (const iid of Object.keys(v.instancias)) {
    const inst = v.instancias[iid];
    if (inst.dueno === j) continue;
    const publica = inst.ranura !== null
      || inst.adheridoA !== null
      || inst.iid === v.campoIid
      || descarteRival.has(inst.iid);
    if (!publica) delete v.instancias[iid];
  }
  v.perspectiva = j;
  return v;
}

export { CARTAS, TIPO, CLADO, RASGO, carta };
