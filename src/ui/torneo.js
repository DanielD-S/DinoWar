// DinoWar — el torneo, del lado del cliente: la placa, la entrada y la racha.
//
// Aquí vive lo que pasa alrededor de una racha —ver qué torneo toca, armar un
// mazo que cumpla su regla, pagar la entrada, ver cómo va y retirarse—. Las
// partidas las juega el Duelo de siempre: una vez dentro de la racha, «Buscar
// rival» es exactamente el mismo botón, y el servidor ya sabe que ese duelo es
// del torneo porque lo deduce de la racha abierta.
//
// TRES COSAS QUE CONVIENE SABER ANTES DE TOCARLO:
//
// - EL MAZO NO SE MANDA AL BUSCAR. Se manda al ENTRAR, y el servidor lo guarda
//   en la racha. `duelo_buscar` ignora el que llegue en la petición y usa el
//   cerrado. Por eso aquí no hay ninguna comprobación de mazo entre duelo y
//   duelo: no hay nada que comprobar.
// - LA ENTRADA SE PAGA Y SE VALIDA A LA VEZ. Un mazo ilegal no cobra nada. Lo
//   que este fichero hace antes es una cortesía —decir por qué, con el mismo
//   validador que el editor— y no una autorización.
// - UNA CUENTA NUEVA NO PUEDE JUGAR. La colección de salida son 55 cartas
//   exactas y cualquier regla la deja por debajo. El panel lo dice con el
//   número que falta en vez de ofrecer un botón que rebota.

import { diaUTC } from '../data/misiones.js';
import { TAM_MAZO } from '../data/coleccion.js';
import {
  PREMIOS, TORNEOS, copiasDisponibles, premioDeRacha, textoDeRegla, torneoDe, torneoPorId,
} from '../data/torneos.js';
import { cargarPerfil } from './almacen.js';
import { miRacha, entrarEnTorneo as pedirEntrada, retirarRacha } from './perfil.js';

const id = (s) => document.getElementById(s);
const escapar = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

let dom = null;
let abierto = false;
let aviso = null;
/** Lo último que contestó `mi_racha()`, o null mientras no ha contestado. */
let estado = null;
let pidiendo = false;
let alArmar = () => {};
let alBuscar = () => {};

export function montarTorneo({ cuandoArme, cuandoBusque }) {
  alArmar = cuandoArme ?? (() => {});
  alBuscar = cuandoBusque ?? (() => {});
  dom = { caja: id('menu-torneo'), jugar: id('jugar') };
  dom.caja.addEventListener('click', alPulsar);
}

/** Despliega o pliega el panel. Al abrirlo se refresca, que la racha cambia. */
export function enseñarTorneo(si) {
  abierto = si;
  dom.jugar.classList.toggle('torneo-abierto', si);
  if (si) refrescarTorneo();
  pintarTorneo();
}

/**
 * Pregunta cómo va la racha. El DÍA lo dice el servidor —con la fecha local
 * del navegador, alguien en Auckland vería el torneo de la semana que viene y
 * el servidor le cobraría el de ésta—, así que lo que se pinta antes de que
 * conteste es lo que dice el reloj de aquí, y se corrige en cuanto llega.
 */
export async function refrescarTorneo() {
  if (pidiendo) return;
  pidiendo = true;
  try {
    estado = await miRacha();
  } catch (e) {
    // Sin servidor no hay torneo. No se inventa una racha local: una racha es
    // una fila con dinero de por medio.
    estado = { error: e.message };
  } finally {
    pidiendo = false;
    pintarTorneo();
  }
}

/** El torneo que toca: el que diga el servidor, y si no ha contestado, el del reloj. */
function elTorneo() {
  const porServidor = estado && !estado.error ? torneoPorId(estado.torneo) : null;
  return porServidor ?? torneoDe(diaUTC());
}

/** La racha abierta, o null. Una cerrada no es una racha en marcha. */
const laRacha = () => {
  const r = estado && !estado.error ? estado.racha : null;
  return r && !r.cerrada ? r : null;
};

/** La racha de esta semana ya cerrada, que es lo que impide volver a entrar. */
const laGastada = () => {
  const r = estado && !estado.error ? estado.racha : null;
  return r && r.cerrada ? r : null;
};

/** La escalera de premios, con la casilla donde vas encendida. */
function escaleraHTML(ganadas) {
  return `<ol class="torneo-escalera">${PREMIOS.map((p, i) => {
    const vale = [p.monedas ? `${p.monedas} ⛁` : '', p.sobres ? `${p.sobres} sobre${p.sobres === 1 ? '' : 's'}` : '']
      .filter(Boolean).join(' + ') || '—';
    const clase = [i === ganadas ? 'aqui' : '', i <= ganadas ? 'hecho' : ''].filter(Boolean).join(' ');
    return `<li class="${clase}"><b>${i}</b><span>${vale}</span></li>`;
  }).join('')}</ol>`;
}

