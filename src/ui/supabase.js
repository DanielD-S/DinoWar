// DinoWar — cliente mínimo de Supabase, hablando HTTP a pelo.
//
// No se carga `supabase-js`. El README promete «sin frameworks, sin
// dependencias, sin CDNs» y eso no es una pose: es por qué el juego arranca en
// medio segundo. La API de Supabase es HTTP, y lo que este juego necesita de
// ella —una sesión anónima, llamar funciones, invocar la Edge Function— son
// estas ochenta líneas.
//
// Lo que NO hace, y por eso cabe: realtime, storage, consultas construidas,
// providers de OAuth. Si algún día hiciera falta realtime, esto se queda corto
// y habrá que replantearlo; hoy no hace falta.

import { CONFIG } from '../data/config.js';

const CLAVE_SESION = 'dinowar.sesion.v1';

let sesion = null;      // { access_token, refresh_token, expires_at, user }

export const hayServidor = () => Boolean(CONFIG.supabase?.url && CONFIG.supabase?.clave);

function guardar(s) {
  sesion = s;
  try {
    if (s) localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    else localStorage.removeItem(CLAVE_SESION);
  } catch { /* en privado se juega igual, sin recordar la sesión */ }
}

function cargar() {
  if (sesion) return sesion;
  try { sesion = JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch { sesion = null; }
  return sesion;
}

/** Errores del servidor con el mensaje que el servidor dio, no uno inventado. */
export class ErrorDeRed extends Error {
  constructor(mensaje, estado = 0, cuerpo = null) {
    super(mensaje);
    this.name = 'ErrorDeRed';
    this.estado = estado;
    this.cuerpo = cuerpo;
  }
}

async function pedir(ruta, opciones = {}, conSesion = true) {
  const { url, clave } = CONFIG.supabase;
  const cabeceras = {
    apikey: clave,
    'Content-Type': 'application/json',
    ...(opciones.headers ?? {}),
  };
  // El token del usuario manda sobre la clave publicable: es lo que hace que el
  // servidor sepa quién eres y no sólo de qué proyecto vienes.
  const s = conSesion ? cargar() : null;
  cabeceras.Authorization = `Bearer ${s?.access_token ?? clave}`;

  let r;
  try {
    r = await fetch(`${url}${ruta}`, { ...opciones, headers: cabeceras });
  } catch (e) {
    throw new ErrorDeRed('no hay conexión con la cuenca', 0, e?.message ?? null);
  }

  const texto = await r.text();
  let cuerpo = null;
  try { cuerpo = texto ? JSON.parse(texto) : null; } catch { cuerpo = texto; }

  if (!r.ok) {
    // Postgres, PostgREST y las Edge Functions ponen el motivo en sitios
    // distintos. Se buscan los tres antes de rendirse a un genérico.
    const motivo = cuerpo?.message ?? cuerpo?.error ?? cuerpo?.error_description
      ?? cuerpo?.msg ?? `error ${r.status}`;
    throw new ErrorDeRed(motivo, r.status, cuerpo);
  }
  return cuerpo;
}

/**
 * Sesión anónima. Es lo que mantiene la promesa de «sin cuenta»: identidad
 * estable sin pedir un correo. Se guarda y se reutiliza; si caduca, se refresca
 * sola, y si el refresco falla se empieza una nueva en vez de dejar el juego
 * colgado — perder la tribu es malo, no poder jugar es peor.
 */
export async function sesionAnonima() {
  const s = cargar();
  if (s?.access_token && s.expires_at * 1000 > Date.now() + 60_000) return s;

  if (s?.refresh_token) {
    try {
      const nueva = await pedir('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: s.refresh_token }),
      }, false);
      guardar(nueva);
      return nueva;
    } catch { /* se cae abajo y se empieza de cero */ }
  }

  const nueva = await pedir('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ data: {} }),
  }, false);
  guardar(nueva);
  return nueva;
}

/** Llama una función de la base de datos. */
export async function rpc(nombre, argumentos = {}) {
  await sesionAnonima();
  return pedir(`/rest/v1/rpc/${nombre}`, {
    method: 'POST',
    body: JSON.stringify(argumentos),
  });
}

/** Invoca una Edge Function. */
export async function funcion(nombre, cuerpo) {
  await sesionAnonima();
  return pedir(`/functions/v1/${nombre}`, {
    method: 'POST',
    body: JSON.stringify(cuerpo),
  });
}

/** Quién eres para el servidor. Null si aún no has entrado. */
export const usuarioActual = () => cargar()?.user ?? null;

/** Sólo para pruebas: olvida la sesión y empieza como alguien nuevo. */
export function olvidarSesion() {
  guardar(null);
}
