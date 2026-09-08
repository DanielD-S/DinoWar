// DinoWar — renderizado. Lee el estado, nunca lo muta.

import { BALANCE } from '../data/balance.js';
import {
  CARTAS, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, RAREZA_NOMBRE, ESTACIONES, carta,
} from '../data/cards.js';
import {
  unidadEn, unidadesDe, ataqueEfectivo, reduccionDe, vidaMaxima, vidaActual,
} from '../engine/state.js';
import { arte, hayFoto, rutaFoto } from './art.js';

export const JUGADOR = 0;
export const RIVAL = 1;

export const el = {};

export function montar() {
  const id = (x) => document.getElementById(x);
  Object.assign(el, {
    menu: id('menu'), partida: id('partida'), fin: id('fin'),
    rTrof: id('r-trof'), rBio: id('r-bio'), rMano: id('r-mano'), rMazo: id('r-mazo'),
    pTrof: id('p-trof'), pBio: id('p-bio'), pMano: id('p-mano'), pMazo: id('p-mazo'),
    rDesc: id('r-desc'), pDesc: id('p-desc'),
    rDescBtn: id('r-desc-btn'), pDescBtn: id('p-desc-btn'),
    descarte: id('descarte'), descarteCuerpo: id('descarte-cuerpo'),
    descarteTitulo: id('descarte-titulo'), descarteTexto: id('descarte-texto'),
    descarteCerrar: id('descarte-cerrar'),
    coleccion: id('coleccion'), sobres: id('sobres'), mazos: id('mazos'),
    btnColeccion: id('btn-coleccion'), btnSobres: id('btn-sobres'), btnMazos: id('btn-mazos'),
    rHabitat: id('r-habitat'), pHabitat: id('p-habitat'), rBarra: id('r-barra'), pBarra: id('p-barra'),
    rPila: id('r-pila'), pPila: id('p-pila'),
    turno: id('turno'), estacion: id('btn-estacion'),
    campo: id('campo'), franjaCampo: id('btn-campo'), franjaNota: id('franja-nota'),
    franjaMias: id('btn-mias'),
    comprometidas: id('comprometidas'), comprometidasCuerpo: id('comprometidas-cuerpo'),
    comprometidasCerrar: id('comprometidas-cerrar'),
    mano: id('mano'), mensaje: id('mensaje'),
    btnListo: id('btn-listo'), btnLog: id('btn-log'), btnMute: id('btn-mute'),
    btnAyuda: id('btn-ayuda'), btnAyudaMenu: id('btn-ayuda-menu'), btnTutorial: id('btn-tutorial'),
    btnJugar: id('btn-jugar'), btnOtra: id('btn-otra'), btnFinMenu: id('btn-fin-menu'),
    dificultad: id('dificultad'),
    btnRendirse: id('btn-rendirse'),
    mulligan: id('mulligan'), mulliganTexto: id('mulligan-texto'),
    btnMulligan: id('btn-mulligan'), btnQuedarse: id('btn-quedarse'),
    arrastre: id('arrastre'),
    ficha: id('ficha'), fichaCuerpo: id('ficha-cuerpo'), fichaCerrar: id('ficha-cerrar'),
    visor: id('visor'), visorLienzo: id('visor-lienzo'), visorModos: id('visor-modos'),
    visorCerrar: id('visor-cerrar'),
    ayuda: id('ayuda'), ayudaCuerpo: id('ayuda-cuerpo'), ayudaCerrar: id('ayuda-cerrar'),
    log: id('log'), logCuerpo: id('log-cuerpo'), logCerrar: id('log-cerrar'),
    eleccion: id('eleccion'), eleccionTitulo: id('eleccion-titulo'),
    eleccionTexto: id('eleccion-texto'), eleccionCuerpo: id('eleccion-cuerpo'),
    eleccionCerrar: id('eleccion-cerrar'),
    finTitulo: id('fin-titulo'), finDetalle: id('fin-detalle'),
    finVia: id('fin-via'), finResumen: id('fin-resumen'), finPremio: id('fin-premio'),
    debug: id('debug'), record: id('menu-record'),
  });

  // El objetivo va junto al marcador: «0/8» dice a qué se juega, «0» no. Lo
  // mismo con el hábitat: sin el máximo, la cifra no dice cuánto queda.
  for (const m of document.querySelectorAll('[data-meta="trofeos"]')) {
    m.textContent = `/${BALANCE.trofeosParaGanar}`;
  }
  for (const m of document.querySelectorAll('[data-meta="habitat"]')) {
    m.textContent = `/${BALANCE.vidaHabitat}`;
  }

  for (const bando of [0, 1]) {
    const fila = id(`fila-${bando}`);
    fila.innerHTML = Array.from({ length: BALANCE.ranuras }, (_, r) =>
      `<div class="ranura" data-bando="${bando}" data-ranura="${r}">${bando === JUGADOR ? r + 1 : ''}</div>`).join('');
  }
  el.filas = [id('fila-0'), id('fila-1')];
}

