// DinoWar — simulador de balance (V2-0). Corre N partidas IA vs IA y escribe
// BALANCE.md.
//
//   node sim/run.js                     2.000 partidas heurística vs heurística
//   node sim/run.js --n 500 --seed 7
//   node sim/run.js --perfiles heuristica,aleatoria
//   node sim/run.js --json              métricas crudas por stdout

import { writeFileSync } from 'node:fs';
import { BALANCE, MAZO, TOTAL_MAZO } from '../src/data/balance.js';
import { CARTAS, TIPO, CLADO_NOMBRE } from '../src/data/cards.js';
import { MOTIVO_FIN } from '../src/engine/state.js';
import { PERFIL } from '../src/engine/ai.js';
import { jugarPartida, foto, lider } from './partida.js';

// Sección 8 de PLAN_V2.md. Las dos últimas son la razón de ser del rediseño.
const OBJETIVOS = {
  duracion: { min: 10, max: 14 },
  inicial: { min: 48, max: 55 },
  indice: { min: 0.7, max: 1.3 },
  sinDecision: { max: 2 },
  bolaDeNieve: { min: 55, max: 70 },   // P(ganar | vas por delante en el turno 5)
  reparto: { min: 15, max: 60 },       // cada vía de victoria
};

const TURNO_VENTAJA = 5;

function args() {
  const a = process.argv.slice(2);
  const o = {
    n: 2000, seed: 1, out: 'BALANCE.md', json: false,
    perfiles: [PERFIL.HEURISTICA, PERFIL.HEURISTICA],
  };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--n') o.n = Number(a[++i]);
    else if (a[i] === '--seed') o.seed = Number(a[++i]);
    else if (a[i] === '--out') o.out = a[++i];
    else if (a[i] === '--json') o.json = true;
    else if (a[i] === '--perfiles') o.perfiles = a[++i].split(',');
  }
  return o;
}

const pct = (p, t) => (t === 0 ? 0 : (100 * p) / t);
const media = (xs) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

function percentil(xs, p) {
  if (xs.length === 0) return 0;
  const o = xs.slice().sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.max(0, Math.round((p / 100) * (o.length - 1))))];
}

export function correr({ n, seed, perfiles }) {
  const cardIds = Object.keys(CARTAS);
  const m = {
    n, seed, perfiles,
    turnos: [], victorias: [0, 0], motivos: {},
    jugadaEnPartida: Object.fromEntries(cardIds.map((c) => [c, 0])),
    jugadasPorCarta: Object.fromEntries(cardIds.map((c) => [c, 0])),
    jugadasTotales: 0,
    ventajaAcertada: 0, ventajaTotal: 0,
    unidadesPorTurno: [], trofeosFinales: [], biomaFinal: [],
    duracionMs: 0,
  };

  const t0 = Date.now();

  for (let i = 0; i < n; i++) {
    const fotos = [];
    const { estado, jugadas } = jugarPartida(seed + i, perfiles, (s) => fotos.push(foto(s)));

    m.turnos.push(estado.turno);
    if (estado.ganador !== null) m.victorias[estado.ganador] += 1;
    m.motivos[estado.motivoFin] = (m.motivos[estado.motivoFin] ?? 0) + 1;
    m.trofeosFinales.push(Math.max(estado.jugadores[0].trofeos, estado.jugadores[1].trofeos));
    m.biomaFinal.push(Math.min(estado.jugadores[0].habitat, estado.jugadores[1].habitat));

    const vistas = new Set(jugadas.map((j) => j.cardId));
    for (const c of vistas) m.jugadaEnPartida[c] += 1;
    for (const j of jugadas) { m.jugadasPorCarta[j.cardId] += 1; m.jugadasTotales += 1; }

    for (const f of fotos) m.unidadesPorTurno.push((f.unidades[0] + f.unidades[1]) / 2);

    // Bola de nieve: quien va por delante en el turno 5, ¿gana la partida?
    const f5 = fotos.find((f) => f.turno === TURNO_VENTAJA);
    if (f5) {
      const l = lider(f5);
      if (l !== null) {
        m.ventajaTotal += 1;
        if (l === estado.ganador) m.ventajaAcertada += 1;
      }
    }
  }

  m.duracionMs = Date.now() - t0;
  return m;
}

