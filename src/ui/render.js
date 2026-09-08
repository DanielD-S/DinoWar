// DinoWar — renderizado. Lee el estado, nunca lo muta.

import { BALANCE } from '../data/balance.js';
import { CARTAS, TIPO, TIPO_NOMBRE, CLADO_NOMBRE, ESTACIONES, carta } from '../data/cards.js';
import {
  unidadEn, unidadesDe, ataqueEfectivo, reduccionDe, vidaMaxima, vidaActual, rentaDe,
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
    turno: id('turno'), estacion: id('btn-estacion'),
    campo: id('campo'), franjaCampo: id('btn-campo'), franjaNota: id('franja-nota'),
    mano: id('mano'), mensaje: id('mensaje'),
    btnListo: id('btn-listo'), btnLog: id('btn-log'), btnMute: id('btn-mute'),
    btnAyuda: id('btn-ayuda'), btnAyudaMenu: id('btn-ayuda-menu'),
    btnJugar: id('btn-jugar'), btnOtra: id('btn-otra'),
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
    debug: id('debug'), record: id('menu-record'),
  });

  // El objetivo va junto al marcador: «0/8» dice a qué se juega, «0» no.
  for (const m of document.querySelectorAll('[data-meta="trofeos"]')) {
    m.textContent = `/${BALANCE.trofeosParaGanar}`;
  }

  for (const bando of [0, 1]) {
    const fila = id(`fila-${bando}`);
    fila.innerHTML = Array.from({ length: BALANCE.ranuras }, (_, r) =>
      `<div class="ranura" data-bando="${bando}" data-ranura="${r}">${bando === JUGADOR ? r + 1 : ''}</div>`).join('');
  }
  el.filas = [id('fila-0'), id('fila-1')];
}

// ----------------------------------------------------------------- cartas

