// DinoWar — habilidades AL ENTRAR EN JUEGO.
//
// Un rasgo que se dispara una vez, cuando la criatura llega al campo, y se
// acabó. Nada de estado que llevar en la cabeza.
//
// Por qué esta forma y no la de antes. Los rasgos de siempre son PASIVOS y
// condicionales —«+1 de Vida si tienes otro Stegosaurus»— y eso tiene dos
// problemas medidos:
//
//   1. No se leen. Es la misma clase de regla invisible que la Defensa, que se
//      quitó justo por eso: había que hacer aritmética contra un número de la
//      OTRA carta.
//   2. Falsean la medición. La IA valora una unidad multiplicando por los
//      turnos que espera que aguante (`IA.horizonte`), así que todo lo pasivo se
//      infla. De ahí salió el «la Defensa vale 4 veces el Ataque», que era un
//      artefacto. Un disparo al entrar es valor inmediato y discreto: se tasa
//      directo, sin multiplicador.
//
// Se disparan en la FASE DE REVELACIÓN, que ya es simultánea y con un orden
// determinista (por tipo y luego por iid). Eso importa más de lo que parece: el
// servidor re-juega cada partida para validarla, y sin un orden fijo dos
// máquinas llegarían a resultados distintos con las mismas jugadas.

import { BALANCE } from '../data/balance.js';
import { RASGO, carta } from '../data/cards.js';

/** ¿Están encendidas? Se apagan por entorno para poder medir con y sin. */
export const HAY_ENTRADAS = !(typeof process !== 'undefined' && process.env
  && process.env.DINOWAR_ENTRADAS === '0');

/** Los rasgos que se disparan al entrar. Lo usan la IA y las pantallas. */
export const ES_ENTRADA = Object.freeze({
  [RASGO.ENTRADA_ALERTA]: true,
  [RASGO.ENTRADA_EMBOSCADA]: true,
  [RASGO.ENTRADA_MANADA_SANA]: true,
  [RASGO.ENTRADA_DEVORA_MAZO]: true,
  [RASGO.ENTRADA_RAMONEO]: true,
  [RASGO.ENTRADA_ARRASA]: true,
});

export const esEntrada = (cardId) => Boolean(ES_ENTRADA[carta(cardId).rasgo]);

/**
 * Cuánto vale, a ojo, dispararla. NO decide nada del juego: sólo sirve para que
 * la IA no ignore estas cartas, que es lo que le pasó a la Llanura hasta que se
 * le puso número —cero usos en 300 partidas—.
 *
 * Es una estimación deliberadamente burda: un punto por cada punto de efecto.
 * Afinarla es tarea del recoste, no de aquí.
 */
export function valorDeEntrada(cardId) {
  if (!HAY_ENTRADAS) return 0;
  const E = BALANCE.entradas;
  switch (carta(cardId).rasgo) {
    case RASGO.ENTRADA_ALERTA: return E.alertaRoba * 1.4;
    case RASGO.ENTRADA_EMBOSCADA: return E.emboscadaDano;
    case RASGO.ENTRADA_MANADA_SANA: return E.manadaSanaCura;
    case RASGO.ENTRADA_DEVORA_MAZO: return E.devoraMazo * 0.4;
    case RASGO.ENTRADA_RAMONEO: return E.ramoneoBiomasa * 1.2;
    case RASGO.ENTRADA_ARRASA: return E.arrasaHabitat * BALANCE.ia.pesoHabitat;
    default: return 0;
  }
}

/**
 * Dispara la habilidad de entrada de `inst`, si tiene. Muta el estado, como el
 * resto de la fase de revelación.
 *
 * @param {object} s        estado en curso
 * @param {object} inst     la instancia que acaba de entrar
 * @param {object} ayudas   lo que hace falta del resto del motor
 */
export function alEntrar(s, inst, ayudas) {
  if (!HAY_ENTRADAS) return;
  const { ev, herir, rival, unidadEn, unidadesDe, CAUSA } = ayudas;
  const c = carta(inst.cardId);
  const j = inst.dueno;
  const contrario = rival(j);
  const E = BALANCE.entradas;
  const jug = s.jugadores[j];

  switch (c.rasgo) {
    // Ojos enormes y bulbos olfatorios grandes: ve venir las cosas.
    case RASGO.ENTRADA_ALERTA: {
      let robadas = 0;
      for (let k = 0; k < E.alertaRoba && jug.mazo.length > 0; k++) {
        jug.mano.push(jug.mazo.shift());
        robadas += 1;
      }
      ev(s, 'ENTRADA', { iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'roba', n: robadas });
      break;
    }

    // Cae encima del que tiene enfrente antes de que se coloque.
    case RASGO.ENTRADA_EMBOSCADA: {
      const enfrente = unidadEn(s, contrario, inst.ranura);
      // El evento se emite AUNQUE no haya a quién emboscar, con n: 0. Callarlo
      // dejaba la habilidad sin rastro en el registro de la partida: el jugador
      // veía entrar la carta y nada más, sin saber si había fallado o si el
      // rasgo no existía.
      if (enfrente) herir(s, enfrente.iid, E.emboscadaDano, CAUSA.ENTRADA, j);
      ev(s, 'ENTRADA', {
        iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'emboscada',
        n: enfrente ? E.emboscadaDano : 0,
      });
      break;
    }

    // La coraza que llega y cierra la formación.
    case RASGO.ENTRADA_MANADA_SANA: {
      let curados = 0;
      for (const u of unidadesDe(s, j)) {
        const otra = s.instancias[u.iid];
        if (otra.iid === inst.iid || otra.heridas <= 0) continue;
        otra.heridas = Math.max(0, otra.heridas - E.manadaSanaCura);
        curados += 1;
      }
      ev(s, 'ENTRADA', { iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'cura', n: curados });
      break;
    }

    // Depredador de mar abierto: lo que caza no vuelve al registro.
    case RASGO.ENTRADA_DEVORA_MAZO: {
      const otro = s.jugadores[contrario];
      let molidas = 0;
      for (let k = 0; k < E.devoraMazo && otro.mazo.length > 0; k++) {
        otro.descarte.push(otro.mazo.shift());
        molidas += 1;
      }
      ev(s, 'ENTRADA', { iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'muele', n: molidas });
      break;
    }

    // Alcanza el dosel que nadie más alcanza.
    case RASGO.ENTRADA_RAMONEO: {
      jug.biomasa += E.ramoneoBiomasa;
      ev(s, 'ENTRADA', { iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'biomasa', n: E.ramoneoBiomasa });
      break;
    }

    // Doce metros entrando en una llanura de inundación.
    case RASGO.ENTRADA_ARRASA: {
      const otro = s.jugadores[contrario];
      otro.habitat = Math.max(0, otro.habitat - E.arrasaHabitat);
      ev(s, 'ENTRADA', { iid: inst.iid, cardId: inst.cardId, dueno: j, efecto: 'habitat', n: E.arrasaHabitat });
      break;
    }

    default:
      break;
  }
}
