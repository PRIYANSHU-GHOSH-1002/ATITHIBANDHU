// backend/services/sms.js
const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSOS(toNumber, message) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: toNumber, // must be E.164, e.g. +919876543210
  });
}

module.exports = { sendSOS };