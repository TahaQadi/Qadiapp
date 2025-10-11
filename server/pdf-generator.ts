
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

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
  private static readonly FONTS_DIR = path.join(process.cwd(), 'server', 'fonts');
  private static readonly SIGNATURE_PATH = path.join(process.cwd(), 'server', 'assets', 'signature.png');
  private static readonly LOGO_PATH = path.join(process.cwd(), 'client', 'public', 'logo.png');

  static async generatePriceOffer(data: PriceOfferData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add logo if exists
        if (fs.existsSync(this.LOGO_PATH)) {
          doc.image(this.LOGO_PATH, 50, 45, { width: 80 });
        }

        // Header
        doc.fontSize(20)
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? 'عرض سعر رسمي' : 'Official Price Offer', 
                data.language === 'ar' ? { align: 'right' } : { align: 'left' })
          .moveDown();

        // Offer Details
        doc.fontSize(10)
          .font('Helvetica')
          .text(`${data.language === 'ar' ? 'رقم العرض:' : 'Offer ID:'} ${data.offerId}`)
          .text(`${data.language === 'ar' ? 'التاريخ:' : 'Date:'} ${data.offerDate}`)
          .text(`${data.language === 'ar' ? 'ساري حتى:' : 'Valid Until:'} ${data.validUntil}`)
          .moveDown();

        // Client Information
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? 'معلومات العميل' : 'Client Information')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(`${data.language === 'ar' ? 'الاسم:' : 'Name:'} ${data.language === 'ar' ? data.clientNameAr : data.clientNameEn}`);

        if (data.clientEmail) {
          doc.text(`${data.language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'} ${data.clientEmail}`);
        }
        if (data.clientPhone) {
          doc.text(`${data.language === 'ar' ? 'الهاتف:' : 'Phone:'} ${data.clientPhone}`);
        }
        doc.moveDown();

        // LTA Information
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? 'الاتفاقية' : 'Long-Term Agreement')
          .moveDown(0.5);

        doc.fontSize(10)
          .font('Helvetica')
          .text(data.language === 'ar' ? data.ltaNameAr : data.ltaNameEn)
          .moveDown();

        // Items Table Header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 150;
        const col3 = 320;
        const col4 = 420;
        const col5 = 500;

        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? 'رمز المنتج' : 'SKU', col1, tableTop)
          .text(data.language === 'ar' ? 'اسم المنتج' : 'Product Name', col2, tableTop)
          .text(data.language === 'ar' ? 'السعر' : 'Price', col3, tableTop)
          .text(data.language === 'ar' ? 'العملة' : 'Currency', col4, tableTop);

        doc.moveTo(col1, tableTop + 15)
          .lineTo(545, tableTop + 15)
          .stroke();

        // Items
        let yPosition = tableTop + 25;
        doc.font('Helvetica');

        for (const item of data.items) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.text(item.sku, col1, yPosition, { width: 90 })
            .text(data.language === 'ar' ? item.nameAr : item.nameEn, col2, yPosition, { width: 150 })
            .text(item.contractPrice, col3, yPosition)
            .text(item.currency, col4, yPosition);

          yPosition += 25;
        }

        // Notes
        if (data.notes) {
          doc.moveDown(2);
          doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(data.language === 'ar' ? 'ملاحظات' : 'Notes')
            .moveDown(0.5);

          doc.fontSize(10)
            .font('Helvetica')
            .text(data.notes);
        }

        // Terms & Conditions
        doc.moveDown(2);
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text(data.language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions')
          .moveDown(0.5);

        doc.fontSize(9)
          .font('Helvetica')
          .text(data.language === 'ar' 
            ? '١. هذا العرض ساري المفعول حتى التاريخ المذكور أعلاه.\n٢. الأسعار المذكورة نهائية وتشمل جميع الضرائب.\n٣. شروط الدفع حسب الاتفاقية المبرمة.\n٤. يجب تأكيد الطلب كتابياً.'
            : '1. This offer is valid until the date mentioned above.\n2. All prices are final and include applicable taxes.\n3. Payment terms as per the agreement.\n4. Order confirmation required in writing.'
          );

        // Signature Section
        doc.moveDown(3);
        const signatureY = doc.y;

        // Add signature image if exists
        if (fs.existsSync(this.SIGNATURE_PATH)) {
          doc.image(this.SIGNATURE_PATH, 50, signatureY, { width: 150 });
        }

        doc.fontSize(10)
          .font('Helvetica-Bold')
          .text('_____________________', 50, signatureY + 80)
          .text(data.language === 'ar' ? 'التوقيع المعتمد' : 'Authorized Signature', 50, signatureY + 95)
          .moveDown();

        doc.fontSize(8)
          .font('Helvetica')
          .text(data.language === 'ar' 
            ? `تم إنشاء هذا المستند تلقائياً في ${new Date().toLocaleDateString('ar-EG')}`
            : `This document was generated automatically on ${new Date().toLocaleDateString('en-US')}`,
            50, 
            750,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
