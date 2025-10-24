import PDFKit from 'pdfkit';
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

// Shared styling constants
const STYLES = {
  colors: {
    primary: '#1a365d',
    accent: '#d4af37',
    lightBg: '#f8f9fa',
    border: '#e0e0e0',
    text: '#000000',
    lightText: '#4a5568',
    white: '#ffffff',
    gray: '#b0b0b0'
  },
  fonts: {
    bold: 'Helvetica-Bold',
    regular: 'Helvetica'
  },
  header: { height: 100, accentHeight: 3 },
  footer: { height: 60 }
};

const COMPANY = {
  nameEn: 'Al Qadi Trading Company',
  nameAr: 'شركة القاضي التجارية',
  addressEn: 'Riyadh, Kingdom of Saudi Arabia',
  addressAr: 'الرياض، المملكة العربية السعودية',
  phone: '+966 XX XXX XXXX',
  email: 'info@alqadi.com',
  website: 'www.alqadi.com'
};

export class PDFGenerator {
  private static readonly LOGO_PATH = path.join(process.cwd(), 'client', 'public', 'logo.png');

  // Shared header renderer
  private static drawHeader(doc: PDFKit.PDFDocument, language: 'en' | 'ar') {
    const { colors, header, fonts } = STYLES;

    doc.rect(0, 0, 595, header.height).fillAndStroke(colors.primary, colors.primary);
    doc.rect(0, header.height, 595, header.accentHeight).fillAndStroke(colors.accent, colors.accent);

    try {
      if (fs.existsSync(this.LOGO_PATH)) {
        doc.image(this.LOGO_PATH, 50, 25, { width: 60, height: 60 });
      }
    } catch {}

    doc.fontSize(18).fillColor(colors.white).font(fonts.bold)
      .text(language === 'ar' ? COMPANY.nameAr : COMPANY.nameEn, 130, 35, { align: 'left' });

    doc.fontSize(8).fillColor(colors.border).font(fonts.regular)
      .text(language === 'ar' ? COMPANY.addressAr : COMPANY.addressEn, 130, 60)
      .text(`${language === 'ar' ? 'هاتف:' : 'Tel:'} ${COMPANY.phone} | ${language === 'ar' ? 'بريد:' : 'Email:'} ${COMPANY.email}`, 130, 75)
      .text(COMPANY.website, 130, 87);
  }

  // Shared footer renderer
  private static drawFooter(doc: PDFKit.PDFDocument, language: 'en' | 'ar', pageHeight: number) {
    const { colors, footer, fonts } = STYLES;
    const footerY = pageHeight - footer.height;

    doc.rect(0, footerY, 595, 2).fillAndStroke(colors.accent, colors.accent);
    doc.rect(0, footerY + 2, 595, footer.height).fillAndStroke(colors.primary, colors.primary);

    doc.fontSize(8).fillColor(colors.white).font(fonts.regular)
      .text(
        language === 'ar' ? `${COMPANY.nameAr} | ${COMPANY.addressAr}` : `${COMPANY.nameEn} | ${COMPANY.addressEn}`,
        50, footerY + 15, { align: 'center', width: 495 }
      )
      .text(
        `${language === 'ar' ? 'هاتف:' : 'Tel:'} ${COMPANY.phone} | ${language === 'ar' ? 'بريد:' : 'Email:'} ${COMPANY.email} | ${COMPANY.website}`,
        50, footerY + 30, { align: 'center', width: 495 }
      );

    doc.fontSize(7).fillColor(colors.gray)
      .text(
        language === 'ar'
          ? `تم إنشاء هذا المستند تلقائياً في ${new Date().toLocaleDateString('ar-EG')}`
          : `Generated automatically on ${new Date().toLocaleDateString('en-US')}`,
        50, footerY + 45, { align: 'center', width: 495 }
      );
  }

  // Shared info box renderer
  private static drawInfoBox(doc: PDFKit.PDFDocument, items: Array<{label: string, value: string, x?: number, y?: number}>, startY: number, height: number = 80) {
    const { colors, fonts } = STYLES;

    doc.roundedRect(50, startY, 495, height, 5).fillAndStroke(colors.lightBg, colors.border);

    items.forEach(({ label, value, x = 60, y = 15 }) => {
      doc.fontSize(10).fillColor(colors.text).font(fonts.bold)
        .text(label, x, startY + y, { continued: true })
        .font(fonts.regular).text(value);
    });

    return startY + height;
  }

  static async generatePriceOffer(data: PriceOfferData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 120, bottom: 80, left: 50, right: 50 },
          bufferPages: true,
          compress: true
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.drawHeader(doc, data.language);
        doc.y = 140;

