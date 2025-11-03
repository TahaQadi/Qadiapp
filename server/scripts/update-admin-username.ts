#!/usr/bin/env tsx

import { db } from '../db.js';
import { clients } from '../../shared/schema.js';
import { eq, or } from 'drizzle-orm';
import { hashPassword } from '../auth.js';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_USERNAME = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';

async function updateAdminUsername() {
  console.log('🔐 Updating admin account username...\n');

  try {
    // Find admin account
    const existingAdmins = await db.select().from(clients)
      .where(
        or(
          eq(clients.email, ADMIN_EMAIL),
          eq(clients.username, 'admin')
        )
      );

    const admin = existingAdmins[0];

    if (admin) {
      console.log(`✅ Found admin account: ${admin.email || admin.username}`);
      console.log(`   Current email: ${admin.email || 'not set'}`);
      console.log(`   Current username: ${admin.username}`);
      
      // Update username to match email
      await db.update(clients)
        .set({
          username: ADMIN_USERNAME,
        })
        .where(eq(clients.id, admin.id));
      
      console.log('\n✅ Admin username updated!');
      console.log(`   New username: ${ADMIN_USERNAME}`);
    } else {
      console.log('⚠️  Admin account not found, creating...');
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      const [newAdmin] = await db.insert(clients).values({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        name: 'Administrator',
        email: ADMIN_EMAIL,
        phone: '+1111111111',
        isAdmin: true,
      }).returning();
      
      console.log('\n✅ Admin account created!');
      console.log(`   Username: ${newAdmin.username}`);
    }

    // Verify the update
    const updatedAdmin = await db.select().from(clients)
      .where(eq(clients.email, ADMIN_EMAIL))
      .limit(1);

    if (updatedAdmin[0]) {
      console.log('\n📋 Updated Admin Account:');
      console.log('─'.repeat(50));
      console.log(`   Email:    ${updatedAdmin[0].email}`);
      console.log(`   Username: ${updatedAdmin[0].username}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Is Admin: ${updatedAdmin[0].isAdmin ? 'Yes ✅' : 'No ❌'}`);
      console.log('─'.repeat(50));
      console.log('\n✅ Admin account is ready to use!\n');
    }

  } catch (error) {
    console.error('❌ Error updating admin account:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

updateAdminUsername();

