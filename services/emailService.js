const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: Number(process.env.NODEMAILER_PORT || 587),
    secure: String(process.env.NODEMAILER_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || 'no-reply@farmhub.local';
  return t.sendMail({ from, to, subject, html, text });
}

module.exports = { sendEmail };