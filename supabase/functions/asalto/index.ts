// DinoWar — la autoridad del juego. Aquí se decide lo que un jugador GANA.
//
// Tres cosas pasan por aquí, y las tres por el mismo motivo: son las que
// mueven cartas o dinomonedas, y ninguna puede salir de una afirmación del
// navegador.
//
//   asalto    re-juega tu partida contra el jefe y calcula el daño a la tribu.
//   victoria  re-juega tu partida contra la IA y paga las dinomonedas.
//   sobre     cobra el sobre y sortea las cinco cartas, en el servidor.
//
// Sigue llamándose `asalto` porque es el nombre con el que está desplegada y
// renombrar una Edge Function es borrarla y crearla, con la ventana de fallo
// que eso abre. El nombre es historia; el trabajo es el de arriba.
//
// Por qué una sola función y no tres: cada Edge Function nueva trae su
// empaquetado, su anclaje por commit y su despliegue, y son justamente los tres
// sitios donde este proyecto ya se ha equivocado. Una función que despacha por
// `tipo` se empaqueta una vez y se ancla una vez.
//
// El motor se importa tal cual desde src/. Es JavaScript puro con módulos ES,
// sin DOM ni dependencias, así que Deno lo corre sin adaptarlo — que es
// exactamente lo que `test/pureza.test.js` lleva vigilando desde el principio.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  validarAsalto, jefeDelEvento, AsaltoInvalido,
} from '../_compartido/validarAsalto.js';
import { validarSolitario } from '../_compartido/validarSolitario.js';
import {
  crearDuelo, aplicarAccion, vistaDuelo, comprobarTiempo, rendirse, resultado, terminado, partesDe,
} from '../_compartido/duelo.js';
import { validarMazoLegal } from '../_compartido/validarPartida.js';
import { eloTras, temporadaDe, eloVigente, conEscudo } from '../../../src/data/ligas.js';
import { CUENCA } from '../../../src/data/tribu.js';
import { ECONOMIA, abrirSobre } from '../../../src/data/coleccion.js';
import { avancesDelParte, diaUTC, POR_ID } from '../../../src/data/misiones.js';
import { avancesDeLogros } from '../../../src/data/logros.js';

/**
 * Lo que un parte avanza en las misiones de hoy, con la meta y el premio
 * puestos: el catálogo vive en misiones.js y el SQL sólo apunta y paga.
 */
function avancesConPremio(dia: string, parte: Record<string, number>) {
  return avancesDelParte(dia, parte).map((a) => {
    const m = POR_ID[a.id];
    return { id: a.id, avance: a.avance, meta: m.meta, premio: m.premio };
  });
}
import { rivalPorId, requisitoDe, claveDeVictoria } from '../../../src/data/expediciones.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (cuerpo: unknown, status = 200) => new Response(
  JSON.stringify(cuerpo),
  { status, headers: { ...cors, 'Content-Type': 'application/json' } },
);

/** El mazo viaja como pares [carta, copias]; el SQL lo quiere como objeto. */
const aObjeto = (mazo: unknown) => Object.fromEntries(
  (Array.isArray(mazo) ? mazo : []) as Array<[string, number]>,
);

/** Cuántas filas tiene este jugador en las últimas 24 horas. */
async function enUnDia(servicio, tabla: string, jugador: string, columna: string) {
  const desde = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await servicio
    .from(tabla).select('id', { count: 'exact', head: true })
    .eq('jugador_id', jugador).gte(columna, desde);
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'sólo POST' }, 405);

  // Quién eres lo dice el JWT, nunca el cuerpo de la petición. Un jugador_id
  // que viniera en el JSON sería un "soy quien yo diga".
  const auth = req.headers.get('Authorization');
  if (!auth) return json({ error: 'sin sesión' }, 401);

  const comoUsuario = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error: errAuth } = await comoUsuario.auth.getUser();
  if (errAuth || !user) return json({ error: 'sesión inválida' }, 401);

  let envio: Record<string, unknown>;
  try {
    envio = await req.json();
  } catch {
    return json({ error: 'cuerpo ilegible' }, 400);
  }

  // Con la clave de servicio porque las tablas están cerradas a escritura para
  // todo el mundo: el estado de juego sólo lo mueve el servidor, y sólo después
  // de haber visto la partida entera o sorteado el sobre él mismo.
  const servicio = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Sin `tipo` es un asalto: es lo que mandaban las versiones anteriores del
  // juego y siguen siendo peticiones válidas.
  const tipo = (envio.tipo as string) ?? 'asalto';
  try {
    if (tipo === 'asalto') return await hacerAsalto(servicio, user.id, envio);
    if (tipo === 'victoria') return await hacerVictoria(servicio, user.id, envio);
    if (tipo === 'sobre') return await hacerSobre(servicio, user.id);
    if (tipo === 'duelo') return await hacerDuelo(servicio, user.id, envio);
    return json({ error: `no sé hacer «${tipo}»` }, 400);
  } catch (e) {
    if (e instanceof AsaltoInvalido) {
      return json({ error: e.message, detalle: e.detalle }, 422);
    }
    throw e;
  }
});

