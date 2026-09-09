// Las reglas de la cuenca son puras y reciben el instante por argumento, así
// que se pueden probar sin esperar catorce horas. Esa decisión de diseño es
// justo lo que hace posible este fichero.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CUENCA, acumular, faltaParaLlenar, depositoDe, ritmoPorHora, costeDeMejora,
  danoDeAsalto, puedeAsaltar, aplicarAsalto, mereceRecompensa, tablaDeAportes,
} from '../src/data/tribu.js';
import {
  CALENDARIO, CICLO, JEFES, CARTAS_DE_JEFE, eventosActivos, jefeActivo, TIPO_EVENTO,
} from '../src/data/eventos.js';
import { CARTAS } from '../src/data/cards.js';
import { BALANCE } from '../src/data/balance.js';

const HORA = 3600_000;
const T0 = 1_700_000_000_000;   // un instante cualquiera, fijo

// -------------------------------------------------------------- yacimiento

test('El yacimiento acumula con la pestaña cerrada', () => {
  const y = { nivel: 1, fosiles: 0, desde: T0 };
  const tras3h = acumular(y, T0 + 3 * HORA);
  assert.equal(tras3h.fosiles, 3 * CUENCA.fosilesPorHora);
  assert.equal(tras3h.ganados, 3 * CUENCA.fosilesPorHora);
});

test('El depósito se llena y deja de producir: es lo que hace el bucle diario', () => {
  const y = { nivel: 1, fosiles: 0, desde: T0 };
  const mucho = acumular(y, T0 + 500 * HORA);
  assert.equal(mucho.fosiles, depositoDe(1));
  assert.ok(mucho.lleno);
  // Sin tope, entrar cada semana rendiría igual que entrar cada día.
  assert.ok(depositoDe(1) < 500 * ritmoPorHora(1));
});

test('El resto de hora no se tira, para que entrar a menudo no penalice', () => {
  const y = { nivel: 1, fosiles: 0, desde: T0 };
  // Seis visitas de diez minutos tienen que dar lo mismo que una de una hora.
  let corto = y;
  for (let i = 1; i <= 6; i++) corto = { ...corto, ...acumular(corto, T0 + i * 10 * 60_000) };
  const largo = acumular(y, T0 + HORA);
  assert.equal(corto.fosiles, largo.fosiles);
});

test('Un reloj que va hacia atrás no produce, y tampoco resta', () => {
  const y = { nivel: 1, fosiles: 50, desde: T0 };
  const atras = acumular(y, T0 - 10 * HORA);
  assert.equal(atras.fosiles, 50);
  assert.equal(atras.ganados, 0);
});

test('Subir el yacimiento produce más y guarda más', () => {
  assert.ok(ritmoPorHora(3) > ritmoPorHora(1));
  assert.ok(depositoDe(3) > depositoDe(1));
  assert.ok(costeDeMejora(1) < costeDeMejora(4), 'mejorar tiene que doler más cada vez');
  assert.equal(costeDeMejora(CUENCA.nivelMaximo), null, 'al tope no hay mejora que comprar');
});

test('Falta para llenar: null si ya está lleno', () => {
  const vacio = { nivel: 1, fosiles: 0, desde: T0 };
  assert.ok(faltaParaLlenar(vacio, T0) > 0);
  assert.equal(faltaParaLlenar({ ...vacio, fosiles: depositoDe(1) }, T0), null);
});

// -------------------------------------------------------------------- jefes

test('Perder tu partida SIGUE aportando al jefe', () => {
  // Es la regla que mantiene jugando al que va flojo. Si perder valiera cero,
  // la mitad de la tribu no volvería.
  const perdida = danoDeAsalto({ danoAlHabitat: 40, trofeos: 3, ganada: false });
  assert.ok(perdida > 0);
  const ganada = danoDeAsalto({ danoAlHabitat: 40, trofeos: 3, ganada: true });
  assert.ok(ganada > perdida, 'ganar tiene que aportar más');
});

test('Un asalto cobra del almacén común y hiere al jefe', () => {
  const estado = {
    almacen: 1000, ahora: T0,
    jefe: { vida: 500, vidaMaxima: 500, aportes: {}, caidoEn: null },
  };
  const d = aplicarAsalto(estado, 'tú', 120);
  assert.equal(d.jefe.vida, 380);
  assert.equal(d.almacen, 1000 - CUENCA.costeAsalto);
  assert.equal(d.jefe.aportes['tú'], 120);
  assert.equal(estado.jefe.vida, 500, 'aplicarAsalto no debe mutar: el servidor lo recalculará');
});

test('El jefe no baja de cero y registra cuándo cayó', () => {
  const estado = { almacen: 1000, ahora: T0, jefe: { vida: 50, vidaMaxima: 500, aportes: {}, caidoEn: null } };
  const d = aplicarAsalto(estado, 'tú', 9999);
  assert.equal(d.jefe.vida, 0);
  assert.equal(d.jefe.caidoEn, T0);
});

