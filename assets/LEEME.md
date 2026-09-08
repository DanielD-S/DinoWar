# Ilustraciones

`assets/dinos/` guarda las ilustraciones de las cartas en JPEG, con un
`indice.json` que dice cuáles hay y, si hace falta, por dónde recortarlas.

Las ilustraciones sí viajan en el repositorio, por decisión del autor del
proyecto. Los originales sin reducir (`src/dinos/`) no: no hacen falta para
jugar y sólo sirven para regenerar esta carpeta.

## Qué tamaño hace falta

La ventana más grande del juego es la carta a tamaño de lectura: **268×168 css**,
que en un móvil a DPR 3 son **804×504 píxeles reales**. Todo lo demás es más
pequeño:

| Dónde | css | píxeles a DPR 3 | proporción |
|---|---|---|---|
| Carta a tamaño de lectura (visor) | 268×168 | **804×504** | 1,60 |
| Rejilla de la colección | 129×96 | 386×288 | 1,34 |
| Carta en la mano | 82×52 | 246×156 | 1,58 |
| Carta en la ranura | 76×52 | 228×156 | 1,46 |
| Miniatura de la ficha | 74×74 | 222×222 | **1,00** |
| Héroe del menú | 430×652 | 1290×1957 | 0,66 (vertical) |

De ahí salen dos reglas:

1. **900×600 px, JPEG de calidad 82** (unos 90–120 KB). Cubre el visor con
   margen y sirve para todas las demás ventanas. `tools/imagenes.py` ya reduce a
   eso. Con los 460 px de antes, el visor ampliaba la imagen casi al doble y se
   veía blanda.
2. **El animal tiene que caber en el cuadrado central.** Las ventanas van de
   proporción 1,00 (la miniatura de la ficha) a 1,60 (el visor), y `object-fit:
   cover` recorta lo que sobra por los lados o por arriba y abajo. Lo que esté
   fuera del 67 % central del ancho no se ve en la miniatura.

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
