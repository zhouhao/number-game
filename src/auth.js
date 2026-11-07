// Email/password auth: PBKDF2 hashes in D1, random session tokens in an HttpOnly cookie.
const ITERATIONS = 100000; // Workers caps PBKDF2 at 100k iterations
const SESSION_DAYS = 30;
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)));

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
}

export function validCredentials(email, password) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

export async function createUser(db, email, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  try {
    const row = await db.prepare('INSERT INTO users (email, pw_hash, salt) VALUES (?, ?, ?) RETURNING id')
      .bind(email, hex(hash), hex(salt)).first();
    return row.id;
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return null; // email already registered
    throw e;
  }
}

export async function verifyUser(db, email, password) {
  const user = await db.prepare('SELECT id, pw_hash, salt FROM users WHERE email = ?').bind(email).first();
  if (!user) return null;
  const hash = await hashPassword(password, unhex(user.salt));
  return crypto.subtle.timingSafeEqual(hash, unhex(user.pw_hash).buffer) ? user.id : null;
}

// secure=false only for plain-http LAN testing (e.g. a tablet hitting wrangler dev); browsers drop Secure cookies over http.
const cookie = (value, maxAge, secure) => `sid=${value}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${maxAge}`;

export async function createSession(db, userId, secure) {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await db.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${SESSION_DAYS} days'))`)
    .bind(token, userId).run();
  return cookie(token, SESSION_DAYS * 86400, secure);
}

const tokenOf = (request) => /(?:^|;\s*)sid=([0-9a-f]{64})/.exec(request.headers.get('cookie') || '')?.[1];

export async function currentUser(db, request) {
  const token = tokenOf(request);
  if (!token) return null;
  return db.prepare(`SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')`).bind(token).first();
}

export async function deleteSession(db, request, secure) {
  const token = tokenOf(request);
  if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return cookie('', 0, secure);
}
