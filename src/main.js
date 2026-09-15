// DinoWar — arranque, máquina de estados y pegamento entre motor e interfaz.
// La interfaz sólo LEE el estado; toda mutación pasa por reduce().

import { BALANCE, MAZO } from './data/balance.js';
import { TIPO, OBJETIVO, CLADO, CLADO_NOMBRE, RAREZA, carta } from './data/cards.js';
import {
  crearPartida, vistaDe, FASE, MOTIVO_FIN, unidadesDe, buscablesDe, buscaEnElMazo,
  vidaActual, puedeReciclar, mecanicaDe,
} from './engine/state.js';
import { reduce, ACCION, legales, validar, cartasTrasMulligan } from './engine/actions.js';
import { decidir, PERFIL } from './engine/ai.js';
import { semilla } from './engine/rng.js';
import {
  montar, render, mensaje, el, JUGADOR, RIVAL,
  fichaHTML, ayudaHTML, abrirFicha, montarFicha, abrirDescarte, cerrarHojas,
  abrirVisor, cambiarModoVisor, cerrarVisor, abrirComprometidas, cartaHTML, fijarTopesHabitat,
} from './ui/render.js';
import { tomarEntrada, soltarEntrada } from './ui/input.js';
import * as reloj from './ui/reloj.js';
import {
  montarTutorial, empezarTutorial, terminarTutorial, tutorialHecho, tutorialActivo,
  tutorialEspera, pasoTutorial,
} from './ui/tutorial.js';
import { detectarFotos, detectarEnteras, vigilarFotos, calentarFotos } from './ui/art.js';
import {
  montarMeta, abrirColeccion, abrirSobres, abrirMazos, pintarMenu, recompensar,
  refrescarAvisos,
  refrescarMisiones, pintarMisiones,
} from './ui/meta.js';
import { mazoActivo, cargarPerfil, actualizarPerfil } from './ui/almacen.js';
import { montarCuenca, abrirCuenca, pintarCuenca } from './ui/cuenca.js';
import { montarCuenta, abrirCuenta, resumenDeCuenta } from './ui/cuenta.js';
import { montarEntrada, abrirEntrada } from './ui/entrada.js';
import { montarExpedicion, abrirExpedicion } from './ui/expedicion.js';
import { rivalPorId } from './data/expediciones.js';
import {
  montarDuelo, enseñarDuelo, pintarDuelo, abandonarEspera,
  jugarEnDuelo, estadoDuelo, rendirseEnDuelo,
} from './ui/duelo.js';
import { DUELO } from './data/duelo.js';
import { rangoDe, nombreDeRango, emblemaDe } from './data/ligas.js';
import { estaDentro } from './ui/supabase.js';
import { sincronizar, modoPerfil, MODO as MODO_PERFIL } from './ui/perfil.js';
import { asaltar, estadoDeTribu, entrar as entrarEnLaCuenca } from './ui/red.js';
import { danoDeAsalto, habitatDeAsalto, puedeAsaltar } from './data/tribu.js';
import { jefeActivo } from './data/eventos.js';
import { aListaDeMazo, ECONOMIA } from './data/coleccion.js';
import {
  animarCombate, animarRevelacion, animarEventos, cancelarAnimaciones, esperar, lineasDeLog,
  revelarRetenida,
} from './ui/animate.js';
import { invocar } from './ui/efectos.js';
import { rotularFin, marcadorHTML, ARTE_LISTO as ARTE_DEL_FIN } from './ui/fin.js';
import { emblemaDe as emblemaDeMazo, portadaDe as portadaDeMazo } from './ui/mazos.js';
import { presentarPartida, PRESENTACION_DUELO } from './ui/presentacion.js';
import { desbloquear, alternarMute, estaSilenciado, sonido, cerrarAudio, musica, precargarMusica, enSegundoPlano } from './ui/audio.js';
import { montarTacto } from './ui/tacto.js';
import { arte } from './ui/art.js';
import { mostrarMarca, empezarCarga, precargarPiezas } from './ui/carga.js';
import { pedirMazoInicial } from './ui/iniciales.js';
import { montarInstalar } from './ui/instalar.js';
import { abrirTienda, aplicarRival, limpiarRival, traerEquipadoRival } from './ui/tienda.js';

const APP = Object.freeze({
  BOOT: 'BOOT', MARCA: 'MARCA', CARGA: 'CARGA',
  MENU: 'MENU', JUGAR: 'JUGAR', PLAYING: 'PLAYING', RESOLVING: 'RESOLVING',
  GAME_OVER: 'GAME_OVER',
  COLECCION: 'COLECCION', SOBRES: 'SOBRES', MAZOS: 'MAZOS', CUENCA: 'CUENCA',
  CUENTA: 'CUENTA', ENTRADA: 'ENTRADA', EXPEDICION: 'EXPEDICION', INICIALES: 'INICIALES',
  TIENDA: 'TIENDA',
});

const params = new URLSearchParams(location.search);
const DEBUG = params.get('debug') === '1';
// El parámetro de la URL sigue mandando —es lo que usan las pruebas—. En el
// juego la dificultad ya no tiene botón: la da el nodo del mapa de expedición.
const IA_FORZADA = params.get('ia');
const perfilIA = () => IA_FORZADA ?? (cargarPerfil().dificultad ?? PERFIL.HEURISTICA);
/**
 * El rival de expedición de la partida en curso, o null. Mientras existe, la
 * IA juega con SU perfil y SU mazo: la dificultad ya no la elige un botón, la
 * da el nodo del mapa.
 */
let expedicionEnCurso = null;
let ultimaFueExpedicion = false;
const perfilRival = () => expedicionEnCurso?.perfil ?? perfilIA();
/**
 * Quién está enfrente, para el marcador del final: nombre y mazo. Se apunta al
 * EMPEZAR porque al terminar ya no queda de dónde sacarlo —el asalto suelta su
 * jefe y el duelo se pone a null antes de pintar—. El mazo de un duelo es
 * secreto y va a null: el rival sale sin emblema.
 */
let rivalDePartida = { nombre: 'Rival', mazo: MAZO };
/**
 * Cuenta los finales. El rótulo tarda en irse y, si mientras tanto empieza
 * otra partida, el final viejo no puede llevarse la pantalla nueva.
 */
let finVigente = 0;
/**
 * Cuenta las partidas que empiezan. La presentación tarda en irse y, si
 * mientras tanto empieza otra —«Otra partida» dos veces, un duelo que
 * empareja—, la vieja no puede arrancar su reloj ni su bucle sobre la nueva.
 */
let partidaVigente = 0;

/** Un bando de la presentación: nombre, subtítulo, retrato y emblema. */
function bandoPresentado(nombre, subtitulo, retratoId, mazo) {
  const mapa = mazo ? (Array.isArray(mazo) ? Object.fromEntries(mazo) : mazo) : null;
  const retrato = retratoId ?? (mapa ? portadaDeMazo(mapa) : null);
  return {
    nombre,
    subtitulo,
    retrato: retrato ? arte(retrato) : '',
    emblema: mapa ? (emblemaDeMazo(mapa)?.clave ?? null) : null,
  };
}

/** Tú, para la presentación: tu nombre, tu liga y tu mazo activo. */
function yoPresentado() {
  const p = cargarPerfil();
  return bandoPresentado(p.apodo || 'Tú', nombreDeRango(Number(p.elo ?? 1200)), null, mazoActivo());
}

/**
 * La presentación, o nada. En la primera partida manda el tutorial, que ya
 * tiene bastante que enseñar encima del tablero.
 */
function presentar(datos, dura) {
  if (tutorialActivo()) return Promise.resolve();
  return presentarPartida({ raiz: el.partida, dura, ...datos });
}

let app = APP.BOOT;
let estado = null;
let rngIA = 0;
/**
 * El duelo en curso, o null si la partida es contra la IA. Mientras existe,
 * cada jugada va al servidor y el estado que se pinta es el que él devuelve.
 */
let duelo = null;
let ultimaFueDuelo = false;
/**
 * Si la partida que acaba de terminar era un asalto. Lo mira «Otra partida»:
 * el jefe lleva el triple de hábitat y su mazo, así que repetir contra la IA
 * no es «otra» de lo mismo.
 */
let ultimaFueAsalto = false;
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
/**
 * Lo que pasa justo después de entrar, y también al arrancar con sesión ya
 * guardada. Es el único camino al menú.
 *
 * El orden importa y no es casual: `entrar()` es quien CREA la fila del jugador
 * —y con ella siembra la colección de salida y fija el nombre— así que pedir el
 * perfil antes devolvería «no has entrado». Y el nombre sólo viaja aquí, en el
 * alta: ponerlo después gastaría el único cambio que se permite.
 *
 * Si algo de esto falla no se entra al juego a medias: se vuelve a la puerta
 * con el motivo. Un menú que enseña 0 dinomonedas porque el perfil no llegó es
 * peor que una pantalla que dice qué ha pasado.
 */
/** Lo que la pantalla de carga descarga antes de enseñar el menú. */
const PIEZAS_DEL_MENU = [
  'assets/piel/portada.webp', 'assets/piel/boton_ancho.webp',
  'assets/piel/placa_coleccion.webp', 'assets/piel/placa_sobres.webp', 'assets/piel/placa_mazos.webp',
  'assets/piel/placa_cuenca.webp', 'assets/piel/placa_cuenta.webp',
  'assets/piel/placa_tienda.webp',
];

