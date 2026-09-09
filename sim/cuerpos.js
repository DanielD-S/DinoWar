// DinoWar — mide el daño SOBRANTE sobre las mismas semillas.
//
//   node sim/cuerpos.js            400 partidas por variante
//   node sim/cuerpos.js 1200
//
// El daño que sobra al matar sigue hacia el hábitat rival: si pegas 5 a algo que
// tenía 3 de Vida, los 2 que sobran pasan. Es lo que cierra el último agujero de
// legibilidad —ningún número desaparece— y lo que este fichero mide.
//
// Nació comparando dos «cuerpos» de carta, con Defensa y sin ella. Esa pregunta
// ya está cerrada: la Defensa se quitó y las fichas se refundieron, así que la
// variante con Defensa no se puede reconstruir y el fichero se queda con la
// pregunta que sigue viva.
//
// Hermana de sim/economias.js y por lo mismo: se decide con la tabla delante.
// Y ojo con contestarlo desde `sim/cobertura.mjs`, que ajusta contra el índice
// de DESPLIEGUE: eso mide lo que hace que la IA juegue una carta, y como la IA
// valora cada unidad multiplicando por los turnos que espera aguantar, el ajuste
// redescubre su propia preferencia. Aquí se cuentan partidas.
//
// El modo se lee del entorno al importar el motor, así que cada variante corre
// en su propio proceso hijo: cambiarlo en caliente dejaría a medio motor con el
// valor viejo.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const COMBINACIONES = [
  { sobrante: '0', etiqueta: 'sin sobrante' },
  { sobrante: '1', etiqueta: 'con sobrante' },
];

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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const N = Number(process.argv[2] ?? 400);

  // El hijo mide y escupe JSON; el padre sólo formatea.
  if (process.env.DINOWAR_CUERPOS_HIJO === '1') {
    process.stdout.write(JSON.stringify(await medir(N)));
  } else {
    const filas = COMBINACIONES.map((c) => {
      const salida = execFileSync(process.execPath, [process.argv[1], String(N)], {
        encoding: 'utf8',
        env: { ...process.env, DINOWAR_SOBRANTE: c.sobrante, DINOWAR_CUERPOS_HIJO: '1' },
        maxBuffer: 1 << 26,
      });
      return { ...c, ...JSON.parse(salida) };
    });

    const pc = (f, m) => `${((100 * (f.vias[m] ?? 0)) / f.n).toFixed(0)}%`;
    process.stdout.write(`${N} partidas por variante, mismas semillas\n\n`);
    process.stdout.write(`${'variante'.padEnd(21)} turnos  trofeos  hábitat  extinción  cartas  1º gana\n`);
    for (const f of filas) {
      process.stdout.write(
        `${f.etiqueta.padEnd(21)}${f.turnos.toFixed(1).padStart(6)}`
        + `${pc(f, 'TROFEOS').padStart(9)}${pc(f, 'HABITAT').padStart(9)}${pc(f, 'EXTINCION').padStart(11)}`
        + `${f.distintas.toFixed(1).padStart(8)}${`${(100 * f.primero).toFixed(0)}%`.padStart(9)}\n`,
      );
    }
    process.stdout.write('\n«cartas» son criaturas distintas que llegan al campo por partida:'
      + ' si sube, el mazo se juega más entero.\n');
  }
}
