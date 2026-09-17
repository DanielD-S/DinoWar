// DinoWar — mide los LUGARES: el tablero plano contra el de lugares, y cada
// lugar por separado.
//
//   node sim/lugares.mjs              300 partidas por tanda → LUGARES.md
//   node sim/lugares.mjs 2000 --solo  sólo el plano contra el sorteo, a lo grande
//   node sim/lugares.mjs 300 --seed 9
//
// Responde a las dos preguntas que hay que hacerse ANTES de dar por buenos los
// lugares, y que ninguno de los otros seis simuladores contesta:
//
//   1. ¿Qué le hacen al JUEGO? El tablero plano y el de lugares, con las MISMAS
//      semillas —los lugares se sortean después de los mazos, así que el
//      reparto de cartas de una semilla es idéntico con y sin ellos—. Lo que se
//      lee es la diferencia en los seis números de BALANCE.md.
//
//   2. ¿Cuál no cambia nada y cuál decide solo la partida? Cada lugar se fuerza
//      de dos maneras: en LAS CUATRO columnas, para ver qué le hace al juego
//      mientras está puesto —es lo que hace `sim/climas.js` con un clima—, y
//      en UNA sola, la tercera, para ver si la IA va a por él o lo evita. La
//      atracción se mide contra esa misma columna en el tablero plano con las
//      mismas semillas, que la IA ya tiene sus manías con el orden.
//
// Lo que NO mide, para no leerlo de más: el mazo es el de REFERENCIA, que no
// lleva reptiles marinos ni casi pterosaurios, así que el Río y el Acantilado
// salen aquí como columnas vacías de efecto. Lo que valen se verá cuando
// alguien construya el mazo que los quiere.

import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { BALANCE } from '../src/data/balance.js';
import { LUGARES, LUGARES_IDS } from '../src/data/lugares.js';
import { MOTIVO_FIN } from '../src/engine/state.js';
import { jugarPartida, foto, lider } from './partida.js';

export const COLUMNA = 2;
const TURNO_VENTAJA = 5;

const PLANO = Array.from({ length: BALANCE.ranuras }, () => null);

/** Las tandas: el plano, el sorteo normal, y cada lugar de las dos maneras. */
export function tandas() {
  const t = [{ id: 'plano', lugares: PLANO }, { id: 'sorteo', lugares: undefined }];
  for (const l of LUGARES_IDS) {
    t.push({ id: `todas:${l}`, lugares: PLANO.map(() => l) });
    t.push({ id: `una:${l}`, lugares: PLANO.map((_, r) => (r === COLUMNA ? l : null)) });
  }
  return t;
}

/**
 * Una tanda dentro de ESTE proceso. Devuelve lo que hace falta para las dos
 * preguntas: los números del balance y a qué columna fueron los despliegues.
 */
export function medir(n, seed, lugares) {
  const r = {
    n, turnos: 0, inicial: 0, vias: {}, ventaja: 0, ventajaAcertada: 0,
    porColumna: Array.from({ length: BALANCE.ranuras }, () => 0), despliegues: 0,
  };
  for (let i = 0; i < n; i++) {
    const fotos = [];
    const { estado, jugadas } = jugarPartida(seed + i, undefined, (s) => fotos.push(foto(s)), true, null, lugares);
    r.turnos += estado.turno;
    if (estado.ganador === 0) r.inicial += 1;
    r.vias[estado.motivoFin] = (r.vias[estado.motivoFin] ?? 0) + 1;
    const f5 = fotos.find((f) => f.turno === TURNO_VENTAJA);
    if (f5 && lider(f5) !== null) {
      r.ventaja += 1;
      if (lider(f5) === estado.ganador) r.ventajaAcertada += 1;
    }
    for (const j of jugadas) {
      if (j.ranura === null || j.ranura === undefined) continue;
      r.porColumna[j.ranura] += 1;
      r.despliegues += 1;
    }
  }
  return r;
}

const pct = (a, b) => (b === 0 ? 0 : (100 * a) / b);
const f1 = (x) => x.toFixed(1);

function fila(r) {
  const via = (m) => pct(r.vias[m] ?? 0, r.n);
  return {
    turnos: r.turnos / r.n,
    inicial: pct(r.inicial, r.n),
    bola: pct(r.ventajaAcertada, r.ventaja),
    trofeos: via(MOTIVO_FIN.TROFEOS),
    habitat: via(MOTIVO_FIN.HABITAT),
    extincion: via(MOTIVO_FIN.EXTINCION),
    // Cuota de despliegues de la columna medida.
    cuota: pct(r.porColumna[COLUMNA], r.despliegues),
  };
}

