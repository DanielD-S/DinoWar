// DinoWar — arranque, máquina de estados y pegamento entre motor e interfaz.
// La interfaz sólo LEE el estado; toda mutación pasa por reduce().

import { BALANCE } from './data/balance.js';
import { TIPO, OBJETIVO, CLADO, CLADO_NOMBRE, carta } from './data/cards.js';
import { crearPartida, vistaDe, FASE, MOTIVO_FIN, unidadesDe } from './engine/state.js';
import { reduce, ACCION, legales, validar, cartasTrasMulligan } from './engine/actions.js';
import { decidir, PERFIL } from './engine/ai.js';
import { semilla } from './engine/rng.js';
import {
  montar, render, mensaje, el, JUGADOR, RIVAL,
  fichaHTML, ayudaHTML, abrirFicha, abrirDescarte, cerrarHojas,
  abrirVisor, cambiarModoVisor, cerrarVisor, abrirComprometidas,
} from './ui/render.js';
import { tomarEntrada, soltarEntrada } from './ui/input.js';
import {
  montarTutorial, empezarTutorial, terminarTutorial, tutorialHecho, tutorialActivo,
  tutorialEspera, pasoTutorial,
} from './ui/tutorial.js';
import { detectarFotos, vigilarFotos, calentarFotos } from './ui/art.js';
import { montarMeta, abrirColeccion, abrirSobres, abrirMazos, pintarMenu, recompensar } from './ui/meta.js';
import { mazoActivo, cargarPerfil, actualizarPerfil } from './ui/almacen.js';
import { aListaDeMazo } from './data/coleccion.js';
import {
  animarCombate, animarRevelacion, cancelarAnimaciones, esperar, lineasDeLog,
} from './ui/animate.js';
import { desbloquear, alternarMute, estaSilenciado, sonido, cerrarAudio } from './ui/audio.js';

const APP = Object.freeze({
  BOOT: 'BOOT', MENU: 'MENU', PLAYING: 'PLAYING', RESOLVING: 'RESOLVING', GAME_OVER: 'GAME_OVER',
  COLECCION: 'COLECCION', SOBRES: 'SOBRES', MAZOS: 'MAZOS',
});

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
// El parámetro de la URL sigue mandando —es lo que usan las pruebas— pero ya no
// es la única manera de bajar la dificultad: eso está en el menú.
const IA_FORZADA = params.get('ia');
const perfilIA = () => IA_FORZADA ?? (cargarPerfil().dificultad ?? PERFIL.HEURISTICA);

let app = APP.BOOT;
let estado = null;
let rngIA = 0;
let registro = [];
let rafDebug = 0;

const CLAVE_RECORD = 'dinowar.record';

// ------------------------------------------------------------- persistencia

function leerRecord() {
  try { const c = localStorage.getItem(CLAVE_RECORD); return c ? JSON.parse(c) : null; } catch { return null; }
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
  el.coleccion.classList.toggle('oculta', nuevo !== APP.COLECCION);
  el.sobres.classList.toggle('oculta', nuevo !== APP.SOBRES);
  el.mazos.classList.toggle('oculta', nuevo !== APP.MAZOS);
}

const interactivo = () => app === APP.PLAYING && estado?.fase === FASE.DESPLIEGUE;

function aplicar(accion) {
  const motivo = validar(estado, accion);
  if (motivo) { mensaje(motivo, true); sonido('error'); return false; }
  estado = reduce(estado, accion);
  render(estado);
  // Comprometer una carta cierra el cambio de mano: a partir de ahí el rival ya
  // sabe algo de lo que llevas.
  el.mulligan.classList.add('oculta');
  sonido('carta');
  return true;
}

// ------------------------------------------------------- arrastrar y soltar

/** ¿Esta carta admite este destino? Sólo para resaltar mientras se arrastra. */
function admite(cardId, destino) {
  if (!destino) return false;
  const c = carta(cardId);

  if (c.tipo === TIPO.DINOSAURIO) {
    return destino.tipo === 'ranura' && destino.bando === JUGADOR && destino.libre;
  }
  if (c.tipo === TIPO.CLIMA) return destino.tipo === 'franja';
  if (c.tipo === TIPO.RECURSO) return true;   // se sueltan en cualquier parte del campo
  if (c.objetivo === OBJETIVO.PROPIO) return destino.tipo === 'unidad' && destino.propia;
  if (c.objetivo === OBJETIVO.RIVAL) return destino.tipo === 'unidad' && !destino.propia;
  return true;   // los que afectan al campo entero
}