/**
 * Entra en la cuenta y trae el perfil, con la pantalla de carga delante.
 *
 * El trabajo arranca ENSEGUIDA y la pantalla se enseña cuando la marca se va:
 * si se esperase a la marca para empezar, serían dos esperas puestas en fila.
 * Así, cuando la carga aparece, la barra ya lleva lo que se haya hecho.
 *
 * Si algo falla se vuelve a la puerta ANTES de relanzar: quien llamó —el
 * arranque o el formulario de entrada— pinta el motivo en ella, y para eso
 * tiene que estar a la vista.
 *
 * @param {string|null} nombre  el nombre elegido al crear la cuenta
 * @param {Promise|null} marca  la marca en pantalla, si hay que esperarla
 */
async function presentarse(nombre, marca = null) {
  const carga = empezarCarga(3);
  const trabajo = (async () => {
    await precargarPiezas(PIEZAS_DEL_MENU);
    carga.avanzar();
    await entrarEnLaCuenca(nombre);
    carga.avanzar();
    const p = await sincronizar();
    if (!p || modoPerfil() !== MODO_PERFIL.REMOTO) {
      throw new Error('no se pudo traer tu perfil del servidor');
    }
    carga.avanzar();
    return p;
  })();
  // Si falla mientras la marca sigue en pantalla, nadie lo ha esperado aún y
  // el navegador lo apunta como rechazo sin dueño. El `await` de abajo sí lo
  // recoge; esto sólo evita el aviso.
  trabajo.catch(() => {});

  if (marca) await marca;
  irA(APP.CARGA);
  carga.enPantalla();
  let p;
  try {
    p = await trabajo;
  } catch (e) {
    carga.cancelar();
    irA(APP.ENTRADA);
    throw e;
  }
  await carga.terminar();
  // Una cuenta recién creada llega sin colección: primero elige su mazo
  // inicial y sólo entonces hay menú que enseñar. Pasa también si se creó y se
  // cerró antes de elegir, porque lo que manda es lo que dice el servidor.
  if (p.sembrado === false) {
    irA(APP.INICIALES);
    await pedirMazoInicial(document.getElementById('iniciales'));
  }
  pintarMenu();
  pintarCuentaEnMenu();
  pintarRecord();
  irA(APP.MENU);
  return p;
}

/** La línea del menú que dice quién eres. */
function pintarCuentaEnMenu() {
  if (el.menuCuenta) el.menuCuenta.textContent = resumenDeCuenta();
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

/**
 * Abre la pantalla de jugar. Las misiones se piden AQUÍ y no al arrancar: es
 * donde se ven, y pedirlas en el arranque era una llamada más delante de la
 * puerta para pintar algo que estaba tres pantallas más allá.
 *
 * El panel nace cerrado cada vez. Dejarlo abierto de la visita anterior haría
 * que la pantalla cambiara de alto sola entre una entrada y la siguiente.
 */
function abrirJugar() {
  el.btnMisiones.setAttribute('aria-expanded', 'false');
  enseñarMisiones(false);
  el.btnDuelo.setAttribute('aria-expanded', 'false');
  enseñarDuelo(false);
  refrescarMisiones();
  irA(APP.JUGAR);
}

/** Despliega o pliega el panel de misiones de la pantalla de jugar. */
function enseñarMisiones(abierto) {
  el.jugar.classList.toggle('misiones-abiertas', abierto);
  pintarMisiones(abierto);
}

/**
 * Qué música lleva cada pantalla. Las de la colección, los sobres y los mazos
 * son el menú: se entra y se sale de ellas sin que el fondo cambie, que
 * cambiarlo a cada placa sonaría a zapping. El final de partida va en silencio
 * porque ahí suena el remate de victoria o derrota. La marca también: la
 * música empieza con la CARGA, en cuanto se va la marca, y sigue por la
 * puerta y el menú sin cortarse.
 */
const MUSICA_DE = {
  [APP.CARGA]: 'musica-menu', [APP.ENTRADA]: 'musica-menu',
  [APP.MENU]: 'musica-menu', [APP.JUGAR]: 'musica-menu', [APP.EXPEDICION]: 'musica-menu',
  [APP.COLECCION]: 'musica-menu', [APP.SOBRES]: 'musica-menu',
  [APP.MAZOS]: 'musica-menu', [APP.CUENTA]: 'musica-menu', [APP.INICIALES]: 'musica-menu',
  [APP.TIENDA]: 'musica-menu',
  [APP.CUENCA]: 'musica-cuenca',
  [APP.PLAYING]: 'musica-partida', [APP.RESOLVING]: 'musica-partida',
};

function irA(nuevo) {
  app = nuevo;
  musica(MUSICA_DE[nuevo] ?? null);
  el.marca.classList.toggle('oculta', nuevo !== APP.MARCA);
  el.carga.classList.toggle('oculta', nuevo !== APP.CARGA);
  el.menu.classList.toggle('oculta', nuevo !== APP.MENU);
  el.jugar.classList.toggle('oculta', nuevo !== APP.JUGAR);
  document.getElementById('expedicion').classList.toggle('oculta', nuevo !== APP.EXPEDICION);
  el.partida.classList.toggle('oculta', nuevo !== APP.PLAYING && nuevo !== APP.RESOLVING);
  el.fin.classList.toggle('oculta', nuevo !== APP.GAME_OVER);
  el.coleccion.classList.toggle('oculta', nuevo !== APP.COLECCION);
  el.sobres.classList.toggle('oculta', nuevo !== APP.SOBRES);
  el.mazos.classList.toggle('oculta', nuevo !== APP.MAZOS);
  el.cuenca.classList.toggle('oculta', nuevo !== APP.CUENCA);
  el.cuenta.classList.toggle('oculta', nuevo !== APP.CUENTA);
  el.entrada.classList.toggle('oculta', nuevo !== APP.ENTRADA);
  document.getElementById('iniciales').classList.toggle('oculta', nuevo !== APP.INICIALES);
  document.getElementById('tienda').classList.toggle('oculta', nuevo !== APP.TIENDA);
}

const interactivo = () => app === APP.PLAYING && estado?.fase === FASE.DESPLIEGUE;

function aplicar(accion) {
  if (duelo) return aplicarEnDuelo(accion);
  const motivo = validar(estado, accion);
  if (motivo) { mensaje(motivo, true); sonido('error'); return false; }
  grabar(accion);
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

  // La pila del mazo acepta CUALQUIER carta, pero sólo con la Llanura puesta y
  // una vez por turno: quien decide es el motor, aquí sólo se pregunta.
  if (destino.tipo === 'mazo') return puedeReciclar(estado, JUGADOR);

  if (c.tipo === TIPO.DINOSAURIO) {
    return destino.tipo === 'ranura' && destino.bando === JUGADOR && destino.libre;
  }
  // La franja es la ranura del clima y sólo eso. Antes cualquier carta sin
  // objetivo se podía soltar ahí —Mortandad, Trampa, los recursos— y parecía
  // que la estabas poniendo de clima, cuando lo que hacía era resolverse y
  // marcharse al descarte.
  if (c.tipo === TIPO.CLIMA) return destino.tipo === 'franja';
  if (destino.tipo === 'franja') return false;
  if (c.tipo === TIPO.RECURSO) return true;   // se sueltan en cualquier parte del campo
  if (c.tipo === TIPO.BIOMASA) return true;   // igual que un recurso: da y se va
  if (c.objetivo === OBJETIVO.PROPIO) return destino.tipo === 'unidad' && destino.propia;
  if (c.objetivo === OBJETIVO.RIVAL) return destino.tipo === 'unidad' && !destino.propia;
  return true;   // los que caen sobre la mesa entera
}

function soltar(iid, cardId, destino) {
  const c = carta(cardId);

  if (destino.tipo === 'mazo') {
    if (aplicar({ tipo: ACCION.RECICLAR, jugador: JUGADOR, iid })) {
      mensaje(`${c.binomial} vuelve al fondo de tu mazo.`);
    }
    return;
  }


  if (!admite(cardId, destino)) {
    const pista = c.tipo === TIPO.DINOSAURIO ? 'Suelta los dinosaurios en una de tus ranuras libres.'
      : c.tipo === TIPO.CLIMA ? 'Los climas van a la ranura de Clima, la franja del centro.'
        : destino?.tipo === 'franja' ? 'Esa franja es sólo para los climas. Suéltala en el campo.'
          : c.tipo === TIPO.BIOMASA ? 'La Biomasa se suelta en el campo, fuera de la franja del clima.'
            : c.tipo === TIPO.RECURSO ? 'Las cartas de recurso se sueltan en cualquier parte del campo.'
            : c.objetivo === OBJETIVO.PROPIO ? 'Este evento se suelta sobre un dinosaurio tuyo.'
              : c.objetivo === OBJETIVO.RIVAL ? 'Este evento se suelta sobre un dinosaurio del rival.'
                : 'Suéltala sobre el campo, fuera de la franja del clima.';
    mensaje(pista, true);
    sonido('error');
    return;
  }

  if (c.tipo === TIPO.DINOSAURIO) {
    // El coste añadido va PRIMERO: si no puedes pagarlo la carta no se juega, y
    // preguntar qué buscas para después decirte que no llega es peor que no
    // preguntar.
    const extra = mecanicaDe(cardId)?.costeExtra;
    if (extra?.descartar) { pedirDescartes(iid, c, destino.ranura, extra.descartar); return; }
    if (buscaEnElMazo(cardId)) { pedirBusqueda(iid, c, destino.ranura); return; }
    desplegar(iid, c, destino.ranura);
    return;
  }
  if (c.tipo === TIPO.RECURSO) {
    const antes = estado.jugadores[JUGADOR].biomasa;
    if (aplicar({ tipo: ACCION.RECURSO, jugador: JUGADOR, iid })) {
      mensaje(`${c.binomial}: Biomasa de ${antes} a ${estado.jugadores[JUGADOR].biomasa}. El rival lo ha visto.`);
    }
    return;
  }
  if (c.tipo === TIPO.BIOMASA) {
    // El mensaje dice las DOS cosas. La Biomasa se ve subir en el marcador,
    // pero el mazo baja en silencio, y una carta que te cuesta algo tiene que
    // decir qué te costó o parece gratis.
    const antes = estado.jugadores[JUGADOR].biomasa;
    if (aplicar({ tipo: ACCION.BIOMASA, jugador: JUGADOR, iid })) {
      const jug = estado.jugadores[JUGADOR];
      mensaje(`${c.binomial}: Biomasa de ${antes} a ${jug.biomasa}.`
        + ` Tu mazo baja a ${jug.mazo.length}.`);
    }
    return;
  }
  if (c.tipo === TIPO.CLIMA) {
    if (aplicar({ tipo: ACCION.CLIMA, jugador: JUGADOR, iid })) mensaje(`${c.binomial} preparada.`);
    return;
  }
  if (c.objetivo === OBJETIVO.CLADO) { pedirClado(iid, c); return; }
  if (c.objetivo === OBJETIVO.RIVALES) { pedirRivales(iid, c); return; }

  const objetivo = c.objetivo === OBJETIVO.NINGUNO ? undefined : destino.iid;
  if (aplicar({ tipo: ACCION.EVENTO, jugador: JUGADOR, iid, objetivo })) {
    mensaje(`${c.rasgoNombre} preparado.`);
  }
}

function desplegar(iid, c, ranura, busca = null, descartes = undefined) {
  if (!aplicar({ tipo: ACCION.DESPLEGAR, jugador: JUGADOR, iid, ranura, busca, descartes })) return;
  const traido = busca === null ? '' : ` Te llevas ${carta(estado.instancias[busca].cardId).binomial} a la mano.`;
  const pagado = descartes ? ` Sueltas ${descartes.length} cartas.` : '';
  mensaje(`${c.binomial} queda boca abajo en la ranura ${ranura + 1}.${traido}${pagado}`);
  pasoTutorial('desplegada');
}

/**
 * El coste añadido: hay cartas que además de Biomasa piden cartas de la mano. Se
 * eligen a mano y no las coge el juego por ti, porque cuál sueltas ES la
 * decisión — la IA se queda con las más baratas, pero un jugador puede estar
 * guardando una para el turno siguiente.
 */
function pedirDescartes(iid, c, ranura, cuantas) {
  const mano = estado.jugadores[JUGADOR].mano.filter((x) => x !== iid);
  if (mano.length < cuantas) {
    mensaje(`${c.binomial} pide descartar ${cuantas} cartas y no te quedan tantas.`, true);
    sonido('error');
    return;
  }

  const elegidas = new Set();
  el.eleccionTitulo.textContent = c.rasgoNombre;
  const pintar = () => {
    el.eleccionTexto.textContent = `${c.binomial} pide ${cuantas} cartas de tu mano.`
      + ` Llevas ${elegidas.size}.`;
    el.eleccionCuerpo.innerHTML = mano.map((mid) => {
      const mc = carta(estado.instancias[mid].cardId);
      const puesta = elegidas.has(mid);
      return `<button class="opcion${puesta ? ' marcada' : ''}" data-suelta="${mid}">
        ${mc.binomial}<small>coste ${mc.coste}</small></button>`;
    }).join('');
  };
  pintar();
  el.eleccion.classList.remove('oculta');

  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-suelta]');
    if (!b) return;
    const mid = Number(b.dataset.suelta);
    if (elegidas.has(mid)) elegidas.delete(mid); else elegidas.add(mid);
    if (elegidas.size < cuantas) { pintar(); return; }

    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    const descartes = [...elegidas];
    if (buscaEnElMazo(c.id)) { pedirBusqueda(iid, c, ranura, descartes); return; }
    desplegar(iid, c, ranura, null, descartes);
  };
}

