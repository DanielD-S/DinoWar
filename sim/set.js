// Genera SET_DE_CARTAS.md desde el código, para que las cifras actuales sean
// las de verdad y no una transcripción a mano que se desfase.

import { writeFileSync } from 'node:fs';
import { CARTAS, TIPO, TIPO_NOMBRE, OBJETIVO, CLADO_NOMBRE, RAREZA_NOMBRE, ESTACIONES } from '../src/data/cards.js';
import { BALANCE, MAZO, TOTAL_MAZO } from '../src/data/balance.js';

// Por qué cada carta tiene la Defensa que tiene. La cifra vive en cards.js;
// esto es sólo el argumento, que no cabía en la carta. Si falta una entrada, la
// línea se omite: añadir un taxón no debe romper el generador.
const DEFENSA = {
  dryosaurus: [0, 'Cursorial y grácil: su defensa es correr, no aguantar.'],
  ornitholestes: [0, 'Terópodo de ~2 m, sin blindaje ni masa.'],
  ceratosaurus: [1, 'Osificaciones dérmicas dorsales descritas en el holotipo.'],
  stegosaurus: [3, 'Placas dorsales y osteodermos en la garganta; el blindaje mejor documentado del set.'],
  allosaurus: [1, 'Cráneo y esqueleto robustos, sin armadura dérmica.'],
  camarasaurus: [2, 'Talla adulta de ~15 t como defensa antipredatoria.'],
  diplodocus: [2, 'Talla equivalente, cuerpo más grácil.'],
  apatosaurus: [3, 'La mayor masa del set; la talla ES la defensa.'],
  torvosaurus: [1, 'El mayor terópodo, pero sin blindaje.'],
  nodosaurus: [4, 'Osteodermos en bandas sobre todo el dorso: coraza en el sentido literal.'],
  riparovenator: [1, 'Espinosáurido grácil, construido para pescar y no para encajar.'],
  lokiceratops: [2, 'La gola es hueso, pero está calada y orientada hacia arriba, no hacia el atacante.'],
  brachylophosaurus: [1, 'Hadrosaurio sin armadura: la manada es la defensa, no el cuerpo.'],
  tyrannotitan: [1, 'Doce metros de depredador sin una sola placa dérmica.'],
  huaxiadraco: [0, 'Esqueleto neumatizado de pared finísima; lo que no puede encajar, lo esquiva volando.'],
};

// El mazo de referencia ya no lleva una copia de cada carta: con 31 cartas
// sumarían 62 y un mazo son 50. Las que no entran se marcan, no se ocultan.
const copiasEnMazo = Object.fromEntries(MAZO);
const copias = new Proxy({}, { get: (_, id) => copiasEnMazo[id] ?? 0 });
const enMazo = (id) => (copiasEnMazo[id] ?? 0) > 0;
const L = [];
const p = (x = '') => L.push(x);

p('# SET DE CARTAS — DinoWar v2');
p('');
p('> Generado por `node sim/set.js` desde `src/data/cards.js` y `src/data/balance.js`.');
p('> Todas las cifras son las que ejecuta el motor, calibradas sobre 2.000 partidas.');
p('>');
p('> **Copias**: ejemplares de esa carta en el mazo de referencia, que es el');
p('> que lleva la IA y el que mide BALANCE.md. Tu mazo lo montas tú.');
p('> **Sed**: heridas que recibe cuando sale *Sequía estacional*. **No es un');
p('> segundo coste**: no se paga al jugarla, sólo cuando el clima lo cobra.');
p('');
p(`El set tiene **${Object.keys(CARTAS).length} cartas distintas**. Un mazo son ` +
  `**${BALANCE.tamanoMazo} cartas exactas**, así que no caben todas: el de referencia lleva ` +
  `${MAZO.filter(([id]) => CARTAS[id].tipo === TIPO.DINOSAURIO).reduce((n, [, k]) => n + k, 0)} dinosaurios, ` +
  `${MAZO.filter(([id]) => CARTAS[id].tipo === TIPO.EVENTO).reduce((n, [, k]) => n + k, 0)} eventos, ` +
  `${MAZO.filter(([id]) => CARTAS[id].tipo === TIPO.RECURSO).reduce((n, [, k]) => n + k, 0)} de recurso y ` +
  `${MAZO.filter(([id]) => CARTAS[id].tipo === TIPO.CLIMA).reduce((n, [, k]) => n + k, 0)} de clima.`);