function soltar(iid, cardId, destino) {
  const c = carta(cardId);

  if (!admite(cardId, destino)) {
    const pista = c.tipo === TIPO.DINOSAURIO ? 'Suelta los dinosaurios en una de tus ranuras libres.'
      : c.tipo === TIPO.CLIMA ? 'Las cartas de clima van a la franja del centro.'
        : c.tipo === TIPO.RECURSO ? 'Las cartas de recurso se sueltan en cualquier parte del campo.'
          : c.objetivo === OBJETIVO.PROPIO ? 'Este evento se suelta sobre un dinosaurio tuyo.'
            : c.objetivo === OBJETIVO.RIVAL ? 'Este evento se suelta sobre un dinosaurio del rival.'
              : 'Suéltala sobre el campo.';
    mensaje(pista, true);
    sonido('error');
    return;
  }

  if (c.tipo === TIPO.DINOSAURIO) {
    if (aplicar({ tipo: ACCION.DESPLEGAR, jugador: JUGADOR, iid, ranura: destino.ranura })) {
      mensaje(`${c.binomial} queda boca abajo en la ranura ${destino.ranura + 1}.`);
      pasoTutorial('desplegada');
    }
    return;
  }
  if (c.tipo === TIPO.RECURSO) {
    const antes = estado.jugadores[JUGADOR].biomasa;
    if (aplicar({ tipo: ACCION.RECURSO, jugador: JUGADOR, iid })) {
      mensaje(`${c.binomial}: Biomasa de ${antes} a ${estado.jugadores[JUGADOR].biomasa}. El rival lo ha visto.`);
    }
    return;
  }
  if (c.tipo === TIPO.CLIMA) {
    if (aplicar({ tipo: ACCION.CLIMA, jugador: JUGADOR, iid })) mensaje(`${c.binomial} preparada.`);
    return;
  }
  if (c.objetivo === OBJETIVO.CLADO) { pedirClado(iid, c); return; }

  const objetivo = c.objetivo === OBJETIVO.CAMPO ? undefined : destino.iid;
  if (aplicar({ tipo: ACCION.EVENTO, jugador: JUGADOR, iid, objetivo })) {
    mensaje(`${c.rasgoNombre} preparado.`);
  }
}

function pedirClado(iid, c) {
  el.eleccionTitulo.textContent = c.binomial;
  el.eleccionTexto.textContent = 'Elige a qué clado rival le aprieta la competencia.';
  el.eleccionCuerpo.innerHTML = Object.values(CLADO).map((clado) => {
    const n = unidadesDe(estado, RIVAL).filter((u) => carta(u.cardId).clado === clado).length;
    return `<button class="opcion" data-clado="${clado}">${CLADO_NOMBRE[clado]}
      <small>${n} en el campo rival</small></button>`;
  }).join('');
  el.eleccion.classList.remove('oculta');

  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-clado]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    if (aplicar({ tipo: ACCION.EVENTO, jugador: JUGADOR, iid, clado: b.dataset.clado })) {
      mensaje(`Competencia sobre los ${CLADO_NOMBRE[b.dataset.clado].toLowerCase()}s.`);
    }
  };
}

// -------------------------------------------------------------- turno y bucle

/**
 * La mano inicial se decide antes de jugar. Se ofrece sola en el turno 1: una
 * mano de la que no puedes pagar nada no es mala suerte, es un turno perdido y
 * el jugador no tenía ninguna manera de evitarlo.
 */
function pintarMulligan() {
  const puede = estado && !validar(estado, { tipo: ACCION.MULLIGAN, jugador: JUGADOR });
  el.mulligan.classList.toggle('oculta', !puede);
  if (!puede) return;
  const jug = estado.jugadores[JUGADOR];
  const cuantas = cartasTrasMulligan(jug);
  el.mulliganTexto.innerHTML = jug.mulligans === 0
    ? `¿Te sirve esta mano? Puedes cambiarla y robar <b>${cuantas}</b> nuevas, sin coste.`
    : `Van ${jug.mulligans}. El siguiente cambio roba <b>${cuantas}</b>: cada cambio cuesta una carta.`;
  el.btnMulligan.textContent = `Cambiar · ${cuantas}`;
}

