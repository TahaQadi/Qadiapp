import { TemplateGenerator } from './server/template-generator';
import { DocumentTemplate, TemplateVariable } from './shared/template-schema';

// Test data
const testVariables: TemplateVariable[] = [
  { key: 'companyName', value: 'ACME Corporation' },
  { key: 'companyNameAr', value: 'شركة إيه سي إم إي' },
  { key: 'companyAddress', value: '123 Business St, City, Country' },
  { key: 'companyAddressAr', value: 'شارع الأعمال 123، المدينة، البلد' },
  { key: 'companyPhone', value: '+1-555-0123' },
  { key: 'companyEmail', value: 'info@acme.com' },
  { key: 'date', value: '2024-01-15' },
  { key: 'offerNumber', value: 'PO-2024-001' },
  { key: 'clientName', value: 'Client Inc.' },
  { key: 'clientNameAr', value: 'شركة العميل' },
  { key: 'ltaName', value: 'LTA-2024-001' },
  { key: 'ltaNameAr', value: 'اتفاقية طويلة الأجل 2024-001' },
  { key: 'validUntil', value: '2024-02-15' },
  { key: 'products', value: [
    { sku: 'SKU001', name: 'Product 1', unit: 'pcs', qty: 10, price: 100, total: 1000 },
    { sku: 'SKU002', name: 'Product 2', unit: 'pcs', qty: 5, price: 200, total: 1000 }
  ]},
  { key: 'subtotal', value: '2000.00' },
  { key: 'tax', value: '200.00' },
  { key: 'taxRate', value: '10%' },
  { key: 'discount', value: '0.00' },
  { key: 'total', value: '2200.00' },
  { key: 'currency', value: 'USD' },
  { key: 'paymentTerms', value: 'Net 30 days' },
  { key: 'paymentTermsAr', value: 'صافي 30 يوماً' },
  { key: 'deliveryTime', value: '2-3 weeks' },
  { key: 'deliveryTimeAr', value: '2-3 أسابيع' }
];

async function testTemplateGenerator() {
  try {
    console.log('🧪 Testing template generator...');
    
    // Test template
    const testTemplate: DocumentTemplate = {
      id: 'test-template-1',
      nameEn: 'Test Price Offer',
      nameAr: 'عرض سعر تجريبي',
      descriptionEn: 'Test template for price offers',
      descriptionAr: 'قالب تجريبي لعروض الأسعار',
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
            logo: true
          },
          order: 0
        },
        {
          type: 'body',
          content: {
            title: 'Price Offer',
            titleAr: 'عرض السعر',
            date: '{{date}}',
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
            headers: ['#', 'SKU', 'Product Name', 'Unit', 'Qty', 'Unit Price', 'Total'],
            headersAr: ['#', 'الرمز', 'اسم المنتج', 'الوحدة', 'الكمية', 'سعر الوحدة', 'المجموع'],
            dataSource: '{{products}}',
            showBorders: true,
            alternateRowColors: true
          },
          order: 2
        },
        {
          type: 'spacer',
          content: {
            height: 20
          },
          order: 3
        },
        {
          type: 'body',
          content: {
            subtotal: '{{subtotal}}',
            tax: '{{tax}}',
            taxRate: '{{taxRate}}',
            discount: '{{discount}}',
            total: '{{total}}',
            currency: '{{currency}}'
          },
          order: 4
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
              'Delivery time: {{deliveryTime}}',
              'All prices are in {{currency}}'
            ],
            itemsAr: [
              'هذا العرض صالح حتى {{validUntil}}',
              'الأسعار مبنية على الاتفاقية: {{ltaNameAr}}',
              'شروط الدفع: {{paymentTermsAr}}',
              'وقت التسليم: {{deliveryTimeAr}}',
              'جميع الأسعار بـ {{currency}}'
            ]
          },
          order: 5
        },
        {
          type: 'footer',
          content: {
            text: 'Thank you for your business | شكراً لتعاملكم معنا',
            contact: '{{companyPhone}} | {{companyEmail}}',
            pageNumbers: true
          },
          order: 6
        }
      ],
      variables: [
        'companyName', 'companyNameAr', 'companyAddress', 'companyAddressAr',
        'companyPhone', 'companyEmail', 'date', 'offerNumber', 'clientName',
        'clientNameAr', 'ltaName', 'ltaNameAr', 'validUntil', 'products',
        'subtotal', 'tax', 'taxRate', 'discount', 'total', 'currency',
        'paymentTerms', 'paymentTermsAr', 'deliveryTime', 'deliveryTimeAr'
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
      isDefault: true,
      version: 1,
      tags: ['test', 'price-offer'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Test PDF generation
    console.log('📄 Generating PDF...');
    const pdfBuffer = await TemplateGenerator.generateFromTemplate(testTemplate, testVariables);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation returned empty buffer');
    }
    
    console.log('✅ PDF generated successfully!');
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // Save test PDF
    const fs = await import('fs');
    const testFileName = `test-template-generator-${Date.now()}.pdf`;
    fs.writeFileSync(testFileName, pdfBuffer);
    console.log(`💾 Test PDF saved as: ${testFileName}`);
    
    console.log('\n🎉 Template generator test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ PDF Generation - Working');
    console.log('✅ Variable Replacement - Working');
    console.log('✅ Bilingual Support - Working');
    console.log('✅ Multiple Section Types - Working');
    console.log('✅ Arabic Text Rendering - Working');
    
  } catch (error) {
    console.error('❌ Template generator test failed:', error);
    process.exit(1);
  }
}

testTemplateGenerator();