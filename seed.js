const bcrypt = require('bcryptjs');
const db = require('./db');
require('dotenv').config();

async function runSeed() {
  console.log('Iniciando seed no Neon PostgreSQL...');

  try {
    // 1. Criar usuário admin se não existir
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@contextualize.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(adminPassword, 10);

    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (userCheck.rows.length === 0) {
      await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['Administrador Instituto Contextualize', adminEmail, hash, 'admin']
      );
      console.log(`Admin criado: ${adminEmail}`);
    } else {
      console.log(`Admin já existente: ${adminEmail}`);
    }

    // 2. Inserir ou atualizar os profissionais existentes no site
    const defaultProfessionals = [
      {
        name: 'Renan Merlin Cuani',
        crp: 'CRP 06/130383',
        specialty: 'Psicologia Clínica Infantil / ACT / ABA',
        bio: 'Psicólogo pós-graduado em Terapia de Aceitação e Compromisso (ACT) e Análise do Comportamento Aplicada (ABA), mestre e doutorando em Psicologia pela UNESP. Atua há 10 anos com psicologia clínica infantil. Atualmente, também é professor universitário e pesquisador na área do autismo.',
        photo_url: 'Renan.jpeg',
        order_index: 1
      },
      {
        name: 'Pedro Henrique Felisberto de Nazareth',
        crp: 'CRP 06/206485',
        specialty: 'Neuropsicologia / ABA / NR-01',
        bio: 'Psicólogo pós-graduado em Neuropsicologia e Análise do Comportamento Aplicada (ABA). Atua como psicólogo clínico, avaliador neuropsicológico e na implementação da NR-01 em empresas.',
        photo_url: 'Pedro.jpeg',
        order_index: 2
      },
      {
        name: 'Paula Carvalho Ferrari',
        crp: 'CRP 06/204334',
        specialty: 'TEA / Deficiência Intelectual / NR-01',
        bio: 'Psicóloga pós-graduada em Análise do Comportamento Aplicada ao TEA e à deficiência intelectual. Atua como psicóloga clínica e na implementação da NR-01 em empresas.',
        photo_url: 'Paula.jpeg',
        order_index: 3
      },
      {
        name: 'Ana Carolina Merlin Ferreira',
        crp: 'CRP 06/158541',
        specialty: 'Neuropsicopedagogia / TEA / ABA',
        bio: 'Psicóloga pós-graduada em Neuropsicopedagogia Clínica e em Análise do Comportamento Aplicada ao autismo e à deficiência intelectual, mestranda em Psicologia pela UNESP. Atua com psicologia clínica infantil. Atualmente, também é professora universitária e pesquisador na área do autismo.',
        photo_url: 'Ana Carolina.jpeg',
        order_index: 4
      }
    ];

    for (const prof of defaultProfessionals) {
      const exists = await db.query('SELECT id FROM professionals WHERE name = $1', [prof.name]);
      if (exists.rows.length === 0) {
        await db.query(
          `INSERT INTO professionals (name, crp, specialty, bio, photo_url, order_index, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [prof.name, prof.crp, prof.specialty, prof.bio, prof.photo_url, prof.order_index]
        );
        console.log(`Profissional inserido: ${prof.name}`);
      }
    }

    // 3. Inserir Posts Iniciais no Blog
    const initialPosts = [
      {
        title: 'Como a Terapia de Aceitação e Compromisso (ACT) Transforma a Relação com a Ansiedade',
        slug: 'terapia-aceitacao-compromisso-act-ansiedade',
        excerpt: 'Entenda os princípios científicos da ACT e como ela capacita pacientes a viverem vidas valorosas e plenas mesmo na presença de desconfortos emocionais.',
        content: `A ansiedade é frequentemente vivida como uma inimiga a ser eliminada a todo custo. No entanto, abordagens contemporâneas da psicologia comportamental, em especial a **Terapia de Aceitação e Compromisso (ACT)**, propõem uma perspectiva revolucionária.\n\n### O que é a ACT?\nDesenvolvida a partir da Teoria das Molduras Relacionais (RFT), a ACT não foca na eliminação dos pensamentos e sentimentos difíceis, mas na modificação de como nos relacionamos com eles. O objetivo central é desenvolver **flexibilidade psicológica**.\n\n### Os Três Pilares da Flexibilidade Psicológica\n1. **Abertura:** Disposição para sentir emoções difíceis sem tentar controlá-las de forma destrutiva.\n2. **Presença:** Consciência do momento presente, praticando atenção plena e desfusão cognitiva.\n3. **Ação com Significado:** Identificar valores pessoais autênticos e agir de forma alinhada a eles no cotidiano.\n\nNo **Instituto Contextualize**, integramos rigor científico e cuidado humano para promover um desenvolvimento genuíno e sustentável.`,
        cover_image: 'Atendimento.jpeg',
        author_name: 'Renan Merlin Cuani',
        category: 'Terapia Comportamental',
        tags: ['ACT', 'Ansiedade', 'Saúde Mental', 'Psicologia Clínica'],
        relevance_score: 9.8,
        scheduled_for: '2026-10-05',
        status: 'published',
        seo_title: 'Terapia de Aceitação e Compromisso (ACT) para Ansiedade | Contextualize',
        seo_description: 'Descubra como a ACT auxilia no manejo da ansiedade com base em evidências científicas e flexibilidade psicológica.'
      },
      {
        title: 'A Importância da Avaliação Neuropsicológica no Diagnóstico Precoce do TEA',
        slug: 'importancia-avaliacao-neuropsicologica-tea',
        excerpt: 'Investigação aprofundada das funções cognitivas permite intervenções individualizadas e resultados mais significativos no desenvolvimento infantil.',
        content: `O diagnóstico precoce do Transtorno do Espectro Autista (TEA) é um dos fatores mais determinantes para o prognóstico favorável no desenvolvimento de crianças.\n\n### O Papel da Neuropsicologia\nA avaliação neuropsicológica mapeia detalhadamente áreas como atenção, linguagem, funções executivas, flexibilidade cognitiva e habilidades socioemocionais. Não se trata apenas de aplicar testes, mas de compreender o perfil único de cada indivíduo.\n\n### Benefícios Diretos do Diagnóstico Precoce:\n- **Intervenções estruturadas (ABA):** Ensino direcionado de habilidades sociais e comunicativas.\n- **Orientação familiar empática:** Ferramental prático para pais e cuidadores lidarem com as demandas da rotina.\n- **Adequação pedagógica:** Planejamento individualizado junto à equipe escolar.`,
        cover_image: 'Psychologist_and_patient_talking_202608131705.jpeg',
        author_name: 'Ana Carolina Merlin Ferreira',
        category: 'Neuropsicologia & TEA',
        tags: ['TEA', 'Neuropsicologia', 'Autismo', 'Infância'],
        relevance_score: 9.5,
        scheduled_for: '2026-10-06',
        status: 'published',
        seo_title: 'Avaliação Neuropsicológica no TEA | Instituto Contextualize',
        seo_description: 'Compreenda a relevância da avaliação neuropsicológica precoce no diagnóstico e suporte a indivíduos no espectro autista.'
      },
      {
        title: 'Saúde Mental Corporativa: O Impacto da NR-01 e Prevenção de Riscos Psicossociais',
        slug: 'saude-mental-corporativa-nr-01-riscos-psicossociais',
        excerpt: 'Como as recentes atualizações regulatórias transformam a gestão de riscos psicossociais em empresas modernas.',
        content: `A Norma Regulamentadora nº 1 (NR-01) passou a exigir uma atenção formal e sistemática aos riscos psicossociais presentes nos ambientes corporativos.\n\n### O que são Riscos Psicossociais?\nSobrecarga de trabalho, assédio, falta de autonomia e clima organizacional adverso são fatores diretamente associados a quadros de burnout, ansiedade e depressão entre colaboradores.\n\n### Como o Instituto Contextualize Atua:\nOferecemos consultoria técnica, diagnóstico de clima e treinamentos voltados para líderes e equipes, garantindo conformidade legal e ambientes psicologicamente seguros.`,
        cover_image: 'Formação.jpeg',
        author_name: 'Pedro Henrique Felisberto de Nazareth',
        category: 'Psicologia Organizacional',
        tags: ['NR-01', 'Saúde Mental no Trabalho', 'Burnout', 'Empresas'],
        relevance_score: 9.2,
        scheduled_for: '2026-10-07',
        status: 'published',
        seo_title: 'Gestão de Riscos Psicossociais e NR-01 | Instituto Contextualize',
        seo_description: 'Entenda as exigências da NR-01 para riscos psicossociais e como proteger o bem-estar psicológico na sua organização.'
      }
    ];

    for (const post of initialPosts) {
      const exists = await db.query('SELECT id FROM blog_posts WHERE slug = $1', [post.slug]);
      if (exists.rows.length === 0) {
        await db.query(
          `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, author_name, category, tags, relevance_score, scheduled_for, status, seo_title, seo_description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [post.title, post.slug, post.excerpt, post.content, post.cover_image, post.author_name, post.category, post.tags, post.relevance_score, post.scheduled_for, post.status, post.seo_title, post.seo_description]
        );
        console.log(`Post de blog inserido: ${post.title}`);
      }
    }

    // 4. Configurações do sistema
    const settings = [
      { key: 'openai_model', value: 'gpt-4o-mini', description: 'Modelo OpenAI utilizado para geração de posts' },
      { key: 'cron_schedule', value: '0 6 * * 1', description: 'Agendamento semanal: Toda segunda-feira às 06:00 (Brasília)' },
      { key: 'cron_enabled', value: 'true', description: 'Status da automação periódica' }
    ];

    for (const s of settings) {
      await db.query(
        `INSERT INTO system_settings (key, value, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [s.key, s.value, s.description]
      );
    }

    console.log('Seed concluído com absoluto sucesso no Neon!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  }
}

runSeed();
