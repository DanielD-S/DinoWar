// DinoWar — cuántas cartas tiene el rival donde no se le ven.
//
// Contra la IA el estado es entero y el mazo, la mano y las comprometidas del
// rival son listas: se cuentan con `.length`. En un duelo el servidor no manda
// nada de eso —sería enseñarle al jugador lo que el otro tiene— y en su lugar
// viajan tres números: el mazo como cifra, `manoOculta` y `pendientesOcultos`.
// El tablero contaba las listas y en el primer duelo el mazo del rival salió
// en blanco y su mano en cero, con la partida bien.
//
// Sin DOM, para que el test lo compruebe contra la vista tal y como la monta
// `vistaDuelo()`. La IA ya hacía lo mismo por su cuenta con `mazoDe()`.

/** Cartas en el mazo, sea lista o cifra. */
export const enMazo = (jug) => (typeof jug.mazo === 'number' ? jug.mazo : jug.mazo.length);

/** Cartas en la mano: la lista si se ve, la cifra oculta si no. */
export const enMano = (jug) => (jug.mano.length > 0 ? jug.mano.length : (jug.manoOculta ?? 0));

/** Cartas comprometidas este turno, vistas u ocultas. */
export const comprometidas = (jug) => (jug.pendientes.length > 0
  ? jug.pendientes.length
  : (jug.pendientesOcultos ?? 0));
