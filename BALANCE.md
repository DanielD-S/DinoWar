# BALANCE.md — DinoWar

> Generado por `node sim/run.js`. **No editar a mano**: se regenera en cada cambio de números.

- Partidas: **2000** · semilla base **1** · perfiles **heuristica vs heuristica**
- Ranuras: **4** · Habitat: **90** · Trofeos para ganar: **10**
- Renta: **2/turno hasta 12**, acumula · Mazo: **55**
- Lugares: **17 en el set, 4 por partida**
- Tiempo: 90.6 s

## Objetivos (PLAN_V2.md §8)

| Métrica | Resultado | Objetivo | |
|---|---|---|---|
| Duración media | 12.09 turnos | 10 – 14 | ✅ |
| Victorias del jugador inicial | 45.3 % | 48 – 55 % | ❌ |
| Cartas mal calibradas | 0 | 0 | ✅ |
| Partidas sin decisión | 0.0 % | < 2 % | ✅ |
| P(ganar | ventaja en el turno 5) | 70.0 % | 55 – 70 % | ✅ |
| Reparto entre las tres victorias | 47% / 52% / 1% | cada una 15 – 60 % | ❌ |

**Hay objetivos incumplidos.**

## La bola de nieve

Es la razón de existir de la v2. En la v1, quien iba por delante en el turno 6 ganaba el **87,6 %** de las partidas y los últimos siete turnos eran trámite.

Aquí, quien va por delante en el turno 5 gana el **70.0 %**.

## Duración y finales

| | Turnos |
|---|---|
| Mínimo | 6 |
| P10 | 9 |
| Mediana | 12 |
| Media | 12.09 |
| P90 | 15 |
| Máximo | 21 |

| Vía de victoria | % |
|---|---|
| Registro fósil (10 trofeos) | 47.2 |
| Colapso del habitat | 52.0 |
| Extinción (sin cartas) | 0.8 |
| Sin decisión (tope de 40 turnos) | 0.0 |

Unidades vivas medias por bando: **1.82** de 4 ranuras.

## Calibración por carta

`Índice` = cuota de jugadas / peso en el mazo. 1,00 = se juega en proporción exacta a lo que aparece; < 0,70 = los jugadores la evitan; > 1,30 = la juegan siempre que la ven.

`Uso` = de las copias que llegaron a una mano, cuántas se jugaron. El índice compara la carta con su peso en el mazo y por eso lo mueve la lista tanto como la carta; el uso mira sólo la carta: cuántas veces, teniéndola, se prefirió no jugarla.

