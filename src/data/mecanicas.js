// DinoWar — el vocabulario de las habilidades de criatura.
//
// Las 16 cartas de soporte llevan su mecánica en `rasgo`: un evento ES su
// rasgo, hay dieciséis y cada una hace algo distinto, así que un caso por carta
// en el motor es lo honesto.
//
// Las criaturas son otra cosa. Son cincuenta y dos y sus habilidades se repiten
// con otros números: cuatro auras de clado, ocho contadores, cuatro búsquedas,
// once disparos al entrar. Escritas como cincuenta ramas de `if` en
// `ataqueEfectivo()` no habría quien las leyera, y `efectosDe()` —la función que
// le explica al jugador por qué su carta no marca lo que trae impreso— habría
// necesitado otras cincuenta.
//
// Así que la criatura DECLARA su habilidad como datos y el motor aplica lo que
// encuentra. Poner una carta nueva es escribir un objeto en `cards.js`; sólo se
// toca el motor cuando hace falta una FORMA que todavía no existe.
//
// Los campos son independientes y se acumulan: una carta puede llevar `aura` y
// `entrada` a la vez. `entrada` es un saco de efectos y no una etiqueta única
// porque Spinosaurus muele los dos mazos de una sola llegada.
//
//   cuenta      { que, ambos, ataque, vida }   +n por cada X en juego
//   aura        { clado, ataque, vida, inmune } a los tuyos de ese clado
//   si          { cuando, umbral, ataque, vida } bonificación condicional
//   trio        { copias, ataque, vida }        umbral que se gana PARA SIEMPRE
//   inmune      INMUNE.CLIMA | INMUNE.EVENTO
//   regenera    { propia, aliados }             curación al final del turno
//   espinas     n                               daño devuelto a quien la hiere
//   guardia     { habitat }                     resta a cada golpe a TU hábitat
//   costeExtra  { descartar }                   lo que hay que pagar además
//   busca       QUE.EVENTO | QUE.CLIMA | QUE.MISMA | <CLADO>
//   entrada     { ... }                         ver src/engine/entradas.js

/** Qué se cuenta o qué se busca. */
export const QUE = Object.freeze({
  /** Otras copias de la MISMA carta. */
  MISMA: 'MISMA',
  /** Cualquier carta del mismo clado. */
  CLADO: 'CLADO',
  EVENTO: 'EVENTO',
  CLIMA: 'CLIMA',
});

/** La condición de un `si`. */
export const CUANDO = Object.freeze({
  /** Hay una carta de clima en el campo, la haya puesto quien la haya puesto. */
  CLIMA: 'CLIMA',
  /** Tienes en juego alguna criatura con más de `umbral` de Vida. */
  ALIADO_CON_VIDA: 'ALIADO_CON_VIDA',
  /**
   * Tu hábitat está por debajo del de tu rival. Es la única condición del set
   * que premia ir perdiendo, y está aquí a propósito: la bola de nieve —quien
   * va por delante en el turno 5 gana el 70 % de las veces— es el problema de
   * balance abierto más viejo del proyecto.
   */
  HABITAT_DETRAS: 'HABITAT_DETRAS',
});

/** De qué se puede ser inmune. */
export const INMUNE = Object.freeze({
  CLIMA: 'CLIMA',
  EVENTO: 'EVENTO',
});

/** Un aura que no mira el clado. */
export const TODOS = 'TODOS';
