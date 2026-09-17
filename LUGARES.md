# LUGARES.md — DinoWar

> Generado por `node sim/lugares.mjs`. **No editar a mano.**

- Partidas por tanda: **300** · semilla base **9000** · mazo de referencia, heurística contra heurística
- Lugares en el set: **17** · por partida: **4** · columna medida a solas: **3**

## El tablero plano contra el de lugares

Mismas semillas, mismo reparto de cartas. Lo que cambia entre las dos filas es sólo que las columnas tengan lugar.

| tablero | turnos | inicial | bola de nieve | trofeos / hábitat / extinción |
|---|---|---|---|---|
| PLANO | 10.8 | 48.0 % | 75.3 % | 30 / 70 / 0 |
| con LUGARES (sorteo) | 10.8 | 46.3 % | 71.5 % | 31 / 68 / 1 |

## Cada lugar

`En las cuatro` es el lugar forzado en todas las columnas: qué le hace al juego mientras está puesto. `Atracción` es el lugar en la columna 3 a solas: cuota de despliegues de esa columna dividida por la misma cuota en el tablero plano (23.7 %). 1,00 = una columna como otra; > 1,30 = la IA va a por él; < 0,70 = lo evita.

| lugar | qué hace | turnos | inicial | bola | trofeos / hábitat / extinción | atracción |
|---|---|---|---|---|---|---|
| Ladera volcánica | Lo que está aquí pega +2. La ceniza fértil lo alimenta todo. | 8.6 | 44.3 % | 72.9 % | 6 / 94 / 0 | 1.74 |
| Nidada | Cuando una criatura se revela aquí, su dueño roba 1 carta. | 8.9 | 48.7 % | 80.3 % | 83 / 11 / 6 | 1.41 |
| Desfiladero | Cada golpe al hábitat desde aquí pega 1 menos. | 12.8 | 45.3 % | 75.0 % | 53 / 47 / 0 | 0.54 |
| Ciénaga | El barro frena: lo que está aquí pega −1, y nadie puede moverse desde aquí ni hacia aquí. | 12.6 | 46.7 % | 73.3 % | 44 / 56 / 0 | 0.58 |
| Barranco | Cada golpe al hábitat desde aquí pega 1 más. | 9.2 | 45.3 % | 75.6 % | 11 / 89 / 0 | 1.52 |
| Llanura abierta | El daño que sobra al matar aquí se multiplica por 2. | 9.6 | 48.3 % | 75.6 % | 16 / 84 / 0 | 1.11 |
| Pedregal | Lo que está aquí devuelve 1 de daño a quien lo hiere en combate. | 11.6 | 43.0 % | 70.9 % | 38 / 62 / 0 | 0.99 |
| Cauce seco | Al final del turno, el dueño de lo que está aquí pierde 1 carta del mazo. | 10.2 | 52.7 % | 57.2 % | 7 / 50 / 43 | 0.63 |
| Cazadero | Los terópodos pegan +1 aquí. | 10.3 | 43.7 % | 75.9 % | 21 / 79 / 0 | 1.36 |
| Helechal | Los saurópodos y los ornitópodos tienen +2 de Vida aquí. | 11.4 | 47.0 % | 70.5 % | 31 / 69 / 0 | 1.01 |
| Pradera alta | Los ornitópodos y los marginocéfalos pegan +1 aquí. | 10.5 | 45.0 % | 76.1 % | 20 / 80 / 0 | 1.12 |
| Roquedal | Los tireóforos tienen +2 de Vida aquí. | 11.2 | 43.7 % | 73.6 % | 31 / 69 / 0 | 1.00 |
| Laguna | Lo que está aquí tiene +1 de Vida. | 11.1 | 46.7 % | 79.0 % | 29 / 71 / 0 | 1.08 |
| Salinas | Aquí nadie cura. | 10.9 | 46.7 % | 73.0 % | 30 / 70 / 0 | 1.00 |
| Bosque de coníferas | Lo que está aquí cura 1 al final del turno. | 10.8 | 48.0 % | 77.4 % | 26 / 74 / 0 | 1.36 |
| Río | Los reptiles marinos pegan +2 aquí. | 10.8 | 48.0 % | 75.3 % | 30 / 70 / 0 | 1.00 |
| Acantilado | Los pterosaurios pegan +2 aquí. | 10.8 | 48.0 % | 75.3 % | 30 / 70 / 0 | 1.00 |

Referencia, el tablero PLANO: 10.8 turnos · inicial 48.0 % · bola 75.3 % · 30 / 70 / 0.