// ------------------------------------------------------------------ asalto

async function hacerAsalto(servicio, jugadorId: string, envio: Record<string, unknown>) {
  // 1. Re-jugar. Si la partida no cuadra, aquí se cae y no se escribe nada.
  const resultado = validarAsalto(envio);
  const { evento } = jefeDelEvento(envio.jefeEvento as string);

  const { data: jugador } = await servicio
    .from('jugadores').select('tribu_id').eq('id', jugadorId).single();
  if (!jugador?.tribu_id) return json({ error: 'no estás en ninguna tribu' }, 409);

  // 2. ¿Es TUYO ese mazo? `validarAsalto` comprueba que sea legal —las cartas
  //    exactas, las copias por rareza— pero la propiedad es una consulta a la
  //    colección y no cabe en una función pura. Hasta que la colección estuvo en
  //    el servidor, esto no se podía comprobar en ningún sitio.
  const { error: errMazo } = await servicio.rpc('validar_mazo_de', {
    p_jugador: jugadorId, p_cartas: aObjeto(envio.mazo),
  });
  if (errMazo) return json({ error: errMazo.message }, 422);

  // 3. El tope diario se cuenta en el servidor. En el cliente sería un adorno.
  if (await enUnDia(servicio, 'asaltos', jugadorId, 'jugado_en') >= CUENCA.asaltosPorDia) {
    return json({ error: 'ya has hecho tus asaltos de hoy' }, 429);
  }

  // 4. Una transacción: restar vida, cobrar el almacén y anotar el aporte no
  //    pueden quedarse a medias ni pisarse entre dos asaltos simultáneos.
  const { data, error } = await servicio.rpc('aplicar_asalto', {
    p_tribu: jugador.tribu_id,
    p_evento: evento.id,
    p_jugador: jugadorId,
    p_semilla: envio.semilla,
    p_dano: resultado.dano,
    p_turnos: resultado.turnos,
    p_ganada: resultado.ganada,
    p_coste: CUENCA.costeAsalto,
  });

  if (error) {
    // Semilla repetida: la partida es válida, pero cobrarla dos veces no.
    const yaCobrada = error.code === '23505';
    return json({ error: yaCobrada ? 'ese asalto ya se cobró' : error.message },
      yaCobrada ? 409 : 400);
  }

  const fila = Array.isArray(data) ? data[0] : data;

  // 5. Las misiones y los logros del asalto. No hay parte que re-jugar aquí:
  //    lo que cuentan es lo que el servidor ya sabe —que se asaltó, cuánto
  //    daño y si fue el golpe final—. Va aparte de `aplicar_asalto` a
  //    propósito: esa función la llama esta misma Edge Function y conserva
  //    su firma, y un fallo aquí no puede deshacer un asalto ya cobrado.
  const dia = diaUTC();
  const parte = {
    asaltos: 1,
    danoJefe: Math.max(0, Math.round(Number(resultado.dano) || 0)),
    jefesVencidos: fila?.cayo ? 1 : 0,
  };
  const { data: av, error: errAv } = await servicio.rpc('aplicar_avances', {
    p_jugador: jugadorId, p_dia: dia,
    p_avances: avancesConPremio(dia, parte), p_logros: avancesDeLogros(parte),
  });
  if (errAv) console.error('aplicar_avances', errAv.message);

  return json({
    dano: resultado.dano,
    turnos: resultado.turnos,
    ganada: resultado.ganada,
    vida: fila?.vida ?? null,
    cayo: fila?.cayo ?? false,
    almacen: fila?.almacen ?? null,
    monedas: av?.monedas ?? null,
    misiones: av?.misiones ?? 0,
    cumplidas: av?.cumplidas ?? [],
    logros: av?.logros ?? [],
  });
}

