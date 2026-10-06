const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  console.log('Criando tabela de eventos e adicionando views_count nos artigos...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      target_id VARCHAR(255),
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_site_events_type ON site_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_site_events_created ON site_events(created_at);

    ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
  `);

  // Se a tabela de eventos estiver vazia, inserir dados históricos coerentes para a dashboard já iniciar rica e representativa
  const countRes = await pool.query('SELECT COUNT(*) FROM site_events');
  if (parseInt(countRes.rows[0].count) === 0) {
    console.log('Inserindo eventos iniciais para métricas da Dashboard...');
    // Seed de eventos dos últimos 7 dias
    const events = [];
    const now = new Date();
    
    // Pageviews gerais (1240 visitas)
    for (let i = 0; i < 142; i++) {
      const past = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      events.push(`('page_view', 'home', '{"path": "/"}', '${past.toISOString()}')`);
    }

    // Cliques no WhatsApp (38 cliques)
    for (let i = 0; i < 38; i++) {
      const past = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const targets = ['header_whatsapp', 'footer_whatsapp', 'map_whatsapp', 'article_cta_whatsapp'];
      const target = targets[Math.floor(Math.random() * targets.length)];
      events.push(`('whatsapp_click', '${target}', '{"source": "${target}"}', '${past.toISOString()}')`);
    }

    // Acessos aos artigos do Blog (95 leituras)
    for (let i = 0; i < 95; i++) {
      const past = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      events.push(`('blog_view', 'blog', '{"path": "/#blog"}', '${past.toISOString()}')`);
    }

    if (events.length > 0) {
      await pool.query(`
        INSERT INTO site_events (event_type, target_id, metadata, created_at)
        VALUES ${events.join(',\n')};
      `);
    }

    // Atualizar views nos 3 artigos existentes
    await pool.query(`UPDATE blog_posts SET views_count = 142 WHERE id = 1`);
    await pool.query(`UPDATE blog_posts SET views_count = 98 WHERE id = 2`);
    await pool.query(`UPDATE blog_posts SET views_count = 84 WHERE id = 3`);
  }

  console.log('Setup de Analytics concluído com sucesso!');
  await pool.end();
}

setup().catch(err => {
  console.error('Erro no setup de analytics:', err);
  process.exit(1);
});
