const { Groq } = require('groq-sdk');
const { SYSTEM_PROMPT } = require('../config/prompt');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const chatHistories = {};

async function processMessage(phone, text) {
  // Buat sesi baru jika belum ada
  if (!chatHistories[phone]) {
    chatHistories[phone] = [];
  }

  // Tambahkan pesan user ke histori
  chatHistories[phone].push({ role: 'user', content: text });

  try {
    const currentDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dynamicSystemPrompt = SYSTEM_PROMPT + `\n\nINFO SISTEM (PENTING):\nTanggal Hari Ini adalah: ${currentDate}. Gunakan tanggal ini sebagai acuan SATU-SATUNYA untuk menghitung waktu relatif secara akurat (misal "besok", "jumat depan", dll).`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: dynamicSystemPrompt },
        ...chatHistories[phone]
      ],
      model: 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const botResponse = completion.choices[0].message.content;
    const data = JSON.parse(botResponse);

    // Tambahkan balasan bot ke histori
    chatHistories[phone].push({ role: 'assistant', content: botResponse });

    return data;
  } catch (err) {
    console.error('Groq API Error:', err);
    return {
      reply: ["Mohon maaf, layanan pelanggan kami sedang mengalami gangguan sementara."],
      state: { error: true }
    };
  }
}

module.exports = { processMessage };
