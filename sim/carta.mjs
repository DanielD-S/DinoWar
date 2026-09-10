// DinoWar — mide UNA carta. Cuántas partidas gana el mazo que la lleva.
//
//   node sim/carta.mjs jefe_saurophaganax
//   node sim/carta.mjs rhinorex medusaceratops 800
//
// Es la herramienta que faltaba, y la falta se ha notado. Los cuatro
// simuladores de `CLAUDE.md` responden a preguntas de conjunto —cómo va el
// balance, qué hace un clima, qué aportan los disparos al entrar— y ninguno
// responde a la única pregunta que se hace al escribir una carta: **¿ésta está
// rota?**
//
// Lo que hacía todo el mundo era correr `npm run sim`, ver los seis números
// idénticos y concluir que la carta no hacía nada. Y era verdad: el mazo de
// REFERENCIA no la llevaba. Pasó dos veces con la Llanura el mismo día, y
// volvió a pasar con las dos cartas de jefe, que ni siquiera están en el set.
//
// Aquí se juega el mazo de referencia CON la carta contra el mazo de referencia
// SIN ella, con las mismas semillas y los bandos alternados para que la ventaja
// de salir primero no se cuele en el resultado. Lo que sale es un porcentaje de
// victorias contra un espejo, así que se lee solo:
//
//   50 %  la carta da igual
//   55 %  buena
//   60 %  fuerte
//   65 %  empieza a doler
//   70 %+ rota
//
// El sitio que ocupa se lo quita a la carta MÁS repetida del mazo, para que lo
// que se mida sea la carta nueva y no el hueco que deja otra.

import { pathToFileURL } from 'node:url';
import { MAZO, BALANCE } from '../src/data/balance.js';
import { carta } from '../src/data/cards.js';

/** El mazo de referencia con `cardId` dentro, sin pasarse de 50 ni de rareza. */
export function mazoCon(cardId, copias = null) {
  const tope = BALANCE.copiasPorRareza[carta(cardId).rareza];
  const cuantas = Math.min(copias ?? tope, tope);
  const cuenta = new Map(MAZO.map(([id, n]) => [id, n]));
  cuenta.set(cardId, Math.min(tope, (cuenta.get(cardId) ?? 0) + cuantas));

  const total = () => [...cuenta.values()].reduce((a, b) => a + b, 0);
  while (total() > BALANCE.tamanoMazo) {
    const [id, n] = [...cuenta.entries()]
      .filter(([id2, n2]) => n2 > 0 && id2 !== cardId)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (n <= 1) cuenta.delete(id); else cuenta.set(id, n - 1);
  }
  return [...cuenta.entries()];
}

/**
 * `n` partidas del mazo A contra el B. Cada semilla se juega DOS veces con los
 * bandos cambiados: el primer jugador gana el 46 % de las partidas, así que sin
 * alternar, la mitad de esa diferencia se le colgaría a la carta.
 *
 * @returns {{n:number, gana:number, turnos:number, vias:object}}
 */
export async function duelo(n, mazoA, mazoB) {
  const { crearPartida, vistaDe, FASE } = await import('../src/engine/state.js');
  const { reduce, ACCION, legales } = await import('../src/engine/actions.js');
  const { decidir, PERFIL } = await import('../src/engine/ai.js');
  const { semilla } = await import('../src/engine/rng.js');

  let gana = 0;
  let turnos = 0;
  let jugadas = 0;
  const vias = {};

  for (let p = 0; p < n; p++) {
    // `lado` dice en qué bando juega el mazo que se mide.
    const lado = p % 2;
    const seed = 31000 + Math.floor(p / 2);
    const mazos = lado === 0 ? [mazoA, mazoB] : [mazoB, mazoA];
    let s = crearPartida(seed, mazos);
    let rng = semilla(seed ^ 0x2f6b1c9d);
    let v = 0;

    while (s.fase !== FASE.FIN && v++ < 4000) {
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

    if (s.ganador === lado) gana += 1;
    vias[s.motivoFin] = (vias[s.motivoFin] ?? 0) + 1;
    turnos += s.turno;
    jugadas += 1;
  }

  return { n: jugadas, gana: gana / jugadas, turnos: turnos / jugadas, vias };
}

const LECTURA = [
  [0.70, 'ROTA — hay que bajarla'],
  [0.65, 'empieza a doler'],
  [0.60, 'fuerte'],
  [0.55, 'buena'],
  [0.45, 'da igual'],
  [0.00, 'floja'],
];

export const leer = (p) => LECTURA.find(([u]) => p >= u)[1];

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const n = Number(args[args.length - 1]) ? Number(args.pop()) : 400;
  if (args.length === 0) {
    process.stdout.write('Uso: node sim/carta.mjs <id de carta> [más ids] [partidas]\n');
    process.exit(1);
  }

  const pares = n % 2 === 0 ? n : n + 1;
  process.stdout.write(`${pares} partidas por carta, bandos alternados, contra el mazo de referencia.\n\n`);
  process.stdout.write(`${'carta'.padEnd(22)}copias  gana   turnos  lectura\n`);

  for (const id of args) {
    const c = carta(id);
    const mazo = mazoCon(id);
    const copias = mazo.find(([x]) => x === id)[1];
    const r = await duelo(pares, mazo, MAZO.map((e) => [...e]));
    process.stdout.write(
      `${id.padEnd(22)}${String(copias).padStart(6)}`
      + `${`${(100 * r.gana).toFixed(1)} %`.padStart(8)}${r.turnos.toFixed(1).padStart(9)}`
      + `  ${leer(r.gana)}${c.rareza === 'LEGENDARIO' ? '' : ''}\n`,
    );
  }

  process.stdout.write('\n50 % es «da igual»: el mismo mazo contra sí mismo. Por encima de 70 %,\n'
    + 'la carta decide la partida ella sola y hay que recostearla.\n');
}
