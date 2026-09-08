// Arranque, máquina de estados y pegamento entre motor e interfaz.
// La interfaz sólo LEE el estado; toda mutación pasa por reduce().

import { BALANCE } from './data/balance.js';
import { TIPO, carta } from './data/cards.js';
import {
  crearPartida, vistaDe, FASE, MOTIVO_FIN, unidadesDe,
} from './engine/state.js';
import { reduce, ACCION, legales, opcionesSequia, validar } from './engine/actions.js';
import { decidir, PERFIL } from './engine/ai.js';
import { semilla } from './engine/rng.js';
import {
  montar, render, mensaje, el, JUGADOR, RIVAL,
  fichaHTML, fichaEstacionHTML, ayudaHTML, abrirFicha, cerrarHojas,
} from './ui/render.js';
import { tomarEntrada, soltarEntrada } from './ui/input.js';
import { animarResolucion, cancelarAnimaciones, esperar, lineasDeLog } from './ui/animate.js';
import { desbloquear, alternarMute, estaSilenciado, sonido, cerrarAudio } from './ui/audio.js';

const APP = Object.freeze({
  BOOT: 'BOOT', MENU: 'MENU', PLAYING: 'PLAYING', RESOLVING: 'RESOLVING', GAME_OVER: 'GAME_OVER',
});

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
// §11: el demo usa el perfil Reactiva por defecto. `?ia=territorial|economista|
// aleatoria` cambia de rival sin tocar código.
const PERFIL_IA = params.get('ia') ?? PERFIL.REACTIVA;

let app = APP.BOOT;
let estado = null;
let rngIA = 0;
let registro = [];      // log acumulado: [{turno, lineas}]
let rafDebug = 0;

const CLAVE_RECORD = 'morrison.record';

// ------------------------------------------------------------- persistencia

function leerRecord() {
  try {
    const crudo = localStorage.getItem(CLAVE_RECORD);
    return crudo ? JSON.parse(crudo) : null;
  } catch { return null; }
}

function guardarRecord(r) {
  try { localStorage.setItem(CLAVE_RECORD, JSON.stringify(r)); } catch { /* sin persistencia */ }
}

function pintarRecord() {
  const r = leerRecord();
  if (!r) { el.record.textContent = ''; return; }
  const partes = [`${r.victorias} de ${r.partidas} partidas ganadas`];
  if (r.mejorTurnos) partes.push(`mejor victoria en ${r.mejorTurnos} turnos`);
  el.record.textContent = partes.join(' · ');
}

function anotarResultado(gane, turnos) {
  const r = leerRecord() ?? { partidas: 0, victorias: 0, mejorTurnos: null };
  r.partidas += 1;
  if (gane) {
    r.victorias += 1;
    if (!r.mejorTurnos || turnos < r.mejorTurnos) r.mejorTurnos = turnos;
  }
  guardarRecord(r);
}

// ------------------------------------------------------------------ máquina

function irA(nuevo) {
  app = nuevo;
  el.menu.classList.toggle('oculta', nuevo !== APP.MENU);
  el.partida.classList.toggle('oculta', nuevo !== APP.PLAYING && nuevo !== APP.RESOLVING);
  el.fin.classList.toggle('oculta', nuevo !== APP.GAME_OVER);
}

const interactivo = () => app === APP.PLAYING && estado?.fase === FASE.DESPLIEGUE;

function aplicar(accion) {
  const motivo = validar(estado, accion);
  if (motivo) {
    mensaje(motivo, true);
    sonido('error');
    return false;
  }
  estado = reduce(estado, accion);
  render(estado);
  return true;
}

// -------------------------------------------------------------- turno del jugador

function turnoDelJugador() {
  irA(APP.PLAYING);
  render(estado);
  el.btnListo.disabled = false;
  const p = estado.jugadores[JUGADOR];
  const puede = legales(estado, JUGADOR).some((a) => a.tipo !== ACCION.PASAR);
  mensaje(puede
    ? 'Suelta una carta en el tablero, o sobre otra zona de la tira. Mantenla pulsada para su ficha.'
    : `No te alcanza la Biomasa (${p.biomasa}). Pulsa Listo para revelar.`);
}

function jugarIA() {
  let guardia = 0;
  while (!estado.jugadores[RIVAL].listo && guardia++ < 60) {
    // La IA recibe una vista redactada: no ve tu mano ni tu despliegue oculto.
    const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, PERFIL_IA);
    rngIA = d.rng;
    if (!d.accion) break;
    estado = reduce(estado, d.accion);
  }
  if (!estado.jugadores[RIVAL].listo) estado = reduce(estado, { tipo: ACCION.PASAR, jugador: RIVAL });
}

async function alPulsarListo() {
  if (!interactivo()) return;
  desbloquear();
  el.btnListo.disabled = true;
  cerrarHojas();

  estado = reduce(estado, { tipo: ACCION.PASAR, jugador: JUGADOR });
  jugarIA();
  await bucle();
}

// ------------------------------------------------------------------- bucle

