/**
 * Sincroniza _nav.html em todas as páginas não-home.
 *
 * Execute após editar _nav.html:
 *   node nav-sync.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const nav = readFileSync('_nav.html', 'utf8');

const FILES = [
  'rua-lambari.html','praia-da-lagoa.html','rua-lambari-celia.html',
  'rua-lambari-andreia.html','rua-lambari-carla.html','vila-do-sol.html',
  'costa-verde.html','ipanema-do-norte.html','rua-corvina.html','mares.html','aldeia.html',
  'atoba.html','manguezal.html','empreendimentos.html','blog.html',
  'expertise.html','carreira.html','atendimento.html',
  'artigo-materiais.html','artigo-bem-estar.html','artigo-concreto.html',
  'artigo-impermeabilizacao.html','artigo-luz.html','artigo-cozinha.html',
  'artigo-metros.html','artigo-longevidade.html','artigo-giverny.html',
  'artigo-litoral-norte.html','artigo-reflorestamento.html',
  'artigo-autoria-colonial.html',
];

// Regex: captura o bloco nav completo — inclui prefetch e scripts opcionais antes do
// primeiro elemento, garantindo que re-runs não duplicam o script inline. Aceita tanto a
// ordem antiga (header primeiro, veil por último) quanto a atual (veil primeiro, cobrindo
// a tela antes do <header> ser parseado — evita flash de nav sem estilo).
const NAV_RE = /(?:(?:<link rel="prefetch" href="index\.html">|<script>[^<]*<\/script>|<!--[\s\S]*?-->)\n)*(?:<header class="nav" id="nav">[\s\S]*?<span class="veil-mark serif">Z<\/span>\n<\/div>|<div class="transition-veil" id="veil">[\s\S]*?<span>© 2026<\/span>\n  <\/div>\n<\/div>)/;

let changed = 0;
for (const file of FILES) {
  const src = readFileSync(file, 'utf8');
  if (!NAV_RE.test(src)) {
    console.log(`SKIP (nav não encontrado): ${file}`);
    continue;
  }
  writeFileSync(file, src.replace(NAV_RE, nav.replace(/\n$/, '')), 'utf8');
  changed++;
  console.log(`✓ ${file}`);
}
console.log(`\n${changed} arquivos atualizados.`);
