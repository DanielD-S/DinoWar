// DinoWar — mide los CLIMAS, que hasta ahora no los medía nadie.
//
//   node sim/climas.js            300 partidas por clima
//   node sim/climas.js 1000
//
// El punto ciego que viene a tapar: las otras dos herramientas no ven un clima.
//
//   sim/run.js        juega SÓLO el mazo de referencia, y de los cinco climas
//                     únicamente tres están en él. La Llanura de inundación se
//                     cambió dos veces en un mismo día y los seis números de
//                     BALANCE.md salieron idénticos las dos veces, porque esa
//                     carta no llega nunca a la mesa.
//   sim/cobertura.mjs arma mazos aleatorios de todo el set, pero su ajuste
//                     filtra a criaturas: ningún clima aparece en su tabla.
//
// Así que cinco cartas llevaban existiendo sin que nadie comprobara si hacen
// algo. Aquí cada clima se FUERZA al campo desde el primer turno y se juega
// contra la misma tanda de semillas sin clima. Lo que se lee es la diferencia.
//
// Forzarlo es hacer trampa a propósito: en una partida de verdad el clima se
// juega, cuesta Biomasa y se puede reemplazar. Esto no mide lo buena que es la
// carta —para eso hace falta que la IA decida jugarla— sino qué le hace al juego
// mientras está puesta, que es la pregunta que hoy no tiene respuesta.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { CARTAS, TIPO } from '../src/data/cards.js';

/** Los cinco climas del set, más una tanda de control sin ninguno. */
export const CLIMAS = Object.values(CARTAS)
  .filter((c) => c.tipo === TIPO.CLIMA)
  .map((c) => c.id);

export const TANDAS = [null, ...CLIMAS];

/**
 * Una tanda dentro de ESTE proceso. `clima` es un cardId o null.
 *
 * El clima se planta a mano y se REPONE en cada vuelta: los climas se sustituyen
 * entre sí y sin reponerlo estaríamos midiendo un turno con y once sin.
 *
 * Con `clima` a null se fuerza lo contrario —campo vacío siempre— para que el
 * control sea de verdad «sin clima» y no «con el que la IA haya decidido jugar».
 */
export async function medir(n, clima) {
  const { crearPartida, vistaDe, FASE, nuevaInstancia } = await import('../src/engine/state.js');
  const { reduce, ACCION, legales } = await import('../src/engine/actions.js');
  const { decidir, PERFIL } = await import('../src/engine/ai.js');
  const { semilla } = await import('../src/engine/rng.js');

  const vias = {};
  let turnos = 0;
  let distintas = 0;
  let mazoFinal = 0;
  let recicladas = 0;
  let jugadas = 0;

  for (let p = 0; p < n; p++) {
    const seed = 7000 + p;
    let s = crearPartida(seed, null);
    let rng = semilla(seed ^ 0x5bf03635);
    let vueltas = 0;

    /**
     * Plantar el clima no es sólo escribir `s.campo`: el motor lleva también de
     * quién es y con qué instancia, y al reemplazarlo manda la anterior a su
     * descarte. Sin las tres cosas revienta con «cannot read descarte of
     * undefined» — que es exactamente lo que pasó la primera vez.
     */
    const plantar = () => {
      // El control no es «lo que salga»: es SIN clima. La primera versión dejaba
      // que la IA jugase el suyo, y como la Deriva árida está en el mazo de
      // referencia y muele mazos, el control salía con un 21 % de extinción y
      // todos los demás con 0 %. No estaba midiendo los climas: estaba midiendo
      // si la aridez llegaba a la mesa.
      if (!clima) { s.campo = null; s.campoIid = null; return; }
      if (s.campo === clima) return;
      const iid = s.siguienteInstId++;
      s.instancias[iid] = nuevaInstancia(iid, clima, 0);
      s.campo = clima;
      s.campoIid = iid;
      s.campoDe = 0;
    };

    while (s.fase !== FASE.FIN && vueltas++ < 4000) {
      plantar();
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
              if (d.accion.tipo === ACCION.RECICLAR) recicladas++;
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
    mazoFinal += (s.jugadores[0].mazo.length + s.jugadores[1].mazo.length) / 2;
    jugadas++;
  }

  return {
    n: jugadas,
    turnos: turnos / jugadas,
    distintas: distintas / jugadas,
    mazoFinal: mazoFinal / jugadas,
    recicladas: recicladas / jugadas,
    vias,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const N = Number(process.argv[2] ?? 300);

  if (process.env.DINOWAR_CLIMAS_HIJO) {
    const clima = process.env.DINOWAR_CLIMAS_HIJO === '-' ? null : process.env.DINOWAR_CLIMAS_HIJO;
    process.stdout.write(JSON.stringify(await medir(N, clima)));
  } else {
    // Cada tanda en su proceso, por lo mismo que sim/cuerpos.js: así ninguna
    // arrastra estado de la anterior y las semillas empiezan iguales.
    const filas = TANDAS.map((clima) => {
      const salida = execFileSync(process.execPath, [process.argv[1], String(N)], {
        encoding: 'utf8',
        env: { ...process.env, DINOWAR_CLIMAS_HIJO: clima ?? '-' },
        maxBuffer: 1 << 26,
      });
      return { clima, ...JSON.parse(salida) };
    });

    const control = filas[0];
    const pc = (f, m) => (100 * (f.vias[m] ?? 0)) / f.n;
    const dif = (x, y, d = 1) => {
      const v = x - y;
      return `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
    };

    process.stdout.write(`${N} partidas por clima, mismas semillas. `
      + 'El clima se fuerza al campo todo el rato.\n\n');
    process.stdout.write(`${'clima'.padEnd(10)} turnos  trofeos  hábitat  extinción   mazo  cartas  recicla\n`);
    for (const f of filas) {
      const nombre = f.clima ?? '— ninguno';
      process.stdout.write(
        `${nombre.padEnd(10)}${f.turnos.toFixed(1).padStart(6)}`
        + `${`${pc(f, 'TROFEOS').toFixed(0)}%`.padStart(9)}${`${pc(f, 'HABITAT').toFixed(0)}%`.padStart(9)}`
        + `${`${pc(f, 'EXTINCION').toFixed(0)}%`.padStart(11)}`
        + `${f.mazoFinal.toFixed(1).padStart(7)}${f.distintas.toFixed(1).padStart(8)}`
        + `${f.recicladas.toFixed(1).padStart(9)}\n`,
      );
    }

    process.stdout.write('\ndiferencia contra jugar sin clima:\n');
    for (const f of filas.slice(1)) {
      process.stdout.write(
        `${f.clima.padEnd(10)} turnos ${dif(f.turnos, control.turnos).padStart(5)}`
        + ` · trofeos ${dif(pc(f, 'TROFEOS'), pc(control, 'TROFEOS'), 0).padStart(4)}`
        + ` · hábitat ${dif(pc(f, 'HABITAT'), pc(control, 'HABITAT'), 0).padStart(4)}`
        + ` · extinción ${dif(pc(f, 'EXTINCION'), pc(control, 'EXTINCION'), 0).padStart(4)}`
        + ` · mazo al final ${dif(f.mazoFinal, control.mazoFinal).padStart(5)}\n`,
      );
    }
    process.stdout.write('\n«mazo» son las cartas que quedan sin robar al acabar: si sube, el mazo dura más.\n'
      + '«cartas» son criaturas distintas que llegan al campo. «recicla», devoluciones al mazo por partida.\n');
  }
}
