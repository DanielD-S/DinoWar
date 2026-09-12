// DinoWar — renderizado. Lee el estado, nunca lo muta.

import { BALANCE } from '../data/balance.js';
import {
  CARTAS, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, RAREZA_NOMBRE, RASGO, ES_DINOSAURIO, carta, CARTAS_DE_JEFE,
} from '../data/cards.js';
import {
  unidadEn, unidadesDe, ataqueEfectivo, vidaMaxima, vidaActual,
  efectosDe, adheridasA,
} from '../engine/state.js';
import { arte, hayFoto, rutaFoto, hayEntera, rutaEntera } from './art.js';
import { volar } from './efectos.js';

export const JUGADOR = 0;
export const RIVAL = 1;

/**
 * De dónde sale cada carta que llega a la mano en este repintado. Las ranuras
 * se pintan antes que la mano: si una carta deja una ranura —una retirada—
 * se apunta aquí de dónde se fue, y la mano la hace volar desde ahí en vez
 * de desde el mazo. Se vacía al final de cada `render()`.
 */
const salidas = new Map();

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
    cuenca: id('cuenca'),
    cuenta: id('cuenta'),
    entrada: id('entrada'),
    marca: id('marca'), carga: id('carga'),
    cargaBarra: id('carga-barra'), cargaRelleno: id('carga-relleno'), cargaNota: id('carga-nota'),
    btnColeccion: id('btn-coleccion'), btnSobres: id('btn-sobres'), btnMazos: id('btn-mazos'),
    btnCuenca: id('btn-cuenca'),
    btnCuenta: id('btn-cuenta'),
    menuCuenta: id('menu-cuenta'),
    rHabitat: id('r-habitat'), pHabitat: id('p-habitat'), rBarra: id('r-barra'), pBarra: id('p-barra'),
    rPila: id('r-pila'), pPila: id('p-pila'),
    turno: id('turno'), relojes: [id('p-reloj'), id('r-reloj')],
    campo: id('campo'), franjaCampo: id('btn-campo'), franjaNota: id('franja-nota'),
    franjaMias: id('btn-mias'),
    comprometidas: id('comprometidas'), comprometidasCuerpo: id('comprometidas-cuerpo'),
    comprometidasCerrar: id('comprometidas-cerrar'),
    mano: id('mano'), mensaje: id('mensaje'),
    btnListo: id('btn-listo'), btnLog: id('btn-log'), btnMute: id('btn-mute'),
    btnAyuda: id('btn-ayuda'), btnAyudaMenu: id('btn-ayuda-menu'), btnTutorial: id('btn-tutorial'),
    btnJugar: id('btn-jugar'), btnOtra: id('btn-otra'), btnFinMenu: id('btn-fin-menu'),
    jugar: id('jugar'), btnSolitario: id('btn-solitario'), btnDuelo: id('btn-duelo'),
    btnMisiones: id('btn-misiones'), btnJugarVolver: id('btn-jugar-volver'),
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
 * La cara de una carta: la misma composición en el tablero, la mano, la
 * colección, el sobre y el visor. Cambia el tamaño, no el orden.
 *
 * Es la anatomía de una carta de TCG sobre el marco dibujado: el anillo del
 * coste, la BANDA del nombre, la VENTANA de la ilustración, la CAJA de la
 * habilidad y las dos chapas de cifras. Una criatura lleva el GÉNERO en la
 * banda y el nombre de la HABILIDAD en la caja: el binomial entero no cabe en
 * la banda —son 28 letras en 58 px— y se lee en el visor y en la colección,
 * que lo ponen debajo de la carta. Las de soporte no llevan banda ni chapas:
 * su nombre y su habilidad son el mismo, así que la caja lleva el nombre.
 *
 * `texto` añade a la caja el texto de la habilidad. Sólo cabe en el visor,
 * donde la caja mide 84 px de alto; en el tablero no entra ni a 5 px.
 *
 * Las dos cifras llevan chapa y color fijos —Ataque ámbar, Vida arcilla—
 * porque sin eso eran dos números iguales en fila y nadie sabía cuál era cuál.
 * La Vida sólo enseña el máximo cuando hay heridas: «5» de sano, «2/6» herido.
 */