export function resumir(m) {
  const cardIds = Object.keys(CARTAS);
  const copias = Object.fromEntries(MAZO);
  const frecuencias = cardIds.map((c) => {
    const cuota = pct(m.jugadasPorCarta[c], m.jugadasTotales);
    const esperado = pct(copias[c] ?? 0, TOTAL_MAZO);
    return {
      cardId: c,
      pct: pct(m.jugadaEnPartida[c], m.n),
      cuota,
      esperado,
      indice: esperado === 0 ? 0 : cuota / esperado,
    };
  });

  const via = (motivo) => pct(m.motivos[motivo] ?? 0, m.n);

  return {
    duracion: media(m.turnos),
    p10: percentil(m.turnos, 10),
    p50: percentil(m.turnos, 50),
    p90: percentil(m.turnos, 90),
    min: Math.min(...m.turnos),
    max: Math.max(...m.turnos),
    inicial: pct(m.victorias[0], m.n),
    frecuencias,
    malCalibradas: frecuencias.filter((f) => f.indice < OBJETIVOS.indice.min || f.indice > OBJETIVOS.indice.max),
    trofeos: via(MOTIVO_FIN.TROFEOS),
    habitat: via(MOTIVO_FIN.HABITAT),
    extincion: via(MOTIVO_FIN.EXTINCION),
    sinDecision: via(MOTIVO_FIN.LIMITE_TURNOS),
    bolaDeNieve: pct(m.ventajaAcertada, m.ventajaTotal),
    unidades: media(m.unidadesPorTurno),
    trofeosMedios: media(m.trofeosFinales),
    biomaMinimo: media(m.biomaFinal),
  };
}

function veredicto(r) {
  const vias = [r.trofeos, r.habitat, r.extincion];
  const filas = [
    ['Duración media', `${r.duracion.toFixed(2)} turnos`, '10 – 14',
      r.duracion >= OBJETIVOS.duracion.min && r.duracion <= OBJETIVOS.duracion.max],
    ['Victorias del jugador inicial', `${r.inicial.toFixed(1)} %`, '48 – 55 %',
      r.inicial >= OBJETIVOS.inicial.min && r.inicial <= OBJETIVOS.inicial.max],
    ['Cartas mal calibradas', `${r.malCalibradas.length}`, '0', r.malCalibradas.length === 0],
    ['Partidas sin decisión', `${r.sinDecision.toFixed(1)} %`, '< 2 %', r.sinDecision < OBJETIVOS.sinDecision.max],
    ['P(ganar | ventaja en el turno 5)', `${r.bolaDeNieve.toFixed(1)} %`, '55 – 70 %',
      r.bolaDeNieve >= OBJETIVOS.bolaDeNieve.min && r.bolaDeNieve <= OBJETIVOS.bolaDeNieve.max],
    ['Reparto entre las tres victorias', vias.map((v) => `${v.toFixed(0)}%`).join(' / '), 'cada una 15 – 60 %',
      vias.every((v) => v >= OBJETIVOS.reparto.min && v <= OBJETIVOS.reparto.max)],
  ];
  return { filas, cumple: filas.every((f) => f[3]) };
}

