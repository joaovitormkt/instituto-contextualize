// Gerador semanal de pautas do blog (OpenAI Responses API com busca na web).
// Etapa 1: pesquisa o que está acontecendo em saúde mental, psicologia,
//          bem-estar e qualidade de vida e propõe 10 pautas com fatos e fontes.
// Etapa 2: escreve os artigos das pautas escolhidas em paralelo, só com os
//          fatos pesquisados. Tudo entra como rascunho, de segunda a sexta às
//          12h, e só vai ao ar depois de aprovado no painel.
const db = require('./db');
const { semanaDePublicacao, semanaISO } = require('./lib/blog-util');
const { garantirEsquema, slugLivre } = require('./lib/blog-posts');

const API = 'https://api.openai.com/v1/responses';
const raciocina = (m) => /^(gpt-5|o\d)/.test(m);

async function getOpenAIApiKey() {
  const result = await db.query("SELECT value FROM system_settings WHERE key = 'openai_api_key'");
  if (result.rows.length > 0 && result.rows[0].value) {
    return result.rows[0].value.trim();
  }
  return process.env.OPENAI_API_KEY || null;
}

async function getOpenAIModel() {
  const result = await db.query("SELECT value FROM system_settings WHERE key = 'openai_model'");
  if (result.rows.length > 0 && result.rows[0].value) {
    return result.rows[0].value.trim();
  }
  return process.env.OPENAI_MODEL || 'gpt-5-mini';
}

