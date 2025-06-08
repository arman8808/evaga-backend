import axios from 'axios';
import { calculateHaversineDistance } from '../utils/haversine.js';
import { GeocodingService } from './geocodingService.js';

export class DistanceService {
    static async getRoadDistance(originPincode, destinationPincode) {
        try {
            const [origin, destination] = await Promise.all([
                GeocodingService.getCoordinates(originPincode),
                GeocodingService.getCoordinates(destinationPincode)
            ]);

            const osrmResponse = await axios.get(
                `http://router.project-osrm.org/route/v1/driving/` +
                `${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`
            );

            if (osrmResponse.data?.routes?.[0]?.distance) {
                return {
                    distance: (osrmResponse.data.routes[0].distance / 1000).toFixed(2), 
                    unit: "km",
                    method: "OSRM (road distance)",
                };
            }
            const haversineDistance = calculateHaversineDistance(
                origin.lat, origin.lng,
                destination.lat, destination.lng
            );

            return {
                distance: haversineDistance.toFixed(2),
                unit: "km",
                method: "Haversine (straight-line, approximate)",
                note: "Road distance unavailable. Showing straight-line distance."
            };
        } catch (error) {
            console.error("Distance calculation error:", error);
            throw new Error("Failed to calculate distance.");
        }
    }
}