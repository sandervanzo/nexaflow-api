export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'API Key não configurada no ambiente' });
  }

  let body = '';
  try {
    body = req.body;
    // Se o body vier como string (caso CORS/local), parse manualmente
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
  } catch (e) {
    return res.status(400).json({ error: 'Erro ao ler o body da requisição' });
  }

  const { message, history } = body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem não fornecida' });
  }

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const hour = now.getHours();
  const selectedModel = hour >= 13 && hour < 21 ? 'deepseek-chat' : 'claude-instant-1.2';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nexaflow.app',
        'X-Title': 'NexaFlow Ayla'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: 'Você é a Ayla, assistente empática e produtiva do app NexaFlow.' },
          ...(history || []),
          { role: 'user', content: message }
        ]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: result?.error || 'Erro inesperado da OpenRouter' });
    }

    return res.status(200).json({ reply: result.choices[0].message.content });

  } catch (err) {
    return res.status(500).json({ error: 'Erro interno ao processar a resposta da IA' });
  }
}
