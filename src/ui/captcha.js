// DinoWar — el CAPTCHA de la puerta.
//
// Es el ÚNICO script externo del juego, y está aquí a regañadientes: el resto
// viaja en el repositorio a propósito —sin frameworks, sin CDNs— y eso es lo
// que hace que arranque en medio segundo. Pero un CAPTCHA no se puede servir
// desde casa: lo que lo hace valer es que lo verifica un tercero que ve el
// tráfico de media internet, y ese tercero es Cloudflare. Turnstile y no
// hCaptcha porque a casi nadie le pregunta nada: decide solo y sólo enseña un
// desafío a quien le parece sospechoso.
//
// Lo que protege no es el navegador, es el ALTA: la petición a Supabase con la
// clave publicable la puede lanzar cualquiera desde un script, y sin esto
// crearía mil cuentas en una tarde. Con el CAPTCHA activado en el panel,
// Supabase rechaza toda alta y toda entrada por contraseña que no traiga un
// token válido, y el token sólo lo da este widget.
//
// Tres cosas que conviene saber antes de tocarlo:
//
// - El token es de UN SOLO USO. Cada intento —bueno o malo— lo gasta, así que
//   después de cada petición hay que pedir otro (`reiniciar`). Sin eso, el
//   segundo intento de entrar tras una contraseña mal escrita fallaba con un
//   «captcha verification process failed» que no tenía nada que ver.
// - La puerta se repinta ENTERA con `innerHTML` en cada cambio de pestaña o de
//   aviso, y el widget se va con ella: por eso `montar` se llama en cada
//   repintado y retira el anterior antes de pintar otro.
// - Si el script no llega —un bloqueador, una red que corta Cloudflare— el
//   formulario sigue enviándose sin token. Mientras el CAPTCHA no esté activado
//   en el panel eso entra igual; cuando lo esté, el servidor lo rechaza y el
//   aviso de abajo es lo que le dice al jugador por qué.

import { CONFIG } from '../data/config.js';

const ESPERA_SCRIPT = 6000;   // ms hasta dar el script por perdido
const PASO = 150;

let widget = null;            // id que devuelve turnstile.render
let cargado = false;

const api = () => globalThis.turnstile ?? null;

/**
 * ¿Hay clave de sitio? Sin ella no hay widget ni aviso: es el modo en que corre
 * cualquier copia del juego que no sea la publicada.
 */
export const hayCaptcha = () => Boolean(CONFIG.turnstile?.siteKey);

/**
 * Pinta el widget dentro de `contenedor`. Espera al script si aún no ha llegado
 * y, si no llega, escribe el aviso en `nota` para que el jugador sepa qué pasa.
 * No rechaza nunca: la puerta tiene que pintarse aunque Cloudflare no conteste.
 */
export async function montarCaptcha(contenedor, nota = null) {
  if (!hayCaptcha() || !contenedor) return;
  retirar();

  const t = await esperarScript();
  if (!t) {
    if (nota) {
      nota.textContent = 'No se ha podido cargar la verificación de Cloudflare. Si no puedes entrar, es por eso.';
      nota.hidden = false;
    }
    return;
  }
  // El contenedor puede haberse ido mientras esperábamos: otro repintado.
  if (!contenedor.isConnected) return;
  cargado = true;
  widget = t.render(contenedor, {
    sitekey: CONFIG.turnstile.siteKey,
    theme: 'dark',
    size: 'flexible',
    language: 'es',
    // Un token caduca a los cinco minutos; si el jugador se deja el formulario
    // abierto, Turnstile lo renueva solo con esto puesto.
    'refresh-expired': 'auto',
  });
}

/** El token del intento en curso, o null si no hay widget o aún no resolvió. */
export function tokenCaptcha() {
  const t = api();
  if (!t || widget === null) return null;
  try {
    const token = t.getResponse(widget);
    return token || null;
  } catch {
    return null;
  }
}

/** Pide un token nuevo. Va después de CADA intento, salga bien o mal. */
export function reiniciarCaptcha() {
  const t = api();
  if (!t || widget === null) return;
  try { t.reset(widget); } catch { /* el widget ya no está: lo repinta el siguiente montar */ }
}

export const captchaCargado = () => cargado;

function retirar() {
  const t = api();
  if (t && widget !== null) {
    try { t.remove(widget); } catch { /* su contenedor ya no existe */ }
  }
  widget = null;
}

function esperarScript() {
  return new Promise((resolver) => {
    const desde = Date.now();
    const mirar = () => {
      const t = api();
      if (t) return resolver(t);
      if (Date.now() - desde > ESPERA_SCRIPT) return resolver(null);
      setTimeout(mirar, PASO);
    };
    mirar();
  });
}