function turnoDelJugador() {
  irA(APP.PLAYING);
  render(estado);
  pintarMulligan();
  pasoTutorial('turno', { turno: estado.turno });
  el.btnListo.disabled = false;
  const puede = legales(estado, JUGADOR).some((a) => a.tipo !== ACCION.PASAR);
  const bio = estado.jugadores[JUGADOR].biomasa;
  // La renta no es una hucha: cada turno la Biomasa se REEMPLAZA por el número
  // de turno. Verlo sólo como una cifra en el marcador se lee como un fallo de
  // contador, así que el turno se abre diciéndolo.
  mensaje(!puede ? `Sin Biomasa suficiente (${bio}). Pulsa Listo.`
    : estado.turno === 1 ? 'Arrastra cartas al campo. Mantén pulsada una para ver su ficha.'
      : `Cobras ${bio} de Biomasa este turno. No se acumula: lo que no gastes se pierde.`);
}

function jugarIA() {
  let guardia = 0;
  while (!estado.jugadores[RIVAL].listo && guardia++ < 80) {
    const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, perfilIA());
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
  el.mulligan.classList.add('oculta');
  cerrarHojas();
  estado = reduce(estado, { tipo: ACCION.PASAR, jugador: JUGADOR });
  jugarIA();
  await bucle();
}

/**
 * Resumen de lo que el rival ha jugado SOBRE lo tuyo en esta revelación.
 * Devuelve null si no ha jugado nada de eso.
 */
function presionesRivales(nuevos) {
  const textos = nuevos
    .filter((e) => e.tipo === 'PRESION' && e.jugador === RIVAL)
    .map((e) => {
      const c = carta(e.cardId);
      if (e.objetivoCardId) return `${c.rasgoNombre} sobre tu ${carta(e.objetivoCardId).binomial}`;
      if (e.clado) return `${c.rasgoNombre} a tus ${CLADO_NOMBRE[e.clado].toLowerCase()}s`;
      return c.rasgoNombre;
    });
  return textos.length === 0 ? null : `El rival juega ${textos.join(' y ')}.`;
}

/**
 * Para el bucle mientras el jugador lee un cartel del tutorial. El combate se
 * explica justo cuando ocurre, y si sigue corriendo por debajo se explica solo
 * lo que ya no está en pantalla.
 */
async function esperarTutorial() {
  while (tutorialEspera() && app === APP.RESOLVING) await esperar(120);
}

