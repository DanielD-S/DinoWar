// DinoWar — la elección del mazo inicial.
//
// Sale una sola vez: cuando el servidor dice que la cuenta todavía no tiene
// colección (`sembrado: false`). Tres mazos, uno por clado, y el que se elige
// es la colección de salida entera. No hay que confirmar en otra pantalla: se
// toca uno, el botón dice con cuál empiezas, y se pulsa.
//
// Es la pieza de delante de `presentarse()` en main.js: devuelve una promesa
// que resuelve cuando el servidor ha sembrado la cuenta, y hasta entonces no
// se enseña el menú. Si el servidor falla, el error se queda en la pantalla y
// se puede volver a intentar.

import { MAZOS_INICIALES } from '../data/iniciales.js';
import { CLADO_NOMBRE } from '../data/cards.js';
import { arte } from './art.js';
import { elegirMazoInicial } from './perfil.js';

const escapar = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** Pinta la elección en `seccion` y resuelve cuando la cuenta está sembrada. */
export function pedirMazoInicial(seccion) {
  let elegido = null;
  let enviando = false;

  seccion.innerHTML = `<div class="ini-caja">
    <h1 class="ini-titulo">Elige tu mazo inicial</h1>
    <p class="ini-lema">Es tu colección de salida. Las cartas de los otros dos siguen saliendo en los sobres.</p>
    <div class="ini-lista">${MAZOS_INICIALES.map((m) => `
      <button class="ini-mazo" data-mazo="${m.id}" aria-pressed="false">
        <span class="ini-retrato" aria-hidden="true">${arte(m.retrato)}</span>
        <i class="emblema emb-clado_${m.clado.toLowerCase()}" aria-hidden="true"></i>
        <b>${escapar(m.nombre)}</b>
        <small>${escapar(CLADO_NOMBRE[m.clado] ?? m.clado)}</small>
        <span class="ini-texto">${escapar(m.lema)}</span>
      </button>`).join('')}
    </div>
    <p class="ini-aviso" role="status"></p>
    <button class="boton-grande ini-empezar" disabled>Elige uno</button>
  </div>`;

  const boton = seccion.querySelector('.ini-empezar');
  const aviso = seccion.querySelector('.ini-aviso');

  const pintar = () => {
    for (const b of seccion.querySelectorAll('.ini-mazo')) {
      b.setAttribute('aria-pressed', String(b.dataset.mazo === elegido?.id));
    }
    boton.disabled = !elegido || enviando;
    boton.textContent = enviando ? 'Un momento…'
      : elegido ? `Empezar con ${elegido.nombre}` : 'Elige uno';
  };

  return new Promise((resolver) => {
    seccion.onclick = async (e) => {
      const tarjeta = e.target.closest('.ini-mazo');
      if (tarjeta && !enviando) {
        elegido = MAZOS_INICIALES.find((m) => m.id === tarjeta.dataset.mazo) ?? null;
        aviso.textContent = '';
        return pintar();
      }
      if (!e.target.closest('.ini-empezar') || !elegido || enviando) return;
      enviando = true;
      pintar();
      try {
        await elegirMazoInicial(elegido.id);
        seccion.onclick = null;
        resolver();
      } catch (err) {
        enviando = false;
        aviso.textContent = `No se pudo guardar la elección: ${err.message}`;
        pintar();
      }
    };
  });
}
