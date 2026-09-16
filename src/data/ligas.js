// DinoWar — las ligas: el ELO disfrazado de periodos geológicos.
//
// El número existe —`jugadores.elo`, 1200 al nacer— y lo mueve el servidor al
// cerrar cada duelo. Nadie lo ve. Lo que se ve es la liga, que es el ELO
// partido en tramos con nombre, y dentro de cada liga tres divisiones con una
// barra de 0 a 100. Es lo que hacen League of Legends y Pokémon TCG Live, y
// por la misma razón: un número que baja duele, una barra que sube engancha,
// y son la misma cosa.
//
// Los nombres son los tres periodos del Mesozoico, de más antiguo a más
// reciente: empiezas al principio del tiempo y subes hacia el final. El
// Jurásico queda en medio, donde va a vivir la mayoría, y es la casa del
// juego. La liga de arriba se llama Extinción porque es a lo que lleva el
// Cretácico: la cola de los que llegaron al final, con nombre y puesto.
//
// Es un fichero de DATOS, como las mecánicas y las misiones: cambiar los
// nombres, los tramos o el número de divisiones es tocar esto y nada más. Lo
// usan los dos lados —el cliente para pintar, el servidor para cerrar duelos—
// y por eso no importa nada del DOM.

// Cada liga tiene su METAL en el emblema, y es lo que la distingue de un
// vistazo: cobre con pátina, latón, oro con laca roja, y oro agrietado. La
// silueta del centro a 44 px apenas se lee; el color, sí.
export const LIGAS = Object.freeze([
  // `desde` es el ELO donde empieza la liga; la última no tiene techo.
  Object.freeze({ id: 'triasico', nombre: 'Triásico', desde: 0, metal: 'cobre', divisiones: 3 }),
  Object.freeze({ id: 'jurasico', nombre: 'Jurásico', desde: 1150, metal: 'latón', divisiones: 3 }),
  Object.freeze({ id: 'cretacico', nombre: 'Cretácico', desde: 1450, metal: 'oro', divisiones: 3 }),
  Object.freeze({ id: 'extincion', nombre: 'Extinción', desde: 1750, metal: 'oro roto', divisiones: 1 }),
]);

/** El emblema servido de una liga. Lo escribe `tools/ligas.py`. */
export const emblemaDe = (liga) => `assets/piel/ligas/liga_${liga.id}.webp`;

export const ELO = Object.freeze({
  inicial: 1200,
  // Cuánto mueve una partida. 32 es el clásico; alto al principio para que una
  // cuenta nueva encuentre su sitio en diez duelos y no en cuarenta.
  k: 32,
  kNuevo: 64,
  duelosDeNovato: 10,
  // Suelo: de Triásico III no se baja, y la fórmula tampoco puede bajar de aquí.
  suelo: 800,
});

/**
 * El escudo de descenso: al llegar a una liga se traen tres derrotas de
 * margen. Mientras queden, una derrota que te sacaría de la liga te deja en
 * su umbral y gasta una; se rellenan al SUBIR de liga. Es lo que hace que
 * subir se sienta ganado y no prestado: sin él, el ELO bajaba en cuanto
 * perdías y la promoción duraba una partida. Sólo protege el umbral de LIGA,
 * no el de división: bajar de Jurásico I a II es un mal día, bajar de
 * Jurásico a Triásico es perder el emblema.
 */
export const ESCUDO = Object.freeze({ derrotas: 3 });

/**
 * Las temporadas: cuatro semanas, contadas desde un lunes en UTC como las
 * misiones. Al cerrar el PRIMER duelo de una temporada nueva, el ELO vuelve a
 * medio camino del inicial —un reinicio blando—, así que quien está arriba
 * sigue arriba pero tiene que volver a demostrarlo, y quien dejó de jugar no
 * se queda clavado. No hay proceso que lo aplique a una hora: lo aplica el
 * servidor al cerrar el duelo, y el cliente lo enseña antes con `eloVigente`.
 */
export const TEMPORADA = Object.freeze({
  inicio: '2026-09-14',
  dias: 28,
  compresion: 0.5,
});

/** Número de temporada de un día 'AAAA-MM-DD'; 0 es la primera. */
export function temporadaDe(dia) {
  const ms = Date.parse(`${dia}T00:00:00Z`);
  const desde = Date.parse(`${TEMPORADA.inicio}T00:00:00Z`);
  if (!Number.isFinite(ms)) throw new Error(`día inválido: ${dia}`);
  return Math.max(0, Math.floor((ms - desde) / 86400000 / TEMPORADA.dias));
}

