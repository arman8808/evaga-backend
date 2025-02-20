import ejs from 'ejs';
import { join } from 'path';

export const getTemplate = async (templateName, variables) => {
  const templatePath = join(process.cwd(), 'templates', `${templateName}.ejs`);
  try {
    const htmlContent = await ejs.renderFile(templatePath, variables);
    return htmlContent;
  } catch (error) {
    console.error('Error rendering email template:', error);
    throw error;
  }
};