function marcoCarta(estado, cardId, {
  poder = null, vidaAct = null, vidaMax = null,
  adaptada = false, mermada = false, texto = false,
} = {}) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  const atq = poder ?? c.ataque;
  const vm = vidaMax ?? c.vida;
  const va = vidaAct ?? vm;
  const herido = va < vm;

  let clasePoder = '';
  if (dino && atq > c.ataque) clasePoder = ' mejorado';
  if (dino && atq < c.ataque) clasePoder = ' mermado';

  // Dos dígitos en una chapa de 10 px no caben al mismo cuerpo que uno: la
  // cifra se sale del canto. `ancho` la baja un punto. Sólo cuenta lo que se
  // ve: el máximo entre <em> va aparte.
  const ancho = (v) => (String(v).replace(/<em>.*<\/em>/, '').length > 1 ? ' ancho' : '');
  // Las cifras salen FUERA de `.c-cuerpo`: van ancladas a la carta, porque las
  // chapas están en coordenadas de la carta y no de la caja.
  const stats = dino ? `<div class="c-stats">
        ${statHTML('a', 'Ataque', atq, clasePoder + ancho(atq))}
        ${statHTML('v', 'Vida', `${va}${herido ? `<em>/${vm}</em>` : ''}`, (herido ? ' herido' : '') + ancho(va))}
      </div>` : '';

  // La caja mide lo que mide y el texto no: «Antarctosaurus wichmannianus»
  // pide 86 px donde hay 63. `--pal` es la palabra más larga, y carta.css saca
  // de ahí el cuerpo de letra justo para que entre. La medida vive en el CSS
  // —unidades de contenedor— porque la caja cambia con el ancho de la carta.
  const palabraMasLarga = (t) => Math.max(...t.split(/\s+/).map((w) => w.length));
  const genero = c.binomial.split(/\s+/)[0];
  const banda = dino
    ? `<div class="c-banda"><span class="c-genero" style="--gen:${genero.length}">${genero}</span></div>` : '';
  // `--hn` es el largo del título entero: en el visor va a una sola línea y
  // el cuerpo baja hasta que quepa, como el género en la banda.
  const titulo = dino
    ? `<div class="c-hab" style="--pal:${palabraMasLarga(c.rasgoNombre)};--hn:${c.rasgoNombre.length}">${c.rasgoNombre}</div>`
    : `<div class="c-nombre" style="--pal:${palabraMasLarga(c.binomial)};--hn:${c.binomial.length}">${c.binomial}</div>`;
  // Y el texto, cuando lo hay, baja un punto a partir de 80 letras: hasta ahí
  // entra en las tres líneas que deja el título; siete cartas pasan.
  const textoHTML = `<p class="c-texto${c.rasgoTexto.length > 80 ? ' largo' : ''}">${c.rasgoTexto}</p>`;

  // Tres capas más: el marco por encima del arte, y las chapas donde caen las
  // cifras y el coste. carta.css explica la medida.
  const chapas = '<span class="c-marco"></span><span class="c-chapa c-chapa-b"></span>'
    + (dino ? '<span class="c-chapa c-chapa-a"></span><span class="c-chapa c-chapa-v"></span>' : '');

  return `
    ${chapas}
    <div class="c-arte">${arte(cardId)}</div>
    <span class="c-coste">${c.coste}</span>
    ${banda}
    <div class="c-cuerpo">
      ${titulo}
      ${texto ? textoHTML : ''}
    </div>
    ${stats}
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

/**
 * Qué marco dibujado le toca a una carta. Las criaturas llevan uno por rareza
 * —lo que cambia es el material, la geometría es la misma— y las dos de jefe
 * el suyo. Las tres familias de soporte llevan UN marco cada una, sin rareza:
 * son 16 cartas, y a 83 px la rareza la cuenta mejor la colección.
 */
const RAREZA_MARCO = { COMUN: 'comun', RARO: 'rara', EPICO: 'epica', LEGENDARIO: 'legendaria' };
const FAMILIA_MARCO = { CLIMA: 'clima', EVENTO: 'evento', RECURSO: 'recurso' };
function claseMarco(cardId) {
  const c = carta(cardId);
  if (CARTAS_DE_JEFE[cardId]) return ' m-dino_jefe jefe';
  if (c.tipo === TIPO.DINOSAURIO) return ` m-dino_${RAREZA_MARCO[c.rareza] ?? 'comun'}`;
  return ` m-${FAMILIA_MARCO[c.tipo] ?? 'evento'}`;
}

/**
 * Las clases de una carta: variante, familia, rareza y marco. `con-marco` va
 * en todas: desde que la colección, el sobre y el visor enseñan el marco
 * dibujado, no queda ninguna pantalla con la composición vieja.
 */
function clasesCarta(cardId, variante, clases = []) {
  return `carta carta--${variante}${claseFamilia(cardId)} rareza-${carta(cardId).rareza} con-marco${claseMarco(cardId)}`
    + `${clases.length ? ' ' + clases.join(' ') : ''}`;
}

/**
 * La carta como cadena, para las pantallas que pintan por `innerHTML`: la
 * colección, el sobre y el visor. `datos` es lo mismo que en `nodoCarta()`.
 */
export function cartaHTML(cardId, { variante, clases = [], datos = {} }) {
  return `<div class="${clasesCarta(cardId, variante, clases)}" data-card="${cardId}">${marcoCarta(null, cardId, datos)}</div>`;
}

export function nodoCarta(estado, cardId, { variante, dueno = null, iid = null, clases = [], datos = {} }) {
  const n = document.createElement('div');
  n.className = clasesCarta(cardId, variante, clases);
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

      const seVa = nodo.querySelector('.carta--ranura[data-iid]');
      if (seVa) salidas.set(seVa.dataset.iid, seVa.getBoundingClientRect());
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
  // El clima pinta el tablero entero, no sólo su franja: `efectos.css` lee
  // este atributo y pone la lluvia, la bruma o la calima en las dos capas.
  el.campo.dataset.clima = estado.campo ?? '';
  if (estado.campo) {
    const c = carta(estado.campo);
    el.franjaCampo.textContent = c.binomial;
    el.franjaCampo.dataset.card = estado.campo;
    el.franjaCampo.classList.add('puesto');
  } else {
    el.franjaCampo.textContent = 'Sin clima';
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
      if (p.objetivos?.length) return `aprieta a ${p.objetivos.map(nombre).join(' y ')}`;
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
  // Las que llegan VIAJAN: desde el mazo si se roban, desde su ranura si se
  // retiran. Varias a la vez —la mano inicial, el cambio de mano— salen en
  // cadena, no de golpe.
  let nuevas = 0;
  for (const iid of mano) {
    if (el.mano.querySelector(`[data-iid="${iid}"]`)) continue;
    const nodo = nodoCarta(estado, estado.instancias[iid].cardId, { variante: 'mano', iid });
    el.mano.appendChild(nodo);
    volar(nodo, salidas.get(String(iid)) ?? el.pPila?.getBoundingClientRect(), {
      retardo: nuevas * 70, dorso: !salidas.has(String(iid)),
    });
    nuevas += 1;
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

  pintarHabitat(estado);
  pintarRanuras(estado);
  pintarFranja(estado);
  pintarMano(estado);
  salidas.clear();
}

export function mensaje(texto, aviso = false) {
  el.mensaje.textContent = texto;
  el.mensaje.classList.toggle('aviso', aviso);
}

// ------------------------------------------------------------------ fichas

/**
 * Lo que le está pasando a ESTA copia y no a la carta del set: qué le han
 * jugado encima, qué le suma el campo y en cuánto le deja las cifras. Sin
 * esto, una carta con un punto en la esquina decía «algo te han hecho» y no
 * había forma de saber el qué.
 */
function estadoEnJuegoHTML(estado, iid) {
  const inst = estado?.instancias?.[iid];
  if (!inst || inst.ranura === null) return '';

  const c = carta(inst.cardId);
  if (c.tipo !== TIPO.DINOSAURIO) return '';

  const efectos = efectosDe(estado, iid);
  const pegadas = adheridasA(estado, iid).filter((id) => {
    // Las que ya salen como efecto no se repiten; quedan las que no tocan
    // cifras, como los Gastrolitos, que curan y no se verían en ningún sitio.
    const b = carta(id).binomial;
    return !efectos.some((e) => e.fuente === b);
  });

  const atq = ataqueEfectivo(estado, iid);
  const vm = vidaMaxima(estado, iid);
  const va = vidaActual(estado, iid);
  const heridas = vm - va;

  if (efectos.length === 0 && pegadas.length === 0 && heridas === 0) return '';

  // Signo menos de verdad (U+2212), no un guion: alineado con el «+» y sin
  // el hueco que deja el guion delante de una cifra.
  const signo = (n) => (n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`);
  const cifra = (e) => [
    e.ataque ? `${signo(e.ataque)} de Ataque` : '',
    e.vida ? `${signo(e.vida)} de Vida` : '',
  ].filter(Boolean).join(' y ');

  const filas = efectos.map((e) => `<li class="${e.ataque + e.vida < 0 ? 'malo' : 'bueno'}">
      <b>${e.fuente}${e.veces > 1 ? ` ×${e.veces}` : ''}</b>
      <span>${cifra(e)}${e.nota ? ` · ${e.nota}` : ''}</span></li>`);

  for (const id of pegadas) {
    filas.push(`<li class="bueno"><b>${carta(id).binomial}</b><span>${carta(id).rasgoTexto}</span></li>`);
  }
  if (heridas > 0) {
    filas.push(`<li class="malo"><b>Heridas</b><span>${heridas} de ${vm} de Vida${
      heridas >= vm ? '' : ` · le quedan ${va}`}</span></li>`);
  }

  return `
    <div class="ficha-juego">
      <h3>En el campo ahora mismo</h3>
      <div class="ficha-cifras">
        ${statHTML('a', 'Ataque', atq, atq === c.ataque ? '' : (atq > c.ataque ? ' mejorado' : ' mermado'))}
        ${statHTML('v', 'Vida', `${va}${heridas ? `<em>/${vm}</em>` : ''}`, heridas ? ' herido' : '')}
      </div>
      <ul class="ficha-efectos">${filas.join('')}</ul>
    </div>`;
}

