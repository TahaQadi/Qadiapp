
import { TemplateManager } from '../template-manager';
import { TemplateStorage } from '../template-storage';

async function testTemplateValidation() {
  console.log('🧪 Template Validation Test Suite\n');

  try {
    // Get all templates
    const templates = await TemplateStorage.getTemplates();
    console.log(`📋 Found ${templates.length} templates\n`);

    let validCount = 0;
    let invalidCount = 0;

    for (const template of templates) {
      console.log(`\n🔍 Testing: ${template.name} (${template.category})`);
      
      const templateData = {
        id: template.id,
        name: template.name,
        nameEn: template.name,
        nameAr: template.name,
        description: template.description,
        descriptionEn: template.description || '',
        descriptionAr: template.description || '',
        category: template.category,
        language: 'ar' as const,
        sections: typeof template.sections === 'string' 
          ? JSON.parse(template.sections) 
          : template.sections,
        variables: typeof template.variables === 'string'
          ? JSON.parse(template.variables)
          : template.variables,
        styles: typeof template.styles === 'string'
          ? JSON.parse(template.styles)
          : template.styles,
        isActive: template.isActive,
        isDefault: template.isDefault || false,
        version: 1,
        tags: [],
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      };

      const result = await TemplateManager.validateTemplate(templateData as any);
      
      if (result.valid) {
        console.log('  ✅ Valid');
        validCount++;
      } else {
        console.log('  ❌ Invalid');
        console.log('  Errors:');
        result.errors.forEach(err => console.log(`    - ${err}`));
        invalidCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Valid templates: ${validCount}`);
    console.log(`  ❌ Invalid templates: ${invalidCount}`);
    console.log(`  📈 Success rate: ${((validCount / templates.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

testTemplateValidation();
