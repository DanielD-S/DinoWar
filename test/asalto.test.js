// El modelo de autoridad, probado. Si estos tests pasan, el navegador no puede
// declarar daño que no hizo — y si alguno deja de pasar, puede.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validarAsalto, validarMazoDeAsalto, jefeDelEvento, AsaltoInvalido, LIMITES,
} from '../supabase/functions/_compartido/validarAsalto.js';
import { reduce, ACCION, legales } from '../src/engine/actions.js';
import { crearPartida, vistaDe, FASE } from '../src/engine/state.js';
import { decidir, PERFIL } from '../src/engine/ai.js';
import { semilla } from '../src/engine/rng.js';
import { habitatDeAsalto } from '../src/data/tribu.js';
import { JEFES } from '../src/data/eventos.js';
import { MAZO } from '../src/data/balance.js';

const MAZO_OK = MAZO.map(([id, n]) => [id, n]);

/**
 * Graba un asalto de verdad: juega la partida contra el jefe con la heurística
 * llevando tu bando y devuelve SÓLO tus jugadas, que es exactamente lo que el
 * navegador mandará. Probar el validador con una lista vacía no probaría nada.
 */
function grabarAsalto(seed) {
  const jefe = JEFES.saurophaganax;
  let s = crearPartida(seed, [MAZO_OK, jefe.mazo.map((e) => [...e])]);
  s.jugadores[1].habitat = habitatDeAsalto();
  let rng0 = semilla(seed ^ 0x1111);
  let rng1 = semilla(seed ^ 0x5bf03635);
  const acciones = [];
  while (s.fase !== FASE.FIN) {
    if (s.fase === FASE.DESPLIEGUE || s.fase === FASE.DESCARTE) {
      const f = s.fase;
      let pasos = 0;
      while (s.fase === f) {
        let actuo = false;
        if (legales(s, 0).length) {
          const d = decidir(vistaDe(s, 0), 0, rng0, PERFIL.HEURISTICA);
          rng0 = d.rng;
          if (d.accion) { acciones.push(d.accion); s = reduce(s, d.accion); actuo = true; }
        }
        if (s.fase === f && legales(s, 1).length) {
          const d = decidir(vistaDe(s, 1), 1, rng1, PERFIL.HEURISTICA);
          rng1 = d.rng;
          if (d.accion) { s = reduce(s, d.accion); actuo = true; }
        }
        if (!actuo) break;
        if (++pasos > 200) throw new Error('no converge');
      }
      continue;
    }
    s = reduce(s, { tipo: ACCION.AVANZAR });
  }
  return {
    acciones,
    real: { turnos: s.turno, ganada: s.ganador === 0, trofeos: s.jugadores[0].trofeos },
  };
}

const PARTIDA = grabarAsalto(4242);
const ENVIO = {
  jefeEvento: 'caza_saurophaganax', semilla: 4242, mazo: MAZO_OK, acciones: PARTIDA.acciones,
};

const falla = (envio, trozo) => {
  assert.throws(() => validarAsalto(envio), (e) => {
    assert.ok(e instanceof AsaltoInvalido, `esperaba AsaltoInvalido, vino ${e.name}: ${e.message}`);
    if (trozo) assert.match(e.message, trozo);
    return true;
  });
};

// ------------------------------------------------------- el camino que vale

test('El servidor reproduce la partida que jugó el navegador, jugada a jugada', () => {
  // Es LA prueba: si el servidor no llega al mismo estado final, no puede
  // calcular el daño por su cuenta y todo el modelo de autoridad se cae.
  const r = validarAsalto(ENVIO);
  assert.equal(r.turnos, PARTIDA.real.turnos);
  assert.equal(r.ganada, PARTIDA.real.ganada);
  assert.equal(r.trofeos, PARTIDA.real.trofeos);
  assert.ok(r.dano >= 0);
});

test('Una partida que se corta a medias no se acepta a medias', () => {
  // Quedarse corto en la fase de descarte es un envío incompleto, no un
  // asalto flojo: el servidor no elige por ti qué carta tiras.
  const cortada = PARTIDA.acciones.slice(0, 3);
  const r = () => validarAsalto({ ...ENVIO, acciones: cortada });
  // O bien la partida se termina pasando —legal— o falta información. Lo que no
  // puede es dar el mismo daño que la partida entera.
  try {
    assert.notEqual(r().dano, validarAsalto(ENVIO).dano);
  } catch (e) {
    assert.ok(e instanceof AsaltoInvalido, e.message);
  }
});

