// DinoWar — entrada con Pointer Events exclusivamente. Sin ratón, sin táctil,
// sin gestos propietarios: un solo camino de código para dedo y puntero.
//
// Este módulo no sabe reglas. Sólo dice QUÉ carta se ha soltado y DÓNDE;
// main.js decide qué acción es según la familia de la carta.

import { el } from './render.js';

const UMBRAL_ARRASTRE = 8;   // px antes de considerar que se está arrastrando
const LARGA = 400;           // ms de pulsación larga

let api = null;
let gesto = null;
let temporizadorLargo = null;
const listeners = [];

function on(nodo, tipo, fn, opciones) {
  nodo.addEventListener(tipo, fn, opciones);
  listeners.push([nodo, tipo, fn, opciones]);
}

/** Quita todos los listeners: sin residuos entre partidas. */
export function soltarEntrada() {
  for (const [nodo, tipo, fn, opciones] of listeners) nodo.removeEventListener(tipo, fn, opciones);
  listeners.length = 0;
  clearTimeout(temporizadorLargo);
  enderezar();
  gesto = null;
  api = null;
  el.arrastre.classList.add('oculta');
}

/** Qué hay bajo el puntero, en orden de prioridad. */
function destinoBajo(x, y) {
  const pila = document.elementsFromPoint(x, y);

  const carta = pila.find((n) => n.classList?.contains('carta--ranura') && n.dataset.iid);
  if (carta && !carta.classList.contains('pendiente')) {
    return {
      tipo: 'unidad',
      iid: Number(carta.dataset.iid),
      propia: carta.classList.contains('propio'),
      nodo: carta.closest('.ranura') ?? carta,
    };
  }

  const ranura = pila.find((n) => n.classList?.contains('ranura'));
  if (ranura) {
    return {
      tipo: 'ranura',
      bando: Number(ranura.dataset.bando),
      ranura: Number(ranura.dataset.ranura),
      libre: !ranura.classList.contains('ocupada'),
      nodo: ranura,
    };
  }

  const franja = pila.find((n) => n.classList?.contains('franja'));
  if (franja) return { tipo: 'franja', nodo: franja };

  // Tu propia pila de mazo: soltar ahí una carta la devuelve al fondo, y sólo
  // vale con la Llanura de inundación en el campo. Es el gesto que ya significa
  // «esto vuelve al montón» sin tener que explicarlo.
  const pilaMazo = pila.find((n) => n.id === 'p-pila' || n.closest?.('#p-pila'));
  if (pilaMazo) return { tipo: 'mazo', nodo: document.getElementById('p-pila') };

  if (pila.some((n) => n === el.campo)) return { tipo: 'campo', nodo: el.campo };
  return null;
}

function limpiarDestinos() {
  for (const n of document.querySelectorAll('.destino')) n.classList.remove('destino');
}

function empezarArrastre(e) {
  gesto.arrastrando = true;
  clearTimeout(temporizadorLargo);
  gesto.nodo.classList.add('arrastrando');
  el.arrastre.innerHTML = gesto.nodo.innerHTML;
  el.arrastre.className = `arrastre carta ${gesto.nodo.className.replace(/carta--mano|alzada|arrastrando|carta/g, '')}`.trim();
  el.arrastre.classList.remove('oculta');
  moverFantasma(e);
}

function moverFantasma(e) {
  el.arrastre.style.left = `${e.clientX}px`;
  el.arrastre.style.top = `${e.clientY}px`;
}

function alBajar(e) {
  if (!api?.interactivo()) return;
  const nodo = e.target.closest('.carta');
  if (!nodo) return;

  e.preventDefault();
  gesto = {
    iid: Number(nodo.dataset.iid),
    cardId: nodo.dataset.card,
    nodo,
    x0: e.clientX,
    y0: e.clientY,
    arrastrando: false,
  };
  try { nodo.setPointerCapture(e.pointerId); } catch { /* puntero ya liberado */ }
  nodo.classList.add('alzada');

  clearTimeout(temporizadorLargo);
  temporizadorLargo = setTimeout(() => {
    if (gesto && !gesto.arrastrando) {
      api.ficha(gesto.cardId, gesto.iid);
      gesto.consumido = true;
      gesto.nodo.classList.remove('alzada');
    }
  }, LARGA);
}

