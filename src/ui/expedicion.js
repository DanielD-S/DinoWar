// DinoWar — la pantalla de la Expedición: el mapa, los nodos y la cartela.
//
// Sólo pinta. Qué rivales hay y en qué orden lo dicen los datos
// (`src/data/expediciones.js`); a quién has vencido lo dice el servidor
// (`mis_expediciones`). Al tocar «Luchar» avisa a main.js con el id del rival,
// y la partida es la de siempre con otro mazo enfrente.
//
// El arte llega aparte y puede no estar: el mapa, los medallones y la cartela
// se pintan con CSS mientras tanto. Se sabe qué hay por `indice.json`, que
// escribe `tools/expediciones.py`, y no pidiendo cada fichero: una pieza que
// no existe es un 404 en la consola, y ya hubo quejas de eso con los vídeos.
//
// Con más de una formación hace falta elegir, y eso NO es una pantalla nueva:
// es una tira de fichas arriba del mapa que lo cambia en el sitio. Una pantalla
// de atlas metería un toque más a cada visita para todo el mundo, y con cuatro
// formaciones no lo paga. El día que sean diez, sí.

import { EXPEDICIONES, visitanteDe, claveDeVictoria, requisitoDe, rivalPorId } from '../data/expediciones.js';
import { traerExpediciones, expedicionesEnCache } from './perfil.js';
import { arte } from './art.js';
import { videoDeCarta } from './apertura.js';

const id = (s) => document.getElementById(s);
const escapar = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

const RUTA = 'assets/piel/expediciones/';
/** Separación vertical entre nodos y columnas del zigzag, en % del ancho. */
// 120 y no más: el mapa es vertical 9:16 y se pinta con `cover`; con la
// columna más alta, el dibujo se escalaba tanto que perdía media anchura por
// los lados, lagos incluidos.
const PASO_Y = 120;
const ARRIBA = 96;
const COLUMNAS = [50, 78, 50, 22];

let dom = null;
let avisar = { alJugar: () => {}, alVolver: () => {} };
let piezas = new Set();
let expedicion = EXPEDICIONES[0];
let abierta = null;     // rival de la cartela, o null

