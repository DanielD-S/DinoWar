// DinoWar — mide las habilidades AL ENTRAR EN JUEGO.
//
//   node sim/entradas.js            400 partidas por tanda
//   node sim/entradas.js 1200
//
// Las seis criaturas que las llevan NO están en el mazo de referencia, así que
// `npm run sim` no las ve — es el mismo punto ciego que dejó a la Llanura de
// inundación sin medir durante dos rediseños seguidos. Aquí se arma un mazo que
// SÍ las lleva y se juega dos veces con las mismas semillas: con las
// habilidades encendidas y con `DINOWAR_ENTRADAS=0`.
//
// Comparar contra el mazo de referencia no diría nada: serían dos mazos
// distintos. Lo que se compara es el MISMO mazo con y sin disparadores, así que
// la diferencia es la habilidad y nada más.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { MAZO, BALANCE } from '../src/data/balance.js';
import { CARTAS } from '../src/data/cards.js';

/** Las seis con habilidad de entrada, y cuántas copias caben de cada una. */
export const CON_ENTRADA = ['troodon', 'dromaeosaurus', 'gargoyleosaurus',
  'mosasaurus', 'atlasaurus', 'spinosaurus'];

/**
 * Un mazo legal de 50 que lleva las seis. Se parte del de referencia, se meten
 * las nuevas al máximo de copias que permite su rareza y se recorta el resto
 * empezando por las entradas con más copias — así el mazo pierde repeticiones y
 * no variedad, que es el mismo criterio que usa `mazoConBiomasa`.
 */
export function mazoConEntradas() {
  const cuenta = new Map(MAZO.map(([id, n]) => [id, n]));
  for (const id of CON_ENTRADA) {
    cuenta.set(id, (cuenta.get(id) ?? 0) + BALANCE.copiasPorRareza[CARTAS[id].rareza]);
  }

  const total = () => [...cuenta.values()].reduce((a, b) => a + b, 0);
  while (total() > BALANCE.tamanoMazo) {
    // La que más copias tenga, sin tocar las seis que se están midiendo.
    const candidatas = [...cuenta.entries()]
      .filter(([id, n]) => n > 0 && !CON_ENTRADA.includes(id))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (candidatas.length === 0) break;
    const [id, n] = candidatas[0];
    if (n <= 1) cuenta.delete(id); else cuenta.set(id, n - 1);
  }
  return [...cuenta.entries()];
}

export async function medir(n, mazo) {
  const { crearPartida, vistaDe, FASE } = await import('../src/engine/state.js');
  const { reduce, ACCION, legales } = await import('../src/engine/actions.js');
  const { decidir, PERFIL } = await import('../src/engine/ai.js');
  const { semilla } = await import('../src/engine/rng.js');

  const vias = {};
  let turnos = 0;
  let jugadas = 0;
  let primero = 0;
  let disparos = 0;
  let ventajaOK = 0;
  let ventajaTot = 0;

  for (let p = 0; p < n; p++) {
    const seed = 7000 + p;
    let s = crearPartida(seed, [mazo, mazo]);
    let rng = semilla(seed ^ 0x5bf03635);
    let v = 0;
    let lider = null;
    // `s.eventos` se VACÍA cada turno, así que contarlos al final sólo ve los
    // del último. Se van recogiendo sobre la marcha y se deduplican por iid: una
    // criatura entra en juego una vez y no más.
    const disparadas = new Set();
    const recoger = () => {
      for (const e of s.eventos) if (e.tipo === 'ENTRADA') disparadas.add(e.iid);
    };

    while (s.fase !== FASE.FIN && v++ < 4000) {
      // Quién iba por delante en el turno 5: es la bola de nieve, que es lo que
      // más miedo da de una habilidad que se dispara al desplegar — quien va
      // ganando despliega más, así que dispara más.
      if (s.turno === BALANCE.ia.horizonte + 2 && lider === null) {
        const [a, b] = s.jugadores;
        if (a.trofeos !== b.trofeos) lider = a.trofeos > b.trofeos ? 0 : 1;
        else if (a.habitat !== b.habitat) lider = a.habitat > b.habitat ? 0 : 1;
      }
      if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
        const f0 = s.fase;
        let pasos = 0;
        while (s.fase === f0 && pasos++ < 200) {
          let actuo = false;
          for (const j of [0, 1]) {
            let k = 0;
            while (s.fase === f0 && legales(s, j).length && k++ < 200) {
              const d = decidir(vistaDe(s, j), j, rng, PERFIL.HEURISTICA);
              rng = d.rng;
              if (!d.accion) break;
              s = reduce(s, d.accion);
              recoger();
              actuo = true;
              if (d.accion.tipo === ACCION.PASAR || d.accion.tipo === ACCION.DESCARTAR) break;
            }
          }
          if (!actuo) break;
        }
        if (s.fase === f0) break;
        continue;
      }
      s = reduce(s, { tipo: ACCION.AVANZAR });
      recoger();
    }

    disparos += disparadas.size;
    vias[s.motivoFin] = (vias[s.motivoFin] ?? 0) + 1;
    turnos += s.turno;
    if (s.ganador === 0) primero++;
    if (lider !== null) { ventajaTot++; if (s.ganador === lider) ventajaOK++; }
    jugadas++;
  }

  return {
    n: jugadas,
    turnos: turnos / jugadas,
    primero: primero / jugadas,
    disparos: disparos / jugadas,
    bola: ventajaTot ? ventajaOK / ventajaTot : 0,
    vias,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const N = Number(process.argv[2] ?? 400);
  const mazo = mazoConEntradas();

  if (process.env.DINOWAR_ENTRADAS_HIJO) {
    process.stdout.write(JSON.stringify(await medir(N, mazo)));
  } else {
    const filas = [['1', 'con habilidades'], ['0', 'sin habilidades']].map(([on, etiqueta]) => {
      const salida = execFileSync(process.execPath, [process.argv[1], String(N)], {
        encoding: 'utf8',
        env: { ...process.env, DINOWAR_ENTRADAS: on, DINOWAR_ENTRADAS_HIJO: '1' },
        maxBuffer: 1 << 26,
      });
      return { etiqueta, ...JSON.parse(salida) };
    });

    const pc = (f, m) => `${((100 * (f.vias[m] ?? 0)) / f.n).toFixed(0)}%`;
    const total = mazo.reduce((a, [, x]) => a + x, 0);
    process.stdout.write(`${N} partidas por tanda, mismo mazo (${total} cartas) y mismas semillas.\n`);
    process.stdout.write(`Las seis: ${CON_ENTRADA.join(', ')}\n\n`);
    process.stdout.write(`${'tanda'.padEnd(18)} turnos  trofeos  hábitat  extinción   bola   1º  disparos\n`);
    for (const f of filas) {
      process.stdout.write(
        `${f.etiqueta.padEnd(18)}${f.turnos.toFixed(1).padStart(6)}`
        + `${pc(f, 'TROFEOS').padStart(9)}${pc(f, 'HABITAT').padStart(9)}${pc(f, 'EXTINCION').padStart(11)}`
        + `${`${(100 * f.bola).toFixed(0)}%`.padStart(7)}${`${(100 * f.primero).toFixed(0)}%`.padStart(5)}`
        + `${f.disparos.toFixed(1).padStart(10)}\n`,
      );
    }
    process.stdout.write('\n«bola» es P(ganar | ir por delante en el turno 5); el objetivo es 55–70 %.\n'
      + '«disparos» son habilidades de entrada que llegan a resolverse por partida.\n');
  }
}
