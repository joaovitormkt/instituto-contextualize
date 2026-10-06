const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const db = require('./db');
const { authenticateToken, JWT_SECRET } = require('./auth');
const { initScheduler } = require('./scheduler');
const { runNewsScanAndGenerate, scanNewsOnly, generatePostsFromSelectedNews } = require('./ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de upload com Multer (com suporte ao filesystem da Vercel /tmp)
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos do diretório raiz e de uploads
app.use('/uploads', express.static(uploadDir));
if (fs.existsSync(path.join(__dirname, 'uploads'))) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}
app.use(express.static(__dirname));

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao processar o login.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// ROTAS PÚBLICAS: PROFISSIONAIS
// ==========================================
app.get('/api/professionals', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, crp, specialty, bio, photo_url, order_index FROM professionals WHERE is_active = true ORDER BY order_index ASC, id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar profissionais:', err);
    res.status(500).json({ error: 'Erro ao carregar profissionais.' });
  }
});

// ==========================================
// ROTAS PÚBLICAS: BLOG
// ==========================================
app.get('/api/blog', async (req, res) => {
  try {
    // Garante que posts com data atingida fiquem publicados mesmo no serverless
    autoPublishScheduledPosts().catch(() => {});

    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const countRes = await db.query("SELECT COUNT(*) FROM blog_posts WHERE status = 'published' OR (status = 'scheduled' AND scheduled_for <= NOW())");
    const total = parseInt(countRes.rows[0].count);

    const result = await db.query(
      `SELECT id, title, slug, excerpt, cover_image, author_name, category, tags, relevance_score, scheduled_for, created_at, seo_title, seo_description, views_count
       FROM blog_posts
       WHERE status = 'published' OR (status = 'scheduled' AND scheduled_for <= NOW())
       ORDER BY scheduled_for DESC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      posts: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Erro ao buscar posts do blog:', err);
    res.status(500).json({ error: 'Erro ao carregar artigos do blog.' });
  }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await db.query(
      'SELECT * FROM blog_posts WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar artigo individual:', err);
    res.status(500).json({ error: 'Erro ao buscar artigo.' });
  }
});

// ==========================================
// ROTAS RESTRITAS: PROFISSIONAIS (ADMIN)
// ==========================================
app.get('/api/admin/professionals', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM professionals ORDER BY order_index ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar profissionais.' });
  }
});

app.post('/api/admin/professionals', authenticateToken, async (req, res) => {
  try {
    const { name, crp, specialty, bio, photo_url, order_index, is_active } = req.body;
    if (!name || !crp || !bio) {
      return res.status(400).json({ error: 'Nome, CRP e Biografia são obrigatórios.' });
    }

    const result = await db.query(
      `INSERT INTO professionals (name, crp, specialty, bio, photo_url, order_index, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name.trim(),
        crp.trim(),
        specialty || '',
        bio.trim(),
        photo_url || 'Hero Contextualize.webp',
        order_index !== undefined ? parseInt(order_index) : 0,
        is_active !== undefined ? Boolean(is_active) : true
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar profissional:', err);
    res.status(500).json({ error: 'Erro ao salvar novo profissional.' });
  }
});

app.put('/api/admin/professionals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, crp, specialty, bio, photo_url, order_index, is_active } = req.body;

    const result = await db.query(
      `UPDATE professionals
       SET name = COALESCE($1, name),
           crp = COALESCE($2, crp),
           specialty = COALESCE($3, specialty),
           bio = COALESCE($4, bio),
           photo_url = COALESCE($5, photo_url),
           order_index = COALESCE($6, order_index),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, crp, specialty, bio, photo_url, order_index, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar profissional:', err);
    res.status(500).json({ error: 'Erro ao atualizar profissional.' });
  }
});

app.delete('/api/admin/professionals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM professionals WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profissional não encontrado.' });
    }
    res.json({ success: true, message: 'Profissional removido com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir profissional:', err);
    res.status(500).json({ error: 'Erro ao excluir profissional.' });
  }
});

// ==========================================
// ROTAS RESTRITAS: BLOG (ADMIN)
// ==========================================
app.get('/api/admin/blog', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blog_posts ORDER BY scheduled_for DESC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar artigos do blog.' });
  }
});

app.post('/api/admin/blog', authenticateToken, async (req, res) => {
  try {
    const { title, excerpt, content, cover_image, author_name, category, tags, scheduled_for, status, seo_title, seo_description, seo_keywords } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }

    let slug = title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const check = await db.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (check.rows.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    let normalizedScheduledFor = scheduled_for;
    if (normalizedScheduledFor) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(normalizedScheduledFor).trim())) {
        normalizedScheduledFor = `${String(normalizedScheduledFor).trim()}T09:00:00`;
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      normalizedScheduledFor = `${today}T09:00:00`;
    }

    const result = await db.query(
      `INSERT INTO blog_posts
        (title, slug, excerpt, content, cover_image, author_name, category, tags, scheduled_for, status, seo_title, seo_description, seo_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        title.trim(),
        slug,
        excerpt || '',
        content,
        cover_image || 'Atendimento.jpeg',
        author_name || 'Equipe Contextualize',
        category || 'Psicologia',
        tags || ['Psicologia'],
        normalizedScheduledFor,
        status || 'draft',
        seo_title || title,
        seo_description || excerpt,
        seo_keywords || ''
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar post de blog:', err);
    res.status(500).json({ error: 'Erro ao criar artigo.' });
  }
});

app.put('/api/admin/blog/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, cover_image, author_name, category, tags, scheduled_for, status, seo_title, seo_description, seo_keywords } = req.body;

    let normalizedScheduledFor = scheduled_for;
    if (normalizedScheduledFor && /^\d{4}-\d{2}-\d{2}$/.test(String(normalizedScheduledFor).trim())) {
      normalizedScheduledFor = `${String(normalizedScheduledFor).trim()}T09:00:00`;
    }

    const result = await db.query(
      `UPDATE blog_posts
       SET title = COALESCE($1, title),
           excerpt = COALESCE($2, excerpt),
           content = COALESCE($3, content),
           cover_image = COALESCE($4, cover_image),
           author_name = COALESCE($5, author_name),
           category = COALESCE($6, category),
           tags = COALESCE($7, tags),
           scheduled_for = COALESCE($8, scheduled_for),
           status = COALESCE($9, status),
           seo_title = COALESCE($10, seo_title),
           seo_description = COALESCE($11, seo_description),
           seo_keywords = COALESCE($12, seo_keywords),
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [title, excerpt, content, cover_image, author_name, category, tags, normalizedScheduledFor, status, seo_title, seo_description, seo_keywords, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar post:', err);
    res.status(500).json({ error: 'Erro ao atualizar artigo.' });
  }
});

// Ações em massa no Blog (aprovar para agendamento às 09h00, excluir, rascunho, etc.)
app.post('/api/admin/blog/bulk-action', authenticateToken, async (req, res) => {
  try {
    const { action, ids, target_date } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Nenhum post selecionado.' });
    }

    if (action === 'approve_schedule') {
      if (target_date) {
        // Se o usuário especificou data e hora manual
        const finalDate = target_date.includes('T') ? target_date : `${target_date}T09:00:00`;
        await db.query(
          `UPDATE blog_posts 
           SET status = 'scheduled',
               scheduled_for = $1,
               updated_at = NOW()
           WHERE id = ANY($2)`,
          [finalDate, ids]
        );
      } else {
        // Regra solicitada: Quando aprovado vai automaticamente para programação para ser publicado sozinho naquele dia às 09h00
        await db.query(
          `UPDATE blog_posts 
           SET status = 'scheduled',
               scheduled_for = date_trunc('day', COALESCE(scheduled_for, NOW())) + time '09:00:00',
               updated_at = NOW()
           WHERE id = ANY($1)`,
          [ids]
        );
      }
      return res.json({ success: true, message: `${ids.length} post(s) aprovado(s) e programado(s) para as 09h00!` });
    }

    if (action === 'publish_now') {
      await db.query(
        `UPDATE blog_posts 
         SET status = 'published',
             scheduled_for = NOW(),
             updated_at = NOW()
         WHERE id = ANY($1)`,
        [ids]
      );
      return res.json({ success: true, message: `${ids.length} post(s) publicado(s) imediatamente!` });
    }

    if (action === 'to_draft') {
      await db.query(
        `UPDATE blog_posts 
         SET status = 'draft',
             updated_at = NOW()
         WHERE id = ANY($1)`,
        [ids]
      );
      return res.json({ success: true, message: `${ids.length} post(s) movido(s) para rascunho.` });
    }

    if (action === 'delete') {
      await db.query(
        `DELETE FROM blog_posts WHERE id = ANY($1)`,
        [ids]
      );
      return res.json({ success: true, message: `${ids.length} post(s) excluído(s) com sucesso.` });
    }

    res.status(400).json({ error: 'Ação em massa não reconhecida.' });
  } catch (err) {
    console.error('Erro em ação em massa:', err);
    res.status(500).json({ error: 'Erro ao processar ação em massa.' });
  }
});

app.delete('/api/admin/blog/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artigo não encontrado.' });
    }
    res.json({ success: true, message: 'Artigo excluído com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir artigo:', err);
    res.status(500).json({ error: 'Erro ao excluir artigo.' });
  }
});

// ==========================================
// ROTA PÚBLICA DE TRACKING DE TELEMETRIA
// ==========================================
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { event_type, target_id, metadata } = req.body;
    if (!event_type) {
      return res.status(400).json({ error: 'event_type é obrigatório' });
    }

    await db.query(
      `INSERT INTO site_events (event_type, target_id, metadata)
       VALUES ($1, $2, $3)`,
      [event_type, target_id ? String(target_id) : null, metadata ? JSON.stringify(metadata) : null]
    );

    // Se for blog_view, contabiliza views_count no artigo
    if (event_type === 'blog_view' && target_id) {
      if (/^\d+$/.test(String(target_id))) {
        await db.query(`UPDATE blog_posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1`, [parseInt(target_id, 10)]);
      } else {
        await db.query(`UPDATE blog_posts SET views_count = COALESCE(views_count, 0) + 1 WHERE slug = $1`, [String(target_id)]);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao gravar evento analytics:', err);
    res.status(500).json({ error: 'Erro ao registrar evento' });
  }
});

// ==========================================
// ROTA RESTRITA: DADOS DA DASHBOARD INTERATIVA
// ==========================================
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    // 1. Total de visitantes (pageviews)
    const pageviewsRes = await db.query(
      "SELECT COUNT(*) as total FROM site_events WHERE event_type = 'pageview'"
    );

    // 2. Cliques no WhatsApp
    const whatsappRes = await db.query(
      "SELECT COUNT(*) as total FROM site_events WHERE event_type = 'whatsapp_click'"
    );

    // 3. Leituras no Blog
    const blogRes = await db.query(
      "SELECT COUNT(*) as total FROM site_events WHERE event_type = 'blog_view'"
    );

    // 4. Profissionais cadastrados
    const profRes = await db.query(
      "SELECT COUNT(*) as total FROM professionals WHERE is_active = true"
    );

    // 5. Posts por status (scheduled com data passada já conta como publicado)
    const postsRes = await db.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'draft') as drafts,
         COUNT(*) FILTER (WHERE status = 'scheduled' AND (scheduled_for IS NULL OR scheduled_for > NOW())) as scheduled,
         COUNT(*) FILTER (WHERE status = 'published' OR (status = 'scheduled' AND scheduled_for <= NOW())) as published
       FROM blog_posts`
    );

    // 6. Posts mais lidos
    const topPostsRes = await db.query(
      `SELECT id, title, slug, views_count, status, scheduled_for, created_at
       FROM blog_posts
       ORDER BY COALESCE(views_count, 0) DESC, id DESC
       LIMIT 6`
    );

    // 7. Últimos rascunhos para aprovação rápida
    const pendingDraftsRes = await db.query(
      `SELECT id, title, slug, scheduled_for, created_at, status
       FROM blog_posts
       WHERE status = 'draft'
       ORDER BY created_at DESC, id DESC
       LIMIT 6`
    );

    // 8. Gráfico dos últimos 7 dias (Pageviews e WhatsApp)
    const chartRes = await db.query(
      `SELECT 
         TO_CHAR(d.day, 'DD/MM') as label,
         COALESCE(SUM(CASE WHEN e.event_type = 'pageview' THEN 1 ELSE 0 END), 0)::int as pageviews,
         COALESCE(SUM(CASE WHEN e.event_type = 'whatsapp_click' THEN 1 ELSE 0 END), 0)::int as whatsapp,
         COALESCE(SUM(CASE WHEN e.event_type = 'blog_view' THEN 1 ELSE 0 END), 0)::int as blog_views
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
       LEFT JOIN site_events e ON date_trunc('day', e.created_at) = d.day
       GROUP BY d.day
       ORDER BY d.day ASC`
    );

    res.json({
      kpis: {
        pageviews: parseInt(pageviewsRes.rows[0]?.total || 0, 10),
        whatsapp_clicks: parseInt(whatsappRes.rows[0]?.total || 0, 10),
        blog_views: parseInt(blogRes.rows[0]?.total || 0, 10),
        professionals_count: parseInt(profRes.rows[0]?.total || 0, 10),
        drafts_count: parseInt(postsRes.rows[0]?.drafts || 0, 10),
        scheduled_count: parseInt(postsRes.rows[0]?.scheduled || 0, 10),
        published_count: parseInt(postsRes.rows[0]?.published || 0, 10),
        total_posts: parseInt(postsRes.rows[0]?.total || 0, 10)
      },
      top_posts: topPostsRes.rows,
      pending_drafts: pendingDraftsRes.rows,
      chart_data: chartRes.rows
    });
  } catch (err) {
    console.error('Erro ao gerar dados da dashboard:', err);
    res.status(500).json({ error: 'Erro ao gerar dados da dashboard.' });
  }
});

