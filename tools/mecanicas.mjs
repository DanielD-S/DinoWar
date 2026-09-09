// Vuelca las MECÁNICAS del juego a un JSON que lee tools/excel.py.
//
//   node tools/mecanicas.mjs
//
// Existe porque la hoja de recoste enseñaba las cifras de cada carta pero no
// qué hace su rasgo NI CUÁNTO: «Muro de placas» sin el +1 al lado no se puede
// tasar. Y las reglas del tablero —renta, hábitat, trofeos, la red trófica— no
// salían por ningún sitio, así que decidir un coste era adivinar contra qué.
//
// Lo genera el código, no una transcripción: las constantes viven en balance.js
// y aquí sólo se leen. Si mañana cambia el bonus de depredación, la hoja lo dice
// sola. Y si un rasgo apunta a una constante que ya no existe, sale «(no
// existe)» en su celda en vez de un hueco — que es exactamente el fallo que
// tuvo la Sabana durante un día entero.

import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { CARTAS, CARTAS_DE_JEFE, TIPO, CLADO_NOMBRE, RASGO } from '../src/data/cards.js';
import { BALANCE, MAZO } from '../src/data/balance.js';
import { ECONOMIA } from '../src/data/coleccion.js';

export const SALIDA = 'tools/mecanicas.json';

/** Qué constante de balance mueve cada rasgo, y qué significa ese número. */
const NUMERO_DE = {
  [RASGO.GREGARIO]: ['rasgos.gregarioAtaquePorCompanero', 'Ataque por cada congénere en el campo'],
  [RASGO.CAZA_EN_GRUPO]: ['rasgos.cazaEnGrupoAtaque', 'Ataque si hay bastantes copias en el campo'],
  [RASGO.MURO_DE_PLACAS]: ['rasgos.muroDePlacasVida', 'Vida con otra copia en el campo'],
  [RASGO.GOLA]: ['rasgos.golaVida', 'Vida con otra copia en el campo'],
  [RASGO.MANADA]: ['rasgos.manadaVida', 'Vida con otro del mismo clado'],
  [RASGO.CORAZA]: ['rasgos.corazaVida', 'Vida — OJO: ninguna carta lleva este rasgo'],
  [RASGO.RIBERENO]: ['rasgos.riberenoAtaque', 'Ataque con el Canal en el campo'],
  [RASGO.OPORTUNISTA]: ['rasgos.oportunistaVidaPorMuerte', 'Vida permanente por cada muerte'],
  [RASGO.RAMONEO_BAJO]: ['rasgos.ramoneoBajoCura', 'heridas curadas al final del turno'],
  [RASGO.GASTROLITOS]: ['rasgos.gastrolitosCura', 'heridas curadas a un dinosaurio'],
  [RASGO.CRECIMIENTO_ACELERADO]: ['rasgos.crecimientoAtaque', 'Ataque, y otro tanto de Vida'],
  [RASGO.NEUMATICIDAD]: ['rasgos.neumaticidadAtaque', 'Ataque permanente'],
  [RASGO.FRACTURA]: ['rasgos.fracturaAtaque', 'Ataque que se quita'],
  [RASGO.COMPETENCIA]: ['rasgos.competenciaVida', 'Vida que se quita, a dos rivales'],
  [RASGO.MORTANDAD]: ['rasgos.mortandadDano', 'de daño a TODOS, incluidos los tuyos'],
  [RASGO.TRAMPA]: ['rasgos.trampaMazoRival', 'cartas que pierde el rival'],
  [RASGO.GREGARISMO]: ['rasgos.gregarismoAtaque', 'Ataque a toda la especie'],
  // Habilidades al entrar en juego. Se disparan una vez y se acabó.
  [RASGO.ENTRADA_ALERTA]: ['entradas.alertaRoba', 'cartas que robas al entrar'],
  [RASGO.ENTRADA_EMBOSCADA]: ['entradas.emboscadaDano', 'de daño al que tenga enfrente, al entrar'],
  [RASGO.ENTRADA_MANADA_SANA]: ['entradas.manadaSanaCura', 'heridas que curan tus OTROS dinosaurios'],
  [RASGO.ENTRADA_DEVORA_MAZO]: ['entradas.devoraMazo', 'cartas de mazo que pierde el rival'],
  [RASGO.ENTRADA_RAMONEO]: ['entradas.ramoneoBiomasa', 'Biomasa que ganas al entrar'],
  [RASGO.ENTRADA_ARRASA]: ['entradas.arrasaHabitat', 'de daño al hábitat rival, al entrar'],
  [RASGO.CAMPO_LLANURA]: ['efectosCampo.llanuraReciclaPorTurno', 'cambio de carta por turno y jugador'],
  [RASGO.CAMPO_CANAL]: ['efectosCampo.canalVida', 'Vida a todos los del campo'],
  [RASGO.CAMPO_BOSQUE]: ['efectosCampo.bosqueCura', 'heridas que curan los saurópodos'],
  [RASGO.CAMPO_SABANA]: ['efectosCampo.sabanaBiomasa', 'Biomasa por turno a los DOS'],
  [RASGO.CAMPO_ARIDEZ]: ['efectosCampo.aridezMazo', 'cartas de mazo que pierden los DOS'],
};

