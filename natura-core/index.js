const path = require('path');
const app = require('./src/app');
const { fetchKotaJuangVillages } = require('./src/services/locationService');

const PORT = process.env.PORT || 3000;

// Load data desa secara asinkron di latar belakang (tanpa menahan server menyala)
fetchKotaJuangVillages().catch(err => console.log("Gagal memuat desa:", err));

// Passenger cPanel mewajibkan app.listen dipanggil di top-level
app.listen(PORT, () => {
    console.log(`🤖 Natura Bot API is running on PORT ${PORT}`);
});
