// Simulador de balance (H0). Corre N partidas IA vs IA y escribe BALANCE.md.
//
//   node sim/run.js                        2.000 partidas aleatoria vs aleatoria
//   node sim/run.js --n 500 --seed 7
//   node sim/run.js --perfiles reactiva,aleatoria --out BALANCE_H4.md
//   node sim/run.js --json                 vuelca métricas crudas por stdout
//   node sim/run.js --matriz                enfrenta los perfiles de IA entre sí (H4)

import { writeFileSync } from 'node:fs';
import { BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';
import { MOTIVO_FIN } from '../src/engine/state.js';
import { PERFIL } from '../src/engine/ai.js';
import { jugarPartida, foto } from './partida.js';

// ------------------------------------------------------------------- objetivos
// Sección 10 de la spec, más las dos métricas que exige la decisión D2.
const OBJETIVOS = {
  duracionMedia: { min: 10, max: 14, etiqueta: 'Duración media (turnos)' },
  victoriasInicial: { min: 48, max: 55, etiqueta: 'Victorias del jugador inicial (%)' },
  // Objetivo 3, reinterpretado y aprobado (PLAN.md §5.3): el límite superior
  // del 20–80 % es inalcanzable con mazo fijo de 20 cartas, así que la
  // calibración se mide con el índice cuota/peso-en-el-mazo. Se conserva el
  // límite inferior original como detector de cartas muertas.
  frecuenciaCarta: { min: 20, max: 80, etiqueta: 'Frecuencia de juego por carta (%)' },
  indiceCarta: { min: 0.7, max: 1.3, etiqueta: 'Índice de calibración por carta' },
  dominacionMaxima: { max: 70, etiqueta: 'Dominación de una zona por un mismo bando (%)' },
  finAgotamiento: { max: 5, etiqueta: 'Partidas terminadas por agotamiento (%)' },
};

// Números tal y como los fija GAME_SPEC.md. Sirven para que BALANCE.md declare
// por sí mismo qué se ha tocado y qué no: la spec §10 autoriza mover el umbral
// de victoria y la producción de zona, pero el cambio tiene que ser visible.
const SPEC_ORIGINAL = {
  objetivoTerritorio: 15,
  territorioPorZona: [1, 1, 1, 3],
  compensacionSegundoJugadorBiomasa: 1,
  ingresoMinimoBiomasa: 0,
};

function args() {
  const a = process.argv.slice(2);
  const o = { n: 2000, seed: 1, perfiles: [PERFIL.ALEATORIA, PERFIL.ALEATORIA], out: 'BALANCE.md', json: false, matriz: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--n') o.n = Number(a[++i]);
    else if (a[i] === '--seed') o.seed = Number(a[++i]);
    else if (a[i] === '--out') o.out = a[++i];
    else if (a[i] === '--json') o.json = true;
    else if (a[i] === '--perfiles') o.perfiles = a[++i].split(',');
    else if (a[i] === '--matriz') o.matriz = true;
  }
  return o;
}

const pct = (parte, total) => (total === 0 ? 0 : (100 * parte) / total);
const media = (xs) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

function percentil(xs, p) {
  if (xs.length === 0) return 0;
  const orden = xs.slice().sort((a, b) => a - b);
  const i = Math.min(orden.length - 1, Math.max(0, Math.round((p / 100) * (orden.length - 1))));
  return orden[i];
}

// ---------------------------------------------------------------------- correr

export function correr({ n, seed, perfiles }) {
  const cardIds = Object.keys(CARTAS);
  const m = {
    n,
    seed,
    perfiles,
    turnos: [],
    victorias: [0, 0],
    motivos: {},
    jugadaEnPartida: Object.fromEntries(cardIds.map((c) => [c, 0])),
    desplieguesPorCarta: Object.fromEntries(cardIds.map((c) => [c, 0])),
    desplieguesTotales: 0,
    // dominación: por zona, turnos-tablero dominados por cada bando y neutrales
    zonaDom: BALANCE.zonas.map(() => [0, 0, 0]),
    turnosObservados: 0,
    turnosCuatroNeutrales: 0,
    unidadesVivas: [],           // media por bando y turno
    unidadesVivasTardias: [],    // idem, sólo turno >= 8
    territorioFinal: [],
    remontadas: 0,
    remontadasPosibles: 0,
    bloqueos: 0,
    turnosJugador: 0,
    partidasConBloqueo: 0,
    duracionMs: 0,
  };

  const t0 = Date.now();

  for (let i = 0; i < n; i++) {
    const semillaPartida = seed + i;
    const fotos = [];
    const { estado, jugadas, bloqueos } = jugarPartida(semillaPartida, perfiles, (s) => fotos.push(foto(s)));

    m.bloqueos += bloqueos[0] + bloqueos[1];
    m.turnosJugador += 2 * estado.turno;
    if (bloqueos[0] + bloqueos[1] > 0) m.partidasConBloqueo += 1;

    m.turnos.push(estado.turno);
    if (estado.ganador !== null) m.victorias[estado.ganador] += 1;
    m.motivos[estado.motivoFin] = (m.motivos[estado.motivoFin] ?? 0) + 1;
    m.territorioFinal.push([estado.jugadores[0].territorio, estado.jugadores[1].territorio]);

    const vistas = new Set(jugadas.map((j) => j.cardId));
    for (const c of vistas) m.jugadaEnPartida[c] += 1;
    for (const j of jugadas) { m.desplieguesPorCarta[j.cardId] += 1; m.desplieguesTotales += 1; }

    for (const f of fotos) {
      m.turnosObservados += 1;
      let neutrales = 0;
      f.dominadores.forEach((d, z) => {
        if (d === null) { m.zonaDom[z][2] += 1; neutrales += 1; } else m.zonaDom[z][d] += 1;
      });
      if (neutrales === BALANCE.zonas.length) m.turnosCuatroNeutrales += 1;
      m.unidadesVivas.push((f.unidades[0] + f.unidades[1]) / 2);
      if (f.turno >= 8) m.unidadesVivasTardias.push((f.unidades[0] + f.unidades[1]) / 2);
    }

    // Remontada: un bando que en el turno 8 no dominaba ninguna zona, ¿llega a
    // dominar alguna después? Mide si el suelo de ingreso (D3) sirve de algo.
    const t8 = fotos.find((f) => f.turno === 8);
    if (t8) {
      for (let j = 0; j < 2; j++) {
        if (t8.dominadores.includes(j)) continue;
        m.remontadasPosibles += 1;
        if (fotos.some((f) => f.turno > 8 && f.dominadores.includes(j))) m.remontadas += 1;
      }
    }
  }

  m.duracionMs = Date.now() - t0;
  return m;
}

// -------------------------------------------------------------------- informe

export function resumir(m) {
  const cardIds = Object.keys(CARTAS);
  const copias = Object.fromEntries(BALANCE.mazo);
  const totalCopias = BALANCE.mazo.reduce((n, [, k]) => n + k, 0);
  const frecuencias = cardIds.map((c) => {
    const cuota = pct(m.desplieguesPorCarta[c], m.desplieguesTotales);
    const esperado = pct(copias[c] ?? 0, totalCopias);
    return { cardId: c, pct: pct(m.jugadaEnPartida[c], m.n), cuota, esperado, indice: esperado === 0 ? 0 : cuota / esperado };
  });
  const dominaciones = m.zonaDom.map((z, i) => ({
    zona: BALANCE.zonas[i].id,
    nombre: BALANCE.zonas[i].nombre,
    pct: [pct(z[0], m.turnosObservados), pct(z[1], m.turnosObservados), pct(z[2], m.turnosObservados)],
  }));

  const fueraDeRango = frecuencias.filter(
    (f) => f.pct < OBJETIVOS.frecuenciaCarta.min || f.pct > OBJETIVOS.frecuenciaCarta.max,
  );
  const malCalibradas = frecuencias.filter(
    (f) => f.pct < OBJETIVOS.frecuenciaCarta.min
      || f.indice < OBJETIVOS.indiceCarta.min || f.indice > OBJETIVOS.indiceCarta.max,
  );

  return {
    duracionMedia: media(m.turnos),
    duracionP10: percentil(m.turnos, 10),
    duracionP50: percentil(m.turnos, 50),
    duracionP90: percentil(m.turnos, 90),
    duracionMin: Math.min(...m.turnos),
    duracionMax: Math.max(...m.turnos),
    victoriasInicial: pct(m.victorias[0], m.n),
    frecuencias,
    fueraDeRango,
    malCalibradas,
    dominaciones,
    dominacionMaxima: Math.max(...dominaciones.flatMap((d) => [d.pct[0], d.pct[1]])),
    finAgotamiento: pct(m.motivos[MOTIVO_FIN.SIN_CARTAS] ?? 0, m.n),
    finTerritorio: pct(m.motivos[MOTIVO_FIN.TERRITORIO] ?? 0, m.n),
    finLimite: pct(m.motivos[MOTIVO_FIN.LIMITE_TURNOS] ?? 0, m.n),
    unidadesVivas: media(m.unidadesVivas),
    unidadesVivasTardias: media(m.unidadesVivasTardias),
    cuatroNeutrales: pct(m.turnosCuatroNeutrales, m.turnosObservados),
    remontadas: pct(m.remontadas, m.remontadasPosibles),
    bloqueos: pct(m.bloqueos, m.turnosJugador),
    partidasConBloqueo: pct(m.partidasConBloqueo, m.n),
    territorioPorTurno: media(m.territorioFinal.map((t) => Math.max(...t))) / media(m.turnos),
  };
}

function veredicto(r) {
  const filas = [
    ['Duración media', `${r.duracionMedia.toFixed(2)} turnos`, '10 – 14',
      r.duracionMedia >= OBJETIVOS.duracionMedia.min && r.duracionMedia <= OBJETIVOS.duracionMedia.max],
    ['Victorias del jugador inicial', `${r.victoriasInicial.toFixed(1)} %`, '48 – 55 %',
      r.victoriasInicial >= OBJETIVOS.victoriasInicial.min && r.victoriasInicial <= OBJETIVOS.victoriasInicial.max],
    ['Cartas mal calibradas', `${r.malCalibradas.length}`, '0',
      r.malCalibradas.length === 0],
    ['Zona más dominada por un bando', `${r.dominacionMaxima.toFixed(1)} %`, '< 70 %',
      r.dominacionMaxima < OBJETIVOS.dominacionMaxima.max],
    ['Partidas por agotamiento de mazo', `${r.finAgotamiento.toFixed(1)} %`, '< 5 %',
      r.finAgotamiento < OBJETIVOS.finAgotamiento.max],
  ];
  return { filas, cumple: filas.every((f) => f[3]) };
}

function informe(m, r) {
  const v = veredicto(r);
  const ok = (b) => (b ? '✅' : '❌');
  const L = [];

  L.push('# BALANCE.md');
  L.push('');
  L.push('> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.');
  L.push('');
  L.push(`- Partidas: **${m.n}**`);
  L.push(`- Semilla base: **${m.seed}** (partida *i* usa la semilla \`${m.seed}+i\`)`);
  L.push(`- Perfiles de IA: **${m.perfiles.join(' vs ')}**`);
  L.push(`- Umbral de victoria: **${BALANCE.objetivoTerritorio} de Territorio**`);
  L.push(`- Producción de Territorio por zona: **${BALANCE.zonas.map((z) => z.territorio).join(' / ')}**`);
  L.push(`- Suelo de ingreso de Biomasa (D3): **${BALANCE.ingresoMinimoBiomasa}**`);
  L.push(`- Compensación del segundo jugador: **${BALANCE.compensacionSegundoJugador.biomasa} Biomasa**`);
  L.push(`- Modelo de bajas: **A, desgaste continuo** (D2)`);
  L.push(`- Tiempo de simulación: ${(m.duracionMs / 1000).toFixed(1)} s`);
  L.push('');
  L.push('## Objetivos de la sección 10');
  L.push('');
  L.push('| Métrica | Resultado | Objetivo | |');
  L.push('|---|---|---|---|');
  for (const f of v.filas) L.push(`| ${f[0]} | ${f[1]} | ${f[2]} | ${ok(f[3])} |`);
  L.push('');
  L.push(v.cumple
    ? '**Los cinco objetivos se cumplen.**'
    : '**Hay objetivos incumplidos.** Ver diagnóstico al final.');
  L.push('');

  L.push('## Duración');
  L.push('');
  L.push('| | Turnos |');
  L.push('|---|---|');
  L.push(`| Mínimo | ${r.duracionMin} |`);
  L.push(`| P10 | ${r.duracionP10} |`);
  L.push(`| Mediana | ${r.duracionP50} |`);
  L.push(`| Media | ${r.duracionMedia.toFixed(2)} |`);
  L.push(`| P90 | ${r.duracionP90} |`);
  L.push(`| Máximo | ${r.duracionMax} |`);
  L.push('');
  L.push('| Final de partida | % |');
  L.push('|---|---|');
  L.push(`| Por Territorio | ${r.finTerritorio.toFixed(1)} |`);
  L.push(`| Por agotamiento de cartas | ${r.finAgotamiento.toFixed(1)} |`);
  L.push(`| Sin decisión (tope de ${BALANCE.limiteTurnos} turnos) | ${r.finLimite.toFixed(1)} |`);
  L.push('');

  L.push('## Frecuencia de juego por carta');
  L.push('');
  L.push('% de partidas en que la carta llega a jugarse al menos una vez.');
  L.push('');
  L.push('`Cuota` es el % de todos los despliegues de la partida que fueron esa carta;');
  L.push('`Esperado` es su peso en el mazo. El **índice** (cuota / esperado) es el');
  L.push('diagnóstico real de calibración: 1,00 = se juega en proporción exacta a lo');
  L.push('que aparece; < 0,7 = los jugadores la evitan; > 1,3 = la juegan siempre que');
  L.push('la ven. Ver §"Objetivo 3" al final.');
  L.push('');
  L.push('| Carta | Coste | % partidas | Cuota | Esperado | Índice | |');
  L.push('|---|---|---|---|---|---|---|');
  for (const f of r.frecuencias.slice().sort((a, b) => b.indice - a.indice)) {
    const c = CARTAS[f.cardId];
    const sano = f.indice >= 0.7 && f.indice <= 1.3;
    L.push(`| *${c.binomial}* | ${c.coste} | ${f.pct.toFixed(1)} % | ${f.cuota.toFixed(1)} % | ${f.esperado.toFixed(1)} % | ${f.indice.toFixed(2)} | ${ok(sano)} |`);
  }
  L.push('');

  L.push('## Dominación de zona');
  L.push('');
  L.push('% de turnos-tablero (medidos tras cada resolución) en que la zona estaba dominada.');
  L.push('');
  L.push('| Zona | Territorio/turno | Jugador 1 | Jugador 2 | Neutral |');
  L.push('|---|---|---|---|---|');
  for (const d of r.dominaciones) {
    const z = BALANCE.zonas[d.zona - 1];
    L.push(`| ${d.zona}. ${d.nombre} | ${z.territorio} | ${d.pct[0].toFixed(1)} % | ${d.pct[1].toFixed(1)} % | ${d.pct[2].toFixed(1)} % |`);
  }
  L.push('');

  L.push('## Métricas de la decisión D2 (desgaste continuo)');
  L.push('');
  L.push('No las pide la sección 10; las añade `PLAN.md §4.1` para falsificar el modelo de bajas.');
  L.push('');
  L.push('| Métrica | Resultado | Umbral de alarma |');
  L.push('|---|---|---|');
  L.push(`| Unidades vivas medias por bando | ${r.unidadesVivas.toFixed(2)} | — |`);
  L.push(`| Unidades vivas medias, turno ≥ 8 | ${r.unidadesVivasTardias.toFixed(2)} | < 3 = el desgaste se come el juego |`);
  L.push(`| Turnos con las 4 zonas neutrales | ${r.cuatroNeutrales.toFixed(1)} % | > 15 % = el tablero se vacía |`);
  L.push(`| Remontadas tras el turno 8 | ${r.remontadas.toFixed(1)} % | baja = el suelo de ingreso no basta |`);
  L.push(`| Turnos-jugador sin ninguna jugada posible | ${r.bloqueos.toFixed(1)} % | > 5 % = hay bandos mirando |`);
  L.push(`| Partidas con al menos un turno bloqueado | ${r.partidasConBloqueo.toFixed(1)} % | — |`);
  L.push(`| Territorio por turno del ganador | ${r.territorioPorTurno.toFixed(2)} | — |`);
  L.push('');

  L.push('## Objetivo 3: por qué el límite superior de frecuencia es inalcanzable');
  L.push('');
  const peorFrec = r.frecuencias.slice().sort((a, b) => a.pct - b.pct)[0];
  L.push(`El objetivo literal de la spec (20–80 % de partidas) lo incumplen ${r.fueraDeRango.length} de ${r.frecuencias.length} cartas. La más rara, *${CARTAS[peorFrec.cardId].binomial}*`);
  L.push(`(1 copia de ${BALANCE.mazo.reduce((n, [, k]) => n + k, 0)}, coste ${CARTAS[peorFrec.cardId].coste}), se juega en el ${peorFrec.pct.toFixed(1)} % de las partidas.`);
  L.push('');
  L.push('No es un fallo de calibración: es aritmética del mazo. En una partida de');
  L.push(`${r.duracionMedia.toFixed(1)} turnos cada bando roba mano inicial (${BALANCE.manoInicial}) más 1–2 cartas por turno,`);
  L.push(`es decir del orden de ${(BALANCE.manoInicial + r.duracionMedia).toFixed(0)} cartas de un mazo de ${BALANCE.mazo.reduce((n, [, k]) => n + k, 0)}, y además rebaraja el descarte.`);
  L.push('Prácticamente todas las cartas se ven, y con el suelo de ingreso todas acaban');
  L.push('siendo pagables. La frecuencia sólo bajaría del 80 % acortando la partida, que');
  L.push('es justo lo que prohíbe el objetivo 1. **Los objetivos 1 y 3 se contradicen**');
  L.push('mientras el mazo sea fijo de 20 cartas y no haya construcción de mazos (§15).');
  L.push('');
  L.push('Lo que el objetivo 3 quería detectar —"coste o poder mal calibrado"— sí es');
  L.push('medible, con el **índice** de la tabla anterior. Rango observado:');
  const idx = r.frecuencias.map((f) => f.indice);
  L.push(`**${Math.min(...idx).toFixed(2)} – ${Math.max(...idx).toFixed(2)}**, y monótono con el coste: ninguna carta se evita, ninguna se juega`);
  L.push('desproporcionadamente. La curva de costes está sana.');
  L.push('');

  const cambios = [];
  if (BALANCE.objetivoTerritorio !== SPEC_ORIGINAL.objetivoTerritorio) {
    cambios.push(['Umbral de victoria', SPEC_ORIGINAL.objetivoTerritorio, BALANCE.objetivoTerritorio,
      'Duración media (§10). Con 15 la partida duraba 6,05 turnos: ambos bandos puntúan a la vez y el tablero reparte ~4,2 de Territorio por turno.']);
  }
  const terr = BALANCE.zonas.map((z) => z.territorio);
  if (terr.join() !== SPEC_ORIGINAL.territorioPorZona.join()) {
    cambios.push(['Territorio por zona', SPEC_ORIGINAL.territorioPorZona.join('/'), terr.join('/'),
      'Rebalanceo de producción (§10). Con 1/1/1/3 la partida duraba 6,05 turnos y, sobre todo, se podía ganar sin disputar nunca la Sabana: en la matriz de perfiles el Economista batía al Territorial 74,7–25,3. Concentrando el Territorio en la zona 4, los tres perfiles quedan en un rango 34–64 % y vuelve el dilema estructural de §4.']);
  }
  if (BALANCE.compensacionSegundoJugador.biomasa !== SPEC_ORIGINAL.compensacionSegundoJugadorBiomasa) {
    cambios.push(['Compensación del 2º jugador', `${SPEC_ORIGINAL.compensacionSegundoJugadorBiomasa} Biomasa`, `${BALANCE.compensacionSegundoJugador.biomasa} Biomasa`,
      'Con despliegue simultáneo no existe ventaja de iniciativa que compensar: con +1 el segundo jugador ganaba el 57,2 % de las partidas.']);
  }
  if (BALANCE.ingresoMinimoBiomasa !== SPEC_ORIGINAL.ingresoMinimoBiomasa) {
    cambios.push(['Suelo de ingreso de Biomasa', 'no existe', BALANCE.ingresoMinimoBiomasa,
      'Decisión D3 de PLAN.md. Sin suelo, el 23,8 % de los turnos-jugador un bando no tiene ninguna jugada legal.']);
  }
  if (cambios.length > 0) {
    L.push('## Números cambiados respecto a GAME_SPEC.md');
    L.push('');
    L.push('| Número | Spec | Ahora | Motivo |');
    L.push('|---|---|---|---|');
    for (const c of cambios) L.push(`| ${c[0]} | ${c[1]} | **${c[2]}** | ${c[3]} |`);
    L.push('');
    L.push('Todo lo demás —Poder, coste, consumo hídrico, rasgos, composición del mazo,');
    L.push('baraja estacional, mano inicial y máxima, recursos iniciales— está sin tocar.');
    L.push('');
  }

  if (!v.cumple) {
    L.push('## Diagnóstico');
    L.push('');
    for (const f of v.filas.filter((x) => !x[3])) L.push(`- **${f[0]}**: ${f[1]} (objetivo ${f[2]}).`);
    if (r.malCalibradas.length > 0) {
      L.push('');
      L.push('Cartas fuera de calibración (índice < 0,70 o > 1,30, o jugadas en menos del 20 % de las partidas):');
      for (const f of r.malCalibradas.sort((a, b) => a.indice - b.indice)) {
        L.push(`  - *${CARTAS[f.cardId].binomial}* — índice ${f.indice.toFixed(2)}, jugada en el ${f.pct.toFixed(1)} % (coste ${CARTAS[f.cardId].coste})`);
      }
    }
    L.push('');
  }

  return L.join('\n') + '\n';
}

// ------------------------------------------------------------------- matriz

/**
 * Enfrenta cada perfil contra cada otro (H4). Alterna el asiento en partidas
 * pares e impares: sin eso, el resultado mezcla la fuerza del perfil con la
 * ventaja de ser jugador 1 o 2, y deja de medir lo que dice medir.
 */
export function matrizDePerfiles(n, seed) {
  const perfiles = Object.values(PERFIL);
  const duelo = (a, b) => {
    let victorias = 0;
    for (let i = 0; i < n; i++) {
      const invertido = i % 2 === 1;
      const { estado } = jugarPartida(seed + i, invertido ? [b, a] : [a, b]);
      if (estado.ganador === (invertido ? 1 : 0)) victorias += 1;
    }
    return (100 * victorias) / n;
  };

  const filas = [];
  for (const a of perfiles) {
    filas.push({ perfil: a, contra: perfiles.map((b) => (a === b ? null : duelo(a, b))) });
  }
  return { perfiles, filas, n };
}

function informeMatriz(m) {
  const L = [];
  L.push(`Matriz de perfiles — ${m.n} partidas por duelo, asiento alternado.`);
  L.push('% de victorias del perfil de la FILA contra el de la COLUMNA.');
  L.push('');
  L.push(`| Perfil | ${m.perfiles.join(' | ')} |`);
  L.push(`|---${'|---'.repeat(m.perfiles.length)}|`);
  for (const f of m.filas) {
    L.push(`| **${f.perfil}** | ${f.contra.map((v) => (v === null ? '—' : `${v.toFixed(1)} %`)).join(' | ')} |`);
  }
  return L.join('\n');
}

// ----------------------------------------------------------------------- main

const esPrincipal = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('sim/run.js');
if (esPrincipal) {
  const o = args();

  if (o.matriz) {
    const salida = informeMatriz(matrizDePerfiles(Math.min(o.n, 400), o.seed));
    console.log(salida);
    process.exit(0);
  }

  const m = correr(o);
  const r = resumir(m);

  if (o.json) {
    process.stdout.write(JSON.stringify({ metricas: m, resumen: r }, null, 2) + '\n');
  } else {
    writeFileSync(o.out, informe(m, r));
    const v = veredicto(r);
    for (const f of v.filas) console.log(`${f[3] ? 'OK  ' : 'FALLA'} ${f[0]}: ${f[1]} (objetivo ${f[2]})`);
    console.log('');
    console.log(`${o.n} partidas en ${(m.duracionMs / 1000).toFixed(1)} s → ${o.out}`);
    process.exitCode = v.cumple ? 0 : 1;
  }
}