const valorDe = (ruta) => ruta.split('.').reduce((o, k) => (o === undefined ? o : o[k]), BALANCE);

export function mecanicas() {
  const todas = { ...CARTAS, ...CARTAS_DE_JEFE };
  const porRasgo = {};
  for (const c of Object.values(todas)) (porRasgo[c.rasgo] ??= []).push(c);

  return Object.entries(porRasgo)
    .filter(([r]) => r !== RASGO.NINGUNO)
    .map(([rasgo, cs]) => {
      const par = NUMERO_DE[rasgo];
      const valor = par ? valorDe(par[0]) : null;
      return {
        rasgo,
        nombre: cs[0].rasgoNombre,
        cartas: cs.length,
        quienes: cs.map((c) => c.binomial).join(', '),
        texto: cs[0].rasgoTexto,
        constante: par ? par[0] : '',
        valor: par ? (valor === undefined ? '(no existe)' : valor) : '',
        sentido: par ? par[1] : 'no lleva número: es una regla, no una cifra',
      };
    })
    .sort((a, b) => b.cartas - a.cartas || a.nombre.localeCompare(b.nombre));
}

export function reglas() {
  const B = BALANCE;
  return [
    ['Tablero', 'Ranuras enfrentadas', B.ranuras, 'Cada una pelea contra la de enfrente'],
    ['Tablero', 'Vida del hábitat', B.vidaHabitat, 'Llegar a 0 pierde la partida'],
    ['Tablero', 'Trofeos para ganar', B.trofeosParaGanar, 'Cada baja rival es un trofeo'],
    ['Tablero', 'Límite de turnos', B.limiteTurnos, 'Se decide por trofeos y luego por hábitat'],
    ['Mano', 'Mano inicial', B.manoInicial, 'Se puede cambiar entera una vez (mulligan)'],
    ['Mano', 'Mano máxima', B.manoMaxima, 'Por encima hay que descartar'],
    ['Mazo', 'Cartas del mazo', B.tamanoMazo, 'Quedarse sin mazo pierde la partida'],
    ['Economía', 'Renta por turno', B.rentaPorTurno, 'Biomasa, plana, igual para los dos'],
    ['Combate', 'Daño de un golpe', 'el Ataque', 'Sin restas: no hay Defensa ni suelo de daño'],
    ['Combate', 'Reglas de clado', 'ninguna', 'El clado es clasificación, no cambia números'],
    ['Combate', 'Daño sobrante', B.cuerpo.sobranteAlHabitat ? 'sí pasa' : 'no pasa',
      'Lo que sobra al matar sigue al hábitat rival'],
    ['Colección', 'Precio del sobre', ECONOMIA.precioSobre, `${ECONOMIA.cartasPorSobre} cartas`],
    ['Colección', 'Monedas por victoria', ECONOMIA.monedasVictoria, 'Perder no paga nada'],
    ['Colección', 'Monedas de inicio', ECONOMIA.monedasInicio, ''],
    ...Object.entries(B.copiasPorRareza).map(([r, n]) => [
      'Rareza', `Copias por mazo · ${r.toLowerCase()}`, n,
      `Fundir una copia sobrante da ${ECONOMIA.fusion[r]} monedas`,
    ]),
  ];
}

export function clados() {
  const dinos = Object.values(CARTAS).filter((c) => c.tipo === TIPO.DINOSAURIO);
  const por = {};
  for (const c of dinos) (por[c.clado] ??= []).push(c);
  const media = (cs, k) => (cs.reduce((n, c) => n + c[k], 0) / cs.length).toFixed(1);
  // Ningún clado tiene ya regla propia: se quitaron las dos que había.
  const REGLA = {};
  return Object.entries(por).map(([clado, cs]) => ({
    clado: CLADO_NOMBRE[clado],
    cartas: cs.length,
    ataque: media(cs, 'ataque'),
    vida: media(cs, 'vida'),
    regla: REGLA[clado] ?? 'sin regla propia',
  }));
}

/** Copias de cada carta en el mazo de referencia, que es el que mide el simulador. */
export const enMazoDeReferencia = () => Object.fromEntries(MAZO);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const datos = {
    mecanicas: mecanicas(),
    reglas: reglas(),
    clados: clados(),
    mazo: enMazoDeReferencia(),
  };
  writeFileSync(SALIDA, `${JSON.stringify(datos, null, 2)}\n`);
  process.stdout.write(
    `→ ${SALIDA} · ${datos.mecanicas.length} mecánicas, ${datos.reglas.length} reglas\n`,
  );
}
