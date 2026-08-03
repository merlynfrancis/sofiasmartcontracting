/*
 * Branded email template for contact-form submissions.
 * Kept out of /api so Vercel does not treat it as its own route; it is bundled
 * into the contact function via require('../lib/email').
 */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function row(label, valueHtml) {
  return (
    '<tr><td style="padding:14px 0;border-bottom:1px solid #eee7db;">' +
      '<div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#b39a72;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">' + label + '</div>' +
      '<div style="font-size:17px;color:#2a221c;margin-top:4px;font-family:Arial,Helvetica,sans-serif;">' + valueHtml + '</div>' +
    '</td></tr>'
  );
}

function buildHtml(d, siteUrl) {
  var rows =
    row('Name', esc(d.name)) +
    row('Company', esc(d.company)) +
    row('Phone', '<a href="tel:' + esc(d.phone.replace(/[^\d+]/g, '')) + '" style="color:#2a221c;text-decoration:none;">' + esc(d.phone) + '</a>') +
    row('Email', '<a href="mailto:' + esc(d.email) + '" style="color:#2a221c;text-decoration:none;">' + esc(d.email) + '</a>');

  return (
'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
'<body style="margin:0;padding:0;background:#f2f1ea;">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ea;padding:28px 12px;"><tr><td align="center">' +
  '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(62,50,40,.10);">' +
    '<tr><td style="background:#3e3228;padding:28px 32px;text-align:center;">' +
      '<img src="' + siteUrl + '/images/sofia-lockup.png" alt="Sofia Smart Contracting" width="190" style="width:190px;max-width:62%;height:auto;display:inline-block;border:0;">' +
    '</td></tr>' +
    '<tr><td style="background:#b39a72;height:5px;line-height:5px;font-size:0;">&nbsp;</td></tr>' +
    '<tr><td style="padding:32px 32px 8px;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#b39a72;font-weight:bold;">New Website Enquiry</div>' +
      '<div style="font-size:24px;line-height:1.2;color:#2a221c;font-weight:bold;margin-top:8px;">You have a new enquiry</div>' +
      '<div style="font-size:14px;color:#6b5d50;margin-top:8px;">Someone just submitted the contact form on the Sofia website.</div>' +
    '</td></tr>' +
    '<tr><td style="padding:16px 32px 8px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + '</table>' +
    '</td></tr>' +
    '<tr><td style="padding:22px 32px 32px;font-family:Arial,Helvetica,sans-serif;">' +
      '<a href="mailto:' + esc(d.email) + '" style="display:inline-block;background:#3e3228;color:#f2e0c4;text-decoration:none;font-size:14px;font-weight:bold;padding:13px 24px;border-radius:9px;">Reply to ' + esc(d.name.split(' ')[0]) + '</a>' +
    '</td></tr>' +
    '<tr><td style="background:#faf7f1;border-top:1px solid #ece5d9;padding:22px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;">' +
      '<div style="font-size:13px;color:#8a7a6a;font-weight:bold;">Sofia Smart Contracting &nbsp;&middot;&nbsp; صوفيا سمارت للمقاولات</div>' +
      '<div style="font-size:12px;color:#b0a495;margin-top:5px;">General contracting and subcontracting, built around the client experience.</div>' +
    '</td></tr>' +
  '</table>' +
'</td></tr></table></body></html>'
  );
}

function buildText(d) {
  return [
    'New website enquiry',
    '',
    'Name:    ' + d.name,
    'Company: ' + d.company,
    'Phone:   ' + d.phone,
    'Email:   ' + d.email,
    '',
    'Reply to this email to respond to ' + d.name + '.'
  ].join('\n');
}

module.exports = { buildHtml: buildHtml, buildText: buildText, esc: esc };
