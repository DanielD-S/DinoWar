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
// el juego enseñaba antes de que existiera la tienda.

export const TIPO_COSMETICO = Object.freeze({
  DORSO: 'DORSO',
});

export const COSMETICOS = Object.freeze([
  Object.freeze({
    id: 'dorso_clasico',
    tipo: TIPO_COSMETICO.DORSO,
    nombre: 'Escamas de latón',
    lema: 'El dorso de siempre.',
    precio: 0,
    porDefecto: true,
    arte: 'assets/piel/dorso.webp',
  }),
  Object.freeze({
    id: 'dorso_ambar',
    tipo: TIPO_COSMETICO.DORSO,
    nombre: 'Ámbar fósil',
    lema: 'Resina de hace ciento cincuenta millones de años, con algo dentro.',
    precio: 300,
    arte: 'assets/piel/tienda/dorso_ambar.webp',
    // Hasta que llegue su ilustración se enseña el dorso clásico tintado.
    provisional: 'sepia(.7) saturate(2.4) hue-rotate(-14deg) brightness(1.08)',
  }),
  Object.freeze({
    id: 'dorso_obsidiana',
    tipo: TIPO_COSMETICO.DORSO,
    nombre: 'Obsidiana',
    lema: 'Piedra volcánica pulida hasta ser espejo.',
    precio: 300,
    arte: 'assets/piel/tienda/dorso_obsidiana.webp',
    provisional: 'grayscale(.85) brightness(.7) contrast(1.3)',
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
}
if (POR_ID.size !== COSMETICOS.length) throw new Error('COSMETICOS: hay ids repetidos');
