// DinoWar — compara los dos «cuerpos» de carta sobre las MISMAS semillas.
//
//   node sim/cuerpos.js            400 partidas por variante
//   node sim/cuerpos.js 1200
//
//  ATAQUE_DEFENSA_VIDA  lo de hoy: la Defensa resta a cada golpe.
//  ATAQUE_VIDA          la Defensa no existe y se suma a la Vida.
//
// Hermana de sim/economias.js y por lo mismo: la pregunta —¿estorba la Defensa
// más de lo que aporta?— se decide con la tabla delante, no discutiendo. Y la
// respuesta no puede salir de `sim/cobertura.mjs`, que ajusta contra el índice
// de DESPLIEGUE: eso mide lo que hace que la IA juegue una carta, y como la IA
// valora cada unidad multiplicando por los turnos que espera aguantar, el ajuste
// redescubre su propia preferencia por los muros. Aquí se cuentan partidas.
//
// El modo se lee del entorno al importar el motor, así que cada variante corre
// en su propio proceso hijo: cambiarlo en caliente dejaría a medio motor con el
// valor viejo.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const MODOS = ['ATAQUE_DEFENSA_VIDA', 'ATAQUE_VIDA'];

/** Una tanda dentro de ESTE proceso. La llama el hijo, no el padre. */
export async function medir(n) {
  const { crearPartida, vistaDe, FASE, MOTIVO_FIN } = await import('../src/engine/state.js');
  const { reduce, ACCION, legales } = await import('../src/engine/actions.js');
  const { decidir, PERFIL } = await import('../src/engine/ai.js');
  const { semilla } = await import('../src/engine/rng.js');

  const vias = {};
  let turnos = 0;
  let distintas = 0;
  let ganaPrimero = 0;
  let jugadas = 0;

  for (let p = 0; p < n; p++) {
    const seed = 7000 + p;
    let s = crearPartida(seed, null);
    let rng = semilla(seed ^ 0x5bf03635);
    let vueltas = 0;

    while (s.fase !== FASE.FIN && vueltas++ < 4000) {
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
    }

    const vistas = new Set();
    for (const i of Object.values(s.instancias)) {
      if (i.ranura !== null || i.heridas > 0 || i.desplegadoEnTurno !== null) vistas.add(i.cardId);
    }
    vias[s.motivoFin] = (vias[s.motivoFin] ?? 0) + 1;
    turnos += s.turno;
    distintas += vistas.size;
    if (s.ganador === 0) ganaPrimero++;
    jugadas++;
    void MOTIVO_FIN;
  }

  return {
    n: jugadas,
    turnos: turnos / jugadas,
    distintas: distintas / jugadas,
    primero: ganaPrimero / jugadas,
    vias,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const N = Number(process.argv[2] ?? 400);

  // El hijo mide y escupe JSON; el padre sólo formatea.
  if (process.env.DINOWAR_CUERPOS_HIJO === '1') {
    process.stdout.write(JSON.stringify(await medir(N)));
  } else {
    const filas = MODOS.map((modo) => {
      const salida = execFileSync(process.execPath, [process.argv[1], String(N)], {
        encoding: 'utf8',
        env: { ...process.env, DINOWAR_CUERPO: modo, DINOWAR_CUERPOS_HIJO: '1' },
        maxBuffer: 1 << 26,
      });
      return { modo, ...JSON.parse(salida) };
    });

    const pc = (f, m) => `${((100 * (f.vias[m] ?? 0)) / f.n).toFixed(0)}%`;
    process.stdout.write(`${N} partidas por variante, mismas semillas\n\n`);
    process.stdout.write(`${'variante'.padEnd(21)} turnos  trofeos  hábitat  extinción  cartas  1º gana\n`);
    for (const f of filas) {
      process.stdout.write(
        `${f.modo.padEnd(21)}${f.turnos.toFixed(1).padStart(6)}`
        + `${pc(f, 'TROFEOS').padStart(9)}${pc(f, 'HABITAT').padStart(9)}${pc(f, 'EXTINCION').padStart(11)}`
        + `${f.distintas.toFixed(1).padStart(8)}${`${(100 * f.primero).toFixed(0)}%`.padStart(9)}\n`,
      );
    }
    process.stdout.write('\n«cartas» son criaturas distintas que llegan al campo por partida:'
      + ' si sube, el mazo se juega más entero.\n');
  }
}
