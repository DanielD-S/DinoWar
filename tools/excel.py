"""Puente entre RECOSTE.md y una hoja de cálculo, para revisar el set a mano.

    python tools/excel.py escribir   → RECOSTE.md  →  RECOSTE.xlsx
    python tools/excel.py leer       → RECOSTE.xlsx →  RECOSTE.md

La tabla vive en RECOSTE.md, que es lo que sabe aplicar `node tools/tabla.mjs`.
Esto sólo la saca a Excel para editarla por celdas y la devuelve. El id es la
llave: no se toca ni se reordenan las filas.
"""
import re
import sys
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

RAIZ = Path(__file__).resolve().parent.parent
MD = RAIZ / 'RECOSTE.md'
XLSX = RAIZ / 'RECOSTE.xlsx'

CABECERA = ['id', 'Carta', 'Familia', 'Rareza', 'Coste actual', 'Coste nuevo',
            'Δ', 'A', 'D', 'V', 'Rasgo', 'Texto del rasgo']
EDITABLES = {'Rareza', 'Coste nuevo', 'A', 'D', 'V', 'Rasgo', 'Texto del rasgo'}
RAREZAS = ('Común', 'Rara', 'Épica', 'Legendaria')
ANCHOS = {'id': 20, 'Carta': 30, 'Familia': 16, 'Rareza': 11, 'Coste actual': 13,
          'Coste nuevo': 13, 'Δ': 5, 'A': 5, 'D': 5, 'V': 5, 'Rasgo': 24,
          'Texto del rasgo': 78}

FUENTE = 'Arial'
TINTA = Font(name=FUENTE, size=10)
NEGRITA = Font(name=FUENTE, size=10, bold=True)
FIJO = Font(name=FUENTE, size=10, color='6B6B6B')
TITULO = Font(name=FUENTE, size=13, bold=True)
AMARILLO = PatternFill('solid', fgColor='FFF3C4')
GRIS = PatternFill('solid', fgColor='EFEFEF')
OSCURO = PatternFill('solid', fgColor='3A3A3A')
RAYA = Side(style='thin', color='D0D0D0')
MARCO = Border(left=RAYA, right=RAYA, top=RAYA, bottom=RAYA)

PRIMERA = 6  # fila 5 es la cabecera; los datos empiezan debajo


def trocear(linea):
    """Las celdas de una fila markdown, sin los vacíos de los extremos.

    La barra escapada (\\|) vive dentro de una celda y no la parte.
    """
    return [c.strip() for c in re.split(r'(?<!\\)\|', linea)[1:-1]]


def leer_md():
    """(prosa anterior a la tabla, filas de la tabla)."""
    lineas = MD.read_text(encoding='utf8').split('\n')
    corte = next(i for i, l in enumerate(lineas) if l.startswith('| id |'))
    prosa = '\n'.join(lineas[:corte])
    filas = [trocear(l) for l in lineas[corte + 2:] if l.startswith('|')]
    return prosa, [f for f in filas if len(f) >= 11]


