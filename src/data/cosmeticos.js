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

export const TIPO_COSMETICO = Object.freeze({
  DORSO: 'DORSO',
  TAPETE: 'TAPETE',
  ESTANDARTE: 'ESTANDARTE',
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
    precio: 400, arte: tienda('estandarte_fosil'), cinta: null,
  }),
  Object.freeze({
    id: 'estandarte_volcan', tipo: T.ESTANDARTE, nombre: 'Volcán', lema: 'Basalto con grietas de brasa.',
    precio: 400, arte: tienda('estandarte_volcan'), cinta: null,
  }),
]);

const POR_ID = new Map(COSMETICOS.map((c) => [c.id, c]));

export const cosmeticoPorId = (id) => POR_ID.get(id) ?? null;

/** El artículo gratuito de un tipo: lo que se ve sin haber comprado nada. */
export const porDefecto = (tipo) => COSMETICOS.find((c) => c.tipo === tipo && c.porDefecto);

/** Si el perfil puede llevar ese artículo: es el gratuito o lo ha comprado. */
export const loTiene = (perfil, id) => {
  const c = cosmeticoPorId(id);
  return !!c && (c.porDefecto || (perfil?.cosmeticos ?? []).includes(id));
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
  if (c.porDefecto ? c.precio !== 0 : !(Number.isInteger(c.precio) && c.precio > 0)) {
    throw new Error(`COSMETICOS: ${c.id} tiene un precio que no cuadra con ser ${c.porDefecto ? 'gratuito' : 'de pago'}`);
  }
  if (!c.arte) throw new Error(`COSMETICOS: ${c.id} sin arte`);
  if (c.tipo === T.TAPETE && !c.medallon) throw new Error(`COSMETICOS: ${c.id} es un tapete sin medallón`);
}
if (POR_ID.size !== COSMETICOS.length) throw new Error('COSMETICOS: hay ids repetidos');
