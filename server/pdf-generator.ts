
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface PriceOfferItem {
  sku: string;
  nameEn: string;
  nameAr: string;
  quantity?: number;
  contractPrice: string;
  currency: string;
}

interface PriceOfferData {
  offerId: string;
  offerDate: string;
  clientNameEn: string;
  clientNameAr: string;
  clientEmail?: string;
  clientPhone?: string;
  ltaNameEn: string;
  ltaNameAr: string;
  items: PriceOfferItem[];
  validUntil: string;
  notes?: string;
  language: 'en' | 'ar';
}

export class PDFGenerator {
  private static readonly LOGO_PATH = path.join(process.cwd(), 'client', 'public', 'logo.png');
  
  // Company information constants
  private static readonly COMPANY_NAME_EN = 'Al Qadi Trading Company';
  private static readonly COMPANY_NAME_AR = 'شركة القاضي التجارية';
  private static readonly COMPANY_ADDRESS_EN = 'Riyadh, Kingdom of Saudi Arabia';
  private static readonly COMPANY_ADDRESS_AR = 'الرياض، المملكة العربية السعودية';
  private static readonly COMPANY_PHONE = '+966 XX XXX XXXX';
  private static readonly COMPANY_EMAIL = 'info@alqadi.com';
  private static readonly COMPANY_WEBSITE = 'www.alqadi.com';