p('');
const fuera = Object.keys(CARTAS).filter((id) => !enMazo(id));
if (fuera.length > 0) {
  p(`Fuera del mazo de referencia, y por tanto sin medir aquí: ` +
    `${fuera.map((id) => CARTAS[id].binomial).join(', ')}. Se juegan igual, ` +
    `pero su calibración no está comprobada.`);
}
p('');
p('**Qué revisar sobre todo:** los eventos de presión y las cartas de recurso.');
p('Son lo único del set que no describe un animal sino una presión sobre él, y');
p('es donde más fácil sería que se me hubiera colado algo sin respaldo.');
p('');
p('---');
p('');

// ------------------------------------------------------------- dinosaurios
p('## 0. Rarezas');
p('');
p('La rareza gobierna cuántas copias de una carta caben en un mazo y con qué');
p('frecuencia sale de un sobre. Sigue la abundancia fósil real: los taxones');
p('corrientes son comunes y *Torvosaurus*, genuinamente raro en el registro,');
p('es legendario.');
p('');
p('| Rareza | Copias máximas | Cartas distintas | En el mazo de referencia |');
p('|---|---|---|---|');
for (const r of ['COMUN', 'RARO', 'EPICO', 'LEGENDARIO']) {
  const l = Object.values(CARTAS).filter((c) => c.rareza === r);
  const enDeck = MAZO.filter(([id]) => CARTAS[id].rareza === r).reduce((n, [, k]) => n + k, 0);
  p(`| ${RAREZA_NOMBRE[r]} | ${BALANCE.copiasPorRareza[r]} | ${l.length} | ${enDeck} |`);
}
p('');
p('---');
p('');
p('## 1. Dinosaurios');
p('');
p('| Taxón | Clado | Rareza | Copias | Coste | Ataque | Defensa | Vida | Sed |');
p('|---|---|---|---|---|---|---|---|---|');
for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.DINOSAURIO) continue;
  p(`| *${c.binomial}* | ${CLADO_NOMBRE[c.clado]} | ${RAREZA_NOMBRE[c.rareza]} | ${copias[id]} | ${c.coste} | ${c.ataque} | ${c.defensa} | ${c.vida} | ${c.consumoHidrico} |`);
}
p('');
p('*Camarasaurus* es inmune a la Sed: sus isótopos indican que migraba.');
p('');

