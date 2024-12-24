import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: "client@branding360.in", 
    pass: "xwef omnf opgy ojhi", 
  },
});


export const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: "your-email@gmail.com", // Sender's email address
    to, // Receiver's email address
    subject, // Email subject
    text, // Email body
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
