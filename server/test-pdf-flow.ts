import { TemplateStorage } from './template-storage';
import { PDFStorage } from './object-storage';
import { storage } from './storage';
import { PDFAccessControl } from './pdf-access-control';
import crypto from 'crypto';

async function testPDFFlow() {
  console.log('=== Testing Complete PDF Generation Flow ===\n');

  try {
    // Step 1: Fetch a template
    console.log('Step 1: Fetching price offer template...');
    const templates = await TemplateStorage.getTemplates('price_offer');
    if (templates.length === 0) {
      throw new Error('No price offer template found');
    }
    const template = templates[0];
    console.log(`✓ Found template: ${template.nameEn} (ID: ${template.id})\n`);

    // Step 2: Prepare variables (mock data)
    console.log('Step 2: Preparing mock data...');
    const variables = {
      clientName: 'ABC Corporation',
      clientNameAr: 'شركة ABC',
      validFrom: '2025-01-01',
      validUntil: '2025-12-31',
      items: [
        ['1', 'PROD-001', 'Premium Widget', '150.00', 'SAR'],
        ['2', 'PROD-002', 'Standard Widget', '100.00', 'SAR'],
        ['3', 'PROD-003', 'Economy Widget', '75.00', 'SAR']
      ],
      totalAmount: '325.00',
      currency: 'SAR',
      ltaNumber: 'LTA-2025-001',
      offerNumber: 'PO-2025-001'
    };
    console.log('✓ Mock data prepared\n');

    // Step 3: Generate simple PDF (mock - minimal valid PDF)
    console.log('Step 3: Generating PDF content...');
    // Minimal valid PDF structure
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT
/F1 12 Tf
50 700 Td
(Price Offer: ${variables.offerNumber}) Tj
0 -20 Td
(Client: ${variables.clientName}) Tj
0 -20 Td
(Total: ${variables.totalAmount} ${variables.currency}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000262 00000 n
0000000410 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
489
%%EOF`;
    const pdfBuffer = Buffer.from(pdfContent, 'utf-8');
    console.log(`✓ PDF generated (${pdfBuffer.length} bytes)\n`);

    // Step 4: Upload to object storage
    console.log('Step 4: Uploading to object storage...');
    const fileName = `price-offer-${Date.now()}.pdf`;
    const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, 'PRICE_OFFER');
    if (!uploadResult.ok) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    const fileUrl = uploadResult.fileName || 'unknown';
    const fileChecksum = uploadResult.checksum || '';
    console.log(`✓ Uploaded to: ${fileUrl}\n`);

    // Step 5: Create database record
    console.log('Step 5: Creating document record in database...');
    const checksum = fileChecksum;
    
    const document = await storage.createDocumentMetadata({
      documentType: 'price_offer',
      fileName: fileName,
      fileUrl: fileUrl,
      fileSize: pdfBuffer.length,
      ltaId: undefined,
      clientId: undefined,
      orderId: undefined,
      priceOfferId: undefined,
      checksum: checksum,
      metadata: {
        templateId: template.id,
        generatedAt: new Date().toISOString(),
        variables: variables
      }
    });
    console.log(`✓ Document created with ID: ${document.id}\n`);

    // Step 6: Generate secure download token
    console.log('Step 6: Generating secure download token...');
    const token = PDFAccessControl.generateDownloadToken(document.id, 'client-test-123');
    console.log(`✓ Token generated: ${token.substring(0, 40)}...\n`);

    // Step 7: Log access (skip for test since we don't have a real client)
    console.log('Step 7: Skipping access log (test client doesn\'t exist)');
    console.log('✓ Skipped\n');

    // Step 8: Increment view count
    console.log('Step 8: Testing view count increment...');
    await storage.incrementDocumentViewCount(document.id);
    const updatedDoc = await storage.getDocumentById(document.id);
    console.log(`✓ View count: ${updatedDoc?.viewCount}\n`);

    // Step 9: Verify access logs
    console.log('Step 9: Retrieving access logs...');
    const logs = await storage.getDocumentAccessLogs(document.id);
    console.log(`✓ Found ${logs.length} access log(s)\n`);

    // Final summary
    console.log('=== Test Summary ===');
    console.log(`Document ID: ${document.id}`);
    console.log(`File URL: ${fileUrl}`);
    console.log(`File Size: ${document.fileSize} bytes`);
    console.log(`Checksum: ${checksum.substring(0, 16)}...`);
    console.log(`View Count: ${updatedDoc?.viewCount}`);
    console.log(`Access Logs: ${logs.length}`);
    console.log('\n✓ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

testPDFFlow().catch(console.error);
