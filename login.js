// POST /api/login   body: { id: "email or phone", password: "..." }
const { send, readJson, isJson } = require('../lib/http');
const { checkLogin, sessionCookie, configured } = require('../lib/auth');
const { hit, clearHits } = require('../lib/store');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'Method not allowed' }); }
    if (!isJson(req)) return send(res, 415, { error: 'Bad request.' });
    if (!configured()) {
      return send(res, 503, { error: 'Owner password is not set yet. Add ADMIN_PASSWORD in Vercel > Settings > Environment Variables, then redeploy.' });
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'x').split(',')[0].trim();
    const key = 'tgs:login:' + ip;
    if ((await hit(key, 900)) > 8) return send(res, 429, { error: 'Too many attempts. Please try again in 15 minutes.' });

    const body = await readJson(req);
    if (!checkLogin(body.id, body.password)) return send(res, 401, { error: 'Incorrect email/phone or password.' });

    await clearHits(key);
    res.setHeader('Set-Cookie', sessionCookie());
    return send(res, 200, { ok: true });
  } catch (e) {
    if (e instanceof SyntaxError) return send(res, 400, { error: 'Bad data.' });
    if (!e.status) console.error(e);
    return send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong. Please try again.' });
  }
};
