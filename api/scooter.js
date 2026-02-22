/**
 * API serverless Sys-Scooter (Vercel) – login, clientes e config.
 * Requer: SYS_SCOOTER_USER, SYS_SCOOTER_PASSWORD, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.
 */
const { Redis } = require('@upstash/redis');
const crypto = require('crypto');

const USER = process.env.SYS_SCOOTER_USER || '';
const PASSWORD = process.env.SYS_SCOOTER_PASSWORD || '';
const TOKEN_DAYS = 30;
const PREFIX = 'sys_scooter:';

function redis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis não configurado');
  return new Redis({ url, token });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function json(res, data, code = 200) {
  res.status(code).setHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify(data));
}

function err(res, message, code = 400) {
  json(res, { ok: false, error: message }, code);
}

function getBearer(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/Bearer\s+(\S+)/);
  return m ? m[1] : null;
}

function expiresAt(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = req.query.action || (req.body && req.body.action) || '';
  const body = req.body || {};

  if (!action) return err(res, 'Ação inválida.', 400);

  try {
    if (action === 'login') {
      const user = (body.login || '').trim().toLowerCase();
      const pass = (body.password || body.senha || '').trim();
      if (!user || !pass) return err(res, 'Login e senha obrigatórios.', 400);
      if (USER.toLowerCase() !== user || PASSWORD !== pass) return err(res, 'Login ou senha incorretos.', 401);
      const token = 'auth_' + crypto.randomBytes(16).toString('hex');
      const r = redis();
      const sessions = (await r.get(PREFIX + 'sessions')) || {};
      sessions[token] = { user: USER, expires: expiresAt(TOKEN_DAYS) };
      await r.set(PREFIX + 'sessions', sessions);
      return json(res, { ok: true, token, login: USER });
    }

    const token = getBearer(req);
    if (!token) return err(res, 'Não autorizado.', 401);

    const r = redis();
    const sessions = (await r.get(PREFIX + 'sessions')) || {};
    const s = sessions[token];
    if (!s || new Date(s.expires) < new Date()) {
      delete sessions[token];
      await r.set(PREFIX + 'sessions', sessions);
      return err(res, 'Não autorizado.', 401);
    }

    if (action === 'getClients') {
      const clients = (await r.get(PREFIX + 'clients')) || [];
      return json(res, { ok: true, clients: Array.isArray(clients) ? clients : [] });
    }

    if (action === 'saveClients') {
      const clients = body.clients;
      if (!Array.isArray(clients)) return err(res, 'clients deve ser um array.');
      await r.set(PREFIX + 'clients', clients);
      return json(res, { ok: true });
    }

    if (action === 'getConfig') {
      const config = (await r.get(PREFIX + 'config')) || {};
      return json(res, { ok: true, config: typeof config === 'object' ? config : {} });
    }

    if (action === 'saveConfig') {
      const config = (await r.get(PREFIX + 'config')) || {};
      if (typeof body.whatsappMsg !== 'undefined') config.whatsappMsg = body.whatsappMsg;
      if (typeof body.diasVencendo !== 'undefined') {
        const v = parseInt(body.diasVencendo, 10);
        config.diasVencendo = (v >= 0 && v <= 365) ? v : 15;
      }
      await r.set(PREFIX + 'config', config);
      return json(res, { ok: true });
    }

    return err(res, 'Ação inválida.', 400);
  } catch (e) {
    console.error(e);
    return err(res, e.message || 'Erro no servidor.', 500);
  }
}
