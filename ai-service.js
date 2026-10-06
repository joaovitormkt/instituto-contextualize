const axios = require('axios');
const xml2js = require('xml2js');
const db = require('./db');

/**
 * Feeds RSS de Psicologia, Neurociência e Saúde Mental
 */
const NEWS_FEEDS = [
  { name: 'Medical News Today - Psychology', url: 'https://www.medicalnewstoday.com/categories/mental-health/rss.xml' },
  { name: 'ScienceDaily - Psychology', url: 'https://www.sciencedaily.com/rss/mind_brain/psychology.xml' },
  { name: 'ScienceDaily - Neuroscience', url: 'https://www.sciencedaily.com/rss/mind_brain/neuroscience.xml' },
  { name: 'Psychology Today', url: 'https://www.psychologytoday.com/us/front/feed' },
  { name: 'G1 Saúde Mental', url: 'https://g1.globo.com/rss/g1/saude/' }
];

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
  return 'gpt-4o-mini';
}

async function fetchNewsFeeds() {
  const collectedNews = [];
  const parser = new xml2js.Parser({ explicitArray: false });

  for (const feed of NEWS_FEEDS) {
    try {
      const response = await axios.get(feed.url, { timeout: 7000 });
      const result = await parser.parseStringPromise(response.data);
      const items = result.rss?.channel?.item || result.feed?.entry || [];
      const list = Array.isArray(items) ? items : [items];

      for (const item of list.slice(0, 8)) {
        if (item.title) {
          collectedNews.push({
            title: item.title,
            link: item.link?.href || item.link || '',
            description: (item.description || item.summary || '').replace(/<[^>]*>?/gm, '').slice(0, 300),
            pubDate: item.pubDate || item.published || '',
            source: feed.name
          });
        }
      }
    } catch (e) {
      // Falhas pontuais em feeds não interrompem a varredura
    }
  }

  return collectedNews;
}

function getNextWeekDays() {
  const dates = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilNextMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilNextMonday);

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * 1. REALIZA APENAS A VARREDURA DAS 20 NOTÍCIAS (Para o usuário visualizar e decidir/trocar)
 */
async function scanNewsOnly() {
  const apiKey = await getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('Chave da API OpenAI não configurada. Acesse o Painel > Configurações para cadastrá-la.');
  }

  const model = await getOpenAIModel();
  console.log(`[IA] Iniciando varredura preliminar de notícias com modelo ${model}...`);

  let preliminaryNews = [];
  try {
    preliminaryNews = await fetchNewsFeeds();
  } catch (e) {
    console.warn('[IA] Falha ao coletar feeds RSS:', e.message);
  }

  const promptSystem = `Você é um curador científico sênior do Instituto Contextualize (clínica de psicologia comportamental, ACT, ABA e neuropsicologia no Brasil).
Seu objetivo é:
1. Analisar notícias e desenvolvimentos recentes sobre Psicologia, Neurociência, Terapia Comportamental, TEA, NR-01/Saúde Mental Corporativa e Bem-estar.
2. Trazer uma lista de EXATAMENTE 20 notícias relevantes a nível global (priorizando o Brasil e relevância clínica).
3. Para cada uma das 20 notícias:
   - Atribuir uma nota rigorosa de 0 a 10 de relevância científica e interesse para psicologia.
   - Justificar de forma concisa por que recebeu essa nota.
   - Indicar a fonte ou veículo.
   - Marcar "recommended_for_post": true para as 5 com as maiores notas (as TOP 5 que você sugere transformar em post).

Responda ESTRITAMENTE em formato JSON:
{
  "all_20_news": [
    {
      "id": 1,
      "title": "Título claro e objetivo da notícia",
      "summary": "Resumo objetivo da notícia em 2 a 3 frases",
      "source": "Nome do portal / veículo",
      "relevance_score": 9.6,
      "score_justification": "Explicação do porquê desta nota",
      "category_suggestion": "Psicologia Clínica / ACT / Neuropsicologia / etc",
      "recommended_for_post": true
    }
  ]
}`;

  const userContent = `Notícias reais capturadas em feeds recentes:\n${JSON.stringify(preliminaryNews.slice(0, 25), null, 2)}\n\nPor favor, forneça as 20 notícias pontuadas e ranqueadas com justificativas.`;

  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model,
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: userContent }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 90000
    }
  );

  const parsed = JSON.parse(aiResponse.data.choices[0].message.content);
  const newsList = parsed.all_20_news || [];

  // Salvar no banco para persistência das últimas notícias encontradas
  await db.query(
    `INSERT INTO system_settings (key, value, description)
     VALUES ('latest_scanned_news', $1, 'Últimas 20 notícias pesquisadas pela IA')
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(newsList)]
  );

  await db.query(
    `INSERT INTO system_settings (key, value, description)
     VALUES ('last_ai_scan', $1, 'Data e hora da última varredura')
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [new Date().toISOString()]
  );

  return {
    status: 'success',
    news_count: newsList.length,
    news: newsList
  };
}

/**
 * 2. GERA ARTIGOS DENSOS E EXTENSOS A PARTIR DAS NOTÍCIAS SELECIONADAS PELO USUÁRIO
 */
