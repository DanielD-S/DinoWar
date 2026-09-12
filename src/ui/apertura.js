// DinoWar — la ceremonia de abrir un sobre.
//
// Dos gestos y nada más: rasgar la bolsa con el dedo, y deslizar cada carta
// para descubrir la siguiente. Es lo que hace que abrir un sobre sea un momento
// y no una rejilla que aparece; la rejilla viene después, como resumen.
//
// Este módulo sólo mueve DOM: las cinco cartas ya vienen sorteadas por el
// servidor y pintadas por `cartaHTML()`. No sabe de perfiles ni de monedas.
// Devuelve una promesa que se cumple cuando la última carta se ha ido, o
// cuando el jugador pulsa «ver las cinco», o en el acto si pide menos
// movimiento: quien lo pide no quiere ceremonias.

import { sonido } from './audio.js';

// El zigzag del rasgado: picos que comparten la tira y el cuerpo, para que
// el borde de una sea exactamente el hueco de la otra.
const DIENTES = 22;
const ALTO_TIRA = 15;          // % del alto del sobre que se lleva la tira
const AMPLITUD = 1.3;          // % del alto, medio diente
// Cuánto hay que arrastrar, en anchos de sobre, para que la tira se suelte.
const RECORRIDO = 0.6;
const UMBRAL = 0.85;
// Deslizar una carta: a partir de aquí se va; menos, vuelve a la pila.
const SUELTA_X = 70;
const SUELTA_Y = 90;
const TOQUE = 6;

function zigzag() {
  const pts = [];
  for (let i = 0; i <= DIENTES; i++) {
    pts.push([(i / DIENTES) * 100, ALTO_TIRA + (i % 2 ? AMPLITUD : -AMPLITUD)]);
  }
  return pts;
}
const p = (x, y) => `${x.toFixed(2)}% ${y.toFixed(2)}%`;
function recortes() {
  const z = zigzag();
  const tira = ['0% 0%', '100% 0%', ...z.slice().reverse().map(([x, y]) => p(x, y))].join(', ');
  const cuerpo = ['0% 100%', '100% 100%', ...z.slice().reverse().map(([x, y]) => p(x, y))].join(', ');
  return { tira: `polygon(${tira})`, cuerpo: `polygon(${cuerpo})` };
}

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {HTMLElement} contenedor  donde se pinta; se vacía al terminar
 * @param {Array<{html: string, rareza: string, binomial: string, dino: boolean,
 *                estado: {texto: string, clase: string}}>} cartas  en el orden en que salen
 * @returns {Promise<void>}
 */
