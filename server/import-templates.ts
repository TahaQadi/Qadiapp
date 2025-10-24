import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TemplateStorage } from './template-storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importTemplates() {
  const templatesDir = path.join(__dirname, 'templates');
  const templateFiles = [
    'price-offer-template.json',
    'order-template.json',
    'invoice-template.json',
    'contract-template.json'
  ];


  for (const file of templateFiles) {
    try {
      const filePath = path.join(templatesDir, file);
      const templateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      
      const template = await TemplateStorage.createTemplate({
        nameEn: templateData.nameEn,
        nameAr: templateData.nameAr,
        descriptionEn: templateData.descriptionEn,
        descriptionAr: templateData.descriptionAr,
        category: templateData.category as any,
        language: templateData.language as any,
        sections: templateData.sections,
        variables: templateData.variables,
        styles: templateData.styles,
        isActive: templateData.isActive
      });

    } catch (error) {
      console.error(`✗ Failed to import ${file}:`, error);
    }
  }

  process.exit(0);
}

importTemplates().catch(console.error);
