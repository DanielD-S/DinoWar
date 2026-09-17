// DinoWar — logros: objetivos de una vez, con recompensa que no son monedas.
//
// Las misiones diarias son tres al día y pagan dinomonedas; se acaban a
// medianoche. Un logro es lo contrario: se cumple UNA vez en la vida de la
// cuenta y lo que da no se compra con nada —un título, un cosmético
// exclusivo, un mazo inicial más, sobres gratis—. Son la respuesta a «¿y para
// qué sigo?» cuando ya se han visto los rivales de la Morrison y los dos jefes.
//
// Miden los MISMOS contadores que las misiones (el `VOCABULARIO` de
// misiones.js), acumulados para siempre en vez de por día, y el progreso lo
// escribe el servidor por el mismo camino: nunca lo que diga el navegador. La
// recompensa VIAJA en la llamada, como la meta y el premio de una misión, y el
// SQL sólo apunta y entrega. Lo vigila test/logros.test.js.
//
// DOS EXCEPCIONES al «viaja en la llamada»: los logros de las cartas de jefe
// (`jefe:*` y `cartasJefe`) no los avanza la Edge Function sino
// `reclamar_jefe`, que es SQL y no pasa por ella; y la 0028 contó lo ya jugado
// antes de que existieran. Las dos leen una copia de este catálogo que la 0028
// lleva escrita, y el test falla si esa copia y este fichero se separan.
//
// Las recompensas, y por qué ninguna rompe la regla de la tienda:
//
//   titulo     un título exclusivo de cosmeticos.js: se otorga, no se vende.
//   cosmetico  cualquier otro cosmético exclusivo (retrato, dorso, estandarte).
//   mazo       un mazo inicial más, a elegir entre los que no se tienen. Son
//              cartas, y se ganan JUGANDO, que es el único camino legítimo.
//   sobres     n sobres gratis, que el servidor descuenta antes que las monedas.

import { VOCABULARIO } from './misiones.js';

export const RECOMPENSA = Object.freeze({
  TITULO: 'titulo', COSMETICO: 'cosmetico', MAZO: 'mazo', SOBRES: 'sobres',
});

const L = (id, nombre, texto, mide, meta, recompensa) => Object.freeze({
  id, nombre, texto, mide, meta, recompensa: Object.freeze(recompensa),
});

