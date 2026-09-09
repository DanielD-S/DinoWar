// DinoWar — todos los números de balance viven aquí y en ningún otro sitio.
// Si una constante numérica aparece en engine/ o ui/, es un bug.

import { CARTAS, CLADO, RAREZA } from './cards.js';

export const BALANCE = Object.freeze({
  // ------------------------------------------------------------- victorias
  trofeosParaGanar: 10,      // registro fósil
  vidaHabitat: 70,            // colapso del habitat
  // la tercera, extinción, no tiene número: es quedarse sin cartas al robar

  // ---------------------------------------------------------------- campo
  ranuras: 5,

  // -------------------------------------------------------------- recursos
  // La renta NO depende de dominar el campo. Es la corrección central de la v2:
  // en la v1, atarla al control hacía que el 87,6 % de las partidas las ganase
  // quien iba por delante en el turno 6.
  // La renta es +1 por turno y se acumula: lo que no gastas sigue ahí al turno
  // siguiente. Antes la Biomasa se ponía al número de turno y se perdía el
  // resto, así que gastar 2 en el turno 2 te dejaba con 3 en el turno 3 —el
  // jugador leía «+3» y tenía razón—. Ahora un turno sin gastar es un turno
  // ahorrado, que es lo que hace que guardar sea una decisión.
  // El turno 1 se abre con tres, para que la primera jugada exista: con una
  // sola Biomasa casi nada era pagable y el turno se iba en pulsar Listo.
  biomasaInicial: 3,
  rentaPorTurno: 2,         // a partir de ahí, se suma a lo que ya tenías
  rentaTope: 12,            // tope de lo ahorrado, no de la renta
  rentaAcumula: true,

  manoInicial: 6,
  manoMaxima: 7,
  robo: Object.freeze({ normal: 1 }),
  // Sin rebarajado, el mazo es finito y agotarlo es un reloj real, como en
  // Pokémon. Con robo de 2 y mazo de 30, se acaba justo en la franja de turnos
  // objetivo: la extinción muerde en las partidas que se alargan.
  rebarajarDescarte: false,
  // Con despliegue simultáneo no hay ventaja de iniciativa que compensar.
  compensacionSegundoJugador: Object.freeze({ cartas: 0 }),

  // Reloj de partida al modo del ajedrez: un presupuesto para toda la partida,
  // no por turno. Sólo corre mientras te toca decidir a ti, así que las
  // animaciones y el turno de la IA no te cuestan tiempo. En segundos.
  relojPorJugador: 15 * 60,
  relojAviso: 60,             // por debajo de esto, el marcador apremia

  // Como en Pokémon: en el primer turno no se ataca. Con 1 sola Biomasa era
  // normal que sólo un bando llegase a desplegar, y ese golpeaba un habitat
  // vacío gratis. La apertura pasa a ser de montar, no de arañar daño.
  turnoPrimerCombate: 2,
  limiteTurnos: 40,

  // ------------------------------------------------------------ red trófica
  // No es piedra-papel-tijera: cada relación está respaldada por la misma
  // evidencia que cita la carta correspondiente.
  // La reducción de daño ya NO vive aquí: cada dinosaurio lleva su propia
  // Defensa. Un clado no necesita regla especial si sus números ya lo dicen.
  clados: Object.freeze({
    bonusDepredacion: 2,      // terópodo sobre presa pequeña y cursorial
    presaDe: Object.freeze({ [CLADO.TEROPODO]: CLADO.ORNITOPODO }),
    espinasTireoforo: 2,      // daño devuelto a quien ataca a un tireóforo
  }),

  // Suelo del daño en combate. La Defensa resta daño plano a CADA golpe, así
  // que sin suelo una carta con más Defensa que el Ataque del rival no recibe
  // nada: es inmune, no resistente. Medido, un punto de Defensa llegó a valer
  // 4,8 puntos de Ataque y las cartas ofensivas quedaban muertas. Con el suelo
  // baja a 3,3 y la Vida deja de ser un adorno. Nada es invulnerable.
  danoMinimo: 1,

  // ------------------------------------------------------------------ rasgos
  rasgos: Object.freeze({
    gregarioAtaquePorCompanero: 1,
    riberenoAtaque: 2,
    oportunistaVidaPorMuerte: 1,
    ramoneoBajoCura: 1,
    gregarismoAtaque: 1,
    gastrolitosCura: 1,
    crecimientoAtaque: 2,
    crecimientoVida: 2,
    neumaticidadAtaque: 2,
    fracturaAtaque: 2,
    competenciaDefensa: 2,
    competenciaObjetivos: 2,
    mortandadDano: 3,
    corazaDefensa: 2,
    // Bonificaciones que piden compañía. La de Ceratosaurus pide tres en el
    // campo, que con cinco ranuras y tres copias por mazo es el techo: cuando
    // sale, sale entera.
    cazaEnGrupoAtaque: 2,
    cazaEnGrupoMinimo: 3,
    muroDePlacasDefensa: 1,
    golaDefensa: 2,
    manadaDefensa: 1,
    trampaMazoRival: 5,
    trampaMazoPropio: 3,
  }),

  // Cartas de recurso: Biomasa inmediata con inconveniente. Atacan el atasco de mano,
  // que venía de robar 2 por turno con una renta de 1 acumulativo.
  recursos: Object.freeze({
    rebroteBiomasa: 2,
    rebroteHeridas: 1,
    carronaBiomasa: 3,
    carronaBiomasaRival: 1,
    lagoBiomasa: 2,
    lagoHabitat: 2,
  }),

  efectosCampo: Object.freeze({
    aridezMazo: 5,
    llanuraBiomasa: 1,
    bosqueCura: 1,
    // El canal y la sabana ya no tocan sólo a los tuyos: como todo clima,
    // valen para los dos bandos por igual.
    canalVida: 1,
    sabanaDefensa: 1,
  }),

  // ------------------------------------------------------------------- mazo
  tamanoMazo: 50,

  // Copias que caben de una misma carta. Es a la vez el límite de construcción
  // del jugador y la escala de rareza: son la misma regla mirada desde dos
  // sitios. La épica se queda en 2 y no en 3 porque con 3 el mazo se llenaría
  // de repetidas y quedaría sitio para muy pocas cartas distintas.
  copiasPorRareza: Object.freeze({
    [RAREZA.COMUN]: 3,
    [RAREZA.RARO]: 3,
    [RAREZA.EPICO]: 2,
    [RAREZA.LEGENDARIO]: 1,
  }),


  // --------------------------------------------------------------------- IA
  ia: Object.freeze({
    // Turnos que se espera que una unidad siga en pie aportando. Sin esto la IA
    // sólo mira el asalto siguiente y descarta a los muros: un 3/10 no mata a
    // nadie hoy, pero bloquea cinco turnos.
    horizonte: 3,
    pesoTrofeo: 3.2,        // valor de una baja rival
    pesoHabitat: 1.1,         // valor de 1 de daño al habitat rival
    pesoPerdida: 2.6,       // coste de perder una unidad propia
    pesoDano: 0.35,         // valor de dejar herido sin matar
    pesoCoste: 0.5,
    umbralJugar: 0.15,
  }),
});

