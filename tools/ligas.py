"""Los emblemas de las ligas: del PNG en magenta al WebP servido.

    python tools/ligas.py            # dice qué haría
    python tools/ligas.py escribir   # escribe los WebP en assets/piel/ligas/

Hermana de `tools/mazos.py`, con la misma función de keyeado de
`tools/marcos.py`: los cuatro medallones llegan sobre magenta `#FF00FF`.

Dos cosas que hace además:

- **Los deja cuadrados.** Se pintan en una caja redonda de lado fijo, y el de
  Jurásico llegó apaisado, 1536×1024. Se recorta al medallón y se centra en un
  lienzo cuadrado transparente: estirado a cuadrado sería un óvalo.
- **Acepta el nombre corto.** Llegaron como `triasico.png`, no como
  `liga_triasico.png`; los dos valen. Un original mal nombrado no falla, sólo
  no sale nunca, así que lo que no reconoce lo dice.

Se sirven a 256 px: el panel del Duelo los pinta a 44 y el final de partida a
unos 96, que a densidad 2x son 192. 256 deja margen y pesa pocos KB.
"""
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from marcos import keyear  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'src' / 'piel' / 'ligas'
DESTINO = RAIZ / 'assets' / 'piel' / 'ligas'
LADO = 256
LIGAS = ('triasico', 'jurasico', 'cretacico', 'extincion')


def cuadrado(im, margen_rel=0.01):
    """Recorta al dibujo y lo centra en un lienzo cuadrado transparente."""
    caja = im.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    if caja:
        im = im.crop(caja)
    lado = round(max(im.size) * (1 + 2 * margen_rel))
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(im, ((lado - im.size[0]) // 2, (lado - im.size[1]) // 2), im)
    return lienzo


def original_de(liga):
    for nombre in (f'liga_{liga}', liga):
        for ext in ('.png', '.PNG', '.webp', '.jpg'):
            p = ORIGEN / f'{nombre}{ext}'
            if p.exists():
                return p
    return None


def main(escribir):
    if not ORIGEN.is_dir():
        sys.exit(f'No existe {ORIGEN.relative_to(RAIZ)}. Deja ahí los originales.')
    usados = set()
    for liga in LIGAS:
        p = original_de(liga)
        if p is None:
            print(f'{liga}: no está en {ORIGEN.relative_to(RAIZ)}')
            continue
        usados.add(p.name)
        original = Image.open(p)
        listo = cuadrado(keyear(original))
        print(f'{p.name} {original.size[0]}×{original.size[1]} -> liga_{liga}.webp @{LADO} '
              f'({listo.size[0]}×{listo.size[1]} tras recortar y cuadrar)')
        if escribir:
            DESTINO.mkdir(parents=True, exist_ok=True)
            listo.resize((LADO, LADO), Image.LANCZOS).save(DESTINO / f'liga_{liga}.webp', 'WEBP', quality=88)
    for f in sorted(ORIGEN.iterdir()):
        if f.is_file() and f.name not in usados:
            print(f'  sin usar: {f.name} (no es el nombre de ninguna liga)')


if __name__ == '__main__':
    main('escribir' in sys.argv[1:])
