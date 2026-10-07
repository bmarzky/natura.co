require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🤖 Natura Bot API (Powered by Groq) is running on http://localhost:${PORT}`);
});
