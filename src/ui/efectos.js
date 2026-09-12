// DinoWar — los efectos del tablero: dónde se pone cada cosa.
//
// `animate.js` lleva el ritmo y `guion.js` dice qué se ve; esto es la caja de
// herramientas de la que salen los golpes con peso. Cuatro gestos:
//
//   hoja()        un flipbook de `assets/piel/efectos/` en un punto del campo
//   particulas()  varias hojas pequeñas que salen despedidas de un punto
//   sacudir() y congelar()   la mesa tiembla; el hit-stop de 80 ms
//   volar()       un fantasma de la carta viaja de un rectángulo a su sitio
//
// y la invocación de una legendaria, que es una ceremonia con los cuatro.
//
// Todo lo que se crea aquí se quita solo, y `limpiarEfectos()` lo quita de
// golpe: `cancelarAnimaciones()` la llama al reiniciar, y tras GAME_OVER no
// puede quedar un temporizador vivo ni un fantasma volando.
//
// Con `prefers-reduced-motion` no se crea nada de lo que se mueve: ni vuelos,
// ni chispas, ni sacudida, ni congelación. Las hojas sí, que duran medio
// segundo y son la única señal de que ha pasado algo.

const RUTA = (nombre) => `url(assets/piel/efectos/${nombre}.webp)`;

/** Cuánto tarda un fantasma en llegar. */
export const VUELO = 300;
/** Cuánto dura la ceremonia de una legendaria, de oscurecer a soltar. */
export const CEREMONIA = 1700;

const temporizadores = new Set();

export const reducido = () => (typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches);

function temporizar(fn, ms) {
  const t = setTimeout(() => { temporizadores.delete(t); fn(); }, ms);
  temporizadores.add(t);
  return t;
}

const campo = () => document.getElementById('campo');
const partida = () => document.getElementById('partida');

/** El centro de un nodo, en coordenadas del campo. */
export function centroDe(nodo) {
  if (!nodo) return null;
  const r = nodo.getBoundingClientRect();
  const c = campo().getBoundingClientRect();
  if (!r.width) return null;
  return { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top, w: r.width, h: r.height };
}

/** El punto medio entre dos nodos, o el del que haya. */
export function entre(a, b) {
  const pa = centroDe(a);
  const pb = centroDe(b);
  if (pa && pb) return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2, w: Math.max(pa.w, pb.w) };
  return pa ?? pb;
}

/**
 * Un flipbook en un punto. `tam` es el lado en píxeles; `dura`, cuánto
 * tarda en pasar los dieciséis fotogramas. Se quita solo al terminar.
 */
export function hoja(nombre, { x, y, tam, dura = 420, giro = 0, clase = '' }) {
  const n = document.createElement('i');
  n.className = `fx fx-hoja${clase ? ` ${clase}` : ''}`;
  n.style.cssText = `--hoja:${RUTA(nombre)};--x:${x}px;--y:${y}px;--tam:${tam}px;--dura:${dura}ms;--giro:${giro}deg`;
  campo().appendChild(n);
  temporizar(() => n.remove(), dura + 40);
  return n;
}

/**
 * Chispas que salen despedidas de un punto. Cada una lleva su ángulo y su
 * alcance sorteados: no tienen que ser deterministas, no las ve el motor.
 */
export function particulas(nombre, { x, y, n = 10, alcance = 46, tam = 18, dura = 520 }) {
  if (reducido()) return;
  const raiz = campo();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const ang = Math.random() * Math.PI * 2;
    const lejos = alcance * (0.45 + Math.random() * 0.8);
    const t = tam * (0.6 + Math.random() * 0.8);
    const x0 = x - t / 2;
    const y0 = y - t / 2;
    p.className = 'fx fx-particula';
    p.style.cssText = `--hoja:${RUTA(nombre)};--tam:${t}px;--dura:${dura}ms;`
      + `--x0:${x0}px;--y0:${y0}px;--x1:${x0 + Math.cos(ang) * lejos}px;--y1:${y0 + Math.sin(ang) * lejos + 10}px;`
      + `--giro:${Math.round((ang * 180) / Math.PI)}deg;animation-delay:${Math.round(Math.random() * 60)}ms`;
    raiz.appendChild(p);
  }
  temporizar(() => { for (const p of raiz.querySelectorAll('.fx-particula')) p.remove(); }, dura + 120);
}

/** Las grietas abriéndose desde un punto, sobre el hábitat que encaja. */
export function grietas({ x, y, tam }) {
  const n = document.createElement('i');
  n.className = 'fx fx-grietas';
  n.style.cssText = `--tam:${tam}px;--x0:${x - tam / 2}px;--y0:${y - (tam * 585) / 1024 / 2}px`;
  campo().appendChild(n);
  temporizar(() => n.remove(), 1050);
}