function informe(m, r) {
  const v = veredicto(r);
  const ok = (b) => (b ? '✅' : '❌');
  const L = [];

  L.push('# BALANCE.md — DinoWar');
  L.push('');
  L.push('> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.');
  L.push('');
  L.push(`- Partidas: **${m.n}** · semilla base **${m.seed}** · perfiles **${m.perfiles.join(' vs ')}**`);
  L.push(`- Ranuras: **${BALANCE.ranuras}** · Habitat: **${BALANCE.vidaHabitat}** · Trofeos para ganar: **${BALANCE.trofeosParaGanar}**`);
  L.push(`- Renta: **${BALANCE.rentaPorTurno}/turno hasta ${BALANCE.rentaTope}**, ${BALANCE.rentaAcumula ? 'acumula' : 'no acumula'} · Mazo: **${TOTAL_MAZO}**`);
  L.push(`- Tiempo: ${(m.duracionMs / 1000).toFixed(1)} s`);
  L.push('');

  L.push('## Objetivos (PLAN_V2.md §8)');
  L.push('');
  L.push('| Métrica | Resultado | Objetivo | |');
  L.push('|---|---|---|---|');
  for (const f of v.filas) L.push(`| ${f[0]} | ${f[1]} | ${f[2]} | ${ok(f[3])} |`);
  L.push('');
  L.push(v.cumple ? '**Los seis objetivos se cumplen.**' : '**Hay objetivos incumplidos.**');
  L.push('');

  L.push('## La bola de nieve');
  L.push('');
  L.push('Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.');
  L.push('');
  L.push(`Aquí, quien va por delante en el turno ${TURNO_VENTAJA} gana el **${r.bolaDeNieve.toFixed(1)} %**.`);
  L.push('');

  L.push('## Duración y finales');
  L.push('');
  L.push('| | Turnos |');
  L.push('|---|---|');
  L.push(`| Mínimo | ${r.min} |`);
  L.push(`| P10 | ${r.p10} |`);
  L.push(`| Mediana | ${r.p50} |`);
  L.push(`| Media | ${r.duracion.toFixed(2)} |`);
  L.push(`| P90 | ${r.p90} |`);
  L.push(`| Máximo | ${r.max} |`);
  L.push('');
  L.push('| Vía de victoria | % |');
  L.push('|---|---|');
  L.push(`| Registro fósil (${BALANCE.trofeosParaGanar} trofeos) | ${r.trofeos.toFixed(1)} |`);
  L.push(`| Colapso del habitat | ${r.habitat.toFixed(1)} |`);
  L.push(`| Extinción (sin cartas) | ${r.extincion.toFixed(1)} |`);
  L.push(`| Sin decisión (tope de ${BALANCE.limiteTurnos} turnos) | ${r.sinDecision.toFixed(1)} |`);
  L.push('');
  L.push(`Unidades vivas medias por bando: **${r.unidades.toFixed(2)}** de ${BALANCE.ranuras} ranuras.`);
  L.push('');

  L.push('## Calibración por carta');
  L.push('');
  L.push('`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.');
  L.push('');
  L.push('| Carta | Familia | Coste | % partidas | Índice | |');
  L.push('|---|---|---|---|---|---|');
  for (const f of r.frecuencias.slice().sort((a, b) => b.indice - a.indice)) {
    const c = CARTAS[f.cardId];
    const familia = c.tipo === TIPO.DINOSAURIO ? CLADO_NOMBRE[c.clado]
      : c.tipo === TIPO.ADAPTACION ? 'Adaptación'
        : c.tipo === TIPO.PRESION ? 'Presión' : 'Campo';
    const sano = f.indice >= OBJETIVOS.indice.min && f.indice <= OBJETIVOS.indice.max;
    const nombre = c.tipo === TIPO.DINOSAURIO ? `*${c.binomial}*` : c.binomial;
    L.push(`| ${nombre} | ${familia} | ${c.coste} | ${f.pct.toFixed(1)} % | ${f.indice.toFixed(2)} | ${ok(sano)} |`);
  }
  L.push('');

  if (!v.cumple) {
    L.push('## Diagnóstico');
    L.push('');
    for (const f of v.filas.filter((x) => !x[3])) L.push(`- **${f[0]}**: ${f[1]} (objetivo ${f[2]}).`);
    if (r.malCalibradas.length > 0) {
      L.push('');
      for (const f of r.malCalibradas.sort((a, b) => a.indice - b.indice)) {
        L.push(`  - ${CARTAS[f.cardId].binomial} — índice ${f.indice.toFixed(2)} (coste ${CARTAS[f.cardId].coste})`);
      }
    }
    L.push('');
  }

  return L.join('\n') + '\n';
}

const esPrincipal = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('sim/run.js');
if (esPrincipal) {
  const o = args();
  const m = correr(o);
  const r = resumir(m);
  if (o.json) {
    process.stdout.write(JSON.stringify({ metricas: m, resumen: r }, null, 2) + '\n');
  } else {
    writeFileSync(o.out, informe(m, r));
    const v = veredicto(r);
    for (const f of v.filas) console.log(`${f[3] ? 'OK  ' : 'FALLA'} ${f[0]}: ${f[1]} (objetivo ${f[2]})`);
    console.log(`\n${o.n} partidas en ${(m.duracionMs / 1000).toFixed(1)} s → ${o.out}`);
    process.exitCode = v.cumple ? 0 : 1;
  }
}