// ---------------------------------------------------------------- victoria

async function hacerVictoria(servicio, jugadorId: string, envio: Record<string, unknown>) {
  const resultado = validarSolitario(envio);

  const { error: errMazo } = await servicio.rpc('validar_mazo_de', {
    p_jugador: jugadorId, p_cartas: aObjeto(envio.mazo),
  });
  if (errMazo) return json({ error: errMazo.message }, 422);

  // Se anotan las ganadas Y las perdidas. La perdida no paga —`monedasDerrota`
  // es 0— pero ocupa su fila: así el tope diario cubre también a quien manda
  // partidas perdidas para hacer trabajar al servidor, y de paso queda un
  // historial de partidas, que es lo que un ELO va a necesitar leer.
  if (await enUnDia(servicio, 'partidas', jugadorId, 'jugado_en') >= ECONOMIA.victoriasPorDia) {
    return json({ error: 'ya has cobrado tus partidas de hoy' }, 429);
  }

  // Las misiones del día salen del PARTE que dejó la re-jugada, nunca de lo que
  // diga el navegador: el progreso paga monedas y las monedas compran sobres.
  // El día lo pone el servidor —`diaUTC()`— porque con la fecha del cliente
  // alguien en Auckland avanzaría las misiones de mañana.
  //
  // La meta y el premio VIAJAN en la llamada. El catálogo de misiones vive sólo
  // en `misiones.js`: una copia en SQL traería la trampa de siempre —regenerar
  // no es aplicar— y aquí no hace falta, porque lo único que el SQL hace con
  // una misión es sumarle progreso y pagarle el premio.
  const dia = diaUTC();

  // La primera victoria contra un rival de expedición paga su premio, una vez.
  // Rival, premio y requisito salen de los datos por el id que devolvió la
  // re-jugada; el SQL sólo apunta y paga, y paga cero si el nodo anterior no
  // está vencido o si ya lo estaba éste. Va ANTES de la partida porque el
  // logro de la Morrison cuenta primeras victorias, y eso lo dice esta llamada.
  let expedicion = null;
  if (resultado.ganada && resultado.rival) {
    const { rival: r } = rivalPorId(resultado.rival);
    const { data: exp, error: errExp } = await servicio.rpc('aplicar_expedicion', {
      p_jugador: jugadorId,
      p_clave: claveDeVictoria(r.id, dia),
      p_rival: r.id,
      p_requisito: requisitoDe(r.id),
      p_premio: r.premio,
    });
    if (errExp) console.error('aplicar_expedicion', errExp.message);
    else expedicion = exp;
  }

  // `expediciones` cuenta la partida se gane o se pierda, y por eso puede
  // medirla una misión diaria: `expedicionNuevos` se agota —quien ha
  // vencido los dieciséis nodos sólo estrena uno por semana, el visitante—
  // y una misión que no se puede cumplir no pide nada, estorba.
  // Y el contador del MAPA, para los logros de «entera»: el visitante de la
  // semana no tiene mapa y no cuenta para ninguno.
  const mapa = resultado.rival ? rivalPorId(resultado.rival)?.expedicion?.id ?? null : null;
  const parte = {
    ...resultado.parte,
    expediciones: resultado.rival ? 1 : 0,
    expedicionNuevos: expedicion?.primera ? 1 : 0,
    ...(mapa ? { [`expedicion:${mapa}`]: expedicion?.primera ? 1 : 0 } : {}),
  };
  const { data, error } = await servicio.rpc('aplicar_partida', {
    p_jugador: jugadorId,
    p_semilla: envio.semilla,
    p_turnos: resultado.turnos,
    p_ganada: resultado.ganada,
    p_monedas: resultado.premio,
    p_dia: dia,
    p_avances: avancesConPremio(dia, parte),
    p_logros: avancesDeLogros(parte),
  });

  if (error) {
    const yaCobrada = error.code === '23505';
    return json({ error: yaCobrada ? 'esa partida ya se cobró' : error.message },
      yaCobrada ? 409 : 400);
  }

  return json({
    ganada: resultado.ganada,
    turnos: resultado.turnos,
    premio: data?.premio ?? 0,
    // Lo que pagó la expedición, aparte del premio de la victoria: la pantalla
    // de fin lo dice por separado, que son dos cosas.
    expedicion: expedicion ?? null,
    monedas: data?.monedas ?? null,
    // Lo que las misiones aportaron, para que la pantalla de fin lo diga en vez
    // de que aparezcan monedas de la nada.
    misiones: data?.misiones ?? 0,
    cumplidas: data?.cumplidas ?? [],
    logros: data?.logros ?? [],
    dia: data?.dia ?? dia,
  });
}