async function bucle() {
  let guardia = 0;
  while (guardia++ < 400) {
    if (estado.fase === FASE.FIN) return finPartida();

    if (estado.fase === FASE.DESPLIEGUE) return turnoDelJugador();

    if (estado.fase === FASE.SEQUIA_PAGO) {
      if (estado.sequiaPendiente.includes(RIVAL)) {
        const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, PERFIL_IA);
        rngIA = d.rng;
        estado = reduce(estado, d.accion);
        continue;
      }
      render(estado);
      return pedirSacrificio();
    }

    if (estado.fase === FASE.DESCARTE) {
      if (estado.jugadores[RIVAL].mano.length > BALANCE.manoMaxima) {
        const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, PERFIL_IA);
        rngIA = d.rng;
        estado = reduce(estado, d.accion);
        continue;
      }
      render(estado);
      return pedirDescarte();
    }

    if (estado.fase === FASE.REVELACION) {
      irA(APP.RESOLVING);
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      render(estado);
      mensaje('Revelación simultánea…');
      sonido('revelar');
      await esperar(750);
      continue;
    }

    if (estado.fase === FASE.RESOLUCION) {
      irA(APP.RESOLVING);
      const previo = estado;
      const desde = estado.eventos.length;
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      const nuevos = estado.eventos.slice(desde);
      mensaje('Resolviendo zonas…');
      for (const e of nuevos) if (e.tipo === 'MUERTE') { sonido('muerte'); break; }
      await new Promise((r) => animarResolucion(previo, estado, nuevos, r));
      continue;
    }

    if (estado.fase === FASE.CHEQUEO) archivarLog();

    estado = reduce(estado, { tipo: ACCION.AVANZAR });
    render(estado);
  }
  throw new Error('el bucle de partida no converge');
}

function archivarLog() {
  const lineas = lineasDeLog(estado.eventos);
  if (lineas.length) registro.push({ turno: estado.turno, lineas });
  if (registro.length > 12) registro.shift();
}

// ------------------------------------------------------------------ modales

function pedirSacrificio() {
  const opciones = opcionesSequia(estado, JUGADOR);
  const consumo = (iid) => carta(estado.instancias[iid].cardId).consumoHidrico;

  el.eleccionTitulo.textContent = 'Sequía estacional';
  el.eleccionTexto.innerHTML =
    `No te alcanza el Agua (<b>${estado.jugadores[JUGADOR].agua}</b>) para el consumo hídrico de tus dinosaurios. ` +
    'Elige a quién dejas morir. <i>Camarasaurus</i> es inmune.';

  el.eleccionCuerpo.innerHTML = opciones.map((op, i) => {
    const nombres = op.map((iid) => `<i>${carta(estado.instancias[iid].cardId).binomial}</i>`).join(', ');
    const total = op.reduce((n, iid) => n + consumo(iid), 0);
    return `<button class="opcion" data-op="${i}">${nombres || 'Nadie'}
      <small>libera ${total} de consumo · ${op.length} baja${op.length === 1 ? '' : 's'}</small></button>`;
  }).join('');

  el.eleccion.classList.remove('oculta');
  el.eleccionCuerpo.onclick = async (e) => {
    const b = e.target.closest('[data-op]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    estado = reduce(estado, {
      tipo: ACCION.PAGAR_SEQUIA, jugador: JUGADOR, sacrificios: opciones[Number(b.dataset.op)],
    });
    sonido('muerte');
    render(estado);
    await bucle();
  };
}