export function ceremoniaDeSobre(contenedor, cartas) {
  if (reducido() || cartas.length === 0) return Promise.resolve();

  return new Promise((terminar) => {
    const { tira, cuerpo } = recortes();
    contenedor.innerHTML = `<div class="apertura fase-rasgar">
      <div class="apertura-escena">
        <div class="apertura-sobre" style="--p:0">
          <div class="apertura-cuerpo" style="clip-path:${cuerpo}"></div>
          <div class="apertura-tira" style="clip-path:${tira}"></div>
        </div>
        <div class="apertura-pila">${cartas.map((c, i) =>
    `<div class="apertura-carta rareza-${c.rareza}" style="--i:${i}" data-i="${i}">${c.html}</div>`).join('')}</div>
      </div>
      <div class="apertura-leyenda">
        <div class="apertura-binomial"></div>
        <div class="apertura-estado"></div>
      </div>
      <div class="apertura-pie">
        <span class="apertura-pista">Desliza para rasgar el sobre</span>
        <span class="apertura-contador"></span>
        <button class="apertura-saltar" type="button">Ver las cinco</button>
      </div>
    </div>`;

    const raiz = contenedor.firstElementChild;
    const sobre = raiz.querySelector('.apertura-sobre');
    const pila = raiz.querySelector('.apertura-pila');
    const leyenda = {
      binomial: raiz.querySelector('.apertura-binomial'),
      estado: raiz.querySelector('.apertura-estado'),
      pista: raiz.querySelector('.apertura-pista'),
      contador: raiz.querySelector('.apertura-contador'),
    };
    let acabado = false;
    const acabar = () => {
      if (acabado) return;
      acabado = true;
      terminar();
    };
    raiz.querySelector('.apertura-saltar').addEventListener('click', acabar);

    // ------------------------------------------------------------ rasgar
    // El progreso es cuánto se ha arrastrado el dedo a lo ancho, en cualquier
    // sentido: la tira se levanta con él y, pasado el umbral, se va sola. Un
    // toque sin arrastre también la rasga, animada: el ratón no rasga bien.
    let origen = null;
    let progreso = 0;
    let rasgado = false;
    const fijar = (v) => { progreso = Math.max(0, Math.min(1, v)); sobre.style.setProperty('--p', progreso.toFixed(3)); };

    const rasgar = async () => {
      if (rasgado) return;
      rasgado = true;
      sobre.classList.remove('suelto');
      fijar(1);
      sonido('rasgar');
      sobre.classList.add('rasgado');
      await esperar(620);
      if (acabado) return;
      raiz.classList.remove('fase-rasgar');
      raiz.classList.add('fase-pila');
      leyenda.pista.textContent = 'Desliza la carta para ver la siguiente';
      revelar();
    };

    sobre.addEventListener('pointerdown', (e) => {
      if (rasgado) return;
      origen = e.clientX;
      sobre.classList.remove('suelto');
      sobre.setPointerCapture(e.pointerId);
    });
    sobre.addEventListener('pointermove', (e) => {
      if (origen === null || rasgado) return;
      fijar(Math.abs(e.clientX - origen) / (sobre.clientWidth * RECORRIDO));
    });
    const soltarSobre = (e) => {
      if (origen === null || rasgado) return;
      const movido = Math.abs(e.clientX - origen);
      origen = null;
      if (progreso >= UMBRAL || movido < TOQUE) { rasgar(); return; }
      sobre.classList.add('suelto');
      fijar(0);
    };
    sobre.addEventListener('pointerup', soltarSobre);
    sobre.addEventListener('pointercancel', soltarSobre);

    // -------------------------------------------------------------- pila
    // La carta de arriba sigue al dedo; si se suelta lejos, se va por donde
    // iba; si no, vuelve. Un toque la manda a la derecha. Cada carta que se va
    // descubre la siguiente, y esa es la que suena.
    let indice = 0;
    const cimaActual = () => pila.querySelector(`.apertura-carta[data-i="${indice}"]`);

    function revelar() {
      const c = cartas[indice];
      const nodo = cimaActual();
      if (!c || !nodo) { acabar(); return; }
      nodo.classList.add('revelada');
      leyenda.binomial.textContent = c.binomial;
      leyenda.binomial.classList.toggle('recto', !c.dino);
      leyenda.estado.textContent = c.estado.texto;
      leyenda.estado.className = `apertura-estado ${c.estado.clase}`;
      leyenda.contador.textContent = `${indice + 1} de ${cartas.length}`;
      sonido('revelar');
      if (c.rareza === 'LEGENDARIO' || c.rareza === 'EPICO') setTimeout(() => sonido('joya'), 140);
    }

    let arrastre = null;
    pila.addEventListener('pointerdown', (e) => {
      const nodo = cimaActual();
      if (!nodo || !nodo.contains(e.target) || nodo.classList.contains('fuera')) return;
      arrastre = { x: e.clientX, y: e.clientY, nodo };
      nodo.classList.add('arrastrando');
      pila.setPointerCapture(e.pointerId);
    });
    pila.addEventListener('pointermove', (e) => {
      if (!arrastre) return;
      const dx = e.clientX - arrastre.x;
      const dy = e.clientY - arrastre.y;
      arrastre.nodo.style.setProperty('--dx', `${dx}px`);
      arrastre.nodo.style.setProperty('--dy', `${dy}px`);
      arrastre.nodo.style.setProperty('--giro', (dx / 18).toFixed(2));
    });
    const soltarCarta = async (e) => {
      if (!arrastre) return;
      const { nodo } = arrastre;
      const dx = e.clientX - arrastre.x;
      const dy = e.clientY - arrastre.y;
      arrastre = null;
      nodo.classList.remove('arrastrando');
      const toque = Math.hypot(dx, dy) < TOQUE;
      let rumbo = null;
      if (toque || dx > SUELTA_X) rumbo = 'der';
      else if (dx < -SUELTA_X) rumbo = 'izq';
      else if (dy < -SUELTA_Y) rumbo = 'arriba';
      if (!rumbo) {
        nodo.style.setProperty('--dx', '0px');
        nodo.style.setProperty('--dy', '0px');
        nodo.style.setProperty('--giro', '0');
        return;
      }
      nodo.classList.add('fuera', `fuera-${rumbo}`);
      indice += 1;
      // Las que quedan suben un puesto en la pila.
      for (const n of pila.querySelectorAll('.apertura-carta:not(.fuera)')) {
        n.style.setProperty('--i', String(Number(n.dataset.i) - indice));
      }
      sonido('carta');
      await esperar(60);
      if (acabado) return;
      if (indice < cartas.length) revelar();
      else { await esperar(380); acabar(); }
    };
    pila.addEventListener('pointerup', soltarCarta);
    pila.addEventListener('pointercancel', soltarCarta);
  });
}
