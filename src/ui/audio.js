// Audio: efectos sintetizados y música en bucle. El AudioContext no se crea
// hasta el primer gesto del usuario (política de autoplay de los navegadores).
//
// Los efectos siguen siendo osciladores —sin binarios, sin descargas— hasta
// que lleguen generados. La música sí es fichero: los M4A de assets/sonidos/,
// que salen de tools/sonidos.py y ya vienen cosidos para cerrar el bucle.

let ctx = null;
let maestro = null;
let silenciado = false;

const CLAVE = 'morrison.mute';

try {
  silenciado = localStorage.getItem(CLAVE) === '1';
} catch { /* almacenamiento no disponible: seguimos con el valor por defecto */ }

export const estaSilenciado = () => silenciado;

export function alternarMute() {
  silenciado = !silenciado;
  try { localStorage.setItem(CLAVE, silenciado ? '1' : '0'); } catch { /* sin persistencia */ }
  if (maestro) maestro.gain.value = silenciado ? 0 : 1;
  return silenciado;
}

function crearContexto() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  maestro = ctx.createGain();
  maestro.gain.value = silenciado ? 0 : 1;
  maestro.connect(ctx.destination);
}

/** Se llama desde el primer gesto real del usuario. */
export function desbloquear() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  crearContexto();
  // La pantalla ya pidió su música antes de que hubiera contexto.
  acompasar();
}

export function cerrarAudio() {
  if (ctx && ctx.state !== 'closed') ctx.close();
  ctx = null;
  maestro = null;
  pista = null;
  decodificadas.clear();
}

/** Con la pestaña escondida la música se calla; al volver, sigue. */
export function enSegundoPlano(escondida) {
  if (!ctx || ctx.state === 'closed') return;
  if (escondida) ctx.suspend();
  else ctx.resume();
}

// --------------------------------------------------------------- música
//
// Una pista por pantalla, la que pone `irA()` en cada cambio. Hubo una capa
// más —un interludio para el sobre mientras duraba la ceremonia— y se quitó
// porque al autor no le gustó cómo sonaba; si vuelve a hacer falta, es una
// variable encima de `fondo` y un `?? fondo` en `acompasar()`.
//
// Las pistas van como AudioBufferSourceNode con `loop`, no como <audio>: el
// elemento deja un hueco audible en cada vuelta y el buffer no. El precio es
// decodificar: son 4 bytes por muestra y canal, así que 28 s de estéreo son
// 11 MB en memoria y los dos minutos del menú, 45 MB. Por eso se decodifica
// al pedirla y no todas al arrancar, y por eso una pista no debería pasar de
// esos dos minutos.

const RUTA_PISTA = (nombre) => `assets/sonidos/${nombre}.m4a`;
const FUNDIDO = 0.9;
/** Las pistas van normalizadas a −16 LUFS; esto las deja debajo de los efectos. */
const VOLUMEN_MUSICA = 0.45;

let fondo = null;
let pista = null;          // { nombre, fuente, ganancia } sonando ahora
let generacion = 0;
const decodificadas = new Map();

/** Qué pista suena ahora mismo, o `null`. Para mirar desde fuera, no para decidir. */
export const pistaSonando = () => pista?.nombre ?? null;
/** Si el navegador ya deja sonar. Falso antes del primer gesto en un sitio nuevo. */
export const audioActivo = () => ctx?.state === 'running';

/**
 * La pista de la pantalla; `null` para silencio.
 *
 * La primera pantalla con música llega sin ningún gesto —la carga, con sesión
 * guardada; la puerta, sin ella— y sin gesto el navegador puede negarse a
 * sonar. Se crea el contexto igual: si lo permite, que Chrome lo hace en los
 * sitios donde ya has oído audio otras veces, la música arranca aquí; si no,
 * el contexto nace suspendido con la pista ya puesta y el primer clic o tecla
 * lo despierta con ella sonando.
 */
export function musica(nombre) {
  fondo = nombre;
  if (!ctx && nombre) crearContexto();
  acompasar();
}

/**
 * Descarga y decodifica una pista antes de que haga falta. La del menú se
 * pide durante la marca: son 1,6 MB y un cuarto de segundo de decodificar,
 * y sin esto la música llegaba cuando el logo ya casi se había ido.
 */
export function precargarMusica(nombre) {
  if (!ctx) crearContexto();
  if (ctx) cargarPista(nombre).catch(() => {});
}