// ------------------------------------------------------------------- sobre

async function hacerSobre(servicio, jugadorId: string) {
  // El sorteo mira tu colección para repartir sobre todo entre lo que te FALTA
  // (`ECONOMIA.sesgoFaltan`, el 70 % de las cartas): sin ese sesgo, el 94 % de
  // lo que abrías era una copia que no podías jugar; con sesgo total no sobraba
  // nada y el crafteo no tenía de qué comer. Por eso se lee antes de sortear, y
  // por eso lo sortea el servidor: es el único que sabe de verdad lo que tienes.
  const { data: filas, error: errCol } = await servicio
    .from('coleccion').select('card_id, copias').eq('jugador_id', jugadorId);
  if (errCol) return json({ error: errCol.message }, 400);
  const tengo = Object.fromEntries((filas ?? []).map((f) => [f.card_id, f.copias]));

  // `abrirSobre` recibe el azar como argumento —es puro, no lo busca— así que
  // aquí se le da uno de verdad. En el navegador era Math.random; en el
  // servidor va con crypto, que es lo que impide que el sorteo se pueda
  // predecir desde fuera y elegir cuándo abrir.
  const azar = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const cartas = abrirSobre(azar, tengo);

  // Cobrar y entregar van juntos y con la fila bloqueada: entre leer el saldo
  // y gastarlo cabe otra petición. Si no llega, no se entrega nada.
  const { data, error } = await servicio.rpc('aplicar_sobre', {
    p_jugador: jugadorId, p_cartas: cartas,
  });
  if (error) return json({ error: error.message }, 409);

  return json({ cartas, monedas: data?.monedas ?? null, precio: ECONOMIA.precioSobre });
}

// ------------------------------------------------------------------- duelo

/**
 * El Duelo: dos personas, una partida que lleva el servidor. Todo pasa por
 * aquí con un `op`:
 *
 *   buscar    entrar en la cola pública con tu mazo (o seguir en ella)
 *   retar     abrir un reto con código para un amigo
 *   aceptar   entrar en el reto de un amigo con su código
 *   cancelar  salir de la cola o retirar el reto, si nadie entró aún
 *   estado    mi vista del duelo y los pasos que no he visto
 *   accion    una jugada mía; si con ella los dos quedan servidos, se resuelve
 *   rendirse  abandonar
 *
 * El estado se escribe con «versión»: leo, aplico, escribo si la versión sigue
 * siendo la que leí; si el otro escribió entre medias, vuelvo a leer. Es lo
 * que evita que dos jugadas simultáneas se pisen sin bloquear nada entre dos
 * peticiones HTTP, que no se puede.
 */
