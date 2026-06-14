// Self-hosted contact form handler — no third-party form service.
// Runs as a Vercel serverless function (Node.js runtime).
// Sends an email via Zoho Mail SMTP using Nodemailer + an app-specific password.
//
// Required environment variables (set in Vercel → Project → Settings → Environment Variables):
//   CONTACT_EMAIL_USER         — the Zoho mailbox that sends AND receives the lead emails (info@rjstreecare.com)
//   CONTACT_EMAIL_APP_PASSWORD — a Zoho "Application-Specific Password" (NOT the mailbox login password)
//
// How to generate a Zoho Application-Specific Password:
//   1. Log into mail.zoho.com with the info@rjstreecare.com mailbox
//   2. Go to zoho.com/mail → Settings (gear icon) → Security → App Passwords
//      (or directly: accounts.zoho.com/home#security/app_passwords)
//   3. Generate a new app password named "RJ's Tree Care Website"
//   4. Copy the generated code — that's CONTACT_EMAIL_APP_PASSWORD

const nodemailer = require('nodemailer');

// Friendly labels for known form fields — anything else falls back to its raw key
const FIELD_LABELS = {
  fname: 'First Name',
  lname: 'Last Name',
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  address: 'Property Address',
  service: 'Service Needed',
  'tree-size': 'Approx. Tree Size',
  urgency: 'Urgency',
  message: 'Details',
};

// Internal/anti-spam fields that should never be rendered into the email body
const SKIP_FIELDS = new Set(['_subject', '_gotcha']);

// Phrases that show up almost exclusively in "we'll do your SEO/video/marketing" pitches,
// not in real tree service requests. Case-insensitive substring match against the
// "message" field. Real submissions about trees never use this language.
const SPAM_PITCH_PHRASES = [
  'seo',
  'search engine ranking',
  'search engine optimization',
  'backlink',
  'increase your traffic',
  'drive more traffic',
  'google ranking',
  'rank higher',
  'social media marketing',
  'digital marketing',
  'video to advertise',
  'promotional video',
  'website design services',
  'web design services',
  'our prices start',
  'samples of our previous work',
  'portfolio of our work',
  'guest post',
  'link building',
];

function isSpamPitch(message) {
  if (typeof message !== 'string' || !message.trim()) return false;
  const lower = message.toLowerCase();
  return SPAM_PITCH_PHRASES.some((phrase) => lower.includes(phrase));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let data = req.body;
  // Vercel auto-parses JSON and urlencoded bodies into objects; guard against edge cases
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid form submission' });
  }

  // Honeypot — a hidden field real visitors never fill in. Bots usually fill everything.
  // We return 200 so the bot thinks it worked, but we never send an email.
  if (data._gotcha) {
    return res.status(200).json({ ok: true });
  }

  // SEO/marketing-pitch spam — people manually filling out the real form fields to
  // solicit services, not request tree work. Pretend success, don't email Ron.
  if (isSpamPitch(data.message)) {
    console.log('Blocked likely spam submission (marketing pitch detected in message field)');
    return res.status(200).json({ ok: true });
  }

  // Require at least a way to reach the person back
  if (!data.phone && !data.email) {
    return res.status(400).json({ ok: false, error: 'Please provide a phone number or email so we can reach you back.' });
  }

  if (!process.env.CONTACT_EMAIL_USER || !process.env.CONTACT_EMAIL_APP_PASSWORD) {
    console.error('Contact form misconfigured: CONTACT_EMAIL_USER / CONTACT_EMAIL_APP_PASSWORD env vars not set.');
    return res.status(500).json({ ok: false, error: 'Form is not fully configured yet. Please call us directly.' });
  }

  const rows = Object.entries(data)
    .filter(([key, val]) => !SKIP_FIELDS.has(key) && val !== undefined && val !== null && String(val).trim() !== '')
    .map(([key, val]) => {
      const label = FIELD_LABELS[key] || key;
      const safeVal = escapeHtml(val).replace(/\n/g, '<br>');
      return `<tr><td style="padding:6px 14px;font-weight:700;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 14px;">${safeVal}</td></tr>`;
    })
    .join('');

  const fromName = [data.fname, data.lname].filter(Boolean).join(' ') || data.name || 'A website visitor';
  const subjectPrefix = (typeof data._subject === 'string' && data._subject.trim()) ? data._subject.trim() : 'New message from RJsTreeCare.com';

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // true for port 465 (SSL)
      auth: {
        user: process.env.CONTACT_EMAIL_USER,
        pass: process.env.CONTACT_EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"RJ's Tree Care Website" <${process.env.CONTACT_EMAIL_USER}>`,
      to: process.env.CONTACT_EMAIL_USER,
      replyTo: typeof data.email === 'string' && data.email.trim() ? data.email.trim() : undefined,
      subject: `${subjectPrefix} — ${fromName}`,
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:600px;">
          <h2 style="margin:0 0 12px;color:#1f3d2b;">New estimate request — RJ's Tree Care website</h2>
          <table style="border-collapse:collapse;font-size:14px;width:100%;">${rows}</table>
          <p style="margin-top:18px;font-size:12px;color:#888;">Sent automatically from the contact form on rjstreecare.com</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form send error:', err);
    return res.status(502).json({ ok: false, error: 'Failed to send your message. Please call us directly.' });
  }
};
