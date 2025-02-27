import PDFDocument from "pdfkit";
import User from "../modals/user.modal.js";
import vendorServiceListingFormModal from "../modals/vendorServiceListingForm.modal.js";

export const generateInvoice = (order) => {
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];

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
          const platformGstPerItem = order.platformGstAmount / order.items.length;

          return {
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
          };
        })
      );

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      doc.fillColor("#333").fontSize(24).text("Invoice", { align: "center", underline: true });
      doc.moveDown();
      doc.fillColor("#555").fontSize(14).text(`Customer Name: ${customerName}`);
      doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Order ID: ${order.OrderId}`);
      doc.text(
        `Address: ${order.address.name}, ${order.address.address}, ${order.address.addressLine1}, ${order.address.addressLine2}, ${order.address.state} - ${order.address.pinCode}`
      );
      doc.moveDown();
      
      doc.fillColor("#222").fontSize(12).text("Item Details:", { underline: true });
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fillColor("#444");
      doc.text("Item", 50, doc.y, { continued: true }).text("Qty", 150, doc.y, { continued: true }).text("Price", 200, doc.y, { continued: true })
        .text("CGST", 270, doc.y, { continued: true }).text("SGST", 320, doc.y, { continued: true })
        .text("Platform Fee", 380, doc.y, { continued: true }).text("Platform GST", 460, doc.y).moveDown(0.5);
      doc.font("Helvetica").fillColor("#000");
      
      // Table Data
      itemDetails.forEach((item) => {
        doc.text(item.name, 50, doc.y, { continued: true });
        doc.text(item.quantity.toString(), 150, doc.y, { continued: true });
        doc.text(`Rs${item.price.toFixed(2)}`, 200, doc.y, { continued: true });
        doc.text(`Rs${item.cgst.toFixed(2)}`, 270, doc.y, { continued: true });
        doc.text(`Rs${item.sgst.toFixed(2)}`, 320, doc.y, { continued: true });
        doc.text(`Rs${item.platformFeePerItem.toFixed(2)}`, 380, doc.y, { continued: true });
        doc.text(`Rs${item.platformGstPerItem.toFixed(2)}`, 460, doc.y);
      });
      doc.moveDown();
      
      // Totals
      const totalCGST = order.totalGst / 2;
      const totalSGST = order.totalGst / 2;
      
      doc.fillColor("#222").fontSize(14);
      doc.text(`Subtotal: Rs${(order.totalAmount - order.totalGst).toFixed(2)}`, { align: "right" });
      doc.text(`CGST (9%): Rs${totalCGST.toFixed(2)}`, { align: "right" });
      doc.text(`SGST (9%): Rs${totalSGST.toFixed(2)}`, { align: "right" });
      doc.text(`Platform Fee: Rs${order.platformFee.toFixed(2)}`, { align: "right" });
      doc.text(`Platform GST: Rs${order.platformGstAmount.toFixed(2)}`, { align: "right" });
      doc.moveDown();
      
      doc.fontSize(16).fillColor("#ff5722").text(`Total Amount: Rs${order.totalAmount.toFixed(2)}`, { align: "right", bold: true });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};