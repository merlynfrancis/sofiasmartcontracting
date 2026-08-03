/*
 * /api/contact — Vercel serverless function.
 *
 * Receives a contact-form submission, builds a branded HTML email, and sends it
 * to info@sofiacontracting.com over SMTP (Google Workspace) with nodemailer.
 *
 * All credentials come from environment variables (set in Vercel → Settings →
 * Environment Variables). Nothing secret lives in this file or the repo:
 *   SMTP_HOST   smtp.gmail.com
 *   SMTP_PORT   465
 *   SMTP_USER   info@sofiacontracting.com
 *   SMTP_PASS   a Google App Password (NOT the normal login password — Google
 *               blocks the normal password for SMTP)
 *   MAIL_TO     where enquiries are delivered (defaults to SMTP_USER)
 *   SITE_URL    used to load the logo into the email
 */
const nodemailer = require('nodemailer');
const mailTpl = require('../lib/email');

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  var body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  var name = (body.name || '').toString().trim();
  var company = (body.company || '').toString().trim();
  var phone = (body.phone || '').toString().trim();
  var email = (body.email || '').toString().trim();

  if (!name || !phone || phone.replace(/\D/g, '').length < 7 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please provide a name, a valid phone number, and a valid email.' });
  }

  var user = process.env.SMTP_USER;
  var pass = process.env.SMTP_PASS;
  var host = process.env.SMTP_HOST || 'smtp.gmail.com';
  var port = parseInt(process.env.SMTP_PORT || '465', 10);
  var to = process.env.MAIL_TO || user || 'info@sofiacontracting.com';
  var siteUrl = (process.env.SITE_URL || 'https://sofiasmartcontracting.vercel.app').replace(/\/+$/, '');

  if (!user || !pass) {
    return res.status(500).json({ ok: false, error: 'Email is not configured. Set SMTP_USER and SMTP_PASS in Vercel.' });
  }

  var data = { name: name, company: company || '(not provided)', phone: phone, email: email };

  try {
    var transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: { user: user, pass: pass }
    });
    await transporter.sendMail({
      from: '"Sofia Website" <' + user + '>',
      to: to,
      replyTo: email,
      subject: 'New website enquiry from ' + name,
      text: mailTpl.buildText(data),
      html: mailTpl.buildHtml(data, siteUrl)
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact sendMail failed:', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not send your message right now. Please try again shortly.' });
  }
};
