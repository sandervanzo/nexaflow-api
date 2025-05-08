
export default async function handler(req, res) {
  // ✅ Cabeçalhos CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Trata requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ Verifica chave de API
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "API Key não configurada no ambiente" });
  }

  // ✅ Permite apenas método POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    // ✅ Extrai dados do body
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem não fornecida" });
    }

    // ⏰ Define modelo com base no horário (DeepSeek gratuito entre 13h–21h BRT)
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hour = now.getHours();
    const isDeepSeekTime = hour >= 13 && hour < 21;
    const selectedModel = isDeepSeekTime ? "deepseek-chat" : "claude-instant-1.2";

    // 🚀 Requisição à API OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexaflow.app",
        "X-Title": "NexaFlow Ayla"
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "Você é a Ayla, assistente empática e produtiva do app NexaFlow." },
          ...(history || []),
          { role: "user", content: message }
        ]
      })
    });

    const result = await response.json();

    // 🔁 Erro na resposta da API
    if (response.status !== 200) {
      return res.status(response.status).json(result);
    }

    // ✅ Sucesso
    return res.status(200).json({ reply: result.choices[0].message.content });
  } catch (error) {
    // ❌ Erro interno
    return res.status(500).json({
      error: "Erro ao processar a requisição",
      details: error.message
    });
  }
}
