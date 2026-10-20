#!/usr/bin/env node
/**
 * Disposable mailbox (mail.tm) so the surge.sh sign-up e-mail can be verified.
 * Exports createMailbox() -> { address, password, list(), read(id) }
 */
const j = async (url, opts = {}) => {
  const r = await fetch(url, opts);
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, body: t }; }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createMailbox() {
  const doms = await j('https://api.mail.tm/domains');
  const list = doms.body['hydra:member'] || doms.body.member || [];
  if (!list.length) throw new Error('mail.tm: no domains available');
  const domain = list[0].domain;
  const user = `yuukapa${Date.now().toString().slice(-7)}`;
  const password = 'YuuKapaDemo3D2026!';
  const address = `${user}@${domain}`;

  let created = false;
  for (let i = 0; i < 10 && !created; i++) {
    const r = await j('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    if (r.status < 300) { created = true; break; }
    console.log(`[mail] account attempt ${i} → ${r.status}`);
    await sleep(15000);
  }
  if (!created) throw new Error('mail.tm: could not create the account');

  let token = null;
  for (let i = 0; i < 8 && !token; i++) {
    await sleep(3000);
    const t = await j('https://api.mail.tm/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    if (t.status < 300) token = t.body.token;
  }
  if (!token) throw new Error('mail.tm: no token');

  const headers = { 'authorization': `Bearer ${token}` };
  return {
    provider: 'mail.tm',
    address,
    password,
    list: async () => {
      const r = await j('https://api.mail.tm/messages', { headers });
      return (r.body['hydra:member'] || r.body.member || []);
    },
    read: async (id) => {
      const r = await j(`https://api.mail.tm/messages/${id}`, { headers });
      return r.body.text || r.body.html?.[0] || JSON.stringify(r.body);
    },
  };
}
