// Small helpers shared by the API routes.
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function isJson(req) {
  return String(req.headers['content-type'] || '').toLowerCase().includes('application/json');
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body; // Vercel pre-parsed
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 1e6) { const e = new Error('Request too large.'); e.status = 413; throw e; }
  }
  return JSON.parse(data || '{}');
}

function getCookie(req, name) {
  const raw = String(req.headers.cookie || '');
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

module.exports = { send, isJson, readJson, getCookie };