/**
 * Mazo de referencia: el que lleva la IA y el que mide BALANCE.md.
 *
 * Hasta las 25 cartas se derivaba de la rareza, porque una copia de cada al
 * máximo daba justo 50. Con 31 no cabe: sumarían 62. Que el mazo sea una
 * SELECCIÓN y no el catálogo entero es lo normal en un juego de cartas, y es
 * lo que hace que construir mazos signifique algo — pero obliga a escribirlo,
 * así que la comprobación de más abajo vigila que no se descuadre.
 *
 * Fuera se quedan cuatro cartas, jugables por el jugador pero no medidas aquí:
 * bosque, llanura, carroña y lago.
 */
export const MAZO = Object.freeze([
  // dinosaurios — 30
  ['dryosaurus', 3], ['ornitholestes', 3], ['ceratosaurus', 3],
  ['nodosaurus', 3],
  ['stegosaurus', 2], ['allosaurus', 2], ['camarasaurus', 2],
  // Lokiceratops pasó a legendaria y sólo admite una copia. La plaza que deja
  // va a Brachylophosaurus, que con la rareza nueva admite tres y es el otro
  // gregario del mazo: la lista sigue siendo la misma clase de mazo.
  ['riparovenator', 2], ['lokiceratops', 1], ['brachylophosaurus', 3], ['huaxiadraco', 2],
  ['diplodocus', 1], ['apatosaurus', 1], ['torvosaurus', 1], ['tyrannotitan', 1],
  // soporte — 20
  //
  // Los climas van a UNA copia. Sólo puede haber un paleoambiente activo, así
  // que la segunda copia en la mano no tiene dónde ir: llevar tres Sabanas no
  // hacía peor a la carta, hacía peor al mazo, y el índice lo cobraba a la
  // carta (0,50 con tres copias, 0,68 con una).
  //
  // Las cuatro plazas que eso libera van a Rebrote y a las dos cartas que el
  // mazo de referencia nunca había medido. Salen calibradas a la primera:
  // neumaticidad 0,98 y competencia 1,05.
  ['gregarismo', 3], ['trampa', 3], ['rebrote', 3],
  ['gastrolitos', 2], ['fractura', 2],
  ['sabana', 1], ['aridez', 1], ['canal', 1],
  ['mortandad', 1], ['crecimiento_acelerado', 1], ['neumaticidad', 1], ['competencia', 1],
].map((e) => Object.freeze(e)));

export const TOTAL_MAZO = MAZO.reduce((n, [, copias]) => n + copias, 0);

// Un mazo mal escrito no debe llegar a una partida: falla al importar, que es
// el único momento en que el error todavía es barato.
for (const [cardId, copias] of MAZO) {
  const c = CARTAS[cardId];
  if (!c) throw new Error(`MAZO: la carta "${cardId}" no existe`);
  const tope = BALANCE.copiasPorRareza[c.rareza];
  if (copias > tope) throw new Error(`MAZO: ${cardId} lleva ${copias} copias y su rareza permite ${tope}`);
}
if (TOTAL_MAZO !== BALANCE.tamanoMazo) {
  throw new Error(`MAZO suma ${TOTAL_MAZO} cartas y deberían ser ${BALANCE.tamanoMazo}`);
}