test('La carta es de todo el que aportó, no de quien remató', () => {
  const jefe = { vida: 0, vidaMaxima: 500, aportes: { tú: 5, Ana: 495 } };
  assert.ok(mereceRecompensa(jefe, 'tú'), 'aportar poco sigue siendo aportar');
  assert.ok(mereceRecompensa(jefe, 'Ana'));
  assert.ok(!mereceRecompensa(jefe, 'Bruno'), 'quien no aportó no cobra');
  assert.ok(!mereceRecompensa({ ...jefe, vida: 1 }, 'Ana'), 'el jefe vivo no da nada');
});

test('No se asalta sin jefe, sin almacén, fuera de ventana ni pasado el tope', () => {
  const jefe = { vida: 500, desde: T0, hasta: T0 + 5 * 24 * HORA };
  assert.equal(puedeAsaltar({ almacen: 1000, asaltosHoy: 0 }, T0 + HORA, jefe), null);
  assert.ok(puedeAsaltar({ almacen: 1000, asaltosHoy: 0 }, T0, null));
  assert.ok(puedeAsaltar({ almacen: 0, asaltosHoy: 0 }, T0 + HORA, jefe));
  assert.ok(puedeAsaltar({ almacen: 1000, asaltosHoy: CUENCA.asaltosPorDia }, T0 + HORA, jefe));
  assert.ok(puedeAsaltar({ almacen: 1000, asaltosHoy: 0 }, T0 + 99 * 24 * HORA, jefe));
  assert.ok(puedeAsaltar({ almacen: 1000, asaltosHoy: 0 }, T0 + HORA, { ...jefe, vida: 0 }));
});

test('La tabla de aportes ordena de más a menos y no inventa cuotas', () => {
  const t = tablaDeAportes({ aportes: { Ana: 100, tú: 300, Bruno: 0 } });
  assert.deepEqual(t.map((x) => x.quien), ['tú', 'Ana']);
  assert.ok(Math.abs(t.reduce((n, x) => n + x.cuota, 0) - 1) < 1e-9);
});

// ---------------------------------------------------------------- calendario

test('El calendario cicla y nunca solapa dos jefes', () => {
  for (let dia = 0; dia < CICLO * 2; dia++) {
    const activos = eventosActivos(T0, T0 + dia * 24 * HORA);
    const jefes = activos.filter((e) => e.tipo === TIPO_EVENTO.JEFE);
    assert.ok(jefes.length <= 1, `día ${dia}: ${jefes.length} jefes a la vez`);
  }
});

test('Hay jefe la mayor parte del ciclo, o la cuenca está muerta', () => {
  let conJefe = 0;
  for (let dia = 0; dia < CICLO; dia++) {
    if (jefeActivo(T0, T0 + dia * 24 * HORA)) conJefe++;
  }
  assert.ok(conJefe >= CICLO * 0.6, `sólo ${conJefe} de ${CICLO} días tienen jefe`);
});

test('Los mazos de los jefes son legales', () => {
  for (const [id, j] of Object.entries(JEFES)) {
    const total = j.mazo.reduce((n, [, c]) => n + c, 0);
    assert.equal(total, BALANCE.tamanoMazo, `${id} suma ${total} cartas`);
    for (const [cardId, copias] of j.mazo) {
      const c = CARTAS[cardId];
      assert.ok(c, `${id}: la carta "${cardId}" no existe`);
      assert.ok(copias <= BALANCE.copiasPorRareza[c.rareza],
        `${id}: ${cardId} lleva ${copias} y su rareza permite ${BALANCE.copiasPorRareza[c.rareza]}`);
    }
  }
});

test('Las cartas de jefe existen y están FUERA del set', () => {
  for (const j of Object.values(JEFES)) {
    const premio = CARTAS_DE_JEFE[j.recompensa];
    assert.ok(premio, `${j.id} promete "${j.recompensa}" y no existe`);
    // Si cayeran de un sobre, nadie coordinaría nada con nadie.
    assert.ok(!CARTAS[j.recompensa], `${j.recompensa} está en el set y no debería`);
  }
});

test('Todo evento del calendario apunta a algo real', () => {
  for (const e of CALENDARIO) {
    assert.ok(e.dura > 0 && e.dia >= 0);
    if (e.tipo === TIPO_EVENTO.JEFE) assert.ok(JEFES[e.jefe], `${e.id}: jefe "${e.jefe}" inexistente`);
    if (e.tipo === TIPO_EVENTO.CLIMA) assert.ok(CARTAS[e.clima], `${e.id}: clima "${e.clima}" inexistente`);
  }
});
