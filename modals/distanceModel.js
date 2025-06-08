import { DistanceService } from "../utils/distanceService.js";


export class DistanceModel {
    static async calculateDistance(userPincode, vendorPincode) {
        try {
            const result = await DistanceService.getRoadDistance(userPincode, vendorPincode);
            return result;
        } catch (error) {
            throw new Error(`Distance calculation failed: ${error.message}`);
        }
    }
}