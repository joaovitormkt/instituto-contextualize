// Páginas públicas do blog, renderizadas no servidor: lista (/blog),
// artigo (/blog/slug) e sitemap. HTML pronto para o Google e redes sociais.
const { esc, markdown, dataBR, dataCurtaBR } = require('./blog-util');

const NOME = 'Instituto Contextualize';

// Imagens da raiz têm espaços e acentos no nome: codifica para usar em URL.
const caminho = (u) => {
  const s = String(u || '');
  if (!s || /^https?:/.test(s)) return s;
  return `/${s.replace(/^\.?\//, '').split('/').map(encodeURIComponent).join('/')}`;
};
const absoluta = (site, u) => (/^https?:/.test(u) ? u : `${site}${caminho(u)}`);

const CSS = `
:root{--azul:#062d44;--azul-2:#001828;--ouro:#b5985e;--ouro-2:#8f7440;--fundo:#f9f9ff;--papel:#f0f3ff;--texto:#111c2c;--texto-2:#42474d;--mudo:#73787d;--linha:#dde3ee;--raio:22px}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--fundo);color:var(--texto);font:400 1rem/1.6 Manrope,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:Montserrat,system-ui,sans-serif;color:var(--azul);margin:0;text-wrap:balance}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{width:min(1180px,100% - 32px);margin-inline:auto}
.estreito{width:min(760px,100%);margin-inline:auto}
.topo{position:sticky;top:0;z-index:20;background:rgba(6,45,68,.96);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.topo__in{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:64px}
.topo__logo img{height:30px;width:auto}
.topo__links{display:flex;align-items:center;gap:20px}
.topo__link{color:rgba(255,255,255,.82);text-decoration:none;font:600 .75rem/1 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase}
.topo__link:hover{color:#fff}
@media (max-width:599px){.topo__link{display:none}}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 20px;border-radius:999px;background:var(--ouro);color:#fff;text-decoration:none;font:700 .75rem/1 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase;transition:background .2s}
.btn:hover{background:var(--ouro-2)}
.btn--azul{background:var(--azul)}
.btn--azul:hover{background:var(--azul-2)}
main{padding-block:clamp(40px,7vw,96px)}
.rotulo{display:inline-flex;align-items:center;gap:10px;margin:0;color:var(--ouro);font:700 .72rem/1.4 Montserrat,sans-serif;letter-spacing:.14em;text-transform:uppercase}
.rotulo::before{content:"";width:28px;height:1px;background:currentColor}
.cabeca{display:grid;gap:18px;justify-items:start;margin-bottom:clamp(32px,5vw,56px)}
.cabeca h1{font-size:clamp(2rem,1.3rem + 2.8vw,3.4rem);font-weight:700;letter-spacing:-.02em;line-height:1.08;max-width:20ch}
.cabeca h1 em{font-style:normal;color:var(--ouro)}
.cabeca p{margin:0;max-width:56ch;color:var(--texto-2);font-size:1.1rem}
.filtros{display:flex;flex-wrap:wrap;gap:8px;margin:-16px 0 40px;padding:0;list-style:none}
.filtros a{display:inline-block;padding:7px 14px;border-radius:999px;border:1px solid var(--linha);background:#fff;color:var(--texto-2);text-decoration:none;font:600 .78rem/1.2 Montserrat,sans-serif}
.filtros a[aria-current]{background:var(--azul);border-color:var(--azul);color:#fff}
@media (max-width:599px){.filtros{flex-wrap:nowrap;overflow-x:auto;margin-inline:-16px;padding-inline:16px;scrollbar-width:none}.filtros a{white-space:nowrap}}
.lista{list-style:none;margin:0;padding:0;display:grid;gap:28px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
.card a{display:flex;flex-direction:column;height:100%;background:#fff;border:1px solid var(--linha);border-radius:var(--raio);overflow:hidden;text-decoration:none;transition:border-color .25s,box-shadow .25s,transform .25s}
.card a:hover{border-color:rgba(181,152,94,.6);box-shadow:0 18px 40px -24px rgba(6,45,68,.35);transform:translateY(-2px)}
.card a:focus-visible{outline:2px solid var(--ouro);outline-offset:3px}
.card__foto{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--papel)}
.card__foto img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.card a:hover .card__foto img{transform:scale(1.04)}
.card__cat{position:absolute;top:14px;left:14px;padding:5px 12px;border-radius:999px;background:rgba(6,45,68,.88);color:#fff;font:700 .66rem/1.2 Montserrat,sans-serif;letter-spacing:.08em;text-transform:uppercase}
.card__corpo{display:flex;flex-direction:column;gap:10px;padding:22px 24px 24px;flex:1}
.card__meta{color:var(--mudo);font:500 .75rem/1.4 Montserrat,sans-serif}
.card__titulo{color:var(--azul);font:700 1.15rem/1.35 Montserrat,sans-serif}
.card__resumo{color:var(--texto-2);font-size:.92rem;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card__ler{margin-top:auto;padding-top:6px;color:var(--ouro);font:700 .74rem/1 Montserrat,sans-serif;letter-spacing:.06em;text-transform:uppercase}
.vazio{color:var(--mudo)}
.post-cabeca{display:grid;gap:18px;justify-items:start;margin-bottom:32px}
.post-cabeca h1{font-size:clamp(1.9rem,1.2rem + 2.6vw,3.1rem);font-weight:700;letter-spacing:-.02em;line-height:1.12}
.post-meta{margin:0;color:var(--mudo);font:500 .82rem/1.5 Montserrat,sans-serif}
.post-resumo{margin:0;color:var(--texto-2);font-size:1.15rem;line-height:1.6}
.post-capa{margin:0 0 40px;aspect-ratio:16/9;border-radius:var(--raio);overflow:hidden;background:var(--papel)}
.post-capa img{width:100%;height:100%;object-fit:cover}
.post-corpo{color:#334155;font-size:1.07rem;line-height:1.8}
.post-corpo>*{margin:0}
.post-corpo>*+*{margin-top:1.1em}
.post-corpo h2{font-size:clamp(1.4rem,1.1rem + 1vw,1.8rem);line-height:1.25;margin-top:1.9em}
.post-corpo h3{font-size:1.2rem;line-height:1.35;margin-top:1.6em}
.post-corpo a{color:var(--ouro-2);text-underline-offset:3px}
.post-corpo ul,.post-corpo ol{padding-left:1.3em}
.post-corpo li+li{margin-top:.45em}
.post-corpo li::marker{color:var(--ouro)}
.post-corpo strong{color:var(--azul);font-weight:700}
.post-corpo hr{border:0;border-top:1px solid var(--linha);margin-block:2em}
.post-corpo blockquote{margin-inline:0;padding:4px 0 4px 22px;border-left:3px solid var(--ouro);color:var(--azul);font-size:1.2rem;line-height:1.55}
.post-tags{display:flex;flex-wrap:wrap;gap:8px;margin:36px 0 0;padding:0;list-style:none}
.post-tags li{padding:5px 12px;border-radius:999px;background:var(--papel);color:var(--azul);font:600 .74rem/1.3 Montserrat,sans-serif}
.post-aviso{margin-top:40px;padding:18px 22px;border-radius:16px;background:#fff;border:1px solid var(--linha);color:var(--texto-2);font-size:.9rem;line-height:1.6}
.post-aviso strong{color:var(--azul)}
.post-fontes{margin-top:28px;padding-top:22px;border-top:1px solid var(--linha);color:var(--mudo);font-size:.88rem}
.post-fontes p{margin:0;font:700 .72rem/1.4 Montserrat,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--azul)}
.post-fontes ul{margin:12px 0 0;padding-left:1.1em}
.post-fontes li+li{margin-top:6px}
.post-fontes a{color:inherit;word-break:break-word}
.post-cta{margin-top:48px;padding:clamp(26px,4vw,44px);border-radius:var(--raio);background:linear-gradient(135deg,var(--azul),var(--azul-2));color:#fff;display:grid;gap:14px;justify-items:start}
.post-cta h2{color:#fff;font-size:clamp(1.3rem,1rem + 1vw,1.7rem)}
.post-cta p{margin:0;max-width:52ch;color:rgba(255,255,255,.8)}
.mais{margin-top:clamp(56px,8vw,96px)}
.mais>h2{font-size:1.5rem;margin-bottom:24px}
.rodape{background:var(--azul);color:rgba(255,255,255,.72);padding-block:32px;font-size:.88rem}
.rodape__in{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px 24px}
.rodape p{margin:0}
.rodape a{color:#fff}
`;

