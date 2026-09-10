# Ilustraciones

Cómo pedirlas a un generador: [PROMPTS.md](PROMPTS.md).

`assets/dinos/` guarda las ilustraciones de las cartas en JPEG, con un
`indice.json` que dice cuáles hay y, si hace falta, por dónde recortarlas.

Las ilustraciones sí viajan en el repositorio, por decisión del autor del
proyecto. Los originales sin reducir (`src/dinos/`) no: no hacen falta para
jugar y sólo sirven para regenerar esta carpeta.

## Qué tamaño hace falta

La ventana más grande del juego es la ilustración de la ficha, que ocupa el
ancho del panel: **394×222 css** en un móvil de 430 px, que a DPR 3 son
**1182×665 píxeles reales**. Todo lo demás es más pequeño:

| Dónde | css | píxeles a DPR 3 | proporción |
|---|---|---|---|
| Ilustración de la ficha | 394×222 | **1182×665** | 1,78 |
| Carta a tamaño de lectura (visor) | 268×168 | 804×504 | 1,60 |
| Rejilla de la colección | 129×96 | 386×288 | **1,34** |
| Carta en la mano | 82×52 | 246×156 | 1,58 |
| Carta en la ranura | 76×52 | 228×156 | 1,46 |

De ahí salen dos reglas:

1. **1200×750 px, JPEG de calidad 80.** Cubre la ficha sin ampliar y sirve para
   todas las demás ventanas. `tools/imagenes.py` ya reduce a eso. Son unos 2 MB
   entre las quince, que el service worker cachea en tiempo muerto; si eso pesa
   demasiado, bajar `LADO` a 1000 deja la ficha con un 18 % de ampliación, que a
   esa densidad no se nota.
2. **Exporta todas con la misma proporción, 3:2 (1,5).** Es el punto medio entre
   la ventana más estrecha (1,34, la colección) y la más ancha (1,78, la ficha),
   así que ninguna recorta mucho. Las de ahora van de **0,97 a 1,93** y por eso
   unas se ven completas y otras cortadas: no es el recorte, es que cada
   original tiene una forma distinta.

Con `object-fit: cover`, una ventana más ancha que la imagen recorta por arriba
y por abajo, y una más estrecha recorta por los lados. Con 3:2 de origen lo
peor que pasa es perder un 11 % de alto en la ficha o un 11 % de ancho en la
colección: el animal cabe siempre si no toca los bordes.

El héroe del menú es aparte: es vertical y grande. Si se quiere una imagen
propia en vez de reutilizar una carta, hace falta **1290×1960** como mínimo.

## Cuando una carta se ve descentrada

No hace falta volver a recortar el original: se le pone un punto focal en
`indice.json`.

```json
{
  "cartas": ["allosaurus", "dryosaurus"],
  "foco": { "allosaurus": "50% 35%", "ornitholestes": "60% 50%" }
}
```

El valor es un `object-position` de CSS: el primer número mueve el recorte a
izquierda/derecha y el segundo, arriba/abajo. `50% 35%` enseña la parte de
arriba de la imagen —útil cuando la cabeza queda cortada—; `60% 50%` la
desplaza a la derecha. Por defecto es `50% 50%`.

Regenerar las imágenes **no borra** los focos ya escritos.

## Añadir o cambiar ilustraciones

Deja los originales en `src/dinos/` y ejecuta:

    python tools/imagenes.py

Acepta cualquier formato que sepa abrir Pillow y da igual el tamaño: la
herramienta reduce, recorta el peso y escribe `assets/dinos/<id>.jpg` más el
índice. El fichero puede llamarse por el binomio (`Allosaurus fragilis.jpg`) o
por el id de la carta (`allosaurus.png`); lo que no reconozca lo dice y sigue.

Vale para cualquier carta, no sólo para los dinosaurios: si algún día hay arte
de un clima o de un evento, se deja ahí con el id de la carta y aparece.
