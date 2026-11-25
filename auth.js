// Owner login. Everything is checked on the server.
// Vercel environment variables:
//   ADMIN_PASSWORD  (required)  the owner's password
//   ADMIN_EMAIL     (optional)  defaults to lambhateishwari@gmail.com
//   ADMIN_PHONE     (optional)  defaults to 7559492970
//   SESSION_SECRET  (optional)  any long random text
const crypto = require('crypto');
const { getCookie } = require('./http');

const COOKIE = 'tgs_admin';
const MAX_AGE = 7 * 24 * 3600; // stay logged in for 7 days
const env = (k, d = '') => process.env[k] || d;

const configured = () => !!env('ADMIN_PASSWORD');
const secret = () =>
  env('SESSION_SECRET') || crypto.createHash('sha256').update('tgs|' + env('ADMIN_PASSWORD')).digest('hex');
const sign = (payload) => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');

function safeEq(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// id = email OR phone number typed by the owner
function checkLogin(id, password) {
  if (!configured()) return false;
  const raw = String(id || '').trim().toLowerCase();
  const email = env('ADMIN_EMAIL', 'lambhateishwari@gmail.com').trim().toLowerCase();
  const phone = env('ADMIN_PHONE', '7559492970').replace(/\D/g, '').slice(-10);
  const digits = raw.replace(/\D/g, '').slice(-10);
  const pwOk = safeEq(String(password || ''), env('ADMIN_PASSWORD'));
  const emailOk = safeEq(raw, email);
  const phoneOk = !raw.includes('@') && digits.length === 10 && safeEq(digits, phone);
  return pwOk && (emailOk || phoneOk);
}

function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return payload + '.' + sign(payload);
}

function isAdmin(req) {
  if (!configured()) return false;
  const [payload, sig] = getCookie(req, COOKIE).split('.');
  if (!payload || !sig || !safeEq(sig, sign(payload))) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); }
  catch (e) { return false; }
}

const secure = () => (process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '');
const sessionCookie = () => `${COOKIE}=${makeToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}${secure()}`;
const clearCookie = () => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure()}`;

module.exports = { configured, checkLogin, isAdmin, sessionCookie, clearCookie };
