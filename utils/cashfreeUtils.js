import cashfreeClient from "../config/cashfreeConfig.js";

/**
 * Function to create an order in Cashfree
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} - Order response from Cashfree
 */
export const createCashfreeOrder = async (orderData) => {
    try {
      const response = await Cashfree.Order.create({
        order_id: orderData.orderId,
        order_amount: orderData.orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: orderData.customerId,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
        },
        order_note: orderData.orderNote || "Payment for order",
      });
  
      return { success: true, data: response };
    } catch (error) {
      console.error("Error creating order:", error.message);
      return { success: false, error: error.message };
    }
  };
  