function marcoCarta(estado, cardId, { poder = null, defensa = null, vidaAct = null, vidaMax = null, adaptada = false } = {}) {
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

  return `
    <div class="c-top">
      <span class="c-coste">${c.coste}</span>
      ${dino ? `<span class="c-def">${def}</span>` : ''}
      <span class="c-poder${clasePoder}">${dino ? atq : ''}</span>
    </div>
    <div class="c-arte">${arte(cardId)}</div>
    <div class="c-nombre">${c.binomial}</div>
    ${dino ? `<div class="c-vida${herido ? ' herido' : ''}">
      <span class="c-vida-barra"><i style="width:${Math.max(0, (100 * va) / vm).toFixed(0)}%"></i></span>
      <span class="c-vida-num">${va}/${vm}</span>
    </div>` : ''}
    ${adaptada ? '<span class="c-adap"></span>' : ''}`;
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
  n.className = `carta carta--${variante}${claseFamilia(cardId)}${clases.length ? ' ' + clases.join(' ') : ''}`;
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
        if (inst) actualizarCarta(estado, nodo.firstElementChild, inst);
        continue;
      }

      nodo.dataset.clave = clave ?? '';
      nodo.innerHTML = clave === null ? (propias ? String(r + 1) : '') : '';
      nodo.classList.toggle('ocupada', clave !== null);

      if (inst) {
        nodo.appendChild(nodoCarta(estado, inst.cardId, {
          variante: 'ranura', dueno: bando, iid: inst.iid, clases: ['entra'],
          datos: {
            poder: ataqueEfectivo(estado, inst.iid),
            defensa: reduccionDe(estado, inst.iid),
            vidaAct: vidaActual(estado, inst.iid),
            vidaMax: vidaMaxima(estado, inst.iid),
            adaptada: inst.adherencias.length > 0,
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

  const poderNodo = nodo.querySelector('.c-poder');
  if (poderNodo && poderNodo.textContent !== String(p)) poderNodo.textContent = p;
  if (poderNodo) {
    poderNodo.classList.toggle('mejorado', p > c.ataque);
    poderNodo.classList.toggle('mermado', p < c.ataque);
  }
  const defNodo = nodo.querySelector('.c-def');
  if (defNodo) defNodo.textContent = reduccionDe(estado, inst.iid);

  const vidaNodo = nodo.querySelector('.c-vida');
  if (vidaNodo) {
    vidaNodo.querySelector('i').style.width = `${Math.max(0, (100 * va) / vm).toFixed(0)}%`;
    vidaNodo.querySelector('.c-vida-num').textContent = `${va}/${vm}`;
    vidaNodo.classList.toggle('herido', va < vm);
  }

  const tiene = !!nodo.querySelector('.c-adap');
  if (inst.adherencias.length && !tiene) nodo.insertAdjacentHTML('beforeend', '<span class="c-adap"></span>');
  if (!inst.adherencias.length && tiene) nodo.querySelector('.c-adap').remove();
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

  const nodos = mano.map((iid) => el.mano.querySelector(`[data-iid="${iid}"]`));
  const n = nodos.length;
  const centro = (n - 1) / 2;
  // El presupuesto descuenta el ancho de carta y el ensanche del giro.
  const ancho = el.mano.clientWidth || 360;
  const separacion = Math.min(52, (ancho - 110) / Math.max(1, n - 1 || 1));
  const paso = n > 1 ? Math.min(6.5, 30 / n) : 0;
  const biomasa = estado.jugadores[JUGADOR].biomasa;

  nodos.forEach((nodo, i) => {
    if (!nodo) return;
    const d = i - centro;
    // El descuelgue se limita: con 9 cartas en mano (7 de límite + 2 de robo)
    // la curva cuadrática metía las cartas de los extremos dentro del botón.
    const caida = Math.min(14, Math.abs(d) ** 2 * 2.2);
    nodo.style.transform =
      `translateX(${(d * separacion).toFixed(1)}px) translateY(${caida.toFixed(1)}px) rotate(${(d * paso).toFixed(2)}deg)`;
    nodo.style.zIndex = String(10 + i);
    nodo.classList.toggle('impagable', carta(nodo.dataset.card).coste > biomasa);
  });
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
  el.pMazo.parentElement.classList.toggle('aviso', p.mazo.length <= 4);
  el.rMazo.parentElement.classList.toggle('aviso', r.mazo.length <= 4);

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

  return `
    <div class="ficha-cab">
      <button class="ficha-arte" data-zoom="${cardId}" data-modo="${hayFoto(cardId) ? 'foto' : 'carta'}"
              aria-label="${hayFoto(cardId) ? 'Ver la ilustración en grande' : 'Ver la carta en grande'}">
        ${arte(cardId)}<span class="ficha-lupa" aria-hidden="true">⤢</span>
      </button>
      <div>
        <div class="ficha-binomial${dino ? '' : ' recto'}">${c.binomial}</div>
        <div class="ficha-clado">${familia}</div>
        <div class="ficha-cifras">
          <span>Coste <b>${c.coste}</b></span>
          ${dino ? `<span>Ataque <b>${c.ataque}</b></span>` : ''}
          ${dino ? `<span>Defensa <b>${c.defensa}</b></span>` : ''}
          ${dino ? `<span>Vida <b>${c.vida}</b></span>` : ''}
          ${dino && c.consumoHidrico ? `<span>Agua <b>${c.consumoHidrico}</b></span>` : ''}
        </div>
        <button class="ficha-ampliar" data-zoom="${cardId}" data-modo="carta">Ver la carta en grande</button>
      </div>
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
    <div class="carta${claseFamilia(cardId)}">${marcoCarta(null, cardId)}</div>
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
  for (const h of [el.ficha, el.log, el.eleccion, el.ayuda, el.descarte]) h.classList.add('oculta');
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
      dinosaurio los dos, combaten. Si el rival la tiene <b>vacía</b>, el tuyo golpea su habitat.
    </p>
    <p class="ayuda-p">
      De ahí sale la decisión de cada turno: <b>una fila llena tapa tu hábitat pero regala trofeos;
      una fila corta niega trofeos pero deja pasar el daño</b>. No hay postura segura.
    </p>

    <div class="ayuda-h">La Biomasa</div>
    <p class="ayuda-p">
      Recibes <b>tanta Biomasa como el número de turno</b>, hasta ${BALANCE.rentaTope}, y lo mismo recibe el rival
      vaya ganando o perdiendo. No se acumula: lo que no gastas se pierde. En el turno ${Math.min(4, BALANCE.rentaTope)}
      tendrás ${Math.min(4, BALANCE.rentaTope)}, ahora mismo ${rentaDe({ turno: 1, campo: null })}.
    </p>

    <div class="ayuda-h">Qué significa cada número</div>
    <div class="anatomia">
      <div class="anatomia-carta">
        ${n.outerHTML}
        <span class="llamada" style="left:-6px; top:-6px">1</span>
        <span class="llamada" style="left:32px; top:-6px">2</span>
        <span class="llamada" style="right:-6px; top:-6px">3</span>
        <span class="llamada" style="right:-6px; bottom:-6px">4</span>
      </div>
      <div class="anatomia-notas">
        <div><span class="n">1</span><span><b>Coste</b> en Biomasa.</span></div>
        <div><span class="n">2</span><span><b>Defensa</b>: resta de todo daño que reciba.</span></div>
        <div><span class="n">3</span><span><b>Ataque</b>: daño que hace cada turno.</span></div>
        <div><span class="n">4</span><span><b>Vida</b>: lo que aguanta. Las heridas <b>no se curan</b> salvo carta que lo diga.</span></div>
      </div>
    </div>
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
