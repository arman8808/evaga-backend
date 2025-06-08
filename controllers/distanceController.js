import { DistanceModel } from "../modals/distanceModel.js";

export class DistanceController {
  static async calculateDistance(req, res) {
    try {
      const { userPincode, vendorPincode } = req.body;
      console.log(userPincode, vendorPincode);

      if (!userPincode || !vendorPincode) {
        return res.status(400).json({
          success: false,
          error: "Both userPincode and vendorPincode are required.",
        });
      }

      const distance = await DistanceModel.calculateDistance(
        userPincode,
        vendorPincode
      );

      res.json({
        success: true,
        data: distance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
