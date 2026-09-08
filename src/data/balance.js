// DinoWar — todos los números de balance viven aquí y en ningún otro sitio.
// Si una constante numérica aparece en engine/ o ui/, es un bug.

import { CARTAS, CLADO, RAREZA } from './cards.js';

export const BALANCE = Object.freeze({
  // ------------------------------------------------------------- victorias
  trofeosParaGanar: 8,      // registro fósil
  vidaHabitat: 34,            // colapso del habitat
  // la tercera, extinción, no tiene número: es quedarse sin cartas al robar

  // ---------------------------------------------------------------- campo
  ranuras: 5,

  // -------------------------------------------------------------- recursos
  // La renta NO depende de dominar el campo. Es la corrección central de la v2:
  // en la v1, atarla al control hacía que el 87,6 % de las partidas las ganase
  // quien iba por delante en el turno 6.
  rentaPorTurno: 1,         // Biomasa = turno × esto, hasta el tope
  rentaTope: 8,
  rentaAcumula: false,      // lo que no gastas se pierde

  manoInicial: 6,
  manoMaxima: 7,
  robo: Object.freeze({ normal: 1 }),
  // Sin rebarajado, el mazo es finito y agotarlo es un reloj real, como en
  // Pokémon. Con robo de 2 y mazo de 30, se acaba justo en la franja de turnos
  // objetivo: la extinción muerde en las partidas que se alargan.
  rebarajarDescarte: false,
  // Con despliegue simultáneo no hay ventaja de iniciativa que compensar.
  compensacionSegundoJugador: Object.freeze({ cartas: 0 }),

  turnoPrimeraEstacion: 3,
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

  // ------------------------------------------------------------------ rasgos
  rasgos: Object.freeze({
    gregarioAtaquePorCompanero: 1,
    riberenoAtaque: 2,
    tagomizadorExtra: 2,
    masaColosalDefensa: 1,   // adicional a la Defensa de su carta
    oportunistaVidaPorMuerte: 1,
    ramoneoBajoCura: 1,
    gregarismoAtaque: 2,
    gastrolitosCura: 1,
    crecimientoAtaque: 2,
    crecimientoVida: 2,
    neumaticidadAtaque: 2,
    fracturaAtaque: 2,
    competenciaAtaque: 2,
    mortandadDano: 2,
    corazaDefensa: 2,
    golaDefensa: 2,
    trampaMazoRival: 12,
    trampaMazoPropio: 3,
  }),

  // Cartas de recurso: Biomasa inmediata con inconveniente. Atacan el atasco de mano,
  // que venía de robar 2 por turno con una renta de 1 acumulativo.
  recursos: Object.freeze({
    rebroteBiomasa: 3,
    rebroteHeridas: 1,
    carronaBiomasa: 3,
    carronaBiomasaRival: 1,
    lagoBiomasa: 2,
    lagoHabitat: 1,
  }),

  efectosCampo: Object.freeze({
    aridezMazo: 5,
    llanuraBiomasa: 1,
    bosqueCura: 1,
    sabanaDanoHabitat: 1,
  }),

  estacion: Object.freeze({
    crecidaCura: 1,
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

  mazoEstacional: Object.freeze([
    Object.freeze(['SEQUIA', 3]),
    Object.freeze(['CRECIDA', 3]),
  ]),

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
 * Fuera se quedan seis cartas, jugables por el jugador pero no medidas aquí:
 * neumaticidad, competencia, bosque, llanura, carroña y lago.
 */
export const MAZO = Object.freeze([
  // dinosaurios — 30
  ['dryosaurus', 3], ['ornitholestes', 3], ['ceratosaurus', 3],
  ['nodosaurus', 3],
  ['stegosaurus', 2], ['allosaurus', 2], ['camarasaurus', 2],
  ['riparovenator', 2], ['lokiceratops', 2], ['brachylophosaurus', 2], ['huaxiadraco', 2],
  ['diplodocus', 1], ['apatosaurus', 1], ['torvosaurus', 1], ['tyrannotitan', 1],
  // soporte — 20
  ['sabana', 3], ['gregarismo', 3], ['trampa', 3], ['rebrote', 2],
  ['gastrolitos', 2], ['fractura', 2], ['aridez', 2],
  ['mortandad', 1], ['crecimiento_acelerado', 1], ['canal', 1],
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
