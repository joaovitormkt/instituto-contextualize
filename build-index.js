const fs = require('fs');
require('dotenv').config();
const { Pool } = require('pg');

async function build() {
  console.log('Iniciando build do index.html com Carrossel e Contatos Dinâmicos...');
  let html = fs.readFileSync('code.html', 'utf8');

  // 1. Adicionar id='team-grid' no grid de profissionais
  html = html.replace(
    '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">',
    '<div id="team-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">'
  );

  // 2. Buscar posts mais recentes no Neon para pré-renderização estática do Carrossel (SSG)
  let staticCardsHtml = '';
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const result = await pool.query(
      `SELECT id, title, slug, excerpt, cover_image, author_name, category, relevance_score, scheduled_for, created_at
       FROM blog_posts
       WHERE status = 'published'
       ORDER BY scheduled_for DESC, created_at DESC
       LIMIT 10`
    );
    await pool.end();

    if (result.rows && result.rows.length > 0) {
      console.log(`Encontrados ${result.rows.length} posts para pré-renderização no Carrossel.`);
      staticCardsHtml = result.rows.map(post => {
        const formattedDate = post.scheduled_for ? new Date(post.scheduled_for).toLocaleDateString('pt-BR') : '';

        return `
        <!-- Card Carrossel: ${post.title} -->
        <a href="/artigo/${post.slug}" class="bg-surface rounded-3xl overflow-hidden border border-outline-variant/30 hover:border-[#B5985E]/60 transition-all duration-300 group flex flex-col shadow-sm hover:shadow-xl reveal scale-in visible" style="flex: 0 0 min(410px, 86vw); scroll-snap-align: start; text-decoration: none; background: #ffffff;">
          <div class="aspect-[16/10] overflow-hidden relative bg-surface-variant">
            <img src="${post.cover_image || 'Atendimento.jpeg'}" alt="${post.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='Atendimento.jpeg'" />
            <div style="position: absolute; top: 1rem; left: 1rem; background: rgba(6, 45, 68, 0.88); backdrop-filter: blur(8px); color: #ffffff; font-family: Montserrat, sans-serif; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.25rem 0.75rem; border-radius: 9999px;">
              ${post.category || 'Psicologia'}
            </div>
          </div>
          <div class="p-6 flex flex-col flex-grow">
            <div class="flex items-center justify-between gap-2 mb-2 text-xs text-slate-400 font-montserrat">
              <span>${formattedDate}</span>
              <span class="text-[11px] text-[#B5985E] font-medium font-montserrat">${post.author_name || 'Instituto Contextualize'}</span>
            </div>
            <h4 style="font-family: Montserrat, sans-serif; font-size: 1.18rem; font-weight: 700; color: #062D44; margin: 0 0 0.75rem 0; line-height: 1.38;" class="group-hover:text-[#B5985E] transition-colors line-clamp-2">
              ${post.title}
            </h4>
            <p style="font-family: Manrope, sans-serif; font-size: 0.875rem; line-height: 1.6; color: rgba(6, 45, 68, 0.75); margin: 0 0 1.25rem 0;" class="flex-grow line-clamp-3">
              ${post.excerpt || ''}
            </p>
            <div class="flex items-center gap-1.5 font-montserrat text-xs font-bold text-[#B5985E] group-hover:translate-x-1 transition-transform mt-auto">
              <span>LER ARTIGO COMPLETO</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </div>
        </a>
        `;
      }).join('\n');
    }
  } catch (err) {
    console.warn('Aviso: Não foi possível pré-carregar posts do Neon estaticamente.', err.message);
  }

  // 3. Montar Seção do Blog em Formato CARROSSEL (Full-width fluido)
  const blogSection = `
    <!-- Blog & Scientific Updates Section (Carrossel Interativo) -->
    <section style="width: 100%; max-width: 1400px; margin: 0 auto; box-sizing: border-box; padding: 6rem 24px;" id="blog">
      
      <!-- Section Header com Controles do Carrossel -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 reveal">
        <div>
          <span style="font-family: Montserrat, sans-serif; font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.15em; color: #B5985E; text-transform: uppercase; margin-bottom: 0.75rem; display: block;">
            BLOG & NOTÍCIAS CIENTÍFICAS
          </span>
          <div style="margin-bottom: 0.5rem;">
            <p style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: clamp(2.4rem, 3.8vw, 4.5rem);
              font-style: italic;
              font-weight: 400;
              letter-spacing: 0.01em;
              color: #B5985E;
              margin: 0;
              line-height: 0.95;
            ">
              Artigos e novidades
            </p>
            <p style="
              font-family: Montserrat, sans-serif;
              font-size: clamp(2rem, 3vw, 3.4rem);
              font-weight: 800;
              line-height: 1.05;
              letter-spacing: -0.02em;
              color: #062D44;
              margin: -0.08em 0 0 0;
            ">
              sobre psicologia e comportamento
            </p>
          </div>
          <p style="font-family: Manrope, sans-serif; font-size: 0.95rem; color: rgba(6, 45, 68, 0.75); max-width: 620px; margin: 0.75rem 0 0 0;">
            Conteúdos baseados em evidências, atualizados com a curadoria do Instituto Contextualize. Arraste ou use os botões para navegar pelas publicações mais recentes.
          </p>
        </div>

        <!-- Botões de Navegação do Carrossel -->
        <div class="flex items-center gap-3 flex-shrink-0 self-start md:self-end">
          <button id="blog-carousel-prev" aria-label="Artigo anterior" style="
            width: 48px; height: 48px; border-radius: 50%;
            background: #ffffff; border: 1.5px solid rgba(6, 45, 68, 0.15);
            color: #062D44; cursor: pointer; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 14px rgba(6, 45, 68, 0.06); transition: all 0.25s ease;
          " onmouseover="this.style.background='#062D44'; this.style.color='#ffffff'; this.style.borderColor='#062D44'; this.style.transform='scale(1.05)';"
             onmouseout="this.style.background='#ffffff'; this.style.color='#062D44'; this.style.borderColor='rgba(6, 45, 68, 0.15)'; this.style.transform='scale(1)';">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button id="blog-carousel-next" aria-label="Próximo artigo" style="
            width: 48px; height: 48px; border-radius: 50%;
            background: #062D44; border: 1.5px solid #062D44;
            color: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 14px rgba(6, 45, 68, 0.15); transition: all 0.25s ease;
          " onmouseover="this.style.background='#B5985E'; this.style.borderColor='#B5985E'; this.style.transform='scale(1.05)';"
             onmouseout="this.style.background='#062D44'; this.style.borderColor='#062D44'; this.style.transform='scale(1)';">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Trilho do Carrossel (Horizontal Scroll com Snap) -->
      <div id="blog-carousel-track" class="no-scrollbar" style="
        display: flex; gap: 1.5rem; overflow-x: auto;
        scroll-snap-type: x mandatory; scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch; padding: 0.5rem 4px 1.5rem 4px;
        scrollbar-width: none; -ms-overflow-style: none;
      ">
${staticCardsHtml}
      </div>

    </section>
`;

  // Inserir antes da seção de localização
  const locMarker = '<!-- Location & Contact Map Section';
  if (html.includes(locMarker)) {
    html = html.replace(locMarker, blogSection + '\n    ' + locMarker);
  } else {
    console.error('ERRO: Marcador de localização não encontrado no code.html');
  }

  // 4. Adicionar botão da Área Restrita no Footer
  const adminFooterBtn = `
      <!-- Link Área Restrita Equipe -->
      <div style="margin-top: 1.75rem; margin-bottom: 1rem;">
        <a href="/admin" style="
          font-family: Montserrat, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: rgba(181, 152, 94, 0.85);
          text-transform: uppercase;
          text-decoration: none;
          padding: 0.45rem 1.15rem;
          border: 1px solid rgba(181, 152, 94, 0.35);
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.25s;
        " onmouseover="this.style.color='#ffffff'; this.style.borderColor='#B5985E'; this.style.background='rgba(181, 152, 94, 0.25)'; this.style.transform='translateY(-1px)'"
           onmouseout="this.style.color='rgba(181, 152, 94, 0.85)'; this.style.borderColor='rgba(181, 152, 94, 0.35)'; this.style.background='transparent'; this.style.transform='translateY(0)'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="m7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Área Restrita (Acesso Equipe)
        </a>
      </div>
`;
  html = html.replace('<!-- Copyright Text -->', adminFooterBtn + '\n      <!-- Copyright Text -->');

  // Adicionar IDs aos links de redes sociais no topo e rodapé para controle dinâmico
  html = html.replace('href="https://instagram.com"', 'id="header-social-instagram" href="https://instagram.com"');
  html = html.replace('href="https://wa.me/5514999999999"', 'id="header-social-whatsapp" href="https://wa.me/5514999999999"');

  // 5. Adicionar script de hidratação dinâmica do carrossel e das configurações
  const dynamicScript = `
<script>
  /* ─────────────────────────────────────────
     4. CONTEXTUALIZE DYNAMIC ENGINE & CAROUSEL
  ───────────────────────────────────────── */
  async function loadDynamicContent() {
    // 1. Carregar Configurações Públicas (Contatos & Redes Sociais)
    try {
      const setResp = await fetch('/api/settings');
      if (setResp.ok) {
        const s = await setResp.json();

        // Aplicar Regra: se tiver link da rede social aparece; se não tiver, o ícone fica oculto
        const instagramEls = document.querySelectorAll('a[href*="instagram.com"]');
        instagramEls.forEach(el => {
          if (s.social_instagram && s.social_instagram.trim()) {
            el.href = s.social_instagram.trim();
            el.style.display = 'inline-flex';
          } else {
            el.style.display = 'none';
          }
        });

        const linkedinEls = document.querySelectorAll('a[href*="linkedin.com"]');
        linkedinEls.forEach(el => {
          if (s.social_linkedin && s.social_linkedin.trim()) {
            el.href = s.social_linkedin.trim();
            el.style.display = 'inline-flex';
          } else {
            el.style.display = 'none';
          }
        });

        const whatsappEls = document.querySelectorAll('a[href*="wa.me"]');
        whatsappEls.forEach(el => {
          if (s.contact_whatsapp && s.contact_whatsapp.trim()) {
            const cleanNum = s.contact_whatsapp.replace(/\\D/g, '');
            el.href = 'https://wa.me/55' + cleanNum;
            el.style.display = 'inline-flex';
          } else {
            el.style.display = 'none';
          }
        });
      }
    } catch (e) {
      console.warn('Configurações públicas carregadas via fallback estático:', e);
    }

    // 2. Carregar Profissionais dinâmicos do Neon
    try {
      const resp = await fetch('/api/professionals');
      if (resp.ok) {
        const profs = await resp.json();
        const teamGrid = document.getElementById('team-grid');
        if (teamGrid && profs && profs.length > 0) {
          teamGrid.innerHTML = '';
          profs.forEach((p) => {
            const card = document.createElement('div');
            card.className = 'bg-surface rounded-3xl overflow-hidden border border-outline-variant/30 hover:border-brand-gold/50 transition-all duration-300 group flex flex-col h-full shadow-sm hover:shadow-md reveal scale-in visible';
            card.innerHTML = \`
              <div class="aspect-[3/4] overflow-hidden relative bg-surface-variant">
                <img src="\${p.photo_url || 'Hero Contextualize.webp'}" alt="Retrato profissional de \${p.name}" class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" onerror="this.src='Hero Contextualize.webp'" />
              </div>
              <div class="p-6 flex flex-col flex-grow">
                <span style="display: inline-block; align-self: flex-start; background: #B5985E; color: #ffffff; font-family: Montserrat, sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em; padding: 0.22rem 0.7rem; border-radius: 9999px; margin-bottom: 0.65rem;">
                  \${p.crp}
                </span>
                <h4 style="font-family: Montserrat, sans-serif; font-size: 1.15rem; font-weight: 700; color: #062D44; margin: 0 0 0.65rem 0;">
                  \${p.name}
                </h4>
                <p style="font-family: Manrope, sans-serif; font-size: 0.875rem; line-height: 1.6; color: rgba(6, 45, 68, 0.75); margin: 0;" class="flex-grow">
                  \${p.bio}
                </p>
              </div>
            \`;
            teamGrid.appendChild(card);
          });
        }
      }
    } catch (e) {
      console.warn('Equipe carregada via fallback estático:', e);
    }

    // 3. Carregar Artigos mais recentes no Carrossel
    try {
      const resp = await fetch('/api/blog?limit=10');
      if (resp.ok) {
        const data = await resp.json();
        const track = document.getElementById('blog-carousel-track');
        if (track && data.posts && data.posts.length > 0) {
          track.innerHTML = '';
          data.posts.forEach((post) => {
            const card = document.createElement('a');
            card.href = '/artigo/' + post.slug;
            card.className = 'bg-surface rounded-3xl overflow-hidden border border-outline-variant/30 hover:border-[#B5985E]/60 transition-all duration-300 group flex flex-col shadow-sm hover:shadow-xl reveal scale-in visible';
            card.style.cssText = 'flex: 0 0 min(410px, 86vw); scroll-snap-align: start; text-decoration: none; background: #ffffff;';

            const formattedDate = post.scheduled_for ? new Date(post.scheduled_for).toLocaleDateString('pt-BR') : '';

            card.innerHTML = \`
              <div class="aspect-[16/10] overflow-hidden relative bg-surface-variant">
                <img src="\${post.cover_image || 'Atendimento.jpeg'}" alt="\${post.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='Atendimento.jpeg'" />
                <div style="position: absolute; top: 1rem; left: 1rem; background: rgba(6, 45, 68, 0.88); backdrop-filter: blur(8px); color: #ffffff; font-family: Montserrat, sans-serif; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.25rem 0.75rem; border-radius: 9999px;">
                  \${post.category || 'Psicologia'}
                </div>
              </div>
              <div class="p-6 flex flex-col flex-grow">
                <div class="flex items-center justify-between gap-2 mb-2 text-xs text-slate-400 font-montserrat">
                  <span>\${formattedDate}</span>
                  <span class="text-[11px] text-[#B5985E] font-medium font-montserrat">\${post.author_name || 'Instituto Contextualize'}</span>
                </div>
                <h4 style="font-family: Montserrat, sans-serif; font-size: 1.18rem; font-weight: 700; color: #062D44; margin: 0 0 0.75rem 0; line-height: 1.38;" class="group-hover:text-[#B5985E] transition-colors line-clamp-2">
                  \${post.title}
                </h4>
                <p style="font-family: Manrope, sans-serif; font-size: 0.875rem; line-height: 1.6; color: rgba(6, 45, 68, 0.75); margin: 0 0 1.25rem 0;" class="flex-grow line-clamp-3">
                  \${post.excerpt || ''}
                </p>
                <div class="flex items-center gap-1.5 font-montserrat text-xs font-bold text-[#B5985E] group-hover:translate-x-1 transition-transform mt-auto">
                  <span>LER ARTIGO COMPLETO</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </div>
            \`;
            track.appendChild(card);
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar carrossel do blog:', e);
    }

    // Inicializar Controles do Carrossel (Setas e Mouse Drag)
    initCarouselControls();
  }

  function initCarouselControls() {
    const track = document.getElementById('blog-carousel-track');
    const prevBtn = document.getElementById('blog-carousel-prev');
    const nextBtn = document.getElementById('blog-carousel-next');

    if (!track) return;

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const itemWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 24 : 420;
        track.scrollBy({ left: -itemWidth, behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const itemWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width + 24 : 420;
        track.scrollBy({ left: itemWidth, behavior: 'smooth' });
      });
    }

    // Suporte a arrastar com mouse (Mouse Drag)
    let isDown = false;
    let startX;
    let scrollLeft;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', () => {
      isDown = false;
      track.style.cursor = 'grab';
    });

    track.addEventListener('mouseup', () => {
      isDown = false;
      track.style.cursor = 'grab';
    });

    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeft - walk;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicContent);
  } else {
    loadDynamicContent();
  }
</script>
`;

  html = html.replace('</body>', dynamicScript + '\n</body>');

  fs.writeFileSync('index.html', html, 'utf8');
  console.log('index.html gerado com sucesso com Carrossel interativo!');
}

build().catch(console.error);
