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
            model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });
        
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('[ModelGateway] Error generating AI response:', error.message);
        // Fallback jika limit atau model tidak ditemukan (400 / 429)
        if (error.status === 429 || error.status === 400 || error.status === 404) {
            console.log('[ModelGateway] Menggunakan fallback ke model ringan (openai/gpt-oss-20b)...');
            try {
                const fallbackCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...chatHistory
                    ],
                    model: 'openai/gpt-oss-20b',
                    response_format: { type: 'json_object' },
                    temperature: 0.5,
                });
                return JSON.parse(fallbackCompletion.choices[0].message.content);
            } catch (fallbackError) {
                console.error('[ModelGateway] Fallback juga gagal:', fallbackError.message);
                throw fallbackError;
            }
        }
        throw error;
    }
}

module.exports = { generateResponse };
