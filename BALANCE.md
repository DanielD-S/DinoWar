# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **70** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **55**
- Lugares: **17 en el set, 4 por partida**
- Tiempo: 65.8 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 10.75 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 46.3 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 0 | 0 | ✅ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 71.2 % | 55 – 70 % | ❌ |
| Reparto entre las tres victorias | 29% / 71% / 0% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **71.2 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 5 |
| P10 | 8 |
| Mediana | 11 |
| Media | 10.75 |
| P90 | 14 |
| Máximo | 19 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 28.5 |
| Colapso del habitat | 71.0 |
| Extinción (sin cartas) | 0.5 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.82** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Matorral de cícadas | Campo | 0 | 83.3 % | 1.10 | 95 % | ✅ |
| *Iguanodon bernissartensis* | Ornitópodo | 2 | 92.5 % | 1.09 | 97 % | ✅ |
| *Pachycephalosaurus wyomingensis* | Marginocéfalo | 2 | 81.0 % | 1.09 | 98 % | ✅ |
| Pradera de helechos | Campo | 0 | 99.0 % | 1.09 | 96 % | ✅ |
| Bosque de araucarias | Campo | 0 | 81.5 % | 1.08 | 95 % | ✅ |
| *Suchomimus tenerensis* | Terópodo | 3 | 58.5 % | 1.07 | 94 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 58.0 % | 1.06 | 93 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 54.9 % | 1.05 | 99 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 78.6 % | 1.05 | 91 % | ✅ |
| Nube de insectos | Campo | 0 | 80.0 % | 1.05 | 92 % | ✅ |
| *Velociraptor mongoliensis* | Terópodo | 0 | 80.8 % | 1.02 | 90 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 55.5 % | 1.02 | 88 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 55.3 % | 1.02 | 88 % | ✅ |
| *Deltadromeus agilis* | Terópodo | 3 | 55.1 % | 1.01 | 92 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 91.5 % | 1.01 | 90 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 52.5 % | 1.01 | 90 % | ✅ |
| Sabana de helechos | Campo | 0 | 77.8 % | 1.00 | 92 % | ✅ |
| Gastrolitos | Campo | 1 | 54.6 % | 1.00 | 89 % | ✅ |
| *Amargasaurus cazadorensis* | Saurópodo | 2 | 77.2 % | 0.99 | 91 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 78.2 % | 0.99 | 87 % | ✅ |
| Nido con huevos | Campo | 1 | 77.3 % | 0.98 | 91 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 75.1 % | 0.96 | 87 % | ✅ |
| *Kentrosaurus aethiopicus* | Tireóforo | 1 | 78.0 % | 0.95 | 84 % | ✅ |
| Trampa de depredadores | Campo | 1 | 76.7 % | 0.92 | 85 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 50.2 % | 0.90 | 81 % | ✅ |
| Monzón de verano | Campo | 1 | 57.9 % | 0.90 | 79 % | ✅ |
| Gregarismo | Campo | 1 | 74.9 % | 0.90 | 80 % | ✅ |
| Fractura consolidada | Campo | 2 | 73.4 % | 0.89 | 77 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 74.6 % | 0.87 | 77 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 47.5 % | 0.85 | 78 % | ✅ |
| *Monolophosaurus jiangi* | Terópodo | 4 | 40.0 % | 0.71 | 64 % | ✅ |

## Los lugares

`Atracción` = despliegues por columna con ese lugar / despliegues por columna en general. 1,00 = una columna como otra; > 1,30 = la IA va a por él; < 0,70 = lo evita. Mide a dónde van las cartas, no quién gana: para eso está `node sim/lugares.mjs`.

| Lugar | Qué hace | Partidas | Atracción |
|---|---|---|---|
| Ladera volcánica | Lo que está aquí pega +2. La ceniza fértil lo alimenta todo. | 430 | 1.60 |
| Nidada | Cuando una criatura se revela aquí, su dueño roba 1 carta. | 475 | 1.34 |
| Barranco | Cada golpe al hábitat desde aquí pega 1 más. | 483 | 1.29 |
| Cazadero | Los terópodos pegan +1 aquí. | 485 | 1.14 |
| Bosque de coníferas | Lo que está aquí cura 1 al final del turno. | 499 | 1.12 |
| Llanura abierta | El daño que sobra al matar aquí se multiplica por 2. | 523 | 1.05 |
| Pradera alta | Los ornitópodos y los marginocéfalos pegan +1 aquí. | 433 | 1.04 |
| Pedregal | Lo que está aquí devuelve 1 de daño a quien lo hiere en combate. | 448 | 0.99 |
| Laguna | Lo que está aquí tiene +1 de Vida. | 434 | 0.99 |
| Roquedal | Los tireóforos tienen +2 de Vida aquí. | 463 | 0.94 |
| Río | Los reptiles marinos pegan +2 aquí. | 499 | 0.94 |
| Salinas | Aquí nadie cura. | 477 | 0.93 |
| Helechal | Los saurópodos y los ornitópodos tienen +2 de Vida aquí. | 474 | 0.92 |
| Acantilado | Los pterosaurios pegan +2 aquí. | 452 | 0.92 |
| Cauce seco | Al final del turno, el dueño de lo que está aquí pierde 1 carta del mazo. | 459 | 0.65 |
| Ciénaga | El barro frena: lo que está aquí pega −1, y nadie puede moverse desde aquí ni hacia aquí. | 470 | 0.62 |
| Desfiladero | Cada golpe al hábitat desde aquí pega 1 menos. | 496 | 0.56 |

## Diagnóstico

- **Victorias del jugador inicial**: 46.3 % (objetivo 48 – 55 %).
- **P(ganar | ventaja en el turno 5)**: 71.2 % (objetivo 55 – 70 %).
- **Reparto entre las tres victorias**: 29% / 71% / 0% (objetivo cada una 15 – 60 %).

