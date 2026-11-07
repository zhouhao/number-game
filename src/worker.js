// Static files come from ./public via the assets binding; only /api/* reaches this code.
const json = (data, status = 200) => Response.json(data, { status });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/scores') return json({ error: 'not found' }, 404);

    if (request.method === 'GET') {
      const name = (url.searchParams.get('name') || '').slice(0, 20);
      const { results } = await env.DB.prepare(
        'SELECT name, level, correct, total, created_at FROM scores WHERE name = ? ORDER BY id DESC LIMIT 20',
      ).bind(name).all();
      return json(results);
    }

    if (request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
      const { name, level, correct, total } = body ?? {};
      const valid = typeof name === 'string' && name.trim() && name.length <= 20
        && Number.isInteger(level) && level >= 0 && level < 10
        && Number.isInteger(total) && total > 0 && total <= 50
        && Number.isInteger(correct) && correct >= 0 && correct <= total;
      if (!valid) return json({ error: 'invalid score' }, 400);
      await env.DB.prepare('INSERT INTO scores (name, level, correct, total) VALUES (?, ?, ?, ?)')
        .bind(name.trim(), level, correct, total).run();
      return json({ ok: true }, 201);
    }

    return json({ error: 'method not allowed' }, 405);
  },
};
