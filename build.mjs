/**
 * Build script — minifica CSS e JS para a pasta dist/
 * Executado pelo GitHub Actions antes do deploy no Pages.
 */
import { transform } from 'lightningcss';
import { minify }    from 'terser';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { PurgeCSS }  from 'purgecss';

const SITE = 'https://zaydaconstrutora.com.br';

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
  'rua-corvina.html',
  'mares.html',
  'aldeia.html',
  'atoba.html',
  'manguezal.html',
  'empreendimentos.html',
  'blog.html',
  'expertise.html',
  'carreira.html',
  'atendimento.html',
  'artigo-materiais.html',
  'artigo-bem-estar.html',
  'artigo-concreto.html',
  'artigo-impermeabilizacao.html',
  'artigo-luz.html',
  'artigo-cozinha.html',
  'artigo-metros.html',
  'artigo-longevidade.html',
  'artigo-giverny.html',
  'artigo-litoral-norte.html',
  'artigo-reflorestamento.html',
  'artigo-autoria-colonial.html',
];
/* ── Pretty URLs — slugs conhecidos (todas as páginas exceto a home) ── */
const KNOWN_SLUGS = new Set(HTML_FILES.map(f => f.replace(/\.html$/, '')).filter(s => s !== 'index'));

/* Reescreve links internos, URLs absolutas (canonical/og/JSON-LD) e caminhos de assets
   para o esquema de "pretty URLs" (ex: empreendimentos.html → /empreendimentos/). */
function toCleanUrls(html) {
  return html
    // <a>/<link> internos relativos: href="index.html" → "/", href="slug.html" → "/slug/"
    .replace(/href="index\.html"/g, 'href="/"')
    .replace(/href="([a-z0-9-]+)\.html"/g, (m, slug) => KNOWN_SLUGS.has(slug) ? `href="/${slug}/"` : m)
    // URLs absolutas (canonical, og:url, JSON-LD) — corrige domínio e remove .html
    .replace(/https:\/\/zaydaconstrutora\.com(?:\.br)?(\/(?:([a-z0-9-]+)\.html)?)?/g, (m, pathPart, slug) => {
      if (!pathPart) return SITE;
      if (!slug) return `${SITE}/`;
      return `${SITE}/${slug}/`;
    })
    // assets — precisam ser absolutos porque as páginas passam a viver em subpastas
    .replace(/href="zayda-styles\.css"/g, 'href="/zayda-styles.css"')
    .replace(/href="zayda-app\.js"/g, 'href="/zayda-app.js"')
    .replace(/src="zayda-app\.js"/g, 'src="/zayda-app.js"')
    .replace(/href="favicon\.svg"/g, 'href="/favicon.svg"')
    .replace(/href="favicon-32x32\.png"/g, 'href="/favicon-32x32.png"')
    .replace(/href="favicon-16x16\.png"/g, 'href="/favicon-16x16.png"')
    .replace(/href="apple-touch-icon\.png"/g, 'href="/apple-touch-icon.png"')
    .replace(/href="favicon\.ico"/g, 'href="/favicon.ico"');
}

/* Stub de redirecionamento para a URL antiga (.html) — GitHub Pages não tem
   redirect 301 real, então usamos meta-refresh + canonical, o padrão aceito
   pelo Google como equivalente a um redirect permanente. */
function redirectStub(slug) {
  const target = `/${slug}/`;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Redirecionando…</title>
<link rel="canonical" href="${SITE}${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<meta name="robots" content="noindex">
</head>
<body>
<p>Esta página mudou de endereço. Se você não foi redirecionado automaticamente, <a href="${target}">clique aqui</a>.</p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}

/* URLs antigas de páginas renomeadas — preserva o link/SEO acumulado
   redirecionando pro slug atual. Adicione um par aqui ao renomear uma página. */
const LEGACY_SLUGS = { sobre: 'expertise' };