/**
 * La ficha de una carta: la carta misma, con su marco y a tamaño de lectura,
 * y debajo lo que la carta no lleva impreso. En partida, la carta enseña las
 * cifras de ESTA copia —el Ataque efectivo y la Vida que le queda— y el bloque
 * de estado explica de dónde salen.
 *
 * El rasgo se repite debajo de la carta a propósito: la caja del marco lo
 * lleva a 11,5 px y recortado a lo que cabe; aquí va entero, con su nivel de
 * evidencia, que es lo que la ficha viene a contar.
 */
export function fichaHTML(cardId, iid = null, estado = null) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  // «Dinosaurio · Reptil marino» no es una familia, es una contradicción: el
  // tipo de carta y el clado real no siempre coinciden.
  const familia = !dino ? TIPO_NOMBRE[c.tipo]
    : ES_DINOSAURIO[c.clado] ? `Dinosaurio · ${CLADO_NOMBRE[c.clado]}`
      : CLADO_NOMBRE[c.clado];

  const inst = iid !== null ? estado?.instancias?.[iid] : null;
  const enJuego = inst && inst.ranura !== null && dino;
  const datos = enJuego ? {
    texto: true,
    poder: ataqueEfectivo(estado, iid),
    vidaAct: vidaActual(estado, iid),
    vidaMax: vidaMaxima(estado, iid),
    adaptada: inst.adherencias.length > 0,
    mermada: ataqueEfectivo(estado, iid) < c.ataque,
  } : { texto: true };

  const acciones = [
    hayFoto(cardId) ? `<button class="ficha-ampliar" data-zoom="${cardId}" data-modo="foto">Ver la ilustración</button>` : '',
    hayEntera(cardId) ? `<button class="ficha-ampliar" data-zoom="${cardId}" data-modo="original">Ver la carta original</button>` : '',
  ].filter(Boolean).join('');

  return `
    <div class="ficha-cab">
      <div class="ficha-carta">${cartaHTML(cardId, { variante: 'visor', datos })}</div>
      <div class="ficha-binomial${dino ? '' : ' recto'}">${c.binomial}</div>
      <div class="ficha-clado">${familia} <span class="ficha-rareza rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span></div>
      ${acciones ? `<div class="ficha-acciones">${acciones}</div>` : ''}
    </div>
    ${iid === null ? '' : estadoEnJuegoHTML(estado, iid)}
    <div class="ficha-rasgo">
      <h3>${c.rasgoNombre}</h3>
      <p>${c.rasgoTexto}</p>
      ${c.rasgo === RASGO.NINGUNO ? ''
    : `<span class="evidencia ${c.nivel_evidencia}">Evidencia del rasgo: ${c.nivel_evidencia}</span>`}
    </div>
    <p class="ficha-nota">${c.nota_cientifica}</p>`;
}

