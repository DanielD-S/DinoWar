// Arte generado por código: siluetas SVG esquemáticas, sin binarios.
//
// Son siluetas por PLAN CORPORAL, no reconstrucciones: a 34 px de ancho no cabe
// más información honesta que la silueta. Ninguna lleva plumas — ningún taxón de
// este set tiene evidencia tegumentaria que las respalde (§2 de la spec).

const SILUETAS = {
  // Terópodo grande: cuerpo horizontal, cráneo profundo, cola contrapesada.
  teropodo: `
    <path d="M3 41 C14 39 22 37 29 34 C31 25 40 20 51 21 C57 21 62 23 65 26
             C68 20 74 15 82 14 L96 13 L97 19 L88 21 L83 25 L77 30
             C74 38 65 43 55 43 L49 43 L52 57 L48 66 L41 66 L44 55 L40 43
             L33 42 L30 55 L25 66 L18 66 L23 53 L23 40 Z"/>`,
  // Terópodo pequeño: mismo plan, cráneo corto, extremidades gráciles.
  teropodito: `
    <path d="M6 45 C16 43 24 41 30 39 C32 33 38 29 46 30 C51 30 55 32 58 35
             C61 30 67 27 74 27 L86 26 L87 31 L79 33 L75 36 L71 40
             C68 45 61 48 54 48 L50 48 L53 58 L50 66 L45 66 L47 57 L44 48
             L38 48 L36 58 L32 66 L27 66 L30 56 L28 45 Z"/>`,
  // Saurópodo: cuello largo elevado, cráneo diminuto, cuatro columnas.
  sauropodo: `
    <path d="M3 47 C13 44 22 42 30 41 C34 31 46 26 58 28 C62 20 66 12 70 6
             L77 6 C75 17 71 26 66 33 C73 37 76 43 76 50 L73 63 L67 63
             L70 50 L62 46 L56 46 L58 63 L52 63 L50 46 L40 46 L37 46
             L39 63 L33 63 L31 46 C21 49 11 51 3 52 Z"/>`,
  // Estegosáurido: dorso arqueado, cráneo bajo, cola con púas.
  estegosaurio: `
    <path d="M4 40 C12 38 18 37 24 37 C28 26 40 21 53 23 C64 24 72 30 76 38
             C80 40 86 43 90 47 L88 51 L79 46 L74 44 L72 47 L74 62 L68 62
             L67 47 L58 48 L57 62 L51 62 L51 48 L40 47 L38 62 L32 62
             L33 46 C25 45 16 44 4 44 Z"/>
    <path d="M28 34 L33 22 L38 33 Z M40 31 L46 17 L52 30 Z M54 30 L61 18 L66 31 Z M68 34 L74 25 L77 36 Z"/>`,
  // Ornitópodo pequeño: bípedo cursorial, cráneo corto sin dientes caniniformes.
  ornitopodo: `
    <path d="M7 48 C17 46 25 44 31 41 C33 34 39 30 47 31 C52 31 57 33 60 37
             C63 33 68 30 74 30 L84 30 L85 35 L77 37 L73 41
             C70 46 63 50 55 50 L51 50 L54 59 L51 66 L46 66 L48 58 L45 50
             L39 50 L37 59 L33 66 L28 66 L31 57 L29 48 Z"/>`,
  // Adaptaciones: iconos abstractos, no organismos.
  gregarismo: `
    <path d="M14 46 C20 45 25 43 28 41 C29 36 34 33 40 34 C44 34 47 36 49 38
             L52 36 L58 35 L59 39 L54 41 C52 45 46 48 40 48 L37 48 L38 56 L35 62
             L31 62 L33 55 L31 48 L26 48 L24 56 L21 62 L17 62 L20 54 Z"/>
    <path d="M50 52 C55 51 59 50 62 48 C63 44 67 41 72 42 C75 42 78 44 80 46
             L83 44 L88 43 L89 47 L85 49 C83 52 78 55 73 55 L70 55 L71 61 L69 66
             L65 66 L67 60 L65 55 L61 55 L59 61 L57 66 L53 66 L55 59 Z"/>`,
  gastrolitos: `
    <circle cx="36" cy="30" r="11"/><circle cx="58" cy="26" r="8"/>
    <circle cx="68" cy="43" r="10"/><circle cx="46" cy="49" r="9"/>
    <circle cx="27" cy="48" r="6"/>`,
  // Vértebra neumatizada: hueco invadido por divertículos de sacos aéreos.
  neumaticidad: `
    <path d="M30 20 C22 20 16 27 16 35 C16 43 22 50 30 50 L70 50 C78 50 84 43 84 35
             C84 27 78 20 70 20 Z" opacity=".85"/>
    <circle cx="34" cy="35" r="6" fill="#17120e"/>
    <circle cx="50" cy="35" r="7" fill="#17120e"/>
    <circle cx="66" cy="35" r="6" fill="#17120e"/>`,
  // Hueso largo con fractura consolidada: el callo de la soldadura.
  fractura: `
    <path d="M22 26 C15 26 12 32 15 37 C11 42 15 49 22 47 L44 40 L56 44 L78 37
             C85 38 88 31 84 27 C87 22 82 16 76 19 L56 27 L44 24 Z"/>
    <path d="M46 20 L52 48 L46 44 L54 24 Z" fill="#17120e"/>
    <circle cx="50" cy="34" r="7" opacity=".55"/>`,
  // Competencia trófica: dos siluetas midiéndose por el mismo recurso.
  competencia: `
    <path d="M8 44 C16 43 22 41 26 38 C28 32 34 29 40 30 L46 33 L44 40
             C41 44 34 47 28 47 L26 55 L22 60 L18 60 L20 52 L14 47 Z"/>
    <path d="M92 44 C84 43 78 41 74 38 C72 32 66 29 60 30 L54 33 L56 40
             C59 44 66 47 72 47 L74 55 L78 60 L82 60 L80 52 L86 47 Z"/>
    <path d="M48 16 L52 16 L52 26 L48 26 Z M48 52 L52 52 L52 62 L48 62 Z" opacity=".5"/>`,
  // Mortandad: acumulación ósea, huesos desarticulados.
  mortandad: `
    <path d="M12 30 C7 30 5 35 8 38 C5 42 9 47 14 45 L34 39 C39 40 42 36 39 32
             C42 28 37 24 33 26 Z" opacity=".9"/>
    <path d="M52 46 C47 46 45 51 48 54 C45 58 49 63 54 61 L74 55 C79 56 82 52 79 48
             C82 44 77 40 73 42 Z" opacity=".75"/>
    <path d="M62 18 C58 18 56 22 58 25 L76 33 C80 35 84 31 82 27 C85 24 81 19 77 21 Z" opacity=".6"/>`,
  // Llanura de inundación: bandas de sedimento y lámina de agua.
  llanura: `
    <path d="M4 34 L96 34 L96 39 L4 39 Z" opacity=".9"/>
    <path d="M4 44 L96 44 L96 47 L4 47 Z" opacity=".65"/>
    <path d="M4 52 L96 52 L96 54 L4 54 Z" opacity=".45"/>
    <path d="M10 22 C24 18 34 26 50 22 C66 18 78 26 90 22 L90 28 C78 32 66 24 50 28
             C34 32 24 24 10 28 Z" opacity=".8"/>`,
  // Canal fluvial trenzado: brazos que se separan y se vuelven a unir.
  canal: `
    <path d="M4 26 C24 26 30 40 50 40 C70 40 76 26 96 26 L96 32 C76 32 70 46 50 46
             C30 46 24 32 4 32 Z"/>
    <path d="M4 44 C24 44 30 56 50 56 C70 56 76 44 96 44 L96 49 C76 49 70 61 50 61
             C30 61 24 49 4 49 Z" opacity=".65"/>`,
  // Bosque de coníferas: dosel alto.
  bosque: `
    <path d="M24 58 L14 58 L24 40 L19 40 L28 22 L37 40 L32 40 L42 58 L32 58 L32 66 L24 66 Z"/>
    <path d="M58 62 L46 62 L58 40 L52 40 L63 16 L74 40 L68 40 L80 62 L66 62 L66 68 L58 68 Z" opacity=".8"/>`,
  // Sabana de helechos: frondes bajas, sin dosel.
  sabana: `
    <path d="M22 64 C22 46 16 34 8 28 C20 30 28 40 30 52 C32 40 40 30 52 28
             C44 34 38 46 38 64 Z" opacity=".85"/>
    <path d="M64 66 C64 52 60 42 54 38 C64 40 70 47 72 56 C74 47 80 40 90 38
             C84 42 80 52 80 66 Z" opacity=".6"/>`,
  crecimiento: `
    <path d="M24 26 C18 26 14 30 14 35 C14 40 18 44 24 44 L70 44
             C76 44 80 40 80 35 C80 30 76 26 70 26 C66 26 63 28 61 31 L33 31
             C31 28 28 26 24 26 Z"/>
    <path d="M84 14 L90 22 L84 30 L88 22 Z M84 40 L92 48 L84 56 L89 48 Z"/>`,
};

