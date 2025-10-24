import { storage } from './storage';
import { hashPassword } from './auth';

export async function seedData() {
  // Check if data already exists
  const existingClients = await storage.getClients();
  if (existingClients.length > 0) {
    return;
  }


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
  });

  const product2 = await storage.createProduct({
    sku: 'DESK-001',
    nameEn: 'Standing Desk',
    nameAr: 'مكتب واقف',
    descriptionEn: 'Adjustable height electric desk',
    descriptionAr: 'مكتب كهربائي بارتفاع قابل للتعديل',
    category: 'Furniture',
  });

  const product3 = await storage.createProduct({
    sku: 'ARM-001',
    nameEn: 'Monitor Arm',
    nameAr: 'ذراع شاشة',
    descriptionEn: 'Dual monitor support, gas spring',
    descriptionAr: 'دعم شاشتين، نابض غازي',
    category: 'Accessories',
  });

  const product4 = await storage.createProduct({
    sku: 'LAMP-001',
    nameEn: 'Desk Lamp',
    nameAr: 'مصباح مكتب',
    descriptionEn: 'LED desk lamp with adjustable brightness',
    descriptionAr: 'مصباح مكتب LED بإضاءة قابلة للتعديل',
    category: 'Accessories',
  });

  const product5 = await storage.createProduct({
    sku: 'KB-001',
    nameEn: 'Wireless Keyboard',
    nameAr: 'لوحة مفاتيح لاسلكية',
    descriptionEn: 'Mechanical switches, RGB backlight',
    descriptionAr: 'مفاتيح ميكانيكية، إضاءة خلفية RGB',
    category: 'Technology',
  });

  const product6 = await storage.createProduct({
    sku: 'PAD-001',
    nameEn: 'Mouse Pad',
    nameAr: 'حشية الفأرة',
    descriptionEn: 'Extended gaming mouse pad',
    descriptionAr: 'حشية فأرة للألعاب ممتدة',
    category: 'Technology',
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


  // Create default templates
  await seedDefaultTemplates();
}

async function seedDefaultTemplates() {
  const { TemplateStorage } = await import('./template-storage');

  // Price Offer Template
  await TemplateStorage.createTemplate({
    nameEn: 'Standard Price Offer',
    nameAr: 'عرض سعر قياسي',
    descriptionEn: 'Professional price offer template with company branding',
    descriptionAr: 'قالب عرض سعر احترافي مع العلامة التجارية للشركة',
    category: 'price_offer',
    language: 'both',
    sections: [
      {
        type: 'header',
        content: {
          logo: true,
          companyInfo: true,
          title: { en: 'PRICE OFFER', ar: 'عرض سعر' }
        },
        order: 0
      },
      {
        type: 'body',
        content: {
          text: { 
            en: 'Dear {{clientName}},\n\nWe are pleased to present our price offer for the following items:',
            ar: 'عزيزنا {{clientName}}،\n\nيسرنا تقديم عرض الأسعار التالي:'
          }
        },
        order: 1
      },
      {
        type: 'table',
        content: {
          headers: ['Item', 'Quantity', 'Unit Price', 'Total'],
          headersAr: ['الصنف', 'الكمية', 'سعر الوحدة', 'الإجمالي'],
          dataSource: 'items'
        },
        order: 2
      },
      {
        type: 'body',
        content: {
          text: {
            en: 'Total Amount: {{total}} {{currency}}',
            ar: 'المبلغ الإجمالي: {{total}} {{currency}}'
          }
        },
        order: 3
      },
      {
        type: 'terms',
        content: {
          title: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
          items: [
            { en: 'Payment terms: Net 30 days', ar: 'شروط الدفع: 30 يوم' },
            { en: 'Delivery: 2-3 weeks from order confirmation', ar: 'التسليم: 2-3 أسابيع من تأكيد الطلب' },
            { en: 'Prices are valid for 30 days', ar: 'الأسعار صالحة لمدة 30 يوم' }
          ]
        },
        order: 4
      },
      {
        type: 'signature',
        content: {
          showDate: true,
          showName: true
        },
        order: 5
      },
      {
        type: 'footer',
        content: {
          contactInfo: true,
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: ['clientName', 'items', 'total', 'currency', 'date', 'offerNumber'],
    styles: {
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748',
      accentColor: '#3182ce',
      fontSize: 11,
      fontFamily: 'Helvetica',
      headerHeight: 120,
      footerHeight: 60,
      margins: {
        top: 140,
        bottom: 80,
        left: 50,
        right: 50
      }
    },
    isActive: true
  });

  // Order Template
  await TemplateStorage.createTemplate({
    nameEn: 'Standard Purchase Order',
    nameAr: 'طلب شراء قياسي',
    descriptionEn: 'Professional purchase order template',
    descriptionAr: 'قالب طلب شراء احترافي',
    category: 'order',
    language: 'both',
    sections: [
      {
        type: 'header',
        content: {
          logo: true,
          companyInfo: true,
          title: { en: 'PURCHASE ORDER', ar: 'طلب شراء' }
        },
        order: 0
      },
      {
        type: 'body',
        content: {
          text: {
            en: 'Order Number: {{orderNumber}}\nOrder Date: {{orderDate}}\nDelivery Location: {{deliveryLocation}}',
            ar: 'رقم الطلب: {{orderNumber}}\nتاريخ الطلب: {{orderDate}}\nموقع التسليم: {{deliveryLocation}}'
          }
        },
        order: 1
      },
      {
        type: 'table',
        content: {
          headers: ['Item', 'SKU', 'Quantity', 'Unit Price', 'Total'],
          headersAr: ['الصنف', 'رمز المنتج', 'الكمية', 'سعر الوحدة', 'الإجمالي'],
          dataSource: 'items'
        },
        order: 2
      },
      {
        type: 'body',
        content: {
          text: {
            en: 'Subtotal: {{subtotal}} {{currency}}\nTax: {{tax}} {{currency}}\nTotal: {{total}} {{currency}}',
            ar: 'المجموع الفرعي: {{subtotal}} {{currency}}\nالضريبة: {{tax}} {{currency}}\nالإجمالي: {{total}} {{currency}}'
          }
        },
        order: 3
      },
      {
        type: 'signature',
        content: {
          showDate: true,
          showName: true,
          title: { en: 'Authorized By', ar: 'معتمد من قبل' }
        },
        order: 4
      },
      {
        type: 'footer',
        content: {
          contactInfo: true,
          pageNumbers: true
        },
        order: 5
      }
    ],
    variables: ['orderNumber', 'orderDate', 'deliveryLocation', 'items', 'subtotal', 'tax', 'total', 'currency'],
    styles: {
      primaryColor: '#2d3748',
      secondaryColor: '#4a5568',
      accentColor: '#48bb78',
      fontSize: 11,
      fontFamily: 'Helvetica',
      headerHeight: 120,
      footerHeight: 60,
      margins: {
        top: 140,
        bottom: 80,
        left: 50,
        right: 50
      }
    },
    isActive: true
  });

  // Invoice Template
  await TemplateStorage.createTemplate({
    nameEn: 'Standard Invoice',
    nameAr: 'فاتورة قياسية',
    descriptionEn: 'Professional invoice template',
    descriptionAr: 'قالب فاتورة احترافي',
    category: 'invoice',
    language: 'both',
    sections: [
      {
        type: 'header',
        content: {
          logo: true,
          companyInfo: true,
          title: { en: 'INVOICE', ar: 'فاتورة' }
        },
        order: 0
      },
      {
        type: 'body',
        content: {
          text: {
            en: 'Invoice Number: {{invoiceNumber}}\nInvoice Date: {{invoiceDate}}\nDue Date: {{dueDate}}\n\nBill To:\n{{clientName}}\n{{clientAddress}}',
            ar: 'رقم الفاتورة: {{invoiceNumber}}\nتاريخ الفاتورة: {{invoiceDate}}\nتاريخ الاستحقاق: {{dueDate}}\n\nفاتورة إلى:\n{{clientName}}\n{{clientAddress}}'
          }
        },
        order: 1
      },
      {
        type: 'table',
        content: {
          headers: ['Description', 'Quantity', 'Unit Price', 'Total'],
          headersAr: ['الوصف', 'الكمية', 'سعر الوحدة', 'الإجمالي'],
          dataSource: 'items'
        },
        order: 2
      },
      {
        type: 'body',
        content: {
          text: {
            en: 'Subtotal: {{subtotal}} {{currency}}\nTax ({{taxRate}}%): {{tax}} {{currency}}\nTotal Amount: {{total}} {{currency}}',
            ar: 'المجموع الفرعي: {{subtotal}} {{currency}}\nالضريبة ({{taxRate}}%): {{tax}} {{currency}}\nالمبلغ الإجمالي: {{total}} {{currency}}'
          }
        },
        order: 3
      },
      {
        type: 'terms',
        content: {
          title: { en: 'Payment Information', ar: 'معلومات الدفع' },
          items: [
            { en: 'Payment due within 30 days', ar: 'الدفع مستحق خلال 30 يوم' },
            { en: 'Please include invoice number with payment', ar: 'يرجى تضمين رقم الفاتورة مع الدفع' }
          ]
        },
        order: 4
      },
      {
        type: 'footer',
        content: {
          contactInfo: true,
          pageNumbers: true
        },
        order: 5
      }
    ],
    variables: ['invoiceNumber', 'invoiceDate', 'dueDate', 'clientName', 'clientAddress', 'items', 'subtotal', 'tax', 'taxRate', 'total', 'currency'],
    styles: {
      primaryColor: '#742a2a',
      secondaryColor: '#9b2c2c',
      accentColor: '#f56565',
      fontSize: 11,
      fontFamily: 'Helvetica',
      headerHeight: 120,
      footerHeight: 60,
      margins: {
        top: 140,
        bottom: 80,
        left: 50,
        right: 50
      }
    },
    isActive: true
  });
}