// ==========================================
// ROTA PÚBLICA: DADOS DE CONTATO E REDES SOCIAIS
// ==========================================
app.get('/api/settings', async (req, res) => {
  try {
    const keys = [
      'contact_whatsapp', 'contact_phone', 'contact_email', 'contact_address', 'contact_hours',
      'social_instagram', 'social_linkedin', 'social_facebook', 'social_youtube'
    ];
    const result = await db.query(
      'SELECT key, value FROM system_settings WHERE key = ANY($1)',
      [keys]
    );
    const settings = {
      contact_whatsapp: '14999999999',
      contact_phone: '14 99999-9999',
      contact_email: 'contato@institutocontextualize.com',
      contact_address: 'Rua General Telles, 1375 - Centro, Botucatu - SP',
      contact_hours: 'Seg a Sex das 09h00 às 18h00',
      social_instagram: 'https://instagram.com',
      social_linkedin: 'https://linkedin.com',
      social_facebook: '',
      social_youtube: ''
    };
    result.rows.forEach(r => {
      settings[r.key] = r.value || '';
    });
    res.json(settings);
  } catch (err) {
    console.error('Erro ao buscar dados de contato e redes:', err);
    res.status(500).json({ error: 'Erro ao carregar dados institucionais.' });
  }
});

// ==========================================
// ROTAS RESTRITAS: CONFIGURAÇÕES E IA (OPENAI)
// ==========================================
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    const rows = await db.query('SELECT key, value, description, updated_at FROM system_settings');
    const settings = {};
    rows.rows.forEach(r => {
      if (r.key === 'openai_api_key') {
        // Mascara a chave para segurança
        settings[r.key] = r.value && r.value.length > 8
          ? `${r.value.slice(0, 4)}...${r.value.slice(-4)}`
          : (r.value ? 'Configurada' : '');
        settings['openai_api_key_configured'] = Boolean(r.value && r.value.trim());
      } else {
        settings[r.key] = r.value;
      }
    });

    if (!settings.openai_api_key_configured && process.env.OPENAI_API_KEY) {
      settings.openai_api_key_configured = true;
      settings.openai_api_key = `${process.env.OPENAI_API_KEY.slice(0, 4)}...${process.env.OPENAI_API_KEY.slice(-4)} (via .env)`;
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    const allowedKeys = [
      'openai_api_key', 'openai_model', 'cron_enabled',
      'contact_whatsapp', 'contact_phone', 'contact_email', 'contact_address', 'contact_hours',
      'social_instagram', 'social_linkedin', 'social_facebook', 'social_youtube'
    ];

    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        let val = req.body[key];
        if (typeof val === 'string') val = val.trim();
        // Não sobrescrever a chave da OpenAI se vier mascarada ou vazia
        if (key === 'openai_api_key' && (!val || val.includes('...'))) {
          continue;
        }

        await db.query(
          `INSERT INTO system_settings (key, value, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, String(val), `Configuração de ${key}`]
        );
      }
    }

    res.json({ success: true, message: 'Configurações salvas com sucesso no banco Neon!' });
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// Realizar APENAS a varredura das 20 notícias (para exibir e permitir trocar)
app.post('/api/admin/ai/scan', authenticateToken, async (req, res) => {
  try {
    console.log('[Admin] Iniciando varredura das 20 notícias...');
    const result = await scanNewsOnly();
    res.json(result);
  } catch (err) {
    console.error('Erro na varredura de notícias:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Obter as últimas notícias salvas
app.get('/api/admin/ai/latest-news', authenticateToken, async (req, res) => {
  try {
    const row = await db.query("SELECT value FROM system_settings WHERE key = 'latest_scanned_news'");
    if (row.rows.length > 0 && row.rows[0].value) {
      res.json({ news: JSON.parse(row.rows[0].value) });
    } else {
      res.json({ news: [] });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao recuperar últimas notícias.' });
  }
});

// Gerar artigos com base nas notícias selecionadas/trocadas pelo usuário
app.post('/api/admin/ai/generate-selected', authenticateToken, async (req, res) => {
  try {
    const { selected_news } = req.body;
    if (!selected_news || !Array.isArray(selected_news) || selected_news.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos uma notícia para gerar os posts.' });
    }

    console.log(`[Admin] Gerando artigos para ${selected_news.length} notícias selecionadas...`);
    const result = await generatePostsFromSelectedNews(selected_news);
    res.json({
      success: true,
      message: `${result.posts_created} novos artigos densos gerados como rascunho com sucesso!`,
      result
    });
  } catch (err) {
    console.error('Erro ao gerar artigos selecionados:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Execução manual direta da IA (varre e gera as top 5)
app.post('/api/admin/ai/run-now', authenticateToken, async (req, res) => {
  try {
    console.log('[Admin] Disparo manual da varredura completa...');
    const result = await runNewsScanAndGenerate(true);
    res.json({
      success: true,
      message: `Varredura concluída com sucesso! ${result.news_scanned} notícias avaliadas e ${result.posts_created} novos artigos criados em rascunho.`,
      result
    });
  } catch (err) {
    console.error('Erro na geração manual da IA:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Histórico de logs de varredura da IA
app.get('/api/admin/ai/logs', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, executed_at, status, news_scanned_count, selected_count, raw_news_json, error_message FROM ai_generation_logs ORDER BY executed_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar histórico da IA.' });
  }
});

// Upload de imagem
app.post('/api/admin/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// ==========================================
// ROTAS DE FRONTEND (PÁGINAS)
// ==========================================
// Rota da Landing Page principal (index.html ou code.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota do Painel Administrativo Restrito
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Rota individual de artigo do Blog
app.get('/artigo/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'article.html'));
});

// ==========================================
// JOB: AUTO-PUBLICAR POSTS AGENDADOS
// Roda a cada 5 minutos e publica posts cujo
// scheduled_for já passou (status = 'published')
// ==========================================
async function autoPublishScheduledPosts() {
  try {
    const result = await db.query(
      `UPDATE blog_posts
       SET status = 'published'
       WHERE status = 'scheduled'
         AND scheduled_for IS NOT NULL
         AND scheduled_for <= NOW()
       RETURNING id, title`
    );
    if (result.rowCount > 0) {
      console.log(`[Auto-Publish] ${result.rowCount} post(s) publicado(s) automaticamente:`);
      result.rows.forEach(p => console.log(`  - [id=${p.id}] ${p.title}`));
    }
  } catch (err) {
    console.error('[Auto-Publish] Erro:', err.message);
  }
}

// Inicia servidor standalone se não estiver na Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` INSTITUTO CONTEXTUALIZE - SERVIDOR ATIVO`);
    console.log(` URL Local: http://localhost:${PORT}`);
    console.log(` Painel Restrito: http://localhost:${PORT}/admin`);
    console.log(` Banco de Dados: Neon PostgreSQL (Conectado)`);
    console.log(` Agendador IA: Ativo para Segundas-feiras às 06:00 BRT`);
    console.log(`=======================================================`);
    initScheduler();
    // Roda imediatamente ao iniciar e depois a cada 5 minutos
    autoPublishScheduledPosts();
    setInterval(autoPublishScheduledPosts, 5 * 60 * 1000);
    console.log('[Auto-Publish] Job de publicação automática ativo (a cada 5 min)');
  });
} else {
  // Executa checagem de posts agendados na inicialização da função serverless
  autoPublishScheduledPosts().catch(() => {});
}

module.exports = app;
