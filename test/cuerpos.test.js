// El cuerpo de una carta son DOS cifras: Ataque y Vida. La Defensa se quitó.
//
// Lo que sigue vivo detrás de una variable de entorno es el daño SOBRANTE, y el
// modo se lee al importar el motor, así que se comprueba en otro proceso.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { BALANCE } from '../src/data/balance.js';
import { CARTAS, TIPO } from '../src/data/cards.js';
import { COMBINACIONES } from '../sim/cuerpos.js';

test('Ninguna carta tiene ya Defensa', () => {
  // No es una comprobación de estilo: si una ficha nueva llega con `defensa`,
  // el motor la ignora en silencio y la carta sale más floja de lo que su autor
  // creía. Mejor que se note aquí.
  const con = Object.values(CARTAS).filter((c) => c.defensa !== undefined);
  assert.deepEqual(con.map((c) => c.id), []);
});

test('Toda criatura tiene Ataque y Vida, y la Vida es positiva', () => {
  for (const c of Object.values(CARTAS)) {
    if (c.tipo !== TIPO.DINOSAURIO) continue;
    assert.equal(typeof c.ataque, 'number', `${c.id} sin Ataque`);
    assert.ok(c.vida > 0, `${c.id} tiene ${c.vida} de Vida`);
  }
});

test('El suelo de daño se fue con la Defensa', () => {
  // Existía sólo para que una Defensa alta no hiciera inmune a nadie. Sin resta
  // no hay de qué proteger, y dejarlo haría que un Ataque de 0 pegara 1.
  assert.equal(BALANCE.danoMinimo, undefined);
});

test('El daño sobrante está encendido, y se puede apagar para medir', () => {
  assert.equal(BALANCE.cuerpo.sobranteAlHabitat, true);
  const apagado = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    "const { BALANCE } = await import('./src/data/balance.js');"
    + 'process.stdout.write(JSON.stringify(BALANCE.cuerpo));'], {
    encoding: 'utf8',
    env: { ...process.env, DINOWAR_SOBRANTE: '0' },
  }));
  assert.equal(apagado.sobranteAlHabitat, false);
});

test('Lo que sobra al matar llega al hábitat rival', () => {
  const r = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
    const s = await import('./src/engine/state.js');
    const { reduce, ACCION } = await import('./src/engine/actions.js');
    const e = s.crearPartida(7, [[['torvosaurus', 1]], [['dryosaurus', 3]]]);
    // Torvosaurus pega mucho más de lo que aguanta un Dryosaurus: la diferencia
    // tiene que aparecer en el hábitat, no evaporarse.
    const t = Number(Object.keys(e.instancias).find((i) => e.instancias[i].cardId === 'torvosaurus'));
    const d = Number(Object.keys(e.instancias).find((i) => e.instancias[i].cardId === 'dryosaurus'));
    e.ranuras[0][0] = t; e.instancias[t].ranura = 0;
    e.ranuras[1][0] = d; e.instancias[d].ranura = 0;
    e.turno = 3; e.fase = 'COMBATE';
    const antes = e.jugadores[1].habitat;
    const dano = s.danoEntre(e, t, d);
    const vida = s.vidaActual(e, d);
    const post = reduce(e, { tipo: ACCION.AVANZAR });
    process.stdout.write(JSON.stringify({ dano, vida, antes, despues: post.jugadores[1].habitat }));
  `], { encoding: 'utf8' }));

  assert.ok(r.dano > r.vida, 'el escenario pierde sentido si no hay sobrante');
  assert.equal(r.antes - r.despues, r.dano - r.vida,
    'al hábitat rival llega exactamente lo que sobró');
});

test('El comparador mide con y sin sobrante, y nada más', () => {
  assert.deepEqual(COMBINACIONES.map((c) => c.sobrante), ['0', '1']);
});
