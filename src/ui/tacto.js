// DinoWar — el tacto del menú: lo que pasa cuando se toca una pieza.
//
// Las piezas del menú son dibujadas —piedra y latón— y sin esto se tocaban
// como una lámina. Aquí va lo que el CSS no puede hacer solo: poner `.pulsada`
// al bajar el dedo, que dispara el destello del latón; y al soltar, el toque
// de sonido y la vibración corta, que van en `click` y no en `pointerdown`
// porque bajar el dedo NO cuenta como gesto para el navegador —sólo soltarlo—
// y un AudioContext creado antes de tiempo nace suspendido y suena tarde.
//
// El destello lo quita `animationend`; y `animationcancel` lo quita cuando la
// pieza se oculta a media animación, que es lo normal: tocar una placa cambia
// de pantalla antes de que termine. Sin eso, la clase se quedaba puesta y al
// volver al menú la placa destellaba sola.

import { desbloquear, sonido } from './audio.js';

const TOCABLES = '.placa, .boton-piedra, .menu-chips .chip, .boton-fantasma';
const CON_LATON = '.placa, .boton-piedra';

export function montarTacto(raiz) {
  raiz.addEventListener('pointerdown', (e) => {
    const pieza = e.target.closest(TOCABLES);
    if (!pieza || pieza.disabled || !raiz.contains(pieza)) return;
    if (!pieza.matches(CON_LATON)) return;
    // Quitar y volver a poner reinicia la animación si se toca dos veces
    // seguidas; el reflujo forzado es lo que separa las dos escrituras.
    pieza.classList.remove('pulsada');
    void pieza.offsetWidth;
    pieza.classList.add('pulsada');
  });

  raiz.addEventListener('click', (e) => {
    const pieza = e.target.closest(TOCABLES);
    if (!pieza || pieza.disabled || !raiz.contains(pieza)) return;
    desbloquear();
    sonido('toque');
    if (pieza.matches(CON_LATON)) {
      try { navigator.vibrate?.(10); } catch { /* sin vibración: no pasa nada */ }
    }
  });

  const apagar = (e) => {
    if (e.animationName !== 'menu-brillo') return;
    e.target.closest?.('.pulsada')?.classList.remove('pulsada');
  };
  raiz.addEventListener('animationend', apagar);
  raiz.addEventListener('animationcancel', apagar);
}
