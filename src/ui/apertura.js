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
// El vídeo de una legendaria: cuánto espera a que se vaya la carta anterior
// antes de oscurecer, y cuánto tarda en irse al cerrarlo. Van con las
// transiciones de `.apertura-video` en style.css.
const ENTRADA_VIDEO = 380;
const SALIDA_VIDEO = 480;

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

// ------------------------------------------------------------------ vídeo
// Una legendaria puede traer un vídeo corto del animal —assets/video/<id>—
// que se enseña a pantalla entera antes de voltear la carta. Lo usan la
// ceremonia del sobre y la carta de jefe al reclamarla en la Cuenca. Una carta
// sin vídeo no falla: el `error` la deja fuera y la carta sale sin más.

/** Empieza a bajar el vídeo de una carta. `alFallar` se llama si no existe. */
export function precargarVideo(id, alFallar = () => {}) {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.disablePictureInPicture = true;
  v.disableRemotePlayback = true;
  v.controls = false;
  v.src = `assets/video/${id}.mp4`;
  v.addEventListener('error', alFallar, { once: true });
  return v;
}

/**
 * La capa del vídeo sobre `raiz`, hasta que el jugador la toca. Resuelve sin
 * enseñar nada si el vídeo no llega o `cancelado()` dice que ya no toca.
 */
export async function mostrarVideo({
  raiz, video: v, binomial, dino = true, cancelado = () => false, cerrarTexto = 'Ver la carta',
}) {
  const capa = document.createElement('div');
  capa.className = 'apertura-video';
  const marco = document.createElement('div');
  marco.className = 'apertura-video-marco';
  // En vertical el plano apaisado no llena la pantalla: se enseña entero
  // como banda y, detrás, el mismo vídeo ampliado, desenfocado y oscuro
  // rellena arriba y abajo, como hacen los reproductores. En apaisado no
  // hace falta —el plano cubre— y la copia no se crea, que son dos
  // decodificaciones a la vez y en un móvil viejo se notan.
  const vertical = window.matchMedia?.('(orientation: portrait)').matches;
  let fondo = null;
  if (vertical) {
    fondo = document.createElement('video');
    fondo.className = 'apertura-video-fondo';
    fondo.muted = true;
    fondo.playsInline = true;
    fondo.disablePictureInPicture = true;
    fondo.src = v.src;
    marco.appendChild(fondo);
  }
  v.className = 'apertura-video-principal';
  marco.appendChild(v);
  const pie = document.createElement('div');
  pie.className = 'apertura-video-pie';
  const nombre = document.createElement('div');
  nombre.className = `apertura-video-nombre${dino ? '' : ' recto'}`;
  nombre.textContent = binomial;
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.className = 'apertura-video-cerrar';
  cerrar.textContent = cerrarTexto;
  pie.append(nombre, cerrar);
  capa.append(marco, pie);
  raiz.appendChild(capa);

  // Con tope: un vídeo que no llega no para la ceremonia.
  await new Promise((listo) => {
    if (v.readyState >= 3) { listo(); return; }
    v.addEventListener('canplay', listo, { once: true });
    v.addEventListener('error', listo, { once: true });
    setTimeout(listo, 2500);
  });
  // Que la carta anterior termine de irse antes de que el fondo oscurezca:
  // si no, el vídeo aparecía de golpe encima de una carta a medio vuelo.
  await esperar(ENTRADA_VIDEO);
  let reproduce = !cancelado() && !v.error && v.readyState >= 3;
  if (reproduce) {
    // Reflujo forzado y no requestAnimationFrame: con la pestaña en segundo
    // plano el fotograma no llega y la capa se quedaba invisible con el
    // vídeo ya corriendo debajo.
    capa.getBoundingClientRect();
    capa.classList.add('visible');
    sonido('joya');
    try { await v.play(); } catch { reproduce = false; }
    if (reproduce && fondo) {
      // A la par que el principal. Si no arranca se queda como fotograma
      // quieto detrás, que sigue siendo mejor fondo que el negro: Chrome
      // corta el `play()` de un vídeo sin audio en cuanto la pestaña pasa
      // a segundo plano, y quitarlo por eso dejaba las bandas negras.
      fondo.currentTime = v.currentTime;
      fondo.play().catch(() => {});
    }
  }
  if (reproduce) {
    // La carta sale cuando el jugador CIERRA el vídeo, no cuando acaba:
    // al terminar se queda en el último fotograma —las fauces— y espera
    // un toque, en la capa o en el botón. Quien no quiera verlo entero
    // toca antes.
    await new Promise((fin) => {
      capa.addEventListener('pointerdown', fin, { once: true });
    });
    v.pause();
    fondo?.pause();
    capa.classList.add('cierra');
    capa.classList.remove('visible');
    await esperar(SALIDA_VIDEO);
  }
  capa.remove();
  return reproduce;
}