export function abrirFicha(html) {
  el.fichaCuerpo.innerHTML = html;
  el.ficha.classList.remove('oculta');
}

/**
 * La carta como se ve en el tablero, pero legible: el mismo marco a 268 px,
 * con el texto de la habilidad dentro de la caja, que aquí sí cabe. El
 * binomial entero y el clado van debajo, que es donde se aprende el nombre
 * que la banda abrevia al género.
 */
export function cartaGrandeHTML(cardId) {
  const c = carta(cardId);
  const dino = c.tipo === TIPO.DINOSAURIO;
  return `<div class="visor-marco">
    ${cartaHTML(cardId, { variante: 'visor', datos: { texto: true } })}
    <div class="visor-leyenda">
      <span class="visor-binomial${dino ? '' : ' recto'}">${c.binomial}</span>
      <span class="visor-clado">${dino ? CLADO_NOMBRE[c.clado] : TIPO_NOMBRE[c.tipo]}
        · <span class="rar-${c.rareza}">${RAREZA_NOMBRE[c.rareza]}</span></span>
    </div>
  </div>`;
}

let visorCarta = null;

/**
 * Ampliación de una carta. Hasta tres modos, porque no son la misma pregunta:
 * leer la carta (cifras y rasgo), mirar la ilustración, o ver la carta entera
 * tal y como se diseñó fuera del juego.
 *
 * El tercero es una vista de coleccionista y no puede ser otra cosa: la carta
 * entera trae las cifras cocidas en píxeles, y en el campo la Vida baja con las
 * heridas y el Ataque sube con `ataqueEfectivo()`. Por eso el modo por defecto
 * sigue siendo `carta` y este no se usa en ninguna otra pantalla.
 *
 * Se enseñan sólo los modos que existen para esta carta: sin ilustración no hay
 * selector, y sin carta entera hay dos chips en vez de tres.
 *
 * Pedir un modo que esta carta no tiene NO es un error: cae a `carta`, que
 * existe siempre. Eso es lo que deja que los botones pidan «original» sin
 * preguntar antes si la hay — hoy la tiene una de sesenta y ocho.
 * @param {string} cardId
 * @param {'carta'|'foto'|'original'} [modo]
 */
