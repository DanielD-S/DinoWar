// DinoWar — la pantalla de la capa cooperativa.
//
// Sólo LEE de red.js y pinta. No sabe si el estado viene de este navegador o de
// un servidor, y ésa es la idea: cuando lo haya, este fichero no cambia.

import { CUENCA, depositoDe, ritmoPorHora, costeDeMejora, faltaParaLlenar,
  puedeAsaltar, saludDeJefe, tablaDeAportes, totalAportado } from '../data/tribu.js';
import { CARTAS_DE_JEFE, eventosActivos, ventanaDe, TIPO_EVENTO } from '../data/eventos.js';
import { carta } from '../data/cards.js';
import { estadoDeTribu, aportar, mejorarYacimiento, reclamar, YO } from './red.js';
import { anadirCartas } from './almacen.js';
import { arte } from './art.js';

const id = (s) => document.getElementById(s);
let dom = null;
let alAsaltar = null;      // lo pone main.js: arrancar la partida contra el jefe
let alVolver = null;

/** Duración legible. Sin segundos: nadie mira una cuenta atrás de catorce horas. */
function duracion(ms) {
  if (ms === null || ms <= 0) return 'ya';
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return min % 60 === 0 ? `${h} h` : `${h} h ${min % 60} min`;
  const d = Math.floor(h / 24);
  return h % 24 === 0 ? `${d} d` : `${d} d ${h % 24} h`;
}

const numero = (n) => Math.round(n).toLocaleString('es');

export function montarCuenca(volver, asaltar) {
  alVolver = volver;
  alAsaltar = asaltar;
  dom = { pantalla: id('cuenca'), cuerpo: id('cuenca-cuerpo'), pie: id('cuenca-pie') };

  dom.cuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    if (b.dataset.accion === 'aportar') {
      const c = estadoDeTribu();
      aportar(Number(b.dataset.cuanto) || c.yacimiento.fosiles);
    } else if (b.dataset.accion === 'mejorar') {
      mejorarYacimiento(Number(b.dataset.coste));
    } else if (b.dataset.accion === 'reclamar') {
      const cardId = reclamar();
      if (cardId) {
        // A la colección de verdad, no sólo a la cuenca: una carta que no puedes
        // meter en un mazo no es una recompensa, es un cromo.
        anadirCartas([cardId]);
        anunciarCarta(cardId);
      }
    }
    pintarCuenca();
  });

  dom.pie.addEventListener('click', (e) => {
    if (e.target.closest('[data-accion="asaltar"]') && alAsaltar) alAsaltar();
  });
}

export function abrirCuenca() {
  pintarCuenca();
  return dom.pantalla;
}

// ------------------------------------------------------------------ pintado

function bloqueYacimiento(c, ahora) {
  const { nivel, fosiles } = c.yacimiento;
  const tope = depositoDe(nivel);
  const pct = Math.min(100, (fosiles / tope) * 100);
  const coste = costeDeMejora(nivel);
  const falta = faltaParaLlenar(c.yacimiento, ahora);

  return `<section class="cu-bloque">
    <h3 class="cu-titulo">Tu yacimiento <span class="cu-nivel">nivel ${nivel}</span></h3>
    <p class="cu-linea">Saca <b>${ritmoPorHora(nivel)}</b> fósiles por hora, hasta <b>${numero(tope)}</b>.
      ${falta === null
        ? '<span class="cu-alerta">El depósito está lleno: lo que saque ahora se pierde.</span>'
        : `Se llena en <b>${duracion(falta)}</b>.`}</p>
    <div class="cu-barra"><i style="width:${pct.toFixed(1)}%"></i><b>${numero(fosiles)}</b></div>
    ${c.ganadosDesdeLaUltima > 0
      ? `<p class="cu-nota">Mientras no estabas se sacaron <b>${numero(c.ganadosDesdeLaUltima)}</b>.</p>` : ''}
    <div class="cu-botones">
      <button class="boton-secundario" data-accion="aportar" ${fosiles > 0 ? '' : 'disabled'}>
        Aportar todo · ${numero(fosiles)}</button>
      ${coste === null
        ? '<span class="cu-nota">Yacimiento al máximo.</span>'
        : `<button class="boton-secundario" data-accion="mejorar" data-coste="${coste}"
                   ${fosiles >= coste ? '' : 'disabled'}>Mejorar · ${numero(coste)}</button>`}
    </div>
    <p class="cu-nota">Los fósiles que aportas ya no suben tu yacimiento, y al revés.
      Ayudar hoy o producir más mañana: ésa es toda la decisión.</p>
  </section>`;
}

function bloqueTribu(c) {
  return `<section class="cu-bloque">
    <h3 class="cu-titulo">Almacén de la tribu</h3>
    <p class="cu-cifra">${numero(c.almacen)} <small>fósiles</small></p>
    <p class="cu-linea">Cada asalto al jefe cuesta <b>${CUENCA.costeAsalto}</b> del común.
      Tú llevas <b>${numero(c.aportado)}</b> aportados.</p>
    <p class="cu-nota">${c.miembros.length} de ${CUENCA.miembrosMaximo} en la tribu:
      ${c.miembros.join(' · ')}.</p>
  </section>`;
}

