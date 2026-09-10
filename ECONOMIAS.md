# ECONOMIAS.md — las tres economías, medidas

> Generado por `node sim/economias.js`. **No editar a mano.**
>
> El juego publicado corre **siempre en FIJA**. Las otras dos existen para
> decidir con datos si alguna merece sustituirla. Se eligen por entorno:
> `DINOWAR_ECONOMIA=TIPADA node sim/run.js`.

- Partidas por economía: **2000** · semilla base **1** · heurística vs heurística
- Las tres corren sobre **las mismas semillas**, así que las diferencias son de la economía.

## Qué es cada una

- **FIJA** — La de hoy: renta igual para los dos, garantizada y sin tipo.
- **TIPADA** — Renta igual y garantizada, pero con tipo declarado un turno antes.
- **CARTAS** — La Biomasa es carta de recurso: 18 de las 50, una por turno.

En las dos tipadas, un carnívoro sólo se paga con Biomasa **animal** y un
herbívoro sólo con **vegetal**; los omnívoros aceptan cualquiera y pagan con
vegetal primero, que es la abundante. Eventos, climas y recursos no comen: los
paga cualquier Biomasa.

El set reparte **17 carnívoros, 30 herbívoros y 3 omnívoros**.
La dieta no es un alias del clado: *Therizinosaurus* es un terópodo herbívoro y
los oviraptorosaurios se leen como omnívoros. Ahí está el valor del eje.

En TIPADA, producir vegetal renta **2** y producir animal **1**:
es la eficiencia ecológica entre niveles tróficos hecha regla.

En CARTAS, **18 de las 50** cartas del mazo son recurso, se baja **1 por turno** y cada una da **1**.
Eso deja el mazo en 27 entradas de acción menos las recortadas: 32 cartas jugables de 50.

## Los objetivos, lado a lado

| Métrica | Objetivo | FIJA | TIPADA | CARTAS |
|---|---|---|---|---|
| Duración media (turnos) | 10 – 14 | 11.8 ✅ | 13.6 ✅ | 19.9 ❌ |
| Victorias del jugador inicial | 48 – 55 | 47.8 % ❌ | 46.3 % ❌ | 49.0 % ✅ |
| Bola de nieve (ventaja en T5) | 55 – 70 | 67.3 % ✅ | 68.8 % ✅ | 65.6 % ✅ |
| Partidas sin decisión | ≤ 2 | 0.0 % ✅ | 0.0 % ✅ | 0.1 % ✅ |
| Cartas mal calibradas | ≤ 0 | 3 ❌ | 12 ❌ | 18 ❌ |

## Cómo se gana en cada una

| Vía | FIJA | TIPADA | CARTAS |
|---|---|---|---|
| Registro fósil | 46.4 % | 26.6 % | 0.0 % |
| Colapso del hábitat | 31.8 % | 37.8 % | 52.4 % |
| Extinción | 21.9 % | 35.6 % | 47.5 % |

## Duración

| | FIJA | TIPADA | CARTAS |
|---|---|---|---|
| P10 | 9 | 9 | 11 |
| Mediana | 12 | 14 | 19 |
| P90 | 15 | 18 | 30 |
| Máximo | 20 | 23 | 40 |

## Veredicto

- **FIJA**: incumple 2 — victorias del jugador inicial, cartas mal calibradas.
- **TIPADA**: incumple 2 — victorias del jugador inicial, cartas mal calibradas.
- **CARTAS**: incumple 2 — duración media (turnos), cartas mal calibradas.

La comparación que importa es la **bola de nieve**: es la razón de existir de
la v2. Una economía que la empeore no entra por muy bien que quede en lo demás.