/**
 * Los buscadores eligen AL JUGARSE, no al revelarse: el despliegue va a ciegas
 * y parar la revelación para preguntar le diría al rival que has buscado algo.
 * Como se elige del propio mazo, enseñarlo entero no filtra nada.
 */
function pedirBusqueda(iid, c, ranura, descartes = undefined) {
  const opciones = buscablesDe(estado, JUGADOR, c.id);
  if (opciones.length === 0) {
    desplegar(iid, c, ranura, null, descartes);
    mensaje(`${c.binomial} no encuentra nada que buscar en tu mazo.`, true);
    return;
  }

  el.eleccionTitulo.textContent = c.rasgoNombre;
  el.eleccionTexto.textContent = `${c.binomial} se despliega y te lleva una carta del mazo a la mano.`;
  // Las copias de la misma carta se agrupan: da igual cuál de los tres
  // Gregarismos del mazo te lleves, y tres renglones idénticos sólo estorban.
  // Y se ordena por nombre, no por posición: enseñar el orden del mazo sería
  // decirle al jugador qué va a robar después.
  const porCarta = new Map();
  for (const bid of opciones) {
    const cid = estado.instancias[bid].cardId;
    if (porCarta.has(cid)) porCarta.get(cid).copias += 1;
    else porCarta.set(cid, { bid, copias: 1, c: carta(cid) });
  }
  const vistas = [...porCarta.values()].sort((a, b) => a.c.binomial.localeCompare(b.c.binomial, 'es'));
  el.eleccionCuerpo.innerHTML = vistas.map(({ bid, copias, c: bc }) => `
    <button class="opcion" data-busca="${bid}">${bc.binomial}${copias > 1 ? ` ×${copias}` : ''}
      <small>coste ${bc.coste} · ${bc.rasgoTexto}</small></button>`).join('');
  el.eleccion.classList.remove('oculta');

  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-busca]');
    if (!b) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    desplegar(iid, c, ranura, Number(b.dataset.busca), descartes);
  };
}

/**
 * Competencia trófica señala a dos rivales, uno a uno. Se marcan en la lista y
 * el botón sólo se enciende cuando hay al menos uno: si al rival le queda un
 * solo dinosaurio en pie, la carta se juega igual sobre ése.
 */
function pedirRivales(iid, c) {
  const tope = BALANCE.rasgos.competenciaObjetivos;
  const enPie = unidadesDe(estado, RIVAL);
  if (enPie.length === 0) {
    mensaje('El rival no tiene dinosaurios en el campo a los que apretar.', true);
    sonido('error');
    return;
  }

  const elegidos = new Set();
  el.eleccionTitulo.textContent = c.binomial;
  const pintar = () => {
    el.eleccionTexto.textContent = elegidos.size === 0
      ? `Señala hasta ${tope} dinosaurios del rival.`
      : `${elegidos.size} de ${tope} señalados. Pulsa Aplicar cuando quieras.`;
    el.eleccionCuerpo.innerHTML = enPie.map((u) => {
      const uc = carta(u.cardId);
      const puesto = elegidos.has(u.iid);
      return `<button class="opcion${puesto ? ' marcada' : ''}" data-rival="${u.iid}">
        ${uc.binomial}<small>ranura ${u.ranura + 1} · Vida ${vidaActual(estado, u.iid)}</small></button>`;
    }).join('')
      + `<button class="opcion aplicar" data-aplicar="1"${elegidos.size ? '' : ' disabled'}>Aplicar</button>`;
  };
  pintar();
  el.eleccion.classList.remove('oculta');

  el.eleccionCuerpo.onclick = (e) => {
    const b = e.target.closest('[data-rival]');
    if (b) {
      const id = Number(b.dataset.rival);
      if (elegidos.has(id)) elegidos.delete(id);
      else if (elegidos.size < tope) elegidos.add(id);
      pintar();
      return;
    }
    if (!e.target.closest('[data-aplicar]') || elegidos.size === 0) return;
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    if (aplicar({ tipo: ACCION.EVENTO, jugador: JUGADOR, iid, objetivos: [...elegidos] })) {
      mensaje(`Competencia trófica sobre ${elegidos.size} rival${elegidos.size === 1 ? '' : 'es'}.`);
    }
  };
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
  mensaje(!puede ? `Sin Biomasa suficiente (${bio}). Pulsa Listo y se te guarda para el turno que viene.`
    : estado.turno === 1 ? 'Arrastra cartas al campo. Mantén pulsada una para ver su ficha.'
      : `Tienes ${bio} de Biomasa. Lo que no gastes se guarda.`);

  // El reloj sólo corre mientras te toca decidir a ti: ni las animaciones ni
  // el turno de la máquina te cuestan tiempo.
  reloj.correr(JUGADOR);
}

