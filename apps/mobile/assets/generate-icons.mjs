// Rasterises the brand SVGs into the PNGs Expo needs. Run:
//   node assets/generate-icons.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));

function render(svgFile, outFile, width, bg) {
  const svg = readFileSync(join(here, svgFile), 'utf8');
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    background: bg,
  });
  writeFileSync(join(here, outFile), resvg.render().asPng());
  console.log(`${outFile} (${width}px)`);
}

// App icon (1024, opaque), adaptive foreground (transparent), favicon, splash.
render('icon.svg', 'icon.png', 1024, '#0B0F14');
render('icon.svg', 'adaptive-icon.png', 1024);
render('icon.svg', 'favicon.png', 96, '#0B0F14');
render('splash.svg', 'splash.png', 1284, '#0B0F14');