// ----------------------------------------------------------------- cartas

/**
 * Los tres glifos de las estadísticas. Un diente, un escudo y un corazón: la
 * letra sola («A», «D», «V») no significaba nada para quien no se hubiera
 * leído la ayuda, y en la carta grande quedaban tres renglones de texto plano.
 * Van con `currentColor` para heredar el color de cada estadística.
 */
const GLIFO = {
  a: '<path d="M2.6 1h6.8c-.35 4-1.4 7.4-3.4 10.6C4 8.4 2.95 5 2.6 1Z"/>',
  d: '<path d="M6 .9 10.7 2.6c0 4.4-1.7 7.5-4.7 9-3-1.5-4.7-4.6-4.7-9Z"/>',
  v: '<path d="M6 11.2C2.1 8.5.9 6.5.9 4.7.9 3 2.1 1.8 3.6 1.8c1 0 1.9.5 2.4 1.3.5-.8 1.4-1.3 2.4-1.3C9.9 1.8 11.1 3 11.1 4.7c0 1.8-1.2 3.8-5.1 6.5Z"/>',
};

const glifo = (k) => `<i aria-hidden="true"><svg viewBox="0 0 12 12" fill="currentColor">${GLIFO[k]}</svg></i>`;

/**
 * Una estadística: glifo, nombre y cifra. El nombre viaja siempre en el DOM y
 * sólo se enseña en la carta a tamaño de lectura, donde hay sitio; en la mano
 * y en la ranura basta con el glifo, que es lo que se reconoce de un vistazo.
 */
export function statHTML(k, nombre, valor, clase = '') {
  return `<span class="st st-${k}${clase}">${glifo(k)}`
    + `<u>${nombre}</u><b>${valor}</b></span>`;
}

/**
 * La cara de una carta. Misma estructura en la ranura, en la mano y en el
 * visor: cambia el tamaño, no la composición.
 *
 * Las tres cifras llevan glifo y color fijos —A ámbar, D acero, V arcilla—
 * porque sin eso eran tres números iguales en fila y nadie sabía cuál era cuál.
 * La Vida sólo enseña el máximo cuando hay heridas: «5» de sano, «2/6» herido.
 *
 * El coste y la rareza sólo se superponen al arte en las cartas de jugar, donde
 * no cabe otra cosa. En la carta a tamaño de lectura la ilustración es el
 * contenido, así que los dos se van a una cinta encima y no tapan nada.
 */
function marcoCarta(estado, cardId, {
  poder = null, defensa = null, vidaAct = null, vidaMax = null,
  adaptada = false, mermada = false, grande = false,
} = {}) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  const atq = poder ?? c.ataque;
  const def = defensa ?? c.defensa;
  const vm = vidaMax ?? c.vida;
  const va = vidaAct ?? vm;
  const herido = va < vm;

  let clasePoder = '';
  if (dino && atq > c.ataque) clasePoder = ' mejorado';
  if (dino && atq < c.ataque) clasePoder = ' mermado';

  const coste = `<span class="c-coste">${c.coste}</span>`;
  const rareza = `<span class="c-rareza rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span>`;

  return `
    ${grande ? `<div class="c-cab">${coste}${rareza}</div>` : ''}
    <div class="c-arte">${arte(cardId)}</div>
    ${grande ? '' : coste}
    <div class="c-cuerpo">
      <div class="c-nombre">${c.binomial}</div>
      ${grande ? `<div class="c-clado">${dino ? CLADO_NOMBRE[c.clado] : TIPO_NOMBRE[c.tipo]}</div>` : ''}
      ${dino ? `<div class="c-stats">
        ${statHTML('a', 'Ataque', atq, clasePoder)}
        ${statHTML('d', 'Defensa', def)}
        ${statHTML('v', 'Vida', `${va}${herido ? `<em>/${vm}</em>` : ''}`, herido ? ' herido' : '')}
      </div>` : ''}
      ${!dino && !grande ? `<div class="c-tipo">${TIPO_NOMBRE[c.tipo]}</div>` : ''}
      ${grande ? `<div class="c-rasgo"><b>${c.rasgoNombre}</b><p>${c.rasgoTexto}</p></div>` : ''}
    </div>
    ${adaptada ? '<span class="c-adap"></span>' : ''}
    ${mermada ? '<span class="c-merma" title="Bajo una presión rival"></span>' : ''}`;
}

