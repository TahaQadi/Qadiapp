#!/usr/bin/env tsx

import { db } from '../db.js';
import { clients } from '../../shared/schema.js';
import { eq, or } from 'drizzle-orm';
import { hashPassword } from '../auth.js';

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function ensureAdminAccount() {
  console.log('🔐 Ensuring admin account exists with correct credentials...\n');

  try {
    // Find admin account
    const existingAdmins = await db.select().from(clients)
      .where(
        or(
          eq(clients.email, ADMIN_EMAIL),
          eq(clients.username, ADMIN_USERNAME)
        )
      );

    let admin = existingAdmins[0];

    if (admin) {
      console.log(`✅ Found admin account: ${admin.email || admin.username}`);
      console.log(`   Current email: ${admin.email || 'not set'}`);
      console.log(`   Current username: ${admin.username}`);
      console.log(`   Is admin: ${admin.isAdmin}`);
      
      // Update to ensure correct credentials
      const hashedPassword = await hashPassword(ADMIN_PASSWORD);
      await db.update(clients)
        .set({
          email: ADMIN_EMAIL,
          username: ADMIN_USERNAME,
          password: hashedPassword,
          isAdmin: true,
        })
        .where(eq(clients.id, admin.id));
      
      console.log('\n✅ Admin account updated with correct credentials!');
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
      
      admin = newAdmin;
      console.log('\n✅ Admin account created!');
    }

    console.log('\n📋 Login Credentials:');
    console.log('─'.repeat(50));
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('─'.repeat(50));
    console.log('\n✅ Admin account is ready to use!\n');

  } catch (error) {
    console.error('❌ Error ensuring admin account:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    process.exit(1);
  }
  
  process.exit(0);
}

ensureAdminAccount();

