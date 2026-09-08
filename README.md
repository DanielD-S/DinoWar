# DinoWar

Juego de cartas por turnos para navegador móvil, ambientado en la **Formación Morrison**
(Jurásico Superior, Kimmeridgiense–Titoniense, ~155–146 Ma, oeste de Norteamérica).

Dos poblaciones se enfrentan en un campo de cinco ranuras. Se despliega **boca abajo**
y se revela **a la vez**: la tensión del juego es la información oculta, no el azar.

**▶ [Jugar](https://danield-s.github.io/DinoWar/)** · sin instalación, sin cuenta, sin backend.

---

## Tres formas de ganar

| Vía | Cómo |
|---|---|
| **Registro fósil** | Reúne 12 trofeos. Cada dinosaurio rival que muere te da uno. |
| **Colapso del hábitat** | Derriba el hábitat rival, que empieza con 26 de Vida. |
| **Extinción** | Si al rival le toca robar y no le quedan cartas, pierde. El descarte **no se rebaraja**. |

Y de ahí sale la decisión de cada turno: **una fila llena tapa tu hábitat pero regala
trofeos; una fila corta niega trofeos pero deja pasar el daño**. No hay postura segura.

## La regla que lo diferencia

Ningún híbrido, ninguna especie inventada, ningún anacronismo. Los taxones existen, están
descritos formalmente y proceden todos de la Morrison, así que pudieron coincidir en el
tiempo y en el espacio. Ninguno lleva plumas, porque ninguno tiene evidencia tegumentaria
que las respalde.

**Cada rasgo declara su nivel de evidencia** —`ESTABLECIDO`, `INFERIDO` o `DEBATIDO`— y
cada carta lleva su nota científica, visibles en la ficha al mantenerla pulsada. El nivel
califica al **rasgo**, no al taxón: que la preferencia ribereña de *Ceratosaurus* esté
discutida no significa que el animal lo esté.

Los cuatro clados no son un triángulo arbitrario, son una red trófica: los terópodos
hacen daño extra a los ornitópodos, los tireóforos devuelven daño con las púas caudales,
y la Defensa de cada carta sale de su morfología antipredatoria real.

Ver **[SET_DE_CARTAS.md](SET_DE_CARTAS.md)** para las 23 cartas con su referencia.

## Correrlo en local

Sin dependencias, sin build step. Basta servir el directorio:

```bash
python -m http.server 8000
```

y abrir <http://localhost:8000>.

```bash
npm test        # 37 tests del motor de reglas
npm run sim     # 2.000 partidas IA vs IA → BALANCE.md
node sim/set.js # regenera SET_DE_CARTAS.md desde el código
```

Parámetros de URL: `?debug=1` (overlay de estado), `?seed=N` (partida reproducible),
`?ia=aleatoria` (rival más blando).

## Cómo está hecho

HTML, CSS y JavaScript vanilla con módulos ES. Sin frameworks, sin dependencias, sin
CDNs. El arte son siluetas SVG generadas por código y el audio está sintetizado: no hay
un solo binario en el repositorio.

```
src/data/      cartas y números de balance — ninguna constante suelta fuera de aquí
src/engine/    motor de reglas: (estado, acción) → estado. Puro, sin DOM, corre en Node
src/ui/        interfaz: sólo lee el estado, nunca lo muta
sim/           simulador de balance y generador del set
test/          37 tests
v1/            versión anterior, jugable y congelada (ver v1/LEEME.md)
```

La frontera motor/interfaz no es una intención, es un test: `test/pureza.test.js` falla
si `src/engine/`, `src/data/` o `sim/` mencionan el DOM, si `reduce()` muta su argumento
o si la misma semilla deja de dar la misma partida. La IA recibe siempre una vista
redactada del estado, así que no puede ver tu mano ni tu despliegue oculto.

## Balance

Los números no se ajustan a ojo: se miden. `BALANCE.md` se regenera con cada cambio
sobre 2.000 partidas y declara qué objetivos cumple y cuáles no.

El rediseño de la v2 salió de una medición concreta: en la v1, **quien iba por delante en
el turno 6 ganaba el 87,6 % de las partidas**, porque la renta dependía de ir ganando y la
ventaja se realimentaba sola. Ahora la Biomasa sube por turno igual para los dos y esa
cifra baja al **61,6 %**. La partida se juega hasta el final.

---

Documentos de diseño: [PLAN_V2.md](PLAN_V2.md) (la versión actual),
[PLAN.md](PLAN.md) y [GAME_SPEC.md](GAME_SPEC.md) (la v1, por qué se rehizo).