  static async generatePriceOffer(data: PriceOfferData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 120, bottom: 80, left: 50, right: 50 },
          bufferPages: true,
          autoFirstPage: true,
          compress: true
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        doc.on('end', () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);
            console.log('PDF generated successfully, size:', pdfBuffer.length);
            resolve(pdfBuffer);
          } catch (err) {
            console.error('Error concatenating PDF chunks:', err);
            reject(err);
          }
        });
        
        doc.on('error', (err: Error) => {
          console.error('PDF document error:', err);
          reject(err);
        });

        // Draw professional header with letterhead design
        this.drawHeader(doc, data.language);
        
        // Main content starts after header
        doc.y = 140;

        // Title with decorative line
        doc.fontSize(22)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(
            data.language === 'ar' ? 'عرض سعر رسمي' : 'OFFICIAL PRICE OFFER', 
            50, 
            doc.y,
            { align: 'center' }
          );
        
        // Decorative line under title
        doc.moveTo(200, doc.y + 5)
          .lineTo(400, doc.y + 5)
          .lineWidth(2)
          .strokeColor('#d4af37')
          .stroke();
        
        doc.moveDown(2);
        doc.fillColor('#000000');

        // Offer Details in a styled box
        const detailsY = doc.y;
        doc.roundedRect(50, detailsY, 495, 60, 5)
          .fillAndStroke('#f8f9fa', '#e0e0e0');
        
        doc.fontSize(10)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'رقم العرض:' : 'Offer No:'} `, 60, detailsY + 15, { continued: true })
          .font('Helvetica')
          .text(data.offerId);
        
        doc.font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'التاريخ:' : 'Date:'} `, 60, detailsY + 32, { continued: true })
          .font('Helvetica')
          .text(data.offerDate);
        
        doc.font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'ساري حتى:' : 'Valid Until:'} `, 300, detailsY + 15, { continued: true })
          .font('Helvetica')
          .text(data.validUntil);
        
        doc.y = detailsY + 70;
        doc.moveDown();

        // Client Information Section
        doc.fontSize(13)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(data.language === 'ar' ? 'إلى العميل الكريم:' : 'TO:', 50, doc.y);
        
        doc.fontSize(11)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? data.clientNameAr : data.clientNameEn, 50, doc.y + 5);

        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#4a5568');
        
        if (data.clientEmail) {
          doc.text(`${data.language === 'ar' ? 'البريد:' : 'Email:'} ${data.clientEmail}`);
        }
        if (data.clientPhone) {
          doc.text(`${data.language === 'ar' ? 'الهاتف:' : 'Phone:'} ${data.clientPhone}`);
        }
        
        doc.moveDown();
        doc.fillColor('#000000');

        // LTA Information
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'بموجب الاتفاقية:' : 'As per Agreement:'} `, { continued: true })
          .font('Helvetica')
          .text(data.language === 'ar' ? data.ltaNameAr : data.ltaNameEn);
        
        doc.moveDown(1.5);

        // Items Table with professional styling
        const tableTop = doc.y;
        
        // Table header with background
        doc.rect(50, tableTop, 495, 25)
          .fillAndStroke('#1a365d', '#1a365d');
        
        doc.fontSize(10)
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? '#' : 'No.', 60, tableTop + 8, { width: 30 })
          .text(data.language === 'ar' ? 'رمز المنتج' : 'SKU', 100, tableTop + 8, { width: 80 })
          .text(data.language === 'ar' ? 'اسم المنتج' : 'Product Name', 190, tableTop + 8, { width: 200 })
          .text(data.language === 'ar' ? 'السعر' : 'Unit Price', 400, tableTop + 8, { width: 70, align: 'right' })
          .text(data.language === 'ar' ? 'العملة' : 'Currency', 480, tableTop + 8, { width: 55 });

        // Items with alternating row colors
        let yPosition = tableTop + 25;
        doc.fillColor('#000000');
        doc.font('Helvetica');
        let itemNumber = 1;

        for (const item of data.items) {
          if (yPosition > 680) {
            this.drawFooter(doc, data.language, doc.page.height);
            doc.addPage();
            this.drawHeader(doc, data.language);
            yPosition = 140;
          }

          // Alternating row background
          if (itemNumber % 2 === 0) {
            doc.rect(50, yPosition, 495, 22)
              .fillAndStroke('#f8f9fa', '#f8f9fa');
          }

          doc.fillColor('#000000')
            .fontSize(9)
            .text(itemNumber.toString(), 60, yPosition + 6, { width: 30 })
            .text(item.sku, 100, yPosition + 6, { width: 80 })
            .text(data.language === 'ar' ? item.nameAr : item.nameEn, 190, yPosition + 6, { width: 200 })
            .text(item.contractPrice, 400, yPosition + 6, { width: 70, align: 'right' })
            .text(item.currency, 480, yPosition + 6, { width: 55 });

          yPosition += 22;
          itemNumber++;
        }
        
        // Bottom border of table
        doc.moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .strokeColor('#1a365d')
          .lineWidth(2)
          .stroke();
        
        doc.y = yPosition + 15;

        // Notes Section
        if (data.notes) {
          doc.moveDown(1);
          doc.fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#1a365d')
            .text(data.language === 'ar' ? 'ملاحظات:' : 'Notes:', 50, doc.y);

          doc.fontSize(10)
            .fillColor('#4a5568')
            .font('Helvetica')
            .text(data.notes, 50, doc.y + 5, { align: 'justify' });
        }

        // Terms & Conditions in a box
        doc.moveDown(2);
        const termsY = doc.y;
        
        doc.fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(data.language === 'ar' ? 'الشروط والأحكام:' : 'Terms & Conditions:', 50, termsY);

        doc.fontSize(9)
          .fillColor('#4a5568')
          .font('Helvetica')
          .text(data.language === 'ar' 
            ? '١. هذا العرض ساري المفعول حتى التاريخ المذكور أعلاه.\n٢. الأسعار المذكورة نهائية وتشمل جميع الضرائب والرسوم.\n٣. شروط الدفع حسب الاتفاقية طويلة الأجل المبرمة.\n٤. يجب تأكيد الطلب كتابياً قبل التوريد.\n٥. نحتفظ بالحق في تعديل الأسعار حسب تقلبات السوق.'
            : '1. This offer is valid until the date mentioned above.\n2. All prices are final and include applicable taxes and fees.\n3. Payment terms as per the Long-Term Agreement.\n4. Order confirmation required in writing before delivery.\n5. We reserve the right to adjust prices based on market fluctuations.',
            50,
            termsY + 25,
            { lineGap: 3 }
          );

        // Signature Section
        doc.moveDown(3);
        const signatureY = Math.max(doc.y, 650);
        doc.fillColor('#000000');

        // Signature line and text (no image needed)
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text('_____________________', 80, signatureY)
          .text(data.language === 'ar' ? 'التوقيع المعتمد' : 'Authorized Signature', 80, signatureY + 15, { align: 'center', width: 120 });

        // Draw footer on first/last page
        this.drawFooter(doc, data.language, doc.page.height);

        // Finalize the PDF
        doc.end();
      } catch (error) {
        console.error('PDF generation exception:', error);
        reject(error);
      }
    });
  }

  // Draw professional header with letterhead
  private static drawHeader(doc: PDFKit.PDFDocument, language: 'en' | 'ar') {
    // Header background with gradient effect
    doc.rect(0, 0, 595, 100)
      .fillAndStroke('#1a365d', '#1a365d');
    
    // Gold accent line
    doc.rect(0, 100, 595, 3)
      .fillAndStroke('#d4af37', '#d4af37');

    // Add logo if exists
    try {
      if (fs.existsSync(this.LOGO_PATH)) {
        doc.image(this.LOGO_PATH, 50, 25, { width: 60, height: 60 });
      }
    } catch (logoError) {
      console.warn('Could not load logo:', logoError);
      // Continue without logo
    }

    // Company name
    doc.fontSize(18)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(
        language === 'ar' ? this.COMPANY_NAME_AR : this.COMPANY_NAME_EN,
        130,
        35,
        { align: 'left' }
      );

    // Company info
    doc.fontSize(8)
      .fillColor('#e0e0e0')
      .font('Helvetica')
      .text(language === 'ar' ? this.COMPANY_ADDRESS_AR : this.COMPANY_ADDRESS_EN, 130, 60)
      .text(`${language === 'ar' ? 'هاتف:' : 'Tel:'} ${this.COMPANY_PHONE} | ${language === 'ar' ? 'بريد:' : 'Email:'} ${this.COMPANY_EMAIL}`, 130, 75)
      .text(this.COMPANY_WEBSITE, 130, 87);
  }

  // Draw professional footer
  private static drawFooter(doc: PDFKit.PDFDocument, language: 'en' | 'ar', pageHeight: number) {
    const footerY = pageHeight - 60;
    
    // Gold accent line above footer
    doc.rect(0, footerY, 595, 2)
      .fillAndStroke('#d4af37', '#d4af37');

    // Footer background
    doc.rect(0, footerY + 2, 595, 60)
      .fillAndStroke('#1a365d', '#1a365d');

    // Footer text
    doc.fontSize(8)
      .fillColor('#ffffff')
      .font('Helvetica')
      .text(
        language === 'ar' 
          ? `${this.COMPANY_NAME_AR} | ${this.COMPANY_ADDRESS_AR}`
          : `${this.COMPANY_NAME_EN} | ${this.COMPANY_ADDRESS_EN}`,
        50,
        footerY + 15,
        { align: 'center', width: 495 }
      );

    doc.text(
      `${language === 'ar' ? 'هاتف:' : 'Tel:'} ${this.COMPANY_PHONE} | ${language === 'ar' ? 'بريد:' : 'Email:'} ${this.COMPANY_EMAIL} | ${this.COMPANY_WEBSITE}`,
      50,
      footerY + 30,
      { align: 'center', width: 495 }
    );

    // Generated timestamp
    doc.fontSize(7)
      .fillColor('#b0b0b0')
      .text(
        language === 'ar' 
          ? `تم إنشاء هذا المستند تلقائياً في ${new Date().toLocaleDateString('ar-EG')}`
          : `Generated automatically on ${new Date().toLocaleDateString('en-US')}`,
        50,
        footerY + 45,
        { align: 'center', width: 495 }
      );
  }

  static async generateOrderPDF(data: {
    order: any;
    client: any;
    lta: any;
    items: any[];
    language: 'en' | 'ar';
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 120, bottom: 80, left: 50, right: 50 },
          bufferPages: true,
          autoFirstPage: true,
          compress: true
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        doc.on('end', () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);
            resolve(pdfBuffer);
          } catch (err) {
            reject(err);
          }
        });
        
        doc.on('error', (err: Error) => {
          reject(err);
        });

        // Draw header
        this.drawHeader(doc, data.language);
        
        doc.y = 140;

        // Title
        doc.fontSize(22)
          .font('Helvetica-Bold')
          .fillColor('#1a365d')
          .text(
            data.language === 'ar' ? 'تفاصيل الطلب' : 'ORDER DETAILS', 
            50, 
            doc.y,
            { align: 'center' }
          );
        
        doc.moveDown(2);
        doc.fillColor('#000000');

        // Order info box
        const detailsY = doc.y;
        doc.roundedRect(50, detailsY, 495, 80, 5)
          .fillAndStroke('#f8f9fa', '#e0e0e0');
        
        doc.fontSize(10)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'رقم الطلب:' : 'Order ID:'} `, 60, detailsY + 15, { continued: true })
          .font('Helvetica')
          .text(data.order.id);
        
        doc.font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'التاريخ:' : 'Date:'} `, 60, detailsY + 35, { continued: true })
          .font('Helvetica')
          .text(data.order.createdAt);
        
        doc.font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'الحالة:' : 'Status:'} `, 60, detailsY + 55, { continued: true })
          .font('Helvetica')
          .text(data.order.status);

        doc.font('Helvetica-Bold')
          .text(`${data.language === 'ar' ? 'العميل:' : 'Client:'} `, 300, detailsY + 15, { continued: true })
          .font('Helvetica')
          .text(data.language === 'ar' ? data.client?.nameAr : data.client?.nameEn);
        
        if (data.lta) {
          doc.font('Helvetica-Bold')
            .text(`${data.language === 'ar' ? 'الاتفاقية:' : 'LTA:'} `, 300, detailsY + 35, { continued: true })
            .font('Helvetica')
            .text(data.language === 'ar' ? data.lta.nameAr : data.lta.nameEn);
        }
        
        doc.y = detailsY + 90;
        doc.moveDown();

        // Items table
        const tableTop = doc.y;
        
        doc.rect(50, tableTop, 495, 25)
          .fillAndStroke('#1a365d', '#1a365d');
        
        doc.fontSize(10)
          .fillColor('#ffffff')
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? '#' : 'No.', 60, tableTop + 8, { width: 30 })
          .text(data.language === 'ar' ? 'رمز المنتج' : 'SKU', 100, tableTop + 8, { width: 80 })
          .text(data.language === 'ar' ? 'اسم المنتج' : 'Product', 190, tableTop + 8, { width: 150 })
          .text(data.language === 'ar' ? 'الكمية' : 'Qty', 350, tableTop + 8, { width: 50 })
          .text(data.language === 'ar' ? 'السعر' : 'Price', 410, tableTop + 8, { width: 60, align: 'right' })
          .text(data.language === 'ar' ? 'المجموع' : 'Total', 480, tableTop + 8, { width: 55, align: 'right' });

        let yPosition = tableTop + 25;
        doc.fillColor('#000000');
        doc.font('Helvetica');
        let itemNumber = 1;

        for (const item of data.items) {
          if (yPosition > 680) {
            this.drawFooter(doc, data.language, doc.page.height);
            doc.addPage();
            this.drawHeader(doc, data.language);
            yPosition = 140;
          }

          if (itemNumber % 2 === 0) {
            doc.rect(50, yPosition, 495, 22)
              .fillAndStroke('#f8f9fa', '#f8f9fa');
          }

          const total = (parseFloat(item.price) * item.quantity).toFixed(2);

          doc.fillColor('#000000')
            .fontSize(9)
            .text(itemNumber.toString(), 60, yPosition + 6, { width: 30 })
            .text(item.sku, 100, yPosition + 6, { width: 80 })
            .text(data.language === 'ar' ? item.nameAr : item.nameEn, 190, yPosition + 6, { width: 150 })
            .text(item.quantity.toString(), 350, yPosition + 6, { width: 50 })
            .text(item.price, 410, yPosition + 6, { width: 60, align: 'right' })
            .text(total, 480, yPosition + 6, { width: 55, align: 'right' });

          yPosition += 22;
          itemNumber++;
        }
        
        doc.moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .strokeColor('#1a365d')
          .lineWidth(2)
          .stroke();
        
        doc.y = yPosition + 15;
        doc.moveDown();

        // Total
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text(
            `${data.language === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'} ${data.order.totalAmount}`,
            50,
            doc.y,
            { align: 'right' }
          );

        this.drawFooter(doc, data.language, doc.page.height);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
