const axios = require('axios');

const sendWhatsApp = async (phone, apiKey, message) => {
  try {
    const encodedMsg = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMsg}&apikey=${apiKey}`;
    await axios.get(url, { timeout: 10000 });
    return true;
  } catch (error) {
    console.error('WhatsApp notification failed:', error.message);
    return false;
  }
};

module.exports = { sendWhatsApp };
