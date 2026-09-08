// DinoWar — todos los números de balance viven aquí y en ningún otro sitio.
// Si una constante numérica aparece en engine/ o ui/, es un bug.

import { CLADO } from './cards.js';

export const BALANCE = Object.freeze({
  // ------------------------------------------------------------- victorias
  trofeosParaGanar: 12,      // registro fósil
  vidaHabitat: 26,            // colapso del habitat
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

  manoInicial: 4,
  manoMaxima: 7,
  robo: Object.freeze({ normal: 2 }),
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
    llanuraBiomasa: 1,
    bosqueCura: 1,
    sabanaDanoHabitat: 1,
  }),

  estacion: Object.freeze({
    crecidaCura: 1,
  }),

  // ------------------------------------------------------------------- mazo
  // 30 cartas: 17 dinosaurios, 5 adaptaciones, 4 presiones, 4 de campo.
  mazo: Object.freeze([
    Object.freeze(['dryosaurus', 3]),
    Object.freeze(['ornitholestes', 2]),
    Object.freeze(['ceratosaurus', 2]),
    Object.freeze(['stegosaurus', 2]),
    Object.freeze(['allosaurus', 2]),
    Object.freeze(['camarasaurus', 2]),
    Object.freeze(['diplodocus', 2]),
    Object.freeze(['apatosaurus', 1]),
    Object.freeze(['torvosaurus', 1]),

    Object.freeze(['gregarismo', 2]),
    Object.freeze(['gastrolitos', 1]),
    Object.freeze(['crecimiento_acelerado', 1]),
    Object.freeze(['neumaticidad', 1]),

    Object.freeze(['fractura', 2]),
    Object.freeze(['competencia', 1]),
    Object.freeze(['mortandad', 1]),

    Object.freeze(['rebrote', 1]),
    Object.freeze(['carrona', 1]),
    Object.freeze(['lago', 1]),

    Object.freeze(['llanura', 1]),
    Object.freeze(['canal', 1]),
    Object.freeze(['bosque', 1]),
    Object.freeze(['sabana', 1]),
  ]),

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

export const TOTAL_MAZO = BALANCE.mazo.reduce((n, [, copias]) => n + copias, 0);
