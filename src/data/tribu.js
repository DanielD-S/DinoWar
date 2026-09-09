// DinoWar — reglas de la capa cooperativa. Puras: sin DOM y sin reloj propio.
//
// El instante SIEMPRE entra por argumento. Dos razones, y las dos importan:
// los tests son deterministas, y el día que el estado viva en un servidor el
// instante bueno lo pondrá él —adelantar el reloj del móvil no puede regalar
// fósiles—. Que estas funciones no sepan qué hora es no es un descuido.

import { BALANCE } from './balance.js';

export const CUENCA = Object.freeze({
  // ------------------------------------------------------------- yacimiento
  // Producción por hora del yacimiento a nivel 1, y cuánto sube por nivel.
  // El depósito es la pieza de diseño, no el ritmo: sin tope, quien entra una
  // vez por semana rinde igual que quien entra a diario y el bucle largo no
  // existe; con un tope de dos horas, el juego pide estar encima.
  //
  // 14 horas de depósito pide pasar una vez al día y no castiga dormir.
  fosilesPorHora: 12,
  fosilesPorHoraPorNivel: 6,
  horasDeDeposito: 14,

  // Subir el yacimiento se paga con los mismos fósiles que se aportan a la
  // tribu. Ésa es toda la tensión del recurso: ayudar hoy o producir más
  // mañana. Si la mejora se pagara con monedas no habría decisión ninguna.
  costeMejora: (nivel) => 300 * nivel * nivel,
  nivelMaximo: 8,

  // ------------------------------------------------------------------ tribu
  miembrosMaximo: 8,

  // ------------------------------------------------------------------ jefes
  // Un asalto cuesta del almacén COMÚN: la tribu decide cuántos se puede
  // permitir, y ésa es su única decisión colectiva de verdad.
  costeAsalto: 150,
  // Tope por persona y día. Es lo que impide que uno solo haga el trabajo de
  // ocho y los demás miren.
  asaltosPorDia: 5,
  // Aportación mínima para que un jefe caído te dé su carta. Baja a propósito:
  // el premio es por participar, no por rematar. Si fuera para quien da el
  // último golpe, la tribu serían ocho personas esperando a rematar.
  danoParaRecompensa: 1,
});

const HORA = 3600_000;
export const DIA = 24 * HORA;

/** Depósito lleno del yacimiento a ese nivel. */
export const ritmoPorHora = (nivel) => CUENCA.fosilesPorHora
  + CUENCA.fosilesPorHoraPorNivel * (Math.max(1, nivel) - 1);

export const depositoDe = (nivel) => Math.round(ritmoPorHora(nivel) * CUENCA.horasDeDeposito);

/**
 * Fósiles acumulados desde la última visita. Se calcula por diferencia de
 * reloj, como Tribal Wars: nada corre en segundo plano y cerrar la pestaña no
 * pierde nada.
 *
 * Un reloj que va hacia atrás —cambio de zona, ajuste del sistema— no produce
 * nada en vez de producir negativo.
 *
 * @param {{nivel:number, fosiles:number, desde:number}} yacimiento
 * @param {number} ahora epoch en ms
 * @returns {{fosiles:number, desde:number, ganados:number, lleno:boolean}}
 */
export function acumular(yacimiento, ahora) {
  const nivel = Math.max(1, yacimiento.nivel ?? 1);
  const deposito = depositoDe(nivel);
  const desde = yacimiento.desde ?? ahora;
  const ritmo = ritmoPorHora(nivel);
  const tenia = yacimiento.fosiles ?? 0;
  const transcurrido = Math.max(0, ahora - desde);
  const ganados = Math.floor((transcurrido * ritmo) / HORA);
  const fosiles = Math.min(deposito, tenia + ganados);

  // `desde` avanza SÓLO lo que costó lo que se cobró, no hasta ahora: el resto
  // de hora que no llegó a cuajar queda pendiente para la próxima visita. Si
  // avanzara hasta ahora, entrar a menudo perdería fósiles; si no avanzara
  // nada, cada visita volvería a cobrar el tramo entero.
  return {
    fosiles,
    desde: fosiles >= deposito ? ahora : desde + Math.round((ganados * HORA) / ritmo),
    ganados: fosiles - tenia,
    lleno: fosiles >= deposito,
  };
}

