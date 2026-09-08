// Entrada con Pointer Events exclusivamente. Sin ratón, sin táctil, sin gestos
// propietarios: un solo camino de código para dedo y puntero.

import { TIPO, carta } from '../data/cards.js';
import { el, zonaEnFoco, mostrarZona } from './render.js';

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
  gesto = null;
  api = null;
  el.arrastre.classList.add('oculta');
}

/**
 * Zona bajo el puntero: o un botón de la tira (despliegas ahí sin cambiar de
 * vista) o el propio playmat (despliegas en la zona enfocada).
 * @returns {{zona:number, nodo:Element}|null}
 */
function zonaBajo(x, y) {
  const pila = document.elementsFromPoint(x, y);
  const boton = pila.find((n) => n.classList?.contains('zona-boton'));
  if (boton) return { zona: Number(boton.dataset.zona), nodo: boton };
  if (pila.some((n) => n === el.playmat)) return { zona: zonaEnFoco(), nodo: el.playmat };
  return null;
}

function unidadBajo(x, y) {
  return document.elementsFromPoint(x, y)
    .find((n) => n.classList?.contains('carta--mat') && n.classList.contains('propio')
      && n.dataset.iid && !n.classList.contains('pendiente')) ?? null;
}

function limpiarDestinos() {
  for (const b of el.botonesZona) b.classList.remove('destino');
  el.playmat.classList.remove('destino');
}

function empezarArrastre(e) {
  gesto.arrastrando = true;
  clearTimeout(temporizadorLargo);
  gesto.nodo.classList.add('arrastrando');
  el.arrastre.innerHTML = gesto.nodo.innerHTML;
  el.arrastre.className = 'arrastre carta' + (gesto.adaptacion ? ' adaptacion' : '');
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
  const cardId = nodo.dataset.card;
  gesto = {
    iid: Number(nodo.dataset.iid),
    cardId,
    nodo,
    x0: e.clientX,
    y0: e.clientY,
    arrastrando: false,
    adaptacion: carta(cardId).tipo === TIPO.ADAPTACION,
    pointerId: e.pointerId,
  };
  try { nodo.setPointerCapture(e.pointerId); } catch { /* puntero ya liberado */ }
  nodo.classList.add('alzada');

  clearTimeout(temporizadorLargo);
  temporizadorLargo = setTimeout(() => {
    if (gesto && !gesto.arrastrando) {
      api.ficha(gesto.cardId);
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
  const destino = zonaBajo(e.clientX, e.clientY);
  if (destino) destino.nodo.classList.add('destino');
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

  if (!g.arrastrando) {
    api.ficha(g.cardId);
    return;
  }

  if (g.adaptacion) {
    const objetivo = unidadBajo(e.clientX, e.clientY);
    if (objetivo) api.adaptar(g.iid, Number(objetivo.dataset.iid));
    else api.aviso('Las adaptaciones se sueltan sobre uno de tus dinosaurios.');
    return;
  }

  const destino = zonaBajo(e.clientX, e.clientY);
  if (destino) {
    if (destino.zona !== zonaEnFoco()) mostrarZona(destino.zona);
    api.desplegar(g.iid, destino.zona);
  }
}

function alTocarTablero(e) {
  const c = e.target.closest('.carta--mat');
  if (c?.dataset.card) api.ficha(c.dataset.card);
}

export function tomarEntrada(nuevaApi) {
  soltarEntrada();
  api = nuevaApi;

  on(el.mano, 'pointerdown', alBajar);
  on(el.mano, 'pointermove', alMover, { passive: false });
  on(el.mano, 'pointerup', alSoltar);
  on(el.mano, 'pointercancel', alSoltar);
  on(el.playmat, 'pointerup', alTocarTablero);
  on(document, 'contextmenu', (e) => e.preventDefault());
  on(document, 'gesturestart', (e) => e.preventDefault());
  on(document, 'dblclick', (e) => e.preventDefault());
}
