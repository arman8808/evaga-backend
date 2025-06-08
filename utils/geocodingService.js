import axios from 'axios';

// Cache to avoid repeated API calls
const pincodeCache = new Map();

export class GeocodingService {
    static async getCoordinates(pincode, country = 'IN') {
        if (pincodeCache.has(pincode)) {
            return pincodeCache.get(pincode);
        }

        try {
            // Try Nominatim (OpenStreetMap)
            const nominatimResponse = await axios.get(
                `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=${country}&format=json`
            );

            if (nominatimResponse.data?.[0]) {
                const coords = {
                    lat: parseFloat(nominatimResponse.data[0].lat),
                    lng: parseFloat(nominatimResponse.data[0].lon)
                };
                pincodeCache.set(pincode, coords);
                return coords;
            }

            // Fallback to Geonames (if Nominatim fails)
            const geonamesResponse = await axios.get(
                `http://api.geonames.org/postalCodeSearchJSON?postalcode=${pincode}&country=${country}&username=YOUR_GEONAMES_USERNAME`
            );

            if (geonamesResponse.data?.postalCodes?.[0]) {
                const coords = {
                    lat: parseFloat(geonamesResponse.data.postalCodes[0].lat),
                    lng: parseFloat(geonamesResponse.data.postalCodes[0].lng)
                };
                pincodeCache.set(pincode, coords);
                return coords;
            }

            throw new Error("Pincode not found in any geocoding service.");
        } catch (error) {
            console.error(`Geocoding failed for ${pincode}:`, error.message);
            throw error;
        }
    }
}