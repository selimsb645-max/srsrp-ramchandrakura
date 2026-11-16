/**
 * Instant password-reset mailer for শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ.
 *
 * POST / { email } -> builds the REAL Firebase reset link with the service account,
 * renders the green template and sends it through Gmail SMTP (raw sockets).
 * Free tier only: Workers + Gmail SMTP, no paid service, no Base44 credits.
 */

import { connect } from 'cloudflare:sockets';

const PROJECT_ID = 'coop-save-w1y1f8';
const MAIL_FROM = 'selimsb645@gmail.com';
const MAIL_FROM_NAME = 'শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ';
const SUBJECT = 'পাসওয়ার্ড রিসেট (শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ)';
const SIGNUP_SUBJECT = 'সদস্যপদ আবেদন পাওয়া গেছে — শেখ রাসেল জাতীয় শিশু-কিশোর পরিষদ';
const SIGNUP_TEMPLATE_URL = 'https://selimsb645-max.github.io/srsrp-ramchandrakura/brand/email/application-received.html';
const SITE_URL = 'https://selimsb645-max.github.io/srsrp-ramchandrakura';
const SIGNUP_DAILY_LIMIT = 6;
const TEMPLATE_URL = 'https://selimsb645-max.github.io/srsrp-ramchandrakura/brand/email/reset-password-email.html';
const ALLOWED_ORIGIN = 'https://selimsb645-max.github.io';
const SITE_LINE = '৫নং রামচন্দ্রকুড়া ইউনিয়ন শাখা, নালিতাবাড়ী, শেরপুর';

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64 = (text) => {
  const bytes = enc.encode(text);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const b64wrap = (text) => b64(text).replace(/(.{76})/g, '$1\r\n');
const mimeWord = (text) => `=?UTF-8?B?${b64(text)}?=`;

function pemToDer(pem) {
  const clean = pem.replace(/\\n/g, '\n').replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const raw = atob(clean);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(
    enc.encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    )
  );
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(sa.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${header}.${claims}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`oauth ${res.status}: ${JSON.stringify(data).slice(0, 120)}`);
  return data.access_token;
}

/* ------------------------------- SMTP over raw sockets ------------------------------- */

class Smtp {
  constructor() {
    this.buffer = '';
  }
  async open(host, port) {
    this.socket = connect({ hostname: host, port }, { secureTransport: 'on', allowHalfOpen: false });
    this.writer = this.socket.writable.getWriter();
    this.reader = this.socket.readable.getReader();
    await this.expect([220]);
  }
  async read() {
    for (;;) {
      const idx = this.buffer.lastIndexOf('\r\n');
      if (idx > -1) {
        const lines = this.buffer.slice(0, idx).split('\r\n');
        const last = lines[lines.length - 1] || '';
        if (/^\d{3} /.test(last)) {
          this.buffer = this.buffer.slice(idx + 2);
          return lines;
        }
      }
      const { value, done } = await this.reader.read();
      if (done) throw new Error('smtp connection closed');
      this.buffer += dec.decode(value, { stream: true });
    }
  }
  async expect(codes) {
    const lines = await this.read();
    const code = Number((lines[lines.length - 1] || '').slice(0, 3));
    if (!codes.includes(code)) throw new Error(`smtp ${code}: ${(lines[lines.length - 1] || '').slice(4, 120)}`);
    return lines;
  }
  async cmd(line, codes) {
    await this.writer.write(enc.encode(`${line}\r\n`));
    return this.expect(codes);
  }
  async sendRaw(payload) {
    await this.writer.write(enc.encode(payload));
    return this.expect([250]);
  }
  async close() {
    try {
      await this.cmd('QUIT', [221]);
    } catch (_) {
      /* the server may already be closing */
    }
    try {
      await this.writer.close();
    } catch (_) {}
    try {
      await this.socket.close();
    } catch (_) {}
  }
}

