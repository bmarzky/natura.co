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
            model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });
        
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('[ModelGateway] Error generating AI response:', error.message);
        // Jika Rate Limit tercapai, coba fallback ke model 8B yang limitnya biasanya lebih besar
        if (error.status === 429) {
            console.log('[ModelGateway] Rate limit tercapai! Mencoba fallback ke model ringan (llama-3.1-8b-instant)...');
            try {
                const fallbackCompletion = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...chatHistory
                    ],
                    model: 'llama-3.1-8b-instant',
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
