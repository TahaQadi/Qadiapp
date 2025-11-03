#!/usr/bin/env tsx

import { db } from '../db.js';
import { clients } from '../../shared/schema.js';
import { eq, or } from 'drizzle-orm';
import { comparePasswords } from '../auth.js';
import { storage } from '../storage.js';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';

async function testAdminLogin() {
  console.log('🔐 Testing admin login credentials...\n');

  try {
    // Test using storage method (same as login route)
    const authUser = await storage.validateClientCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
    
    if (authUser) {
      console.log('✅ Login successful!');
      console.log('\n📋 User Details:');
      console.log('─'.repeat(50));
      console.log(`   ID:       ${authUser.id}`);
      console.log(`   Username: ${authUser.username}`);
      console.log(`   Email:    ${authUser.email || 'N/A'}`);
      console.log(`   Name:     ${authUser.name || 'N/A'}`);
      console.log(`   Is Admin: ${authUser.isAdmin ? 'Yes ✅' : 'No ❌'}`);
      console.log('─'.repeat(50));
      
      if (authUser.isAdmin) {
        console.log('\n✅ Admin credentials are working correctly!');
      } else {
        console.log('\n⚠️  Warning: Account is not marked as admin');
      }
    } else {
      console.log('❌ Login failed - credentials are incorrect');
      console.log('\nPlease run: npx tsx server/scripts/ensure-admin-account.ts');
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

testAdminLogin();