function bloqueJefe(c, ahora) {
  if (!c.jefe) {
    return `<section class="cu-bloque">
      <h3 class="cu-titulo">Sin jefe en la cuenca</h3>
      <p class="cu-linea">Ahora mismo no hay nada que cazar. Vuelve cuando se abra la
        siguiente ventana.</p>
    </section>`;
  }
  const j = c.jefe;
  const vivo = j.vida > 0;
  const pct = saludDeJefe(j) * 100;
  const motivo = puedeAsaltar({ almacen: c.almacen, asaltosHoy: c.asaltosHoy }, ahora, j);
  const aportes = tablaDeAportes(j);

  return `<section class="cu-bloque cu-jefe ${vivo ? '' : 'caido'}">
    <div class="cu-jefe-arte">${arte(j.recompensa)}</div>
    <h3 class="cu-titulo"><i>${j.nombre}</i></h3>
    <p class="cu-subtitulo">${j.titulo}</p>
    ${vivo
      ? `<div class="cu-barra vida"><i style="width:${pct.toFixed(1)}%"></i>
           <b>${numero(j.vida)} / ${numero(j.vidaMaxima)}</b></div>
         <p class="cu-linea">La ventana se cierra en <b>${duracion(j.hasta - ahora)}</b>.
           Has hecho <b>${c.asaltosHoy}</b> de ${CUENCA.asaltosPorDia} asaltos hoy.</p>`
      : `<p class="cu-caido">Ha caído. ${numero(totalAportado(j))} de daño entre ${aportes.length}.</p>`}
    <p class="cu-nota">${j.nota}</p>
    ${aportes.length ? `<table class="cu-aportes">
      ${aportes.map((a) => `<tr class="${a.quien === YO ? 'yo' : ''}">
        <th>${a.quien}</th><td>${numero(a.dano)}</td>
        <td class="cu-cuota"><i style="width:${(a.cuota * 100).toFixed(1)}%"></i></td></tr>`).join('')}
    </table>` : '<p class="cu-nota">Todavía nadie le ha tocado.</p>'}
    ${c.puedeReclamar
      ? `<button class="boton-grande" data-accion="reclamar">Reclamar <i>${carta(j.recompensa).binomial}</i></button>`
      : ''}
    ${!vivo && !c.puedeReclamar && (j.aportes[YO] ?? 0) === 0
      ? '<p class="cu-nota">No le hiciste daño, así que su carta no es tuya. La próxima.</p>' : ''}
    ${vivo && motivo ? `<p class="cu-nota mal">${motivo[0].toUpperCase()}${motivo.slice(1)}.</p>` : ''}
  </section>`;
}

function bloqueEventos(c, ahora) {
  const activos = eventosActivos(c.arranque, ahora);
  if (activos.length === 0) return '';
  return `<section class="cu-bloque">
    <h3 class="cu-titulo">En la cuenca ahora</h3>
    ${activos.map((e) => {
      const v = ventanaDe(e, c.arranque, ahora);
      return `<div class="cu-evento ${e.tipo === TIPO_EVENTO.JEFE ? 'jefe' : 'clima'}">
        <b>${e.titulo}</b>
        <p>${e.texto}</p>
        <small>Quedan ${duracion(v.hasta - ahora)}</small>
      </div>`;
    }).join('')}
  </section>`;
}

function bloqueCartas(c) {
  if (c.cartas.length === 0) return '';
  return `<section class="cu-bloque">
    <h3 class="cu-titulo">Cartas de jefe</h3>
    <p class="cu-nota">No salen en sobres. Sólo se consiguen tumbando a su jefe con la tribu.</p>
    <div class="cu-premios">
      ${c.cartas.map((cid) => `<div class="cu-premio">
        <div class="col-arte">${arte(cid)}</div>
        <span><i>${carta(cid).binomial}</i></span>
      </div>`).join('')}
    </div>
  </section>`;
}

export function pintarCuenca() {
  const ahora = Date.now();
  const c = estadoDeTribu(ahora);

  dom.cuerpo.innerHTML = [
    bloqueEventos(c, ahora),
    bloqueJefe(c, ahora),
    bloqueYacimiento(c, ahora),
    bloqueTribu(c),
    bloqueCartas(c),
    `<p class="cu-aviso">Tus compañeros de tribu todavía no son personas: los simula
      el propio juego con las mismas reglas y los mismos ritmos. Cooperar de verdad
      necesita un servidor, y eso va aparte (ver PLAN_TRIBU.md).</p>`,
  ].join('');

  const j = c.jefe;
  const motivo = j ? puedeAsaltar({ almacen: c.almacen, asaltosHoy: c.asaltosHoy }, ahora, j) : 'no hay jefe';
  dom.pie.innerHTML = `<button class="boton-grande" data-accion="asaltar" ${motivo ? 'disabled' : ''}>
    ${motivo ? 'No puedes asaltar' : `Asaltar · ${CUENCA.costeAsalto} fósiles`}</button>`;
  for (const m of document.querySelectorAll('#cuenca .moneda')) m.textContent = numero(c.almacen);
}

/** Aviso de carta nueva. Reutiliza la ficha, que ya sabe enseñar una carta. */
function anunciarCarta(cardId) {
  const c = CARTAS_DE_JEFE[cardId];
  if (!c) return;
  const cuerpo = id('ficha-cuerpo');
  if (!cuerpo) return;
  cuerpo.innerHTML = `<div class="cu-anuncio">
    <p class="cu-anuncio-eyebrow">Carta de jefe</p>
    <div class="cu-anuncio-arte">${arte(cardId)}</div>
    <h2><i>${c.binomial}</i></h2>
    <p class="cu-anuncio-nota">${c.nota}</p>
    <p class="cu-nota">${c.formacion} · ${c.edad} · evidencia ${c.evidencia}</p>
  </div>`;
  id('ficha').classList.remove('oculta');
}
