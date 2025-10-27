// Seed data for testing
export const seedData = {
  clients: [
    {
      id: 'client-1',
      userId: 'user-1',
      nameEn: 'Test Company',
      nameAr: 'شركة تجريبية',
      username: 'testcompany',
      email: 'test@company.com',
      phone: '+1234567890',
      isAdmin: false,
    },
    {
      id: 'client-2',
      userId: 'user-2',
      nameEn: 'Admin Company',
      nameAr: 'شركة الإدارة',
      username: 'admincompany',
      email: 'admin@company.com',
      phone: '+1234567891',
      isAdmin: true,
    },
  ],
  
  ltas: [
    {
      id: 'lta-1',
      nameEn: 'Test LTA',
      nameAr: 'اتفاقية تجريبية',
      descriptionEn: 'Test Long Term Agreement',
      descriptionAr: 'اتفاقية طويلة المدى تجريبية',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
    },
    {
      id: 'lta-2',
      nameEn: 'Premium LTA',
      nameAr: 'اتفاقية مميزة',
      descriptionEn: 'Premium Long Term Agreement',
      descriptionAr: 'اتفاقية طويلة المدى مميزة',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
    },
  ],
  
  products: [
    {
      id: 'product-1',
      sku: 'TEST-001',
      nameEn: 'Test Product',
      nameAr: 'منتج تجريبي',
      descriptionEn: 'A test product for testing purposes',
      descriptionAr: 'منتج تجريبي لأغراض الاختبار',
      category: 'Electronics',
      mainCategory: 'Technology',
      unitType: 'piece',
      unitsPerBox: 10,
      costPrice: '50.00',
      sellingPrice: '100.00',
      specifications: 'مواصفات المنتج التجريبي',
      vendor: 'Test Vendor',
      images: ['test-image-1.jpg'],
    },
    {
      id: 'product-2',
      sku: 'TEST-002',
      nameEn: 'Another Test Product',
      nameAr: 'منتج تجريبي آخر',
      descriptionEn: 'Another test product for testing purposes',
      descriptionAr: 'منتج تجريبي آخر لأغراض الاختبار',
      category: 'Office Supplies',
      mainCategory: 'Business',
      unitType: 'box',
      unitsPerBox: 1,
      costPrice: '25.00',
      sellingPrice: '50.00',
      specifications: 'مواصفات المنتج التجريبي الآخر',
      vendor: 'Test Vendor',
      images: ['test-image-2.jpg'],
    },
  ],
  
  ltaProducts: [
    {
      id: 'lta-product-1',
      ltaId: 'lta-1',
      productId: 'product-1',
      contractPrice: '100.00',
      currency: 'USD',
    },
    {
      id: 'lta-product-2',
      ltaId: 'lta-1',
      productId: 'product-2',
      contractPrice: '50.00',
      currency: 'USD',
    },
  ],
  
  ltaClients: [
    {
      id: 'lta-client-1',
      ltaId: 'lta-1',
      clientId: 'client-1',
    },
  ],
  
  orders: [
    {
      id: 'order-1',
      clientId: 'client-1',
      ltaId: 'lta-1',
      status: 'pending',
      totalAmount: '150.00',
      currency: 'USD',
      notes: 'Test order',
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
  
  orderItems: [
    {
      id: 'order-item-1',
      orderId: 'order-1',
      productId: 'product-1',
      quantity: 1,
      unitPrice: '100.00',
      totalPrice: '100.00',
    },
    {
      id: 'order-item-2',
      orderId: 'order-1',
      productId: 'product-2',
      quantity: 1,
      unitPrice: '50.00',
      totalPrice: '50.00',
    },
  ],
  
  vendors: [
    {
      id: 'vendor-1',
      nameEn: 'Test Vendor',
      nameAr: 'مورد تجريبي',
      contactInfo: 'test@vendor.com',
    },
  ],
  
  templates: [
    {
      id: 'template-1',
      name: 'Price Offer Template',
      category: 'price_offer',
      content: {
        sections: [
          {
            type: 'header',
            content: 'Price Offer',
          },
          {
            type: 'body',
            content: 'This is a test price offer template.',
          },
        ],
      },
      isActive: true,
    },
  ],
  
  documents: [
    {
      id: 'doc-1',
      templateId: 'template-1',
      clientId: 'client-1',
      ltaId: 'lta-1',
      type: 'price_offer',
      fileName: 'test-offer.pdf',
      fileUrl: 'https://example.com/test-offer.pdf',
      fileSize: 1024,
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
  
  notifications: [
    {
      id: 'notif-1',
      clientId: 'client-1',
      type: 'order_status',
      title: 'Order Status Update',
      message: 'Your order has been confirmed',
      isRead: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
  ],
  
  feedback: [
    {
      id: 'feedback-1',
      clientId: 'client-1',
      orderId: 'order-1',
      rating: 5,
      productQuality: 5,
      deliveryService: 4,
      wouldRecommend: true,
      comments: 'Great service!',
      createdAt: '2024-01-16T10:00:00Z',
    },
  ],
  
  issueReports: [
    {
      id: 'issue-1',
      clientId: 'client-1',
      orderId: 'order-1',
      type: 'delivery',
      priority: 'medium',
      status: 'new',
      title: 'Delivery Issue',
      description: 'Package was damaged during delivery',
      createdAt: '2024-01-16T10:00:00Z',
    },
  ],
};

// Helper function to get products with LTA pricing
export const getProductsWithLtaPricing = (ltaId: string) => {
  return seedData.products.map(product => {
    const ltaProduct = seedData.ltaProducts.find(
      lp => lp.ltaId === ltaId && lp.productId === product.id
    );
    
    if (ltaProduct) {
      return {
        ...product,
        contractPrice: ltaProduct.contractPrice,
        currency: ltaProduct.currency,
        ltaId: ltaId,
        hasPrice: true,
      };
    }
    
    return {
      ...product,
      hasPrice: false,
    };
  });
};

// Helper function to get client's LTAs
export const getClientLtas = (clientId: string) => {
  const clientLtaIds = seedData.ltaClients
    .filter(lc => lc.clientId === clientId)
    .map(lc => lc.ltaId);
  
  return seedData.ltas.filter(lta => clientLtaIds.includes(lta.id));
};

// Helper function to get orders for client
export const getClientOrders = (clientId: string) => {
  return seedData.orders
    .filter(order => order.clientId === clientId)
    .map(order => ({
      ...order,
      items: seedData.orderItems.filter(item => item.orderId === order.id),
    }));
};