/** Primer día de la temporada siguiente a la de `dia`. */
export function finDeTemporada(dia) {
  const desde = Date.parse(`${TEMPORADA.inicio}T00:00:00Z`);
  const n = temporadaDe(dia) + 1;
  return new Date(desde + n * TEMPORADA.dias * 86400000).toISOString().slice(0, 10);
}

/** El ELO tras el reinicio blando: a medio camino del inicial, nunca bajo el suelo. */
export function reinicioDe(elo) {
  return Math.max(ELO.suelo, Math.round(ELO.inicial + (elo - ELO.inicial) * TEMPORADA.compresion));
}

/**
 * El ELO que vale HOY: el guardado, o el reiniciado si la temporada en que se
 * guardó ya pasó. Lo usan los dos lados: el servidor antes de calcular un
 * cierre, y el cliente para pintar la liga sin esperar a ese cierre. Se
 * reinicia una vez por salto y no una por temporada saltada: quien vuelve tras
 * tres meses no tiene que pagar tres veces.
 */
export function eloVigente(elo, temporadaGuardada, dia) {
  const actual = temporadaDe(dia);
  const guardada = Number.isInteger(temporadaGuardada) ? temporadaGuardada : actual;
  return guardada < actual ? reinicioDe(elo) : elo;
}

/**
 * Aplica el escudo a un cierre. Devuelve el ELO que queda y el escudo que
 * queda: si con el nuevo ELO se sube de liga, el escudo se rellena; si se
 * bajaría y quedan derrotas de margen, el ELO se queda en el umbral y se
 * gasta una.
 */
export function conEscudo(eloAntes, eloDespues, escudo) {
  const antes = ligaDe(eloAntes);
  const despues = ligaDe(eloDespues);
  const e = Number.isInteger(escudo) ? Math.max(0, escudo) : ESCUDO.derrotas;
  if (LIGAS.indexOf(despues) > LIGAS.indexOf(antes)) return { elo: eloDespues, escudo: ESCUDO.derrotas };
  if (eloDespues < antes.desde && e > 0) return { elo: antes.desde, escudo: e - 1 };
  return { elo: eloDespues, escudo: e };
}

/** La liga que corresponde a un ELO. */
export function ligaDe(elo) {
  let liga = LIGAS[0];
  for (const l of LIGAS) if (elo >= l.desde) liga = l;
  return liga;
}

/**
 * Liga, división y puntos de un ELO. La división se cuenta de III a I —la I
 * es la de arriba, como en LoL— y los puntos van de 0 a 100 dentro de ella.
 * En la liga de arriba no hay divisiones: los puntos son el ELO por encima
 * del umbral, que ahí lo que se enseña es el puesto.
 *
 * @returns {{liga: object, division: number, puntos: number, romano: string}}
 */
export function rangoDe(elo) {
  const liga = ligaDe(elo);
  const i = LIGAS.indexOf(liga);
  const techo = LIGAS[i + 1]?.desde ?? null;
  if (techo === null) {
    return { liga, division: 1, puntos: Math.max(0, elo - liga.desde), romano: '' };
  }
  const ancho = (techo - liga.desde) / liga.divisiones;
  const dentro = Math.max(0, elo - liga.desde);
  // División 0 es la de abajo (III), la última la de arriba (I).
  const d = Math.min(liga.divisiones - 1, Math.floor(dentro / ancho));
  const puntos = Math.round(((dentro - d * ancho) / ancho) * 100);
  const division = liga.divisiones - d;
  return { liga, division, puntos: Math.min(100, puntos), romano: ROMANOS[division] ?? '' };
}

const ROMANOS = { 1: 'I', 2: 'II', 3: 'III' };

/** «Jurásico II», o «Extinción» a secas. */
export function nombreDeRango(elo) {
  const r = rangoDe(elo);
  return r.romano ? `${r.liga.nombre} ${r.romano}` : r.liga.nombre;
}

/**
 * ELO de los dos tras un duelo. `resultadoA` es 1 si ganó A, 0 si ganó B,
 * 0,5 en tablas. Cada uno lleva su K: el novato se mueve el doble.
 *
 * @returns {{a: number, b: number}} redondeados y por encima del suelo
 */
export function eloTras(eloA, eloB, resultadoA, duelosA = 99, duelosB = 99) {
  const esperadoA = 1 / (1 + 10 ** ((eloB - eloA) / 400));
  const esperadoB = 1 - esperadoA;
  const kA = duelosA < ELO.duelosDeNovato ? ELO.kNuevo : ELO.k;
  const kB = duelosB < ELO.duelosDeNovato ? ELO.kNuevo : ELO.k;
  const a = Math.round(eloA + kA * (resultadoA - esperadoA));
  const b = Math.round(eloB + kB * ((1 - resultadoA) - esperadoB));
  return { a: Math.max(ELO.suelo, a), b: Math.max(ELO.suelo, b) };
}
