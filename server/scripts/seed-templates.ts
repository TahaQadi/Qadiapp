#!/usr/bin/env tsx

import { TemplateSeeder } from '../seed-templates';

async function main() {
  try {
    console.log('🚀 Starting template seeding process...');
    
    // First, try to load templates from production files
    await TemplateSeeder.loadTemplatesFromFiles();
    
    // Then ensure we have default templates for each category
    await TemplateSeeder.ensureDefaultTemplates();
    
    console.log('✅ Template seeding process completed successfully!');
  } catch (error) {
    console.error('❌ Template seeding process failed:', error);
    process.exit(1);
  }
}

main();