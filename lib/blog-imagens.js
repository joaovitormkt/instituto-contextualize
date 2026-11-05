// Capas do blog: geradas pela OpenAI ou buscadas em bancos de imagens livres
// (Openverse). As imagens ficam no Neon, porque a Vercel não guarda arquivos,
// e são servidas em /blog/imagem/:id.
const db = require('../db');

const LIMITE_BYTES = 4 * 1024 * 1024;

let _pronta = null;
function garantirTabela() {
  if (!_pronta) {
    _pronta = (async () => {
      await db.query(`CREATE TABLE IF NOT EXISTS blog_images (
        id SERIAL PRIMARY KEY,
        mime TEXT NOT NULL,
        data BYTEA NOT NULL,
        origem TEXT NOT NULL DEFAULT '',
        credito TEXT NOT NULL DEFAULT '',
        credito_url TEXT NOT NULL DEFAULT '',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await db.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_credit TEXT NOT NULL DEFAULT ''`);
      await db.query(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_credit_url TEXT NOT NULL DEFAULT ''`);
    })().catch((e) => {
      _pronta = null;
      throw e;
    });
  }
  return _pronta;
}

async function salvarImagem(buf, mime, { origem = '', credito = '', creditoUrl = '' } = {}) {
  await garantirTabela();
  const r = await db.query(
    'INSERT INTO blog_images (mime, data, origem, credito, credito_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [mime, buf, origem, credito.slice(0, 300), creditoUrl.slice(0, 500)],
  );
  return { url: `/blog/imagem/${r.rows[0].id}`, credito, credito_url: creditoUrl };
}

async function lerImagem(id) {
  await garantirTabela();
  const r = await db.query('SELECT mime, data FROM blog_images WHERE id = $1', [id]);
  return r.rows[0] || null;
}

async function credenciais() {
  const r = await db.query("SELECT key, value FROM system_settings WHERE key IN ('openai_api_key', 'openai_image_model')");
  const s = Object.fromEntries(r.rows.map((l) => [l.key, (l.value || '').trim()]));
  return { chave: s.openai_api_key || process.env.OPENAI_API_KEY || '', modelo: s.openai_image_model || process.env.OPENAI_IMAGE_MODEL || '' };
}

function promptDaCapa({ titulo, categoria, resumo }) {
  return `Fotografia editorial realista para a capa de um artigo de blog de uma clínica de psicologia no Brasil.
Tema do artigo: ${titulo}.${categoria ? ` Categoria: ${categoria}.` : ''}${resumo ? ` Contexto: ${resumo}` : ''}
Cena acolhedora e esperançosa que represente o tema de forma sutil, com luz natural, tons suaves e quentes, toques discretos de azul-marinho e dourado.
Se houver pessoas, que sejam brasileiras e diversas, com expressões serenas e naturais.
Evite estereótipos de sofrimento (nada de mãos na cabeça, choro, sombras dramáticas ou ambientes hospitalares frios).
Sem nenhum texto, letra, número, logotipo ou marca d'água. Composição horizontal, com o assunto principal centralizado.`;
}

// Gera a capa com a OpenAI. Tenta o modelo configurado e depois os padrões.
async function gerarComIA(dados, { timeoutMs = 100000 } = {}) {
  const { chave, modelo } = await credenciais();
  if (!chave) throw new Error('Chave da OpenAI não configurada.');
  const modelos = [...new Set([modelo, 'gpt-image-1-mini', 'gpt-image-1'].filter(Boolean))];
  let ultimoErro = null;
  for (const m of modelos) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { authorization: `Bearer ${chave}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: m, prompt: promptDaCapa(dados), size: '1536x1024', quality: 'medium', output_format: 'webp', output_compression: 82, n: 1 }),
        signal: ctrl.signal,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        ultimoErro = new Error(`OpenAI ${r.status}: ${d?.error?.message || 'erro ao gerar imagem'}`);
        // modelo inexistente ou sem acesso: tenta o próximo
        if ([400, 403, 404].includes(r.status)) continue;
        throw ultimoErro;
      }
      const b64 = d?.data?.[0]?.b64_json;
      if (!b64) throw new Error('A OpenAI não devolveu a imagem.');
      return salvarImagem(Buffer.from(b64, 'base64'), 'image/webp', { origem: `ia:${m}`, credito: 'Imagem gerada por IA' });
    } catch (e) {
      ultimoErro = e.name === 'AbortError' ? new Error('A geração da imagem demorou demais.') : e;
      if (e.name === 'AbortError') break;
    } finally {
      clearTimeout(t);
    }
  }
  throw ultimoErro || new Error('Não foi possível gerar a imagem.');
}

const NOME_LICENCA = (l, v) => (l === 'cc0' ? 'CC0' : l === 'pdm' ? 'Domínio público' : `CC ${String(l).toUpperCase()}${v ? ` ${v}` : ''}`);

// Busca fotos livres para uso comercial no Openverse (Flickr, Wikimedia, Rawpixel…).
async function buscarNaInternet(busca, quantidade = 12) {
  const q = String(busca || '').trim().slice(0, 120);
  if (!q) return [];
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${quantidade}&license_type=commercial&aspect_ratio=wide&mature=false&category=photograph`;
  const r = await fetch(url, { headers: { 'user-agent': 'InstitutoContextualize/1.0 (blog)' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`A busca de imagens respondeu ${r.status}. Tente de novo.`);
  const d = await r.json();
  return (d.results || [])
    .filter((i) => /^https:\/\//.test(i.url || ''))
    .map((i) => ({
      url: i.url,
      miniatura: i.thumbnail || i.url,
      titulo: i.title || '',
      credito: `Foto: ${i.creator || 'autor desconhecido'} (${NOME_LICENCA(i.license, i.license_version)}) via ${i.source || i.provider || 'Openverse'}`,
      credito_url: i.foreign_landing_url || i.url,
    }));
}

// Baixa a foto escolhida e guarda no banco, para não depender do site de origem.
async function importarDaInternet({ url, credito = '', credito_url = '' }) {
  if (!/^https:\/\//.test(String(url || ''))) throw new Error('Endereço de imagem inválido.');
  const r = await fetch(url, { headers: { 'user-agent': 'InstitutoContextualize/1.0 (blog)' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`Não foi possível baixar a imagem (${r.status}).`);
  const mime = (r.headers.get('content-type') || '').split(';')[0].trim();
  if (!/^image\/(jpeg|png|webp)$/.test(mime)) throw new Error('O arquivo encontrado não é uma imagem JPG, PNG ou WebP.');
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length || buf.length > LIMITE_BYTES) throw new Error('Imagem vazia ou grande demais (máx. 4 MB).');
  return salvarImagem(buf, mime, { origem: 'internet', credito, creditoUrl: credito_url });
}

// Capa automática para os artigos da IA: gera; se não der, busca na internet.
async function capaAutomatica({ titulo, categoria, resumo, buscaEn }) {
  try {
    return await gerarComIA({ titulo, categoria, resumo });
  } catch (e) {
    console.warn('[Capa] Geração por IA falhou, buscando na internet:', e.message);
  }
  try {
    const achadas = await buscarNaInternet(buscaEn || categoria || 'calm wellbeing', 5);
    for (const a of achadas) {
      try { return await importarDaInternet(a); } catch { /* tenta a próxima */ }
    }
  } catch (e) {
    console.warn('[Capa] Busca na internet falhou:', e.message);
  }
  return null;
}

module.exports = { garantirTabela, lerImagem, gerarComIA, buscarNaInternet, importarDaInternet, capaAutomatica };