/**
 * Los dos marcadores, uno por bando. Se enseñan los dos siempre porque un
 * reloj sin el del contrario no dice nada: lo que importa es quién va sobrado
 * y quién no, y de quién es el turno de pensar ahora mismo.
 */
function pintarReloj() {
  for (const bando of [JUGADOR, RIVAL]) {
    const nodo = el.relojes[bando];
    const ms = reloj.restanteDe(bando);
    nodo.hidden = false;
    nodo.textContent = reloj.comoTexto(ms);
    nodo.classList.toggle('apremia', ms <= BALANCE.relojAviso * 1000);
    nodo.classList.toggle('corre', reloj.deQuien() === bando);
  }
}

/**
 * Se acabó el tiempo. Como la rendición, se resuelve en la interfaz: no hay
 * un estado de «partida perdida por reloj» en las reglas y no hace falta
 * inventarlo — cuenta como derrota y paga lo que paga una derrota.
 */
function seAcaboElTiempo(bando) {
  if (app !== APP.PLAYING && app !== APP.RESOLVING) return;
  // En un duelo el reloj que decide es el del servidor: el de aquí sólo lo
  // enseña, y la siguiente pregunta trae el duelo cerrado si de verdad se acabó.
  if (duelo) return;
  pintarReloj();
  cerrarHojas();
  if (tutorialActivo()) terminarTutorial();
  soltarEntrada();
  cancelarAnimaciones();

  const gane = bando === RIVAL;
  alFinal(gane);
  const minutos = Math.round(BALANCE.relojPorJugador / 60);
  pintarFin({
    via: 'Se agotó el tiempo',
    gane,
    titular: gane ? 'Victoria' : 'Derrota',
    frase: gane
      ? `Al rival se le acabaron sus ${minutos} minutos.`
      : `Cada bando tiene ${minutos} minutos para toda la partida, y gastaste los tuyos.`,
  });
  if (cerrarAsalto(gane)) return;
  anotarResultado(gane, estado.turno);
  // Ganar porque al rival se le acabó el tiempo no es una partida que el
  // servidor pueda reproducir: el reloj no es una jugada del motor. Se cobra
  // como lo que es, una partida que no se puede re-jugar.
  cobrar(gane, false);
  sonido(gane ? 'gana' : 'pierde');
}

function jugarIA() {
  // La máquina decide en milisegundos, así que su reloj apenas se mueve. Corre
  // igual: es el mismo mecanismo que necesita un rival humano, y verlo quieto
  // mientras el tuyo baja es lo que explica de quién es el tiempo.
  reloj.correr(RIVAL);
  let guardia = 0;
  while (!estado.jugadores[RIVAL].listo && guardia++ < 80) {
    const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, perfilRival());
    rngIA = d.rng;
    if (!d.accion) break;
    estado = reduce(estado, d.accion);
  }
  if (!estado.jugadores[RIVAL].listo) estado = reduce(estado, { tipo: ACCION.PASAR, jugador: RIVAL });
  reloj.detener();
}