| Carta | Familia | Coste | % partidas | Índice | Uso | |
|---|---|---|---|---|---|---|
| Matorral de cícadas | Campo | 0 | 86.1 % | 1.09 | 96 % | ✅ |
| *Iguanodon bernissartensis* | Ornitópodo | 2 | 94.3 % | 1.09 | 97 % | ✅ |
| *Pachycephalosaurus wyomingensis* | Marginocéfalo | 2 | 84.2 % | 1.08 | 98 % | ✅ |
| Pradera de helechos | Campo | 0 | 99.4 % | 1.08 | 96 % | ✅ |
| Bosque de araucarias | Campo | 0 | 84.5 % | 1.07 | 96 % | ✅ |
| *Suchomimus tenerensis* | Terópodo | 3 | 62.3 % | 1.06 | 93 % | ✅ |
| Crecimiento acelerado | Campo | 1 | 62.0 % | 1.06 | 94 % | ✅ |
| *Diplodocus carnegii* | Saurópodo | 2 | 58.5 % | 1.05 | 99 % | ✅ |
| *Ceratosaurus nasicornis* | Terópodo | 2 | 82.2 % | 1.05 | 92 % | ✅ |
| Nube de insectos | Campo | 0 | 82.8 % | 1.04 | 92 % | ✅ |
| *Lokiceratops rangiformis* | Marginocéfalo | 3 | 57.4 % | 1.03 | 91 % | ✅ |
| *Tyrannotitan chubutensis* | Terópodo | 4 | 58.9 % | 1.02 | 90 % | ✅ |
| *Allosaurus fragilis* | Terópodo | 3 | 94.5 % | 1.02 | 92 % | ✅ |
| *Deltadromeus agilis* | Terópodo | 3 | 59.0 % | 1.02 | 93 % | ✅ |
| *Velociraptor mongoliensis* | Terópodo | 0 | 83.7 % | 1.02 | 90 % | ✅ |
| *Stegosaurus stenops* | Tireóforo | 2 | 58.9 % | 1.01 | 88 % | ✅ |
| Gastrolitos | Campo | 1 | 58.9 % | 1.00 | 91 % | ✅ |
| *Amargasaurus cazadorensis* | Saurópodo | 2 | 80.8 % | 0.99 | 91 % | ✅ |
| Sabana de helechos | Campo | 0 | 81.0 % | 0.99 | 92 % | ✅ |
| *Dryosaurus altus* | Ornitópodo | 0 | 81.5 % | 0.99 | 87 % | ✅ |
| *Apatosaurus louisae* | Saurópodo | 3 | 80.1 % | 0.98 | 89 % | ✅ |
| Nido con huevos | Campo | 1 | 81.0 % | 0.98 | 91 % | ✅ |
| *Kentrosaurus aethiopicus* | Tireóforo | 1 | 80.8 % | 0.94 | 84 % | ✅ |
| Trampa de depredadores | Campo | 1 | 80.0 % | 0.92 | 85 % | ✅ |
| Gregarismo | Campo | 1 | 78.3 % | 0.91 | 82 % | ✅ |
| Fractura consolidada | Campo | 2 | 77.3 % | 0.91 | 79 % | ✅ |
| *Brachylophosaurus canadensis* | Ornitópodo | 2 | 53.4 % | 0.90 | 83 % | ✅ |
| Monzón de verano | Campo | 1 | 63.0 % | 0.90 | 79 % | ✅ |
| Canal fluvial trenzado | Campo | 1 | 51.4 % | 0.86 | 79 % | ✅ |
| Rebrote tras incendio | Campo | 0 | 76.7 % | 0.84 | 76 % | ✅ |
| *Monolophosaurus jiangi* | Terópodo | 4 | 44.6 % | 0.75 | 68 % | ✅ |

## Los lugares

`Atracción` = despliegues por columna con ese lugar / despliegues por columna en general. 1,00 = una columna como otra; > 1,30 = la IA va a por él; < 0,70 = lo evita. Mide a dónde van las cartas, no quién gana: para eso está `node sim/lugares.mjs`.

| Lugar | Qué hace | Partidas | Atracción |
|---|---|---|---|
| Ladera volcánica | Lo que está aquí pega +2. La ceniza fértil lo alimenta todo. | 430 | 1.61 |
| Barranco | Cada golpe al hábitat desde aquí pega 1 más. | 483 | 1.31 |
| Nidada | Cuando una criatura se revela aquí, su dueño roba 1 carta. | 475 | 1.31 |
| Cazadero | Los terópodos pegan +1 aquí. | 485 | 1.14 |
| Bosque de coníferas | Lo que está aquí cura 1 al final del turno. | 499 | 1.10 |
| Llanura abierta | El daño que sobra al matar aquí se multiplica por 2. | 523 | 1.05 |
| Pradera alta | Los ornitópodos y los marginocéfalos pegan +1 aquí. | 433 | 1.03 |
| Laguna | Lo que está aquí tiene +1 de Vida. | 434 | 0.98 |
| Pedregal | Lo que está aquí devuelve 1 de daño a quien lo hiere en combate. | 448 | 0.98 |
| Salinas | Aquí nadie cura. | 477 | 0.95 |
| Helechal | Los saurópodos y los ornitópodos tienen +2 de Vida aquí. | 474 | 0.94 |
| Roquedal | Los tireóforos tienen +2 de Vida aquí. | 463 | 0.94 |
| Río | Los reptiles marinos pegan +2 aquí. | 499 | 0.93 |
| Acantilado | Los pterosaurios pegan +2 aquí. | 452 | 0.91 |
| Cauce seco | Al final del turno, el dueño de lo que está aquí pierde 1 carta del mazo. | 459 | 0.65 |
| Ciénaga | El barro frena: lo que está aquí pega −1, y nadie puede moverse desde aquí ni hacia aquí. | 470 | 0.63 |
| Desfiladero | Cada golpe al hábitat desde aquí pega 1 menos. | 496 | 0.57 |

## Diagnóstico

- **Victorias del jugador inicial**: 45.3 % (objetivo 48 – 55 %).
- **Reparto entre las tres victorias**: 47% / 52% / 1% (objetivo cada una 15 – 60 %).

