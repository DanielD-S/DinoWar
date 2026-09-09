// DinoWar — la Cuenca SIN servidor: todo en este navegador.
//
// Es la implementación de reserva de red.js. Se usa cuando no hay servidor
// configurado, cuando no hay conexión, o para probar sin tocar nada de fuera.
//
// LO QUE ESTO NO ES: multijugador. Aquí tus compañeros de tribu no son
// personas — son un modelo de lo que haría una tribu, con las mismas reglas y
// los mismos números. El bucle de un jugador es idéntico; la gente al otro lado
// no está. La pantalla lo dice, para que nadie lo descubra jugando.

import {
  CUENCA, DIA, acumular, aplicarAsalto, mereceRecompensa,
} from '../data/tribu.js';
import { JEFES, jefeActivo, ventanaDe } from '../data/eventos.js';

const CLAVE = 'dinowar.cuenca.v1';
export const YO = 'tú';

/** Compañeros simulados. Nombres de gente que excava, no de gamertags. */
const COMPANEROS = Object.freeze([
  { id: 'Ana', ritmo: 0.9 }, { id: 'Bruno', ritmo: 0.6 },
  { id: 'Chen', ritmo: 1.2 }, { id: 'Dara', ritmo: 0.4 },
  { id: 'Emil', ritmo: 0.75 },
]);

function inicial(ahora) {
  return {
    v: 1,
    arranque: ahora,
    yacimiento: { nivel: 1, fosiles: 0, desde: ahora },
    almacen: 600,          // para el primer par de asaltos, que si no la
                           // pantalla se abre con todo bloqueado
    aportado: 0,
    asaltos: { dia: 0, hechos: 0 },
    jefes: {},             // id de evento → { vida, aportes, caidoEn, reclamado }
    cartas: [],            // recompensas de jefe ya reclamadas
    ultimaVisita: ahora,
  };
}

function sanear(bruto, ahora) {
  const base = inicial(ahora);
  if (!bruto || typeof bruto !== 'object') return base;
  const num = (v, d) => (Number.isFinite(v) ? v : d);
  return {
    ...base,
    arranque: num(bruto.arranque, ahora),
    yacimiento: {
      nivel: Math.min(CUENCA.nivelMaximo, Math.max(1, Math.floor(num(bruto.yacimiento?.nivel, 1)))),
      fosiles: Math.max(0, Math.floor(num(bruto.yacimiento?.fosiles, 0))),
      desde: num(bruto.yacimiento?.desde, ahora),
    },
    almacen: Math.max(0, Math.floor(num(bruto.almacen, base.almacen))),
    aportado: Math.max(0, Math.floor(num(bruto.aportado, 0))),
    asaltos: {
      dia: Math.floor(num(bruto.asaltos?.dia, 0)),
      hechos: Math.max(0, Math.floor(num(bruto.asaltos?.hechos, 0))),
    },
    jefes: (bruto.jefes && typeof bruto.jefes === 'object') ? bruto.jefes : {},
    cartas: Array.isArray(bruto.cartas) ? bruto.cartas.filter((x) => typeof x === 'string') : [],
    ultimaVisita: num(bruto.ultimaVisita, ahora),
  };
}

let memoria = null;

function cargar(ahora) {
  if (memoria) return memoria;
  let bruto = null;
  try { bruto = JSON.parse(localStorage.getItem(CLAVE)); } catch { bruto = null; }
  memoria = sanear(bruto, ahora);
  return memoria;
}

function guardar(c) {
  memoria = c;
  try { localStorage.setItem(CLAVE, JSON.stringify(c)); } catch { /* se juega igual */ }
  return c;
}

/** Día de la cuenca, para el tope de asaltos diarios. */
const diaDe = (c, ahora) => Math.floor((ahora - c.arranque) / DIA);

/**
 * Lo que la tribu hizo mientras no estabas. Es la parte que un servidor haría
 * de verdad; aquí se deduce del tiempo transcurrido, con el mismo ritmo para
 * cada compañero, así que dos visitas al mismo instante dan lo mismo.
 *
 * Determinista a propósito: nada de `Math.random()`. Si al abrir la pantalla
 * los números bailaran, no habría forma de saber si un aporte tuyo entró.
 */
function avanzarCompaneros(c, ahora, jefe) {
  const horas = Math.max(0, (ahora - c.ultimaVisita) / 3600_000);
  if (horas < 0.02) return c;

  let almacen = c.almacen;
  for (const p of COMPANEROS) almacen += Math.floor(horas * CUENCA.fosilesPorHora * p.ritmo * 0.5);

  const jefes = { ...c.jefes };
  if (jefe) {
    const estado = jefes[jefe.evento.id] ?? nuevoJefe(jefe);
    if (estado.vida > 0) {
      const aportes = { ...estado.aportes };
      let vida = estado.vida;
      for (const p of COMPANEROS) {
        // Un compañero asalta si la tribu puede pagarlo. El daño por asalto es
        // del orden del de un jugador humano: unos 90 de media.
        const asaltos = Math.min(
          Math.floor(horas / 4 * p.ritmo),
          Math.floor(almacen / CUENCA.costeAsalto),
        );
        if (asaltos <= 0) continue;
        const dano = Math.min(vida, asaltos * Math.round(70 + 40 * p.ritmo));
        vida -= dano;
        almacen -= asaltos * CUENCA.costeAsalto;
        aportes[p.id] = (aportes[p.id] ?? 0) + dano;
        if (vida <= 0) break;
      }
      jefes[jefe.evento.id] = {
        ...estado,
        vida: Math.max(0, vida),
        aportes,
        caidoEn: vida <= 0 && estado.vida > 0 ? ahora : estado.caidoEn,
      };
    }
  }
  return { ...c, almacen, jefes, ultimaVisita: ahora };
}

