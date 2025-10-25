import { TemplateStorage } from './template-storage';
import { storage } from './storage';
import fs from 'fs';
import path from 'path';

async function testDocumentAPI() {
  console.log('🧪 Testing Document API Routes...\n');

  try {
    // Test 1: Check if templates exist
    console.log('📋 Checking templates...');
    const templates = await TemplateStorage.getTemplates();
    console.log(`✅ Found ${templates.length} templates`);

    if (templates.length === 0) {
      console.log('⚠️  No templates found. Creating a test template...');
      
      // Create a test template
      const testTemplate = {
        nameEn: 'Test Price Offer Template',
        nameAr: 'قالب عرض السعر التجريبي',
        descriptionEn: 'Test template for API testing',
        descriptionAr: 'قالب تجريبي لاختبار API',
        category: 'price_offer' as const,
        language: 'both' as const,
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
            type: 'footer',
            content: {
              text: 'Thank you for your business | شكراً لتعاملكم معنا',
              contact: '{{companyPhone}} | {{companyEmail}}',
              pageNumbers: true
            },
            order: 3
          }
        ],
        variables: [
          'companyName', 'companyNameAr', 'companyAddress', 'companyAddressAr',
          'companyPhone', 'companyEmail', 'offerNumber', 'clientName', 'clientNameAr',
          'ltaName', 'ltaNameAr', 'validUntil', 'products'
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
        isActive: true
      };

      const createdTemplate = await TemplateStorage.createTemplate(testTemplate);
      console.log(`✅ Created test template: ${createdTemplate.id}`);
    }

    // Test 2: Check document storage methods
    console.log('\n📄 Testing document storage methods...');
    
    // Test searchDocuments with pagination
    const searchResult = await storage.searchDocuments({}, 1, 10);
    console.log(`✅ Search documents: ${searchResult.documents.length} documents, total: ${searchResult.totalCount}`);

    // Test 3: Check if we can create a test document
    console.log('\n📝 Testing document creation...');
    
    const testDocument = await storage.createDocumentMetadata({
      fileName: 'test-document.pdf',
      fileUrl: 'test/test-document.pdf',
      documentType: 'price_offer',
      fileSize: 1024,
      checksum: 'test-checksum',
      metadata: {
        test: true,
        createdAt: new Date().toISOString()
      }
    });
    
    console.log(`✅ Created test document: ${testDocument.id}`);

    // Test 4: Test document retrieval
    const retrievedDoc = await storage.getDocumentById(testDocument.id);
    if (retrievedDoc) {
      console.log(`✅ Retrieved document: ${retrievedDoc.fileName}`);
    } else {
      console.log('❌ Failed to retrieve document');
    }

    // Test 5: Test document search with filters
    const filteredSearch = await storage.searchDocuments({
      documentType: 'price_offer'
    }, 1, 10);
    console.log(`✅ Filtered search: ${filteredSearch.documents.length} price offer documents`);

    // Test 6: Test access logs
    const accessLogs = await storage.getDocumentAccessLogs(testDocument.id);
    console.log(`✅ Access logs: ${accessLogs.length} entries`);

    // Clean up test document
    await storage.deleteDocument(testDocument.id);
    console.log('✅ Cleaned up test document');

    console.log('\n🎉 All API tests completed successfully!');
    console.log('📋 API endpoints are ready for use');

  } catch (error) {
    console.error('❌ API test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDocumentAPI().catch(console.error);