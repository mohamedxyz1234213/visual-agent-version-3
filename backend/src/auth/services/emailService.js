// ── Email service ─────────────────────────────────────────────────────────────
// Three delivery channels, picked in order:
//   1. Real SMTP  — set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
//   2. Ethereal   — set SMTP_TEST_MODE=true. Auto-creates a free nodemailer test
//                   account, sends a real message, and returns a preview URL you
//                   can open in a browser to see exactly what was sent.
//   3. Console    — fallback. Logs the link to the server console + admin panel.

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
const SMTP_FROM = process.env.SMTP_FROM || 'no-reply@whiteboard.local';
const SMTP_TEST_MODE = (process.env.SMTP_TEST_MODE || '').toLowerCase() === 'true';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

let _transporter = null;
let _transporterMode = null;
let _etherealAccount = null;

async function getEtherealAccount() {
  if (_etherealAccount) return _etherealAccount;
  const account = await nodemailer.createTestAccount();
  _etherealAccount = account;
  console.log(`[email] Ethereal test account created: ${account.user} (preview at https://ethereal.email)`);
  return account;
}

async function getTransporter() {
  if (_transporter) return _transporter;

  if (SMTP_TEST_MODE) {
    const account = await getEtherealAccount();
    _transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    _transporterMode = 'ethereal';
    return _transporter;
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    _transporterMode = 'smtp';
    console.log(`[email] SMTP transporter ready: ${SMTP_HOST}:${SMTP_PORT} (secure=${SMTP_SECURE})`);
    return _transporter;
  }

  return null;
}

function buildInviteEmail({ to, username, inviteUrl, expiresInHours = 72 }) {
  const subject = 'You are invited to Whiteboard Teacher';
  const text = [
    `Hi ${username},`,
    '',
    'Your early-access request to Whiteboard Teacher has been approved.',
    `Use the link below to create your account. It expires in ${expiresInHours} hours.`,
    '',
    inviteUrl,
    '',
    'If you did not request access, you can ignore this email.',
    '',
    '— Whiteboard Teacher',
  ].join('\n');
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <div style="font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #94a3b8; font-weight: 600;">Whiteboard Teacher</div>
      <h1 style="font-family: Georgia, serif; font-weight: 600; font-size: 28px; letter-spacing: -0.04em; margin: 12px 0 16px;">You're in, ${username}.</h1>
      <p style="font-size: 15px; line-height: 1.7; color: #334155;">Your early-access request has been approved. Create your account using the email and username you originally submitted.</p>
      <p style="margin: 28px 0;">
        <a href="${inviteUrl}" style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 14px 22px; border-radius: 14px; font-weight: 600; font-size: 14px;">Create your account →</a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #64748b;">Or paste this link:<br/><span style="color: #0f172a; word-break: break-all;">${inviteUrl}</span></p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">This link expires in ${expiresInHours} hours. If you didn't request access, you can ignore this message.</p>
    </div>
  `;
  return { subject, text, html };
}

/**
 * Send (or log) the early-access invite email.
 * Always resolves to { delivered, inviteUrl, channel, previewUrl? }.
 *   channel:    'smtp' | 'ethereal' | 'console'
 *   previewUrl: only present when channel === 'ethereal' — open it in a browser
 *               to see the actual email that was sent.
 */
export async function sendInviteEmail({ to, username, token }) {
  const inviteUrl = `${PUBLIC_BASE_URL.replace(/\/$/, '')}/signup/${token}`;
  const tpl = buildInviteEmail({ to, username, inviteUrl });

  try {
    const transporter = await getTransporter();
    if (transporter) {
      const info = await transporter.sendMail({ from: SMTP_FROM, to, subject: tpl.subject, text: tpl.text, html: tpl.html });
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (_transporterMode === 'ethereal') {
        console.log(`[email] ✅ Invite sent to ${to} via Ethereal. Preview: ${previewUrl}`);
        return { delivered: true, inviteUrl, channel: 'ethereal', previewUrl };
      }
      console.log(`[email] ✅ Invite sent to ${to} via SMTP.`);
      return { delivered: true, inviteUrl, channel: 'smtp' };
    }
  } catch (err) {
    console.error('[email] Send failed; falling back to console log:', err.message);
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('📧  Early-Access Invite (no SMTP configured)');
  console.log(`    To:      ${to}`);
  console.log(`    Subject: ${tpl.subject}`);
  console.log(`    Link:    ${inviteUrl}`);
  console.log('────────────────────────────────────────────────────────\n');
  return { delivered: false, inviteUrl, channel: 'console' };
}

export function getEmailMode() {
  if (SMTP_TEST_MODE) return 'ethereal';
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) return 'smtp';
  return 'console';
}