/** Las marcas de la racha: victorias llenas, derrotas tachadas. */
function marcadorHTML(r) {
  const v = Array.from({ length: TORNEOS.victoriasParaCerrar },
    (_, i) => `<i class="${i < r.ganadas ? 'llena' : ''}"></i>`).join('');
  const d = Array.from({ length: TORNEOS.derrotasParaCerrar },
    (_, i) => `<i class="${i < r.perdidas ? 'llena' : ''}"></i>`).join('');
  return `<p class="torneo-marcador"><span class="torneo-victorias">${v} ${r.ganadas} ${r.ganadas === 1 ? 'victoria' : 'victorias'}</span>
    <span class="torneo-derrotas">${d} ${r.perdidas} de ${TORNEOS.derrotasParaCerrar}</span></p>`;
}

export function pintarTorneo() {
  const caja = dom?.caja;
  if (!caja) return;
  if (!abierto) { caja.classList.add('oculta'); return; }
  caja.classList.remove('oculta');

  const t = elTorneo();
  const p = cargarPerfil();
  const monedas = Number(p.monedas ?? 0);
  const cabecera = `<p class="menu-misiones-titulo">Torneo de la semana</p>
    <div class="torneo-cartela">
      <h3 class="torneo-nombre">${escapar(t.nombre)}</h3>
      <p class="torneo-lema">${escapar(t.lema)}</p>
      <p class="torneo-regla">${escapar(textoDeRegla(t))}</p>
    </div>`;

  let cuerpo;
  if (estado?.error) {
    cuerpo = `<p class="cu-nota mal">No se pudo preguntar por el torneo: ${escapar(estado.error)}</p>`;
  } else if (!estado) {
    cuerpo = '<p class="duelo-nota">Mirando cómo va…</p>';
  } else if (laRacha()) {
    const r = laRacha();
    const premio = premioDeRacha(r.ganadas);
    const cobra = premio.monedas || premio.sobres;
    cuerpo = `${marcadorHTML(r)}${escaleraHTML(r.ganadas)}
      <div class="duelo-acciones">
        <button class="boton-grande" data-torneo="buscar">Buscar rival</button>
        <button class="boton-fantasma" data-torneo="retirar">Retirarme${cobra ? ' y cobrar' : ''}</button>
      </div>
      <p class="duelo-nota">${cobra
    ? 'Retirarte paga lo que llevas. La racha se cierra y no se puede volver a entrar esta semana.'
    : 'Todavía no has llegado a ningún premio: retirarte ahora no paga nada.'}</p>`;
  } else if (laGastada()) {
    const r = laGastada();
    cuerpo = `${marcadorHTML(r)}
      <p class="duelo-estado">Racha cerrada con ${r.ganadas} ${r.ganadas === 1 ? 'victoria' : 'victorias'}.</p>
      <p class="duelo-nota">${r.monedas || r.sobres
    ? `Cobraste ${[r.monedas ? `${r.monedas} dinomonedas` : '', r.sobres ? `${r.sobres} sobre${r.sobres === 1 ? '' : 's'}` : ''].filter(Boolean).join(' y ')}.`
    : 'Sin premio.'} El torneo cambia el lunes.</p>`;
  } else {
    const tengo = copiasDisponibles(p.cartas ?? {}, t);
    const faltan = Math.max(0, TAM_MAZO - tengo);
    const sinMonedas = monedas < TORNEOS.entrada;
    cuerpo = `${escaleraHTML(-1)}
      <div class="duelo-acciones">
        <button class="boton-grande" data-torneo="armar" ${faltan ? 'disabled' : ''}>Entrar · ${TORNEOS.entrada} ⛁</button>
      </div>
      <p class="duelo-nota">${faltan
    ? `Te faltan ${faltan} cartas que entren en este torneo: tienes ${tengo} de las ${TAM_MAZO} que pide un mazo.`
    : sinMonedas
      ? `Te faltan ${TORNEOS.entrada - monedas} dinomonedas para la entrada.`
      : `Eliges un mazo que cumpla la regla y se cobra la entrada. Ganas ${TORNEOS.victoriasParaCerrar} antes de perder ${TORNEOS.derrotasParaCerrar}.`}</p>`;
  }

  const mensaje = aviso ? `<p class="cu-nota mal">${escapar(aviso)}</p>` : '';
  caja.innerHTML = `${cabecera}${cuerpo}${mensaje}
    <p class="duelo-nota">Los duelos del torneo mueven tu liga como cualquier otro. Una racha por semana.</p>`;
}

function alPulsar(e) {
  const b = e.target.closest('[data-torneo]');
  if (!b) return;
  aviso = null;
  const que = b.dataset.torneo;
  if (que === 'armar') alArmar(elTorneo());
  if (que === 'buscar') alBuscar();
  if (que === 'retirar') retirar(b);
}

/**
 * Entrar con un mazo. Lo llama main.js cuando el jugador elige uno en la
 * pantalla de mazos en modo torneo. El servidor valida y cobra a la vez: si
 * dice que no, no se ha tocado una moneda y el motivo se enseña tal cual.
 */
export async function entrarEnTorneo(cartas) {
  try {
    const racha = await pedirEntrada(elTorneo().id, cartas);
    estado = { ...(estado ?? {}), racha };
    aviso = null;
    return true;
  } catch (e) {
    aviso = e.message;
    pintarTorneo();
    return false;
  }
}

async function retirar(boton) {
  boton.disabled = true;
  try {
    await retirarRacha();
  } catch (e) {
    aviso = e.message;
  }
  await refrescarTorneo();
}
