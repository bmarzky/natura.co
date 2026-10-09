const { Groq } = require('groq-sdk');

// Inisialisasi Groq Client (Singleton)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Fungsi serbaguna untuk mengirim prompt ke LLM (Llama-3)
 * Digunakan oleh semua Agent (Sales, Finance, dll)
 */
async function generateResponse(systemPrompt, chatHistory) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                ...chatHistory
            ],
            model: 'openai/gpt-oss-120b', // Default Groq model dari konfigurasi lama
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });
        
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('[ModelGateway] Error generating AI response:', error.message);
        throw error;
    }
}

module.exports = { generateResponse };
