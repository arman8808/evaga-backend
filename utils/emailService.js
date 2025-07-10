import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import ejs from "ejs";
import { fileURLToPath } from "url";

// Configure __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "info@evagaentertainment.com",
    pass: "omtc lufb epyy bqdx",
  },
});

export const sendEmail = async (
  templateName,
  email,
  subject,
  variables = {}
) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    `${templateName}.ejs`
  );

  // Verify template exists
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName} at ${templatePath}`);
  }

  // Render HTML content
  const template = fs.readFileSync(templatePath, "utf-8");
  const htmlContent = ejs.render(template, variables);

  const mailOptions = {
    from: "info@evagaentertainment.com",
    to: email,
    subject,
    html: htmlContent,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    return info.response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
