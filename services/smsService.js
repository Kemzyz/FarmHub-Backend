const twilio = require('twilio');

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Twilio credentials missing');
  }
  return twilio(sid, token);
}

async function sendSms({ to, body }) {
  const client = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  return client.messages.create({ from, to, body });
}

module.exports = { sendSms };