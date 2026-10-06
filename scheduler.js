const cron = require('node-cron');
const { runNewsScanAndGenerate, getOpenAIApiKey } = require('./ai-service');
const db = require('./db');

function initScheduler() {
  // Cron: Toda segunda-feira às 06h00 da manhã no fuso horário de Brasília (America/Sao_Paulo)
  // Formato: minuto(0) hora(6) dia-do-mês(*) mês(*) dia-da-semana(1 = Segunda)
  const cronExpression = '0 6 * * 1';
  const timezone = process.env.TIMEZONE || 'America/Sao_Paulo';

  console.log(`[Agendador] Inicializado: toda segunda-feira às 06:00 BRT (${cronExpression}) - Fuso: ${timezone}`);

  cron.schedule(cronExpression, async () => {
    console.log('[Agendador] [06:00 BRT Segunda-Feira] Iniciando rotina programada de varredura de notícias de Psicologia com a IA...');
    try {
      // Verificar se a automação está ativa nas configurações
      const configRes = await db.query("SELECT value FROM system_settings WHERE key = 'cron_enabled'");
      const isEnabled = configRes.rows.length === 0 || configRes.rows[0].value === 'true';

      if (!isEnabled) {
        console.log('[Agendador] Automação desativada nas configurações do sistema. Ignorando execução.');
        return;
      }

      const apiKey = await getOpenAIApiKey();
      if (!apiKey) {
        console.warn('[Agendador] Chave da OpenAI não configurada. Notifique o administrador no painel.');
        return;
      }

      const result = await runNewsScanAndGenerate(false);
      console.log('[Agendador] Rotina de segunda-feira concluída com sucesso:', result);
    } catch (err) {
      console.error('[Agendador] Erro durante a rotina semanal de IA:', err.message);
    }
  }, {
    scheduled: true,
    timezone: timezone
  });
}

module.exports = { initScheduler };
