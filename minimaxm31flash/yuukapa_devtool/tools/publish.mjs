#!/usr/bin/env node
/**
 * Publishes the showcase to surge.sh and completes the e-mail verification
 * with a disposable mailbox so the public URL actually resolves.
 */
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createMailbox } from './mailbox.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOMAIN = process.argv[2] || 'yuukapa-demo3d.surge.sh';
const SITE = process.argv[3] || '/tmp/surgepkg';

const mail = await createMailbox();
console.log('[mail] provider', mail.provider, 'address', mail.address);

const env = { ...process.env, ANSWERS: `${mail.address}|${mail.password}` };
console.log('[surge] publishing', SITE, '→', DOMAIN);
execFileSync('python3', [path.join(__dirname, 'pty_run.py'), 'npx', '--yes', 'surge@0.46.0', './', '--domain', DOMAIN],
  { cwd: SITE, env, stdio: 'inherit' });

let verified = false;
for (let i = 0; i < 24 && !verified; i++) {
  await new Promise((r) => setTimeout(r, 6000));
  const msgs = await mail.list();
  for (const m of msgs) {
    const id = m.id || m.mail_id;
    const body = await mail.read(id);
    const link = body.match(/https?:\/\/[^\s"'<>]*surge[^\s"'<>]*(verify|confirm|activate)[^\s"'<>]*/i)
      || body.match(/https?:\/\/[^\s"'<>]*surge\.sh[^\s"'<>]*/i);
    if (link) {
      console.log('[mail] verification link found →', link[0].slice(0, 120));
      await fetch(link[0]).catch(() => {});
      verified = true;
      break;
    }
  }
  if (!verified) console.log('[mail] waiting for the verification mail…');
}
console.log('[surge] verified:', verified);
console.log('URL: https://' + DOMAIN + '/');
