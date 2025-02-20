import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params; 

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const response = await razorpay.orders.fetchPayments(orderId);

    if (!response.items || response.items.length === 0) {
      return res.status(404).json({ success: false, message: "No payments found for this order" });
    }

    
    const payment = response.items[0];
    const paymentDetails = {
      paymentId: payment.id,
      amount: payment.amount / 100, 
      currency: payment.currency,
      status: payment.status, 
      method: payment.method, 
      created_at: new Date(payment.created_at * 1000),
    };
    console.log(response);
    

    return res.json({ success: true, paymentDetails });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