for (const file of HTML_FILES) {
  const slug = file.replace(/\.html$/, '');
  const htmlIn  = readFileSync(file, 'utf8');
  const htmlOut = toCleanUrls(
    htmlIn
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script src="image-slot\.js"[^>]*><\/script>/g, '')
      .replace(/\n{3,}/g, '\n\n')
  );

  if (slug === 'index') {
    writeFileSync('dist/index.html', htmlOut);
  } else {
    mkdirSync(`dist/${slug}`, { recursive: true });
    writeFileSync(`dist/${slug}/index.html`, htmlOut);
    writeFileSync(`dist/${file}`, redirectStub(slug)); // preserva a URL antiga indexada
  }
  console.log(`✓ ${file.padEnd(28)} ${kb(Buffer.byteLength(htmlIn))} → ${kb(Buffer.byteLength(htmlOut))}`);
}

/* ── URLs antigas (LEGACY_SLUGS) — redireciona /sobre/ e /sobre.html pro slug novo ── */
for (const [oldSlug, newSlug] of Object.entries(LEGACY_SLUGS)) {
  mkdirSync(`dist/${oldSlug}`, { recursive: true });
  writeFileSync(`dist/${oldSlug}/index.html`, redirectStub(newSlug));
  writeFileSync(`dist/${oldSlug}.html`, redirectStub(newSlug));
  console.log(`✓ redirect legado: /${oldSlug}/ → /${newSlug}/`);
}

/* ── Service Worker — injeta versão com timestamp para invalidar cache a cada build ── */
const swVersion = `zayda-${Date.now()}`;
const swOut = readFileSync('sw.js', 'utf8').replace("'zayda-v1'", `'${swVersion}'`);
writeFileSync('dist/sw.js', swOut);
console.log(`✓ sw.js          → cache versão: ${swVersion}`);

/* ── Sitemap — copia sem alterar ── */
copyFileSync('sitemap.xml', 'dist/sitemap.xml');
console.log('✓ sitemap.xml copiado');

/* ── robots.txt — copia sem alterar ── */
copyFileSync('robots.txt', 'dist/robots.txt');
console.log('✓ robots.txt copiado');

/* ── CNAME — necessário em dist/ para o GitHub Pages servir o domínio customizado ── */
copyFileSync('CNAME', 'dist/CNAME');
console.log('✓ CNAME copiado');

/* ── Favicon — copia sem alterar (SVG usa a mesma pilha de fontes do véu de transição) ── */
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png']) {
  copyFileSync(f, `dist/${f}`);
}
console.log('✓ favicon copiado');

/* ── .nojekyll — impede o GitHub Pages de rodar o processamento Jekyll,
   que ignora arquivos/pastas com "_" no nome (ex.: _nav.html) ── */
writeFileSync('dist/.nojekyll', '');
console.log('✓ .nojekyll criado');

/* ── CSS — remove seletores não usados, depois minifica ── */
const cssIn  = readFileSync('zayda-styles.css', 'utf8');
const [purgeResult] = await new PurgeCSS().purge({
  content: [
    ...HTML_FILES.map(f => ({ raw: readFileSync(f, 'utf8'), extension: 'html' })),
    { raw: readFileSync('zayda-app.js', 'utf8'), extension: 'js' },
  ],
  css: [{ raw: cssIn }],
  /* Preserva classes de estado adicionadas via JS que o extractor poderia perder */
  safelist: {
    standard: [
      'active', 'open', 'show', 'visible', 'in', 'exit', 'hover',
      'selected', 'invalid', 'no-reveal', 'skip-intro', 'entering', 'hero-animate', 'nav--scrolled', 'nav--hidden',
      'gvny-expanded', 'img-awaiting-cloud', 'lazy-video', 'poi-tog', 'playing',
    ],
    /* Preserva todos os seletores do Leaflet (carregado dinâmicamente) */
    greedy: [/^leaflet-/],
  },
  /* Preserva seletores com pseudo-classes e atributos dinâmicos */
  variables: true,
});
const cssPurged = Buffer.from(purgeResult.css);
const { code: cssOut } = transform({
  filename: 'zayda-styles.css',
  code: cssPurged,
  minify: true,
  targets: { chrome: 95, firefox: 95, safari: 15 },
});
writeFileSync('dist/zayda-styles.css', cssOut);
const saved = cssIn.length - cssOut.length;
console.log(`✓ zayda-styles.css  ${kb(cssIn.length)} → ${kb(cssOut.length)}  (−${kb(saved)} removido)`);

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
