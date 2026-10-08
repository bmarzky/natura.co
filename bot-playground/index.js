const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('./src/app');
const { fetchKotaJuangVillages } = require('./src/services/locationService');

const PORT = process.env.PORT || 3000;

fetchKotaJuangVillages().then(() => {
    app.listen(PORT, () => {
      console.log(`🤖 Natura Bot API (Powered by Groq) is running on http://localhost:${PORT}`);
    });
});
