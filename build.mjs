/**
 * Build script — minifica CSS e JS para a pasta dist/
 * Executado pelo GitHub Actions antes do deploy no Pages.
 */
import { transform } from 'lightningcss';
import { minify }    from 'terser';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';

mkdirSync('dist', { recursive: true });

/* ── HTML — strip comentários + image-slot.js (dev-only) ── */
const HTML_FILES = [
  'index.html',
  'rua-lambari.html',
  'praia-da-lagoa.html',
  'rua-lambari-celia.html',
  'rua-lambari-andreia.html',
  'rua-lambari-carla.html',
  'vila-do-sol.html',
  'costa-verde.html',
  'ipanema-do-norte.html',
  'mares.html',
  'aldeia.html',
  'atoba.html',
  'manguezal.html',
];
for (const file of HTML_FILES) {
  const htmlIn  = readFileSync(file, 'utf8');
  const htmlOut = htmlIn
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script src="image-slot\.js"[^>]*><\/script>/g, '')
    .replace(/\n{3,}/g, '\n\n');
  writeFileSync(`dist/${file}`, htmlOut);
  console.log(`✓ ${file.padEnd(28)} ${kb(Buffer.byteLength(htmlIn))} → ${kb(Buffer.byteLength(htmlOut))}`);
}

/* ── Service Worker — copia sem alterar (arquivo pequeno) ── */
copyFileSync('sw.js', 'dist/sw.js');
console.log('✓ sw.js copiado');

/* ── Sitemap — copia sem alterar ── */
copyFileSync('sitemap.xml', 'dist/sitemap.xml');
console.log('✓ sitemap.xml copiado');

/* ── CSS — minifica com lightningcss ── */
const cssIn  = readFileSync('zayda-styles.css');
const { code: cssOut } = transform({
  filename: 'zayda-styles.css',
  code: cssIn,
  minify: true,
  targets: { chrome: 95, firefox: 95, safari: 15 },
});
writeFileSync('dist/zayda-styles.css', cssOut);
console.log(`✓ zayda-styles.css  ${kb(cssIn.length)} → ${kb(cssOut.length)}`);

/* ── JS — minifica com terser (image-slot.js excluído: dev-only) ── */
for (const file of ['zayda-app.js']) {
  const src = readFileSync(file, 'utf8');
  const { code: out } = await minify(src, {
    compress: { drop_console: false, passes: 2 },
    mangle: true,
    format: { comments: false },
  });
  writeFileSync(`dist/${file}`, out);
  console.log(`✓ ${file.padEnd(18)} ${kb(src.length)} → ${kb(out.length)}`);
}

function kb(bytes) { return (bytes / 1024).toFixed(1).padStart(6) + ' KB'; }
console.log('\nBuild concluído → dist/');
