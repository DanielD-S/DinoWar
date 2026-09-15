// DinoWar — el catálogo de la tienda: lo que se compra y no da ventaja.
//
// La regla que manda sobre este fichero es del autor: «no es un pay to win,
// sólo se comprarían cosas estéticas». Nada de aquí cambia una carta, un mazo
// ni lo rápido que se progresa. Si algún artículo lo hiciera, no va aquí.
//
// Es un fichero de DATOS, como las expediciones y los mazos iniciales, y lo
// usan los dos lados: el navegador para pintar la tienda y aplicar lo
// equipado, y el generador del catálogo para escribir las filas con las que el
// servidor cobra. El precio que vale es el de la base de datos: el cliente
// sólo manda el id.
//
// Cada tipo tiene UN artículo por defecto, gratis y de todos, que es lo que
// el juego enseñaba antes de que existiera la tienda. Las rutas de arte de
// cada tipo son distintas:
//
//   DORSO       `arte`: el reverso de la carta.
//   TAPETE      `arte`: la losa que se repite en el tablero; `medallon`: el
//               emblema del centro.
//   ESTANDARTE  `arte`: el estandarte vertical de la presentación; `cinta`: la
//               banderola del marcador final, o null si no tiene y se usa la
//               de siempre.
//   RETRATO     `arte`: tu retrato, cuadrado; el círculo y el aro los pone el CSS.
//   TITULO      sin arte: `texto` es lo que sale bajo tu nombre en la
//               presentación. Se GANAN con logros (src/data/logros.js).
//
// Además del gratuito de cada tipo puede haber artículos `gratis`: precio 0,
// de todos sin comprarlos, pero no son lo que se ve por defecto. Hoy sólo los
// retratos, que se estrenan con dos personas para elegir. Y artículos
// `exclusivo`: precio 0 también, pero NO se compran ni son de todos: los
// otorga el servidor al cumplir un logro (`logro` dice cuál), y la tienda los
// enseña bloqueados con lo que hay que hacer.

import { ECONOMIA } from './coleccion.js';

export const TIPO_COSMETICO = Object.freeze({
  DORSO: 'DORSO',
  TAPETE: 'TAPETE',
  ESTANDARTE: 'ESTANDARTE',
  RETRATO: 'RETRATO',
  TITULO: 'TITULO',
});

const T = TIPO_COSMETICO;
const tienda = (nombre) => `assets/piel/tienda/${nombre}.webp`;

