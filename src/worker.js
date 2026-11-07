// Static files come from ./public via the assets binding; only /api/* reaches this code.
import { validCredentials, createUser, verifyUser, createSession, currentUser, deleteSession } from './auth.js';

const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers });

async function readJson(request) {
  try { return (await request.json()) ?? {}; } catch { return null; }
}

async function handleAuth(path, request, env) {
  const secure = new URL(request.url).protocol === 'https:';
  if (path === '/api/me') {
    const user = await currentUser(env.DB, request);
    return user ? json({ email: user.email }) : json({ error: '未登录' }, 401);
  }
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (path === '/api/logout') return json({ ok: true }, 200, { 'set-cookie': await deleteSession(env.DB, request, secure) });

  // Brute-force guard for login/register, per client IP.
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  if (!(await env.AUTH_LIMITER.limit({ key: ip })).success) return json({ error: '尝试太频繁，请稍后再试' }, 429);

  const body = await readJson(request);
  if (!body) return json({ error: 'bad json' }, 400);
  const email = String(body.email ?? '').trim().toLowerCase();
  const { password } = body;
  if (!validCredentials(email, password)) return json({ error: '请输入有效邮箱和至少8位密码' }, 400);

  const userId = path === '/api/register'
    ? await createUser(env.DB, email, password)
    : await verifyUser(env.DB, email, password);
  if (!userId) {
    return path === '/api/register' ? json({ error: '该邮箱已注册' }, 409) : json({ error: '邮箱或密码错误' }, 401);
  }
  return json({ email }, 200, { 'set-cookie': await createSession(env.DB, userId, secure) });
}

async function handleScores(request, env, user) {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const name = (url.searchParams.get('name') || '').slice(0, 20);
    const { results } = await env.DB.prepare(
      'SELECT name, level, correct, total, created_at FROM scores WHERE user_id = ? AND name = ? ORDER BY id DESC LIMIT 20',
    ).bind(user.id, name).all();
    return json(results);
  }

  if (request.method === 'POST') {
    const body = await readJson(request);
    if (!body) return json({ error: 'bad json' }, 400);
    const { name, level, correct, total } = body;
    const valid = typeof name === 'string' && name.trim() && name.length <= 20
      && Number.isInteger(level) && level >= 0 && level < 10
      && Number.isInteger(total) && total > 0 && total <= 50
      && Number.isInteger(correct) && correct >= 0 && correct <= total;
    if (!valid) return json({ error: 'invalid score' }, 400);
    await env.DB.prepare('INSERT INTO scores (user_id, name, level, correct, total) VALUES (?, ?, ?, ?, ?)')
      .bind(user.id, name.trim(), level, correct, total).run();
    return json({ ok: true }, 201);
  }

  return json({ error: 'method not allowed' }, 405);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (['/api/register', '/api/login', '/api/logout', '/api/me'].includes(path)) return handleAuth(path, request, env);
    if (path === '/api/scores') {
      const user = await currentUser(env.DB, request);
      return user ? handleScores(request, env, user) : json({ error: '未登录' }, 401);
    }
    return json({ error: 'not found' }, 404);
  },
};