for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.DINOSAURIO) continue;
  p(`### *${c.binomial}* · ${CLADO_NOMBRE[c.clado]} · ${RAREZA_NOMBRE[c.rareza]} · ${enMazo(id) ? `${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}` : 'fuera del mazo de referencia'}`);
  p('');
  p(`**${c.coste} de coste · ${c.ataque} de Ataque · ${c.vida} de Vida** · Defensa propuesta: *${c.defensa}*`);
  p('');
  p(`**${c.rasgoNombre}** — ${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
  if (DEFENSA[id]) {
    p(`*Por qué ${c.defensa} de Defensa:* ${DEFENSA[id][1]}`);
    p('');
  }
}

p('---');
p('');
p('## 2. Eventos');
p('');
p('Un evento **mejora a un dinosaurio tuyo** o **le mete una presión a uno del');
p('rival**. Cada carta dice sobre qué se suelta. Los de mejora son rasgos');
p('biológicos reales, no mutaciones; los de presión son patologías y presiones');
p('ecológicas documentadas, no hechizos: aquí no hay magia, y esa es la parte');
p('del set con más riesgo de romper la restricción paleontológica.');
p('');
const DESTINO = {
  [OBJETIVO.PROPIO]: 'sobre un dinosaurio tuyo',
  [OBJETIVO.RIVAL]: 'sobre un dinosaurio del rival',
  [OBJETIVO.CLADO]: 'sobre un clado rival que eliges',
  [OBJETIVO.CAMPO]: 'sobre el campo entero',
};
for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.EVENTO) continue;
  p(`### ${c.binomial} · ${RAREZA_NOMBRE[c.rareza]} · coste ${c.coste} · ${enMazo(id) ? `${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}` : 'fuera del mazo de referencia'}`);
  p('');
  p(`Se juega **${DESTINO[c.objetivo]}**. ${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
}


for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.EVENTO) continue;
  p(`### ${c.binomial} · ${RAREZA_NOMBRE[c.rareza]} · coste ${c.coste} · ${enMazo(id) ? `${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}` : 'fuera del mazo de referencia'}`);
  p('');
  p(`${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
}

p('---');
p('');
p('## 3. Cartas de recurso');
p('');
p('Se juegan **boca arriba y surten efecto al instante**: dar Biomasa «este');
p('turno» no serviría de nada si esperasen a la revelación. A cambio el rival los');
p('ve venir, y eso es parte de su precio. Cuestan 0 y todos traen inconveniente.');
p('');
for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.RECURSO) continue;
  p(`### ${c.binomial} · ${RAREZA_NOMBRE[c.rareza]} · ${enMazo(id) ? `${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}` : 'fuera del mazo de referencia'}`);
  p('');
  p(`${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
}
p('---');
p('');
p('## 4. Cartas de clima');
p('');
p('Los cuatro paleoambientes de la Formación Morrison. **Una activa a la vez**;');
p('cualquiera de los dos bandos puede reemplazarla, y su efecto alcanza a los dos.');
p('');
for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.CLIMA) continue;
  p(`### ${c.binomial} · ${RAREZA_NOMBRE[c.rareza]} · coste ${c.coste}`);
  p('');
  p(`${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
}

p('---');
p('');
p('## 5. Clima estacional');
p('');
p(`Baraja neutral y compartida, aparte del mazo. Se voltea una carta por turno desde el turno ${BALANCE.turnoPrimeraEstacion}. Nadie la controla.`);
p('');
for (const e of Object.values(ESTACIONES)) {
  p(`### ${e.nombre}`);
  p('');
  p(`${e.texto}`);
  p('');
  p(`\`${e.nivel_evidencia}\` · ${e.nota_cientifica}`);
  p('');
}

p('---');
p('');
p('## 6. La red trófica actual');
p('');
p('El clado no es piedra-papel-tijera: cada relación se apoya en la misma evidencia que cita su carta.');
p('');
p('| Relación | Efecto |');
p('|---|---|');
p(`| Terópodo ataca a Ornitópodo | +${BALANCE.clados.bonusDepredacion} de daño |`);

p(`| Atacar a un Tireóforo | devuelve ${BALANCE.clados.espinasTireoforo} de daño |`);
p('');
p('**Resuelto así:** la Defensa por carta **sustituye** a la reducción del clado.');
p('Si se acumulasen, *Apatosaurus* reduciría 5 de cada golpe —más que el Ataque');
p('de casi todo el set— y sería intocable. El');
p('Saurópodo deja de tener regla propia y su identidad pasa a ser su línea de');
p('estadísticas —mucha Vida, mucha Defensa, poco Ataque—, que es más honesto: un');
p('clado no necesita una regla especial si sus números ya lo dicen. Terópodo y');
p('Tireóforo conservan las suyas.');
p('');

writeFileSync('SET_DE_CARTAS.md', L.join('\n') + '\n');
console.log('SET_DE_CARTAS.md escrito:', L.length, 'líneas');
