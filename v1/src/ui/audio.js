// Audio sintetizado: sin binarios, sin descargas. El AudioContext no se crea
// hasta el primer gesto del usuario (política de autoplay de los navegadores).

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

/** Se llama desde el primer gesto real del usuario. */
export function desbloquear() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  maestro = ctx.createGain();
  maestro.gain.value = silenciado ? 0 : 1;
  maestro.connect(ctx.destination);
}

export function cerrarAudio() {
  if (ctx && ctx.state !== 'closed') ctx.close();
  ctx = null;
  maestro = null;
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
    case 'muerte': tono(200, 70, 0.24, 'sawtooth', 0.05); break;
    case 'zona': tono(440, 660, 0.1, 'sine', 0.05); break;
    case 'error': tono(160, 120, 0.12, 'square', 0.045); break;
    case 'gana':
      [392, 523, 659, 784].forEach((f, i) => tono(f, f, 0.16, 'triangle', 0.07, i * 0.1));
      break;
    case 'pierde':
      [392, 330, 262, 196].forEach((f, i) => tono(f, f, 0.2, 'sine', 0.06, i * 0.12));
      break;
    default: break;
  }
}