async function responder({ chave, modelo, input, schema, nome, busca = false, timeoutMs = 170000 }) {
  const corpo = {
    model: modelo,
    input,
    text: { format: { type: 'json_schema', name: nome, strict: true, schema } },
  };
  if (busca) corpo.tools = [{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', country: 'BR', region: 'São Paulo', city: 'Botucatu' } }];
  if (raciocina(modelo)) corpo.reasoning = { effort: 'low' };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(API, {
      method: 'POST',
      headers: { authorization: `Bearer ${chave}`, 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${dados?.error?.message || 'erro desconhecido'}`);
    const texto = (dados.output || [])
      .filter((o) => o.type === 'message')
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text)
      .join('');
    if (!texto) throw new Error('A OpenAI não devolveu texto.');
    return JSON.parse(texto);
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('A OpenAI demorou demais para responder. Tente de novo.');
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function credenciais() {
  const chave = await getOpenAIApiKey();
  if (!chave) throw new Error('Chave da API OpenAI não configurada. Acesse o Painel > Configurações para cadastrá-la.');
  return { chave, modelo: await getOpenAIModel() };
}

const CATEGORIAS = [
  'Saúde Mental', 'Psicologia', 'Bem-estar', 'Qualidade de Vida', 'Relacionamentos',
  'Infância e Família', 'Saúde Mental no Trabalho', 'Neurociência',
];

const SCHEMA_PAUTAS = {
  type: 'object',
  additionalProperties: false,
  required: ['pautas'],
  properties: {
    pautas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'summary', 'angulo', 'por_que_agora', 'publico', 'fatos', 'fontes', 'tags', 'category_suggestion', 'relevance_score', 'score_justification'],
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          angulo: { type: 'string' },
          por_que_agora: { type: 'string' },
          publico: { type: 'string' },
          fatos: { type: 'array', items: { type: 'string' } },
          fontes: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, required: ['titulo', 'url'], properties: { titulo: { type: 'string' }, url: { type: 'string' } } },
          },
          tags: { type: 'array', items: { type: 'string' } },
          category_suggestion: { type: 'string', enum: CATEGORIAS },
          relevance_score: { type: 'number' },
          score_justification: { type: 'string' },
        },
      },
    },
  },
};

const SCHEMA_POST = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'resumo', 'corpo_markdown', 'tags', 'seo_title', 'seo_description'],
  properties: {
    titulo: { type: 'string' },
    resumo: { type: 'string' },
    corpo_markdown: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    seo_title: { type: 'string' },
    seo_description: { type: 'string' },
  },
};

const SOBRE = `O Instituto Contextualize é uma clínica de psicologia em Botucatu (SP), com atendimento presencial e online. A equipe trabalha com psicologia baseada em evidências: Terapia de Aceitação e Compromisso (ACT), Análise do Comportamento Aplicada (ABA), avaliação neuropsicológica, atendimento infantil e de pessoas com TEA, e programas de saúde mental para empresas (NR-01, riscos psicossociais). O público do blog são adultos, pais e mães, profissionais e gestores que leem no celular e querem entender e cuidar melhor da saúde mental, do bem-estar e da qualidade de vida.`;

const CUIDADOS = `Cuidados obrigatórios (saúde mental é tema sensível):
- Não faça diagnóstico, não prometa cura e não recomende medicação, doses ou suspensão de remédios.
- Nunca invente estudos, números, autores ou instituições: use só os fatos fornecidos. Se citar um dado, ele precisa estar nos fatos.
- Linguagem acolhedora, sem estigma e sem culpar a pessoa. Evite termos como "louco", "surtado", "bipolar" como adjetivo.
- Se o tema tocar em suicídio, automutilação ou crise, siga as recomendações de comunicação responsável (sem detalhar métodos) e inclua: em caso de crise, ligue 188 (CVV, 24 horas, gratuito) ou procure o SAMU (192) ou o pronto-socorro mais próximo.
- Deixe claro, quando fizer sentido, que o conteúdo é informativo e não substitui o acompanhamento com um profissional.`;

/**
 * 1. PESQUISA AS PAUTAS DA SEMANA (para o gestor ver e escolher)
 */
async function scanNewsOnly() {
  const ia = await credenciais();
  const recentes = (await db.query('SELECT title FROM blog_posts ORDER BY created_at DESC LIMIT 40')).rows.map((p) => p.title);
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'long' });
  console.log(`[IA] Pesquisando pautas na web com ${ia.modelo}...`);

  const r = await responder({
    ...ia,
    nome: 'pautas',
    schema: SCHEMA_PAUTAS,
    busca: true,
    input: [
      { role: 'system', content: `Você é editor de conteúdo de um blog de saúde mental e bem-estar no Brasil. ${SOBRE}` },
      {
        role: 'user',
        content: `Hoje é ${hoje}. Pesquise na web o que está acontecendo AGORA (últimos 30 dias, de preferência) e é relevante para esse público: estudos e pesquisas recentes em psicologia e saúde mental; dados e levantamentos no Brasil (Ministério da Saúde, Fiocruz, OMS, OPAS, IBGE, CFP); campanhas e datas do calendário de saúde (ex.: Janeiro Branco, Setembro Amarelo, Dia Mundial da Saúde Mental, Novembro Azul e saúde mental masculina); saúde mental no trabalho, burnout e NR-01; infância, adolescência, telas e redes sociais; TEA e neurodiversidade; sono, estresse, ansiedade, luto, relacionamentos; hábitos de bem-estar e qualidade de vida com base científica; e assuntos da época do ano.

Proponha exatamente 10 pautas diferentes entre si, úteis para o dia a dia de quem lê, com um ângulo prático e humano. Misture: pelo menos 2 ligadas a estudo ou dado recente, 2 guias práticos de autocuidado ou bem-estar, 1 sobre infância ou família, 1 sobre saúde mental no trabalho e 1 ligada a campanha ou data do período (se houver).

Para cada pauta traga fatos verificáveis encontrados na busca e as URLs das fontes (só fontes reais que você consultou, de preferência instituições, universidades, revistas científicas e veículos de imprensa confiáveis). Não invente números, estudos ou citações.

Dê uma nota de 0 a 10 (relevance_score) considerando atualidade, solidez das fontes e utilidade para o público, e justifique em uma frase. Ordene da maior para a menor nota.

Evite repetir estes temas já publicados: ${recentes.length ? recentes.map((t) => `"${t}"`).join('; ') : 'nenhum'}.

Escreva em português do Brasil. summary: 2 a 3 frases. Tags: 2 a 4 palavras curtas.`,
      },
    ],
  });

  const pautas = (r.pautas || [])
    .slice(0, 10)
    .map((p) => ({
      ...p,
      relevance_score: Math.max(0, Math.min(10, Number(p.relevance_score) || 0)),
      fontes: (p.fontes || []).filter((f) => /^https?:\/\//.test(f.url)).slice(0, 8),
      source: (() => { try { return new URL(p.fontes?.[0]?.url).hostname.replace(/^www\./, ''); } catch { return ''; } })(),
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .map((p, i) => ({ ...p, id: i + 1, recommended_for_post: i < 5 }));
  if (!pautas.length) throw new Error('A pesquisa não trouxe pautas. Tente de novo.');

  await db.query(
    `INSERT INTO system_settings (key, value, description)
     VALUES ('latest_scanned_news', $1, 'Últimas pautas pesquisadas pela IA')
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(pautas)],
  );
  await db.query(
    `INSERT INTO system_settings (key, value, description)
     VALUES ('last_ai_scan', $1, 'Data e hora da última varredura')
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [new Date().toISOString()],
  );

  return { status: 'success', news_count: pautas.length, news: pautas };
}

async function escreverPost(ia, pauta) {
  return responder({
    ...ia,
    nome: 'post',
    schema: SCHEMA_POST,
    timeoutMs: 120000,
    input: [
      {
        role: 'system',
        content: `Você escreve para o blog do Instituto Contextualize. ${SOBRE}
Tom: acolhedor, claro e confiável, como uma psicóloga experiente conversando com quem lê. Frases curtas, sem jargão desnecessário (quando usar um termo técnico, explique). Sem travessões (—): use vírgula, ponto ou dois-pontos.
${CUIDADOS}`,
      },
      {
        role: 'user',
        content: `Escreva um artigo a partir desta pauta.

Título sugerido: ${pauta.title}
Ângulo: ${pauta.angulo || pauta.summary || ''}
Por que agora: ${pauta.por_que_agora || ''}
Público: ${pauta.publico || ''}
Fatos (com base em fontes):
${(pauta.fatos || [pauta.summary]).filter(Boolean).map((f) => `- ${f}`).join('\n')}

Formato:
- titulo: até 70 caracteres, específico e humano, sem clickbait e sem sensacionalismo.
- resumo: 1 a 2 frases, até 160 caracteres, para a listagem e o Google.
- corpo_markdown: 800 a 1.200 palavras em markdown. Comece com um parágrafo de abertura (sem título). Use 3 a 5 subtítulos "## ", listas quando ajudarem (por exemplo, sinais de alerta ou passos práticos) e uma seção "## Quando procurar ajuda". Feche com um parágrafo convidando, sem pressão, a conversar com a equipe do Instituto Contextualize (presencial em Botucatu ou online). Não inclua a lista de fontes no corpo.
- tags: 2 a 4.
- seo_title: até 60 caracteres.
- seo_description: 140 a 160 caracteres.`,
      },
    ],
  });
}

const CAPAS = [
  'Psychologist_and_patient_talking_202608131705.jpeg',
  'Atendimento.jpeg',
  'Formação.jpeg',
  'Hero Contextualize.webp',
];

/**
 * 2. ESCREVE OS ARTIGOS DAS PAUTAS ESCOLHIDAS (em paralelo)
 */
async function generatePostsFromSelectedNews(selectedNews, { origem = 'painel' } = {}) {
  if (!selectedNews || selectedNews.length === 0) {
    throw new Error('Nenhuma pauta foi selecionada para geração de artigos.');
  }
  await garantirEsquema();
  const ia = await credenciais();
  const pautas = selectedNews.slice(0, 10);
  const datas = semanaDePublicacao();
  const lote = semanaISO(datas[0]);
  console.log(`[IA] Escrevendo ${pautas.length} artigo(s) para o lote ${lote}...`);

  // Datas da semana que ainda não têm artigo da IA neste lote.
  const ocupadas = new Set(
    (await db.query(`SELECT scheduled_for FROM blog_posts WHERE batch = $1 AND scheduled_for IS NOT NULL`, [lote])).rows
      .map((r) => new Date(r.scheduled_for).toISOString()),
  );
  const livres = datas.filter((d) => !ocupadas.has(d.toISOString()));

  const escritos = await Promise.allSettled(pautas.map((p) => escreverPost(ia, p)));
  const criados = [];
  for (let i = 0; i < pautas.length; i++) {
    const pauta = pautas[i];
    const res = escritos[i];
    if (res.status !== 'fulfilled') continue;
    const post = res.value;
    const titulo = String(post.titulo || pauta.title).trim().slice(0, 160);
    const slug = await slugLivre(titulo);
    const fontes = (pauta.fontes || []).filter((f) => /^https?:\/\//.test(f?.url || '')).slice(0, 8)
      .map((f) => ({ titulo: String(f.titulo || '').slice(0, 200), url: String(f.url).slice(0, 500) }));
    const tags = (post.tags?.length ? post.tags : pauta.tags || []).map((t) => String(t).slice(0, 40)).slice(0, 4);
    const data = livres[criados.length] || null; // sem dia livre na semana: fica sem data até alguém agendar
    const capa = CAPAS[(Number(lote.slice(-2)) * 5 + criados.length) % CAPAS.length];
    const r = await db.query(
      `INSERT INTO blog_posts
        (title, slug, excerpt, content, cover_image, cover_alt, author_name, category, tags, relevance_score, source_url,
         scheduled_for, status, seo_title, seo_description, seo_keywords, sources, origin, batch)
       VALUES ($1, $2, $3, $4, $5, $6, 'Instituto Contextualize', $7, $8, $9, $10, $11, 'draft', $12, $13, $14, $15::jsonb, 'ia', $16)
       RETURNING id, title, scheduled_for`,
      [
        titulo,
        slug,
        String(post.resumo || pauta.summary || '').slice(0, 320),
        String(post.corpo_markdown || ''),
        capa,
        'Imagem ilustrativa do Instituto Contextualize',
        CATEGORIAS.includes(pauta.category_suggestion) ? pauta.category_suggestion : 'Saúde Mental',
        tags,
        Number(pauta.relevance_score) || null,
        fontes[0]?.url || '',
        data ? data.toISOString() : null,
        String(post.seo_title || titulo).slice(0, 70),
        String(post.seo_description || post.resumo || '').slice(0, 170),
        tags.join(', '),
        JSON.stringify(fontes),
        lote,
      ],
    );
    criados.push(r.rows[0]);
  }

  const falhas = escritos.filter((e) => e.status === 'rejected').map((e) => e.reason?.message).filter(Boolean);
  const detalhe = `${criados.length} de ${pautas.length} artigos criados.${falhas.length ? ` Falhas: ${falhas.join(' | ').slice(0, 800)}` : ''}`;
  await logExecution(criados.length ? 'success' : 'error', pautas.length, criados.length, {
    lote,
    origem,
    pautas: pautas.map((p) => ({ title: p.title, score: p.relevance_score, fontes: p.fontes })),
    criados,
  }, falhas.length ? detalhe : null);
  if (!criados.length) throw new Error(detalhe);

  return { status: 'success', lote, posts_created: criados.length, posts: criados, message: detalhe };
}

/**
 * 3. ROTINA COMPLETA (cron das segundas ou botão "Gerar direto"):
 *    pesquisa e escreve as 5 pautas mais bem avaliadas.
 *    No cron, não repete se a semana já foi gerada.
 */
async function runNewsScanAndGenerate(manualTrigger = false) {
  await garantirEsquema();
  const lote = semanaISO(semanaDePublicacao()[0]);
  if (!manualTrigger) {
    const ja = await db.query(`SELECT COUNT(*)::int AS n FROM blog_posts WHERE batch = $1 AND origin = 'ia'`, [lote]);
    if (ja.rows[0].n > 0) {
      return { status: 'skipped', lote, news_scanned: 0, posts_created: 0, message: `Os artigos da semana ${lote} já foram gerados.` };
    }
  }

  let scan;
  try {
    scan = await scanNewsOnly();
  } catch (e) {
    await logExecution('error', 0, 0, { lote }, e.message);
    throw e;
  }
  const top5 = scan.news.filter((n) => n.recommended_for_post).slice(0, 5);
  const gen = await generatePostsFromSelectedNews(top5, { origem: manualTrigger ? 'painel' : 'cron' });

  return {
    status: 'success',
    lote,
    news_scanned: scan.news.length,
    posts_created: gen.posts_created,
    posts: gen.posts,
    all_news: scan.news,
  };
}

async function logExecution(status, scannedCount, selectedCount, rawJson, errorMsg) {
  try {
    await db.query(
      `INSERT INTO ai_generation_logs (status, news_scanned_count, selected_count, raw_news_json, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [status, scannedCount, selectedCount, rawJson ? JSON.stringify(rawJson) : null, errorMsg],
    );
  } catch (e) {
    console.error('Erro ao salvar log de execução no Neon:', e.message);
  }
}

module.exports = {
  scanNewsOnly,
  generatePostsFromSelectedNews,
  runNewsScanAndGenerate,
  getOpenAIApiKey,
  getOpenAIModel,
};