const PLAN = {
  allosaurus: 'teropodo',
  ceratosaurus: 'teropodo',
  torvosaurus: 'teropodo',
  ornitholestes: 'teropodito',
  apatosaurus: 'sauropodo',
  diplodocus: 'sauropodo',
  camarasaurus: 'sauropodo',
  stegosaurus: 'estegosaurio',
  dryosaurus: 'ornitopodo',
  gregarismo: 'gregarismo',
  gastrolitos: 'gastrolitos',
  crecimiento_acelerado: 'crecimiento',
  neumaticidad: 'neumaticidad',
  fractura: 'fractura',
  competencia: 'competencia',
  mortandad: 'mortandad',
  llanura: 'llanura',
  canal: 'canal',
  bosque: 'bosque',
  sabana: 'sabana',
};

// Tono por carta: distingue especies del mismo plan corporal sin inventar
// morfología. Escala vertical ligera por masa corporal relativa real.
const TONO = {
  allosaurus: ['#c9683f', 1],
  ceratosaurus: ['#b8553f', 0.9],
  torvosaurus: ['#a34a35', 1.1],
  ornitholestes: ['#c98f5e', 0.82],
  apatosaurus: ['#8d9a72', 1.12],
  diplodocus: ['#7f9382', 1],
  camarasaurus: ['#9a9668', 1.04],
  stegosaurus: ['#8a8f6a', 1],
  dryosaurus: ['#a3a173', 0.85],
  gregarismo: ['#d0a53a', 1],
  gastrolitos: ['#a89170', 1],
  crecimiento_acelerado: ['#d0a53a', 1],
  neumaticidad: ['#d0a53a', 1],
  fractura: ['#c98a5e', 1],
  competencia: ['#c98a5e', 1],
  mortandad: ['#b5563a', 1],
  llanura: ['#8a6f3c', 1],
  canal: ['#3f7d8c', 1],
  bosque: ['#4e7a4a', 1],
  sabana: ['#a08243', 1],
};

/**
 * SVG inline de una carta.
 * @param {string} cardId
 * @param {string} [color] fuerza el color de relleno (p. ej. el del bando)
 */
export function arte(cardId, color = null) {
  const plan = PLAN[cardId] ?? 'teropodo';
  const [tono, escala] = TONO[cardId] ?? ['#a89170', 1];
  const relleno = color ?? tono;
  const y = (1 - escala) * 35;
  return `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g fill="${relleno}" transform="translate(0 ${y.toFixed(1)}) scale(1 ${escala})">${SILUETAS[plan]}</g>
  </svg>`;
}

export function colorDeBando(dueno) {
  return dueno === 0 ? 'var(--propio)' : 'var(--rival)';
}