export function montarExpedicion(callbacks) {
  avisar = { ...avisar, ...callbacks };
  dom = { cuerpo: id('exp-cuerpo'), hoja: id('exp-hoja'), titulo: id('exp-titulo'), volver: id('exp-volver') };
  dom.volver.addEventListener('click', () => { cerrarCartela(); avisar.alVolver(); });
  dom.cuerpo.addEventListener('click', (e) => {
    const f = e.target.closest('[data-formacion]');
    if (f) {
      if (f.classList.contains('bloqueada')) return;
      expedicion = EXPEDICIONES.find((x) => x.id === f.dataset.formacion) ?? expedicion;
      pintar(true);
      quizaCinematica();
      return;
    }
    const b = e.target.closest('[data-rival]');
    if (b) abrirCartela(b.dataset.rival);
  });
  dom.hoja.addEventListener('click', (e) => {
    if (e.target === dom.hoja || e.target.closest('[data-cerrar]')) return cerrarCartela();
    const luchar = e.target.closest('[data-luchar]');
    if (luchar && !luchar.disabled) {
      const rival = luchar.dataset.luchar;
      cerrarCartela();
      avisar.alJugar(rival);
    }
  });
  // Qué piezas de arte hay servidas. Sin índice, todo va con CSS.
  fetch(`${RUTA}indice.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { piezas = new Set(j?.piezas ?? []); if (dom.cuerpo.childElementCount) pintar(); })
    .catch(() => {});
}

/** Pinta con lo que haya en caché y repinta cuando el servidor conteste. */
export async function abrirExpedicion() {
  cerrarCartela();
  pintar(true);
  await traerExpediciones();
  pintar(true);
  quizaCinematica();
}

// ------------------------------------------------------------ cinemáticas
//
// Dos por formación y ninguna más: al ENTRAR la primera vez y al TERMINARLA.
// No una por nodo, que un nodo se rejuega y un vídeo que se ve ocho veces se
// salta desde la segunda. Es la misma gramática que el resto del juego: el
// vídeo sale cuando algo pasa UNA vez —una legendaria que cae, una carta de
// jefe que se reclama—, y por eso nadie lo salta.
//
// Se piden por el id del fichero y, si no está, no pasa nada: `videoDeCarta`
// resuelve en el acto con el 404, igual que una legendaria sin vídeo. Así esto
// puede ir publicado antes de que exista un solo mp4.

const VISTOS = 'dinowar.expedicion.vistos';

// Qué cinemáticas hay servidas. Se pregunta UNA vez, igual que las piezas del
// mapa, y por el mismo motivo: pedir a ciegas un vídeo que aún no existe deja
// un 404 en la consola en cada visita —una legendaria sin vídeo lo deja una
// vez y se acabó, esto no—. Lo escribe `python tools/videos.py escribir`.
let videos = null;
const traerIndiceDeVideos = () => (videos ??= fetch('assets/video/indice.json', { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => new Set(j?.videos ?? []))
  .catch(() => new Set()));

const leerVistos = () => {
  try { const l = JSON.parse(localStorage.getItem(VISTOS)); return Array.isArray(l) ? l : []; } catch { return []; }
};
const apuntarVisto = (clave) => {
  try {
    const l = leerVistos();
    if (!l.includes(clave)) localStorage.setItem(VISTOS, JSON.stringify([...l, clave]));
  } catch { /* sin localStorage se verá otra vez, que es el fallo barato */ }
};

/**
 * Enseña la cinemática que toque, si toca y si existe. El CIERRE manda sobre
 * la entrada: quien acaba de rematar una formación no quiere su presentación.
 *
 * Lo visto se apunta SÓLO si llegó a verse, para que un vídeo que aún no está
 * servido no se marque y luego no salga nunca.
 */
async function quizaCinematica() {
  const e = expedicion;
  const estado = estadoDeFormacion(e);
  if (estado === 'bloqueada') return;
  const vistos = new Set(leerVistos());
  const cual = estado === 'completa' && !vistos.has(`${e.id}:fin`) ? 'fin'
    : !vistos.has(`${e.id}:ini`) ? 'ini' : null;
  if (!cual) return;
  const video = cual === 'fin' ? `exp_${e.id}_fin` : `exp_${e.id}`;
  const hay = await traerIndiceDeVideos();
  if (!hay.has(video)) return;
  const visto = await videoDeCarta({
    raiz: id('expedicion'),
    id: video,
    binomial: e.nombre,
    dino: false,
    cerrarTexto: cual === 'fin' ? 'Volver al mapa' : 'Empezar',
  });
  if (visto) apuntarVisto(`${e.id}:${cual}`);
}

const vencidos = () => new Set(expedicionesEnCache()?.vencidos ?? []);
/** El día lo pone el servidor; sin respuesta, el del navegador vale para pintar. */
const hoy = () => expedicionesEnCache()?.dia ?? new Date().toISOString().slice(0, 10);

/** Una formación está abierta si no pide nada o si su requisito está vencido. */
function estadoDeFormacion(e) {
  const req = requisitoDe(e.rivales[0].id);
  const v = vencidos();
  if (req && !v.has(req)) return 'bloqueada';
  return e.rivales.every((r) => v.has(claveDeVictoria(r.id, hoy()))) ? 'completa' : 'abierta';
}

const progresoDe = (e) => {
  const v = vencidos();
  return e.rivales.filter((r) => v.has(claveDeVictoria(r.id, hoy()))).length;
};

function estadoDe(rivalId) {
  const v = vencidos();
  if (v.has(claveDeVictoria(rivalId, hoy()))) return 'vencido';
  const req = requisitoDe(rivalId);
  return !req || v.has(req) ? 'abierto' : 'bloqueado';
}

function pintar(desplazar = false) {
  if (!dom) return;
  dom.titulo.textContent = expedicion.nombre;
  const rivales = expedicion.rivales;
  const puntos = rivales.map((_, i) => ({ x: COLUMNAS[i % COLUMNAS.length], y: ARRIBA + i * PASO_Y }));
  const alto = ARRIBA + (rivales.length - 1) * PASO_Y + 140;
  // UN solo atributo `style`: con dos, el navegador se queda con el primero y
  // descarta el segundo, que era el que llevaba la altura. Sin arte no se veía.
  const fondo = piezas.has(expedicion.mapa) ? `;background-image:url('${RUTA}${expedicion.mapa}.webp')` : '';

  // El sendero: un tramo por pareja de nodos, dorado si el de abajo ya está
  // abierto. Va en un SVG con viewBox en % de ancho y px de alto, para que el
  // zigzag se estire con la pantalla sin deformar la raya.
  const tramos = puntos.slice(1).map((p, i) => {
    const a = puntos[i];
    const hecho = estadoDe(rivales[i + 1].id) !== 'bloqueado';
    return `<line x1="${a.x}%" y1="${a.y}" x2="${p.x}%" y2="${p.y}" class="${hecho ? 'hecho' : ''}"/>`;
  }).join('');

  const nodos = rivales.map((r, i) => nodoHTML(r, estadoDe(r.id), puntos[i], i + 1)).join('');

  const vis = visitanteDe(hoy());
  const estVis = estadoDe(vis.id);

  // Con una sola formación la tira sobra: es un botón que no lleva a ninguna
  // parte. Aparece en cuanto hay algo entre lo que elegir.
  const atlas = EXPEDICIONES.length < 2 ? '' : `
    <nav class="exp-atlas" aria-label="Formaciones">
      ${EXPEDICIONES.map((e) => fichaHTML(e)).join('')}
    </nav>`;

  dom.cuerpo.innerHTML = `
    ${atlas}
    <p class="exp-era">${escapar(expedicion.era)}</p>
    <button class="exp-visitante ${estVis}" data-rival="${vis.id}">
      ${medallon(vis, estVis === 'vencido' ? 'vencido' : 'semana')}
      <span class="exp-visitante-texto">
        <small>Visitante de la semana</small>
        <b>${escapar(vis.nombre)}</b>
        <i>${estVis === 'vencido' ? 'Vencido esta semana' : `Primera victoria: +${vis.premio} ◈`}</i>
      </span>
    </button>
    <div class="exp-mapa ${fondo ? 'con-arte' : ''}" style="height:${alto}px${fondo}">
      <svg class="exp-sendero" width="100%" height="${alto}" aria-hidden="true">${tramos}</svg>
      ${nodos}
    </div>`;

  if (desplazar) {
    // Al abrir, el mapa va al primer nodo que queda por vencer: con ocho nodos
    // en vertical, el que toca estaría fuera de la pantalla.
    const actual = dom.cuerpo.querySelector('.exp-nodo.abierto');
    if (actual) requestAnimationFrame(() => actual.scrollIntoView({ block: 'center' }));
  }
}

/** Una ficha de la tira: el mapa de fondo, el nombre y cuántos nodos llevas. */
function fichaHTML(e) {
  const estado = estadoDeFormacion(e);
  const fondo = piezas.has(e.mapa) ? `background-image:url('${RUTA}${e.mapa}.webp')` : '';
  const req = requisitoDe(e.rivales[0].id);
  const pista = estado === 'bloqueada'
    ? `Vence antes a ${escapar(rivalPorId(req)?.rival.nombre ?? '—')}`
    : `${progresoDe(e)} / ${e.rivales.length}`;
  return `<button class="exp-ficha ${estado} ${e.id === expedicion.id ? 'puesta' : ''}"
      data-formacion="${e.id}" style="${fondo}"
      aria-current="${e.id === expedicion.id}" ${estado === 'bloqueada' ? 'disabled' : ''}>
    <b>${escapar(e.nombre.replace(/^Formación /, ''))}</b>
    <i>${pista}</i>
  </button>`;
}

function medallon(rival, estado) {
  const marco = `nodo_${estado}`;
  const conMarco = piezas.has(marco);
  return `<span class="exp-medallon ${estado} ${conMarco ? 'con-marco' : ''}">
    <span class="exp-retrato">${arte(rival.retrato)}</span>
    ${conMarco ? `<img class="exp-marco" src="${RUTA}${marco}.webp" alt="" decoding="async">` : ''}
  </span>`;
}

function nodoHTML(r, estado, p, n) {
  return `<button class="exp-nodo ${estado}" data-rival="${r.id}"
      style="left:${p.x}%;top:${p.y}px" aria-label="${n}. ${escapar(r.nombre)}, ${estado}">
    ${medallon(r, estado)}
    <span class="exp-nombre">${escapar(r.nombre)}</span>
  </button>`;
}

function abrirCartela(rivalId) {
  const encontrado = rivalPorId(rivalId);
  if (!encontrado) return;
  const { rival: r } = encontrado;
  abierta = r.id;
  const estado = estadoDe(r.id);
  const req = requisitoDe(r.id);
  const esVisitante = !encontrado.expedicion;
  const premio = estado === 'vencido'
    ? (esVisitante ? 'Ya lo venciste esta semana: ganar paga lo de una victoria normal.'
      : 'Ya vencido: ganar paga lo de una victoria normal.')
    : `Primera victoria: <b>+${r.premio} ◈</b>${esVisitante ? ' esta semana' : ''}`;
  const cerrado = estado === 'bloqueado'
    ? `<p class="exp-cartela-aviso">Vence antes a ${escapar(rivalPorId(req).rival.nombre)}.</p>` : '';
  const cartela = piezas.has('cartela_rival') ? ' con-marco' : '';

  dom.hoja.innerHTML = `
    <div class="exp-cartela${cartela}">
      <span class="exp-cartela-retrato">${arte(r.retrato)}</span>
      <h3>${escapar(r.nombre)}</h3>
      <div class="exp-cartela-texto">
        <p class="exp-cartela-lema">${escapar(r.lema)}</p>
        <p class="exp-cartela-dato">${r.perfil === 'aleatoria' ? 'Juega sin plan' : 'Juega con cabeza'}</p>
        <p class="exp-cartela-premio">${premio}</p>
        ${cerrado}
        <div class="exp-cartela-botones">
          <button class="boton-grande" data-luchar="${r.id}" ${estado === 'bloqueado' ? 'disabled' : ''}>Luchar</button>
          <button class="boton-fantasma" data-cerrar>Volver al mapa</button>
        </div>
      </div>
    </div>`;
  dom.hoja.classList.remove('oculta');
}

function cerrarCartela() {
  abierta = null;
  dom?.hoja.classList.add('oculta');
}
