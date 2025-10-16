import { db } from '../server/db';
import { clients } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { comparePasswords } from '../server/auth';

async function testPassword() {
  const email = 'tahaqadi@gmail.com';
  const testPassword = 'Admin2024!@';
  
  // Find the client
  const [client] = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  
  if (!client) {
    console.error('❌ No client found');
    process.exit(1);
  }
  
  console.log('Client found:');
  console.log('  Username:', client.username);
  console.log('  Email:', client.email);
  console.log('  Has password:', !!client.password);
  console.log('  Password hash:', client.password?.substring(0, 20) + '...');
  
  if (client.password) {
    const isValid = await comparePasswords(testPassword, client.password);
    console.log('\nPassword test result:', isValid ? '✅ VALID' : '❌ INVALID');
  }
  
  process.exit(0);
}

testPassword().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
