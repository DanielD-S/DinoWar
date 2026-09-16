// DinoWar — la dieta de cada criatura del set.
//
// Es un eje NUEVO, no un alias del clado: eso es justo lo que lo hace útil.
// Los sitios donde dieta y clado se contradicen son los interesantes y son
// reales —Therizinosaurus es un terópodo herbívoro, los oviraptorosaurios se
// discuten como omnívoros—, así que esta tabla enseña algo que la ficha no
// decía. Si se pudiera deducir del clado no haría falta escribirla.
//
// Igual que los rasgos, cada dieta declara su nivel de evidencia: la dieta de
// un ceratopsio no está en el mismo sitio que la de un oviraptorosaurio.

import { CARTAS, TIPO, CLADO } from './cards.js';

export const DIETA = Object.freeze({
  CARNIVORO: 'CARNIVORO',
  HERBIVORO: 'HERBIVORO',
  OMNIVORO: 'OMNIVORO',
});

export const DIETA_NOMBRE = Object.freeze({
  CARNIVORO: 'Carnívoro', HERBIVORO: 'Herbívoro', OMNIVORO: 'Omnívoro',
});

const { CARNIVORO, HERBIVORO, OMNIVORO } = DIETA;

/**
 * Excepciones y casos que no se deducen del clado. Todo lo que no esté aquí lo
 * resuelve el clado más abajo, que para ornitópodos, tireóforos, saurópodos y
 * marginocéfalos no tiene discusión: son herbívoros y ya está.
 */
const EXCEPCIONES = Object.freeze({
  // Terópodos que NO son carnívoros. Aquí está el valor de todo el eje.
  therizinosaurus: HERBIVORO,   // dentición, vientre ancho y garras de ramoneo
  ojoraptorsaurus: OMNIVORO,    // oviraptorosaurio: sin dientes, dieta discutida
  tongtianlong: OMNIVORO,       // oviraptorosaurio, mismo caso
  troodon: OMNIVORO,            // dentición con dentículos grandes, discutido
  anzu: OMNIVORO,               // cenagnátido: mismo caso que los otros dos
  // Los dos ornitomimosaurios. El pico sin dientes de Gallimimus lleva surcos
  // que se leen como láminas de filtración, y a Deinocheirus se le encontraron
  // gastrolitos Y restos de pez en la misma cavidad abdominal: los dos comían
  // de los dos lados, y es lo mejor documentado de todo este eje.
  gallimimus: OMNIVORO,
  deinocheirus: OMNIVORO,

  // Pterosaurios: los tapejáridos se leen como frugívoros, no como pescadores.
  // Tupandactylus es el tapejárido de manual, así que va con su pariente.
  huaxiadraco: HERBIVORO,
  tupandactylus: HERBIVORO,
});

/** Por clado, para todo lo que no sea una excepción. */
const POR_CLADO = Object.freeze({
  [CLADO.TEROPODO]: CARNIVORO,
  [CLADO.SAUROPODO]: HERBIVORO,
  [CLADO.TIREOFORO]: HERBIVORO,
  [CLADO.ORNITOPODO]: HERBIVORO,
  [CLADO.MARGINOCEFALO]: HERBIVORO,
  [CLADO.PTEROSAURIO]: CARNIVORO,
  [CLADO.MARINO]: CARNIVORO,
});

/**
 * Dieta de una carta. Las que no son criaturas —eventos, climas, recursos— no
 * tienen dieta y devuelven null: se pagan con cualquier Biomasa, porque una
 * sequía no come.
 * @param {string} cardId
 * @returns {'CARNIVORO'|'HERBIVORO'|'OMNIVORO'|null}
 */
export function dietaDe(cardId) {
  const c = CARTAS[cardId];
  if (!c || c.tipo !== TIPO.DINOSAURIO) return null;
  return EXCEPCIONES[cardId] ?? POR_CLADO[c.clado] ?? CARNIVORO;
}

/** Reparto del set por dieta. Lo usan el simulador y los tests. */
export function repartoPorDieta() {
  const n = { CARNIVORO: 0, HERBIVORO: 0, OMNIVORO: 0 };
  for (const id of Object.keys(CARTAS)) {
    const d = dietaDe(id);
    if (d) n[d]++;
  }
  return n;
}
