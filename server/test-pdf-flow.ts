import { TemplateStorage } from './template-storage';
import { PDFStorage } from './object-storage';
import { storage } from './storage';
import { PDFAccessControl } from './pdf-access-control';
import crypto from 'crypto';

async function testPDFFlow() {

  try {
    // Step 1: Fetch a template
    const templates = await TemplateStorage.getTemplates('price_offer');
    if (templates.length === 0) {
      throw new Error('No price offer template found');
    }
    const template = templates[0];

    // Step 2: Prepare variables (mock data)
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

    // Step 3: Generate simple PDF (mock - minimal valid PDF)
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

    // Step 4: Upload to object storage
    const fileName = `price-offer-${Date.now()}.pdf`;
    const uploadResult = await PDFStorage.uploadPDF(pdfBuffer, fileName, 'PRICE_OFFER');
    if (!uploadResult.ok) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    const fileUrl = uploadResult.fileName || 'unknown';
    const fileChecksum = uploadResult.checksum || '';

    // Step 5: Create database record
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

    // Step 6: Generate secure download token
    const token = PDFAccessControl.generateDownloadToken(document.id, 'client-test-123');

    // Step 7: Log access (skip for test since we don't have a real client)

    // Step 8: Increment view count
    await storage.incrementDocumentViewCount(document.id);
    const updatedDoc = await storage.getDocumentById(document.id);

    // Step 9: Verify access logs
    const logs = await storage.getDocumentAccessLogs(document.id);

    // Final summary

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

testPDFFlow().catch(console.error);
