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

import { EXPEDICIONES, visitanteDe, claveDeVictoria, requisitoDe, rivalPorId } from '../data/expediciones.js';
import { traerExpediciones, expedicionesEnCache } from './perfil.js';
import { arte } from './art.js';

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
}

const vencidos = () => new Set(expedicionesEnCache()?.vencidos ?? []);
/** El día lo pone el servidor; sin respuesta, el del navegador vale para pintar. */
const hoy = () => expedicionesEnCache()?.dia ?? new Date().toISOString().slice(0, 10);

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

  dom.cuerpo.innerHTML = `
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
