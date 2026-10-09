// Native fetch available in Node.js 18+

const KOTA_JUANG_CODE = '11.11.13';
let kotaJuangVillages = [];

async function fetchKotaJuangVillages() {
    try {
        const response = await fetch('https://api.kemendesa.link/kode-wilayah/api/wilayah/latest/desa');
        const data = await response.json();
        const villages = data.data.filter(x => x.code.startsWith(KOTA_JUANG_CODE));
        kotaJuangVillages = villages.map(v => v.name);
        console.log(`[LocationService] Loaded ${kotaJuangVillages.length} villages for Kota Juang.`);
        return kotaJuangVillages;
    } catch (e) {
        console.error('Error fetching Kemendesa API:', e.message);
        // Fallback list just in case API is down
        return [
            'Bandar Bireuen', 'Bireuen Meunasah Reulet', 'Bireuen Meunasah Blang',
            'Bireuen Meunasah Capa', 'Bireuen Meunasah Dayah', 'Bireuen Meunasah Tgk Digadong',
            'Geudong-Geudong', 'Pulo Ara Geudong Teungoh', 'Geudong Alue', 'Pulo Kiton',
            'Lhok Awe Teungoh', 'Geulanggang Teungoh', 'Cot Gapu', 'Geulanggang Kulam',
            'Geulanggang Gampong', 'Blang Tingkeum', 'Buket Teukueh', 'Blang Reuling',
            'Cot Jrat', 'Cot Peutek', 'Uteun Reutoh', 'Geulanggang Baro', 'Gampong Baro'
        ];
    }
}

function getVillages() {
    return kotaJuangVillages;
}

module.exports = {
    fetchKotaJuangVillages,
    getVillages
};