const nuevoJefe = (jefe) => ({
  vida: jefe.jefe.vidaMaxima, vidaMaxima: jefe.jefe.vidaMaxima,
  aportes: {}, caidoEn: null, reclamado: false,
});

// ------------------------------------------------------------------ la costura

/**
 * Foto completa de la cuenca en este instante. Es la única lectura: todo lo que
 * la pantalla necesita sale de aquí, así que un servidor sólo tiene que saber
 * devolver esta forma.
 */
export function estadoDeTribu(ahora = Date.now()) {
  let c = cargar(ahora);

  // El yacimiento acumula con la pestaña cerrada, por diferencia de reloj.
  const y = acumular(c.yacimiento, ahora);
  const activo = jefeActivo(c.arranque, ahora);
  c = { ...c, yacimiento: { nivel: c.yacimiento.nivel, fosiles: y.fosiles, desde: y.desde } };
  c = avanzarCompaneros(c, ahora, activo);

  // El tope de asaltos es por día de cuenca, no por sesión.
  const hoy = diaDe(c, ahora);
  if (c.asaltos.dia !== hoy) c = { ...c, asaltos: { dia: hoy, hechos: 0 } };

  if (activo && !c.jefes[activo.evento.id]) {
    c = { ...c, jefes: { ...c.jefes, [activo.evento.id]: nuevoJefe(activo) } };
  }
  guardar(c);

  const jefe = activo ? { ...JEFES[activo.evento.jefe], ...c.jefes[activo.evento.id],
    ...ventanaDe(activo.evento, c.arranque, ahora), evento: activo.evento } : null;

  return {
    arranque: c.arranque,
    yacimiento: c.yacimiento,
    ganadosDesdeLaUltima: y.ganados,
    almacen: c.almacen,
    aportado: c.aportado,
    asaltosHoy: c.asaltos.hechos,
    jefe,
    cartas: c.cartas,
    miembros: [YO, ...COMPANEROS.map((p) => p.id)],
    puedeReclamar: !!(jefe && mereceRecompensa(jefe, YO) && !c.jefes[activo.evento.id].reclamado),
  };
}

/** Aporta fósiles del yacimiento al almacén común. Devuelve cuánto entró. */
export function aportar(fosiles, ahora = Date.now()) {
  const c = cargar(ahora);
  const cantidad = Math.max(0, Math.min(Math.floor(fosiles), c.yacimiento.fosiles));
  if (cantidad === 0) return 0;
  guardar({
    ...c,
    yacimiento: { ...c.yacimiento, fosiles: c.yacimiento.fosiles - cantidad },
    almacen: c.almacen + cantidad,
    aportado: c.aportado + cantidad,
  });
  return cantidad;
}

/** Sube el yacimiento. Se paga con los mismos fósiles que se aportan. */
export function mejorarYacimiento(coste, ahora = Date.now()) {
  const c = cargar(ahora);
  if (c.yacimiento.fosiles < coste || c.yacimiento.nivel >= CUENCA.nivelMaximo) return false;
  guardar({
    ...c,
    yacimiento: {
      ...c.yacimiento,
      nivel: c.yacimiento.nivel + 1,
      fosiles: c.yacimiento.fosiles - coste,
    },
  });
  return true;
}

/** Le hace daño al jefe y cobra el asalto del almacén común. */
export function asaltar(dano, ahora = Date.now()) {
  const c = cargar(ahora);
  const activo = jefeActivo(c.arranque, ahora);
  if (!activo) return null;
  const clave = activo.evento.id;
  const antes = c.jefes[clave] ?? nuevoJefe(activo);
  const despues = aplicarAsalto({ almacen: c.almacen, jefe: antes, ahora }, YO, dano);
  guardar({
    ...c,
    almacen: despues.almacen,
    jefes: { ...c.jefes, [clave]: despues.jefe },
    asaltos: { dia: diaDe(c, ahora), hechos: c.asaltos.hechos + 1 },
  });
  return { vida: despues.jefe.vida, cayo: despues.jefe.vida === 0 && antes.vida > 0 };
}

/** Coge la carta de un jefe caído al que aportaste. Devuelve su id, o null. */
export function reclamar(ahora = Date.now()) {
  const c = cargar(ahora);
  const activo = jefeActivo(c.arranque, ahora);
  if (!activo) return null;
  const estado = c.jefes[activo.evento.id];
  if (!estado || estado.reclamado || !mereceRecompensa(estado, YO)) return null;
  const cardId = JEFES[activo.evento.jefe].recompensa;
  guardar({
    ...c,
    jefes: { ...c.jefes, [activo.evento.id]: { ...estado, reclamado: true } },
    cartas: c.cartas.includes(cardId) ? c.cartas : [...c.cartas, cardId],
  });
  return cardId;
}

/** Sólo para pruebas y para el modo ?pruebas=1: vuelve a empezar la cuenca. */
export function borrarCuenca() {
  memoria = null;
  try { localStorage.removeItem(CLAVE); } catch { /* ya está */ }
}
