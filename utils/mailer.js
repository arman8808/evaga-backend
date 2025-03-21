import mailchimp from "@mailchimp/mailchimp_transactional";
import { getTemplate } from "./template.js";
import dotenv from "dotenv";
dotenv.config();
const mailchimpClient = mailchimp(process.env.MailChimpKey);

export const sendEmail = async (
  templateName,
  recipientEmail,
  subject,
  variables
) => {
  try {
    const htmlContent = await getTemplate(templateName, variables);

    const response = await mailchimpClient.messages.send({
      message: {
        from_email: "info@evagaentertainment.com",
        subject: subject,
        html: htmlContent,
        to: [{ email: recipientEmail, type: "to" }],
      },
    });

    console.log("Email sent:", response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
import mandrillPkg from "mandrill-api";
const mandrill = mandrillPkg.Mandrill;

const mandrillClient = new mandrill(process.env.Mandrill);




import ejs from "ejs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function sendEmailWithTemplete(templateName, email, subject, variables = {}) {
  try {
    const templatePath = path.join(__dirname, "..", "templates", `${templateName}.ejs`);
    console.log("Looking for template at:", templatePath);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Email template "${templateName}" not found at ${templatePath}`
      );
    }

    const template = fs.readFileSync(templatePath, "utf-8");
    const htmlContent = ejs.render(template, variables);

    const message = {
      from_email: "info@evagaentertainment.com",
      to: [{ email: email, type: "to" }],
      subject: subject,
      html: htmlContent, 
    };

    await mandrillClient.messages.send({ message });
    console.log(`Email sent to ${email} using template "${templateName}"`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export default sendEmailWithTemplete;
// export default sendWelcomeEmail