/**
 * El vídeo de una carta suelta, fuera del sobre: se pide, se enseña y se va.
 * Si no existe, resuelve enseguida sin enseñar nada. Con movimiento reducido
 * tampoco se enseña, como la ceremonia.
 *
 * DEVUELVE si llegó a verse, para quien tenga que apuntar que ya se enseñó.
 *
 * @returns {Promise<boolean>}
 */
export async function videoDeCarta({ raiz, id, binomial, dino = true, cerrarTexto }) {
  if (reducido() || !raiz || !id) return false;
  let falta = false;
  const v = precargarVideo(id, () => { falta = true; });
  // Un 404 llega en un instante; un vídeo real tarda más en decir «puedo».
  await new Promise((listo) => {
    v.addEventListener('canplay', listo, { once: true });
    v.addEventListener('error', listo, { once: true });
    setTimeout(listo, 2500);
  });
  if (falta || v.error) return false;
  return !!await mostrarVideo({ raiz, video: v, binomial, dino, cerrarTexto });
}

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

    // ------------------------------------------------------------- vídeo
    // Una legendaria puede traer un vídeo corto del animal —assets/video/<id>—
    // que se enseña a pantalla entera antes de voltear la carta. Se precargan
    // al empezar la ceremonia, que rasgar el sobre y pasar cartas da tiempo de
    // sobra para bajar un megabyte; y una legendaria sin vídeo no falla: el
    // `error` la saca del mapa y la carta se voltea como cualquier otra.
    //
    // Sólo se pide para las legendarias CON CRIATURA. Las de soporte —climas,
    // eventos, recursos, Biomasa— no llevan vídeo a propósito, que no hay
    // animal que enseñar, y pedirlo igual dejaba un 404 en la consola por cada
    // Mortandad o Manantial que salía en un sobre.
    const videos = new Map();
    for (const c of cartas) {
      if (c.rareza !== 'LEGENDARIO' || !c.dino || !c.id || videos.has(c.id)) continue;
      videos.set(c.id, precargarVideo(c.id, () => videos.delete(c.id)));
    }
    let presentando = false;

    async function presentar(c) {
      const v = videos.get(c.id);
      if (!v) return;
      presentando = true;
      await mostrarVideo({ raiz, video: v, binomial: c.binomial, dino: c.dino, cancelado: () => acabado });
      presentando = false;
    }

    // -------------------------------------------------------------- pila
    // La carta de arriba sigue al dedo; si se suelta lejos, se va por donde
    // iba; si no, vuelve. Un toque la manda a la derecha. Cada carta que se va
    // descubre la siguiente, y esa es la que suena.
    let indice = 0;
    const cimaActual = () => pila.querySelector(`.apertura-carta[data-i="${indice}"]`);

    async function revelar() {
      const c = cartas[indice];
      const nodo = cimaActual();
      if (!c || !nodo) { acabar(); return; }
      if (c.rareza === 'LEGENDARIO') await presentar(c);
      if (acabado) return;
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
      if (presentando) return;
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
