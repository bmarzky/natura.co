const { generateResponse } = require('../../ai/modelGateway');
const { getChatHistory, addMessageToMemory } = require('../../ai/memoryService');
const { SALES_PROMPT } = require('../../config/prompts/salesPrompt');

async function handleSalesChat(phone, text, state) {
    // Optimasi 1: Jangan tunggu simpan pesan user (Fire and Forget)
    addMessageToMemory(phone, 'user', text).catch(e => console.log('Error memori:', e));
    
    // Ambil history lama, dan sisipkan pesan user yang baru secara manual di memori lokal (menghemat 1 round-trip)
    const history = await getChatHistory(phone);
    history.push({ role: 'user', content: text });
    
    // Inject current state ke system prompt agar AI tau konteks
    const dynamicPrompt = SALES_PROMPT + `\n\n[STATE SAAT INI]\n${JSON.stringify(state, null, 2)}`;
    
    // Tarik output dari Llama-3
    const aiOutput = await generateResponse(dynamicPrompt, history);
    
    // Optimasi 2: Jangan tunggu simpan pesan AI (Fire and Forget)
    if (aiOutput.reply && aiOutput.reply.length > 0) {
        addMessageToMemory(phone, 'assistant', aiOutput.reply.join(' ')).catch(e => console.log('Error memori:', e));
    }

    // Kembalikan objek output terstruktur (reply array, state, dll)
    return {
        reply: aiOutput.reply || [],
        state: { ...state, ...(aiOutput.state || {}) },
        intent: aiOutput.intent || 'chat'
    };
}

module.exports = { handleSalesChat };
