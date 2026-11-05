// Utilidades do blog: escape de HTML, slug, datas e um markdown enxuto e seguro.

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const pad2 = (n) => String(n).padStart(2, '0');

function slugify(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'artigo';
}

// Brasília não tem horário de verão desde 2019: UTC-3 fixo.
const TZ_OFFSET_H = -3;

function dataBR(d) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' });
}

function dataCurtaBR(d) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
}

// Segunda a sexta da semana de publicação, às 12h de Brasília.
// Rodando numa segunda, a semana é a atual; em outro dia, a próxima.
function semanaDePublicacao(agora = new Date(), hora = 12) {
  const local = new Date(agora.getTime() + TZ_OFFSET_H * 3600e3); // relógio de Brasília em campos UTC
  const dia = local.getUTCDay(); // 0 dom … 6 sáb
  const ate = dia === 1 ? 0 : ((8 - dia) % 7) || 7;
  const segunda = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + ate, hora - TZ_OFFSET_H);
  return [0, 1, 2, 3, 4].map((i) => new Date(segunda + i * 86400e3));
}

// Semana ISO (ex.: 2026-W46), usada para identificar o lote de pautas.
function semanaISO(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dia = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dia);
  const ano = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const sem = Math.ceil(((t - ano) / 86400e3 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad2(sem)}`;
}

// Markdown seguro: títulos, parágrafos, listas, citação, negrito, itálico e
// links. Todo HTML que vier no texto é escapado.
function markdown(md) {
  const linhas = String(md || '').replace(/\r\n?/g, '\n').split('\n');
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>');
  const out = [];
  let lista = null;
  let par = [];
  const fechaPar = () => { if (par.length) { out.push(`<p>${inline(par.join(' '))}</p>`); par = []; } };
  const fechaLista = () => { if (lista) { out.push(`</${lista}>`); lista = null; } };
  for (const bruta of linhas) {
    const l = bruta.trim();
    let m;
    if (!l) { fechaPar(); fechaLista(); continue; }
    if (/^([-*_])(\s*\1){2,}$/.test(l)) { fechaPar(); fechaLista(); out.push('<hr />'); continue; }
    if ((m = l.match(/^(#{2,4})\s+(.*)$/))) { fechaPar(); fechaLista(); const n = Math.min(m[1].length, 3); out.push(`<h${n}>${inline(m[2])}</h${n}>`); continue; }
    if ((m = l.match(/^#\s+(.*)$/))) { fechaPar(); fechaLista(); out.push(`<h2>${inline(m[1])}</h2>`); continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { fechaPar(); fechaLista(); out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`); continue; }
    if ((m = l.match(/^[-*]\s+(.*)$/)) || (m = l.match(/^\d+[.)]\s+(.*)$/))) {
      fechaPar();
      const tipo = /^\d/.test(l) ? 'ol' : 'ul';
      if (lista !== tipo) { fechaLista(); out.push(`<${tipo}>`); lista = tipo; }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    fechaLista();
    par.push(l);
  }
  fechaPar();
  fechaLista();
  return out.join('\n');
}

const textoPuro = (md) => String(md || '').replace(/[#>*_`[\]()-]/g, ' ').replace(/\s+/g, ' ').trim();

module.exports = { esc, pad2, slugify, dataBR, dataCurtaBR, semanaDePublicacao, semanaISO, markdown, textoPuro };