async function generatePostsFromSelectedNews(selectedNews) {
  if (!selectedNews || selectedNews.length === 0) {
    throw new Error('Nenhuma notícia foi selecionada para geração de artigos.');
  }

  const apiKey = await getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('Chave da API OpenAI não configurada.');
  }

  const model = await getOpenAIModel();
  const weekDays = getNextWeekDays();
  const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];

  console.log(`[IA] Gerando artigos aprofundados para ${selectedNews.length} notícias selecionadas...`);

  const promptSystem = `Você é um curador e redator científico sênior do Instituto Contextualize (clínica de psicologia comportamental, neuropsicologia, ACT e ABA).
Para cada uma das notícias fornecidas pelo usuário, você deve redigir um ARTIGO DE BLOG EXTENSO, DENSO E COMPLETO (com no mínimo 1.200 a 1.800 palavras cada), com altíssimo rigor científico e valor para SEO.

DIRETRIZES OBRIGATÓRIAS PARA CADA ARTIGO:
- O conteúdo (campo "content") DEVE ser muito longo, aprofundado e rico em detalhes técnicos e clínicos:
  * Introdução histórica e epidemiológica ampla.
  * H2 para o panorama científico contemporâneo e o que os estudos clínicos comprovam.
  * H2 para a fundamentação conceitual (Análise do Comportamento, Teoria das Molduras Relacionais - RFT, Hexaflex da ACT, ou Neuropsicologia).
  * H2 para implicações práticas no cotidiano e na clínica (estratégias de manejo, treino de flexibilidade psicológica e exemplos aplicados).
  * H2 com orientações passo a passo para pacientes e familiares.
  * H2 / H3 com o posicionamento do Instituto Contextualize, enfatizando a psicoterapia baseada em evidências.
- Formatação em Markdown rico (listas, subtítulos H2/H3, destaques em negrito).

Responda ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "posts": [
    {
      "day_of_week": "Segunda-feira",
      "scheduled_date": "YYYY-MM-DD",
      "source_news_title": "Título da notícia de origem",
      "relevance_score": 9.5,
      "title": "Título atraente e profissional para o artigo",
      "slug": "slug-amigavel-para-seo",
      "excerpt": "Resumo detalhado de 3 a 4 frases",
      "content": "Artigo completo em Markdown com mais de 1.200 a 1.800 palavras.",
      "category": "Psicologia Clínica / ACT / etc.",
      "tags": ["Tag1", "Tag2", "Tag3"],
      "seo_title": "Título SEO com até 65 caracteres",
      "seo_description": "Meta description persuasiva com 140-160 caracteres",
      "seo_keywords": "palavra 1, palavra 2, psicologia contextualize"
    }
  ]
}`;

  const userContent = `Gere os artigos completos para as seguintes notícias selecionadas pelo gestor:\n${JSON.stringify(selectedNews, null, 2)}\n\nDatas previstas: ${weekDays.map((d, i) => `${dayNames[i] || 'Dia'}: ${d}`).join(', ')}.`;

  const aiResponse = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model,
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: userContent }
      ],
      temperature: 0.7,
      max_tokens: 16000,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
    }
  );

  const parsed = JSON.parse(aiResponse.data.choices[0].message.content);
  const posts = parsed.posts || [];
  let savedCount = 0;

  const coverImages = [
    'Psychologist_and_patient_talking_202608131705.jpeg',
    'Atendimento.jpeg',
    'Formação.jpeg',
    'Hero Contextualize.webp'
  ];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const scheduledDate = post.scheduled_date || weekDays[i] || new Date().toISOString().split('T')[0];

    // Gerar slug único
    let baseSlug = (post.slug || post.title)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const check = await db.query('SELECT id FROM blog_posts WHERE slug = $1', [finalSlug]);
      if (check.rows.length === 0) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const assignedCover = coverImages[i % coverImages.length];

    await db.query(
      `INSERT INTO blog_posts 
        (title, slug, excerpt, content, cover_image, author_name, category, tags, relevance_score, source_url, scheduled_for, status, seo_title, seo_description, seo_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12, $13, $14)`,
      [
        post.title,
        finalSlug,
        post.excerpt || '',
        post.content || '',
        assignedCover,
        'Instituto Contextualize',
        post.category || 'Psicologia',
        post.tags || ['Psicologia', 'Saúde Mental'],
        post.relevance_score || 9.0,
        post.source_news_title || '',
        scheduledDate,
        post.seo_title || post.title,
        post.seo_description || post.excerpt,
        post.seo_keywords || ''
      ]
    );
    savedCount++;
  }

  await logExecution('success', selectedNews.length, savedCount, {
    selected_news: selectedNews,
    generated_posts: posts.map(p => ({ title: p.title, score: p.relevance_score, date: p.scheduled_date }))
  }, null);

  return {
    status: 'success',
    posts_created: savedCount,
    posts
  };
}

/**
 * 3. EXECUTA VARREDURA COMPLETA E GERAÇÃO AUTOMÁTICA (CRON DAS SEGUNDAS)
 */
async function runNewsScanAndGenerate(manualTrigger = false) {
  const scanResult = await scanNewsOnly();
  const allNews = scanResult.news || [];
  
  // Pegar as 5 notícias recomendadas ou as 5 com maiores notas
  let top5 = allNews.filter(n => n.recommended_for_post);
  if (top5.length < 5) {
    top5 = [...allNews].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0)).slice(0, 5);
  }

  const genResult = await generatePostsFromSelectedNews(top5.slice(0, 5));

  return {
    status: 'success',
    news_scanned: allNews.length,
    posts_created: genResult.posts_created,
    posts: genResult.posts,
    all_news: allNews
  };
}

async function logExecution(status, scannedCount, selectedCount, rawJson, errorMsg) {
  try {
    await db.query(
      `INSERT INTO ai_generation_logs (status, news_scanned_count, selected_count, raw_news_json, error_message)
       VALUES ($1, $2, $3, $4, $5)`,
      [status, scannedCount, selectedCount, rawJson ? JSON.stringify(rawJson) : null, errorMsg]
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
  getOpenAIModel
};