function claseFamilia(cardId) {
  const t = carta(cardId).tipo;
  if (t === TIPO.EVENTO) return ' evento no-dino';
  if (t === TIPO.CLIMA) return ' clima no-dino';
  if (t === TIPO.RECURSO) return ' recurso no-dino';
  return '';
}

function nodoCarta(estado, cardId, { variante, dueno = null, iid = null, clases = [], datos = {} }) {
  const n = document.createElement('div');
  n.className = `carta carta--${variante}${claseFamilia(cardId)} rareza-${carta(cardId).rareza}`
    + `${clases.length ? ' ' + clases.join(' ') : ''}`;
  if (dueno !== null) n.classList.add(dueno === JUGADOR ? 'propio' : 'rival');
  if (iid !== null) n.dataset.iid = iid;
  n.dataset.card = cardId;
  n.innerHTML = marcoCarta(estado, cardId, datos);
  return n;
}

// ------------------------------------------------------------------ campo

function pintarRanuras(estado) {
  for (const bando of [0, 1]) {
    const propias = bando === JUGADOR;
    const pendientes = propias
      ? estado.jugadores[bando].pendientes.filter((p) => p.tipo === 'DESPLIEGUE' || p.tipo === 'MOVIMIENTO')
      : [];

    for (const nodo of el.filas[bando].children) {
      const r = Number(nodo.dataset.ranura);
      const inst = unidadEn(estado, bando, r);
      const pendiente = pendientes.find((p) => p.ranura === r);
      const clave = inst ? `u${inst.iid}` : pendiente ? `p${pendiente.iid}` : null;

      if (nodo.dataset.clave === clave) {
        if (inst) {
          actualizarCarta(estado, nodo.firstElementChild, inst);
          const libre = unidadEn(estado, bando === JUGADOR ? RIVAL : JUGADOR, r) === null;
          nodo.firstElementChild?.classList.toggle('pasa', libre);
        }
        continue;
      }

      nodo.dataset.clave = clave ?? '';
      nodo.innerHTML = clave === null ? (propias ? String(r + 1) : '') : '';
      nodo.classList.toggle('ocupada', clave !== null);

      if (inst) {
        // Enfrente no hay nadie: tal y como está el campo, esta unidad pega al
        // hábitat. Es una foto del momento —el rival aún puede desplegar ahí en
        // secreto— y por eso se marca con el borde y no con una promesa escrita.
        const libre = unidadEn(estado, bando === JUGADOR ? RIVAL : JUGADOR, r) === null;
        nodo.appendChild(nodoCarta(estado, inst.cardId, {
          variante: 'ranura', dueno: bando, iid: inst.iid, clases: libre ? ['entra', 'pasa'] : ['entra'],
          datos: {
            poder: ataqueEfectivo(estado, inst.iid),
            defensa: reduccionDe(estado, inst.iid),
            vidaAct: vidaActual(estado, inst.iid),
            vidaMax: vidaMaxima(estado, inst.iid),
            adaptada: inst.adherencias.length > 0,
            mermada: ataqueEfectivo(estado, inst.iid) < carta(inst.cardId).ataque,
          },
        }));
      } else if (pendiente) {
        // Sólo se ven las cartas propias comprometidas: sabes qué has jugado.
        const cardId = estado.instancias[pendiente.iid].cardId;
        nodo.appendChild(nodoCarta(estado, cardId, {
          variante: 'ranura', dueno: bando, iid: pendiente.iid, clases: ['pendiente', 'aterriza'],
        }));
      }
    }
  }
}

function actualizarCarta(estado, nodo, inst) {
  if (!nodo) return;
  const c = carta(inst.cardId);
  const p = ataqueEfectivo(estado, inst.iid);
  const va = vidaActual(estado, inst.iid);
  const vm = vidaMaxima(estado, inst.iid);

  const atqNodo = nodo.querySelector('.st-a');
  if (atqNodo) {
    atqNodo.querySelector('b').textContent = p;
    atqNodo.classList.toggle('mejorado', p > c.ataque);
    atqNodo.classList.toggle('mermado', p < c.ataque);
  }
  const defNodo = nodo.querySelector('.st-d b');
  if (defNodo) defNodo.textContent = reduccionDe(estado, inst.iid);

  const vidaNodo = nodo.querySelector('.st-v');
  if (vidaNodo) {
    const herido = va < vm;
    vidaNodo.querySelector('b').innerHTML = `${va}${herido ? `<em>/${vm}</em>` : ''}`;
    vidaNodo.classList.toggle('herido', herido);
  }

  const tiene = !!nodo.querySelector('.c-adap');
  if (inst.adherencias.length && !tiene) nodo.insertAdjacentHTML('beforeend', '<span class="c-adap"></span>');
  if (!inst.adherencias.length && tiene) nodo.querySelector('.c-adap').remove();

  // Una unidad mermada por una presión rival sólo se distinguía por el color de
  // una cifra de 9 px: se le pone marca, como a la adaptada.
  const merma = !!nodo.querySelector('.c-merma');
  if (p < c.ataque && !merma) {
    nodo.insertAdjacentHTML('beforeend', '<span class="c-merma" title="Bajo una presión rival"></span>');
  }
  if (p >= c.ataque && merma) nodo.querySelector('.c-merma').remove();
}

