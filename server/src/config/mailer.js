// server/src/config/mailer.js
const nodemailer = require("nodemailer");

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP envs (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)");
  }

  return { host, port, secure, auth: { user, pass } };
}

const transporter = nodemailer.createTransport(getSmtpConfig());

/**
 * Basic branded HTML wrapper for TalentTrack.
 * Keep HTML minimal (email clients are fragile).
 */
function wrapHtml({ title, bodyHtml, footerHtml }) {
  const brand = "TalentTrack";
  const footer =
    footerHtml ||
    `<p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} ${brand}. If you didn’t request this, you can ignore this email.</p>`;

  return `
  <div style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:16px 20px;background:#111827;color:#ffffff;">
        <div style="font-size:16px;font-weight:700;">${brand}</div>
        <div style="font-size:12px;opacity:.85;">Assessment & Learning Portal</div>
      </div>
      <div style="padding:20px;">
        <h2 style="margin:0 0 12px 0;font-size:18px;color:#111827;">${title}</h2>
        <div style="color:#111827;font-size:14px;line-height:1.6;">
          ${bodyHtml}
        </div>
      </div>
      <div style="padding:14px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        ${footer}
      </div>
    </div>
  </div>`;
}

/**
 * sendMail
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} [params.text]
 * @param {string} [params.html]
 */
async function sendMail({ to, subject, text, html }) {
  const fromName = process.env.MAIL_FROM_NAME || "TalentTrack";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html
  });

  return info;
}

module.exports = {
  transporter,
  sendMail,
  wrapHtml
};
