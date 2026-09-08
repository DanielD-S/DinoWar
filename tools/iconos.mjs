// Genera los iconos de la PWA rasterizando la silueta que el juego ya dibuja
// por código, para que el icono y las cartas sean el mismo dibujo. Se corre a
// mano cuando cambie la silueta o el color:
//
//   node tools/iconos.mjs
//
// Necesita Chromium (Playwright). Los PNG resultantes se commitean.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const art = readFileSync(new URL('../src/ui/art.js', import.meta.url), 'utf8');
const silueta = art.match(/teropodo: `([\s\S]*?)`,/)[1].trim();

const FONDO = '#14110d';
const TINTA = '#d0a53a';

/**
 * @param {number} lado px del icono
 * @param {number} margen fracción del lado que queda libre alrededor. Los
 *   iconos «maskable» se recortan en círculo en Android, así que llevan más.
 * @param {boolean} redondo esquinas redondeadas (icono normal) o lienzo entero
 */
function pagina(lado, margen, redondo) {
  const r = redondo ? Math.round(lado * 0.22) : 0;
  const caja = lado * (1 - 2 * margen);
  return `<!doctype html><meta charset="utf-8">
    <style>
      html, body { margin: 0; width: ${lado}px; height: ${lado}px; }
      .fondo { width: ${lado}px; height: ${lado}px; background: ${FONDO}; border-radius: ${r}px;
               display: flex; align-items: center; justify-content: center; }
      svg { width: ${caja}px; height: ${caja * 0.7}px; }
    </style>
    <div class="fondo">
      <svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
        <g fill="${TINTA}">${silueta}</g>
      </svg>
    </div>`;
}

const iconos = [
  { fichero: 'assets/icono-192.png', lado: 192, margen: 0.10, redondo: true },
  { fichero: 'assets/icono-512.png', lado: 512, margen: 0.10, redondo: true },
  { fichero: 'assets/icono-maskable-512.png', lado: 512, margen: 0.22, redondo: false },
];

const navegador = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
);
const pestana = await navegador.newPage();
for (const { fichero, lado, margen, redondo } of iconos) {
  await pestana.setViewportSize({ width: lado, height: lado });
  await pestana.setContent(pagina(lado, margen, redondo));
  const png = await pestana.screenshot({ omitBackground: false });
  writeFileSync(new URL(`../${fichero}`, import.meta.url), png);
  console.log(`${fichero} · ${lado}×${lado}`);
}
await navegador.close();