export const LOGROS = Object.freeze([
  // Los de entrar en cada modo: baratos, para que quien no ha probado el duelo
  // o la cuenca tenga un motivo pequeño para asomarse.
  L('duelista', 'Duelista', 'Juega 1 duelo', 'duelos', 1, { tipo: RECOMPENSA.TITULO, id: 'titulo_duelista' }),
  L('asaltante', 'Asaltante', 'Asalta al jefe 5 veces', 'asaltos', 5, { tipo: RECOMPENSA.TITULO, id: 'titulo_asaltante' }),
  // El golpe de gracia: el asalto que deja al jefe a cero. Se lo lleva quien
  // lo da, que es lo único que el servidor puede saber sin repartir méritos.
  L('cazador', 'Cazador de jefes', 'Da el golpe final a 1 jefe', 'jefesVencidos', 1, { tipo: RECOMPENSA.TITULO, id: 'titulo_cazador' }),

  // Los de las cartas de jefe: se cumplen al RECLAMAR la carta, o sea, al
  // haberle hecho daño a una cacería que la tribu terminó. Es la forma de que
  // el retrato del jefe sea de quien lo cazó con los suyos y no sólo de quien
  // dio el último golpe. Los avanza `reclamar_jefe` (0028).
  L('trofeo_saurophaganax', 'El dueño de la llanura', 'Reclama 1 carta del Saurophaganax', 'jefe:saurophaganax', 1,
    { tipo: RECOMPENSA.COSMETICO, id: 'retrato_saurophaganax' }),
  L('trofeo_barosaurus', 'El gigante del río', 'Reclama 1 carta del Barosaurus', 'jefe:barosaurus', 1,
    { tipo: RECOMPENSA.COSMETICO, id: 'retrato_barosaurus' }),
  L('trofeo_supersaurus', 'El horizonte que camina', 'Reclama 1 carta del Supersaurus', 'jefe:supersaurus', 1,
    { tipo: RECOMPENSA.COSMETICO, id: 'retrato_supersaurus' }),
  L('trofeo_hesperosaurus', 'Detrás de la muralla', 'Reclama 1 carta del Hesperosaurus', 'jefe:hesperosaurus', 1,
    { tipo: RECOMPENSA.COSMETICO, id: 'retrato_hesperosaurus' }),
  L('trofeo_harpactognathus', 'La sombra del río', 'Reclama 1 carta del Harpactognathus', 'jefe:harpactognathus', 1,
    { tipo: RECOMPENSA.COSMETICO, id: 'retrato_harpactognathus' }),
  // Con cinco jefes el dorso pide las cinco: una vuelta entera del calendario.
  L('cazador_mayor', 'Cazador mayor', 'Reclama las 5 cartas de jefe', 'cartasJefe', 5,
    { tipo: RECOMPENSA.COSMETICO, id: 'dorso_cazador' }),

  // Los de constancia.
  L('campeon', 'Campeón', 'Gana 10 duelos', 'duelosGanados', 10, { tipo: RECOMPENSA.TITULO, id: 'titulo_campeon' }),
  L('explorador', 'Explorador', 'Gana 10 partidas', 'victorias', 10, { tipo: RECOMPENSA.SOBRES, n: 3 }),
  L('demoledor', 'Demoledor', 'Hazle 300 de daño a los jefes', 'danoJefe', 300, { tipo: RECOMPENSA.SOBRES, n: 5 }),

  // Los grandes: un mazo inicial más. Eran los otros dos que no elegiste al
  // empezar y sólo se podían completar a base de sobres.
  // Cada mapa mide SU contador y no `expedicionNuevos`, que suma también los
  // visitantes: con ocho primeras victorias contadas a bulto, siete nodos y un
  // visitante ya pagaban «la Morrison entera». El de la Morrison cambió de
  // contador el 16-09-2026 y conserva el progreso que llevara cada cuenta.
  L('morrison', 'La Morrison entera', 'Vence por primera vez a los 8 rivales de la Morrison', 'expedicion:morrison', 8, { tipo: RECOMPENSA.MAZO }),
  // Los tres mapas que siguen pagan sobres y no un mazo: sólo hay dos mazos
  // iniciales que no elegiste, y ya los dan la Morrison y los 25 duelos.
  L('hell_creek', 'Hell Creek entero', 'Vence por primera vez a los 8 rivales de Hell Creek', 'expedicion:hell_creek', 8, { tipo: RECOMPENSA.SOBRES, n: 4 }),
  L('tendaguru', 'Tendaguru entera', 'Vence por primera vez a los 8 rivales de Tendaguru', 'expedicion:tendaguru', 8, { tipo: RECOMPENSA.SOBRES, n: 5 }),
  L('kem_kem', 'Kem Kem entero', 'Vence por primera vez a los 8 rivales de Kem Kem', 'expedicion:kem_kem', 8, { tipo: RECOMPENSA.SOBRES, n: 6 }),
  L('veterano', 'Veterano', 'Gana 25 duelos', 'duelosGanados', 25, { tipo: RECOMPENSA.MAZO }),
  // Y el más grande: el estandarte azul con su cinta.
  L('leyenda', 'Leyenda del duelo', 'Gana 50 duelos', 'duelosGanados', 50,
    { tipo: RECOMPENSA.COSMETICO, id: 'estandarte_campeon' }),
]);

export const LOGRO_POR_ID = Object.freeze(Object.fromEntries(LOGROS.map((l) => [l.id, l])));

const ES_VOCABULARIO = new Set(VOCABULARIO);
export const logroMideAlgoConocido = (l) => ES_VOCABULARIO.has(l.mide);

/**
 * Lo que un parte le suma a cada logro. Sólo lo que avanza, con la meta y la
 * recompensa al lado: es lo que el servidor apunta y entrega.
 *
 * @param {object} parte
 * @returns {Array<{id:string, avance:number, meta:number, recompensa:object}>}
 */
export function avancesDeLogros(parte) {
  return LOGROS
    .map((l) => ({ id: l.id, avance: parte[l.mide] ?? 0, meta: l.meta, recompensa: l.recompensa }))
    .filter((a) => a.avance > 0);
}

/**
 * Cómo se lee una recompensa en pantalla. `describir(id)` dice cómo se llama
 * un cosmético («Título «Duelista»», «Retrato «El dueño…»»): este fichero va
 * dentro de la Edge Function y no importa el catálogo de la tienda.
 */
export function textoDeRecompensa(r, describir = (id) => id) {
  if (r.tipo === RECOMPENSA.TITULO || r.tipo === RECOMPENSA.COSMETICO) return describir(r.id);
  if (r.tipo === RECOMPENSA.MAZO) return 'Un mazo inicial más, a elegir';
  if (r.tipo === RECOMPENSA.SOBRES) return `${r.n} sobres gratis`;
  return '';
}
