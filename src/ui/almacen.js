// DinoWar — persistencia de la colección del jugador.
//
// Es el ÚNICO módulo que toca localStorage. Todo lo demás recibe y devuelve
// objetos planos, así que las reglas de src/data/coleccion.js se pueden probar
// en Node sin navegador.
//
// Con la colección en el servidor esto cambió de PAPEL sin cambiar de forma:
// cuando hay cuenta, lo de aquí es una CACHÉ de lo que dijo el servidor y quien
// manda es src/ui/perfil.js. Sigue siendo la verdad cuando se juega sin
// servidor o sin conexión, que es el caso que este fichero nunca ha dejado de
// cubrir.
//
// Nada de lo que hay aquí es crítico: si el almacenamiento falla —modo privado,
// cuota llena, permisos— se juega igual con un perfil en memoria que se pierde
// al cerrar. Un juego que se niega a arrancar porque no puede guardar es peor
// que uno que no guarda.

import { CARTAS, existeCarta } from '../data/cards.js';
import { ECONOMIA, coleccionInicial, mazoPorDefecto, TAM_MAZO } from '../data/coleccion.js';

const CLAVE = 'dinowar.perfil.v1';

/** Perfil de un jugador que acaba de llegar: puede jugar ya, sin abrir nada. */
export function perfilInicial() {
  return {
    v: 1,
    monedas: ECONOMIA.monedasInicio,
    cartas: coleccionInicial(),
    mazos: [{ id: null, nombre: 'Morrison', cartas: mazoPorDefecto() }],
    activo: 0,
    sobresAbiertos: 0,
    // Vienen del servidor cuando hay cuenta. Sin ella no significan nada, pero
    // tienen que existir para que las pantallas no lean undefined.
    elo: 1200,
    apodo: null,
    apodoRestantes: 0,
    dificultad: 'heuristica',
  };
}

/**
 * Limpia lo que venga de disco. Un perfil guardado por una versión anterior, o
 * editado a mano, no debe poder romper el juego: lo que no se reconoce se cae.
 */
function sanear(bruto) {
  const base = perfilInicial();
  if (!bruto || typeof bruto !== 'object') return base;

  const cartas = {};
  for (const [id, n] of Object.entries(bruto.cartas ?? {})) {
    // existeCarta y no CARTAS: las cartas de jefe no están en el set y aun así
    // son tuyas. Filtrar por el set las borraba en la primera recarga.
    if (existeCarta(id) && Number.isFinite(n) && n > 0) cartas[id] = Math.floor(n);
  }

  const mazos = (Array.isArray(bruto.mazos) ? bruto.mazos : [])
    .map((m, i) => {
      const c = {};
      for (const [id, n] of Object.entries(m?.cartas ?? {})) {
        if (existeCarta(id) && Number.isFinite(n) && n > 0) c[id] = Math.floor(n);
      }
      // El id lo pone el servidor; un mazo creado sin conexión no lo tiene y
      // se queda en null hasta que se guarde con cuenta.
      const idMazo = typeof m?.id === 'string' ? m.id : null;
      return { id: idMazo, nombre: String(m?.nombre ?? `Mazo ${i + 1}`).slice(0, 24), cartas: c };
    })
    .slice(0, 12);

  return {
    v: 1,
    monedas: Number.isFinite(bruto.monedas) ? Math.max(0, Math.floor(bruto.monedas)) : base.monedas,
    cartas: Object.keys(cartas).length ? cartas : base.cartas,
    mazos: mazos.length ? mazos : base.mazos,
    activo: Number.isFinite(bruto.activo) ? Math.max(0, Math.floor(bruto.activo)) : 0,
    sobresAbiertos: Number.isFinite(bruto.sobresAbiertos) ? Math.floor(bruto.sobresAbiertos) : 0,
    elo: Number.isFinite(bruto.elo) ? Math.floor(bruto.elo) : base.elo,
    apodo: typeof bruto.apodo === 'string' ? bruto.apodo.slice(0, 24) : null,
    apodoRestantes: Number.isFinite(bruto.apodoRestantes) ? Math.max(0, Math.floor(bruto.apodoRestantes)) : 0,
    dificultad: bruto.dificultad === 'aleatoria' ? 'aleatoria' : base.dificultad,
  };
}

let memoria = null;

export function cargarPerfil() {
  if (memoria) return memoria;
  let bruto = null;
  try {
    bruto = JSON.parse(localStorage.getItem(CLAVE));
  } catch {
    bruto = null;   // sin almacenamiento se juega igual, sin guardar
  }
  memoria = sanear(bruto);
  if (memoria.activo >= memoria.mazos.length) memoria.activo = 0;
  return memoria;
}

export function guardarPerfil(perfil) {
  memoria = perfil;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(perfil));
    return true;
  } catch {
    return false;   // el perfil sigue vivo en memoria hasta cerrar la pestaña
  }
}

/** Aplica un cambio sobre el perfil y lo guarda. Devuelve el perfil nuevo. */
export function actualizarPerfil(cambio) {
  const p = { ...cargarPerfil(), ...cambio };
  guardarPerfil(p);
  return p;
}

/** Mazo activo, o el de por defecto si el guardado no da 50 cartas. */
export function mazoActivo() {
  const p = cargarPerfil();
  const m = p.mazos[p.activo] ?? p.mazos[0];
  const total = Object.values(m?.cartas ?? {}).reduce((a, b) => a + b, 0);
  return total === TAM_MAZO ? m.cartas : mazoPorDefecto();
}

export function borrarPerfil() {
  memoria = null;
  try { localStorage.removeItem(CLAVE); } catch { /* ya está */ }
}
