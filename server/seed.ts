import { storage } from './storage';
import { hashPassword } from './auth';

export async function seedData() {
  // Check if data already exists
  const existingClients = await storage.getClients();
  if (existingClients.length > 0) {
    console.log('Data already seeded');
    return;
  }

  console.log('Seeding database...');

  // Create admin user
  const adminUser = await storage.createClient({
    username: 'admin',
    password: await hashPassword('admin123'),
    nameEn: 'Administrator',
    nameAr: 'المسؤول',
    email: 'admin@system.com',
    phone: '+1111111111',
    isAdmin: true,
  });

  // Create test client
  const testClient = await storage.createClient({
    username: 'test',
    password: await hashPassword('test123'),
    nameEn: 'Acme Corporation',
    nameAr: 'شركة أكمي',
    email: 'info@acme.com',
    phone: '+1234567890',
    isAdmin: false,
  });

  // Create departments
  await storage.createClientDepartment({
    clientId: testClient.id,
    departmentType: 'finance',
    contactName: 'John Finance',
    contactEmail: 'finance@acme.com',
    contactPhone: '+1234567891',
  });

  await storage.createClientDepartment({
    clientId: testClient.id,
    departmentType: 'purchase',
    contactName: 'Sarah Purchase',
    contactEmail: 'purchase@acme.com',
    contactPhone: '+1234567892',
  });

  await storage.createClientDepartment({
    clientId: testClient.id,
    departmentType: 'warehouse',
    contactName: 'Mike Warehouse',
    contactEmail: 'warehouse@acme.com',
    contactPhone: '+1234567893',
  });

  // Create locations
  await storage.createClientLocation({
    clientId: testClient.id,
    nameEn: 'Headquarters',
    nameAr: 'المقر الرئيسي',
    addressEn: '123 Main Street, Suite 100',
    addressAr: '١٢٣ شارع الرئيسي، جناح ١٠٠',
    city: 'New York',
    country: 'USA',
    isHeadquarters: true,
    phone: '+1234567890',
  });

  await storage.createClientLocation({
    clientId: testClient.id,
    nameEn: 'West Coast Branch',
    nameAr: 'فرع الساحل الغربي',
    addressEn: '456 Pacific Avenue',
    addressAr: '٤٥٦ شارع باسيفيك',
    city: 'Los Angeles',
    country: 'USA',
    isHeadquarters: false,
    phone: '+1234567894',
  });

  // Create products
  const product1 = await storage.createProduct({
    sku: 'CHAIR-001',
    nameEn: 'Office Chair',
    nameAr: 'كرسي مكتب',
    descriptionEn: 'Ergonomic design with lumbar support',
    descriptionAr: 'تصميم مريح مع دعم قطني',
    category: 'Furniture',
    stockStatus: 'in-stock',
    quantity: 150,
    lowStockThreshold: 20,
  });

  const product2 = await storage.createProduct({
    sku: 'DESK-001',
    nameEn: 'Standing Desk',
    nameAr: 'مكتب واقف',
    descriptionEn: 'Adjustable height electric desk',
    descriptionAr: 'مكتب كهربائي بارتفاع قابل للتعديل',
    category: 'Furniture',
    stockStatus: 'in-stock',
    quantity: 150,
    lowStockThreshold: 20,
  });

  const product3 = await storage.createProduct({
    sku: 'ARM-001',
    nameEn: 'Monitor Arm',
    nameAr: 'ذراع شاشة',
    descriptionEn: 'Dual monitor support, gas spring',
    descriptionAr: 'دعم شاشتين، نابض غازي',
    category: 'Accessories',
    stockStatus: 'in-stock',
    quantity: 150,
    lowStockThreshold: 20,
  });

  const product4 = await storage.createProduct({
    sku: 'LAMP-001',
    nameEn: 'Desk Lamp',
    nameAr: 'مصباح مكتب',
    descriptionEn: 'LED desk lamp with adjustable brightness',
    descriptionAr: 'مصباح مكتب LED بإضاءة قابلة للتعديل',
    category: 'Accessories',
    stockStatus: 'in-stock',
    quantity: 150,
    lowStockThreshold: 20,
  });

  const product5 = await storage.createProduct({
    sku: 'KB-001',
    nameEn: 'Wireless Keyboard',
    nameAr: 'لوحة مفاتيح لاسلكية',
    descriptionEn: 'Mechanical switches, RGB backlight',
    descriptionAr: 'مفاتيح ميكانيكية، إضاءة خلفية RGB',
    category: 'Technology',
    stockStatus: 'in-stock',
    quantity: 150,
    lowStockThreshold: 20,
  });

  const product6 = await storage.createProduct({
    sku: 'PAD-001',
    nameEn: 'Mouse Pad',
    nameAr: 'حشية الفأرة',
    descriptionEn: 'Extended gaming mouse pad',
    descriptionAr: 'حشية فأرة للألعاب ممتدة',
    category: 'Technology',
    stockStatus: 'in-stock',
    quantity: 150,
    lowStockThreshold: 20,
  });

  // Create LTAs
  // LTA 1: General Office Supplies Contract (Active)
  const lta1 = await storage.createLta({
    nameEn: 'Office Supplies Contract 2024',
    nameAr: 'عقد اللوازم المكتبية 2024',
    descriptionEn: 'Annual contract for office furniture and supplies',
    descriptionAr: 'عقد سنوي للأثاث واللوازم المكتبية',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'active',
  });

  // LTA 2: Technology Equipment Contract (Active)
  const lta2 = await storage.createLta({
    nameEn: 'Technology Equipment Contract 2024',
    nameAr: 'عقد المعدات التقنية 2024',
    descriptionEn: 'Contract for computers and tech accessories',
    descriptionAr: 'عقد لأجهزة الكمبيوتر والملحقات التقنية',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'active',
  });

  // LTA 3: Expired/Inactive Contract (for testing)
  const lta3 = await storage.createLta({
    nameEn: 'Archived Supplies Contract 2023',
    nameAr: 'عقد اللوازم المؤرشف 2023',
    descriptionEn: 'Previous year contract (expired)',
    descriptionAr: 'عقد السنة السابقة (منتهي)',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    status: 'inactive',
  });

  // Assign products to LTA 1 (Office Supplies) - 4 products
  await storage.assignProductToLta({
    ltaId: lta1.id,
    productId: product1.id,
    contractPrice: '299.99',
    currency: 'USD',
  });

  await storage.assignProductToLta({
    ltaId: lta1.id,
    productId: product2.id,
    contractPrice: '549.99',
    currency: 'USD',
  });

  await storage.assignProductToLta({
    ltaId: lta1.id,
    productId: product3.id,
    contractPrice: '79.99',
    currency: 'USD',
  });

  await storage.assignProductToLta({
    ltaId: lta1.id,
    productId: product4.id,
    contractPrice: '45.00',
    currency: 'USD',
  });

  // Assign products to LTA 2 (Technology) - 3 products
  await storage.assignProductToLta({
    ltaId: lta2.id,
    productId: product5.id,
    contractPrice: '89.99',
    currency: 'USD',
  });

  await storage.assignProductToLta({
    ltaId: lta2.id,
    productId: product6.id,
    contractPrice: '15.99',
    currency: 'USD',
  });

  // Standing Desk in both LTAs with different prices
  await storage.assignProductToLta({
    ltaId: lta2.id,
    productId: product2.id,
    contractPrice: '599.99',
    currency: 'USD',
  });

  // Assign test client to both active LTAs
  await storage.assignClientToLta({
    ltaId: lta1.id,
    clientId: testClient.id,
  });

  await storage.assignClientToLta({
    ltaId: lta2.id,
    clientId: testClient.id,
  });

  console.log('\nSeeding completed successfully!');
  console.log('\nLTAs created:');
  console.log(`  - ${lta1.nameEn} (${lta1.status})`);
  console.log(`  - ${lta2.nameEn} (${lta2.status})`);
  console.log(`  - ${lta3.nameEn} (${lta3.status})`);
  console.log('\nTest client has access to:');
  console.log(`  - ${lta1.nameEn} (4 products)`);
  console.log(`  - ${lta2.nameEn} (3 products)`);
  console.log('\nAdmin credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('\nTest client credentials:');
  console.log('  Username: test');
  console.log('  Password: test123');
}
