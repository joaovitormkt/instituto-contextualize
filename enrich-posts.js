const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const enrichedArticles = [
  {
    id: 1,
    title: 'Como a Terapia de Aceitação e Compromisso (ACT) Transforma a Relação com a Ansiedade',
    slug: 'terapia-aceitacao-compromisso-act-ansiedade',
    excerpt: 'Compreenda a fundo os seis processos do modelo Hexaflex da ACT e aprenda como a flexibilidade psicológica substitui a esquiva experiencial, permitindo uma vida rica e com significado mesmo diante da ansiedade.',
    content: `
A ansiedade é frequentemente descrita por quem a experiencia como um sinal de alarme que nunca se desliga. No modelo biomédico tradicional e na cultura contemporânea, a reação mais comum é tentar silenciar esse alarme a todo custo: lutar contra os pensamentos intrusivos, evitar situações desafiadoras, recorrer a distrações constantes ou buscar uma sensação artificial de controle. No entanto, pesquisas consistentes na Análise do Comportamento mostram que quanto mais tentamos suprimir pensamentos e sentimentos desconfortáveis, mais fortes eles tendem a retornar. É exatamente nesse ponto crucial que a **Terapia de Aceitação e Compromisso (ACT)** revoluciona a prática clínica.

---

## 1. O Paradoxo do Controle e a Esquiva Experiencial

Na perspectiva da ACT — uma das principais representantes da chamada *Terceira Onda das Terapias Comportamentais e Cognitivas* —, o sofrimento psicológico não decorre primariamente da presença da ansiedade em si, mas sim do padrão crônico de **esquiva experiencial**. 

A esquiva experiencial ocorre quando um indivíduo não está disposto a permanecer em contato com experiências privadas desconfortáveis (como taquicardia, aperto no peito, medo de falhar ou pensamentos de vulnerabilidade) e toma medidas urgentes para alterar a forma ou a frequência desses eventos, mesmo que isso custe valores importantes de sua vida:

* **Restrição de repertório:** Deixar de apresentar um projeto no trabalho por medo do julgamento alheio.
* **Isolamento interpessoal:** Recusar convites de amigos ou eventos sociais para evitar o desconforto da timidez.
* **Comportamento governado por regras rígidas:** Agir exclusivamente sob o comando de crenças autoimpostas como *"só posso agir quando me sentir 100% confiante"*.

O paradoxo fundamental reside no fato de que o controle deliberado sobre eventos privados funciona bem no mundo externo (se não gosto de uma parede, posso pintá-la; se a chuva me molha, abro um guarda-chuva), mas falha dramaticamente no mundo interno da linguagem e das sensações somáticas. Tentar "não pensar em ansiedade" exige monitorar se estamos pensando nela, reativando o próprio circuito do medo.

---

## 2. O Modelo Hexaflex: Os 6 Pilares da Flexibilidade Psicológica

O objetivo central da ACT não é a remissão forçada dos sintomas de ansiedade, mas sim o desenvolvimento da **Flexibilidade Psicológica**: a habilidade de entrar em contato com o momento presente, de forma consciente e aberta, e orientar ou persistir no comportamento de acordo com valores escolhidos.

O modelo clínico da ACT organiza-se através do Hexaflex, composto por seis processos interligados:

### A. Desfusão Cognitiva
Aprender a observar os pensamentos como eventos verbais passageiros (palavras, imagens e histórias produzidas pela mente), em vez de verdades literais ou ordens inquestionáveis. Quando a mente diz *"Você vai travar e fazer papel de ridículo"*, a desfusão ensina a reconhecer: *"Percebo que minha mente está produzindo uma história sobre falha"*.

### B. Aceitação
Não significa resignação passiva, conformismo ou tolerar com amargura. Aceitação na ACT é uma postura ativa de **abertura voluntária** para abrir espaço às sensações difíceis, sem tentar lutar ou fugir delas, permitindo que elas existam enquanto realizamos o que é genuinamente importante.

### C. Contato com o Momento Presente (Mindfulness)
A ansiedade quase invariavelmente projeta o indivíduo para cenários futuros catastróficos. O treino de atenção flexível e focada ancora a pessoa no "aqui e agora", através da percepção consciente dos sentidos e do ambiente real.

### D. Self-como-Contexto (O Eu Observador)
Diferenciar o "conteúdo" da experiência (as emoções, os rótulos diagnósticos, as lembranças) do "palco" ou horizonte consciente que contém tudo isso. O indivíduo compreende que é maior do que suas crises ou pensamentos ansiosos.

### E. Clareza de Valores
Valores não são metas a serem riscadas de uma lista; são direções globais de vida que definem quem você quer ser e como deseja transitar pelo mundo (ex: ser um parceiro presente, cultivar a curiosidade intelectual, ser corajoso na defesa de princípios).

### F. Ação com Compromisso
A tradução concreta dos valores em metas e comportamentos públicos observáveis. É a prática de dar passos efetivos na direção do que importa, mesmo acompanhado de frio na barriga ou incertezas.

---

## 3. Da Teoria à Prática Clínica: O Papel da Teoria das Molduras Relacionais (RFT)

A base científica da ACT é sustentada pela **Teoria das Molduras Relacionais (Relational Frame Theory - RFT)**, um programa experimental robusto sobre a linguagem humana e cognição. A RFT demonstra como os seres humanos são capazes de derivar relações entre estímulos arbitrariamente. 

Por causa da linguagem, uma palavra como "hospital" ou uma simples memória pode eliciar as mesmas respostas fisiológicas de perigo que um predador real. Na clínica contextual, os psicólogos do Instituto Contextualize utilizam metáforas ricas e exercícios experienciais para desarmar armadilhas verbais e ampliar o repertório comportamental dos pacientes.

---

## 4. Estratégias Práticas para o Cotidiano

Para quem convive com picos de ansiedade no dia a dia, a ACT oferece ferramentas de autorregulação e ancoragem:

1. **Nomear o processo:** Diga a si mesmo: *"Obrigado, mente, por mais essa previsão de perigo para tentar me proteger, mas eu escolho seguir adiante"*.
2. **Exercício de Aterrissagem (Técnica dos 5 Sentidos):** Nomeie 5 coisas que você vê, 4 que pode tocar, 3 sons que ouve, 2 cheiros no ambiente e 1 respiração profunda consciente.
3. **A Pergunta dos Valores:** Diante de uma decisão paralisada pela ansiedade, pergunte-se: *"Se a ansiedade não fosse um obstáculo intransponível hoje, que atitude corajosa eu tomaria nesta situação?"*.

---

## 5. Como o Instituto Contextualize Aborda o Tratamento da Ansiedade

No **Instituto Contextualize**, em Botucatu e com atendimento online em todo o território nacional, não encaramos a ansiedade como um inimigo a ser exterminado, mas como uma resposta humana legítima que, quando desregulada ou associada à esquiva, empobrece a trajetória do indivíduo.

Nossa equipe combina a fundamentação teórica sólida da Análise do Comportamento Aplicada com a sensibilidade e profundidade da ACT, desenhando planos de intervenção estritamente individualizados e mensuráveis. Viver bem não é viver sem ansiedade: é construir uma vida com sentido onde a ansiedade não tem a palavra final.
`
  },
  {
    id: 2,
    title: 'A Importância da Avaliação Neuropsicológica no Diagnóstico Precoce do TEA',
    slug: 'importancia-avaliacao-neuropsicologica-tea',
    excerpt: 'Descubra como a investigação aprofundada das funções neurocognitivas permite identificar marcadores sutis do Transtorno do Espectro Autista, estruturando intervenções clínicas assertivas nos primeiros anos de desenvolvimento.',
    content: `
O diagnóstico do **Transtorno do Espectro Autista (TEA)** tem passado por avanços expressivos na última década, impulsionado por pesquisas em neurobiologia do desenvolvimento, psicologia comportamental e métodos neuropsicológicos refinados. Identificar características atípicas no desenvolvimento infantil o mais cedo possível não se trata apenas de fornecer um laudo diagnóstico, mas de abrir uma janela terapêutica singular proporcionada pela neuroplasticidade cerebral nos primeiros anos de vida.

Nesse cenário, a **Avaliação Neuropsicológica** destaca-se como um dos pilares mais consistentes para mapear não apenas as dificuldades, mas também o perfil único de potenciais de cada indivíduo.

---

## 1. O que é a Avaliação Neuropsicológica e por que ela é indispensável?

A neuropsicologia clínica investiga a complexa interface entre o funcionamento do sistema nervoso central e os processos cognitivos, emocionais e comportamentais. Enquanto uma consulta médica ou psiquiátrica costuma coletar histórico clínico e observações pontuais, a avaliação neuropsicológica submete as diferentes funções a uma bateria sistemática de instrumentos padronizados, testes ecológicos e sessões de observação comportamental direta.

No contexto do TEA, a avaliação vai muito além dos critérios diagnósticos do DSM-5-TR e da CID-11. Ela busca responder:
* Como a criança processa estímulos sensoriais e linguísticos?
* Qual é a eficiência de suas funções executivas (controle inibitório, flexibilidade cognitiva, memória operacional)?
* De que forma ela compreende e responde a pistas sociais e estados mentais de outros indivíduos (Teoria da Mente)?
* Quais são suas habilidades intelectuais verbais versus não verbais?

---

## 2. A Neuroplasticidade e o Valor da Intervenção Precoce

O cérebro humano passa por um período crítico de proliferação e poda sináptica durante a primeira infância. Durante essa fase, as conexões neurais são especialmente moldáveis em resposta aos estímulos ambientais e contingências de reforçamento.

Quando uma criança no espectro autista é avaliada e recebe um direcionamento terapêutico individualizado antes dos 3 ou 4 anos de idade, a curva de desenvolvimento da linguagem funcional, comunicação social e autonomia diária é substancialmente potencializada. Esperar pelo desenvolvimento espontâneo ou adiar a investigação diagnóstica costuma cristalizar repertórios de rigidez comportamental e barreiras na aquisição de repertórios verbais básicos.

---

## 3. Principais Domínios Neurocognitivos Investigados no Espectro

Uma avaliação neuropsicológica abrangente no Instituto Contextualize investiga domínios essenciais:

### A. Atenção Compartilhada e Orientação Social
A habilidade de seguir o olhar de um parceiro de comunicação, coordenar o contato visual e apontar para compartilhar interesse (e não apenas para pedir objetos) é um dos primeiros e mais fiéis marcadores precoces do TEA.

### B. Funções Executivas e Rigidez Comportamental
Dificuldades na transição entre atividades, interesses restritos e insistência em mesmices estão intimamente ligados à flexibilidade cognitiva e ao controle inibitório. A avaliação mensura com precisão em quais subcomponentes executivos a criança encontra maiores desafios.

### C. Teoria da Mente e Cognição Social
A capacidade de inferir desejos, emoções, intenções e crenças dos outros é fundamental para a navegação interpessoal. A avaliação detecta nuances e graus de suporte necessários nesse domínio.

### D. Perfil de Linguagem Receptiva e Expressiva
Mapeamento de vocabulário, compreensão de sentenças complexas, pragmática do discurso (uso social da linguagem) e presença de ecolalia ou estereotipias vocais.

---

## 4. O Laudo Neuropsicológico como Guia para o Tratamento (ABA e Escola)

O produto final de uma avaliação neuropsicológica séria não deve ser um documento estático engavetado. Pelo contrário: ele constitui um **mapa de intervenção** prático que orienta diretamente:

1. **A equipe multidisciplinar (Terapeutas ABA, Fonoaudiólogos, Terapeutas Ocupacionais):** Definindo objetivos prioritários no Plano de Ensino Individualizado (PEI).
2. **A escola e os educadores:** Sugerindo adaptações curriculares, manejo sensorial em sala de aula e estratégias de inclusão baseadas em pistas visuais.
3. **A família:** Capacitando os pais com estratégias de comunicação, organização de rotinas previsíveis e redução de comportamentos disruptivos.

---

## 5. Abordagem Especializada do Instituto Contextualize

No **Instituto Contextualize**, os processos avaliativos são conduzidos por neuropsicólogas pós-graduadas com vasta experiência em Análise do Comportamento Aplicada (ABA) e desenvolvimento infantil atípico. 

Adotamos um olhar humanizado e rigorosamente fundamentado em evidências, acolhendo as angústias familiares e oferecendo devolutivas claras, detalhadas e com planos de ação práticos para que cada criança alcance sua plenitude de desenvolvimento e autonomia.
`
  },
  {
    id: 3,
    title: 'Saúde Mental Corporativa: O Impacto da NR-01 e Prevenção de Riscos Psicossociais',
    slug: 'saude-mental-corporativa-nr-01-riscos-psicossociais',
    excerpt: 'Entenda os impactos das novas diretrizes da Norma Regulamentadora 01 no gerenciamento de riscos psicossociais no trabalho e como empresas inovadoras estão integrando saúde mental à estratégia corporativa.',
    content: `
A discussão sobre saúde mental no ambiente corporativo deixou de ser um tópico acessório de responsabilidade social ou uma campanha pontual no mês de setembro para se consolidar como uma prioridade estratégica, operacional e jurídica para organizações de todos os portes. Com a atualização das diretrizes da **Norma Regulamentadora nº 01 (NR-01)** pelo Ministério do Trabalho e Emprego, os fatores de riscos psicossociais ganharam protagonismo explícito no Programa de Gerenciamento de Riscos (PGR).

Ignorar o impacto do clima organizacional, da sobrecarga crônica e da liderança tóxica não é mais apenas uma falha de gestão: tornou-se um passivo trabalhista concreto com sérias implicações legais e financeiras.

---

## 1. O que são Riscos Psicossociais no Trabalho?

Os riscos psicossociais decorrem do desenho, organização e gestão do trabalho, bem como de seus contextos sociais e ambientais, com potencial de causar danos psicológicos, físicos ou sociais aos colaboradores. Ao contrário de um piso escorregadio ou de uma máquina sem proteção física, os fatores psicossociais atuam de forma silenciosa e cumulativa:

* **Sobrecarga quantitativa e qualitativa:** Exigências desproporcionais de produtividade, metas inatingíveis e prazos irreais sem suporte adequado.
* **Falta de autonomia e controle:** Colaboradores altamente qualificados submetidos a microgestão excessiva e sem poder de decisão sobre seus processos.
* **Clima de hostilidade e assédio moral:** Relações de poder abusivas, humilhações veladas, isolamento de colaboradores e falta de canais seguros de denúncia.
* **Ambiguidade de papéis:** Ausência de clareza sobre funções, expectativas e responsabilidades.
* **Desequilíbrio entre esforço e recompensa:** Sensação recorrente de injustiça distributiva e falta de reconhecimento profissional.

---

## 2. A NR-01 e o Gerenciamento Contínuo de Riscos (PGR)

A NR-01 estabelece as disposições gerais e o campo de aplicação das normas de segurança e saúde no trabalho. Em suas diretrizes modernizadas, a norma determina que o empregador deve:

1. **Identificar os perigos e possíveis lesões:** O que inclui explicitamente avaliar o estresse crônico, burnout, transtornos de ansiedade e depressão relacionados à organização laboral.
2. **Avaliar os riscos:** Mensurar a probabilidade e a severidade dos danos decorrentes das condições do ambiente de trabalho.
3. **Implementar planos de controle e prevenção:** Não basta oferecer palestras motivacionais esporádicas; exige-se um plano de ação sistemático, com indicadores mensuráveis e revisões periódicas integradas aos laudos ocupacionais (PGR / PCMSO).

---

## 3. Síndrome de Burnout como Doença Ocupacional (CID-11)

A inclusão do Burnout como fenômeno estritamente ligado ao emprego ou desemprego na Classificação Internacional de Doenças (CID-11 sob o código QD85) mudou as regras do jogo jurídico no Brasil. Os tribunais trabalhistas têm reconhecido reiteradamente o nexo de causalidade entre rotinas organizacionais predatórias e o adoecimento dos colaboradores, resultando em:

* Estabilidade provisória de emprego pós-afastamento previdenciário;
* Indenizações por danos morais individuais e coletivos;
* Aumento de tributos incidentes sobre a folha de pagamento via Fator Acidentário de Prevenção (FAP).

Empresas maduras já compreenderam que investir em programas preventivos é incomparavelmente mais econômico e eficiente do que arcar com litígios, turnover acelerado e absenteísmo.

---

## 4. Pilares de um Programa Estruturado de Saúde Mental nas Organizações

Para cumprir as exigências da NR-01 e genuinamente promover segurança psicológica, o Instituto Contextualize recomenda uma abordagem em três níveis:

### A. Nível Primário: Intervenção Organizacional
Ajuste das cargas de trabalho, revisão de metas, redesenho de processos operacionais e, principalmente, **treinamento comportamental de líderes**. Líderes despreparados são os principais deflagradores de crises de ansiedade em suas equipes.

### B. Nível Secundário: Treinamento e Educação em Saúde Mental
Capacitação dos colaboradores em gestão de estresse baseada em evidências, técnicas de flexibilidade psicológica e psicoeducação para desmistificar preconceitos e identificar sinais precoces de exaustão em colegas.

### C. Nível Terciário: Suporte e Encaminhamento Clínico
Disponibilização de canais confidenciais de apoio psicológico, acolhimento de crises e parcerias com clínicas especializadas para atendimento psicoterápico focado em resultados.

---

## 5. Como o Instituto Contextualize Apoia as Organizações

O **Instituto Contextualize** conta com psicólogos especializados em Psicologia Organizacional e Análise do Comportamento com ampla vivência na implementação de programas de conformidade com a NR-01.

Oferecemos diagnósticos de clima e riscos psicossociais através de metodologias científicas validadas, elaboração de relatórios técnicos para integração ao PGR da sua empresa, workshops práticos para líderes e programas contínuos de promoção da saúde mental no trabalho. Cuidar das pessoas é a decisão mais inteligente e sustentável que uma liderança pode tomar.
`
  }
];

async function updateArticles() {
  console.log('Atualizando artigos no banco Neon com conteúdos ricos e extensos...');
  for (const art of enrichedArticles) {
    await pool.query(
      `UPDATE blog_posts
       SET title = $1, excerpt = $2, content = $3, updated_at = NOW()
       WHERE id = $4`,
      [art.title, art.excerpt, art.content.trim(), art.id]
    );
    console.log(`✓ Artigo ${art.id} atualizado com sucesso (${art.slug}).`);
  }
  await pool.end();
  console.log('Todos os artigos foram enriquecidos com sucesso!');
}

updateArticles().catch(err => {
  console.error('Erro ao atualizar artigos:', err);
  process.exit(1);
});