async function bucle() {
  let guardia = 0;
  while (guardia++ < 400) {
    if (estado.fase === FASE.FIN) return finPartida();
    if (estado.fase === FASE.DESPLIEGUE) return turnoDelJugador();

    if (estado.fase === FASE.DESCARTE) {
      if (estado.jugadores[RIVAL].mano.length > BALANCE.manoMaxima) {
        const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, perfilIA());
        rngIA = d.rng;
        estado = reduce(estado, d.accion);
        continue;
      }
      render(estado);
      return pedirDescarte();
    }

    if (estado.fase === FASE.REVELACION) {
      irA(APP.RESOLVING);
      const antes = estado;
      const desdeRev = estado.eventos.length;
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      render(estado);
      // Lo que el rival te ha jugado encima se resuelve aquí y hasta ahora sólo
      // quedaba escrito en el registro: en el tablero eran dos cifras que
      // cambiaban de color. Si te ha metido una presión, se dice.
      mensaje(presionesRivales(estado.eventos.slice(desdeRev)) ?? 'Revelación simultánea…');
      sonido('revelar');
      // Se espera a que terminen los volteos, no un tiempo fijo: con el campo
      // lleno son diez cartas y 700 ms las cortaba por la mitad.
      const volteadas = animarRevelacion(antes, estado);
      await esperar(volteadas > 0 ? 480 + volteadas * 90 : 500);
      pasoTutorial('revelado');
      await esperarTutorial();
      continue;
    }

    if (estado.fase === FASE.COMBATE) {
      irA(APP.RESOLVING);
      const previo = estado;
      const desde = estado.eventos.length;
      estado = reduce(estado, { tipo: ACCION.AVANZAR });
      const nuevos = estado.eventos.slice(desde);
      mensaje('Combate…');
      if (nuevos.some((e) => e.tipo === 'MUERTE')) sonido('muerte');
      await new Promise((r) => animarCombate(previo, estado, nuevos, r));
      pasoTutorial('combate');
      await esperarTutorial();
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

function pedirDescarte() {
  const jug = estado.jugadores[JUGADOR];
  el.eleccionTitulo.textContent = 'Límite de mano';
  el.eleccionTexto.textContent = `Tienes ${jug.mano.length} cartas y el máximo es ${BALANCE.manoMaxima}. Descarta una.`;
  el.eleccionCuerpo.innerHTML = jug.mano.map((iid) => {
    const c = carta(estado.instancias[iid].cardId);
    const dino = c.tipo === TIPO.DINOSAURIO;
    return `<button class="opcion" data-iid="${iid}">${dino ? `<i>${c.binomial}</i>` : c.binomial}
      <small>coste ${c.coste}${dino ? ` · ${c.ataque} de Ataque · ${c.vida} de Vida` : ''}</small></button>`;
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
    : bloques.map((b) => `<div class="log-turno">Turno ${b.turno}</div>`
      + b.lineas.map((l) => `<div class="log-linea ${l.clase}">${l.texto}</div>`).join('')).join('');
  el.log.classList.remove('oculta');
}

// --------------------------------------------------------------------- fin

/**
 * Rendirse: la partida se abandona en la interfaz, no en el motor. Un estado
 * de partida rendida no existe en las reglas y no hacía falta inventarlo —
 * cuenta como derrota en el récord y paga lo que paga una derrota, que es lo
 * único que la rendición tiene que decidir.
 */
function rendirse() {
  cerrarHojas();
  if (tutorialActivo()) terminarTutorial();
  irA(APP.GAME_OVER);
  soltarEntrada();
  cancelarAnimaciones();

  pintarFin({
    via: 'Retirada',
    gane: false,
    titular: 'Derrota',
    frase: 'Abandonas el campo antes de que se decida.',
  });
  anotarResultado(false, estado.turno);
  el.finPremio.textContent = `+${recompensar(false)} dinomonedas`;
  sonido('pierde');
}

/**
 * Pantalla de fin: la vía de victoria arriba en versales, el titular, la frase
 * que lo explica y el resumen en tres cajas. Antes era un párrafo con todo
 * dentro y todo pesaba lo mismo.
 */
function pintarFin({ via, gane, titular, frase }) {
  const [p, r] = estado.jugadores;
  el.finVia.textContent = via;
  el.finTitulo.textContent = titular;
  el.finTitulo.style.color = gane ? 'var(--acento-claro)' : 'var(--rival)';
  el.finDetalle.textContent = frase;
  el.finResumen.innerHTML = [
    ['Turnos', estado.turno],
    ['Trofeos', `${p.trofeos}<span class="sep">–</span>${r.trofeos}`],
    ['Hábitat', `${Math.max(0, p.habitat)}<span class="sep">–</span>${Math.max(0, r.habitat)}`],
  ].map(([et, v]) => `<div class="fin-caja"><b>${v}</b><i>${et}</i></div>`).join('');
}

function preguntarRendicion() {
  el.eleccionTitulo.textContent = '¿Abandonar la partida?';
  el.eleccionTexto.textContent = 'Cuenta como derrota en tu récord y cobra la recompensa de derrota.';
  el.eleccionCuerpo.innerHTML = `
    <button class="opcion" data-rendirse="si">Rendirse<small>La partida termina aquí.</small></button>
    <button class="opcion" data-rendirse="no">Seguir jugando<small>Vuelve al tablero.</small></button>`;
  el.eleccion.classList.remove('oculta');
  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-rendirse]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    if (b.dataset.rendirse === 'si') rendirse();
  };
}

function finPartida() {
  irA(APP.GAME_OVER);
  soltarEntrada();
  cancelarAnimaciones();
  if (tutorialActivo()) terminarTutorial();

  const gane = estado.ganador === JUGADOR;
  const via = {
    [MOTIVO_FIN.TROFEOS]: 'Registro fósil completo',
    [MOTIVO_FIN.HABITAT]: 'Colapso del hábitat',
    [MOTIVO_FIN.EXTINCION]: 'Extinción',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'Límite de turnos',
  }[estado.motivoFin] ?? '';
  const frase = {
    [MOTIVO_FIN.TROFEOS]: gane
      ? 'Tu población dejó más fósiles que la rival.'
      : 'El registro fósil se llenó de los tuyos.',
    [MOTIVO_FIN.HABITAT]: gane
      ? 'El hábitat rival cedió antes que el tuyo.'
      : 'Tu hábitat cedió antes que el suyo.',
    [MOTIVO_FIN.EXTINCION]: gane
      ? 'Al rival no le quedaban cartas que robar.'
      : 'Te quedaste sin cartas que robar.',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'Se acabaron los turnos sin decidirse.',
  }[estado.motivoFin] ?? '';

  pintarFin({ via, gane, titular: gane ? 'Victoria' : 'Derrota', frase });
  anotarResultado(gane, estado.turno);
  el.finPremio.textContent = `+${recompensar(gane)} dinomonedas`;
  sonido(gane ? 'gana' : 'pierde');
}

// ------------------------------------------------------------------ arranque

function nuevaPartida() {
  cancelarAnimaciones();
  soltarEntrada();
  registro = [];
  // La primera partida de todas se juega con el tutorial encima. Después no
  // vuelve a aparecer solo: está en el menú.
  if (!tutorialHecho() && !leerRecord()) empezarTutorial();

  const s = Number(params.get('seed')) || (Date.now() & 0x7fffffff);
  // Tú llevas tu mazo; la IA lleva el de referencia, que es el que mide el
  // simulador. Así el balance publicado sigue significando algo.
  estado = crearPartida(s, [aListaDeMazo(mazoActivo()), null]);
  rngIA = semilla(s ^ 0x5bf03635);

  irA(APP.PLAYING);
  render(estado);
  if (tutorialActivo()) pasoTutorial('inicio');
  tomarEntrada({
    interactivo,
    admite,
    soltar,
    ficha: (cardId) => abrirFicha(fichaHTML(cardId)),
  });
  bucle();
}

/**
 * El rival blando existía desde V2-2 pero sólo se llegaba a él escribiendo
 * `?ia=aleatoria` en la barra de direcciones, que es tanto como no existir.
 * La IA heurística no se ha tocado: lo que cambia es cuál de las dos juega.
 */
function pintarDificultad() {
  const actual = perfilIA();
  el.dificultad.innerHTML = [
    [PERFIL.ALEATORIA, 'Fácil'],
    [PERFIL.HEURISTICA, 'Normal'],
  ].map(([id, n]) => `<button class="chip ${id === actual ? 'on' : ''}" data-ia="${id}">${n}</button>`).join('');
  el.dificultad.classList.toggle('fijada', !!IA_FORZADA);
}

function pintarDebug() {
  if (!DEBUG || !estado) return;
  el.debug.textContent = [
    `app   ${app}`,
    `fase  ${estado.fase}  turno ${estado.turno}`,
    `IA    ${perfilIA()} · mano ${estado.jugadores[RIVAL].mano.length}`,
    `trof  tú ${estado.jugadores[0].trofeos} · rival ${estado.jugadores[1].trofeos}`,
    `habitat tú ${estado.jugadores[0].habitat} · rival ${estado.jugadores[1].habitat}`,
    `seed  ${estado.seed}`,
  ].join('\n');
}

function bucleDebug() {
  pintarDebug();
  rafDebug = requestAnimationFrame(bucleDebug);
}

function iniciar() {
  montar();
  montarTutorial();
  // Las ilustraciones son opcionales: si están servidas se repinta con ellas,
  // si no, se juega con las siluetas y nadie ve un hueco.
  vigilarFotos();
  detectarFotos(() => { if (estado) render(estado); }).then(calentarFotos);
  pintarRecord();
  irA(APP.MENU);

  montarMeta(() => irA(APP.MENU));

  el.btnJugar.addEventListener('click', () => { desbloquear(); nuevaPartida(); });
  el.btnColeccion.addEventListener('click', () => { abrirColeccion(); irA(APP.COLECCION); });
  el.btnSobres.addEventListener('click', () => { abrirSobres(); irA(APP.SOBRES); });
  el.btnMazos.addEventListener('click', () => { abrirMazos(); irA(APP.MAZOS); });
  el.btnOtra.addEventListener('click', () => { pintarRecord(); nuevaPartida(); });
  // Terminar una partida no obligaba a jugar otra, pero lo parecía: no había
  // más salida que «Otra partida».
  el.btnFinMenu.addEventListener('click', () => {
    estado = null;
    pintarRecord();
    pintarMenu();
    irA(APP.MENU);
  });
  el.btnRendirse.addEventListener('click', preguntarRendicion);

  el.btnQuedarse.addEventListener('click', () => { el.mulligan.classList.add('oculta'); });
  el.btnMulligan.addEventListener('click', () => {
    if (!interactivo()) return;
    const antes = estado.jugadores[JUGADOR].mano.length;
    if (!aplicar({ tipo: ACCION.MULLIGAN, jugador: JUGADOR })) return;
    const ahora = estado.jugadores[JUGADOR].mano.length;
    mensaje(`Mano nueva: ${ahora} cartas${ahora < antes ? ` (una menos que antes)` : ''}.`);
    pintarMulligan();
  });

  pintarDificultad();
  el.dificultad.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ia]');
    if (!b) return;
    actualizarPerfil({ dificultad: b.dataset.ia });
    pintarDificultad();
  });

  // Marcha atrás del despliegue. Sin esto, soltar una carta en la ranura
  // equivocada costaba el turno entero y la Biomasa.
  el.franjaMias.addEventListener('click', () => { if (estado) abrirComprometidas(estado); });
  el.comprometidasCerrar.addEventListener('click', cerrarHojas);
  el.comprometidasCuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-retirar]');
    if (!b || !interactivo()) return;
    const iid = Number(b.dataset.retirar);
    const c = carta(estado.instancias[iid].cardId);
    if (aplicar({ tipo: ACCION.RETIRAR, jugador: JUGADOR, iid })) {
      mensaje(`${c.binomial} vuelve a tu mano.`);
      if (estado.jugadores[JUGADOR].pendientes.length === 0) cerrarHojas();
      else abrirComprometidas(estado);
    }
  });
  el.btnListo.addEventListener('click', alPulsarListo);
  el.btnLog.addEventListener('click', abrirLog);
  el.logCerrar.addEventListener('click', cerrarHojas);
  el.descarteCerrar.addEventListener('click', cerrarHojas);
  el.rDescBtn.addEventListener('click', () => { if (estado) abrirDescarte(estado, RIVAL); });
  el.pDescBtn.addEventListener('click', () => { if (estado) abrirDescarte(estado, JUGADOR); });
  el.descarteCuerpo.addEventListener('click', (e) => {
    const f = e.target.closest('[data-card]');
    if (f) abrirFicha(fichaHTML(f.dataset.card));
  });
  el.fichaCerrar.addEventListener('click', cerrarHojas);

  // Ampliar una carta: desde la ficha, y la ficha se abre desde el tablero, la
  // colección, el descarte y el editor de mazos, así que con un sitio basta.
  el.fichaCuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    // La miniatura abre lo que enseña —la ilustración— y el botón la carta.
    if (b) abrirVisor(b.dataset.zoom, b.dataset.modo ?? 'carta');
  });
  el.visorModos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-modo]');
    if (b) cambiarModoVisor(b.dataset.modo);
  });
  el.visorCerrar.addEventListener('click', cerrarVisor);
  // Tocar fuera cierra: el visor tapa la pantalla entera y no hay otra salida
  // evidente en un móvil. Fuera es todo menos la carta, la ilustración y el pie
  // —el lienzo ocupa el hueco entero, así que también cuenta como fondo.
  el.visor.addEventListener('click', (e) => {
    if (e.target === el.visor || e.target === el.visorLienzo
        || e.target.classList.contains('visor-marco')) cerrarVisor();
  });
  el.ayudaCerrar.addEventListener('click', cerrarHojas);
  el.eleccionCerrar.addEventListener('click', () => {
    // Cancelar sólo es legal cuando la elección no bloquea el turno.
    if (estado?.fase !== FASE.DESCARTE) { el.eleccion.classList.add('oculta'); el.eleccionCuerpo.onclick = null; }
  });

  const abrirAyuda = () => { el.ayudaCuerpo.innerHTML = ayudaHTML(); el.ayuda.classList.remove('oculta'); };
  el.btnAyuda.addEventListener('click', abrirAyuda);
  el.btnAyudaMenu.addEventListener('click', abrirAyuda);
  el.btnTutorial.addEventListener('click', () => {
    desbloquear();
    empezarTutorial();
    nuevaPartida();
  });

  el.btnMute.classList.toggle('off', estaSilenciado());
  el.btnMute.addEventListener('click', () => {
    desbloquear();
    el.btnMute.classList.toggle('off', alternarMute());
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelarAnimaciones();
      if (estado && app === APP.RESOLVING) render(estado);
    }
  });

  if (DEBUG) { el.debug.classList.remove('oculta'); bucleDebug(); }
}

/**
 * Instalable y jugable sin conexión. Falla en silencio a propósito: servido
 * desde file:// o en un navegador sin service workers, el juego funciona igual
 * —no hay nada del otro lado— y no tiene sentido molestar con un error.
 */
function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* se juega igual */ });
  });
}

registrarServiceWorker();

window.addEventListener('pagehide', () => {
  cancelarAnimaciones();
  cancelAnimationFrame(rafDebug);
  cerrarAudio();
});

iniciar();