        // Title
        doc.fontSize(22).font(STYLES.fonts.bold).fillColor(STYLES.colors.primary)
          .text(data.language === 'ar' ? 'عرض سعر رسمي' : 'OFFICIAL PRICE OFFER', 50, doc.y, { align: 'center' });

        doc.moveTo(200, doc.y + 5).lineTo(400, doc.y + 5).lineWidth(2).strokeColor(STYLES.colors.accent).stroke();
        doc.moveDown(2).fillColor(STYLES.colors.text);

        // Offer details box
        const detailsY = doc.y;
        this.drawInfoBox(doc, [
          { label: `${data.language === 'ar' ? 'رقم العرض:' : 'Offer No:'} `, value: data.offerId, y: 15 },
          { label: `${data.language === 'ar' ? 'التاريخ:' : 'Date:'} `, value: data.offerDate, y: 32 },
          { label: `${data.language === 'ar' ? 'ساري حتى:' : 'Valid Until:'} `, value: data.validUntil, x: 300, y: 15 }
        ], detailsY, 60);

        doc.y += 10;

        // Client info
        doc.fontSize(13).font(STYLES.fonts.bold).fillColor(STYLES.colors.primary)
          .text(data.language === 'ar' ? 'إلى العميل الكريم:' : 'TO:', 50, doc.y);
        doc.fontSize(11).fillColor(STYLES.colors.text)
          .text(data.language === 'ar' ? data.clientNameAr : data.clientNameEn, 50, doc.y + 5);

        doc.fontSize(10).font(STYLES.fonts.regular).fillColor(STYLES.colors.lightText);
        if (data.clientEmail) doc.text(`${data.language === 'ar' ? 'البريد:' : 'Email:'} ${data.clientEmail}`);
        if (data.clientPhone) doc.text(`${data.language === 'ar' ? 'الهاتف:' : 'Phone:'} ${data.clientPhone}`);

        doc.moveDown().fillColor(STYLES.colors.text).fontSize(10).font(STYLES.fonts.bold)
          .text(`${data.language === 'ar' ? 'بموجب الاتفاقية:' : 'As per Agreement:'} `, { continued: true })
          .font(STYLES.fonts.regular).text(data.language === 'ar' ? data.ltaNameAr : data.ltaNameEn);

        doc.moveDown(1.5);

        // Items table
        this.renderItemsTable(doc, data.items, data.language, ['#', 'SKU', 'Product Name', 'Unit Price', 'Currency']);

        // Notes & Terms
        if (data.notes) {
          doc.moveDown().fontSize(11).font(STYLES.fonts.bold).fillColor(STYLES.colors.primary)
            .text(data.language === 'ar' ? 'ملاحظات:' : 'Notes:', 50, doc.y);
          doc.fontSize(10).fillColor(STYLES.colors.lightText).font(STYLES.fonts.regular)
            .text(data.notes, 50, doc.y + 5, { align: 'justify' });
        }

        doc.moveDown(2);
        const termsY = doc.y;
        doc.fontSize(11).font(STYLES.fonts.bold).fillColor(STYLES.colors.primary)
          .text(data.language === 'ar' ? 'الشروط والأحكام:' : 'Terms & Conditions:', 50, termsY);
        doc.fontSize(9).fillColor(STYLES.colors.lightText).font(STYLES.fonts.regular)
          .text(data.language === 'ar'
            ? '١. هذا العرض ساري المفعول حتى التاريخ المذكور أعلاه.\n٢. الأسعار المذكورة نهائية وتشمل جميع الضرائب والرسوم.\n٣. شروط الدفع حسب الاتفاقية طويلة الأجل المبرمة.\n٤. يجب تأكيد الطلب كتابياً قبل التوريد.\n٥. نحتفظ بالحق في تعديل الأسعار حسب تقلبات السوق.'
            : '1. This offer is valid until the date mentioned above.\n2. All prices are final and include applicable taxes and fees.\n3. Payment terms as per the Long-Term Agreement.\n4. Order confirmation required in writing before delivery.\n5. We reserve the right to adjust prices based on market fluctuations.',
            50, termsY + 25, { lineGap: 3 }
          );

        // Signature
        doc.moveDown(3);
        const signatureY = Math.max(doc.y, 650);
        doc.fillColor(STYLES.colors.text).fontSize(10).font(STYLES.fonts.bold)
          .text('_____________________', 80, signatureY)
          .text(data.language === 'ar' ? 'التوقيع المعتمد' : 'Authorized Signature', 80, signatureY + 15, { align: 'center', width: 120 });

        this.drawFooter(doc, data.language, doc.page.height);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateOrderPDF(data: { order: any; client: any; lta: any; items: any[]; language: 'en' | 'ar' }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 120, bottom: 80, left: 50, right: 50 },
          bufferPages: true,
          compress: true
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.drawHeader(doc, data.language);
        doc.y = 140;

