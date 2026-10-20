#!/usr/bin/env node
/**
 * Disposable mailbox helpers: mail.tm (primary) with GuerrillaMail fallback.
 */
const j = async (url, opts = {}) => {
  const r = await fetch(url, opts);
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, body: t }; }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** mail.tm — returns { address, password, token, list(), read(id) } */
async function mailTm() {
  const doms = await j('https://api.mail.tm/domains');
  const list = doms.body['hydra:member'] || doms.body.member || [];
  if (!list.length) throw new Error('no mail.tm domain');
  const domain = list[0].domain;
  // mail.tm strips dots from the local part, so keep it dot-free
  const user = `yuudemo3d${Date.now().toString().slice(-6)}`;
  const password = 'YuukapaDemo3D2026!';
  const address = `${user}@${domain}`;

  let created = false;
  for (let i = 0; i < 10 && !created; i++) {
    const r = await j('https://api.mail.tm/accounts', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    if (r.status < 300) { created = true; break; }
    console.log(`[mail] account attempt ${i} → ${r.status}, backing off`);
    await sleep(20000);
  }
  if (!created) throw new Error('mail.tm account creation failed');

  let token = null;
  for (let i = 0; i < 8 && !token; i++) {
    await sleep(3000);
    const t = await j('https://api.mail.tm/token', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    token = t.body.token;
  }
  if (!token) throw new Error('mail.tm token failed');
  const H = { authorization: `Bearer ${token}` };
  return {
    provider: 'mail.tm',
    address, password,
    async list() {
      const r = await j('https://api.mail.tm/messages', { headers: H });
      return r.body['hydra:member'] || r.body.member || [];
    },
    async read(id) {
      const r = await j(`https://api.mail.tm/messages/${id}`, { headers: H });
      return (r.body.html || []).join('\n') + '\n' + (r.body.text || '');
    },
  };
}

/** GuerrillaMail — public session, no signup */
async function guerrilla() {
  const r = await j('https://api.guerrillamail.com/ajax.php?f=get_email_address&ip=127.0.0.1&agent=Mozilla_foo_bar');
  const address = (r.body && r.body.email_addr) || '';
  const sid = (r.body && r.body.sid) || '';
  if (!address) throw new Error('guerrillamail failed');
  return {
    provider: 'guerrillamail',
    address,
    password: 'guerrillamail',
    async list() {
      const q = await j(`https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&sid=${sid}&ip=127.0.0.1&agent=Mozilla_foo_bar`);
      const m = q.body && q.body.list;
      return Array.isArray(m) ? m : [];
    },
    async read(id) {
      const q = await j(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${id}&sid=${sid}&ip=127.0.0.1&agent=Mozilla_foo_bar`);
      const b = q.body || {};
      return (b.msg || '') + '\n' + (b.email_html || '');
    },
  };
}

export async function createMailbox() {
  try { return await mailTm(); } catch (e) {
    console.log('[mail] mail.tm unavailable:', e.message);
    return await guerrilla();
  }
}