export const COSMETICOS = Object.freeze([
  // ------------------------------------------------------------ dorsos
  Object.freeze({
    id: 'dorso_clasico', tipo: T.DORSO, nombre: 'Escamas de latón', lema: 'El dorso de siempre.',
    precio: 0, porDefecto: true, arte: 'assets/piel/dorso.webp',
  }),
  Object.freeze({
    id: 'dorso_ambar', tipo: T.DORSO, nombre: 'Ámbar fósil',
    lema: 'Resina de hace ciento cincuenta millones de años, con algo dentro.',
    precio: 300, arte: tienda('dorso_ambar'),
    // Lo que se enseñaba mientras no había ilustración; con ARTE_LISTO no se usa.
    provisional: 'sepia(.7) saturate(2.4) hue-rotate(-14deg) brightness(1.08)',
  }),
  Object.freeze({
    id: 'dorso_obsidiana', tipo: T.DORSO, nombre: 'Obsidiana', lema: 'Piedra volcánica pulida hasta ser espejo.',
    precio: 300, arte: tienda('dorso_obsidiana'),
    provisional: 'grayscale(.85) brightness(.7) contrast(1.3)',
  }),
  Object.freeze({
    id: 'dorso_morrison', tipo: T.DORSO, nombre: 'Huella de Morrison', lema: 'Una huella hundida en la arenisca del río.',
    precio: 300, arte: tienda('dorso_morrison'),
  }),
  Object.freeze({
    id: 'dorso_hell_creek', tipo: T.DORSO, nombre: 'Hell Creek', lema: 'El cráneo del último gran depredador, en pizarra.',
    precio: 300, arte: tienda('dorso_hell_creek'),
  }),
  Object.freeze({
    id: 'dorso_kem_kem', tipo: T.DORSO, nombre: 'Kem Kem', lema: 'Un diente de carcarodontosáurido en arenisca roja.',
    precio: 300, arte: tienda('dorso_kem_kem'),
  }),
  Object.freeze({
    id: 'dorso_volcan', tipo: T.DORSO, nombre: 'Huevo de brasa', lema: 'Una nidada fósil sobre basalto que aún quema.',
    precio: 300, arte: tienda('dorso_volcan'),
  }),
  Object.freeze({
    id: 'dorso_cazador', tipo: T.DORSO, nombre: 'Cazador de jefes', lema: 'El colmillo del trofeo, colgado del cuero.',
    precio: 0, exclusivo: true, logro: 'cazador_mayor', arte: tienda('dorso_cazador'),
  }),

  // ----------------------------------------------------------- tapetes
  Object.freeze({
    id: 'tapete_clasico', tipo: T.TAPETE, nombre: 'Piedra de la huella', lema: 'El tablero de siempre.',
    precio: 0, porDefecto: true, arte: 'assets/piel/piedra.webp', medallon: 'assets/piel/simbolo_huella.webp',
  }),
  Object.freeze({
    id: 'tapete_ambar', tipo: T.TAPETE, nombre: 'Ámbar', lema: 'Resina oscura con algo atrapado dentro.',
    precio: 500, arte: tienda('tapete_ambar'), medallon: tienda('medallon_ambar'),
  }),
  Object.freeze({
    id: 'tapete_obsidiana', tipo: T.TAPETE, nombre: 'Obsidiana', lema: 'Roca volcánica negra como un espejo apagado.',
    precio: 500, arte: tienda('tapete_obsidiana'), medallon: tienda('medallon_obsidiana'),
  }),
  Object.freeze({
    id: 'tapete_morrison', tipo: T.TAPETE, nombre: 'Lecho de Morrison', lema: 'Arenisca con las ondas del río que la dejó.',
    precio: 500, arte: tienda('tapete_morrison'), medallon: tienda('medallon_morrison'),
  }),
  Object.freeze({
    id: 'tapete_volcan', tipo: T.TAPETE, nombre: 'Volcán', lema: 'Basalto con la brasa todavía dentro.',
    precio: 500, arte: tienda('tapete_volcan'), medallon: tienda('medallon_volcan'),
  }),
  Object.freeze({
    id: 'tapete_hell_creek', tipo: T.TAPETE, nombre: 'Hell Creek', lema: 'Lutita oscura del final del Cretácico.',
    precio: 500, arte: tienda('tapete_hell_creek'), medallon: tienda('medallon_hell_creek'),
  }),
  Object.freeze({
    id: 'tapete_kem_kem', tipo: T.TAPETE, nombre: 'Kem Kem', lema: 'Arcilla roja cuarteada del río de los gigantes.',
    precio: 500, arte: tienda('tapete_kem_kem'), medallon: tienda('medallon_kem_kem'),
  }),
  Object.freeze({
    id: 'tapete_solnhofen', tipo: T.TAPETE, nombre: 'Solnhofen', lema: 'La caliza fina donde quedaron las plumas.',
    precio: 500, arte: tienda('tapete_solnhofen'), medallon: tienda('medallon_solnhofen'),
  }),
  Object.freeze({
    id: 'tapete_excavacion', tipo: T.TAPETE, nombre: 'Excavación', lema: 'La cuadrícula de cuerda sobre la tierra de la cata.',
    precio: 500, arte: tienda('tapete_excavacion'), medallon: tienda('medallon_excavacion'),
  }),

  // -------------------------------------------------------- estandartes
  Object.freeze({
    id: 'estandarte_clasico', tipo: T.ESTANDARTE, nombre: 'Cuero curtido', lema: 'El estandarte de siempre.',
    precio: 0, porDefecto: true, arte: 'assets/piel/vs/estandarte_propio.webp', cinta: 'assets/piel/fin/cinta_propia.webp',
  }),
  Object.freeze({
    id: 'estandarte_ambar', tipo: T.ESTANDARTE, nombre: 'Ámbar', lema: 'Un estandarte de resina con la luz dentro.',
    precio: 400, arte: tienda('estandarte_ambar'), cinta: tienda('cinta_ambar'),
  }),
  Object.freeze({
    id: 'estandarte_obsidiana', tipo: T.ESTANDARTE, nombre: 'Obsidiana', lema: 'Negro volcánico, frío como un espejo.',
    precio: 400, arte: tienda('estandarte_obsidiana'), cinta: tienda('cinta_obsidiana'),
  }),
  Object.freeze({
    id: 'estandarte_fosil', tipo: T.ESTANDARTE, nombre: 'Caliza fósil', lema: 'Vértebras de piedra colgando de latón.',
    precio: 400, arte: tienda('estandarte_fosil'), cinta: tienda('cinta_fosil'),
  }),
  Object.freeze({
    id: 'estandarte_volcan', tipo: T.ESTANDARTE, nombre: 'Volcán', lema: 'Basalto con grietas de brasa.',
    precio: 400, arte: tienda('estandarte_volcan'), cinta: tienda('cinta_volcan'),
  }),
  Object.freeze({
    id: 'estandarte_helecho', tipo: T.ESTANDARTE, nombre: 'Helecho', lema: 'Paño verde con la fronda del sotobosque.',
    precio: 400, arte: tienda('estandarte_helecho'), cinta: tienda('cinta_helecho'),
  }),
  Object.freeze({
    id: 'estandarte_campeon', tipo: T.ESTANDARTE, nombre: 'Campeón', lema: 'Azul noche y oro trenzado: cincuenta duelos ganados.',
    precio: 0, exclusivo: true, logro: 'leyenda', arte: tienda('estandarte_campeon'), cinta: tienda('cinta_campeon'),
  }),

  // ---------------------------------------------------------- retratos
  Object.freeze({
    id: 'retrato_paleontologa', tipo: T.RETRATO, nombre: 'La paleontóloga', lema: 'Brocha en mano y lámpara encendida.',
    precio: 0, porDefecto: true, arte: tienda('retrato_paleontologa'),
  }),
  Object.freeze({
    id: 'retrato_buscador', tipo: T.RETRATO, nombre: 'El buscador', lema: 'Lupa, sombrero y un mapa enrollado.',
    precio: 0, gratis: true, arte: tienda('retrato_buscador'),
  }),
  Object.freeze({
    id: 'retrato_amonite', tipo: T.RETRATO, nombre: 'Amonite', lema: 'Una espiral de nácar convertida en oro.',
    precio: 350, arte: tienda('retrato_amonite'),
  }),
  Object.freeze({
    id: 'retrato_huevo', tipo: T.RETRATO, nombre: 'La eclosión', lema: 'Alguien asoma entre los helechos.',
    precio: 350, arte: tienda('retrato_huevo'),
  }),
  Object.freeze({
    id: 'retrato_placas', tipo: T.RETRATO, nombre: 'Placas al ocaso', lema: 'Un estegosaurio contra el último sol.',
    precio: 350, arte: tienda('retrato_placas'),
  }),
  Object.freeze({
    id: 'retrato_cientifico', tipo: T.RETRATO, nombre: 'El científico', lema: 'Una muestra al trasluz y el laboratorio lleno de huesos.',
    precio: 350, arte: tienda('retrato_cientifico'),
  }),
  Object.freeze({
    id: 'retrato_cientifica', tipo: T.RETRATO, nombre: 'La científica', lema: 'Gafas redondas y un vial que brilla con el candil.',
    precio: 350, arte: tienda('retrato_cientifica'),
  }),
  Object.freeze({
    id: 'retrato_cazador', tipo: T.RETRATO, nombre: 'El cazador de fósiles', lema: 'Cartuchera, pañuelo y ganas de ir más lejos.',
    precio: 350, arte: tienda('retrato_cazador'),
  }),
  Object.freeze({
    id: 'retrato_trex', tipo: T.RETRATO, nombre: 'Rey tirano', lema: 'El rugido que cierra el Cretácico.',
    precio: 350, arte: tienda('retrato_trex'),
  }),
  // Los de los jefes: se ganan al reclamar su carta, no se venden.
  Object.freeze({
    id: 'retrato_saurophaganax', tipo: T.RETRATO, nombre: 'Saurophaganax', lema: 'El dueño de la llanura, visto de cerca.',
    precio: 0, exclusivo: true, logro: 'trofeo_saurophaganax', arte: tienda('retrato_saurophaganax'),
  }),
  Object.freeze({
    id: 'retrato_barosaurus', tipo: T.RETRATO, nombre: 'Barosaurus', lema: 'El gigante del río se gira a mirarte.',
    precio: 0, exclusivo: true, logro: 'trofeo_barosaurus', arte: tienda('retrato_barosaurus'),
  }),

  // ----------------------------------------------------------- títulos
  // `texto` es lo que se lee bajo el nombre; el de por defecto no dice nada.
  Object.freeze({
    id: 'titulo_ninguno', tipo: T.TITULO, nombre: 'Sin título', lema: 'Sólo tu nombre y tu liga.',
    precio: 0, porDefecto: true, texto: '',
  }),
  Object.freeze({
    id: 'titulo_duelista', tipo: T.TITULO, nombre: 'Duelista', lema: 'Has cruzado cartas con una persona.',
    precio: 0, exclusivo: true, logro: 'duelista', texto: 'Duelista',
  }),
  Object.freeze({
    id: 'titulo_asaltante', tipo: T.TITULO, nombre: 'Asaltante', lema: 'Cinco veces bajaste a la cuenca a por el jefe.',
    precio: 0, exclusivo: true, logro: 'asaltante', texto: 'Asaltante',
  }),
  Object.freeze({
    id: 'titulo_cazador', tipo: T.TITULO, nombre: 'Cazador de jefes', lema: 'Diste el golpe final a un jefe.',
    precio: 0, exclusivo: true, logro: 'cazador', texto: 'Cazador de jefes',
  }),
  Object.freeze({
    id: 'titulo_campeon', tipo: T.TITULO, nombre: 'Campeón', lema: 'Diez duelos ganados.',
    precio: 0, exclusivo: true, logro: 'campeon', texto: 'Campeón',
  }),
]);