async function alPulsarListo() {
  if (!interactivo()) return;
  if (duelo) return listoEnDuelo();
  reloj.detener();
  desbloquear();
  el.btnListo.disabled = true;
  el.mulligan.classList.add('oculta');
  cerrarHojas();
  grabar({ tipo: ACCION.PASAR, jugador: JUGADOR });
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
 * La ceremonia de una legendaria: la carta grande al centro, con los rayos y
 * el aura detrás, y al final encogiéndose hacia la ranura donde va a abrirse.
 * Vale para las dos: la tuya se invoca y la del rival también, que verla
 * llegar a lo grande es la mitad del miedo.
 */
function animarInvocacion(cardId, bando, iid) {
  const c = carta(cardId);
  return invocar({
    html: cartaHTML(cardId, { variante: 'visor' }),
    titulo: bando === JUGADOR ? 'Invocas' : 'El rival invoca',
    subtitulo: c.binomial,
    destino: document.querySelector(`.carta--ranura[data-iid="${iid}"]`),
  });
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
        reloj.correr(RIVAL);
        const d = decidir(vistaDe(estado, RIVAL), RIVAL, rngIA, perfilRival());
        rngIA = d.rng;
        estado = reduce(estado, d.accion);
        reloj.detener();
        continue;
      }
      render(estado);
      return pedirDescarte();
    }

    if (estado.fase === FASE.REVELACION) {
      // Resolver no es decidir: mientras se anima, los dos relojes están quietos.
      reloj.detener();
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
      // Una legendaria no entra: se invoca. Se queda invisible en su ranura
      // mientras la ceremonia la enseña a lo grande, y se abre al terminar.
      const legendarias = estado.eventos.slice(desdeRev)
        .filter((e) => e.tipo === 'REVELADA' && carta(e.cardId).rareza === RAREZA.LEGENDARIO);
      const espera = animarRevelacion(antes, estado, legendarias.map((e) => e.iid));
      for (const e of legendarias) {
        sonido('joya');
        await animarInvocacion(e.cardId, e.jugador, e.iid);
        await esperar(revelarRetenida(e.iid));
      }
      await esperar(espera);
      // Y AHORA lo que pasó al revelar: las habilidades al entrar, los eventos
      // que caen encima, el clima que se impone, el trío que se completa. Todo
      // esto ya ocurría —el tablero salía cambiado— pero sólo se leía en el
      // registro. Va después de los volteos porque las cartas tienen que estar
      // boca arriba para poder señalarlas.
      await animarEventos(estado.eventos.slice(desdeRev));
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

    // El resto de fases son automáticas y cortas, pero emiten cosas que el
    // jugador tiene que ver: la aridez mordiendo los dos mazos en el robo, las
    // curaciones al final del turno.
    const desdeFase = estado.eventos.length;
    const faseQueEra = estado.fase;
    estado = reduce(estado, { tipo: ACCION.AVANZAR });
    render(estado);
    if (faseQueEra === FASE.ROBO || faseQueEra === FASE.CHEQUEO) {
      await animarEventos(estado.eventos.slice(desdeFase));
    }
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
  reloj.correr(JUGADOR);

  el.eleccionCuerpo.onclick = async (e) => {
    const b = e.target.closest('[data-iid]');
    if (!b) return;
    reloj.detener();
    el.eleccion.classList.add('oculta');
    el.eleccionCuerpo.onclick = null;
    const descarte = { tipo: ACCION.DESCARTAR, jugador: JUGADOR, iid: Number(b.dataset.iid) };
    if (duelo) {
      // El descarte es una decisión, y las decisiones en un duelo las guarda
      // el servidor. Después, a esperar a que el otro termine las suyas.
      await enviarAlDuelo(descarte);
      await esperarRival();
      return;
    }
    grabar(descarte);
    estado = reduce(estado, descarte);
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
  if (duelo) return rendirseEnElDuelo();
  reloj.parar();
  cerrarHojas();
  if (tutorialActivo()) terminarTutorial();
  soltarEntrada();
  cancelarAnimaciones();
  alFinal(false);

  pintarFin({
    via: 'Retirada',
    gane: false,
    titular: 'Derrota',
    frase: 'Abandonas el campo antes de que se decida.',
  });
  if (cerrarAsalto(false)) return;
  anotarResultado(false, estado.turno);
  cobrar(false, false);
  sonido('pierde');
}

/**
 * La línea de premio del final. Perder no paga, y «+0 dinomonedas» se lee como
 * un fallo de cuentas antes que como la regla: cuando no hay premio, se dice
 * que no lo hay y por qué.
 *
 * Las misiones se dicen APARTE y no sumadas al premio. Sumadas, una derrota que
 * cumpliera una misión enseñaría «+40 dinomonedas» y contradiría a la propia
 * frase de al lado, que explica que perder no paga. Son dos cosas distintas y
 * se leen como dos.
 */
function premioTexto(n, cobro = null) {
  // La primera victoria contra un rival del mapa se dice aparte, como las
  // misiones: sumada al premio, «+130» no diría de dónde sale cada parte.
  const exp = cobro?.expedicion;
  const porExpedicion = exp?.primera ? ` · primera victoria: +${exp.premio}`
    : exp?.cerrado ? ' · ese rival aún estaba cerrado: sin premio de primera victoria' : '';
  const base = (n > 0 ? `+${n} dinomonedas` : 'Sin dinomonedas: sólo las da ganar') + porExpedicion;
  const porMisiones = Number(cobro?.misiones ?? 0);
  if (porMisiones <= 0) return base;
  const cuantas = cobro.cumplidas?.length ?? 0;
  return `${base} · ${cuantas === 1 ? 'misión cumplida' : `${cuantas} misiones cumplidas`}`
    + `: +${porMisiones}`;
}

/**
 * Pasa a la pantalla de fin DESPUÉS del rótulo, que va encima del tablero.
 *
 * No espera nadie más: quien llama pinta el final, cobra y anota enseguida, y
 * lo pinta sobre una pantalla todavía oculta. Mientras el rótulo está puesto
 * la app queda en RESOLVING —nada es interactivo— y la música de la partida se
 * calla, porque ahí suena el remate de victoria o derrota.
 *
 * Si el final llega sin tablero a la vista —un duelo que se cierra mientras
 * se espera al rival— no hay nada que rotular y se va directo.
 */
function alFinal(gane) {
  const n = ++finVigente;
  if (app !== APP.PLAYING && app !== APP.RESOLVING) { irA(APP.GAME_OVER); return; }
  app = APP.RESOLVING;
  musica(null);
  rotularFin({ gane, raiz: el.partida }).then(() => {
    if (n === finVigente && app === APP.RESOLVING) irA(APP.GAME_OVER);
  });
}

/** Un bando del marcador: nombre, emblema del mazo y sus dos cifras. */
function bandoDelMarcador(nombre, mazo, jugador, retrato = false) {
  return {
    nombre,
    retrato,
    emblema: mazo ? (emblemaDeMazo(Array.isArray(mazo) ? Object.fromEntries(mazo) : mazo)?.clave ?? null) : null,
    trofeos: jugador?.trofeos ?? 0,
    habitat: jugador?.habitat ?? 0,
  };
}

/**
 * Pantalla de fin: el cara a cara arriba, luego la vía de victoria en
 * versales, el titular y la frase que lo explica. Antes eran tres cajas
 * sueltas y no se leía quién había quedado por delante en qué.
 */
function pintarFin({ via, gane, titular, frase }) {
  const [p, r] = estado?.jugadores ?? [];
  el.finInforme.innerHTML = '';
  el.finVia.textContent = via;
  el.finTitulo.textContent = titular;
  el.finTitulo.style.color = gane ? 'var(--acento-claro)' : 'var(--rival)';
  el.finDetalle.textContent = frase;
  el.fin.classList.toggle('con-arte', ARTE_DEL_FIN);
  el.finResumen.innerHTML = marcadorHTML({
    gane,
    turnos: estado?.turno ?? 0,
    yo: bandoDelMarcador(cargarPerfil().apodo || 'Tú', mazoActivo(), p, true),
    // Contra la IA el rival no tiene retrato; en un duelo, el suyo.
    rival: bandoDelMarcador(rivalDePartida.nombre, rivalDePartida.mazo, r, !!rivalDePartida.duelo),
  });
}

function preguntarRendicion() {
  el.eleccionTitulo.textContent = '¿Abandonar la partida?';
  el.eleccionTexto.textContent = 'Cuenta como derrota en tu récord, y perder no da dinomonedas.';
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
  reloj.parar();
  soltarEntrada();
  cancelarAnimaciones();
  if (tutorialActivo()) terminarTutorial();

  const gane = estado.ganador === JUGADOR;
  alFinal(gane);
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
  if (cerrarAsalto(gane)) return;
  anotarResultado(gane, estado.turno);
  cobrar(gane);
  sonido(gane ? 'gana' : 'pierde');
}

/**
 * Pide las dinomonedas y las enseña cuando llegan. Es asíncrono porque cuando
 * hay servidor la partida se le manda entera para que la re-juegue: lo que se
 * cobra es lo que él calcule, no lo que crea esta pantalla.
 *
 * Una partida sin grabación —se acabó el tiempo, o te retiraste— no se manda:
 * no paga nada y el servidor no podría reproducirla, porque abandonar no es una
 * jugada del motor.
 */
function cobrar(gane, reproducible = true) {
  // La PERDIDA también se manda desde que hay misiones: puede avanzar «juega 3
  // partidas» o «despliega 12 criaturas», y no mandarla sería quitarle al
  // jugador un progreso que se ganó. Sigue sin pagar premio — eso lo decide el
  // servidor re-jugándola, como siempre.
  const partida = reproducible ? grabacion : null;
  grabacion = null;
  el.finPremio.textContent = gane ? 'Contando dinomonedas…' : 'Anotando la partida…';
  recompensar(partida, gane)
    .then((cobro) => { el.finPremio.textContent = premioTexto(cobro.premio, cobro); })
    .catch((e) => {
      // Igual que con un asalto: dar por buenas unas monedas que nadie apuntó
      // sería enseñar un saldo que no existe.
      el.finPremio.textContent = `No se pudo cobrar la partida: ${e.message}`;
    });
}

/**
 * Cierra una partida que era un asalto: el daño que le hiciste al jefe se le
 * resta a la tribu entera. Devuelve true si la partida era un asalto, para que
 * el final normal no siga.
 *
 * Un asalto NO paga dinomonedas ni cuenta en tu récord: no era una partida
 * tuya, era trabajo para el equipo, y mezclar las dos economías haría que
 * asaltar fuese la forma barata de farmear monedas.
 */
function cerrarAsalto(gane) {
  if (!asaltando) return false;
  const jefe = asaltando;
  const partida = grabacion;
  asaltando = null;
  grabacion = null;

  // Lo que se calcula aquí es SÓLO para enseñarlo mientras el servidor
  // contesta. El daño que cuenta es el que él calcule re-jugando la partida;
  // si difiere, manda el suyo y se repinta con su número.
  const estimado = danoDeAsalto({
    danoAlHabitat: habitatDeAsalto() - Math.max(0, estado.jugadores[RIVAL].habitat),
    trofeos: estado.jugadores[JUGADOR].trofeos,
    ganada: gane,
  });
  el.finPremio.textContent = `${estimado} de daño a ${jefe.nombre}…`;
  sonido(gane ? 'gana' : 'pierde');
  // El informe: la vitrina del jefe con su Vida tal como estaba al empezar.
  // Cuando el servidor conteste, la barra baja hasta lo que quede.
  informeDeAsalto(jefe, jefe.vida, estimado, false);

  asaltar({ ...(partida ?? {}), dano: estimado })
    .then((r) => {
      el.finPremio.textContent = r.cayo
        ? `${jefe.nombre} ha caído. Reclama su carta en la Tribu.`
        : `${r.dano} de daño a ${jefe.nombre}. No paga dinomonedas: esto es para la tribu.`;
      informeDeAsalto(jefe, r.vida, r.dano, r.cayo);
      return pintarCuenca();
    })
    .catch((e) => {
      // Un asalto que no llega al servidor no cuenta, y hay que decirlo: dar
      // por bueno un daño que nadie registró sería mentirle a la tribu.
      el.finPremio.textContent = `No se pudo registrar el asalto: ${e.message}`;
    });
  return true;
}

/**
 * El informe del asalto en la pantalla de fin: la vitrina del jefe y su barra
 * de Vida bajando con tu daño. Se pinta dos veces: primero con la Vida que
 * tenía al empezar, y al contestar el servidor con la que queda, así que la
 * transición de la barra es literalmente lo que acabas de quitarle.
 */
function informeDeAsalto(jefe, vidaQueQueda, dano, cayo) {
  // Tres caídas: lo que dijo el servidor, lo que le quedaba al empezar, y su
  // Vida máxima. La última es la del catálogo, que existe siempre: una barra
  // con «NaN» es peor que una optimista.
  const vida = Math.max(0, [vidaQueQueda, jefe.vida, jefe.vidaMaxima].find(Number.isFinite) ?? 0);
  const pct = jefe.vidaMaxima > 0 ? (100 * vida) / jefe.vidaMaxima : 0;
  const barra = el.finInforme.querySelector('.cu-vida i');
  if (barra) {
    // Ya está pintado: sólo baja la barra y cambia las cifras.
    barra.style.width = `${pct.toFixed(1)}%`;
    el.finInforme.querySelector('.cu-vida b').innerHTML = `${Math.round(vida).toLocaleString('es')} <small>/ ${jefe.vidaMaxima.toLocaleString('es')}</small>`;
    el.finInforme.querySelector('.cu-datos b').textContent = Math.round(dano).toLocaleString('es');
    if (cayo) el.finInforme.querySelector('.cu-vitrina')?.insertAdjacentHTML('beforeend', '<i class="cu-sello-caido" title="Ha caído"></i>');
    return;
  }
  el.finInforme.innerHTML = `
    <div class="cu-vitrina">
      <div class="cu-vitrina-ventana">${arte(jefe.recompensa)}</div>
      <div class="cu-vitrina-cartela"><i>${jefe.nombre}</i></div>
    </div>
    <div class="cu-vida"><i style="width:${pct.toFixed(1)}%"></i>
      <b>${Math.round(vida).toLocaleString('es')} <small>/ ${jefe.vidaMaxima.toLocaleString('es')}</small></b></div>
    <div class="cu-datos"><span><b>${Math.round(dano).toLocaleString('es')}</b><small>de daño en este asalto</small></span></div>`;
}

// ------------------------------------------------------------------ arranque

/**
 * Qué jefe estás asaltando, o null si esta partida es una partida normal. Lo
 * lleva una variable de módulo y no el estado del motor a propósito: el motor no
 * tiene por qué enterarse de que existe una capa cooperativa encima.
 */
let asaltando = null;

/**
 * Tus jugadas de este asalto, en orden. El servidor no acepta que le digas
 * cuánto daño hiciste: le mandas la partida y la re-juega. Esto es la partida.
 *
 * Sólo se graban las TUYAS: al jefe lo juega el servidor con su propia IA. Y se
 * graban en el orden en que las haces, que es el orden en que el servidor las
 * reproduce — medido, alternar los bandos cambia el resultado en 2 de cada 40
 * partidas, así que ese detalle no es cosmético.
 */
let grabacion = null;

/** Apunta una jugada tuya si esta partida es un asalto. */
function grabar(accion) {
  if (grabacion && (accion.jugador === JUGADOR || accion.jugador === undefined)) {
    grabacion.acciones.push(accion);
  }
}

/**
 * Un asalto es una PARTIDA NORMAL contra el mazo del jefe, con su hábitat muy
 * alto. Reutilizar el motor entero en vez de escribir un modo aparte es lo que
 * hace que un jefe se pelee con las mismas reglas que ya sabes, y lo que evita
 * un segundo motor que mantener.
 */
async function asaltoAlJefe() {
  const ahora = Date.now();
  const cuenca = await estadoDeTribu(ahora);
  const activo = jefeActivo(cuenca.arranque, ahora);
  // La comprobación vive AQUÍ y no sólo en el botón de la Cuenca, porque ya
  // no es el único camino: «Otra partida» vuelve a entrar por aquí sin ese
  // botón delante. Quien manda de verdad sigue siendo el servidor, que lo
  // vuelve a mirar al cobrar; esto es para no meter al jugador en una partida
  // que no se le va a contar.
  if (!activo || puedeAsaltar({ almacen: cuenca.almacen, asaltosHoy: cuenca.asaltosHoy }, ahora, cuenca.jefe)) {
    return false;
  }
  // El jefe del ESTADO de la cuenca, no el del catálogo: el catálogo tiene su
  // Vida máxima, pero la que le queda hoy la lleva el servidor, y el informe
  // del final la enseña antes de que conteste. Con el del catálogo la barra
  // salía «NaN / 6000».
  asaltando = cuenca.jefe;
  nuevaPartida(asaltando, activo.evento.id);
  return true;
}

function nuevaPartida(jefe = null, jefeEvento = null, rivalId = null) {
  cancelarAnimaciones();
  soltarEntrada();
  registro = [];
  // La primera partida de todas se juega con el tutorial encima. Después no
  // vuelve a aparecer solo: está en el menú.
  if (!tutorialHecho() && !leerRecord()) empezarTutorial();

  const s = Number(params.get('seed')) || (Date.now() & 0x7fffffff);
  // Tú llevas tu mazo; la IA lleva el de referencia, que es el que mide el
  // simulador. Así el balance publicado sigue significando algo.
  asaltando = jefe;
  expedicionEnCurso = rivalId ? (rivalPorId(rivalId)?.rival ?? null) : null;
  ultimaFueExpedicion = !!expedicionEnCurso;
  ultimaFueAsalto = !!jefe;
  ultimaFueDuelo = false;
  const miMazo = aListaDeMazo(mazoActivo());
  // La grabación se abre ANTES de crear la partida: la primera jugada puede ser
  // el cambio de mano del turno 1, y sin ella el servidor barajaría distinto.
  //
  // Ahora se graban TODAS las partidas, no sólo los asaltos: las dinomonedas de
  // una victoria también las paga el servidor después de re-jugarla. El perfil
  // de IA viaja con ella porque el servidor tiene que reproducir el mismo
  // rival; en una expedición manda el del nodo, no éste.
  //
  // Contra un rival de expedición viaja su id y NO su mazo ni su perfil: el
  // servidor los busca en los datos por el id, y lo que dijera el navegador
  // sobre ellos no se lee.
  grabacion = {
    jefeEvento, semilla: s, mazo: miMazo, acciones: [], perfil: perfilRival(),
    ...(expedicionEnCurso ? { rival: expedicionEnCurso.id } : {}),
  };
  const mazoRival = jefe ? jefe.mazo.map((e) => [...e])
    : expedicionEnCurso ? expedicionEnCurso.mazo.map((e) => [...e]) : null;
  finVigente++;
  // Contra la IA, un jefe o una expedición el rival no lleva cosméticos.
  limpiarRival();
  rivalDePartida = {
    nombre: jefe?.nombre ?? expedicionEnCurso?.nombre ?? 'Rival',
    mazo: mazoRival ?? MAZO,
  };
  estado = crearPartida(s, [miMazo, mazoRival]);
  // El jefe aguanta mucho más que un rival normal. No es una regla nueva: es el
  // mismo hábitat, más alto, así que todo lo demás del motor sigue igual. Y el
  // marcador tiene que saberlo: sin su tope, el jefe salía «210 / 70» con la
  // barra llena y quieta hasta bajar de 70.
  if (jefe) estado.jugadores[RIVAL].habitat = habitatDeAsalto();
  fijarTopesHabitat(jefe ? habitatDeAsalto() : BALANCE.vidaHabitat);
  rngIA = semilla(s ^ 0x5bf03635);

  irA(APP.PLAYING);
  render(estado);

  // Quién está enfrente. El reloj, la entrada y el bucle esperan a que la
  // presentación se vaya: la partida empieza entonces, no debajo de ella.
  const rp = rivalId ? rivalPorId(rivalId) : null;
  const rival = jefe
    ? bandoPresentado(jefe.nombre, jefe.titulo ?? 'Jefe de la Cuenca', jefe.recompensa ?? null, jefe.mazo)
    : expedicionEnCurso
      ? bandoPresentado(expedicionEnCurso.nombre, rp?.expedicion?.nombre ?? 'Visitante',
        expedicionEnCurso.retrato ?? null, expedicionEnCurso.mazo)
      : bandoPresentado('Rival', 'Mazo de referencia', null, MAZO);
  const n = ++partidaVigente;
  presentar({
    yo: yoPresentado(),
    rival,
    modo: jefe ? 'Asalto' : expedicionEnCurso ? 'Expedición' : 'Solitario',
    objetivo: jefe
      ? 'Hazle todo el daño que puedas'
      : `${BALANCE.trofeosParaGanar} trofeos o su hábitat a cero`,
  }).then(() => {
    if (n !== partidaVigente || app !== APP.PLAYING) return;
    reloj.arrancar({ alAgotarse: seAcaboElTiempo, alLatir: pintarReloj });
    pintarReloj();
    if (tutorialActivo()) pasoTutorial('inicio');
    tomarEntrada({
      interactivo,
      admite,
      soltar,
      ficha: (cardId, iid = null) => abrirFicha(fichaHTML(cardId, iid, estado)),
    });
    bucle();
  });
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
  // si no, se juega con las siluetas y nadie ve un hueco. El índice llega por
  // red y puede tardar, así que detectarFotos() corrige por su cuenta lo que ya
  // esté pintado —incluidas las pantallas de colección, sobres y mazos, que no
  // pasan por render()—.
  vigilarFotos();
  detectarFotos().then(calentarFotos);
  detectarEnteras();
  pintarRecord();

  montarMeta(() => irA(APP.MENU));
  // Las dos pantallas de piedra contestan igual al tacto. Montarlo sólo en el
  // menú dejaba las tres placas de jugar mudas y sin destello.
  montarTacto(el.menu);
  montarTacto(el.jugar);
  // Al volver de la cuenca, el punto de la placa se pone al día: lo que acabas
  // de hacer ahí —aceptar a alguien, reclamar la carta— es justo lo que contaba.
  montarCuenca(() => { refrescarAvisos(); irA(APP.MENU); }, asaltoAlJefe);
  montarCuenta(() => irA(APP.MENU), pintarCuentaEnMenu,
    () => { abrirEntrada('Sesión cerrada.'); irA(APP.ENTRADA); });
  montarEntrada(presentarse);

  // LA PUERTA. Sin sesión de una cuenta con correo no se pasa de aquí: el menú,
  // la colección y el tablero no se pintan. Las sesiones anónimas que quedaran
  // de la versión anterior no cuentan como haber entrado.
  //
  // La marca ya está en pantalla desde el HTML. Lo que se decide aquí es qué
  // viene después de ella: la carga y el menú si hay sesión, la puerta si no.
  // La música del menú arranca cuando la marca EMPIEZA a irse, para que suba
  // mientras el logo se disuelve. La carga o la puerta piden después la misma
  // pista y eso no la reinicia: `musica()` no hace nada si ya suena ésa.
  precargarMusica(MUSICA_DE[APP.CARGA]);
  const marca = mostrarMarca(() => musica(MUSICA_DE[APP.CARGA]));
  if (estaDentro()) {
    presentarse(null, marca).catch((e) => { abrirEntrada(e.message); irA(APP.ENTRADA); });
  } else {
    marca.then(() => { abrirEntrada(); irA(APP.ENTRADA); });
  }

  // El botón del menú ya no empieza una partida: abre la pantalla donde se
  // elige qué se juega. `desbloquear()` sigue aquí porque es el primer gesto
  // real del usuario y es lo que despierta el audio.
  el.btnJugar.addEventListener('click', () => { desbloquear(); abrirJugar(); });
  // «En solitario» abre el mapa de la expedición; la partida empieza al tocar
  // «Luchar» en un nodo. El solitario contra el mazo de referencia, sin mapa,
  // ya no tiene botón: es el que usa el tutorial y el que mide el simulador.
  montarExpedicion({
    alJugar: (rivalId) => { desbloquear(); nuevaPartida(null, null, rivalId); },
    alVolver: () => abrirJugar(),
  });
  el.btnSolitario.addEventListener('click', () => { desbloquear(); abrirExpedicion(); irA(APP.EXPEDICION); });
  // La placa del Duelo abre y cierra su panel, como la de misiones, y las dos
  // se excluyen: abrir una pliega la otra.
  montarDuelo({ cuandoEmpareje: empezarDuelo });
  el.btnDuelo.addEventListener('click', () => {
    const abierto = el.btnDuelo.getAttribute('aria-expanded') === 'true';
    el.btnDuelo.setAttribute('aria-expanded', String(!abierto));
    if (!abierto) { el.btnMisiones.setAttribute('aria-expanded', 'false'); enseñarMisiones(false); }
    enseñarDuelo(!abierto);
  });
  el.btnMisiones.addEventListener('click', () => {
    const abierto = el.btnMisiones.getAttribute('aria-expanded') === 'true';
    el.btnMisiones.setAttribute('aria-expanded', String(!abierto));
    if (!abierto) { el.btnDuelo.setAttribute('aria-expanded', 'false'); enseñarDuelo(false); }
    enseñarMisiones(!abierto);
  });
  // Salir de la pantalla de jugar es salir de la cola: quedarse esperando
  // rival desde el menú sería empezar una partida sin estar mirando.
  el.btnJugarVolver.addEventListener('click', () => { abandonarEspera(); pintarMenu(); irA(APP.MENU); });
  el.btnColeccion.addEventListener('click', () => { abrirColeccion(); irA(APP.COLECCION); });
  el.btnSobres.addEventListener('click', () => { abrirSobres(); irA(APP.SOBRES); });
  el.btnMazos.addEventListener('click', () => { abrirMazos(); irA(APP.MAZOS); });
  el.btnCuenca.addEventListener('click', () => { abrirCuenca(); irA(APP.CUENCA); });
  el.btnCuenta.addEventListener('click', () => { abrirCuenta(); irA(APP.CUENTA); });
  document.getElementById('btn-tienda').addEventListener('click', () => { abrirTienda(); irA(APP.TIENDA); });
  el.btnOtra.addEventListener('click', () => {
    pintarRecord();
    // Tras un duelo, «otra» no es otra contra la IA: es volver a buscar rival.
    if (ultimaFueDuelo) { abrirJugar(); el.btnDuelo.setAttribute('aria-expanded', 'true'); enseñarDuelo(true); return; }
    // Tras un rival de expedición, «otra» vuelve al mapa: puede que se haya
    // abierto el siguiente nodo, y repetir contra el mismo no es lo que se busca.
    if (ultimaFueExpedicion) { abrirExpedicion(); irA(APP.EXPEDICION); return; }
    // Y tras un asalto, «otra» es otro ASALTO. Caía en una partida normal
    // contra la IA sin decirlo, y no se distingue hasta mirar el hábitat del
    // rival: 70 en vez de los 210 del jefe. Si ya no se puede asaltar
    // —almacén, tope del día, ventana cerrada— se vuelve a la Cuenca, que lo
    // dice en su propio botón con el motivo.
    if (ultimaFueAsalto) {
      asaltoAlJefe().then((arrancó) => {
        if (!arrancó) { abrirCuenca(); irA(APP.CUENCA); }
      });
      return;
    }
    nuevaPartida();
  });
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
    if (!f) return;
    // Con el recorrido del montón: mirar un descarte es leerlo entero.
    const ids = [...el.descarteCuerpo.querySelectorAll('[data-card]')].map((x) => x.dataset.card);
    abrirFicha(fichaHTML(f.dataset.card), { ids, i: ids.indexOf(f.dataset.card) });
  });
  el.fichaCerrar.addEventListener('click', cerrarHojas);

  // Ampliar una carta: desde la ficha, y la ficha se abre desde el tablero, la
  // colección, el descarte y el editor de mazos, así que con un sitio basta.
  el.fichaCuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    // La miniatura abre lo que enseña —la ilustración— y el botón la carta.
    if (b) abrirVisor(b.dataset.zoom, b.dataset.modo ?? 'carta');
  });

  montarFicha();

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
  montarInstalar({
    boton: document.getElementById('btn-instalar'),
    nota: document.getElementById('menu-instalar'),
  });

  // Un botón de sonido por pantalla —puerta, menú, jugar y partida—, todos
  // la misma preferencia: pulsar uno los pinta todos. Tiene que estar en la
  // primera pantalla que se ve porque la música arranca antes de ningún gesto.
  const botonesDeSonido = document.querySelectorAll('[data-mute]');
  const pintarSonido = () => {
    const off = estaSilenciado();
    for (const b of botonesDeSonido) {
      b.classList.toggle('off', off);
      b.setAttribute('aria-pressed', String(off));
      b.setAttribute('aria-label', off ? 'Activar sonido' : 'Silenciar');
    }
  };
  pintarSonido();
  for (const b of botonesDeSonido) {
    b.addEventListener('click', () => {
      desbloquear();
      alternarMute();
      pintarSonido();
    });
  }

  // La música del menú ya está puesta desde la carga, pero si el navegador no
  // dejó sonar sin gesto hay que despertarla con el PRIMERO, que es entrar con
  // la cuenta y no pasa por `desbloquear()`. Un `click` o una tecla cualquiera
  // valen como gesto; `pointerdown` no, que por eso el toque de las placas
  // suena en `click`.
  for (const gesto of ['click', 'keydown']) {
    document.addEventListener(gesto, desbloquear, { once: true, capture: true });
  }

  document.addEventListener('visibilitychange', () => {
    enSegundoPlano(document.hidden);
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

// ------------------------------------------------------------------- duelo
//
// La partida contra una persona es el mismo tablero, el mismo guión y el mismo
// animador. Lo que cambia es de dónde sale el estado: del servidor, que es el
// único que ve las dos manos. Cada jugada se manda de una en una —con una
// copia local para que la carta caiga al instante— y al pulsar Listo se espera
// a que el otro también pulse, preguntando cada dos segundos y medio.

const hudRival = document.querySelector('.hud-bando.rival .hud-etiqueta');

/** Empieza el duelo con lo que devolvió el servidor al emparejar. */
function empezarDuelo(r) {
  cancelarAnimaciones();
  soltarEntrada();
  registro = [];
  asaltando = null;
  grabacion = null;
  ultimaFueDuelo = true;
  ultimaFueExpedicion = false;
  ultimaFueAsalto = false;
  fijarTopesHabitat();
  expedicionEnCurso = null;
  finVigente++;
  rivalDePartida = { nombre: r.rival?.apodo ?? 'Rival', mazo: null, duelo: true };
  // Lo que lleva puesto el rival: su dorso y su estandarte. Se pide sin
  // esperar —la presentación ya está saliendo— y se aplica por variables CSS,
  // así que si llega con la presentación en pantalla su estandarte cambia en
  // el sitio. Si falla, el rival sale con lo de siempre.
  limpiarRival();
  traerEquipadoRival(r.id)
    .then((equipado) => { if (duelo?.id === r.id) aplicarRival(equipado); })
    .catch(() => {});
  duelo = {
    id: r.id, n: r.n ?? 0, rival: r.rival, yo: r.yo, eloInicial: Number(r.eloInicial ?? r.yo?.elo ?? 1200),
    cola: Promise.resolve(), pendientes: 0, ultimo: null,
  };
  estado = r.estado;
  if (hudRival) hudRival.textContent = r.rival?.apodo ?? 'Rival';
  // El reloj de verdad es el del servidor; el de aquí lo enseña. Sin
  // `alAgotarse`: llegar a cero no decide nada, la siguiente pregunta lo trae.
  reloj.arrancar({ alAgotarse: () => {}, alLatir: pintarReloj });
  if (r.tiempos) reloj.poner(r.tiempos);
  pintarReloj();

  irA(APP.PLAYING);
  render(estado);

  // El mazo del rival es secreto: sale sin retrato ni emblema, con su liga.
  const d = duelo;
  const n = ++partidaVigente;
  const eloRival = Number(r.rival?.elo);
  presentar({
    yo: yoPresentado(),
    rival: bandoPresentado(r.rival?.apodo ?? 'Rival',
      Number.isFinite(eloRival) ? nombreDeRango(eloRival) : 'Duelo', null, null),
    modo: 'Duelo',
    objetivo: `${BALANCE.trofeosParaGanar} trofeos o su hábitat a cero`,
  }, PRESENTACION_DUELO).then(() => {
    if (n !== partidaVigente || duelo !== d || app !== APP.PLAYING) return;
    tomarEntrada({
      interactivo,
      admite,
      soltar,
      ficha: (cardId, iid = null) => abrirFicha(fichaHTML(cardId, iid, estado)),
    });
    mensaje(`Duelo contra ${r.rival?.apodo ?? 'tu rival'}. Arrastra cartas al campo y pulsa Listo.`);
    if ((r.deciden ?? []).includes(JUGADOR)) turnoDelJugador();
    else esperarRival();
  });
}

/**
 * Una jugada en el duelo: se valida aquí con el mismo `validar()` para que el
 * error salga al instante, se aplica en local para que la carta caiga sin
 * esperar, y se manda. Lo que el servidor devuelva es lo que vale.
 *
 * Dos jugadas no se pueden aplicar en local: cambiar la mano y reciclar. Las
 * dos barajan o roban, y la vista no trae ni el rng ni el orden del mazo —a
 * propósito, que con ellos se predice lo que viene—. Ésas se mandan y se espera.
 */
function aplicarEnDuelo(accion) {
  const motivo = validar(estado, accion);
  if (motivo) { mensaje(motivo, true); sonido('error'); return false; }
  el.mulligan.classList.add('oculta');
  sonido('carta');
  const remota = accion.tipo === ACCION.MULLIGAN || accion.tipo === ACCION.RECICLAR;
  if (!remota) {
    estado = reduce(estado, accion);
    render(estado);
  }
  enviarAlDuelo(accion);
  return true;
}

/** Manda una jugada, en orden con las anteriores, y adopta la respuesta. */
function enviarAlDuelo(accion) {
  const d = duelo;
  d.pendientes += 1;
  d.cola = d.cola
    .then(() => jugarEnDuelo(d.id, accion, d.n))
    .then((r) => { d.pendientes -= 1; adoptar(d, r); })
    .catch(async (e) => {
      d.pendientes -= 1;
      mensaje(e.message, true);
      sonido('error');
      // El servidor manda: si rechazó la jugada, se vuelve a su estado.
      try { adoptar(d, await estadoDuelo(d.id, d.n)); } catch { /* la siguiente pregunta lo trae */ }
    });
  return d.cola;
}

/**
 * Lo que devuelve el servidor tras una jugada. Sustituye al estado local sólo
 * cuando no hay jugadas en vuelo —si no, pisaría una carta que acabas de
 * soltar y aún no ha llegado— y nunca si trae pasos: los pasos son la
 * revelación y el combate, y ésos los anima `esperarRival`.
 */
function adoptar(d, r) {
  if (duelo !== d || !r?.estado) return;
  d.n = r.n ?? d.n;
  d.ultimo = r;
  if (r.tiempos) reloj.poner(r.tiempos);
  if (d.pendientes === 0 && !(r.pasos?.length) && !r.fin) {
    estado = r.estado;
    render(estado);
  }
}

async function listoEnDuelo() {
  reloj.detener();
  desbloquear();
  el.btnListo.disabled = true;
  el.mulligan.classList.add('oculta');
  cerrarHojas();
  await enviarAlDuelo({ tipo: ACCION.PASAR });
  await esperarRival();
}

/**
 * Esperar a que el otro termine de decidir. Pregunta cada `DUELO.sondeoMs`;
 * cuando llegan los pasos —la revelación, el combate, el robo— los anima uno a
 * uno con «antes» y «después», exactamente como hace el bucle contra la IA, y
 * después decide qué toca: tu turno, tu descarte, o seguir esperando.
 */
async function esperarRival() {
  const d = duelo;
  if (!d) return;
  mensaje(`Esperando a ${d.rival?.apodo ?? 'tu rival'}…`);
  reloj.correr(RIVAL);
  for (;;) {
    if (duelo !== d) return;
    let r = d.ultimo;
    d.ultimo = null;
    const trae = (x) => x && ((x.pasos?.length ?? 0) > 0 || x.fin || (x.deciden ?? []).includes(JUGADOR));
    if (!trae(r)) {
      await new Promise((res) => setTimeout(res, DUELO.sondeoMs));
      if (duelo !== d) return;
      try { r = await estadoDuelo(d.id, d.n); } catch (e) { mensaje(e.message, true); continue; }
      if (r?.tiempos) reloj.poner(r.tiempos);
      if (!trae(r)) continue;
    }
    d.n = r.n ?? d.n;
    if (r.pasos?.length) await animarPasos(r.pasos);
    if (duelo !== d) return;
    estado = r.estado;
    render(estado);
    if (r.fin) return finDuelo(r);
    if (estado.fase === FASE.DESPLIEGUE) return turnoDelJugador();
    if (estado.fase === FASE.DESCARTE && (r.deciden ?? []).includes(JUGADOR)) return pedirDescarte();
    mensaje(`Esperando a ${d.rival?.apodo ?? 'tu rival'}…`);
    reloj.correr(RIVAL);
  }
}

/** Los pasos del servidor, animados como los anima el bucle local. */
async function animarPasos(pasos) {
  reloj.detener();
  irA(APP.RESOLVING);
  for (const p of pasos) {
    const antes = estado;
    estado = p.estado;
    const nuevos = estado.eventos.slice(p.eventosDesde);
    if (p.fase === FASE.REVELACION) {
      render(estado);
      mensaje(presionesRivales(nuevos) ?? 'Revelación simultánea…');
      sonido('revelar');
      const legendarias = nuevos
        .filter((e) => e.tipo === 'REVELADA' && carta(e.cardId).rareza === RAREZA.LEGENDARIO);
      const espera = animarRevelacion(antes, estado, legendarias.map((e) => e.iid));
      for (const e of legendarias) {
        sonido('joya');
        await animarInvocacion(e.cardId, e.jugador, e.iid);
        await esperar(revelarRetenida(e.iid));
      }
      await esperar(espera);
      await animarEventos(nuevos);
    } else if (p.fase === FASE.COMBATE) {
      mensaje('Combate…');
      if (nuevos.some((e) => e.tipo === 'MUERTE')) sonido('muerte');
      await new Promise((res) => animarCombate(antes, estado, nuevos, res));
    } else {
      // El chequeo vacía la lista de eventos al pasar de turno: el registro se
      // archiva con lo de ANTES, como hace el bucle local.
      if (p.fase === FASE.CHEQUEO) { estado = antes; archivarLog(); estado = p.estado; }
      render(estado);
      if (p.fase === FASE.ROBO || p.fase === FASE.CHEQUEO) await animarEventos(nuevos);
    }
  }
}

function rendirseEnElDuelo() {
  const d = duelo;
  reloj.parar();
  cerrarHojas();
  rendirseEnDuelo(d.id)
    .then((r) => { if (duelo === d) finDuelo(r); })
    .catch((e) => { mensaje(e.message, true); });
}

/** El final de un duelo: quién ganó, por qué, y qué le pasó a tu liga. */
function finDuelo(r) {
  const d = duelo;
  duelo = null;
  reloj.parar();
  soltarEntrada();
  cancelarAnimaciones();
  if (hudRival) hudRival.textContent = 'Rival';
  if (r.estado) estado = r.estado;

  const gane = r.fin?.ganador === JUGADOR;
  alFinal(gane);
  const rival = r.rival?.apodo ?? 'el rival';
  const via = {
    [MOTIVO_FIN.TROFEOS]: 'Registro fósil completo',
    [MOTIVO_FIN.HABITAT]: 'Colapso del hábitat',
    [MOTIVO_FIN.EXTINCION]: 'Extinción',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'Límite de turnos',
    TIEMPO: 'Se agotó el tiempo',
    ABANDONO: 'Retirada',
  }[r.fin?.motivo] ?? '';
  const frase = {
    [MOTIVO_FIN.TROFEOS]: gane ? `Tu población dejó más fósiles que la de ${rival}.` : `El registro fósil se llenó de los de ${rival}.`,
    [MOTIVO_FIN.HABITAT]: gane ? `El hábitat de ${rival} cedió antes que el tuyo.` : `Tu hábitat cedió antes que el de ${rival}.`,
    [MOTIVO_FIN.EXTINCION]: gane ? `A ${rival} no le quedaban cartas que robar.` : 'Te quedaste sin cartas que robar.',
    [MOTIVO_FIN.LIMITE_TURNOS]: 'Se acabaron los turnos sin decidirse.',
    TIEMPO: gane ? `A ${rival} se le acabó el tiempo.` : 'Se te acabó el tiempo.',
    ABANDONO: gane ? `${rival} abandonó el campo.` : 'Abandonas el campo antes de que se decida.',
  }[r.fin?.motivo] ?? '';
  pintarFin({ via, gane, titular: gane ? 'Victoria' : 'Derrota', frase });
  anotarResultado(gane, estado?.turno ?? 0);

  // La liga, dicha como liga: la barra que sube o el escalón que cambia. El
  // ELO no aparece por ningún sitio, ni aquí.
  const antes = Number(d?.eloInicial ?? 1200);
  const ahora = Number(r.yo?.elo ?? antes);
  const ra = rangoDe(antes);
  const rb = rangoDe(ahora);
  let liga;
  if (ra.liga !== rb.liga || ra.division !== rb.division) {
    liga = `${ahora > antes ? 'Subes a' : 'Bajas a'} ${nombreDeRango(ahora)}`;
  } else {
    const puntos = rb.puntos - ra.puntos;
    liga = `${nombreDeRango(ahora)} · ${puntos >= 0 ? '+' : ''}${puntos} puntos`;
  }
  const premio = gane ? `+${ECONOMIA.monedasVictoria} dinomonedas` : 'Sin dinomonedas: sólo las da ganar';
  el.finPremio.textContent = premio;
  // El emblema de la liga en la que quedas, grande, con la línea de lo que ha
  // pasado debajo. Si cambias de liga, el emblema es ya el de la nueva.
  const subio = ra.liga !== rb.liga && ahora > antes;
  el.finInforme.innerHTML = `<div class="fin-liga ${subio ? 'sube' : ''}">
    <img src="${emblemaDe(rb.liga)}" alt="" width="96" height="96" decoding="async">
    <span>${liga}</span></div>`;
  // Monedas y ELO los movió el servidor: se le vuelve a preguntar por el perfil.
  sincronizar().then(() => pintarMenu()).catch(() => {});
  refrescarAvisos();
  sonido(gane ? 'gana' : 'pierde');
}
