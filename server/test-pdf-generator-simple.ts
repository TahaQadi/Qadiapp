import { TemplatePDFGenerator } from './template-pdf-generator';
import fs from 'fs';
import path from 'path';

// Mock template for testing
const mockTemplate = {
  id: 'test-template-1',
  nameEn: 'Test Price Offer Template',
  nameAr: 'قالب عرض السعر التجريبي',
  descriptionEn: 'Test template for PDF generation',
  descriptionAr: 'قالب تجريبي لإنشاء PDF',
  category: 'price_offer',
  language: 'both',
  sections: [
    {
      type: 'header',
      content: {
        companyName: '{{companyName}}',
        companyNameAr: '{{companyNameAr}}',
        address: '{{companyAddress}}',
        addressAr: '{{companyAddressAr}}',
        phone: '{{companyPhone}}',
        email: '{{companyEmail}}',
        logo: true,
        title: 'Price Offer',
        titleAr: 'عرض السعر'
      },
      order: 0
    },
    {
      type: 'body',
      content: {
        sectionTitle: 'Offer Details',
        sectionTitleAr: 'تفاصيل العرض',
        offerNumber: '{{offerNumber}}',
        clientName: '{{clientName}}',
        clientNameAr: '{{clientNameAr}}',
        ltaName: '{{ltaName}}',
        ltaNameAr: '{{ltaNameAr}}',
        validUntil: '{{validUntil}}'
      },
      order: 1
    },
    {
      type: 'table',
      content: {
        headers: ['#', 'SKU', 'Product Name', 'Quantity', 'Unit Price', 'Total'],
        headersAr: ['#', 'الرمز', 'اسم المنتج', 'الكمية', 'سعر الوحدة', 'المجموع'],
        dataSource: '{{products}}',
        showBorders: true,
        alternateRowColors: true
      },
      order: 2
    },
    {
      type: 'body',
      content: {
        subtotal: '{{subtotal}}',
        tax: '{{tax}}',
        total: '{{total}}',
        currency: '{{currency}}'
      },
      order: 3
    },
    {
      type: 'terms',
      content: {
        title: 'Terms & Conditions',
        titleAr: 'الشروط والأحكام',
        items: [
          'This offer is valid until {{validUntil}}',
          'Prices are based on the LTA contract: {{ltaName}}',
          'Payment terms: {{paymentTerms}}',
          'All prices are in {{currency}}'
        ],
        itemsAr: [
          'هذا العرض صالح حتى {{validUntil}}',
          'الأسعار مبنية على الاتفاقية: {{ltaNameAr}}',
          'شروط الدفع: {{paymentTermsAr}}',
          'جميع الأسعار بـ {{currency}}'
        ]
      },
      order: 4
    },
    {
      type: 'footer',
      content: {
        text: 'Thank you for your business | شكراً لتعاملكم معنا',
        contact: '{{companyPhone}} | {{companyEmail}}',
        pageNumbers: true
      },
      order: 5
    }
  ],
  variables: [
    'companyName', 'companyNameAr', 'companyAddress', 'companyAddressAr',
    'companyPhone', 'companyEmail', 'offerNumber', 'clientName', 'clientNameAr',
    'ltaName', 'ltaNameAr', 'validUntil', 'products', 'subtotal', 'tax', 'total',
    'currency', 'paymentTerms', 'paymentTermsAr'
  ],
  styles: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    fontSize: 10,
    fontFamily: 'Helvetica',
    headerHeight: 120,
    footerHeight: 70,
    margins: {
      top: 140,
      bottom: 90,
      left: 50,
      right: 50
    }
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function testPDFGenerator() {
  console.log('🧪 Testing Enhanced PDF Generator (Simple Test)...\n');

  try {
    // Sample variables
    const sampleVariables = [
      { key: 'companyName', value: 'Al Qadi Trading Company' },
      { key: 'companyNameAr', value: 'شركة القاضي التجارية' },
      { key: 'companyAddress', value: 'Riyadh, Kingdom of Saudi Arabia' },
      { key: 'companyAddressAr', value: 'الرياض، المملكة العربية السعودية' },
      { key: 'companyPhone', value: '+966 XX XXX XXXX' },
      { key: 'companyEmail', value: 'info@alqadi.com' },
      { key: 'offerNumber', value: 'PO-2025-001' },
      { key: 'clientName', value: 'Saudi Aramco' },
      { key: 'clientNameAr', value: 'أرامكو السعودية' },
      { key: 'ltaName', value: 'LTA-2024-001' },
      { key: 'ltaNameAr', value: 'اتفاقية طويلة الأجل 2024-001' },
      { key: 'validUntil', value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() },
      { key: 'products', value: [
        { sku: 'SKU001', nameEn: 'Product 1', nameAr: 'منتج 1', quantity: 10, price: '100.00', total: '1000.00' },
        { sku: 'SKU002', nameEn: 'Product 2', nameAr: 'منتج 2', quantity: 5, price: '200.00', total: '1000.00' }
      ]},
      { key: 'subtotal', value: '2000.00' },
      { key: 'tax', value: '300.00' },
      { key: 'total', value: '2300.00' },
      { key: 'currency', value: 'SAR' },
      { key: 'paymentTerms', value: 'Net 30 days' },
      { key: 'paymentTermsAr', value: 'صافي 30 يوم' }
    ];

    // Test English generation
    console.log('🌍 Generating English PDF...');
    const englishPdf = await TemplatePDFGenerator.generate({
      template: mockTemplate,
      variables: sampleVariables,
      language: 'en'
    });
    
    const englishFileName = `test-price-offer-en-${Date.now()}.pdf`;
    const englishPath = path.join(process.cwd(), 'test-outputs', englishFileName);
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(englishPath), { recursive: true });
    fs.writeFileSync(englishPath, englishPdf);
    console.log(`✅ English PDF saved: ${englishPath} (${englishPdf.length} bytes)`);

    // Test Arabic generation
    console.log('🌍 Generating Arabic PDF...');
    const arabicPdf = await TemplatePDFGenerator.generate({
      template: mockTemplate,
      variables: sampleVariables,
      language: 'ar'
    });
    
    const arabicFileName = `test-price-offer-ar-${Date.now()}.pdf`;
    const arabicPath = path.join(process.cwd(), 'test-outputs', arabicFileName);
    fs.writeFileSync(arabicPath, arabicPdf);
    console.log(`✅ Arabic PDF saved: ${arabicPath} (${arabicPdf.length} bytes)`);

    // Test nested variable access
    console.log('🔗 Testing nested variable access...');
    const nestedVariables = [
      ...sampleVariables,
      { 
        key: 'client', 
        value: { 
          nameEn: 'Saudi Aramco', 
          nameAr: 'أرامكو السعودية',
          address: { street: 'Dhahran', city: 'Eastern Province' }
        } 
      }
    ];

    // Update template to use nested variables
    const nestedTemplate = {
      ...mockTemplate,
      sections: mockTemplate.sections.map(section => {
        if (section.type === 'body' && section.content.clientName) {
          return {
            ...section,
            content: {
              ...section.content,
              clientName: '{{client.nameEn}}',
              clientNameAr: '{{client.nameAr}}'
            }
          };
        }
        return section;
      })
    };

    const nestedPdf = await TemplatePDFGenerator.generate({
      template: nestedTemplate,
      variables: nestedVariables,
      language: 'en'
    });
    
    const nestedFileName = `test-nested-variables-${Date.now()}.pdf`;
    const nestedPath = path.join(process.cwd(), 'test-outputs', nestedFileName);
    fs.writeFileSync(nestedPath, nestedPdf);
    console.log(`✅ Nested variables PDF saved: ${nestedPath} (${nestedPdf.length} bytes)`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('📁 Check the test-outputs directory for generated PDFs');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPDFGenerator().catch(console.error);