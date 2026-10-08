// Native fetch available in Node.js 18+

/**
 * Menerjemahkan koordinat Latitude & Longitude (dari WhatsApp ShareLoc)
 * menjadi nama Desa dan Kecamatan menggunakan OpenStreetMap (Nominatim API) gratis.
 */
async function reverseGeocode(latitude, longitude) {
    try {
        // Panggil Nominatim API
        // User-Agent sangat penting untuk Nominatim API agar tidak diblokir
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
                'User-Agent': 'NaturaHouseBot/1.0 (info@naturahouse.com)'
            }
        });
        
        const data = await response.json();
        
        if (data && data.address) {
            // Ambil nama desa (bisa village, suburb, atau hamlet tergantung pemetaan)
            const village = data.address.village || data.address.suburb || data.address.hamlet || '';
            const district = data.address.city_district || data.address.county || data.address.town || '';
            
            return {
                village: village,
                district: district,
                full_address: data.display_name
            };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error.message);
        return null;
    }
}

module.exports = {
    reverseGeocode
};