def escribir():
    prosa, filas = leer_md()
    wb = Workbook()
    hoja = wb.active
    hoja.title = 'Cartas'

    hoja['A1'] = 'DinoWar — recoste del set'
    hoja['A1'].font = TITULO
    hoja['A2'] = ('Edita las columnas amarillas: Rareza, Coste nuevo, A, D, V, Rasgo y '
                  'Texto del rasgo. La rareza se elige del desplegable; los costes son '
                  'enteros de 0 a 8 (ej. 2) y A, D y V van de 0 a 20 (ej. 6). Las columnas '
                  'grises son de referencia y se ignoran al aplicar.')
    hoja['A3'] = ('No cambies el id, no borres ni añadas filas y no reordenes: el id es la '
                  'llave con la que cada fila vuelve a su carta. Los eventos, climas y '
                  'recursos no tienen A/D/V y se quedan en blanco. Cambiar la rareza mueve '
                  'las copias que caben en un mazo, lo que sale en los sobres y la fusión.')
    for f in ('A2', 'A3'):
        hoja[f].font = TINTA
        hoja[f].alignment = Alignment(wrap_text=True, vertical='top')
        hoja.merge_cells(f'{f}:L{f[1:]}')
        hoja.row_dimensions[int(f[1:])].height = 30

    for col, nombre in enumerate(CABECERA, start=1):
        c = hoja.cell(row=5, column=col, value=nombre)
        c.font = Font(name=FUENTE, size=10, bold=True, color='FFFFFF')
        c.fill = OSCURO
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = MARCO
        hoja.column_dimensions[get_column_letter(col)].width = ANCHOS[nombre]
    hoja.row_dimensions[5].height = 26

    for i, fila in enumerate(filas):
        r = PRIMERA + i
        # La fila markdown no trae la Δ: se calcula en la hoja.
        valores = fila[:6] + [None] + fila[6:11]
        for col, (nombre, valor) in enumerate(zip(CABECERA, valores), start=1):
            c = hoja.cell(row=r, column=col)
            if nombre == 'Δ':
                c.value = f'=IF(F{r}="","",F{r}-E{r})'
            elif nombre in ('Coste actual', 'Coste nuevo', 'A', 'D', 'V'):
                c.value = int(valor) if valor not in (None, '') else None
            else:
                c.value = (valor or '').replace('\\|', '|')

            editable = nombre in EDITABLES
            # Un evento o un clima no tiene estadísticas: su celda no se edita.
            hueco = nombre in ('A', 'D', 'V') and c.value is None
            c.font = TINTA if editable and not hueco else FIJO
            c.fill = AMARILLO if editable and not hueco else GRIS
            c.border = MARCO
            # Los textos van con formato de texto explícito: un rasgo que empieza
            # por «+1 Ataque…» o por «-2 Poder…» lo lee Excel como una fórmula
            # rota y se niega a aceptarlo.
            if nombre in ('Rasgo', 'Texto del rasgo', 'id', 'Carta', 'Familia'):
                c.number_format = '@'
            if nombre == 'Texto del rasgo':
                c.alignment = Alignment(wrap_text=True, vertical='top')
            elif nombre in ('Coste actual', 'Coste nuevo', 'Δ', 'A', 'D', 'V'):
                c.alignment = Alignment(horizontal='center')
            else:
                c.alignment = Alignment(vertical='top')
        hoja.row_dimensions[r].height = 30

    ultima = PRIMERA + len(filas) - 1
    hoja['G5'].comment = Comment(
        'Cuánto sube o baja el coste respecto al actual. Se calcula sola.', 'DinoWar')

    costes = DataValidation(type='whole', operator='between', formula1=0, formula2=8,
                            allow_blank=True, showErrorMessage=True,
                            errorTitle='Coste fuera de rango',
                            error='El coste es un número entero de 0 a 8.')
    stats = DataValidation(type='whole', operator='between', formula1=0, formula2=20,
                           allow_blank=True, showErrorMessage=True,
                           errorTitle='Estadística fuera de rango',
                           error='Ataque, Defensa y Vida van de 0 a 20.')
    rarezas = DataValidation(type='list', formula1=f'"{",".join(RAREZAS)}"',
                             allow_blank=False, showErrorMessage=True,
                             errorTitle='Rareza no válida',
                             error='Elige una de: ' + ', '.join(RAREZAS))
    hoja.add_data_validation(costes)
    hoja.add_data_validation(stats)
    hoja.add_data_validation(rarezas)
    costes.add(f'F{PRIMERA}:F{ultima}')
    stats.add(f'H{PRIMERA}:J{ultima}')
    rarezas.add(f'D{PRIMERA}:D{ultima}')

    hoja.freeze_panes = 'B6'
    hoja.auto_filter.ref = f'A5:L{ultima}'
    # Sin bloqueo de hoja: protegía el id, pero obligaba a ir a Revisar →
    # Desproteger para tocar cualquier otra celda y Excel avisaba de una
    # contraseña que no existía. El color ya dice qué se edita y qué no.

    notas = wb.create_sheet('Notas')
    notas.column_dimensions['A'].width = 110
    notas['A1'] = 'Por qué se recostea, y qué mide la propuesta'
    notas['A1'].font = TITULO
    for i, linea in enumerate(prosa.split('\n'), start=3):
        c = notas.cell(row=i, column=1, value=linea)
        c.font = NEGRITA if linea.startswith('#') else TINTA
        c.alignment = Alignment(wrap_text=True, vertical='top')

    wb.save(XLSX)
    print(f'RECOSTE.xlsx escrito: {len(filas)} cartas')


def leer():
    prosa, previas = leer_md()
    wb = load_workbook(XLSX)
    hoja = wb['Cartas']
    indice = {c.value: i for i, c in enumerate(hoja[5]) if c.value in CABECERA}
    faltan = [n for n in CABECERA if n not in indice]
    if faltan:
        raise SystemExit(f'a la hoja le faltan columnas: {", ".join(faltan)}')

    orden = [f[0] for f in previas]
    porid = {}
    for fila in hoja.iter_rows(min_row=PRIMERA, values_only=True):
        cid = fila[indice['id']]
        if not cid:
            continue
        porid[str(cid).strip()] = fila

    perdidas = [i for i in orden if i not in porid]
    if perdidas:
        raise SystemExit(f'faltan filas en la hoja: {", ".join(perdidas)}')

    lineas = []
    for previa in previas:
        fila = porid[previa[0]]
        def celda(n, fila=fila):
            v = fila[indice[n]]
            return '' if v is None else str(v).strip()
        # id, nombre, familia y coste actual son de referencia y vienen del
        # markdown; el resto sale de la hoja, que es lo que se ha editado.
        campos = [previa[0], previa[1], previa[2], celda('Rareza') or previa[3], previa[4],
                  celda('Coste nuevo'), celda('A'), celda('D'), celda('V'),
                  celda('Rasgo'), celda('Texto del rasgo').replace('|', '\\|')]
        lineas.append('| ' + ' | '.join(campos) + ' |')

    tabla = ('| ' + ' | '.join(n for n in CABECERA if n != 'Δ') + ' |\n'
             + '|' + '---|' * (len(CABECERA) - 1) + '\n')
    MD.write_text(prosa + '\n' + tabla + '\n'.join(lineas) + '\n', encoding='utf8')
    print(f'RECOSTE.md actualizado desde el Excel: {len(lineas)} cartas')


if __name__ == '__main__':
    orden = sys.argv[1] if len(sys.argv) > 1 else ''
    if orden == 'escribir':
        escribir()
    elif orden == 'leer':
        leer()
    else:
        print('uso: python tools/excel.py escribir|leer')