/** Cuánto falta para que el depósito se llene, en ms. `null` si ya lo está. */
export function faltaParaLlenar(yacimiento, ahora) {
  const y = acumular(yacimiento, ahora);
  const nivel = Math.max(1, yacimiento.nivel ?? 1);
  const hueco = depositoDe(nivel) - y.fosiles;
  return hueco <= 0 ? null : Math.ceil((hueco / ritmoPorHora(nivel)) * HORA);
}

export const costeDeMejora = (nivel) => (nivel >= CUENCA.nivelMaximo ? null : CUENCA.costeMejora(nivel));

/**
 * Daño que un asalto le hace al jefe. Sale de la partida que acabas de jugar,
 * no de un dado: el daño al hábitat del jefe más una prima por cada trofeo.
 *
 * Perder tu partida SIGUE aportando. Es deliberado: en un juego cooperativo el
 * jugador flojo tiene que poder ayudar, o deja de jugar. Ganar aporta más.
 *
 * @param {{danoAlHabitat:number, trofeos:number, ganada:boolean}} partida
 */
export function danoDeAsalto({ danoAlHabitat = 0, trofeos = 0, ganada = false }) {
  const base = Math.max(0, Math.round(danoAlHabitat)) + Math.max(0, trofeos) * 8;
  return ganada ? Math.round(base * 1.5) : base;
}

/** ¿Puede esta persona asaltar ahora mismo? Devuelve el motivo si no. */
export function puedeAsaltar({ almacen, asaltosHoy }, ahora, jefe) {
  if (!jefe) return 'no hay ningún jefe en la cuenca';
  if (jefe.vida <= 0) return 'el jefe ya ha caído';
  if (ahora < jefe.desde) return 'el jefe todavía no ha aparecido';
  if (ahora > jefe.hasta) return 'la ventana de este jefe se ha cerrado';
  if (almacen < CUENCA.costeAsalto) return 'el almacén de la tribu no da para otro asalto';
  if (asaltosHoy >= CUENCA.asaltosPorDia) return 'ya has hecho tus asaltos de hoy';
  return null;
}

/**
 * Aplica un asalto. Devuelve el estado nuevo — no muta —, porque esto es lo
 * que un servidor tendrá que poder recalcular por su cuenta para validar.
 */
export function aplicarAsalto(estado, quien, dano) {
  const vida = Math.max(0, estado.jefe.vida - dano);
  return {
    ...estado,
    almacen: estado.almacen - CUENCA.costeAsalto,
    jefe: {
      ...estado.jefe,
      vida,
      caidoEn: vida === 0 && estado.jefe.vida > 0 ? estado.ahora ?? null : estado.jefe.caidoEn ?? null,
      aportes: { ...estado.jefe.aportes, [quien]: (estado.jefe.aportes[quien] ?? 0) + dano },
    },
  };
}

/**
 * ¿Le toca la carta a esta persona? Con haber aportado basta.
 * @see CUENCA.danoParaRecompensa
 */
export function mereceRecompensa(jefe, quien) {
  return jefe.vida <= 0 && (jefe.aportes[quien] ?? 0) >= CUENCA.danoParaRecompensa;
}

/** Reparto del daño por miembro, de más a menos. Para pintar la tabla. */
export function tablaDeAportes(jefe) {
  return Object.entries(jefe.aportes ?? {})
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([quien, dano]) => ({ quien, dano, cuota: dano / Math.max(1, totalAportado(jefe)) }));
}

export const totalAportado = (jefe) => Object.values(jefe.aportes ?? {}).reduce((a, b) => a + b, 0);

/** Vida que le queda al jefe, en tanto por uno. */
export const saludDeJefe = (jefe) => (jefe.vidaMaxima > 0 ? jefe.vida / jefe.vidaMaxima : 0);

/**
 * El hábitat que lleva un jefe en su partida. No es su Vida total —ésa son
 * miles y ninguna partida acabaría—: es lo que aguanta EN UNA PARTIDA, y el
 * daño que le saques ahí es lo que se le resta al total de la tribu.
 */
export const habitatDeAsalto = () => BALANCE.vidaHabitat * 3;
