const { generateResponse } = require('../../ai/modelGateway');
const { getChatHistory, addMessageToMemory } = require('../../ai/memoryService');
const { SALES_PROMPT } = require('../../config/prompts/salesPrompt');

async function handleSalesChat(phone, text, state) {
    // Tambahkan input user ke memori
    await addMessageToMemory(phone, 'user', text);
    const history = await getChatHistory(phone);
    
    // Inject current state ke system prompt agar AI tau konteks
    const dynamicPrompt = SALES_PROMPT + `\n\n[STATE SAAT INI]\n${JSON.stringify(state, null, 2)}`;
    
    // Tarik output dari Llama-3
    const aiOutput = await generateResponse(dynamicPrompt, history);
    
    // Tambahkan balasan AI ke memori
    if (aiOutput.reply && aiOutput.reply.length > 0) {
        await addMessageToMemory(phone, 'assistant', aiOutput.reply.join(' '));
    }

    // Kembalikan objek output terstruktur (reply array, state, dll)
    return {
        reply: aiOutput.reply || [],
        state: { ...state, ...(aiOutput.state || {}) },
        intent: aiOutput.intent || 'chat'
    };
}

module.exports = { handleSalesChat };