export function abrirVisor(cardId, modo = 'carta') {
  const c = carta(cardId);
  const foto = hayFoto(cardId);
  const entera = hayEntera(cardId);

  // Un modo que no existe para esta carta cae a `carta`, que existe siempre.
  const disponible = { carta: true, foto, original: entera };
  const m = disponible[modo] ? modo : 'carta';
  visorCarta = cardId;

  if (m === 'foto') {
    el.visorLienzo.innerHTML =
      `<img class="visor-foto" src="${rutaFoto(cardId)}" alt="Ilustración de ${c.binomial}">`;
  } else if (m === 'original') {
    el.visorLienzo.innerHTML =
      `<img class="visor-entera" src="${rutaEntera(cardId)}" alt="Carta completa de ${c.binomial}">`;
  } else {
    el.visorLienzo.innerHTML = cartaGrandeHTML(cardId);
  }

  const modos = [['carta', 'Carta']];
  if (foto) modos.push(['foto', 'Ilustración']);
  if (entera) modos.push(['original', 'Original']);
  el.visorModos.innerHTML = modos.length > 1
    ? modos
      .map(([k, n]) => `<button class="chip ${k === m ? 'on' : ''}" data-modo="${k}">${n}</button>`)
      .join('')
    : '';

  el.visor.classList.remove('oculta');
}