function pintarHabitat(estado) {
  for (const [bando, num, barra] of [[RIVAL, el.rHabitat, el.rBarra], [JUGADOR, el.pHabitat, el.pBarra]]) {
    const v = Math.max(0, estado.jugadores[bando].habitat);
    num.textContent = v;
    barra.style.width = `${(100 * v) / BALANCE.vidaHabitat}%`;
  }
}

function pintarFranja(estado) {
  if (estado.campo) {
    const c = carta(estado.campo);
    el.franjaCampo.textContent = c.binomial;
    el.franjaCampo.dataset.card = estado.campo;
    el.franjaCampo.classList.add('puesto');
  } else {
    el.franjaCampo.textContent = 'Sin carta de campo';
    delete el.franjaCampo.dataset.card;
    el.franjaCampo.classList.remove('puesto');
  }

  // Cuántas cartas ha comprometido el rival, pero NO dónde: saber la ranura
  // arruinaría la información oculta, que es de lo que va el despliegue.
  const n = estado.jugadores[RIVAL].pendientes.length;
  el.franjaNota.textContent = n === 0 ? '' : `rival: ${n} oculta${n === 1 ? '' : 's'}`;

  // Y lo tuyo, que sí puedes deshacer mientras no pulses Listo.
  const mias = estado.jugadores[JUGADOR].pendientes.length;
  el.franjaMias.hidden = mias === 0;
  el.franjaMias.textContent = mias === 1 ? 'tú: 1 comprometida' : `tú: ${mias} comprometidas`;
}

/** Qué hace cada carta comprometida, dicho como lo diría el jugador. */
function queHace(estado, p) {
  const c = carta(estado.instancias[p.iid].cardId);
  const nombre = (id) => carta(estado.instancias[id].cardId).binomial;
  switch (p.tipo) {
    case 'DESPLIEGUE': return `se despliega en la ranura ${p.ranura + 1}`;
    case 'MOVIMIENTO': return `se mueve a la ranura ${p.ranura + 1}`;
    case 'CAMPO': return 'se impone como clima';
    case 'ADAPTACION': return `mejora a ${nombre(p.objetivo)}`;
    case 'PRESION':
      if (p.objetivo) return `cae sobre ${nombre(p.objetivo)}`;
      if (p.clado) return `aprieta a los ${CLADO_NOMBRE[p.clado].toLowerCase()}s rivales`;
      return c.rasgoNombre;
    default: return '';
  }
}

/**
 * Lo comprometido este turno, con su marcha atrás. Hasta pulsar Listo nada ha
 * ocurrido y el rival no ve qué es, así que devolverlo no filtra nada — y sin
 * esto, soltar una carta en la ranura equivocada costaba el turno entero.
 */
export function abrirComprometidas(estado) {
  const jug = estado.jugadores[JUGADOR];
  el.comprometidasCuerpo.innerHTML = jug.pendientes.length === 0
    ? '<p class="desc-vacio">No llevas nada comprometido este turno.</p>'
    : jug.pendientes.map((p) => {
      const c = carta(estado.instancias[p.iid].cardId);
      const dino = c.tipo === TIPO.DINOSAURIO;
      const gratis = p.tipo === 'MOVIMIENTO';
      return `<div class="comp-fila">
        <span class="nom">${dino ? `<i>${c.binomial}</i>` : c.binomial}
          <span class="que">${queHace(estado, p)}</span></span>
        <button class="retirar" data-retirar="${p.iid}">Retirar${gratis ? '' : ` · +${c.coste}`}</button>
      </div>`;
    }).join('');
  el.comprometidas.classList.remove('oculta');
}

// -------------------------------------------------------------------- mano

