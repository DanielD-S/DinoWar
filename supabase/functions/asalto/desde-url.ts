// DinoWar — la autoridad del juego. Versión POR URL: ES LA QUE ESTÁ DESPLEGADA.
//
// Tres cosas pasan por aquí, y las tres por el mismo motivo: son las que mueven
// cartas o dinomonedas, y ninguna puede salir de una afirmación del navegador.
//
//   asalto    re-juega tu partida contra el jefe y calcula el daño a la tribu.
//   victoria  re-juega tu partida contra la IA y paga las dinomonedas.
//   sobre     cobra el sobre y sortea las cinco cartas, en el servidor.
//
// Hace lo mismo que index.ts. La diferencia es de dónde saca el motor: en vez de
// llevarlo empaquetado dentro, lo importa del repositorio por URL, anclado a un
// commit CONCRETO. Anclado y no a una rama: el código que decide si alguien hizo
// trampa no puede cambiar solo porque alguien empuje a main.
//
// Existe para poder desplegar sin subir 122 KB de paquete. NO es una versión
// recortada: durante un rato la dejé capada a asaltos creyendo que en producción
// corría el paquete, y era mentira — corre ésta. Una versión de repuesto más
// corta o más permisiva que la buena es un agujero esperando a que alguien la
// despliegue. Si está desplegada, lo hace todo.
//
// Los importes son ESTÁTICOS y con la URL literal repetida, por feo que quede.
// Con un import dinámico de ruta calculada, la ruta se resuelve en tiempo de
// ejecución, el empaquetado del despliegue no puede verla y el módulo no viaja:
// la función arranca y muere con «Module not found» AUNQUE LA URL CONTESTE 200.
// Costó verlo porque todo lo demás —el commit, la URL, el contenido— estaba bien.
//
// Motor anclado en: c144f9baab3f466e4440b222702c0a4f49a0da40

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  validarAsalto, jefeDelEvento, AsaltoInvalido,
} from 'https://cdn.jsdelivr.net/gh/DanielD-S/DinoWar@c144f9baab3f466e4440b222702c0a4f49a0da40/supabase/functions/_compartido/validarAsalto.js';
import {
  validarSolitario,
} from 'https://cdn.jsdelivr.net/gh/DanielD-S/DinoWar@c144f9baab3f466e4440b222702c0a4f49a0da40/supabase/functions/_compartido/validarSolitario.js';
import { CUENCA } from 'https://cdn.jsdelivr.net/gh/DanielD-S/DinoWar@c144f9baab3f466e4440b222702c0a4f49a0da40/src/data/tribu.js';
import { ECONOMIA, abrirSobre } from 'https://cdn.jsdelivr.net/gh/DanielD-S/DinoWar@c144f9baab3f466e4440b222702c0a4f49a0da40/src/data/coleccion.js';

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
async function enUnDia(servicio, tabla: string, jugador: string) {
  const desde = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count } = await servicio
    .from(tabla).select('id', { count: 'exact', head: true })
    .eq('jugador_id', jugador).gte('jugado_en', desde);
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'sólo POST' }, 405);

  // Quién eres lo dice el JWT, nunca el cuerpo de la petición.
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
  try { envio = await req.json(); } catch { return json({ error: 'cuerpo ilegible' }, 400); }

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
    return json({ error: 'no sé hacer eso', detalle: tipo }, 400);
  } catch (e) {
    if (e instanceof AsaltoInvalido) return json({ error: e.message, detalle: e.detalle }, 422);
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

  // 2. ¿Es TUYO ese mazo? `validarAsalto` sólo mira que sea legal; la propiedad
  //    se comprueba contra tu colección, que vive en la base de datos.
  const { error: errMazo } = await servicio.rpc('validar_mazo_de', {
    p_jugador: jugadorId, p_cartas: aObjeto(envio.mazo),
  });
  if (errMazo) return json({ error: errMazo.message }, 422);

  // 3. El tope diario se cuenta en el servidor. En el cliente sería un adorno.
  if (await enUnDia(servicio, 'asaltos', jugadorId) >= CUENCA.asaltosPorDia) {
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
  return json({
    dano: resultado.dano,
    turnos: resultado.turnos,
    ganada: resultado.ganada,
    vida: fila?.vida ?? null,
    cayo: fila?.cayo ?? false,
    almacen: fila?.almacen ?? null,
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
  if (await enUnDia(servicio, 'partidas', jugadorId) >= ECONOMIA.victoriasPorDia) {
    return json({ error: 'ya has cobrado tus partidas de hoy' }, 429);
  }

  const { data, error } = await servicio.rpc('aplicar_partida', {
    p_jugador: jugadorId,
    p_semilla: envio.semilla,
    p_turnos: resultado.turnos,
    p_ganada: resultado.ganada,
    p_monedas: resultado.premio,
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
    monedas: data?.monedas ?? null,
  });
}

// ------------------------------------------------------------------- sobre

async function hacerSobre(servicio, jugadorId: string) {
  // El sorteo mira tu colección para repartir entre lo que te FALTA: sin ese
  // sesgo, el 94 % de lo que abrías era una copia que no podías jugar. Por eso
  // se lee antes de sortear, y por eso lo sortea el servidor: es el único que
  // sabe de verdad lo que tienes.
  const { data: filas, error: errCol } = await servicio
    .from('coleccion').select('card_id, copias').eq('jugador_id', jugadorId);
  if (errCol) return json({ error: errCol.message }, 400);
  const tengo = Object.fromEntries((filas ?? []).map((f) => [f.card_id, f.copias]));

  // `abrirSobre` recibe el azar como argumento —es puro, no lo busca— así que
  // aquí se le da uno de verdad. En el navegador era Math.random; en el servidor
  // va con crypto, que es lo que impide que el sorteo se pueda predecir desde
  // fuera y elegir cuándo abrir.
  const azar = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const cartas = abrirSobre(azar, tengo);

  // Cobrar y entregar van juntos y con la fila bloqueada: entre leer el saldo y
  // gastarlo cabe otra petición. Si no llega, no se entrega nada.
  const { data, error } = await servicio.rpc('aplicar_sobre', {
    p_jugador: jugadorId, p_cartas: cartas,
  });
  if (error) return json({ error: error.message }, 409);

  return json({ cartas, monedas: data?.monedas ?? null, precio: ECONOMIA.precioSobre });
}
