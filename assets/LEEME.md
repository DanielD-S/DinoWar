# Ilustraciones

`assets/dinos/` contiene las ilustraciones de los nueve taxones, en JPEG de 460 px.

**Esa carpeta no está en el repositorio.** Las imágenes de referencia que hay ahora
son paleoarte de terceros —al menos una lleva la firma del ilustrador visible— y
publicarlas en GitHub Pages sería redistribuirlas sin licencia. Sirven como
marcador de posición en local y nada más.

El juego no depende de ellas: `src/ui/art.js` comprueba una vez si están servidas
y, si no lo están, dibuja las siluetas SVG generadas por código. Quien clone el
repositorio ve el juego completo, sin huecos.

Para que la versión publicada lleve ilustración hace falta arte con licencia:
obra propia, dominio público, o Creative Commons con la atribución puesta en la
ficha de cada carta.

## Regenerar la carpeta desde originales

Coloca los originales en `src/dinos/` con el binomio por nombre
(`Allosaurus fragilis.jpg`) y reduce cada uno a 460 px de lado mayor, JPEG de
calidad 80, guardándolo como `assets/dinos/<id>.jpg` con el `id` de la carta.
