// La economía tipada es la única parte del motor donde «me llega» y «me llega
// DE LO MÍO» son cosas distintas. Estos tests fijan esa diferencia, y de paso
// fijan que la economía de siempre no la nota.

import test from 'node:test';
import assert from 'node:assert/strict';

import { DIETA, dietaDe, repartoPorDieta } from '../src/data/dietas.js';
import { CARTAS, TIPO, carta } from '../src/data/cards.js';
import { puedePagar, pagar, devolver } from '../src/engine/economia.js';
import { mazoConBiomasa, BALANCE } from '../src/data/balance.js';

test('La dieta no se puede deducir del clado: ahí está su valor', () => {
  // Si dieta y clado dijeran siempre lo mismo, este eje no añadiría nada.
  assert.equal(dietaDe('therizinosaurus'), DIETA.HERBIVORO, 'terópodo herbívoro');
  assert.equal(dietaDe('allosaurus'), DIETA.CARNIVORO);
  assert.equal(dietaDe('troodon'), DIETA.OMNIVORO);
  assert.equal(dietaDe('ojoraptorsaurus'), DIETA.OMNIVORO);
  assert.equal(dietaDe('huaxiadraco'), DIETA.HERBIVORO, 'tapejárido frugívoro');
});

test('Toda criatura del set tiene dieta, y sólo las criaturas', () => {
  for (const [id, c] of Object.entries(CARTAS)) {
    const d = dietaDe(id);
    if (c.tipo === TIPO.DINOSAURIO) {
      assert.ok(Object.values(DIETA).includes(d), `${id} no declara dieta`);
    } else {
      assert.equal(d, null, `${id} no come y no debería tener dieta`);
    }
  }
  const n = repartoPorDieta();
  assert.equal(n.CARNIVORO + n.HERBIVORO + n.OMNIVORO, 50);
});

test('El mazo de la economía por cartas sigue siendo de 50', () => {
  const z = mazoConBiomasa();
  assert.equal(z.reduce((n, [, c]) => n + c, 0), BALANCE.tamanoMazo);
  const recursos = z.filter(([id]) => id.startsWith('biomasa_')).reduce((n, [, c]) => n + c, 0);
  assert.equal(recursos, BALANCE.economia.cartas.porMazo);
  // Recortar copias, no cartas: el mazo tiene que seguir siendo el mismo mazo.
  assert.ok(z.filter(([id]) => !id.startsWith('biomasa_')).length >= 25,
    'el recorte se comió la variedad en vez de las repeticiones');
});

test('El juego publicado corre en FIJA', () => {
  // Las variantes se piden por entorno y sólo desde Node. Que el valor por
  // defecto se mueva sin querer es exactamente el accidente que hay que evitar.
  assert.equal(process.env.DINOWAR_ECONOMIA ?? 'FIJA', BALANCE.economia.modo);
});

// ------------------------------------------------------- pagos tipados

const bolsa = (biomasa, animal = 0) => ({ biomasa, animal });

test('En FIJA todo paga todo: la dieta no se mira', () => {
  const jug = bolsa(3);
  assert.ok(puedePagar(jug, 'allosaurus', 'FIJA'));   // carnívoro, coste 3
  assert.ok(puedePagar(jug, 'camarasaurus', 'FIJA')); // herbívoro, coste 3
  pagar(jug, 'allosaurus', 'FIJA');
  assert.equal(jug.biomasa, 0);
});

test('En TIPADA un carnívoro no come helechos', () => {
  const soloVegetal = bolsa(9, 0);
  assert.ok(!puedePagar(soloVegetal, 'allosaurus', 'TIPADA'),
    'nueve de vegetal no pagan un carnívoro de coste 3');
  assert.ok(puedePagar(soloVegetal, 'camarasaurus', 'TIPADA'));

  const soloAnimal = bolsa(9, 9);
  assert.ok(puedePagar(soloAnimal, 'allosaurus', 'TIPADA'));
  assert.ok(!puedePagar(soloAnimal, 'camarasaurus', 'TIPADA'),
    'nueve de animal no pagan un herbívoro');
});

test('El omnívoro gasta vegetal primero: la animal es la escasa', () => {
  const jug = bolsa(5, 3);                 // 2 vegetal + 3 animal
  assert.ok(puedePagar(jug, 'troodon', 'TIPADA'));
  const coste = carta('troodon').coste;
  pagar(jug, 'troodon', 'TIPADA');
  assert.equal(jug.biomasa, 5 - coste);
  // Con 2 de vegetal, sólo lo que pase de ahí sale de la animal.
  assert.equal(jug.animal, 3 - Math.max(0, coste - 2));
  assert.ok(jug.animal >= 0 && jug.animal <= jug.biomasa, 'la bolsa quedó incoherente');
});

test('Retirar devuelve la Biomasa a su bolsa, no a la otra', () => {
  const jug = bolsa(4, 4);
  pagar(jug, 'allosaurus', 'TIPADA');
  devolver(jug, 'allosaurus', 'TIPADA');
  assert.deepEqual(jug, bolsa(4, 4));
});

test('Lo que no come se paga con cualquier Biomasa', () => {
  const jug = bolsa(3, 0);
  assert.equal(dietaDe('mortandad'), null);
  assert.ok(puedePagar(jug, 'mortandad', 'TIPADA'), 'un evento no tiene dieta');
});