/**
 * Los packs de sobres de la tienda: varios seguidos, uno tras otro, y cada uno
 * al precio de siempre. SIN descuento, y es una regla del autor y no una
 * tacañería: un pack más barato por sobre acelera la colección de quien tiene
 * más monedas, y la tienda no puede dar ventaja. Lo vigila test/tienda.test.js.
 *
 * Viven aquí y no en coleccion.js porque ese fichero va dentro de la Edge
 * Function: tocarlo obliga a re-empaquetar, re-anclar y desplegar, y los packs
 * son cosa del navegador —el servidor cobra sobre a sobre y no sabe de ellos—.
 */
export const PACKS = Object.freeze([3, 5, 10]);
export const precioDePack = (n) => n * ECONOMIA.precioSobre;

const POR_ID = new Map(COSMETICOS.map((c) => [c.id, c]));

export const cosmeticoPorId = (id) => POR_ID.get(id) ?? null;

/** El artículo gratuito de un tipo: lo que se ve sin haber comprado nada. */
export const porDefecto = (tipo) => COSMETICOS.find((c) => c.tipo === tipo && c.porDefecto);

/**
 * Si el perfil puede llevar ese artículo: es de todos (por defecto o gratis),
 * lo ha comprado, o se lo otorgó el servidor por un logro. Lo exclusivo no
 * es de todos aunque cueste 0.
 */
