import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: "info@evagaentertainment.com", 
    pass: "qzfj zdgc esnw qcvp", 
  },
});


export const sendEmail = async (to, subject, text,options = {}) => {
  const { attachments } = options;
  const mailOptions = {
    from: "your-email@gmail.com", // Sender's email address
    to, // Receiver's email address
    subject, // Email subject
    text, // Email body
    ...(attachments && { attachments }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info.response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