function pintarMano(estado) {
  const mano = estado.jugadores[JUGADOR].mano;
  const quiero = new Set(mano.map(String));

  for (const nodo of [...el.mano.children]) {
    if (!quiero.has(nodo.dataset.iid)) nodo.remove();
  }
  for (const iid of mano) {
    if (el.mano.querySelector(`[data-iid="${iid}"]`)) continue;
    el.mano.appendChild(nodoCarta(estado, estado.instancias[iid].cardId, { variante: 'mano', iid }));
  }

  // Sin abanico: la mano es una fila y el orden es el del mazo. Lo único que
  // se calcula aquí es qué cartas no puedes pagar.
  const biomasa = estado.jugadores[JUGADOR].biomasa;
  for (const iid of mano) {
    const nodo = el.mano.querySelector(`[data-iid="${iid}"]`);
    if (!nodo) continue;
    nodo.classList.toggle('impagable', carta(nodo.dataset.card).coste > biomasa);
  }
}

// ----------------------------------------------------------------- general

export function render(estado) {
  const [p, r] = estado.jugadores;

  el.pTrof.textContent = p.trofeos;
  el.pBio.textContent = p.biomasa;
  el.pMano.textContent = p.mano.length;
  el.pMazo.textContent = p.mazo.length;
  el.pDesc.textContent = p.descarte.length;
  el.rDesc.textContent = r.descarte.length;
  el.rTrof.textContent = r.trofeos;
  el.rBio.textContent = r.biomasa;
  el.rMano.textContent = r.mano.length;
  el.rMazo.textContent = r.mazo.length;
  el.turno.textContent = `Turno ${estado.turno}`;

  // Quedarse sin mazo es perder: hay que poder verlo venir.
  el.pPila.classList.toggle('aviso', p.mazo.length <= 4);
  el.rPila.classList.toggle('aviso', r.mazo.length <= 4);

  const est = estado.estacion.actual;
  el.estacion.hidden = !est;
  if (est) {
    el.estacion.textContent = est === 'SEQUIA' ? 'Sequía' : 'Crecida';
    el.estacion.className = `estacion ${est === 'SEQUIA' ? 'sequia' : 'crecida'}`;
  }

  pintarHabitat(estado);
  pintarRanuras(estado);
  pintarFranja(estado);
  pintarMano(estado);
}

export function mensaje(texto, aviso = false) {
  el.mensaje.textContent = texto;
  el.mensaje.classList.toggle('aviso', aviso);
}

// ------------------------------------------------------------------ fichas

export function fichaHTML(cardId) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  const familia = dino ? `Dinosaurio · ${CLADO_NOMBRE[c.clado]}` : TIPO_NOMBRE[c.tipo];

  // La ilustración va de ancho completo y no en un cuadrado al lado del texto:
  // las fotos son apaisadas (proporción 1,5 a 1,8) y en un cuadro 1:1 se les
  // recortaba medio animal, que es justo lo que esta pantalla viene a enseñar.
  return `
    <div class="ficha-cab">
      <button class="ficha-arte" data-zoom="${cardId}" data-modo="${hayFoto(cardId) ? 'foto' : 'carta'}"
              aria-label="${hayFoto(cardId) ? 'Ver la ilustración en grande' : 'Ver la carta en grande'}">
        ${arte(cardId)}<span class="ficha-lupa" aria-hidden="true">⤢</span>
      </button>
      <div class="ficha-binomial${dino ? '' : ' recto'}">${c.binomial}</div>
      <div class="ficha-clado">${familia} <span class="ficha-rareza rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span></div>
      <div class="ficha-cifras">
        <span class="st st-c"><i aria-hidden="true">◆</i><u>Coste</u><b>${c.coste}</b></span>
        ${dino ? statHTML('a', 'Ataque', c.ataque) : ''}
        ${dino ? statHTML('d', 'Defensa', c.defensa) : ''}
        ${dino ? statHTML('v', 'Vida', c.vida) : ''}
      </div>
      <button class="ficha-ampliar" data-zoom="${cardId}" data-modo="carta">Ver la carta en grande</button>
    </div>
    <div class="ficha-rasgo">
      <h3>${c.rasgoNombre}</h3>
      <p>${c.rasgoTexto}</p>
      <span class="evidencia ${c.nivel_evidencia}">Evidencia del rasgo: ${c.nivel_evidencia}</span>
    </div>
    <p class="ficha-nota">${c.nota_cientifica}</p>`;
}

export function fichaEstacionHTML(id) {
  const e = ESTACIONES[id];
  return `
    <div class="ficha-cab"><div><div class="ficha-binomial recto">${e.nombre}</div></div></div>
    <div class="ficha-rasgo">
      <p>${e.texto}</p>
      <span class="evidencia ${e.nivel_evidencia}">Evidencia: ${e.nivel_evidencia}</span>
    </div>
    <p class="ficha-nota">${e.nota_cientifica}</p>`;
}

