import { sendTemplateMessage } from "../controllers/wati.controller.js";
import User from "../modals/user.modal.js";
import Vender from "../modals/vendor.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";

export const generateInvoice = (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(order.userId);
      const customerName = user?.name || "Unknown Customer";

      const itemDetails = await Promise.all(
        order.items.map(async (item) => {
          const service = await vendorServiceListingFormModal.findById(
            item.serviceId
          );
          const packageDetails = service?.services.find(
            (pkg) => pkg._id.toString() === item.packageId.toString()
          );

          let extractedDetails = null;
          if (packageDetails?.values instanceof Map) {
            extractedDetails = {
              Title:
                packageDetails.values.get("Title") ||
                packageDetails.values.get("VenueName") ||
                packageDetails.values.get("FoodTruckName"),
            };
          } else if (packageDetails?.values) {
            extractedDetails = {
              Title:
                packageDetails.values.Title ||
                packageDetails.values.VenueName ||
                packageDetails.values.FoodTruckName,
            };
          }

          const cgst = item.gstAmount / 2;
          const sgst = item.gstAmount / 2;
          const platformFeePerItem = order.platformFee / order.items.length;
          const platformGstPerItem =
            order.platformGstAmount / order.items.length;

          const vendor = await Vender.findById(item.vendorId);
          const vendorName = vendor?.userName;

          const invoiceDetails = {
            name: extractedDetails?.Title || "Unknown Item",
            quantity: item.selectedSessions.reduce(
              (acc, session) => acc + (session.quantity || 0),
              0
            ),
            price: item.totalPrice,
            gst: item.gstAmount,
            gstPercentage: item.gstPercentage,
            cgst,
            sgst,
            platformFeePerItem,
            platformGstPerItem,
            vendorName,
          };
          await sendEmail(
            "userBookingConfirmation",
            user?.email,
            "Your Booking is Confirmed! 🎉",
            {
              customerName: user?.name,
              vendorName: vendorName,
              serviceName: extractedDetails?.Title,
              eventDate: item?.date,
              eventTime: item?.time,
              bookingDetailsUrl: "https://www.eevagga.com",
            }
          );
          await sendEmail(
            "vendorbookingnotification",
            vendor?.email,
            "Your Booking is Confirmed! 🎉",
            {
              vendorName: vendor?.name,
              eventType: extractedDetails?.Title,
              eventDate: item?.date,
              eventTime: item?.time,
              eventLocation: `${order?.address?.address}, ${order?.address?.addressLine1}, ${order?.address?.addressLine2}, ${order?.address?.state}, ${order?.address?.pinCode}`,
              customerName: user?.name,
            }
          );

          await sendTemplateMessage(
            user?.phoneNumber,
            "order_confirmation_for_user_n",
            [
              { name: "1", value: user?.name },
              { name: "2", value: vendorName },
              { name: "3", value: extractedDetails?.Title },
              { name: "4", value: `${item?.date} ${item?.time}` },
            ]
          );
          await sendTemplateMessage(vendor?.phoneNumber, "new_booking_alert_new", [
            { name: "1", value: extractedDetails?.Title },
            { name: "2", value: `${item?.date} ${item?.time}` },
            {
              name: "3",
              value: `${order?.address?.address}, ${order?.address?.addressLine1}, ${order?.address?.addressLine2}, ${order?.address?.state}, ${order?.address?.pinCode}`,
            },
            { name: "4", value: user?.name },
          ]);

          return invoiceDetails;
        })
      );

      resolve(itemDetails);
    } catch (error) {
      reject(error);
    }
  });
};