async function hacerDuelo(servicio, jugadorId: string, envio: Record<string, unknown>) {
  const op = envio.op as string;
  const ahora = Date.now();

  if (op === 'buscar' || op === 'retar') {
    const mazo = envio.mazo;
    validarMazoLegal(mazo);
    const { error: errMazo } = await servicio.rpc('validar_mazo_de', {
      p_jugador: jugadorId, p_cartas: aObjeto(mazo),
    });
    if (errMazo) return json({ error: errMazo.message }, 422);
    const semilla = crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff;
    const { data, error } = await servicio.rpc(op === 'buscar' ? 'duelo_buscar' : 'duelo_retar', {
      p_jugador: jugadorId, p_mazo: mazo, p_semilla: semilla,
    });
    if (error) return json({ error: error.message }, 409);
    return await responderDuelo(servicio, jugadorId, await asegurarDatos(servicio, data, ahora), 0, ahora);
  }

  if (op === 'aceptar') {
    const mazo = envio.mazo;
    validarMazoLegal(mazo);
    const { error: errMazo } = await servicio.rpc('validar_mazo_de', {
      p_jugador: jugadorId, p_cartas: aObjeto(mazo),
    });
    if (errMazo) return json({ error: errMazo.message }, 422);
    const { data, error } = await servicio.rpc('duelo_aceptar', {
      p_jugador: jugadorId, p_codigo: String(envio.codigo ?? ''), p_mazo: mazo,
    });
    if (error) return json({ error: error.message }, 409);
    return await responderDuelo(servicio, jugadorId, await asegurarDatos(servicio, data, ahora), 0, ahora);
  }

  if (op === 'cancelar') {
    const { error } = await servicio.rpc('duelo_cancelar', { p_jugador: jugadorId });
    if (error) return json({ error: error.message }, 409);
    return json({ ok: true });
  }

  if (op === 'estado' || op === 'accion' || op === 'rendirse') {
    const id = String(envio.id ?? '');
    let { data: fila, error } = await servicio.from('duelos').select('*').eq('id', id).single();
    if (error || !fila) return json({ error: 'ese duelo no existe' }, 404);
    if (fila.jugador_a !== jugadorId && fila.jugador_b !== jugadorId) {
      return json({ error: 'ese duelo no es tuyo' }, 403);
    }
    const bando = fila.jugador_a === jugadorId ? 0 : 1;
    const desde = Number(envio.desde ?? 0) || 0;

    if (fila.estado === 'esperando') {
      if (op !== 'estado') return json({ error: 'todavía no hay rival' }, 409);
      return await responderDuelo(servicio, jugadorId, fila, desde, ahora);
    }
    fila = await asegurarDatos(servicio, fila, ahora);
    if (!fila.datos) return json({ id: fila.id, estado: 'preparando' });

    // Leer, aplicar, escribir si nadie escribió entre medias; si no, otra vez.
    let d = null;
    for (let intento = 0; intento < 4; intento++) {
      d = structuredClone(fila.datos);
      let cambio = comprobarTiempo(d, ahora);
      if (fila.estado !== 'terminado') {
        if (op === 'accion') { aplicarAccion(d, bando, envio.accion, ahora); cambio = true; }
        if (op === 'rendirse') { rendirse(d, bando); cambio = true; }
      }
      if (!cambio) break;
      const { data: escrito, error: errEscritura } = await servicio.from('duelos')
        .update({ datos: d, version: fila.version + 1, actualizado_en: new Date().toISOString() })
        .eq('id', id).eq('version', fila.version).select('version');
      if (errEscritura) return json({ error: errEscritura.message }, 500);
      if (escrito && escrito.length) { fila.datos = d; fila.version += 1; break; }
      // El otro escribió antes: releer y aplicar sobre lo suyo.
      const releida = await servicio.from('duelos').select('*').eq('id', id).single();
      if (releida.error || !releida.data) return json({ error: 'el duelo se perdió' }, 500);
      fila = releida.data;
      if (intento === 3) return json({ error: 'el duelo está muy solicitado, prueba otra vez' }, 409);
    }

    if (terminado(fila.datos) && fila.estado !== 'terminado') {
      fila = await cerrarDuelo(servicio, fila);
    }
    return await responderDuelo(servicio, jugadorId, fila, desde, ahora);
  }

  return json({ error: 'op de duelo desconocida', detalle: op }, 400);
}

/**
 * Entre emparejar y escribir el primer estado hay un instante en que la fila
 * está «jugando» sin datos. Quien llegue primero los crea; si los dos llegan a
 * la vez, el `is('datos', null)` deja pasar sólo a uno y el otro relee.
 */
async function asegurarDatos(servicio, fila, ahora: number) {
  if (!fila || fila.estado !== 'jugando' || fila.datos) return fila;
  const d = crearDuelo(Number(fila.semilla), fila.mazo_a, fila.mazo_b, ahora);
  const { data } = await servicio.from('duelos')
    .update({ datos: d, version: fila.version + 1, actualizado_en: new Date().toISOString() })
    .eq('id', fila.id).eq('version', fila.version).is('datos', null)
    .select('*').maybeSingle();
  if (data) return data;
  const { data: releida } = await servicio.from('duelos').select('*').eq('id', fila.id).single();
  return releida ?? fila;
}