test('La misma semilla da el mismo daño: sin eso no hay nada que validar', () => {
  const a = validarAsalto(ENVIO);
  const b = validarAsalto({ ...ENVIO });
  assert.deepEqual(a, b);
});

test('Semillas distintas dan partidas distintas', () => {
  // Cada semilla necesita SU grabación: las jugadas nombran ejemplares
  // concretos y con otra semilla esos ejemplares no existen. Que no se puedan
  // reutilizar es en sí una defensa — no se puede repetir un asalto bueno.
  const vistos = new Set();
  for (const seed of [11, 22, 33, 44, 55, 66]) {
    const g = grabarAsalto(seed);
    vistos.add(JSON.stringify(validarAsalto({ ...ENVIO, semilla: seed, acciones: g.acciones })));
  }
  assert.ok(vistos.size > 1, 'todas las semillas dieron el mismo resultado');
});

test('Las jugadas de otra partida no valen en ésta', () => {
  // Reenviar la grabación de un asalto bueno con otra semilla no cuela: los
  // ejemplares que nombra no son los de esta partida.
  const otra = grabarAsalto(9999);
  assert.throws(
    () => validarAsalto({ ...ENVIO, acciones: otra.acciones }),
    (e) => e instanceof AsaltoInvalido,
  );
});

// ------------------------------------------------------------- las trampas

test('El daño que diga el cliente NO se lee', () => {
  const honesto = validarAsalto(ENVIO);
  const mentiroso = validarAsalto({
    ...ENVIO,
    dano: 999999, danoAlHabitat: 999999, trofeos: 99, ganada: true, vida: 0,
  });
  assert.deepEqual(mentiroso, honesto, 'un campo del cliente se coló en el resultado');
});

test('Las jugadas del JEFE no se aceptan del cliente', () => {
  // La trampa más rentable de todas: mandar un jefe que pasa siempre y no
  // defiende nada. El validador reetiqueta toda jugada como tuya, así que
  // marcarla «jugador: 1» no cambia quién juega al jefe: lo juega el servidor.
  const conJefeDormido = PARTIDA.acciones.map((a) => ({ ...a, jugador: 1 }));
  const r = validarAsalto({ ...ENVIO, acciones: conJefeDormido });
  assert.equal(r.dano, validarAsalto(ENVIO).dano,
    'el cliente consiguió cambiar cómo juega el jefe');
});

test('Una jugada ilegal tumba el asalto entero, no se ignora', () => {
  falla({ ...ENVIO, acciones: [{ tipo: ACCION.DESPLEGAR, iid: 9999, ranura: 0 }] }, /ilegal/);
});

test('Una acción inventada no cuela', () => {
  falla({ ...ENVIO, acciones: [{ tipo: 'GANAR_LA_PARTIDA' }] }, /ilegal/);
});

test('No se puede quemar CPU con una lista enorme', () => {
  const enorme = Array.from({ length: LIMITES.acciones + 1 }, () => ({ tipo: ACCION.PASAR }));
  falla({ ...ENVIO, acciones: enorme }, /demasiadas/);
});

// --------------------------------------------------------------- los mazos

test('El mazo tiene que ser legal', () => {
  assert.ok(validarMazoDeAsalto(MAZO_OK));
  falla({ ...ENVIO, mazo: [['allosaurus', 50]] }, /rareza/);
  falla({ ...ENVIO, mazo: [['no_existe_este_bicho', 50]] }, /desconocida/);
  falla({ ...ENVIO, mazo: [['allosaurus', 2]] }, /cartas exactas/);
  falla({ ...ENVIO, mazo: [] }, /ausente/);
  falla({ ...ENVIO, mazo: [['allosaurus', -3]] }, /copias inválidas/);
});

test('No se puede asaltar a un jefe que no existe ni a un evento que no es caza', () => {
  falla({ ...ENVIO, jefeEvento: 'sequia_cuenca' }, /no es una caza/);
  falla({ ...ENVIO, jefeEvento: 'inventado' }, /no es una caza/);
  assert.ok(jefeDelEvento('caza_saurophaganax').jefe);
});

test('La semilla tiene que ser un entero', () => {
  falla({ ...ENVIO, semilla: 'hola' }, /semilla/);
  falla({ ...ENVIO, semilla: 1.5 }, /semilla/);
});

test('Un envío vacío o sin jugadas no pasa', () => {
  falla(null, /vacío/);
  falla({ ...ENVIO, acciones: 'todas' }, /jugadas/);
});
