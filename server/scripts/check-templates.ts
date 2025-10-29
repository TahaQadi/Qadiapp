#!/usr/bin/env tsx

import { TemplateStorage } from '../template-storage.js';

async function checkTemplates() {
  console.log('📋 Examining Templates in Database...\n');
  
  try {
    const templates = await TemplateStorage.getTemplates();
    
    console.log(`Total Templates: ${templates.length}\n`);
    console.log('═'.repeat(80));
    
    // Group by category
    const categories = ['price_offer', 'order', 'invoice', 'contract', 'report', 'other'];
    
    for (const category of categories) {
      const categoryTemplates = templates.filter((t: any) => t.category === category);
      
      if (categoryTemplates.length === 0) continue;
      
      console.log(`\n📂 Category: ${category.toUpperCase()}`);
      console.log('─'.repeat(80));
      
      categoryTemplates.forEach((template: any) => {
        const defaultMark = template.isDefault ? '⭐ DEFAULT' : '  ';
        const activeMark = template.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
        
        console.log(`\n${defaultMark} ${activeMark}`);
        console.log(`  Name: ${template.name}`);
        console.log(`  ID: ${template.id}`);
        console.log(`  Description: ${template.description || 'N/A'}`);
        console.log(`  Language: ${template.language}`);
        console.log(`  Version: ${template.version || 1}`);
        console.log(`  Variables: ${template.variables.length} variables`);
        console.log(`  Sections: ${template.sections.length} sections`);
        
        // Show variable names
        console.log(`  Required Variables:`);
        template.variables.forEach((v: string, idx: number) => {
          if (idx < 5) {
            console.log(`    - ${v}`);
          } else if (idx === 5) {
            console.log(`    ... and ${template.variables.length - 5} more`);
          }
        });
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total Templates: ${templates.length}`);
    console.log(`  Active Templates: ${templates.filter((t: any) => t.isActive).length}`);
    console.log(`  Default Templates: ${templates.filter((t: any) => t.isDefault).length}`);
    
    // Check for potential issues
    console.log('\n🔍 Validation:');
    
    for (const category of categories) {
      const categoryTemplates = templates.filter((t: any) => t.category === category);
      const activeTemplates = categoryTemplates.filter((t: any) => t.isActive);
      const defaultTemplates = categoryTemplates.filter((t: any) => t.isDefault && t.isActive);
      
      if (categoryTemplates.length > 0) {
        if (activeTemplates.length === 0) {
          console.log(`  ⚠️  ${category}: No active templates!`);
        } else if (defaultTemplates.length === 0) {
          console.log(`  ⚠️  ${category}: No default template set!`);
        } else if (defaultTemplates.length > 1) {
          console.log(`  ⚠️  ${category}: Multiple default templates (${defaultTemplates.length})!`);
        } else {
          console.log(`  ✅ ${category}: ${defaultTemplates[0].name}`);
        }
      }
    }
    
    console.log('\n✅ Template check complete!\n');
    
  } catch (error) {
    console.error('❌ Error checking templates:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

checkTemplates();

