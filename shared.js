// Funções compartilhadas entre todas as páginas do Power-Up

async function getConfig(t) {
  const [trelloKey, trelloToken, openaiKey] = await Promise.all([
    t.get('member', 'private', 'trelloKey'),
    t.get('member', 'private', 'trelloToken'),
    t.get('member', 'private', 'openaiKey')
  ]);
  return { trelloKey, trelloToken, openaiKey };
}

function configOk(cfg) {
  return cfg.trelloKey && cfg.trelloToken && cfg.openaiKey;
}

async function trelloFetch(method, path, cfg, body) {
  const url = new URL('https://api.trello.com/1' + path);
  url.searchParams.set('key', cfg.trelloKey);
  url.searchParams.set('token', cfg.trelloToken);

  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url.toString(), opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Trello: ' + res.status + ' ' + txt);
  }
  return res.json();
}

async function claudeChat(messages, apiKey, system) {
  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : [{ role: 'system', content: 'Você é um assistente especializado em gestão de projetos e tarefas no Trello. Responda sempre em português do Brasil.' }, ...messages];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: allMessages
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('OpenAI: ' + (err.error?.message || res.status));
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function showError(msg) {
  const el = document.getElementById('error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideError() {
  const el = document.getElementById('error');
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : text;
}
