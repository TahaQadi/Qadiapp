#!/usr/bin/env tsx

import { seedTemplates } from '../seed-templates.js';

async function main() {
  try {
    console.log('🚀 Starting template seeding process...');
    
    // Seed default Arabic templates
    await seedTemplates();
    
    console.log('✅ Template seeding process completed successfully!');
  } catch (error) {
    console.error('❌ Template seeding process failed:', error);
    process.exit(1);
  }
}

main();