function resetText(name, link) {
  return [
    `প্রিয় ${name},`,
    '',
    'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে আমরা পাসওয়ার্ড রিসেটের একটি অনুরোধ পেয়েছি।',
    'নিচের লিংকে গিয়ে আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড সেট করুন। লিংকটি একবার ব্যবহার করা যাবে এবং সীমিত সময়ের জন্য কার্যকর।',
    '',
    link,
    '',
    'লিংকটি কাজ না করলে উপরের ঠিকানাটি কপি করে ব্রাউজারে খুলুন।',
    'আপনি যদি এই অনুরোধ না করে থাকেন, এই ইমেইলটি উপেক্ষা করুন; আপনার বর্তমান পাসওয়ার্ড অপরিবর্তিত থাকবে।',
    '',
    'শুভেচ্ছান্তে,',
    MAIL_FROM_NAME,
    SITE_LINE,
    '',
    'এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে সরাসরি উত্তর দেবেন না।',
  ].join('\r\n');
}

function signupText(name, link) {
  return [
    `প্রিয় ${name},`,
    '',
    'আপনার সদস্যপদ আবেদনটি আমাদের কাছে জমা হয়েছে। ইউনিয়ন শাখা কমিটি তথ্য ও কাগজপত্র যাচাই করে অনুমোদনের সিদ্ধান্ত নেবে।',
    'অনুমোদন হলে একটি সদস্য নম্বর দেওয়া হবে, এরপর সদস্য কার্ড ও সদস্যপদ সনদ ডাউনলোড করা যাবে।',
    '',
    'নিচের লিংকে গিয়ে আপনার ইমেইল ঠিকানাটি একবার যাচাই করে নিন:',
    link,
    '',
    'আবেদনের অবস্থা: ' + SITE_URL + '/pending',
    '',
    'শুভেচ্ছান্তে,',
    MAIL_FROM_NAME,
    SITE_LINE,
    '',
    'এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে সরাসরি উত্তর দেবেন না।',
  ].join('\r\n');
}

function buildMessageParts(to, subject, text, html) {
  const boundary = `b${crypto.randomUUID().replace(/-/g, '')}`;

  const head = [
    `From: ${mimeWord(MAIL_FROM_NAME)} <${MAIL_FROM}>`,
    `To: <${to}>`,
    `Reply-To: <${MAIL_FROM}>`,
    `Subject: ${mimeWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    'Message-ID: <' + crypto.randomUUID() + '@srsrp>',
  ].join('\r\n');

  const textPart = [`--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64wrap(text)].join('\r\n');
  const htmlPart = [`--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64wrap(html)].join('\r\n');
  const raw = [head, '', textPart, '', htmlPart, '', `--${boundary}--`, ''].join('\r\n');
  return raw.replace(/\r\n\./g, '\r\n..');
}

let templateCache = { html: '', at: 0 };
let signupTemplateCache = { html: '', at: 0 };

function renderTemplate(html, name, link, email = '') {
  return html.split('%LINK%').join(link).split('%DISPLAY_NAME%').join(name).split('%EMAIL%').join(email);
}

/**
 * Cached fetch of a hosted template; returns { html, status }.
 * `bust` pins the fetch to one URL per deploy so a previously cached 404 cannot stick.
 */
async function loadTemplate(url, cache, bust = '') {
  if (cache.html && Date.now() - cache.at < 6 * 3600 * 1000) return { html: cache.html, status: 200 };
  const target = bust ? `${url}?v=${bust}` : url;
  const res = await fetch(target, { cf: { cacheTtl: 3600 } });
  if (!res.ok) return { html: cache.html, status: res.status };
  const html = await res.text();
  cache.html = html;
  cache.at = Date.now();
  return { html, status: res.status };
}

function buildMessage(to, name, link) {
  return buildMessageParts(to, SUBJECT, resetText(name, link), renderTemplate(templateCache.html, name, link));
}

/* ------------------------------------ diagnostics ------------------------------------ */

async function logDiag(env, entry) {
  try {
    if (!env.FIREBASE_SA_JSON) return;
    const sa = JSON.parse(env.FIREBASE_SA_JSON);
    const token = await accessToken(sa);
    const fields = {};
    for (const [k, v] of Object.entries(entry)) {
      fields[k] = typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v ?? '').slice(0, 400) };
    }
    await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/mailerDiagnostics`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (_) {
    /* diagnostics must never break the request */
  }
}

/* ------------------------------ member documents (KV) ------------------------------ */

const MAX_DOC_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const DOC_CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

async function handleUpload(request, env) {
  if (!env.DOCS) return Response.json({ ok: false, code: 'NO_STORE' }, { status: 500, headers: DOC_CORS });
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const rlKey = `rl/${ip}/${day}`;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.data !== 'string') {
    return Response.json({ ok: false, code: 'BAD_BODY' }, { status: 400, headers: DOC_CORS });
  }
  const type = String(body.type || '');
  if (!ALLOWED_TYPES.includes(type)) {
    return Response.json({ ok: false, code: 'BAD_TYPE' }, { status: 415, headers: DOC_CORS });
  }
  const bytes = Math.floor((body.data.length * 3) / 4);
  if (bytes > MAX_DOC_BYTES) {
    return Response.json({ ok: false, code: 'TOO_BIG', max: MAX_DOC_BYTES }, { status: 413, headers: DOC_CORS });
  }

  const used = Number((await env.DOCS.get(rlKey)) || 0);
  if (used >= 40) {
    return Response.json({ ok: false, code: 'RATE' }, { status: 429, headers: DOC_CORS });
  }
  await env.DOCS.put(rlKey, String(used + 1), { expirationTtl: 86400 });

  const key = crypto.randomUUID().replace(/-/g, '');
  await env.DOCS.put(
    `doc/${key}`,
    JSON.stringify({
      name: String(body.name || '').slice(0, 120),
      type,
      size: bytes,
      label: String(body.label || '').slice(0, 60),
      at: new Date().toISOString(),
      data: body.data,
    })
  );
  return Response.json({ ok: true, key, name: String(body.name || ''), type, size: bytes }, { headers: DOC_CORS });
}

