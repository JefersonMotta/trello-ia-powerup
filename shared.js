// Funções compartilhadas entre todas as páginas do Power-Up

async function getConfig(t) {
  const [trelloKey, trelloToken, claudeKey] = await Promise.all([
    t.get('member', 'private', 'trelloKey'),
    t.get('member', 'private', 'trelloToken'),
    t.get('member', 'private', 'claudeKey')
  ]);
  return { trelloKey, trelloToken, claudeKey };
}

function configOk(cfg) {
  return cfg.trelloKey && cfg.trelloToken && cfg.claudeKey;
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
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: system || 'Você é um assistente especializado em gestão de projetos e tarefas no Trello. Responda sempre em português do Brasil.',
      messages
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Claude: ' + (err.error?.message || res.status));
  }

  const data = await res.json();
  return data.content[0].text;
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