/**
 * Cierra el duelo: ELO, escudo, temporada, historial y monedas, una sola vez.
 * Las reglas de la liga viven en ligas.js; aquí se aplican en orden: primero
 * el reinicio de temporada sobre el ELO de PARTIDA —el de al empezar, que
 * guarda la fila—, luego el movimiento del duelo, luego el escudo.
 */
async function cerrarDuelo(servicio, fila) {
  const r = resultado(fila.datos);
  const { data: js } = await servicio.from('jugadores').select('id, duelos, escudo, temporada')
    .in('id', [fila.jugador_a, fila.jugador_b]);
  const de = (id: string) => (js ?? []).find((x) => x.id === id) ?? {};
  const ja = de(fila.jugador_a);
  const jb = de(fila.jugador_b);
  const dia = diaUTC();
  const eloA = eloVigente(fila.elo_a, ja.temporada, dia);
  const eloB = eloVigente(fila.elo_b, jb.temporada, dia);
  const nuevos = eloTras(eloA, eloB, r.ganador === 0 ? 1 : 0, ja.duelos ?? 0, jb.duelos ?? 0);
  const ea = conEscudo(eloA, nuevos.a, ja.escudo);
  const eb = conEscudo(eloB, nuevos.b, jb.escudo);
  // Las misiones y los logros de cada bando salen del parte que el duelo fue
  // anotando fase a fase —bajas, clados, clima— más los dos contadores
  // propios del duelo. Antes sólo avanzaban las de jugar y ganar.
  const [pa, pb] = partesDe(fila.datos);
  const { error } = await servicio.rpc('duelo_cerrar', {
    p_id: fila.id, p_ganador: r.ganador, p_motivo: r.motivo, p_turnos: fila.datos.estado.turno,
    p_elo_a: ea.elo, p_elo_b: eb.elo, p_monedas_victoria: ECONOMIA.monedasVictoria,
    p_dia: dia,
    p_avances_a: avancesConPremio(dia, pa), p_avances_b: avancesConPremio(dia, pb),
    p_logros_a: avancesDeLogros(pa), p_logros_b: avancesDeLogros(pb),
    p_escudo_a: ea.escudo, p_escudo_b: eb.escudo, p_temporada: temporadaDe(dia),
  });
  if (error) console.error('duelo_cerrar', error.message);
  const { data } = await servicio.from('duelos').select('*').eq('id', fila.id).single();
  return data ?? fila;
}

/**
 * Lo que recibe el cliente: su vista, el rival, los ELO de antes y de ahora.
 * Los ELO van ya VIGENTES —con el reinicio de temporada aplicado si toca—
 * para que la liga que se pinta antes del cierre sea la misma que después.
 */
async function responderDuelo(servicio, jugadorId: string, fila, desde: number, ahora: number) {
  const bando = fila.jugador_a === jugadorId ? 0 : 1;
  const rivalId = bando === 0 ? fila.jugador_b : fila.jugador_a;
  const { data: js } = await servicio.from('jugadores').select('id, apodo, elo, duelos, escudo, temporada')
    .in('id', [jugadorId, rivalId].filter(Boolean));
  const dia = diaUTC();
  const de = (id: string | null) => {
    const j = (js ?? []).find((x) => x.id === id);
    return j ? { apodo: j.apodo, elo: eloVigente(j.elo, j.temporada, dia), duelos: j.duelos, escudo: j.escudo } : null;
  };
  const yo = de(jugadorId);
  const rival = de(rivalId);
  const mia = (js ?? []).find((x) => x.id === jugadorId);
  const base = {
    id: fila.id, estado: fila.estado, codigo: fila.codigo, bando,
    yo, rival,
    eloInicial: eloVigente(bando === 0 ? fila.elo_a : fila.elo_b, mia?.temporada, dia),
  };
  if (fila.estado === 'esperando' || !fila.datos) return json(base);
  return json({ ...base, ...vistaDuelo(fila.datos, bando, desde, ahora) });
}
