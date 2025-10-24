import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'production');
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Simple logger for production scripts
const logger = {
  info: (msg: string) => process.env.NODE_ENV !== 'production' ? logger.info(msg) : null,
  error: (msg: string) => console.error(msg),
  success: (msg: string) => process.env.NODE_ENV !== 'production' ? logger.info(msg) : null,
};

interface TemplateData {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category: string;
  language: string;
  sections: any[];
  variables: string[];
  styles: any;
  isActive: boolean;
}

async function importTemplates() {
  logger.info('🔄 Starting template import...\n');

  const templateFiles = fs.readdirSync(TEMPLATES_DIR).filter(file => file.endsWith('.json'));

  if (templateFiles.length === 0) {
    logger.error('❌ No template files found in: ' + TEMPLATES_DIR);
    process.exit(1);
  }

  logger.info(`📁 Found ${templateFiles.length} template files\n`);

  for (const file of templateFiles) {
    const filePath = path.join(TEMPLATES_DIR, file);
    const templateData: TemplateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    logger.info(`📤 Importing: ${templateData.nameEn}`);
    logger.info(`   Category: ${templateData.category}`);
    logger.info(`   Language: ${templateData.language}`);
    logger.info(`   Variables: ${templateData.variables.length}`);
    logger.info(`   Sections: ${templateData.sections.length}`);

    try {
      const response = await fetch(`${API_URL}/api/admin/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.info(`   ❌ Failed: ${error}\n`);
        continue;
      }

      const result = await response.json();
      logger.info(`   ✅ Success! ID: ${result.id}\n`);
    } catch (error) {
      logger.info(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  logger.info('✨ Template import completed!');
}

importTemplates().catch(console.error);