        doc.fontSize(22).font(STYLES.fonts.bold).fillColor(STYLES.colors.primary)
          .text(data.language === 'ar' ? 'تفاصيل الطلب' : 'ORDER DETAILS', 50, doc.y, { align: 'center' });

        doc.moveDown(2).fillColor(STYLES.colors.text);

        // Order details box
        const detailsY = doc.y;
        const infoItems = [
          { label: `${data.language === 'ar' ? 'رقم الطلب:' : 'Order ID:'} `, value: data.order.id, y: 15 },
          { label: `${data.language === 'ar' ? 'التاريخ:' : 'Date:'} `, value: data.order.createdAt, y: 35 },
          { label: `${data.language === 'ar' ? 'الحالة:' : 'Status:'} `, value: data.order.status, y: 55 },
          { label: `${data.language === 'ar' ? 'العميل:' : 'Client:'} `, value: data.language === 'ar' ? data.client?.nameAr : data.client?.nameEn, x: 300, y: 15 }
        ];

        if (data.lta) {
          infoItems.push({
            label: `${data.language === 'ar' ? 'الاتفاقية:' : 'LTA:'} `,
            value: data.language === 'ar' ? data.lta.nameAr : data.lta.nameEn,
            x: 300,
            y: 35
          });
        }

        this.drawInfoBox(doc, infoItems, detailsY, 80);
        doc.y += 10;

        // Items table with totals
        this.renderItemsTable(doc, data.items, data.language, ['#', 'SKU', 'Product', 'Qty', 'Price', 'Total'], true);

        doc.moveDown().fontSize(14).font(STYLES.fonts.bold)
          .text(`${data.language === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'} ${data.order.totalAmount}`, 50, doc.y, { align: 'right' });

        this.drawFooter(doc, data.language, doc.page.height);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Shared table renderer
  private static renderItemsTable(
    doc: PDFKit.PDFDocument,
    items: any[],
    language: 'en' | 'ar',
    headers: string[],
    showTotals: boolean = false
  ) {
    const { colors, fonts } = STYLES;
    const tableTop = doc.y;
    const colWidths = showTotals ? [30, 80, 150, 50, 60, 55] : [30, 80, 200, 70, 55];
    const colX = [60, 100, 190, showTotals ? 350 : 400, showTotals ? 410 : 480, 480];

    // Header
    doc.rect(50, tableTop, 495, 25).fillAndStroke(colors.primary, colors.primary);
    doc.fontSize(10).fillColor(colors.white).font(fonts.bold);

    headers.forEach((header, i) => {
      const text = language === 'ar' ? this.translateHeader(header) : header;
      doc.text(text, colX[i], tableTop + 8, { width: colWidths[i], align: i > 2 ? 'right' : 'left' });
    });

    // Rows
    let yPos = tableTop + 25;
    doc.fillColor(colors.text).font(fonts.regular);

    items.forEach((item, idx) => {
      if (yPos > 680) {
        this.drawFooter(doc, language, doc.page.height);
        doc.addPage();
        this.drawHeader(doc, language);
        yPos = 140;
      }

      if ((idx + 1) % 2 === 0) {
        doc.rect(50, yPos, 495, 22).fillAndStroke(colors.lightBg, colors.lightBg);
      }

      doc.fillColor(colors.text).fontSize(9)
        .text((idx + 1).toString(), colX[0], yPos + 6, { width: colWidths[0] })
        .text(item.sku, colX[1], yPos + 6, { width: colWidths[1] })
        .text(language === 'ar' ? item.nameAr : item.nameEn, colX[2], yPos + 6, { width: colWidths[2] });

      if (showTotals) {
        const total = (parseFloat(item.price) * item.quantity).toFixed(2);
        doc.text(item.quantity.toString(), colX[3], yPos + 6, { width: colWidths[3] })
          .text(item.price, colX[4], yPos + 6, { width: colWidths[4], align: 'right' })
          .text(total, colX[5], yPos + 6, { width: colWidths[5], align: 'right' });
      } else {
        doc.text(item.contractPrice, colX[3], yPos + 6, { width: colWidths[3], align: 'right' })
          .text(item.currency, colX[4], yPos + 6, { width: colWidths[4] });
      }

      yPos += 22;
    });

    doc.moveTo(50, yPos).lineTo(545, yPos).strokeColor(colors.primary).lineWidth(2).stroke();
    doc.y = yPos + 15;
  }

  private static translateHeader(header: string): string {
    const translations: Record<string, string> = {
      '#': '#', 'SKU': 'رمز المنتج', 'Product Name': 'اسم المنتج', 'Unit Price': 'السعر',
      'Currency': 'العملة', 'Product': 'اسم المنتج', 'Qty': 'الكمية', 'Price': 'السعر', 'Total': 'المجموع'
    };
    return translations[header] || header;
  }
}