export function abrirFicha(html) {
  el.fichaCuerpo.innerHTML = html;
  el.ficha.classList.remove('oculta');
}

/**
 * La carta como se ve en el tablero, pero legible. No se recalculan tamaños:
 * se escala el marco entero, así que lo que se amplía es exactamente la carta
 * que se juega, con su proporción y su composición.
 */
export function cartaGrandeHTML(cardId) {
  return `<div class="visor-marco">
    <div class="carta carta--visor${claseFamilia(cardId)}">${marcoCarta(null, cardId, { grande: true })}</div>
  </div>`;
}

let visorCarta = null;

/**
 * Ampliación de una carta. Dos modos, porque no son la misma pregunta: leer la
 * carta (cifras y rasgo) o mirar la ilustración. Sin ilustración hay un modo
 * solo y no se enseña el selector.
 * @param {string} cardId
 * @param {'carta'|'foto'} [modo]
 */
export function abrirVisor(cardId, modo = 'carta') {
  const c = carta(cardId);
  const foto = hayFoto(cardId);
  const m = foto ? modo : 'carta';
  visorCarta = cardId;

  el.visorLienzo.innerHTML = m === 'foto'
    ? `<img class="visor-foto" src="${rutaFoto(cardId)}" alt="Ilustración de ${c.binomial}">`
    : cartaGrandeHTML(cardId);

  el.visorModos.innerHTML = foto
    ? [['carta', 'Carta'], ['foto', 'Ilustración']]
      .map(([k, n]) => `<button class="chip ${k === m ? 'on' : ''}" data-modo="${k}">${n}</button>`)
      .join('')
    : '';

  el.visor.classList.remove('oculta');
}

export function cambiarModoVisor(modo) {
  if (visorCarta) abrirVisor(visorCarta, modo);
}

export function cerrarVisor() {
  el.visor.classList.add('oculta');
  el.visorLienzo.innerHTML = '';
  visorCarta = null;
}

export function visorAbierto() {
  return !el.visor.classList.contains('oculta');
}

export function cerrarHojas() {
  cerrarVisor();
  for (const h of [el.ficha, el.log, el.eleccion, el.ayuda, el.descarte, el.comprometidas]) {
    h.classList.add('oculta');
  }
}

/**
 * Descarte de un bando, agrupado por carta. Es información pública en el motor
 * —`vistaDe` la respeta— pero hasta ahora no se enseñaba, y sin ella adivinar
 * dónde despliega el rival era una moneda al aire en vez de una deducción.
 */
export function abrirDescarte(estado, bando) {
  const jug = estado.jugadores[bando];
  const cuenta = new Map();
  for (const iid of jug.descarte) {
    const cardId = estado.instancias[iid].cardId;
    cuenta.set(cardId, (cuenta.get(cardId) ?? 0) + 1);
  }

  el.descarteTitulo.textContent = bando === JUGADOR ? 'Tu descarte' : 'Descarte del rival';
  el.descarteTexto.textContent = bando === JUGADOR
    ? 'Lo que has jugado y perdido. No vuelve al mazo.'
    : 'Lo que el rival ya ha gastado y perdido. Lo que no está aquí, aún lo tiene.';

  const filas = [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1] || carta(a[0]).binomial.localeCompare(carta(b[0]).binomial))
    .map(([cardId, n]) => {
      const c = carta(cardId);
      const dino = c.tipo === TIPO.DINOSAURIO;
      return `<div class="desc-fila" data-card="${cardId}">
        <span class="n">${n}×</span>
        <span class="nom">${dino ? `<i>${c.binomial}</i>` : c.binomial}
          <span class="fam">${dino ? CLADO_NOMBRE[c.clado] : TIPO_NOMBRE[c.tipo]}</span></span>
      </div>`;
    });

  el.descarteCuerpo.innerHTML = filas.length
    ? `<div class="desc-lista">${filas.join('')}</div>`
    : '<p class="desc-vacio">Todavía no ha ido nada al descarte.</p>';
  el.descarte.classList.remove('oculta');
}

// ------------------------------------------------------------------ ayuda

