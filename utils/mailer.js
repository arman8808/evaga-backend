import mailchimp from '@mailchimp/mailchimp_transactional';
import { getTemplate } from './template.js';
import dotenv from "dotenv";
dotenv.config();
const mailchimpClient = mailchimp(process.env.MailChimpKey);
console.log(process.env.MailChimpKey);

export const sendEmail = async (templateName, recipientEmail, subject, variables) => {
  try {
    const htmlContent = await getTemplate(templateName, variables);

    const response = await mailchimpClient.messages.send({
      message: {
        from_email: 'info@evagaentertainment.com',
        subject: subject,
        html: htmlContent,
        to: [{ email: recipientEmail, type: 'to' }],
      },
    });

    console.log('Email sent:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