function casca({ site, titulo, descricao, canonico, imagem, conteudo, jsonld, tipo = 'website', contato, rastrear }) {
  const wa = contato.whatsapp ? `https://wa.me/55${contato.whatsapp}` : '';
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(titulo)}</title>
    <meta name="description" content="${esc(descricao)}" />
    <link rel="canonical" href="${esc(canonico)}" />
    <meta name="theme-color" content="#062d44" />
    <meta property="og:type" content="${tipo}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="${NOME}" />
    <meta property="og:title" content="${esc(titulo)}" />
    <meta property="og:description" content="${esc(descricao)}" />
    <meta property="og:url" content="${esc(canonico)}" />
    ${imagem ? `<meta property="og:image" content="${esc(absoluta(site, imagem))}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="${caminho('icone contextualize colorido.webp')}" type="image/webp" />
    <link rel="alternate" type="application/rss+xml" title="Blog ${NOME}" href="/blog/feed.xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet" />
    <style>${CSS}</style>
    ${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : ''}
  </head>
  <body>
    <header class="topo">
      <div class="wrap topo__in">
        <a class="topo__logo" href="/" aria-label="${NOME}, página inicial"><img src="${caminho('logo contextualize branco.webp')}" alt="${NOME}" width="150" height="30" /></a>
        <nav class="topo__links" aria-label="Blog">
          <a class="topo__link" href="/blog">Todos os artigos</a>
          <a class="topo__link" href="/#team">Equipe</a>
          ${wa ? `<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener">Agendar consulta</a>` : `<a class="btn" href="/#contact">Agendar consulta</a>`}
        </nav>
      </div>
    </header>
    <main id="conteudo">
      <div class="wrap">${conteudo}</div>
    </main>
    <footer class="rodape">
      <div class="wrap rodape__in">
        <p>${NOME}${contato.endereco ? ` · ${esc(contato.endereco)}` : ''}${contato.telefone ? ` · ${esc(contato.telefone)}` : ''}</p>
        <p><a href="/">Voltar ao site</a></p>
      </div>
    </footer>
    ${rastrear ? `<script>try{fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify(${JSON.stringify(rastrear).replace(/</g, '\\u003c')})})}catch(e){}</script>` : ''}
  </body>
</html>`;
}

function cards(posts) {
  return posts.map((p) => `
          <li class="card">
            <a href="/blog/${esc(p.slug)}">
              <span class="card__foto"><img src="${esc(caminho(p.cover_image || 'Atendimento.jpeg'))}" alt="${esc(p.cover_alt || '')}" loading="lazy" decoding="async" />${p.category ? `<span class="card__cat">${esc(p.category)}</span>` : ''}</span>
              <span class="card__corpo">
                <span class="card__meta"><time datetime="${new Date(p.scheduled_for || p.created_at).toISOString()}">${esc(dataCurtaBR(p.scheduled_for || p.created_at))}</time></span>
                <span class="card__titulo">${esc(p.title)}</span>
                <span class="card__resumo">${esc(p.excerpt)}</span>
                <span class="card__ler">Ler artigo <span aria-hidden="true">→</span></span>
              </span>
            </a>
          </li>`).join('');
}

function paginaLista({ site, posts, contato, categoria = '', categorias = [] }) {
  const filtro = categorias.length > 1 ? `
          <ul class="filtros" aria-label="Temas">
            <li><a href="/blog"${categoria ? '' : ' aria-current="page"'}>Todos</a></li>
            ${categorias.map((c) => `<li><a href="/blog?tema=${encodeURIComponent(c)}"${c === categoria ? ' aria-current="page"' : ''}>${esc(c)}</a></li>`).join('')}
          </ul>` : '';
  const conteudo = `
          <header class="cabeca">
            <p class="rotulo">Blog · ${NOME}</p>
            <h1>Saúde mental e bem-estar, <em>com ciência</em> e cuidado.</h1>
            <p>Artigos sobre psicologia, saúde mental, bem-estar e qualidade de vida, escritos a partir de estudos e fontes confiáveis e revisados pela nossa equipe.</p>
          </header>${filtro}
          ${posts.length ? `<ul class="lista" role="list">${cards(posts)}</ul>` : '<p class="vazio">Em breve, os primeiros artigos.</p>'}`;
  return casca({
    site,
    contato,
    titulo: categoria ? `${categoria} · Blog ${NOME}` : `Blog · ${NOME}`,
    descricao: 'Psicologia, saúde mental, bem-estar e qualidade de vida com base em evidências. Artigos do Instituto Contextualize, em Botucatu (SP).',
    canonico: categoria ? `${site}/blog?tema=${encodeURIComponent(categoria)}` : `${site}/blog`,
    imagem: 'Atendimento.jpeg',
    conteudo,
    rastrear: { event_type: 'pageview', target_id: 'blog', metadata: { path: '/blog' } },
    jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: `Blog ${NOME}`, url: `${site}/blog`, publisher: { '@type': 'Organization', name: NOME } },
  });
}

function paginaPost({ site, post: p, outros, contato }) {
  const msg = `Olá! Li o artigo "${p.title}" no blog do Instituto Contextualize e gostaria de conversar com a equipe.`;
  const wa = contato.whatsapp ? `https://wa.me/55${contato.whatsapp}?text=${encodeURIComponent(msg)}` : '/#contact';
  const fontes = (Array.isArray(p.sources) ? p.sources : []).filter((f) => /^https?:\/\//.test(f?.url || ''));
  const data = p.scheduled_for || p.created_at;
  const tags = Array.isArray(p.tags) ? p.tags.filter(Boolean) : [];
  const canonico = `${site}/blog/${p.slug}`;
  const conteudo = `
          <article class="estreito">
            <header class="post-cabeca">
              <p class="rotulo">${esc(p.category || 'Saúde Mental')}</p>
              <h1>${esc(p.title)}</h1>
              ${p.excerpt ? `<p class="post-resumo">${esc(p.excerpt)}</p>` : ''}
              <p class="post-meta">${esc(p.author_name || NOME)} · <time datetime="${new Date(data).toISOString()}">${esc(dataBR(data))}</time></p>
            </header>
            ${p.cover_image ? `<figure class="post-capa"><img src="${esc(caminho(p.cover_image))}" alt="${esc(p.cover_alt || '')}" decoding="async" fetchpriority="high" /></figure>` : ''}
            <div class="post-corpo">${markdown(p.content)}</div>
            ${tags.length ? `<ul class="post-tags" aria-label="Temas">${tags.slice(0, 6).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
            <aside class="post-aviso"><strong>Importante:</strong> este conteúdo é informativo e não substitui avaliação nem acompanhamento profissional. Se você está em sofrimento intenso ou pensando em se machucar, ligue <strong>188</strong> (CVV, 24 horas, gratuito) ou procure o pronto-socorro mais próximo.</aside>
            ${fontes.length ? `<aside class="post-fontes"><p>Fontes consultadas</p><ul>${fontes.map((f) => `<li><a href="${esc(f.url)}" target="_blank" rel="noopener nofollow">${esc(f.titulo || f.url)}</a></li>`).join('')}</ul></aside>` : ''}
            <aside class="post-cta">
              <h2>Quer conversar sobre isso?</h2>
              <p>A equipe do Instituto Contextualize atende presencialmente em Botucatu e online, com psicologia baseada em evidências.</p>
              ${contato.whatsapp ? `<a class="btn" href="${esc(wa)}" target="_blank" rel="noopener">Falar pelo WhatsApp <span aria-hidden="true">→</span></a>` : `<a class="btn" href="${esc(wa)}">Falar com a equipe <span aria-hidden="true">→</span></a>`}
            </aside>
          </article>
          ${outros.length ? `<section class="mais" aria-labelledby="mais-titulo"><h2 id="mais-titulo">Leia também</h2><ul class="lista" role="list">${cards(outros)}</ul></section>` : ''}`;
  return casca({
    site,
    contato,
    tipo: 'article',
    titulo: /contextualize/i.test(p.seo_title || '') ? p.seo_title : `${p.seo_title || p.title} · ${NOME}`,
    descricao: p.seo_description || p.excerpt || p.title,
    canonico,
    imagem: p.cover_image,
    conteudo,
    rastrear: { event_type: 'blog_view', target_id: String(p.id), metadata: { path: `/blog/${p.slug}`, title: p.title } },
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.seo_description || p.excerpt,
      datePublished: new Date(data).toISOString(),
      dateModified: new Date(p.updated_at || data).toISOString(),
      image: p.cover_image ? absoluta(site, p.cover_image) : undefined,
      keywords: tags.join(', ') || undefined,
      articleSection: p.category || undefined,
      author: { '@type': 'Organization', name: p.author_name || NOME },
      publisher: { '@type': 'Organization', name: NOME, logo: { '@type': 'ImageObject', url: absoluta(site, 'logo contextualize.webp') } },
      mainEntityOfPage: canonico,
      citation: fontes.length ? fontes.map((f) => f.url) : undefined,
    },
  });
}

function sitemap(site, posts) {
  const urls = [
    { loc: `${site}/` },
    { loc: `${site}/blog` },
    ...posts.map((p) => ({ loc: `${site}/blog/${p.slug}`, lastmod: new Date(p.updated_at || p.scheduled_for || p.created_at).toISOString() })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;
}

function feed(site, posts) {
  const itens = posts.map((p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(`${site}/blog/${p.slug}`)}</link>
      <guid isPermaLink="true">${esc(`${site}/blog/${p.slug}`)}</guid>
      <pubDate>${new Date(p.scheduled_for || p.created_at).toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog ${NOME}</title>
    <link>${esc(`${site}/blog`)}</link>
    <description>Psicologia, saúde mental, bem-estar e qualidade de vida com base em evidências.</description>
    <language>pt-BR</language>
${itens}
  </channel>
</rss>
`;
}

module.exports = { paginaLista, paginaPost, sitemap, feed };
