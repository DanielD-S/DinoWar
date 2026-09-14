// Lo que traduce `red.js` de la respuesta del servidor a lo que pinta la
// pantalla. Se prueba por una razón concreta: desde que el jefe vuelve cada
// ciclo, un evento ya NO identifica una cacería. El Saurophaganax de esta
// semana y el que cayó hace catorce días son dos, con la misma clave de evento
// y distinta vuelta, y emparejar por evento a secas se equivoca sin fallar —te
// enseña el jefe de ahora con el daño de entonces, o te esconde tu carta detrás
// del que sigue en pie—.

import test from 'node:test';
import assert from 'node:assert/strict';

import { aFormaDePantalla } from '../src/ui/red.js';

const YO = 'u-yo';
const EV = 'caza_saurophaganax';
const ahora = Date.UTC(2026, 8, 14);

/** Una respuesta del servidor con dos vueltas de la misma cacería. */
function respuesta({ ciclo, jefes, aportes }) {
  return {
    ahora, yo: YO, dia: 1, ciclo,
    yacimiento: { nivel: 1, fosiles: 0 },
    tribu: { id: 't', nombre: 'Tribu', codigo: 'ABCDEF', almacen: 600,
      creada_en: new Date(ahora - 86400_000).toISOString() },
    miembros: [], solicitudes: [], historial: [], asaltos_hoy: 0,
    jefes, aportes,
  };
}

test('El jefe de la pantalla es el de la vuelta de ahora, no el de la anterior', () => {
  const c = aFormaDePantalla(respuesta({
    ciclo: 1,
    jefes: [
      { evento_id: EV, ciclo: 0, vida: 0, vida_maxima: 6000, caido_en: null },
      { evento_id: EV, ciclo: 1, vida: 4200, vida_maxima: 6000, caido_en: null },
    ],
    aportes: [
      { evento_id: EV, ciclo: 0, jugador_id: YO, apodo: 'yo', dano: 900, reclamado: true },
      { evento_id: EV, ciclo: 1, jugador_id: YO, apodo: 'yo', dano: 300, reclamado: false },
    ],
  }));
  assert.equal(c.jefe.vida, 4200, 'pintó el jefe de la vuelta pasada');
  assert.equal(c.aportado, 300, 'sumó el daño de la cacería anterior');
});

test('La carta de una cacería vieja sigue pendiente con el jefe nuevo en pie', () => {
  const c = aFormaDePantalla(respuesta({
    ciclo: 1,
    jefes: [
      { evento_id: EV, ciclo: 0, vida: 0, vida_maxima: 6000, caido_en: null },
      { evento_id: EV, ciclo: 1, vida: 4200, vida_maxima: 6000, caido_en: null },
    ],
    aportes: [
      { evento_id: EV, ciclo: 0, jugador_id: YO, apodo: 'yo', dano: 900, reclamado: false },
      { evento_id: EV, ciclo: 1, jugador_id: YO, apodo: 'yo', dano: 300, reclamado: false },
    ],
  }));
  assert.equal(c.cartasPendientes.length, 1);
  assert.equal(c.cartasPendientes[0].ciclo, 0);
  assert.equal(c.puedeReclamar, false, 'el de ahora sigue en pie: no hay nada que coger');
});

test('Un aporte de la vuelta pasada no cobra la carta de la de ahora', () => {
  // El caso que se equivocaría en silencio: sin comparar el ciclo, el aporte
  // del ciclo 0 se emparejaría con el jefe caído del ciclo 1 y regalaría una
  // carta que no se ha ganado.
  const c = aFormaDePantalla(respuesta({
    ciclo: 1,
    jefes: [{ evento_id: EV, ciclo: 1, vida: 0, vida_maxima: 6000, caido_en: null }],
    aportes: [{ evento_id: EV, ciclo: 0, jugador_id: YO, apodo: 'yo', dano: 900, reclamado: false }],
  }));
  assert.equal(c.puedeReclamar, false);
  assert.equal(c.cartasPendientes.length, 0);
});

test('Sin ciclo en la respuesta se lee todo como la vuelta 0', () => {
  // Un servidor viejo —o la cuenca local— no manda `ciclo`. Tratar eso como
  // «ninguna cacería es de ahora» dejaría la pantalla sin jefe.
  const c = aFormaDePantalla({
    ahora, yo: YO, dia: 1,
    yacimiento: { nivel: 1, fosiles: 0 },
    tribu: { id: 't', nombre: 'Tribu', codigo: 'ABCDEF', almacen: 600,
      creada_en: new Date(ahora - 86400_000).toISOString() },
    miembros: [], solicitudes: [], historial: [], asaltos_hoy: 0,
    jefes: [{ evento_id: EV, vida: 5000, vida_maxima: 6000, caido_en: null }],
    aportes: [{ evento_id: EV, jugador_id: YO, apodo: 'yo', dano: 120, reclamado: false }],
  });
  assert.equal(c.jefe.vida, 5000);
  assert.equal(c.aportado, 120);
});
