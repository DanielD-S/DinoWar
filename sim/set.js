// Genera SET_DE_CARTAS.md desde el código, para que las cifras actuales sean
// las de verdad y no una transcripción a mano que se desfase.

import { writeFileSync } from 'node:fs';
import { CARTAS, TIPO, TIPO_NOMBRE, OBJETIVO, CLADO_NOMBRE, ESTACIONES } from '../src/data/cards.js';
import { BALANCE, TOTAL_MAZO } from '../src/data/balance.js';

// Defensa PROPUESTA: reducción plana de daño, correlacionada con morfología
// antipredatoria real (osteodermos, placas, talla). No está en el código.
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
};

const copias = Object.fromEntries(BALANCE.mazo);
const L = [];
const p = (x = '') => L.push(x);

p('# SET DE CARTAS — DinoWar v2');
p('');
p('> Generado por `node sim/set.js` desde `src/data/cards.js` y `src/data/balance.js`.');
p('> Todas las cifras son las que ejecuta el motor, calibradas sobre 2.000 partidas.');
p('>');
p('> **Copias**: cuántos ejemplares de esa carta hay en el mazo.');
p('> **Sed**: heridas que recibe cuando sale *Sequía estacional*. **No es un');
p('> segundo coste**: no se paga al jugarla, sólo cuando el clima lo cobra.');
p('');
p(`Mazo fijo de **${TOTAL_MAZO} cartas**: ${BALANCE.mazo.filter(([id]) => CARTAS[id].tipo === TIPO.DINOSAURIO).reduce((n, [, k]) => n + k, 0)} dinosaurios, ` +
  `${BALANCE.mazo.filter(([id]) => CARTAS[id].tipo === TIPO.EVENTO).reduce((n, [, k]) => n + k, 0)} eventos, ` +
  `${BALANCE.mazo.filter(([id]) => CARTAS[id].tipo === TIPO.RECURSO).reduce((n, [, k]) => n + k, 0)} de recurso y ` +
  `${BALANCE.mazo.filter(([id]) => CARTAS[id].tipo === TIPO.CLIMA).reduce((n, [, k]) => n + k, 0)} de clima.`);
p('');
p('**Qué revisar sobre todo:** los eventos de presión —Fractura consolidada,');
p('Competencia trófica y Mortandad estacional— y las tres cartas de recurso.');
p('Son lo único del set que no describe un animal sino una presión sobre él, y');
p('es donde más fácil sería que se me hubiera colado algo sin respaldo.');
p('');
p('---');
p('');

// ------------------------------------------------------------- dinosaurios
p('## 1. Dinosaurios');
p('');
p('| Taxón | Clado | Copias | Coste | Ataque | Defensa | Vida | Sed |');
p('|---|---|---|---|---|---|---|---|');
for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.DINOSAURIO) continue;
  p(`| *${c.binomial}* | ${CLADO_NOMBRE[c.clado]} | ${copias[id]} | ${c.coste} | ${c.ataque} | ${c.defensa} | ${c.vida} | ${c.consumoHidrico} |`);
}
p('');
p('*Camarasaurus* es inmune a la Sed: sus isótopos indican que migraba.');
p('');

for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.DINOSAURIO) continue;
  p(`### *${c.binomial}* · ${CLADO_NOMBRE[c.clado]} · ${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}`);
  p('');
  p(`**${c.coste} de coste · ${c.ataque} de Ataque · ${c.vida} de Vida** · Defensa propuesta: *${c.defensa}*`);
  p('');
  p(`**${c.rasgoNombre}** — ${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
  p(`*Por qué ${c.defensa} de Defensa:* ${DEFENSA[id][1]}`);
  p('');
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
  p(`### ${c.binomial} · coste ${c.coste} · ${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}`);
  p('');
  p(`Se juega **${DESTINO[c.objetivo]}**. ${c.rasgoTexto}`);
  p('');
  p(`\`${c.nivel_evidencia}\` · ${c.nota_cientifica}`);
  p('');
}


for (const [id, c] of Object.entries(CARTAS)) {
  if (c.tipo !== TIPO.EVENTO) continue;
  p(`### ${c.binomial} · coste ${c.coste} · ${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}`);
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
  p(`### ${c.binomial} · ${copias[id]} ${copias[id] === 1 ? 'copia' : 'copias'}`);
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
  p(`### ${c.binomial} · coste ${c.coste}`);
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