async function handleDownload(key, env) {
  if (!env.DOCS || !/^[a-f0-9]{32}$/.test(key)) {
    return new Response('not found', { status: 404, headers: DOC_CORS });
  }
  const raw = await env.DOCS.get(`doc/${key}`, 'json');
  if (!raw?.data) return new Response('not found', { status: 404, headers: DOC_CORS });
  const bin = atob(raw.data);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Response(out, {
    headers: {
      ...DOC_CORS,
      'content-type': raw.type || 'application/octet-stream',
      'cache-control': 'private, max-age=900',
      'content-disposition': `inline; filename="${(raw.name || 'document').replace(/[^\w.\-]/g, '_')}"`,
    },
  });
}

/* --------------------------------- application receipt --------------------------------- */

/**
 * POST /signup { email, name, dryRun? }
 *
 * Firebase's own "verify your email" mail carries the project name (NextAI Vision) and
 * cannot be re-templated, so the site never asks Firebase to send it. This route mints the
 * REAL Firebase verification link and sends the organisation's own green receipt mail
 * instead: "your application arrived, the committee will review it".
 *
 * The mail is only a receipt — approval still happens in the committee member screen.
 */
async function handleSignup(request, env, email, body) {
  const started = Date.now();
  const dryRun = body?.dryRun === true;

  if (!env.FIREBASE_SA_JSON || !env.GMAIL_APP_PASSWORD) {
    return Response.json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 500, headers: cors() });
  }

  // keep the owner's Gmail from becoming a relay: a few signup mails per IP per day
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const rlKey = `signup/${ip}/${day}`;
  let used = 0;
  if (env.DOCS && !dryRun) {
    try {
      used = Number(await env.DOCS.get(rlKey)) || 0;
    } catch (_) {}
    if (used >= SIGNUP_DAILY_LIMIT) {
      return Response.json({ ok: false, code: 'LIMIT' }, { status: 429, headers: cors() });
    }
  }

  let stage = 'auth-google';
  try {
    const sa = JSON.parse(env.FIREBASE_SA_JSON);
    const token = await accessToken(sa);
    const authHeaders = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    stage = 'oob';
    const oob = await verificationLink(authHeaders, email);
    if (!oob.link) {
      // no account, or the address was verified before: nothing to send, nothing broken
      const code = /ALREADY_VERIFIED/.test(oob.error) ? 'ALREADY' : 'NO_ACCOUNT';
      return Response.json({ ok: true, sent: false, code, detail: oob.error.slice(0, 120) }, { headers: cors() });
    }
    const link = oob.link;

    stage = 'name';
    let name = String(body?.name || '').trim();
    if (!name) name = await displayName(authHeaders, email);
    name = name || 'সদস্য';

    stage = 'template';
    const tpl = await loadTemplate(SIGNUP_TEMPLATE_URL, signupTemplateCache, String(body?.v || '').slice(0, 24));
    if (!tpl.html) {
      return Response.json({ ok: false, code: 'NO_TEMPLATE', status: tpl.status }, { status: 502, headers: cors() });
    }
    const html = tpl.html;

    stage = 'build';
    const message = buildMessageParts(email, SIGNUP_SUBJECT, signupText(name, link), renderTemplate(html, name, link, email));

    stage = 'smtp-connect';
    const smtp = new Smtp();
    await smtp.open('smtp.gmail.com', 465);
    await smtp.cmd('EHLO srsrp-worker', [250]);
    stage = 'smtp-auth';
    await smtp.cmd('AUTH LOGIN', [334]);
    await smtp.cmd(b64(MAIL_FROM), [334]);
    await smtp.cmd(b64(env.GMAIL_APP_PASSWORD), [235]);
    if (dryRun) {
      await smtp.close();
      return Response.json({ ok: true, dryRun: true, stage: 'authenticated', template: html.length }, { headers: cors() });
    }

    stage = 'smtp-send';
    await smtp.cmd(`MAIL FROM:<${MAIL_FROM}>`, [250]);
    await smtp.cmd(`RCPT TO:<${email}>`, [250, 251]);
    await smtp.cmd('DATA', [354]);
    await smtp.sendRaw(`${message}\r\n.\r\n`);
    await smtp.close();

    if (env.DOCS) {
      try {
        await env.DOCS.put(rlKey, String(used + 1), { expirationTtl: 172800 });
      } catch (_) {}
    }
    await logDiag(env, { kind: 'signup-sent', stage: 'done', email, ms: Date.now() - started });
    return Response.json({ ok: true, sent: true }, { headers: cors() });
  } catch (error) {
    await logDiag(env, {
      kind: 'signup-failed',
      stage,
      email,
      ms: Date.now() - started,
      error: String(error),
      origin: request.headers.get('origin') || '',
    });
    return Response.json({ ok: false, code: 'FAILED', stage, error: String(error).slice(0, 240) }, { status: 500, headers: cors() });
  }
}