export function informe(resultados, n, seed, solo = false) {
  const R = Object.fromEntries(resultados.map((x) => [x.id, fila(x.r)]));
  const plano = R.plano;
  const L = [];
  L.push('# LUGARES.md — DinoWar');
  L.push('');
  L.push('> Generado por `node sim/lugares.mjs`. **No editar a mano.**');
  L.push('');
  L.push(`- Partidas por tanda: **${n}** · semilla base **${seed}** · mazo de referencia, heurística contra heurística`);
  L.push(`- Lugares en el set: **${LUGARES_IDS.length}** · por partida: **${BALANCE.ranuras}** · columna medida a solas: **${COLUMNA + 1}**`);
  L.push('');
  L.push('## El tablero plano contra el de lugares');
  L.push('');
  L.push('Mismas semillas, mismo reparto de cartas. Lo que cambia entre las dos filas es sólo que las columnas tengan lugar.');
  L.push('');
  L.push('| tablero | turnos | inicial | bola de nieve | trofeos / hábitat / extinción |');
  L.push('|---|---|---|---|---|');
  for (const id of ['plano', 'sorteo']) {
    const x = R[id];
    L.push(`| ${id === 'plano' ? 'PLANO' : 'con LUGARES (sorteo)'} | ${f1(x.turnos)} | ${f1(x.inicial)} % | ${f1(x.bola)} % | ${x.trofeos.toFixed(0)} / ${x.habitat.toFixed(0)} / ${x.extincion.toFixed(0)} |`);
  }
  L.push('');
  if (solo) return L.join('\n') + '\n';
  L.push('## Cada lugar');
  L.push('');
  L.push(`\`En las cuatro\` es el lugar forzado en todas las columnas: qué le hace al juego mientras está puesto. \`Atracción\` es el lugar en la columna ${COLUMNA + 1} a solas: cuota de despliegues de esa columna dividida por la misma cuota en el tablero plano (${f1(plano.cuota)} %). 1,00 = una columna como otra; > 1,30 = la IA va a por él; < 0,70 = lo evita.`);
  L.push('');
  L.push('| lugar | qué hace | turnos | inicial | bola | trofeos / hábitat / extinción | atracción |');
  L.push('|---|---|---|---|---|---|---|');
  const filas = LUGARES_IDS.map((id) => ({ id, t: R[`todas:${id}`], u: R[`una:${id}`] }))
    .sort((a, b) => Math.abs(b.t.turnos - plano.turnos) - Math.abs(a.t.turnos - plano.turnos));
  for (const { id, t, u } of filas) {
    const atrae = plano.cuota === 0 ? 0 : u.cuota / plano.cuota;
    L.push(`| ${LUGARES[id].nombre} | ${LUGARES[id].texto} | ${f1(t.turnos)} | ${f1(t.inicial)} % | ${f1(t.bola)} % | ${t.trofeos.toFixed(0)} / ${t.habitat.toFixed(0)} / ${t.extincion.toFixed(0)} | ${atrae.toFixed(2)} |`);
  }
  L.push('');
  L.push(`Referencia, el tablero PLANO: ${f1(plano.turnos)} turnos · inicial ${f1(plano.inicial)} % · bola ${f1(plano.bola)} % · ${plano.trofeos.toFixed(0)} / ${plano.habitat.toFixed(0)} / ${plano.extincion.toFixed(0)}.`);
  L.push('');
  return L.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const N = Number(a.find((x) => /^\d+$/.test(x)) ?? 300);
  const seed = a.includes('--seed') ? Number(a[a.indexOf('--seed') + 1]) : 9000;
  const salida = a.includes('--out') ? a[a.indexOf('--out') + 1] : 'LUGARES.md';

  if (process.env.DINOWAR_LUGARES_HIJO) {
    const tanda = tandas().find((t) => t.id === process.env.DINOWAR_LUGARES_HIJO);
    process.stdout.write(JSON.stringify(medir(N, seed, tanda.lugares)));
  } else {
    // Cada tanda en su proceso y varios a la vez, por lo mismo que
    // sim/climas.js: son 36 tandas y en serie tardan un cuarto de hora.
    const { availableParallelism } = await import('node:os');
    const paralelo = Math.max(1, availableParallelism());
    const todas = a.includes('--solo') ? tandas().slice(0, 2) : tandas();
    const resultados = [];
    const { spawn } = await import('node:child_process');
    const correr = (t) => new Promise((resolve, reject) => {
      const hijo = spawn(process.execPath, [process.argv[1], String(N), '--seed', String(seed)], {
        env: { ...process.env, DINOWAR_LUGARES_HIJO: t.id },
        stdio: ['ignore', 'pipe', 'inherit'],
      });
      let out = '';
      hijo.stdout.on('data', (d) => { out += d; });
      hijo.on('close', (code) => (code === 0 ? resolve(JSON.parse(out)) : reject(new Error(`${t.id}: ${code}`))));
    });
    let i = 0;
    const t0 = Date.now();
    await Promise.all(Array.from({ length: paralelo }, async () => {
      while (i < todas.length) {
        const t = todas[i++];
        const r = await correr(t);
        resultados.push({ id: t.id, r });
        process.stderr.write(`  ${t.id.padEnd(24)} ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
      }
    }));
    const md = informe(resultados, N, seed, a.includes('--solo'));
    writeFileSync(salida, md);
    process.stdout.write(md);
  }
}
