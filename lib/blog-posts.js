// Consultas públicas do blog. Um artigo aparece no site quando está publicado
// ou quando foi aprovado (agendado) e a data de publicação já passou.
const db = require('../db');
const { slugify } = require('./blog-util');

// Colunas que o blog no estilo "pauta com fontes" precisa. Idempotente.
let _pronto = null;
function garantirEsquema() {
  if (!_pronto) {
    _pronto = (async () => {
      await db.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS sources JSONB NOT NULL DEFAULT '[]'`);
      await db.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual'`);
      await db.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS batch TEXT`);
      await db.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_alt TEXT NOT NULL DEFAULT ''`);
    })().catch((e) => {
      _pronto = null;
      throw e;
    });
  }
  return _pronto;
}

const NO_AR = `(status = 'published' OR (status = 'scheduled' AND scheduled_for <= NOW()))`;
const COLUNAS = 'id, slug, title, excerpt, cover_image, cover_alt, category, tags, scheduled_for, created_at, updated_at, author_name';

async function publicados(limite = 3, excetoId = 0) {
  await garantirEsquema();
  const r = await db.query(
    `SELECT ${COLUNAS} FROM blog_posts WHERE ${NO_AR} AND id <> $2
     ORDER BY scheduled_for DESC NULLS LAST, created_at DESC LIMIT $1`,
    [limite, excetoId],
  );
  return r.rows;
}

async function porSlug(slug) {
  await garantirEsquema();
  const r = await db.query(`SELECT * FROM blog_posts WHERE slug = $1 AND ${NO_AR}`, [slug]);
  return r.rows[0] || null;
}

async function slugLivre(titulo, id = 0) {
  const base = slugify(titulo);
  let slug = base;
  for (let i = 2; ; i++) {
    const r = await db.query('SELECT 1 FROM blog_posts WHERE slug = $1 AND id <> $2', [slug, id]);
    if (!r.rows.length) return slug;
    slug = `${base}-${i}`;
  }
}

module.exports = { garantirEsquema, publicados, porSlug, slugLivre };