/** Real Firebase e-mail verification link (nothing is sent by Firebase itself). */
async function verificationLink(authHeaders, email) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:sendOobCode`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      requestType: 'VERIFY_EMAIL',
      email,
      returnOobLink: true,
      continueUrl: `${SITE_URL}/pending`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = JSON.stringify(data.error?.message || data.error || data);
    if (/TOO_MANY_ATTEMPTS|QUOTA|_LIMIT/.test(error)) return { link: '', error: 'RATE_LIMIT' };
    return { link: '', error };
  }
  if (!data.oobLink) return { link: '', error: 'NO_LINK' };
  // Firebase's own link opens its blue hosted page. Take only the one-time code out of it
  // and point the button at the site's own page, which applies the code and says
  // "verified" or, on a repeat click, "already verified".
  let code = '';
  try {
    code = new URL(data.oobLink).searchParams.get('oobCode') || '';
  } catch (_) {}
  if (!code) return { link: data.oobLink, error: '' };
  return { link: `${SITE_URL}/verify-email?oobCode=${encodeURIComponent(code)}`, error: '' };
}

async function displayName(authHeaders, email) {
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ email: [email] }),
    });
    const found = (await res.json()).users?.[0]?.displayName;
    return found && found.trim() ? found.trim() : '';
  } catch (_) {
    return '';
  }
}

/* ------------------------------------ handler ------------------------------------ */

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    ...extra,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // member documents
    if (url.pathname === '/doc' || url.pathname.startsWith('/doc/')) {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: DOC_CORS });
      if (request.method === 'POST' && url.pathname === '/doc') {
        try {
          return await handleUpload(request, env);
        } catch (error) {
          return Response.json({ ok: false, code: 'FAILED', error: String(error).slice(0, 160) }, { status: 500, headers: DOC_CORS });
        }
      }
      if (request.method === 'GET') return handleDownload(url.pathname.replace('/doc/', ''), env);
      return new Response('method not allowed', { status: 405, headers: DOC_CORS });
    }

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
    if (request.method !== 'POST') return Response.json({ ok: false, code: 'METHOD' }, { status: 405, headers: cors() });

    let email = '';
    let body = {};
    try {
      body = (await request.json()) || {};
      email = String(body.email || '').trim().toLowerCase();
    } catch (_) {
      return Response.json({ ok: false, code: 'BAD_JSON' }, { status: 400, headers: cors() });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
      return Response.json({ ok: false, code: 'BAD_EMAIL' }, { status: 400, headers: cors() });
    }

    if (url.pathname === '/signup') return handleSignup(request, env, email, body);

    let stage = 'start';
    const started = Date.now();
    const dryRun = body?.dryRun === true;

    try {
      if (!env.FIREBASE_SA_JSON || !env.GMAIL_APP_PASSWORD) {
        return Response.json({ ok: false, code: 'NOT_CONFIGURED' }, { status: 500, headers: cors() });
      }
      stage = 'auth-google';
      const sa = JSON.parse(env.FIREBASE_SA_JSON);
      const token = await accessToken(sa);
      const authHeaders = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

      stage = 'oob';
      const oobRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:sendOobCode`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ requestType: 'PASSWORD_RESET', email, returnOobLink: true }),
      });
      const oob = await oobRes.json().catch(() => ({}));
      if (!oobRes.ok) {
        const msg = JSON.stringify(oob);
        if (msg.includes('EMAIL_NOT_FOUND')) return Response.json({ ok: true, sent: false, code: 'NO_ACCOUNT' }, { headers: cors() });
        if (msg.includes('RESET_PASSWORD_EXCEED_LIMIT')) {
          return Response.json({ ok: false, code: 'LIMIT' }, { status: 429, headers: cors() });
        }
        return Response.json({ ok: false, code: 'OOB', detail: msg.slice(0, 160) }, { status: 502, headers: cors() });
      }
      const link = oob.oobLink;
      // Firebase এই ঠিকানা না থাকলে ২০০-ই দেয়, শুধু oobLink দেয় না।
      // সদস্যের ইমেইল নিবন্ধিত কি না তা ফাঁস না করে "গ্রহণ করা হয়েছে" ফেরত দিই।
      if (!link) return Response.json({ ok: true, sent: false, code: 'NO_ACCOUNT' }, { headers: cors() });

      let name = 'সদস্য';
      try {
        const look = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ email: [email] }),
        });
        const found = (await look.json()).users?.[0]?.displayName;
        if (found && found.trim()) name = found.trim();
      } catch (_) {}

      if (!templateCache.html || Date.now() - templateCache.at > 6 * 3600 * 1000) {
        const tpl = await fetch(TEMPLATE_URL, { cf: { cacheTtl: 3600 } });
        if (tpl.ok) templateCache = { html: await tpl.text(), at: Date.now() };
      }
      if (!templateCache.html) return Response.json({ ok: false, code: 'NO_TEMPLATE' }, { status: 502, headers: cors() });

      stage = 'build';
      const message = buildMessage(email, name, link);
      stage = 'smtp-connect';
      const smtp = new Smtp();
      await smtp.open('smtp.gmail.com', 465);
      await smtp.cmd('EHLO srsrp-worker', [250]);
      stage = 'smtp-auth';
      await smtp.cmd('AUTH LOGIN', [334]);
      await smtp.cmd(b64(MAIL_FROM), [334]);
      await smtp.cmd(b64(env.GMAIL_APP_PASSWORD), [235]);
      if (dryRun) {
        await smtp.close();
        return Response.json({ ok: true, dryRun: true, stage: 'authenticated' }, { headers: cors() });
      }
      stage = 'smtp-send';
      await smtp.cmd(`MAIL FROM:<${MAIL_FROM}>`, [250]);
      await smtp.cmd(`RCPT TO:<${email}>`, [250, 251]);
      await smtp.cmd('DATA', [354]);
      await smtp.sendRaw(`${message}\r\n.\r\n`);
      await smtp.close();

      await logDiag(env, { kind: 'sent', stage: 'done', email, ms: Date.now() - started });
      return Response.json({ ok: true, sent: true }, { headers: cors() });
    } catch (error) {
      await logDiag(env, {
        kind: 'failed',
        stage,
        email,
        ms: Date.now() - started,
        error: String(error),
        ua: request.headers.get('user-agent') || '',
        origin: request.headers.get('origin') || '',
      });
      return Response.json({ ok: false, code: 'FAILED', stage, error: String(error).slice(0, 240) }, { status: 500, headers: cors() });
    }
  },
};
