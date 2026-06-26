const nodemailer = require('nodemailer');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: ''
    };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let body;
  try { body = JSON.parse(event.body); }
  catch(e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const { numero, nombre, telefono, email, anioFiscal, pdfBase64 } = body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: '"Avanty Services" <' + process.env.GMAIL_USER + '>',
    to: process.env.GMAIL_USER,
    subject: 'Nuevo Cuestionario de Cliente - ' + numero,
    html: '<div style="font-family:Arial,sans-serif;max-width:600px">' +
          '<div style="background:#821414;color:white;padding:20px;border-radius:8px 8px 0 0">' +
          '<h2 style="margin:0">Nuevo Cuestionario Recibido</h2></div>' +
          '<div style="padding:20px;border:1px solid #ddd;border-radius:0 0 8px 8px">' +
          '<table style="width:100%;border-collapse:collapse">' +
          '<tr><td style="padding:8px;font-weight:bold;color:#555;width:40%">No. Confirmacion:</td><td style="padding:8px">' + numero + '</td></tr>' +
          '<tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#555">Cliente:</td><td style="padding:8px">' + nombre + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;color:#555">Telefono:</td><td style="padding:8px">' + telefono + '</td></tr>' +
          '<tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold;color:#555">Email:</td><td style="padding:8px">' + email + '</td></tr>' +
          '<tr><td style="padding:8px;font-weight:bold;color:#555">Ano Fiscal:</td><td style="padding:8px">' + anioFiscal + '</td></tr>' +
          '</table>' +
          '<p style="color:#666;margin-top:16px">El cuestionario completo se encuentra adjunto en PDF.</p>' +
          '</div></div>',
    attachments: [
      {
        filename: 'Cuestionario-' + numero + '.pdf',
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true })
    };
  } catch(err) {
    console.error('Email error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