/** @param {'carta'|'foto'|'original'} modo */
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
      <b>Es una hucha.</b> Al empezar cada turno entra <b>${BALANCE.rentaPorTurno} de Biomasa</b>, siempre
      la misma, y <b>lo que no gastas se queda</b> hasta un tope de ${BALANCE.rentaTope}. Si en el turno 2
      tienes 2 y te los gastas, en el 3 tendrás 1; si no gastas nada, tendrás 3. Aguantar un turno es lo
      que te permite pagar algo caro al siguiente.
    </p>
    <p class="ayuda-p">
      El rival cobra exactamente lo mismo, vaya ganando o perdiendo. Es la corrección central de esta
      versión: en la anterior la renta dependía de ir por delante y la ventaja se realimentaba sola.
    </p>

    <div class="ayuda-h">Qué significa cada número</div>
    <div class="anatomia">
      <div class="anatomia-carta">${cartaHTML(ejemplo, { variante: 'ranura' })}</div>
      <div class="anatomia-notas">
        <div><span class="n c">${c.coste}</span><span><b>Coste</b> en Biomasa, en el anillo de arriba. A su lado, el género; en la caja, lo que hace.</span></div>
        <div><span class="n st-a">${glifo('a')}</span><span><b>Ataque</b>: daño que reparte, una vez por turno.</span></div>
        <div><span class="n st-v">${glifo('v')}</span><span><b>Vida</b>: heridas que aguanta antes de morir. Herida enseña <b>actual/máximo</b>, y <b>no se cura</b> salvo carta que lo diga.</span></div>
      </div>
    </div>

    <div class="ayuda-h">Cómo se resuelve un choque</div>
    <p class="ayuda-p">
      Los dos dinosaurios de una misma ranura se golpean <b>a la vez y una vez por turno</b>. El daño de
      cada uno se calcula sobre el estado de antes del choque, así que un intercambio puede matar a los dos.
    </p>
    <p class="ayuda-p">
      <b>Daño = el Ataque del que pega.</b> Sin restas: lo que pone en la carta es lo que hace. Lo que
      entra se queda como herida y <b>se acumula turno tras turno</b>: muere quien acumula tantas heridas
      como Vida tiene.
    </p>
    <ul class="ayuda-lista">
      <li><span class="k">Ejemplo</span><span class="v"><i>${a.binomial}</i> (Ataque ${a.ataque}, Vida ${a.vida})
        choca con <i>${d.binomial}</i> (Ataque ${d.ataque}, Vida ${d.vida}).
        Le hace <b>${a.ataque}</b> y recibe <b>${d.ataque}</b>. Los dos pegan a la vez.</span></li>
      <li><span class="k">Lo que sobra</span><span class="v">Si el golpe pasa de la Vida que le quedaba, la
        diferencia <b>sigue hasta el hábitat rival</b>. Ningún número se pierde por el camino.</span></li>
      <li><span class="k">Sin rival</span><span class="v">Ranura de enfrente vacía: el Ataque entero va al
        hábitat contrario.</span></li>
    </ul>
    <p class="ayuda-p">
      Mantén pulsada cualquier carta para leer su ficha con la nota científica.
      Ejemplo: <i>${c.binomial}</i> cuesta ${c.coste}, pega ${c.ataque} y aguanta ${c.vida}.
    </p>

    <div class="ayuda-h">Los clados</div>
    <p class="ayuda-p">Son la clasificación biológica del taxón y no cambian ninguna regla:
      un terópodo no pega más a un ornitópodo por serlo. Están para saber qué animal tienes
      delante — y porque todos existieron de verdad.</p>

    <div class="ayuda-h">Las otras cartas</div>
    <ul class="ayuda-lista">
      <li><span class="k">Evento</span><span class="v">Mejora a un dinosaurio <b>tuyo</b> o le mete una presión a uno <b>del rival</b>. La carta dice sobre qué se suelta.</span></li>
      <li><span class="k">Clima</span><span class="v">Un fenómeno atmosférico activo a la vez, que cambia las reglas <b>para los dos</b> y <b>se queda</b> hasta que otro clima lo sustituya. Tiene su propia ranura, la franja del centro, y es lo único que cabe ahí: puedes poner un clima y jugar eventos el mismo turno, pero <b>un solo clima por turno</b>.</span></li>
      <li><span class="k">Recurso</span><span class="v">Biomasa al instante a cambio de un inconveniente. Se juega <b>boca arriba</b>: el rival la ve.</span></li>
    </ul>

    <div class="ayuda-h">La mano inicial</div>
    <p class="ayuda-p">
      En el turno 1 puedes <b>cambiar la mano entera</b>. El primer cambio es gratis y roba las mismas
      cartas; a partir de ahí cada cambio roba una menos. La mano vuelve al mazo y se baraja todo,
      así que nadie puede contar lo que has devuelto.
    </p>

    <div class="ayuda-h">El reloj</div>
    <p class="ayuda-p">
      <b>Un reloj por bando</b>, de ${Math.round(BALANCE.relojPorJugador / 60)} minutos para <b>toda la partida</b> y no por
      turno, como en ajedrez: puedes pensarte una jugada difícil si luego resuelves las fáciles al vuelo.
    </p>
    <p class="ayuda-p">
      Sólo corre el de quien tiene que decidir, y se ve encendido en su fila del marcador. El tuyo se
      <b>congela en cuanto pulsas Listo</b> y no vuelve a correr hasta tu turno siguiente, así que lo que
      tarde el rival no te cuesta nada. Tampoco cuentan las animaciones ni el tiempo con la pestaña
      cerrada. <b>Quien agota su reloj, pierde.</b>
    </p>

    <div class="ayuda-h">Cómo va un turno</div>
    <ol class="ayuda-pasos">
      <li><b>Biomasa.</b> Los dos cobráis lo mismo.</li>
      <li><b>Robo.</b> ${BALANCE.robo.normal} ${BALANCE.robo.normal === 1 ? 'carta' : 'cartas'}.</li>
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
