import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'production');
const API_URL = process.env.API_URL || 'http://localhost:5000';

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
  console.log('🔄 Starting template import...\n');

  const templateFiles = fs.readdirSync(TEMPLATES_DIR).filter(file => file.endsWith('.json'));

  if (templateFiles.length === 0) {
    console.log('❌ No template files found in:', TEMPLATES_DIR);
    process.exit(1);
  }

  console.log(`📁 Found ${templateFiles.length} template files\n`);

  for (const file of templateFiles) {
    const filePath = path.join(TEMPLATES_DIR, file);
    const templateData: TemplateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`📤 Importing: ${templateData.nameEn}`);
    console.log(`   Category: ${templateData.category}`);
    console.log(`   Language: ${templateData.language}`);
    console.log(`   Variables: ${templateData.variables.length}`);
    console.log(`   Sections: ${templateData.sections.length}`);

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
        console.log(`   ❌ Failed: ${error}\n`);
        continue;
      }

      const result = await response.json();
      console.log(`   ✅ Success! ID: ${result.id}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  console.log('✨ Template import completed!');
}

importTemplates().catch(console.error);
