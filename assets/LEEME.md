# Ilustraciones

`assets/dinos/` guarda las ilustraciones de las cartas en JPEG de 460 px de lado
mayor, con un `indice.json` que dice cuáles hay.

**Esa carpeta no está en el repositorio.** Las imágenes de referencia que hay
ahora son paleoarte de terceros y publicarlas en GitHub Pages sería
redistribuirlas sin licencia. Sirven de marcador de posición en local.

El juego no depende de ellas. `src/ui/art.js` pide `indice.json` una vez al
arrancar: si no está —y en el sitio publicado no lo está— falla esa única
petición y todo se dibuja con las siluetas SVG generadas por código. Si el
índice menciona una imagen que no existe, esa carta vuelve sola a su silueta.
Quien clone el repositorio ve el juego entero, sin huecos.

Para que la versión publicada lleve ilustración hace falta arte con licencia:
obra propia, dominio público, o Creative Commons con la atribución puesta en la
ficha de cada carta.

## Añadir o cambiar ilustraciones

Deja los originales en `src/dinos/` y ejecuta:

    python tools/imagenes.py

Acepta cualquier formato que sepa abrir Pillow y da igual el tamaño: la
herramienta reduce, recorta el peso y escribe `assets/dinos/<id>.jpg` más el
índice. El fichero puede llamarse por el binomio (`Allosaurus fragilis.jpg`) o
por el id de la carta (`allosaurus.png`); lo que no reconozca lo dice y sigue.

Vale para cualquier carta, no sólo para los dinosaurios: si algún día hay arte
de un clima o de un evento, se deja ahí con el id de la carta y aparece.
