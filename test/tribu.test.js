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
  ROL, ACCESO, puedeExpulsar, puedeCederMando, relevoDeMando, estadoEnLista,
  puedeDeshacer, puedeReclamarMando, ausenciaDe, AUSENCIA,
} from '../src/data/mando.js';
import {
  CALENDARIO, CICLO, JEFES, CARTAS_DE_JEFE, eventosActivos, jefeActivo, TIPO_EVENTO,
} from '../src/data/eventos.js';
import { CARTAS } from '../src/data/cards.js';
import { BALANCE } from '../src/data/balance.js';
import { limiteDe } from '../src/data/coleccion.js';

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
      assert.ok(copias <= limiteDe(cardId),
        `${id}: ${cardId} lleva ${copias} y su tope es ${limiteDe(cardId)}`);
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

// ------------------------------------------------------------------ mando

const CAPATAZ = { id: 'a', rol: ROL.CAPATAZ, desde: 100 };
const VIEJA = { id: 'b', rol: ROL.MIEMBRO, desde: 200 };
const NUEVO = { id: 'c', rol: ROL.MIEMBRO, desde: 900 };
const TRIBU = [CAPATAZ, VIEJA, NUEVO];

test('Sólo el capataz echa a alguien, y nunca a sí mismo', () => {
  assert.equal(puedeExpulsar(CAPATAZ, NUEVO), null);
  assert.ok(puedeExpulsar(VIEJA, NUEVO), 'un miembro no puede echar a otro');
  assert.ok(puedeExpulsar(CAPATAZ, CAPATAZ), 'echarse a sí mismo es salir, no expulsar');
});

test('Ceder el mando es cosa del capataz y hacia otra persona', () => {
  assert.equal(puedeCederMando(CAPATAZ, VIEJA), null);
  assert.ok(puedeCederMando(VIEJA, NUEVO));
  assert.ok(puedeCederMando(CAPATAZ, CAPATAZ));
});

test('Si el capataz se va, hereda quien lleva más tiempo', () => {
  assert.equal(relevoDeMando(TRIBU, 'a'), 'b');
  // Y si se van los dos antiguos, el último que queda.
  assert.equal(relevoDeMando([CAPATAZ, NUEVO], 'a'), 'c');
});

test('Deshacer la cuenca es del capataz, y sólo estando solo', () => {
  assert.equal(puedeDeshacer(CAPATAZ, [CAPATAZ]), null);
  assert.ok(puedeDeshacer(CAPATAZ, TRIBU), 'con gente dentro no se deshace');
  assert.ok(puedeDeshacer(VIEJA, [VIEJA]), 'un miembro no deshace nada');
});

test('El último que se va no deja capataz: no queda tribu', () => {
  assert.equal(relevoDeMando([CAPATAZ], 'a'), null);
});

// -------------------------------------------------- el capataz que no vuelve

const AHORA = T0;
const conVisto = (m, hace) => ({ ...m, visto: AHORA - hace });
const DIA = 86400_000;

test('Al capataz que sigue entrando no se le quita el mando', () => {
  const tribu = [conVisto(CAPATAZ, DIA), conVisto(VIEJA, 0)];
  assert.ok(puedeReclamarMando(tribu[1], tribu, AHORA));
});

test('Pasado el plazo, el mando lo coge quien lo pida', () => {
  const tribu = [conVisto(CAPATAZ, 9 * DIA), conVisto(VIEJA, 0), conVisto(NUEVO, 0)];
  // Cualquiera de los dos, y no sólo el más antiguo: si la tribu se apagó, el
  // más antiguo suele ser otro ausente y el mando se quedaría donde no hay nadie.
  assert.equal(puedeReclamarMando(tribu[1], tribu, AHORA), null);
  assert.equal(puedeReclamarMando(tribu[2], tribu, AHORA), null);
  // El capataz no se releva a sí mismo.
  assert.ok(puedeReclamarMando(tribu[0], tribu, AHORA));
});

test('Justo en el plazo todavía no, y un instante después sí', () => {
  const enElFilo = [conVisto(CAPATAZ, AUSENCIA - 1), conVisto(VIEJA, 0)];
  assert.ok(puedeReclamarMando(enElFilo[1], enElFilo, AHORA));
  const pasado = [conVisto(CAPATAZ, AUSENCIA), conVisto(VIEJA, 0)];
  assert.equal(puedeReclamarMando(pasado[1], pasado, AHORA), null);
});

test('Una tribu sin capataz la coge cualquiera sin esperar', () => {
  const huerfana = [conVisto(VIEJA, 0), conVisto(NUEVO, 0)];
  assert.equal(puedeReclamarMando(huerfana[0], huerfana, AHORA), null);
});

test('Sin saber cuándo se le vio, el capataz no es relevable', () => {
  // Una fila vieja puede no traer `visto`. Tratarlo como «ausente desde
  // siempre» le quitaría el mando a alguien que está jugando.
  const tribu = [CAPATAZ, VIEJA];
  assert.equal(ausenciaDe(CAPATAZ, AHORA), null);
  assert.ok(puedeReclamarMando(VIEJA, tribu, AHORA));
});

test('Sin fecha de entrada el relevo sigue siendo determinista', () => {
  // Dos filas antiguas sin `tribu_desde`: el desempate es el id, no el orden
  // en que vinieran de la base de datos.
  const sinFecha = [{ id: 'z', rol: ROL.MIEMBRO }, { id: 'm', rol: ROL.MIEMBRO }];
  assert.equal(relevoDeMando([CAPATAZ, ...sinFecha], 'a'), 'm');
  assert.equal(relevoDeMando([CAPATAZ, ...sinFecha.slice().reverse()], 'a'), 'm');
});

// ------------------------------------------------------------ lista de cuencas

const LIBRE = { id: 't1', acceso: ACCESO.LIBRE, miembros: 3, tope: 8, pedida: false };
const CERRADA = { ...LIBRE, id: 't2', acceso: ACCESO.SOLICITUD };

test('Una cuenca libre con sitio se entra; una cerrada se pide', () => {
  assert.equal(estadoEnLista(LIBRE, false), 'entrar');
  assert.equal(estadoEnLista(CERRADA, false), 'pedir');
});

test('Llena, pedida o con cuenca propia: no hay botón que valga', () => {
  assert.equal(estadoEnLista({ ...LIBRE, miembros: 8 }, false), 'llena');
  assert.equal(estadoEnLista({ ...CERRADA, pedida: true }, false), 'pedida');
  assert.equal(estadoEnLista(LIBRE, true), 'tienes-cuenca');
});

test('Tener cuenca manda sobre todo lo demás', () => {
  // Si ya estás en una, da igual que la de la lista esté libre y con sitio:
  // primero se sale. Lo vuelve a comprobar `unirse_a_tribu`.
  assert.equal(estadoEnLista({ ...LIBRE, pedida: true }, true), 'tienes-cuenca');
});