function alMover(e) {
  if (!gesto || gesto.consumido) return;
  const dx = e.clientX - gesto.x0;
  const dy = e.clientY - gesto.y0;

  if (!gesto.arrastrando && Math.hypot(dx, dy) > UMBRAL_ARRASTRE) empezarArrastre(e);
  if (!gesto.arrastrando) return;

  e.preventDefault();
  moverFantasma(e);
  limpiarDestinos();
  const d = destinoBajo(e.clientX, e.clientY);
  if (d && api.admite(gesto.cardId, d)) d.nodo.classList.add('destino');
}

function alSoltar(e) {
  if (!gesto) return;
  const g = gesto;
  gesto = null;
  clearTimeout(temporizadorLargo);
  g.nodo.classList.remove('alzada', 'arrastrando');
  el.arrastre.classList.add('oculta');
  limpiarDestinos();

  if (g.consumido) return;
  if (!g.arrastrando) { api.ficha(g.cardId, g.iid); return; }

  const d = destinoBajo(e.clientX, e.clientY);
  api.soltar(g.iid, g.cardId, d);
}

/**
 * El navegador se ha quedado el gesto: la mano se desplaza de lado y esto ya no
 * es un toque. Se limpia sin abrir nada — antes esto caía en alSoltar y cada
 * desplazamiento de la mano abría una ficha.
 */
function alCancelar() {
  if (!gesto) return;
  const g = gesto;
  gesto = null;
  clearTimeout(temporizadorLargo);
  g.nodo.classList.remove('alzada', 'arrastrando');
  el.arrastre.classList.add('oculta');
  limpiarDestinos();
}

function alTocarCampo(e) {
  const c = e.target.closest('.carta--ranura');
  if (c?.dataset.card) { api.ficha(c.dataset.card, Number(c.dataset.iid)); return; }
  const f = e.target.closest('.franja-campo');
  if (f?.dataset.card) api.ficha(f.dataset.card);
}

let inclinada = null;

/**
 * Inclina la carta que hay bajo el puntero. Escribe `--tx` y `--ty` en el rango
 * [-1, 1] y el CSS decide cuántos grados son eso: aquí no hay ni un ángulo.
 *
 * Sólo con puntero FINO. Con el dedo, el puntero está justo donde está la carta
 * —o sea, tapándola— y la inclinación sería un temblor bajo el pulgar. El CSS
 * también lo anula con `(hover: none)`, pero no calcularlo ahorra un
 * `getBoundingClientRect` por cada píxel de arrastre en el móvil.
 */
function inclinar(e) {
  if (e.pointerType !== 'mouse') return;
  const nodo = e.target.closest?.('.carta--mano');
  // Al pasar de una carta a otra hay que enderezar la que se deja: si no, se
  // queda torcida para siempre porque nadie más le va a tocar las variables.
  if (nodo !== inclinada) enderezar();
  if (!nodo) return;
  inclinada = nodo;
  const r = nodo.getBoundingClientRect();
  nodo.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
  nodo.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
}

/** Devuelve la última carta inclinada a su sitio. */
function enderezar() {
  if (!inclinada) return;
  inclinada.style.removeProperty('--tx');
  inclinada.style.removeProperty('--ty');
  inclinada = null;
}

export function tomarEntrada(nuevaApi) {
  soltarEntrada();
  api = nuevaApi;

  on(el.mano, 'pointermove', inclinar, { passive: true });
  on(el.mano, 'pointerleave', enderezar, { passive: true });
  on(el.mano, 'pointerdown', alBajar);
  on(el.mano, 'pointermove', alMover, { passive: false });
  on(el.mano, 'pointerup', alSoltar);
  on(el.mano, 'pointercancel', alCancelar);
  on(el.campo, 'pointerup', alTocarCampo);
  on(document, 'contextmenu', (e) => e.preventDefault());
  on(document, 'gesturestart', (e) => e.preventDefault());
  on(document, 'dblclick', (e) => e.preventDefault());
}
