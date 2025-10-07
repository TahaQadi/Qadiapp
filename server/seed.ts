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
  const products = [
    {
      sku: 'CHAIR-001',
      nameEn: 'Office Chair',
      nameAr: 'كرسي مكتب',
      descriptionEn: 'Ergonomic design with lumbar support',
      descriptionAr: 'تصميم مريح مع دعم قطني',
      category: 'Furniture',
      stockStatus: 'in-stock',
    },
    {
      sku: 'DESK-001',
      nameEn: 'Standing Desk',
      nameAr: 'مكتب واقف',
      descriptionEn: 'Adjustable height electric desk',
      descriptionAr: 'مكتب كهربائي بارتفاع قابل للتعديل',
      category: 'Furniture',
      stockStatus: 'in-stock',
    },
    {
      sku: 'ARM-001',
      nameEn: 'Monitor Arm',
      nameAr: 'ذراع شاشة',
      descriptionEn: 'Dual monitor support, gas spring',
      descriptionAr: 'دعم شاشتين، نابض غازي',
      category: 'Accessories',
      stockStatus: 'low-stock',
    },
    {
      sku: 'KB-001',
      nameEn: 'Keyboard',
      nameAr: 'لوحة مفاتيح',
      descriptionEn: 'Mechanical switches, RGB backlight',
      descriptionAr: 'مفاتيح ميكانيكية، إضاءة خلفية RGB',
      category: 'Accessories',
      stockStatus: 'in-stock',
    },
    {
      sku: 'MOUSE-001',
      nameEn: 'Mouse',
      nameAr: 'فأرة',
      descriptionEn: 'Wireless ergonomic mouse',
      descriptionAr: 'فأرة لاسلكية مريحة',
      category: 'Accessories',
      stockStatus: 'out-of-stock',
    },
    {
      sku: 'STAND-001',
      nameEn: 'Laptop Stand',
      nameAr: 'حامل لابتوب',
      descriptionEn: 'Adjustable aluminum laptop stand',
      descriptionAr: 'حامل لابتوب ألمنيوم قابل للتعديل',
      category: 'Accessories',
      stockStatus: 'in-stock',
    },
  ];

  for (const product of products) {
    await storage.createProduct(product);
  }

  // Create pricing for test client
  const allProducts = await storage.getProducts();
  const pricingData = [
    { sku: 'CHAIR-001', price: '299.99', currency: 'USD' },
    { sku: 'DESK-001', price: '599.99', currency: 'USD' },
    { sku: 'ARM-001', price: '149.99', currency: 'USD' },
    { sku: 'KB-001', price: '179.99', currency: 'USD' },
    { sku: 'MOUSE-001', price: '89.99', currency: 'USD' },
    { sku: 'STAND-001', price: '79.99', currency: 'USD' },
  ];

  await storage.bulkImportPricing(testClient.id, pricingData);

  console.log('Seeding completed successfully!');
  console.log('Admin credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('Test client credentials:');
  console.log('  Username: test');
  console.log('  Password: test123');
}