function pedirDescarte() {
  const jug = estado.jugadores[JUGADOR];
  el.eleccionTitulo.textContent = 'Límite de mano';
  el.eleccionTexto.innerHTML =
    `Tu mano tiene ${jug.mano.length} cartas y el máximo es ${BALANCE.manoMaxima}. Descarta una.`;
  el.eleccionCuerpo.innerHTML = jug.mano.map((iid) => {
    const c = carta(estado.instancias[iid].cardId);
    return `<button class="opcion" data-iid="${iid}">${c.tipo === TIPO.DINOSAURIO ? `<i>${c.binomial}</i>` : c.binomial}
      <small>coste ${c.coste}${c.tipo === TIPO.DINOSAURIO ? ` · Poder ${c.poder}` : ''}</small></button>`;
  }).join('');

  el.eleccion.classList.remove('oculta');
  el.eleccionCuerpo.onclick = async (e) => {
    const b = e.target.closest('[data-iid]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    estado = reduce(estado, { tipo: ACCION.DESCARTAR, jugador: JUGADOR, iid: Number(b.dataset.iid) });
    render(estado);
    await bucle();
  };
}

function abrirLog() {
  archivarLog();
  const bloques = registro.slice().reverse();
  el.logCuerpo.innerHTML = bloques.length === 0
    ? '<p class="ficha-nota">Todavía no ha pasado nada.</p>'
    : bloques.map((b) => `<div class="log-turno">Turno ${b.turno}</div>` +
        b.lineas.map((l) => `<div class="log-linea ${l.clase}">${l.texto}</div>`).join('')).join('');
  el.log.classList.remove('oculta');
}

// --------------------------------------------------------------------- fin

function finPartida() {
  irA(APP.GAME_OVER);
  soltarEntrada();
  cancelarAnimaciones();

  const gane = estado.ganador === JUGADOR;
  const [p, r] = estado.jugadores;
  el.finTitulo.textContent = gane ? 'Dominas la formación' : 'Tu población se extingue';
  el.finTitulo.style.color = gane ? 'var(--propio)' : 'var(--rival)';

  const motivo = {
    [MOTIVO_FIN.TERRITORIO]: 'por Territorio',
    [MOTIVO_FIN.SIN_CARTAS]: 'por agotamiento de la población',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'por límite de turnos',
  }[estado.motivoFin] ?? '';

  el.finDetalle.innerHTML =
    `${motivo} · Territorio <b>${p.territorio}</b> – <b>${r.territorio}</b><br>${estado.turno} turnos`;

  anotarResultado(gane, estado.turno);
  sonido(gane ? 'gana' : 'pierde');
}

// ------------------------------------------------------------------ arranque

function nuevaPartida() {
  cancelarAnimaciones();
  soltarEntrada();
  registro = [];

  const semillaPartida = Number(params.get('seed')) || (Date.now() & 0x7fffffff);
  estado = crearPartida(semillaPartida);
  rngIA = semilla(semillaPartida ^ 0x5bf03635);

  irA(APP.PLAYING);
  render(estado);

  tomarEntrada({
    interactivo,
    desplegar: (iid, zona) => {
      if (aplicar({ tipo: ACCION.DESPLEGAR, jugador: JUGADOR, iid, zona })) {
        sonido('carta');
        mensaje(`Comprometes ${carta(estado.instancias[iid].cardId).binomial} boca abajo.`);
      }
    },
    adaptar: (iid, objetivo) => {
      if (aplicar({ tipo: ACCION.ADAPTAR, jugador: JUGADOR, iid, objetivo })) {
        sonido('carta');
        mensaje(`${carta(estado.instancias[iid].cardId).rasgoNombre} preparado.`);
      }
    },
    ficha: (cardId) => abrirFicha(fichaHTML(cardId)),
    aviso: (texto) => { mensaje(texto, true); sonido('error'); },
  });

  bucle();
}

function pintarDebug() {
  if (!DEBUG || !estado) return;
  el.debug.textContent = [
    `app   ${app}`,
    `fase  ${estado.fase}  turno ${estado.turno}`,
    `IA    ${PERFIL_IA} · mano ${estado.jugadores[RIVAL].mano.length}`,
    `      ${estado.jugadores[RIVAL].mano.map((i) => estado.instancias[i].cardId.slice(0, 6)).join(' ')}`,
    `unid  tú ${unidadesDe(estado, JUGADOR).length} · rival ${unidadesDe(estado, RIVAL).length}`,
    `seed  ${estado.seed}`,
  ].join('\n');
}

function bucleDebug() {
  pintarDebug();
  rafDebug = requestAnimationFrame(bucleDebug);
}

function iniciar() {
  // Cambiar de zona en la tira sólo repinta: la zona enfocada es estado de
  // interfaz, no del juego.
  montar(() => { if (estado) render(estado); });
  pintarRecord();
  irA(APP.MENU);

  el.btnJugar.addEventListener('click', () => { desbloquear(); nuevaPartida(); });
  el.btnOtra.addEventListener('click', () => { pintarRecord(); nuevaPartida(); });
  el.btnListo.addEventListener('click', alPulsarListo);
  el.btnLog.addEventListener('click', abrirLog);
  el.logCerrar.addEventListener('click', cerrarHojas);
  el.ayudaCerrar.addEventListener('click', cerrarHojas);
  const abrirAyuda = () => {
    el.ayudaCuerpo.innerHTML = ayudaHTML();
    el.ayuda.classList.remove('oculta');
  };
  el.btnAyuda.addEventListener('click', abrirAyuda);
  el.btnAyudaMenu.addEventListener('click', abrirAyuda);
  el.fichaCerrar.addEventListener('click', cerrarHojas);
  el.estacion.addEventListener('click', () => {
    if (estado?.estacion.actual) abrirFicha(fichaEstacionHTML(estado.estacion.actual));
  });

  el.btnMute.classList.toggle('off', estaSilenciado());
  el.btnMute.addEventListener('click', () => {
    desbloquear();
    el.btnMute.classList.toggle('off', alternarMute());
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Nada de deltas acumulados: se cancela la animación y se salta al estado
      // final, que es el único que importa.
      cancelarAnimaciones();
      if (estado && app === APP.RESOLVING) render(estado);
    }
  });

  if (DEBUG) {
    el.debug.classList.remove('oculta');
    bucleDebug();
  }
}

window.addEventListener('pagehide', () => {
  cancelarAnimaciones();
  cancelAnimationFrame(rafDebug);
  cerrarAudio();
});

iniciar();