function cargarPista(nombre) {
  if (!decodificadas.has(nombre)) {
    const carga = fetch(RUTA_PISTA(nombre))
      .then((r) => { if (!r.ok) throw new Error(`${r.status} al pedir ${nombre}`); return r.arrayBuffer(); })
      .then((bytes) => ctx.decodeAudioData(bytes));
    // Si falla se olvida, para volver a intentarlo la próxima vez que se pida.
    carga.catch(() => decodificadas.delete(nombre));
    decodificadas.set(nombre, carga);
  }
  return decodificadas.get(nombre);
}

function apagar(p) {
  const t = ctx.currentTime;
  p.ganancia.gain.cancelScheduledValues(t);
  p.ganancia.gain.setValueAtTime(Math.max(0.0001, p.ganancia.gain.value), t);
  p.ganancia.gain.exponentialRampToValueAtTime(0.0001, t + FUNDIDO);
  p.fuente.stop(t + FUNDIDO + 0.05);
}

async function acompasar() {
  if (!ctx) return;          // arrancará en desbloquear()
  const nombre = fondo;
  if (pista?.nombre === nombre) return;
  const mia = ++generacion;
  if (pista) { apagar(pista); pista = null; }
  if (!nombre) return;

  let buffer;
  try { buffer = await cargarPista(nombre); } catch { return; }
  // Mientras se decodificaba pudo pedirse otra, o cerrarse el audio.
  if (mia !== generacion || !ctx || ctx.state === 'closed') return;

  const fuente = ctx.createBufferSource();
  fuente.buffer = buffer;
  fuente.loop = true;
  const ganancia = ctx.createGain();
  const t = ctx.currentTime;
  ganancia.gain.setValueAtTime(0.0001, t);
  ganancia.gain.exponentialRampToValueAtTime(VOLUMEN_MUSICA, t + FUNDIDO);
  fuente.connect(ganancia).connect(maestro);
  fuente.start(t);
  pista = { nombre, fuente, ganancia };
}

function tono(f0, f1, dur, tipo = 'triangle', vol = 0.07, retraso = 0) {
  if (!ctx || silenciado) return;
  const t = ctx.currentTime + retraso;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(maestro);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function sonido(tipo) {
  switch (tipo) {
    case 'carta': tono(520, 320, 0.07, 'square', 0.05); break;
    case 'revelar': tono(300, 620, 0.14, 'triangle', 0.06); break;
    // Los dos del sobre: rasgar la bolsa, y el tintineo de una carta rara.
    case 'rasgar': tono(190, 80, 0.2, 'sawtooth', 0.05); break;
    case 'joya': tono(660, 990, 0.22, 'sine', 0.05); break;
    case 'muerte': tono(200, 70, 0.24, 'sawtooth', 0.05); break;
    case 'zona': tono(440, 660, 0.1, 'sine', 0.05); break;
    case 'error': tono(160, 120, 0.12, 'square', 0.045); break;
    case 'gana':
      [392, 523, 659, 784].forEach((f, i) => tono(f, f, 0.16, 'triangle', 0.07, i * 0.1));
      break;
    case 'pierde':
      [392, 330, 262, 196].forEach((f, i) => tono(f, f, 0.2, 'sine', 0.06, i * 0.12));
      break;

    // Los del guión de eventos. Cada compás pide el suyo y un `tipo` que no
    // esté aquí cae en `default` sin ruido y sin error, así que una carta nueva
    // nunca se queda muda por un nombre mal escrito — se queda callada, que es
    // recuperable.
    case 'entrada': tono(440, 700, 0.11, 'triangle', 0.055); break;
    case 'adaptar': tono(523, 784, 0.13, 'sine', 0.05); break;
    case 'presion': tono(300, 180, 0.15, 'sawtooth', 0.045); break;
    case 'clima':
      [262, 349, 440].forEach((f, i) => tono(f, f * 1.2, 0.26, 'sine', 0.045, i * 0.07));
      break;
    case 'mazo': tono(240, 150, 0.13, 'square', 0.035); break;
    case 'descarte': tono(280, 190, 0.1, 'square', 0.04); break;
    case 'buscar': tono(600, 880, 0.12, 'sine', 0.05); break;
    case 'reciclar': tono(500, 380, 0.12, 'triangle', 0.045); break;
    case 'biomasa': tono(350, 520, 0.1, 'sine', 0.05); break;
    case 'curar': tono(560, 740, 0.16, 'sine', 0.045); break;
    case 'trofeo':
      [523, 659, 880].forEach((f, i) => tono(f, f, 0.14, 'triangle', 0.06, i * 0.06));
      break;
    // El del menú: un toque corto y bajo, de pieza que encaja. Suena al soltar,
    // que es cuando el navegador cuenta el gesto como tal.
    case 'toque': tono(720, 480, 0.05, 'triangle', 0.035); break;

    default: break;
  }
}