/** Se genera desde balance.js y cards.js: no puede quedarse desfasada. */
export function ayudaHTML() {
  const ejemplo = 'allosaurus';
  const c = carta(ejemplo);
  // El ejemplo del choque sale de dos cartas reales: si sus números cambian,
  // cambia la cuenta que se enseña.
  const a = carta('allosaurus');
  const d = carta('stegosaurus');
  const espinas = BALANCE.clados.espinasTireoforo + BALANCE.rasgos.tagomizadorExtra;   // púas + Tagomizador
  const n = document.createElement('div');
  n.className = 'carta carta--ranura';
  n.innerHTML = marcoCarta(null, ejemplo);

  return `
    <div class="ayuda-h">Las tres formas de ganar</div>
    <ul class="ayuda-lista">
      <li><span class="k">Registro fósil</span><span class="v">Reúne <b>${BALANCE.trofeosParaGanar} trofeos</b>. Cada dinosaurio rival que muere te da uno.</span></li>
      <li><span class="k">Hábitat</span><span class="v">Derriba el hábitat rival, que empieza con <b>${BALANCE.vidaHabitat}</b> de Vida.</span></li>
      <li><span class="k">Extinción</span><span class="v">Si al rival le toca robar y no le quedan cartas, pierde. <b>El descarte no se rebaraja</b>: el mazo es un reloj.</span></li>
    </ul>

    <div class="ayuda-h">El campo</div>
    <p class="ayuda-p">
      Cada bando tiene <b>${BALANCE.ranuras} ranuras</b>, enfrentadas una a una. Si en la ranura 3 tenéis
      dinosaurio los dos, combaten. Si el rival la tiene <b>vacía</b>, el tuyo golpea su hábitat.
    </p>
    <p class="ayuda-p">
      De ahí sale la decisión de cada turno: <b>una fila llena tapa tu hábitat pero regala trofeos;
      una fila corta niega trofeos pero deja pasar el daño</b>. No hay postura segura.
    </p>

    <div class="ayuda-h">La Biomasa</div>
    <p class="ayuda-p">
      <b>No es una hucha.</b> Al empezar cada turno tu Biomasa se <b>reemplaza</b> por el número de turno,
      hasta ${BALANCE.rentaTope}: en el turno 3 tienes 3 hayas gastado o no, y en el 4 tienes 4.
      Lo que no gastas <b>se pierde</b>.
    </p>
    <p class="ayuda-p">
      El rival cobra exactamente lo mismo, vaya ganando o perdiendo. Es la corrección central de esta
      versión: en la anterior la renta dependía de ir por delante y la ventaja se realimentaba sola.
    </p>

    <div class="ayuda-h">Qué significa cada número</div>
    <div class="anatomia">
      <div class="anatomia-carta">${n.outerHTML}</div>
      <div class="anatomia-notas">
        <div><span class="n c">${c.coste}</span><span><b>Coste</b> en Biomasa. Va en el círculo, sobre el arte.</span></div>
        <div><span class="n st-a">${glifo('a')}</span><span><b>Ataque</b>: daño que reparte, una vez por turno.</span></div>
        <div><span class="n st-d">${glifo('d')}</span><span><b>Defensa</b>: se resta de <b>cada</b> golpe que recibe, no de la Vida.</span></div>
        <div><span class="n st-v">${glifo('v')}</span><span><b>Vida</b>: heridas que aguanta antes de morir. Herida enseña <b>actual/máximo</b>, y <b>no se cura</b> salvo carta que lo diga.</span></div>
      </div>
    </div>

    <div class="ayuda-h">Cómo se resuelve un choque</div>
    <p class="ayuda-p">
      Los dos dinosaurios de una misma ranura se golpean <b>a la vez y una vez por turno</b>. El daño de
      cada uno se calcula sobre el estado de antes del choque, así que un intercambio puede matar a los dos.
    </p>
    <p class="ayuda-p">
      <b>Daño = Ataque del que pega − Defensa del que recibe</b>, nunca menos de 0. Lo que pasa se queda
      como herida y <b>se acumula turno tras turno</b>: muere quien acumula tantas heridas como Vida tiene.
    </p>
    <ul class="ayuda-lista">
      <li><span class="k">Ejemplo</span><span class="v"><i>${a.binomial}</i> (Ataque ${a.ataque}, Defensa ${a.defensa}, Vida ${a.vida})
        choca con <i>${d.binomial}</i> (Ataque ${d.ataque}, Defensa ${d.defensa}, Vida ${d.vida}).
        Le hace ${a.ataque} − ${d.defensa} = <b>${Math.max(0, a.ataque - d.defensa)}</b>.
        Recibe ${d.ataque} − ${a.defensa} = ${Math.max(0, d.ataque - a.defensa)}, y encima ${espinas} de púas
        caudales, que <b>no</b> las para la Defensa: <b>${Math.max(0, d.ataque - a.defensa) + espinas}</b> en total.
        Con ${a.vida} de Vida, el depredador cae y el ${'tireóforo'} se queda en pie con
        ${d.vida - Math.max(0, a.ataque - d.defensa)} de ${d.vida}.</span></li>
      <li><span class="k">Bloqueo</span><span class="v">Si ninguno pasa la Defensa del otro, los dos se quedan
        mirándose: no muere nadie y el hábitat no recibe nada. Un muro no gana, <b>tapa</b>.</span></li>
      <li><span class="k">Sin rival</span><span class="v">Ranura de enfrente vacía: el Ataque entero va al
        hábitat contrario. La Defensa sólo cuenta contra dinosaurios.</span></li>
    </ul>
    <p class="ayuda-p">
      Mantén pulsada cualquier carta para leer su ficha con la nota científica.
      Ejemplo: <i>${c.binomial}</i> cuesta ${c.coste}, pega ${c.ataque}, para ${c.defensa} y aguanta ${c.vida}.
    </p>

    <div class="ayuda-h">Los cuatro clados</div>
    <p class="ayuda-p">No es piedra-papel-tijera: es una red trófica.</p>
    <ul class="ayuda-lista">
      <li><span class="k">Terópodo</span><span class="v">+${BALANCE.clados.bonusDepredacion} de daño contra ornitópodos. Depredación sobre presa pequeña.</span></li>
      <li><span class="k">Saurópodo</span><span class="v">Mucha Vida y mucha Defensa. La talla adulta es su defensa; no necesita regla aparte.</span></li>
      <li><span class="k">Tireóforo</span><span class="v">Devuelve ${BALANCE.clados.espinasTireoforo} de daño a quien lo ataque. Púas caudales.</span></li>
      <li><span class="k">Ornitópodo</span><span class="v">Barato y frágil. Es la presa.</span></li>
    </ul>

    <div class="ayuda-h">Las otras cartas</div>
    <ul class="ayuda-lista">
      <li><span class="k">Evento</span><span class="v">Mejora a un dinosaurio <b>tuyo</b> o le mete una presión a uno <b>del rival</b>. La carta dice sobre qué se suelta.</span></li>
      <li><span class="k">Clima</span><span class="v">Un paleoambiente activo a la vez, que cambia las reglas <b>para los dos</b>. Se suelta en la franja central.</span></li>
      <li><span class="k">Recurso</span><span class="v">Biomasa al instante a cambio de un inconveniente. Se juega <b>boca arriba</b>: el rival la ve.</span></li>
    </ul>

    <div class="ayuda-h">La mano inicial</div>
    <p class="ayuda-p">
      En el turno 1 puedes <b>cambiar la mano entera</b>. El primer cambio es gratis y roba las mismas
      cartas; a partir de ahí cada cambio roba una menos. La mano vuelve al mazo y se baraja todo,
      así que nadie puede contar lo que has devuelto.
    </p>

    <div class="ayuda-h">Cómo va un turno</div>
    <ol class="ayuda-pasos">
      <li><b>Estación.</b> Desde el turno ${BALANCE.turnoPrimeraEstacion}, una carta de clima que nadie controla.</li>
      <li><b>Biomasa.</b> Los dos cobráis lo mismo.</li>
      <li><b>Robo.</b> ${BALANCE.robo.normal} cartas.</li>
      <li><b>Despliegue.</b> Sueltas cartas <b>boca abajo</b>. El rival no ve qué pones ni dónde.</li>
      <li><b>Combate.</b> Se revela todo a la vez y chocan las ranuras, de la 1 a la ${BALANCE.ranuras}.</li>
    </ol>

    <div class="ayuda-h">Nivel de evidencia</div>
    <p class="ayuda-p">El color dice cuánto respalda la ciencia a ese rasgo, no al animal:</p>
    <div class="leyenda-ev">
      <span><i class="ev ESTABLECIDO"></i> Establecido</span>
      <span><i class="ev INFERIDO"></i> Inferido</span>
      <span><i class="ev DEBATIDO"></i> Debatido</span>
    </div>
    <p class="ayuda-p" style="margin-top:10px">
      Los ${Object.values(CARTAS).filter((x) => x.tipo === TIPO.DINOSAURIO).length} taxones existen y están descritos
      formalmente. El núcleo es la Formación Morrison, del Jurásico Superior; el resto llega de otras
      formaciones y otras edades, y cada ficha dice de cuál y de cuándo. Ninguno lleva plumas porque
      ninguno tiene evidencia que las respalde, salvo el pterosaurio, que sí la tiene y por eso se dice.
    </p>`;
}

export { CARTAS };