/** Una nube de polvo subiendo de una carta. */
export function polvo(nodo, escala = 1.7) {
  const p = centroDe(nodo);
  if (!p) return;
  const tam = p.w * escala;
  const n = document.createElement('i');
  n.className = 'fx fx-polvo';
  n.style.cssText = `--tam:${tam}px;--x0:${p.x - tam / 2}px;--y0:${p.y - tam / 2 + p.h * 0.15}px`;
  campo().appendChild(n);
  temporizar(() => n.remove(), 800);
}

/** La mesa tiembla. `fuerza` en píxeles; 3 es un roce, 8 un titán. */
export function sacudir(fuerza) {
  if (reducido()) return;
  const c = campo();
  c.classList.remove('sacude');
  void c.offsetWidth;
  c.style.setProperty('--fuerza', `${fuerza}px`);
  c.classList.add('sacude');
  temporizar(() => c.classList.remove('sacude'), 360);
}

/** El hit-stop: todo parado `ms` milisegundos. Resuelve al soltar. */
export function congelar(ms = 80) {
  if (reducido()) return Promise.resolve();
  const p = partida();
  p.classList.add('congelado');
  return new Promise((r) => temporizar(() => { p.classList.remove('congelado'); r(); }, ms));
}

/** Un pulso corto en el móvil. Sin vibración no pasa nada. */
export function vibrar(ms) {
  if (reducido()) return;
  try { navigator.vibrate?.(ms); } catch { /* no hay */ }
}

/** Cuánto tiembla la mesa por un daño: crece con él y se planta en 9. */
export const fuerzaDe = (dano) => Math.min(9, 2 + dano);

/**
 * Un fantasma de `nodo` viaja desde el rectángulo `desde` hasta donde está el
 * nodo, que espera invisible. Con `dorso`, el clon viaja boca abajo: es una
 * carta saliendo del mazo. Devuelve cuándo aterriza, en ms desde ahora.
 */
export function volar(nodo, desde, { retardo = 0, dura = VUELO, dorso = false } = {}) {
  if (!nodo || !desde || !desde.width || reducido()) return 0;
  const raiz = partida();
  const hasta = nodo.getBoundingClientRect();
  if (!hasta.width) return 0;
  const base = raiz.getBoundingClientRect();
  const g = nodo.cloneNode(true);
  g.classList.remove('entra', 'aterriza', 'alzada', 'arrastrando', 'pendiente', 'en-vuelo', 'retenida', 'pasa');
  g.classList.add('fx-fantasma');
  g.removeAttribute('data-iid');
  if (dorso) g.insertAdjacentHTML('beforeend', '<div class="carta-dorso"></div>');
  g.style.cssText = `left:${hasta.left - base.left}px;top:${hasta.top - base.top}px;`
    + `width:${hasta.width}px;height:${hasta.height}px;`
    + `--fx:${desde.left - hasta.left}px;--fy:${desde.top - hasta.top}px;--fs:${desde.width / hasta.width};`
    + `--retardo:${retardo}ms;--vuelo:${dura}ms`;
  nodo.classList.add('en-vuelo');
  raiz.appendChild(g);
  temporizar(() => { g.remove(); nodo.classList.remove('en-vuelo'); }, retardo + dura);
  return retardo + dura;
}

/**
 * La ceremonia de una legendaria. `html` es la carta grande ya pintada;
 * `destino` la ranura donde va a aparecer, para que la carta se encoja hacia
 * ella al final. Resuelve cuando se ha quitado todo.
 */
export function invocar({ html, titulo, subtitulo, destino }) {
  if (reducido()) return Promise.resolve();
  const raiz = partida();
  const v = document.createElement('div');
  v.className = 'invocacion';
  v.style.setProperty('--ceremonia', `${CEREMONIA}ms`);
  v.innerHTML = '<div class="invocacion-rayos"></div><div class="invocacion-aura"></div>'
    + `<div class="invocacion-carta">${html}</div>`
    + `<div class="invocacion-rotulo"><b>${titulo}</b><span>${subtitulo}</span></div>`;
  raiz.appendChild(v);
  const grande = v.querySelector('.invocacion-carta');
  const c = grande.getBoundingClientRect();
  const d = destino?.getBoundingClientRect();
  if (d && d.width && c.width) {
    grande.style.setProperty('--dx', `${d.left + d.width / 2 - (c.left + c.width / 2)}px`);
    grande.style.setProperty('--dy', `${d.top + d.height / 2 - (c.top + c.height / 2)}px`);
    grande.style.setProperty('--ds', `${d.width / c.width}`);
  }
  return new Promise((r) => temporizar(() => { v.remove(); r(); }, CEREMONIA));
}

/** Todo fuera, ya. */
export function limpiarEfectos() {
  for (const t of temporizadores) clearTimeout(t);
  temporizadores.clear();
  for (const n of document.querySelectorAll('.fx, .fx-fantasma, .invocacion')) n.remove();
  for (const n of document.querySelectorAll('.en-vuelo, .retenida')) n.classList.remove('en-vuelo', 'retenida');
  campo()?.classList.remove('sacude');
  partida()?.classList.remove('congelado');
}
