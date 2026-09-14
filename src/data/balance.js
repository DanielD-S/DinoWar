// DinoWar — todos los números de balance viven aquí y en ningún otro sitio.
// Si una constante numérica aparece en engine/ o ui/, es un bug.

import { CARTAS, CLADO, RAREZA } from './cards.js';

export const BALANCE = Object.freeze({
  // ------------------------------------------------------------- victorias
  trofeosParaGanar: 10,      // registro fósil
  vidaHabitat: 70,            // colapso del habitat
  // la tercera, extinción, no tiene número: es quedarse sin cartas al robar

  // ---------------------------------------------------------------- campo
  // CUATRO carriles. Eran cinco hasta que se midió el cambio sobre 2.000
  // partidas por variante: los dos cumplen 6 de los 7 objetivos, pero con
  // cuatro la ventaja del que empieza sube de 46,1 a 47,8 —el objetivo que
  // falla, y se acerca—, el reparto de vías se equilibra (trofeos 35,7 → 46,4,
  // hábitat 44,3 → 31,8) y la biomasa ahorrada casi se dobla, de 8,4 a 14,4:
  // con un carril menos guardar es una decisión mucho más frecuente.
  //
  // Se puede medir otro número sin tocar el fichero, igual que la economía y el
  // daño sobrante:
  //   DINOWAR_RANURAS=5 node sim/run.js --out BALANCE_5.md
  //
  // CUIDADO: el navegador no tiene `process`, así que ahí siempre sale el valor
  // de reserva. Poner esta variable en el entorno del SERVIDOR haría que la
  // Edge Function re-jugase con otro campo y rechazara todas las partidas. Es
  // para medir en local y nada más.
  ranuras: Number(
    (typeof process !== 'undefined' && process.env && process.env.DINOWAR_RANURAS) || 4,
  ),

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

  // --------------------------------------------------- variantes de economía
  // Tres economías medibles. La de siempre es FIJA y es la que juega el juego
  // publicado; las otras dos existen para decidir con datos, no discutiendo.
  //
  //  FIJA    lo de hoy: renta igual para los dos, garantizada, sin tipo.
  //  TIPADA  renta igual y garantizada, pero CON tipo: declaras qué produces
  //          un turno por adelantado y sólo paga a quien come eso. Cero
  //          varianza, compromiso de mazo real.
  //  CARTAS  la Biomasa es carta de recurso, al modo de las tierras de Magic:
  //          una por turno, gratis, y el tipo lo trae la carta.
  //
  // El riesgo de CARTAS está medido antes de escribirla: con mano 6 y robo de
  // 1, 18 recursos en 50 cartas dejan al jugador sin lo mínimo en el turno 4 el
  // 29 % de las partidas, y sin NINGUNO de un tipo concreto el 13,9 %. Magic
  // aguanta eso porque tiene mulligan con scry, cantrips y duales; aquí sólo se
  // ven 9 cartas en el turno 4.
  economia: Object.freeze({
    // El modo se fija por entorno y sólo desde Node: el juego publicado corre
    // SIEMPRE en FIJA. Es una variable y no una constante editable a mano para
    // que medir las tres no obligue a tocar este fichero entre corridas —y para
    // que nadie publique sin querer una variante a medio medir.
    //   DINOWAR_ECONOMIA=TIPADA node sim/run.js
    modo: (typeof process !== 'undefined' && process.env && process.env.DINOWAR_ECONOMIA) || 'FIJA',

    // La pirámide trófica, hecha regla: la eficiencia ecológica entre niveles
    // ronda el 10 %, así que sostener carne cuesta mucha más planta. El ratio
    // no es un capricho de diseño, es de dónde sale la comida.
    tipada: Object.freeze({
      vegetal: 2,               // si declaras vegetal, cobras 2
      animal: 1,                // si declaras animal, cobras 1
      declaraConAntelacion: true,  // lo eliges un turno antes, a ciegas
    }),

    cartas: Object.freeze({
      porMazo: 18,              // cuántas de las 50 son recurso
      fraccionAnimal: 0.45,     // de esas, cuántas de tipo animal
      porTurno: 1,              // cuántas puedes bajar por turno
      valor: 1,                 // Biomasa que da cada una
    }),
  }),

  // Las cartas de Biomasa. Lo que da cada una y lo que muele van EN LA CARTA
  // (`biomasa: { da, muele }` en cards.js), porque desde que son diez ya no es
  // un número, y `test/textos.test.js` los compara con el texto impreso como
  // hace con las mecánicas de las criaturas. Aquí sólo queda la regla común.
  //
  // Medido sobre 4.000 partidas y dos semillas: con 7 Praderas en un mazo de
  // 55 los trofeos bajan del 60 al 36 % de las victorias y el jugador inicial
  // sube a 48,3 %, que entra en banda por primera vez desde que existe la v2.
  // Con 5 copias se queda en 47,9 % y no entra. Subir la renta en vez de poner
  // la carta NO sirve: da los mismos números y dispara la bola de nieve al
  // 71 %, porque regalar Biomasa acelera a quien va ganando y una carta que
  // ocupa sitio en tu mazo y te cuesta otra, no.
  biomasa: Object.freeze({
    porTurno: 1,   // cuántas puedes bajar en un turno, sean las que sean
  }),

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
  // Los clados ya no tienen reglas. Eran dos —+2 del terópodo contra
  // ornitópodos y 2 de púas del tireóforo— y medidas valían unos dos puntos de
  // reparto entre las tres vías de victoria: apagarlas movía 36/43/21 a
  // 38/43/19. El clado sigue en la ficha como CLASIFICACIÓN, que es lo que hace
  // que un Diplodocus y un Barosaurus no sean la misma carta con otra foto, pero
  // no mueve ningún número.


  // Suelo del daño en combate. La Defensa resta daño plano a CADA golpe, así
  // que sin suelo una carta con más Defensa que el Ataque del rival no recibe
  // nada: es inmune, no resistente. Medido, un punto de Defensa llegó a valer
  // 4,8 puntos de Ataque y las cartas ofensivas quedaban muertas. Con el suelo
  // baja a 3,3 y la Vida deja de ser un adorno. Nada es invulnerable.

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
    competenciaVida: 2,
    competenciaObjetivos: 2,
    mortandadDano: 3,
    corazaVida: 2,
    // Bonificaciones que piden compañía. La de Ceratosaurus pide tres en el
    // campo, que con cinco ranuras y tres copias por mazo es el techo: cuando
    // sale, sale entera.
    cazaEnGrupoAtaque: 2,
    cazaEnGrupoMinimo: 3,
    muroDePlacasVida: 1,
    golaVida: 2,
    manadaVida: 1,
    trampaMazoRival: 5,
    trampaMazoPropio: 3,
    // La ronda de las cien cartas: los cinco biomas que fueron clima, como
    // eventos, y un nido. Ninguno señala a nadie: caen sobre la mesa entera.
    sabanaHelechosRoba: 2,
    sabanaHelechosDescarta: 1,
    inundacionMazo: 3,        // cartas que pierden LOS DOS
    inundacionRoba: 1,
    canalTrenzadoCura: 2,
    bosqueRiberenoMano: 2,    // cartas que el rival descarta de la mano
    nidoRoba: 2,
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
    insectosBiomasa: 1,
    insectosRoba: 1,
    manadaPasoBiomasa: 2,
    manadaPasoMazo: 3,
    frutosBiomasa: 3,
    frutosRobaRival: 1,
  }),

  efectosCampo: Object.freeze({
    // La Sequía dura TRES turnos y muele UNA carta a cada jugador por turno.
    // Con 5 por turno y sin caducar, `sim/climas.js` la medía como un botón
    // de ganar: 100 % de extinciones a 6,4 turnos, cero trofeos, cero
    // hábitat. Bajar la cifra sola no bastaba —a 2 seguía siendo el 78 %—
    // porque lo que rompía era que durase para siempre.
    aridezMazo: 1,
    aridezTurnos: 3,
    // La llanura anegada deja CAMBIAR una carta: la que sueltas va al fondo del
    // mazo y robas la de arriba. Una por turno, cada jugador elige la suya.
    //
    // Sin el robo era una pérdida seca y no la usaba nadie: `sim/climas.js` midió
    // cero devoluciones en 300 partidas y la carta salía IDÉNTICA al control en
    // las seis columnas.
    //
    // Daba +1 de Biomasa a los dos, que es exactamente lo que ahora hace la
    // sabana, y dos cartas idénticas con nombre distinto no son dos cartas.
    // Reciclar es lo único que ningún otro clima hace —los cinco suman o restan
    // números— y apunta a lo que está flojo: la extinción se quedó en el 19 %,
    // cerca del suelo del 15, y devolver cartas alarga los mazos.
    llanuraReciclaPorTurno: 1,
    bosqueCura: 1,
    // El canal y la sabana ya no tocan sólo a los tuyos: como todo clima,
    // valen para los dos bandos por igual.
    canalVida: 1,
    // La sabana da Biomasa a los dos, cada turno, mientras siga en el campo.
    // Fue «+1 al daño contra los biomas» —una constante que se borró y a la que
    // la IA siguió llamando durante un día entero, calculando NaN— y luego +1 de
    // Defensa, que dejó de existir con la Defensa.
    sabanaBiomasa: 1,
  }),

  // ------------------------------------------------------------------- mazo
  tamanoMazo: 55,

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


  // ------------------------------------------------------------- el cuerpo
  //
  // Una carta son DOS cifras: Ataque y Vida. La Defensa existió y se quitó.
  //
  // Era la estadística que peor se leía —una resta plana e invisible contra un
  // número de la OTRA carta— y medida en victorias era la que menos aportaba:
  // +1 de Ataque a todas tus criaturas gana el 70,8 % de las partidas, +1 de
  // Vida el 63,1 % y +1 de Defensa el 59,6 %, sobre un control de 46,8 %.
  // Plegada a Vida 1:1, el juego no se enteró: 12,5 turnos contra 12,6.
  //
  // Con ella se fueron dos reglas que tampoco se deducían de la pantalla: el
  // suelo de daño —que existía sólo para que una Defensa alta no hiciera
  // inmune— y la mitad del misterio de «¿por qué ha hecho 1 y no 5?».
  cuerpo: Object.freeze({
    // El daño que sobra al matar sigue hacia el hábitat rival: si pegas 5 a algo
    // que tenía 3 de Vida, los 2 que sobran pasan. Antes era privilegio del
    // rasgo Depredador dominante.
    //
    // Es lo que cierra el último agujero de legibilidad: ningún número
    // desaparece. Y medido, no cuesta nada — al contrario, deja el reparto entre
    // las tres vías de victoria MÁS parejo que antes (39/32/29 frente a
    // 46/24/31) y acorta las partidas tres décimas de turno.
    //   DINOWAR_SOBRANTE=0 node sim/run.js   para medir sin ello
    sobranteAlHabitat: (typeof process !== 'undefined' && process.env
      && process.env.DINOWAR_SOBRANTE === '0') ? false : true,
  }),

  // ------------------------------------------- habilidades al entrar en juego
  //
  // CUÁNTO hace cada una lo dice la carta —está en su `mecanica`, en cards.js—
  // porque el mismo efecto sale con números distintos: Suchomimus muele 1 y
  // Spinosaurus 5. Lo que hay aquí es lo OTRO: cuánto vale un punto de cada
  // efecto para la IA que decide si baja la carta.
  //
  // Sin este número la carta no se juega jamás. No es una advertencia teórica:
  // le pasó a la Llanura de inundación, cero usos en 300 partidas hasta que se
  // le puso valor. Toda entrada nueva necesita su peso aquí.
  //
  // Se apagan con DINOWAR_ENTRADAS=0 para poder medir con y sin.
  valorEntrada: Object.freeze({
    roba: 1.4,          // una carta en la mano vale más que su punto
    emboscada: 1,       // un punto de daño es un punto
    manoRival: 1.2,     // quitarle una carta al otro, algo más
    curaHabitat: 1,     // se multiplica por ia.pesoHabitat al tasarla
    mueleRival: 0.4,    // acerca la extinción, pero lento
    muelePropio: -0.4,  // es un COSTE: te la acercas a ti
    fulmina: 3,         // matar algo del campo sin pelearlo
  }),

  // --------------------------------------------------------------------- IA
  ia: Object.freeze({
    // Con menos mazo que esto, la IA deja de bajar Biomasa. No es afinar su
    // juego: es que la carta muerde tu propio mazo, y sin freno la IA se
    // molería hasta perder por extinción a cambio de un punto de Biomasa. Las
    // partidas medidas acaban con treinta y pico cartas, así que este tope no
    // se toca nunca en juego normal; está para el caso raro.
    mazoDeReserva: 6,

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
    // A partir de cuántas cartas de mazo empieza a valer la pena devolver una
    // con la Llanura. Por encima de eso, reciclar es perder el turno.
    // Con el robo, cambiar una carta ya no es perder una, así que la IA lo hace
    // siempre que tenga algo impagable en la mano. El umbral de mazo se queda
    // alto para que no sea gratis del todo cerca del final.
    reciclaDesdeMazo: 45,
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
// Nodosaurus bajó a 2 copias al pasar de Rara a Épica en el recoste del autor, y
// el hueco fue a Stegosaurus: es el otro tireóforo del mazo y su mecánica nueva
// —+1 de Ataque por cada Stegosaurus propio— premia llevar la tercera.
export const MAZO = Object.freeze([
  // ------------------------------------------------- la ronda de las cien
  // Rehecho el 13-09-2026 con el set en 101 cartas: el de antes medía un juego
  // de 28 cartas cuando ya había 101. Entran once de la ronda nueva y salen
  // las tres que la IA no jugaba —Sequía 0,53, Bruma 0,00, Competencia 0,00—.
  //
  // Medido sobre 1.000 partidas por candidato, ocho candidatos. Lo que se
  // aprendió: los cuerpos baratos y agresivos (Velociraptor a 0, Kentrosaurus,
  // Pachycephalosaurus) no hunden al jugador inicial más que los grandes, y
  // meter Inundación o Manada de paso para buscar la extinción no la mueve del
  // 0–2 % y deja las dos cartas descalibradas. La Biomasa a 9 copias (5+2+2)
  // frente a 7 no sube al jugador inicial esta vez: 45,2 % con 9 y 46,9 % con
  // 7 en el mazo viejo, que a 1.000 partidas es ruido (±1,6). Cero cartas
  // descalibradas y las vías a 53/47, que el mazo viejo tenía en 36/64.
  //
  // dinosaurios — 28
  ['dryosaurus', 3], ['ornitholestes', 2], ['ceratosaurus', 2], ['stegosaurus', 1],
  ['kentrosaurus', 2], ['velociraptor', 2], ['allosaurus', 2], ['camarasaurus', 1],
  ['amargasaurus', 2], ['iguanodon', 2], ['pachycephalosaurus', 2],
  ['riparovenator', 1], ['lokiceratops', 1], ['huaxiadraco', 1], ['brachylophosaurus', 1],
  ['diplodocus', 1], ['apatosaurus', 1], ['tyrannotitan', 1],
  // soporte — 18
  //
  // Un clima solo, el Monzón: sólo cabe uno en el campo. Crecimiento acelerado
  // se queda por ser la legendaria de soporte de la colección de salida: sin
  // ella, una cuenta nueva empezaría con una sola legendaria. Mortandad salió
  // en la última vuelta: con 2.000 partidas medía 0,70 de índice, justo en el
  // borde, y su plaza fue a la segunda Sabana de helechos.
  ['gregarismo', 2], ['trampa', 2], ['rebrote', 2], ['nido', 2], ['sabana_helechos', 2],
  ['insectos', 2], ['fractura', 2], ['gastrolitos', 1], ['crecimiento_acelerado', 1],
  ['sabana', 1], ['canal_trenzado', 1],
  // biomasa — 9
  //
  // Tres cartas distintas y no siete Praderas: la colección de salida es este
  // mazo, y así una cuenta nueva ve que la Biomasa es una familia.
  ['biomasa', 5], ['araucarias', 2], ['cicadas', 2],
].map((e) => Object.freeze(e)));

export const TOTAL_MAZO = MAZO.reduce((n, [, copias]) => n + copias, 0);

/**
 * El mazo de referencia adaptado a la economía por cartas: se le quitan tantas
 * cartas como recursos entren, y siguen siendo 50.
 *
 * Se recortan primero las entradas con más copias, para que el mazo pierda
 * repeticiones y no variedad: quitar la única copia de Torvosaurus cambia qué
 * mazo es; bajar Dryosaurus de 3 a 2 sólo lo hace más fino. Esa es exactamente
 * la factura que la variante viene a enseñar: 18 de 50 cartas dejan de ser
 * jugadas para ser gasolina.
 */
export function mazoConBiomasa(economia = BALANCE.economia.cartas) {
  const restan = economia.porMazo;
  const lista = MAZO.map(([id, n]) => [id, n]);
  for (let quitadas = 0; quitadas < restan;) {
    lista.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    if (lista[0][1] <= 0) break;
    lista[0][1] -= 1;
    quitadas += 1;
  }
  const animal = Math.round(restan * economia.fraccionAnimal);
  return [
    ...lista.filter(([, n]) => n > 0),
    ['biomasa_animal', animal],
    ['biomasa_vegetal', restan - animal],
  ];
}

// Un mazo mal escrito no debe llegar a una partida: falla al importar, que es
// el único momento en que el error todavía es barato.
for (const [cardId, copias] of MAZO) {
  const c = CARTAS[cardId];
  if (!c) throw new Error(`MAZO: la carta "${cardId}" no existe`);
  const tope = c.copiasMax ?? BALANCE.copiasPorRareza[c.rareza];
  if (copias > tope) throw new Error(`MAZO: ${cardId} lleva ${copias} copias y su rareza permite ${tope}`);
}
if (TOTAL_MAZO !== BALANCE.tamanoMazo) {
  throw new Error(`MAZO suma ${TOTAL_MAZO} cartas y deberían ser ${BALANCE.tamanoMazo}`);
}
