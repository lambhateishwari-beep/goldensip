// POST /api/logout
const { send } = require('../lib/http');
const { clearCookie } = require('../lib/auth');

module.exports = (req, res) => {
  res.setHeader('Set-Cookie', clearCookie());
  return send(res, 200, { ok: true });
};
