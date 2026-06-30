// Funções compartilhadas entre todas as páginas do Power-Up

async function getConfig(t) {
  const [trelloKey, trelloToken, geminiKey] = await Promise.all([
    t.get('member', 'private', 'trelloKey'),
    t.get('member', 'private', 'trelloToken'),
    t.get('member', 'private', 'geminiKey')
  ]);
  return { trelloKey, trelloToken, geminiKey };
}

function configOk(cfg) {
  return cfg.trelloKey && cfg.trelloToken && cfg.geminiKey;
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
  const systemText = system || 'Você é um assistente especializado em gestão de projetos e tarefas no Trello. Responda sempre em português do Brasil.';

  const contents = messages.map(function(m) {
    return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
  });

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents: contents
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Gemini: ' + (err.error?.message || res.status));
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
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
