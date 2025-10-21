
import { db } from '../db';
import { templates } from '@/shared/schema';
import fs from 'fs';
import path from 'path';

async function importArabicTemplates() {
  console.log('🚀 Starting Arabic templates import...\n');

  const templatesDir = path.join(process.cwd(), 'server', 'templates', 'arabic');
  const templateFiles = [
    'ar-price-offer.json',
    'ar-invoice.json',
    'ar-purchase-order.json'
  ];

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of templateFiles) {
    const filePath = path.join(templatesDir, file);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        skipped++;
        continue;
      }

      const templateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Check if template already exists
      const existing = await db.query.templates.findFirst({
        where: (t, { eq }) => eq(t.nameEn, templateData.nameEn)
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${templateData.nameAr} (already exists)`);
        skipped++;
        continue;
      }

      // Insert template
      await db.insert(templates).values({
        nameEn: templateData.nameEn,
        nameAr: templateData.nameAr,
        descriptionEn: templateData.descriptionEn,
        descriptionAr: templateData.descriptionAr,
        category: templateData.category,
        language: templateData.language,
        sections: JSON.stringify(templateData.sections),
        variables: templateData.variables,
        styles: JSON.stringify(templateData.styles),
        isActive: templateData.isActive,
        version: templateData.version || 1,
        tags: templateData.tags || []
      });

      console.log(`✅ Imported: ${templateData.nameAr} (${templateData.category})`);
      imported++;

    } catch (error) {
      console.error(`❌ Error importing ${file}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('\n✨ Arabic templates import completed!\n');
}

importArabicTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