export const loTiene = (perfil, id) => {
  const c = cosmeticoPorId(id);
  return !!c && (c.porDefecto || c.gratis || (perfil?.cosmeticos ?? []).includes(id));
};

/**
 * Lo que un perfil lleva puesto de un tipo. Lo equipado que ya no existe o que
 * no es suyo cae al gratuito: una caché vieja o un catálogo que cambió no
 * pueden dejar a nadie sin dorso.
 */
export function equipadoDe(perfil, tipo) {
  const id = perfil?.equipado?.[tipo];
  const c = cosmeticoPorId(id);
  return c && c.tipo === tipo && loTiene(perfil, id) ? c : porDefecto(tipo);
}

// Un catálogo mal escrito cobraría lo que no debe o dejaría un tipo sin su
// artículo gratuito: falla al importar, que es cuando el error es barato.
for (const tipo of Object.values(TIPO_COSMETICO)) {
  const gratis = COSMETICOS.filter((c) => c.tipo === tipo && c.porDefecto);
  if (gratis.length !== 1) throw new Error(`COSMETICOS: ${tipo} necesita exactamente un artículo por defecto`);
}
for (const c of COSMETICOS) {
  if (!/^[a-z_]+$/.test(c.id)) throw new Error(`COSMETICOS: id «${c.id}» no válido`);
  if (!Object.values(TIPO_COSMETICO).includes(c.tipo)) throw new Error(`COSMETICOS: ${c.id} tiene un tipo desconocido`);
  // Un 0 escrito sin querer regalaría el artículo: sin `porDefecto`, `gratis`
  // ni `exclusivo`, el precio tiene que ser positivo.
  const gratuito = c.porDefecto || c.gratis || c.exclusivo;
  if (gratuito ? c.precio !== 0 : !(Number.isInteger(c.precio) && c.precio > 0)) {
    throw new Error(`COSMETICOS: ${c.id} tiene un precio que no cuadra con ser ${gratuito ? 'gratuito' : 'de pago'}`);
  }
  if (c.exclusivo && (c.porDefecto || c.gratis || !c.logro)) {
    throw new Error(`COSMETICOS: ${c.id} es exclusivo y tiene que ganarse con un logro, sin ser de todos`);
  }
  if (c.tipo === T.TITULO ? typeof c.texto !== 'string' : !c.arte) {
    throw new Error(`COSMETICOS: ${c.id} sin ${c.tipo === T.TITULO ? 'texto' : 'arte'}`);
  }
  if (c.tipo === T.TAPETE && !c.medallon) throw new Error(`COSMETICOS: ${c.id} es un tapete sin medallón`);
}
if (POR_ID.size !== COSMETICOS.length) throw new Error('COSMETICOS: hay ids repetidos');
