import { TemplatePDFGenerator } from './template-pdf-generator';
import { TemplateStorage } from './template-storage';
import fs from 'fs';
import path from 'path';

async function testEnhancedPDFGenerator() {
  console.log('🧪 Testing Enhanced PDF Generator...\n');

  try {
    // Get all templates
    const templates = await TemplateStorage.getTemplates();
    console.log(`📋 Found ${templates.length} templates`);

    for (const template of templates) {
      console.log(`\n📄 Testing template: ${template.nameEn} (${template.category})`);
      
      // Create sample variables for testing
      const sampleVariables = createSampleVariables(template.category);
      
      // Test English generation
      console.log('  🌍 Generating English PDF...');
      const englishPdf = await TemplatePDFGenerator.generate({
        template,
        variables: sampleVariables,
        language: 'en'
      });
      
      const englishFileName = `test-${template.category}-en-${Date.now()}.pdf`;
      const englishPath = path.join(process.cwd(), 'test-outputs', englishFileName);
      
      // Ensure directory exists
      fs.mkdirSync(path.dirname(englishPath), { recursive: true });
      fs.writeFileSync(englishPath, englishPdf);
      console.log(`  ✅ English PDF saved: ${englishPath} (${englishPdf.length} bytes)`);

      // Test Arabic generation if template supports it
      if (template.language === 'ar' || template.language === 'both') {
        console.log('  🌍 Generating Arabic PDF...');
        const arabicPdf = await TemplatePDFGenerator.generate({
          template,
          variables: sampleVariables,
          language: 'ar'
        });
        
        const arabicFileName = `test-${template.category}-ar-${Date.now()}.pdf`;
        const arabicPath = path.join(process.cwd(), 'test-outputs', arabicFileName);
        fs.writeFileSync(arabicPath, arabicPdf);
        console.log(`  ✅ Arabic PDF saved: ${arabicPath} (${arabicPdf.length} bytes)`);
      }

      // Test bilingual generation
      if (template.language === 'both') {
        console.log('  🌍 Generating Bilingual PDF...');
        const bilingualPdf = await TemplatePDFGenerator.generate({
          template,
          variables: sampleVariables,
          language: 'en' // This will use the template's language handling
        });
        
        const bilingualFileName = `test-${template.category}-bilingual-${Date.now()}.pdf`;
        const bilingualPath = path.join(process.cwd(), 'test-outputs', bilingualFileName);
        fs.writeFileSync(bilingualPath, bilingualPdf);
        console.log(`  ✅ Bilingual PDF saved: ${bilingualPath} (${bilingualPdf.length} bytes)`);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('📁 Check the test-outputs directory for generated PDFs');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

function createSampleVariables(category: string) {
  const baseVariables = [
    { key: 'companyName', value: 'Al Qadi Trading Company' },
    { key: 'companyNameAr', value: 'شركة القاضي التجارية' },
    { key: 'companyAddress', value: 'Riyadh, Kingdom of Saudi Arabia' },
    { key: 'companyAddressAr', value: 'الرياض، المملكة العربية السعودية' },
    { key: 'companyPhone', value: '+966 XX XXX XXXX' },
    { key: 'companyEmail', value: 'info@alqadi.com' },
    { key: 'date', value: new Date().toLocaleDateString() },
    { key: 'currency', value: 'SAR' },
  ];

  switch (category) {
    case 'price_offer':
      return [
        ...baseVariables,
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
        { key: 'taxRate', value: '15%' },
        { key: 'total', value: '2300.00' },
        { key: 'paymentTerms', value: 'Net 30 days' },
        { key: 'paymentTermsAr', value: 'صافي 30 يوم' },
        { key: 'deliveryTime', value: '2-3 weeks' },
        { key: 'deliveryTimeAr', value: '2-3 أسابيع' }
      ];

    case 'order':
      return [
        ...baseVariables,
        { key: 'orderNumber', value: 'ORD-2025-001' },
        { key: 'clientName', value: 'Saudi Aramco' },
        { key: 'clientNameAr', value: 'أرامكو السعودية' },
        { key: 'ltaName', value: 'LTA-2024-001' },
        { key: 'ltaNameAr', value: 'اتفاقية طويلة الأجل 2024-001' },
        { key: 'products', value: [
          { sku: 'SKU001', nameEn: 'Product 1', nameAr: 'منتج 1', quantity: 10, price: '100.00', total: '1000.00' },
          { sku: 'SKU002', nameEn: 'Product 2', nameAr: 'منتج 2', quantity: 5, price: '200.00', total: '1000.00' }
        ]},
        { key: 'subtotal', value: '2000.00' },
        { key: 'tax', value: '300.00' },
        { key: 'total', value: '2300.00' },
        { key: 'status', value: 'Confirmed' }
      ];

    case 'invoice':
      return [
        ...baseVariables,
        { key: 'invoiceNumber', value: 'INV-2025-001' },
        { key: 'clientName', value: 'Saudi Aramco' },
        { key: 'clientNameAr', value: 'أرامكو السعودية' },
        { key: 'orderNumber', value: 'ORD-2025-001' },
        { key: 'products', value: [
          { sku: 'SKU001', nameEn: 'Product 1', nameAr: 'منتج 1', quantity: 10, price: '100.00', total: '1000.00' },
          { sku: 'SKU002', nameEn: 'Product 2', nameAr: 'منتج 2', quantity: 5, price: '200.00', total: '1000.00' }
        ]},
        { key: 'subtotal', value: '2000.00' },
        { key: 'tax', value: '300.00' },
        { key: 'total', value: '2300.00' },
        { key: 'dueDate', value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() }
      ];

    case 'contract':
      return [
        ...baseVariables,
        { key: 'contractNumber', value: 'CON-2025-001' },
        { key: 'clientName', value: 'Saudi Aramco' },
        { key: 'clientNameAr', value: 'أرامكو السعودية' },
        { key: 'startDate', value: new Date().toLocaleDateString() },
        { key: 'endDate', value: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString() },
        { key: 'terms', value: 'Standard LTA terms and conditions apply' },
        { key: 'termsAr', value: 'تطبق الشروط والأحكام القياسية للاتفاقية طويلة الأجل' }
      ];

    default:
      return baseVariables;
  }
}

// Run the test
testEnhancedPDFGenerator().catch(console.error);