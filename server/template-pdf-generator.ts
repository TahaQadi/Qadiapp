import PDFDocument from 'pdfkit';
import type { Template, TemplateSection } from './template-storage';

interface GenerateOptions {
  template: Template;
  variables: Array<{ key: string; value: any }>;
  language: 'en' | 'ar';
}

export class TemplatePDFGenerator {
  static async generate(options: GenerateOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const { template, variables, language } = options;
        const styles = typeof template.styles === 'string' 
          ? JSON.parse(template.styles) 
          : template.styles;

        const doc = new PDFDocument({
          size: 'A4',
          margins: styles.margins || {
            top: 120,
            bottom: 80,
            left: 50,
            right: 50,
          },
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Set font based on language
        if (language === 'ar') {
          doc.font('server/fonts/NotoSansArabic-Regular.ttf');
        }

        // Sort sections by order
        const sections = typeof template.sections === 'string' 
          ? JSON.parse(template.sections) 
          : template.sections as TemplateSection[];

        const sortedSections = sections.sort((a, b) => 
          (a.order || 0) - (b.order || 0)
        );

        // Render each section
        for (const section of sortedSections) {
          this.renderSection(doc, section, variables, styles, language);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static renderSection(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    switch (section.type) {
      case 'header':
        this.renderHeader(doc, section, variables, styles, language);
        break;
      case 'body':
        this.renderBody(doc, section, variables, styles, language);
        break;
      case 'table':
        this.renderTable(doc, section, variables, styles, language);
        break;
      case 'footer':
        this.renderFooter(doc, section, variables, styles, language);
        break;
      case 'signature':
        this.renderSignature(doc, section, variables, styles, language);
        break;
      case 'image':
        this.renderImage(doc, section, variables, styles, language);
        break;
      case 'divider':
        this.renderDivider(doc, section, styles);
        break;
      case 'spacer':
        this.renderSpacer(doc, section);
        break;
      case 'terms':
        this.renderTerms(doc, section, variables, styles, language);
        break;
    }
  }

  private static renderHeader(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;
    const y = doc.y;

    // Logo if available
    if (content.logo && content.showLogo !== false) {
      try {
        doc.image('public/logo.png', 50, y, { width: 60 });
      } catch (error) {
        console.error('Logo not found');
      }
    }

    // Company info
    const companyInfo = language === 'ar' ? content.companyInfoAr : content.companyInfoEn;
    if (companyInfo) {
      doc.fontSize(styles.fontSize + 2)
        .fillColor(styles.primaryColor)
        .text(companyInfo.name || '', 120, y, { align: 'left' });

      doc.fontSize(styles.fontSize - 1)
        .fillColor(styles.secondaryColor);

      if (companyInfo.address) {
        doc.text(companyInfo.address, 120, doc.y + 2);
      }
      if (companyInfo.phone) {
        doc.text(companyInfo.phone, 120, doc.y + 2);
      }
      if (companyInfo.email) {
        doc.text(companyInfo.email, 120, doc.y + 2);
      }
      if (companyInfo.taxNumber) {
        doc.text(`Tax ID: ${companyInfo.taxNumber}`, 120, doc.y + 2);
      }
    }

    // Title
    const title = language === 'ar' ? content.titleAr : content.title;
    if (title) {
      doc.moveDown(1);
      doc.fontSize(styles.fontSize + 6)
        .fillColor(styles.primaryColor)
        .text(this.replaceVariables(title, variables), { align: 'center' });
    }

    doc.moveDown(1);
  }

  private static renderBody(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;

    if (content.sectionTitle) {
      const title = language === 'ar' ? content.sectionTitleAr : content.sectionTitle;
      doc.fontSize(styles.fontSize + 2)
        .fillColor(styles.primaryColor)
        .text(this.replaceVariables(title, variables));
      doc.moveDown(0.5);
    }

    const text = language === 'ar' ? content.textAr : content.textEn || content.text;
    if (text) {
      doc.fontSize(styles.fontSize)
        .fillColor(styles.secondaryColor)
        .text(this.replaceVariables(text, variables), {
          align: content.align || 'left',
        });
    }

    // Handle additional fields in content
    Object.keys(content).forEach(key => {
      if (key.startsWith('party') || key.startsWith('supplier') || key.startsWith('client')) {
        const value = this.replaceVariables(content[key], variables);
        if (value && value !== content[key]) {
          doc.fontSize(styles.fontSize - 1)
            .text(`${key}: ${value}`);
        }
      }
    });

    doc.moveDown(0.5);
  }

  private static renderTable(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;
    const headers = language === 'ar' ? content.headersAr : content.headers;
    const dataSource = content.dataSource;

    // Get data from variables
    const dataVar = variables.find(v => v.key === dataSource.replace(/[{}]/g, ''));
    const data = dataVar?.value || [];

    if (!Array.isArray(data) || data.length === 0) return;

    const tableTop = doc.y;
    const columnWidth = (doc.page.width - 100) / headers.length;

    // Draw headers
    doc.fontSize(styles.fontSize)
      .fillColor('white')
      .rect(50, tableTop, doc.page.width - 100, 25)
      .fill(styles.primaryColor);

    headers.forEach((header: string, i: number) => {
      doc.fillColor('white')
        .text(header, 50 + i * columnWidth + 5, tableTop + 5, {
          width: columnWidth - 10,
          align: 'center',
        });
    });

    // Draw data rows
    let currentY = tableTop + 25;
    data.forEach((row: any, rowIndex: number) => {
      const rowHeight = 20;

      if (content.alternateRowColors && rowIndex % 2 === 1) {
        doc.rect(50, currentY, doc.page.width - 100, rowHeight)
          .fillOpacity(0.1)
          .fill(styles.secondaryColor)
          .fillOpacity(1);
      }

      Object.values(row).forEach((cell: any, colIndex: number) => {
        doc.fontSize(styles.fontSize - 1)
          .fillColor(styles.secondaryColor)
          .text(String(cell || ''), 50 + colIndex * columnWidth + 5, currentY + 3, {
            width: columnWidth - 10,
            align: 'center',
          });
      });

      if (content.showBorders) {
        doc.rect(50, currentY, doc.page.width - 100, rowHeight)
          .stroke(styles.secondaryColor);
      }

      currentY += rowHeight;
    });

    doc.y = currentY + 10;
  }

  private static renderFooter(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const y = doc.page.height - 60;

      if (content.text) {
        doc.fontSize(styles.fontSize - 2)
          .fillColor(styles.secondaryColor)
          .text(this.replaceVariables(content.text, variables), 50, y, {
            align: 'center',
            width: doc.page.width - 100,
          });
      }

      if (content.contact) {
        doc.text(this.replaceVariables(content.contact, variables), 50, y + 15, {
          align: 'center',
          width: doc.page.width - 100,
        });
      }

      if (content.pageNumbers) {
        doc.text(`Page ${i + 1} of ${pageCount}`, 50, y + 30, {
          align: 'center',
          width: doc.page.width - 100,
        });
      }
    }
  }

  private static renderSignature(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;
    const signatories = content.signatories || [];
    const width = (doc.page.width - 100) / signatories.length;

    doc.moveDown(2);

    signatories.forEach((signatory: any, index: number) => {
      const x = 50 + index * width;
      const y = doc.y;

      doc.fontSize(styles.fontSize - 1)
        .fillColor(styles.secondaryColor)
        .text(language === 'ar' ? signatory.nameAr : signatory.nameEn, x, y, {
          width: width - 20,
          align: 'center',
        });

      doc.text(language === 'ar' ? signatory.titleAr : signatory.titleEn, x, doc.y + 5, {
        width: width - 20,
        align: 'center',
      });

      // Signature line
      doc.moveTo(x + 10, doc.y + 40)
        .lineTo(x + width - 30, doc.y + 40)
        .stroke(styles.secondaryColor);
    });

    doc.moveDown(3);
  }

  private static renderImage(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;
    const imagePath = this.replaceVariables(content.path || content.url, variables);

    try {
      doc.image(imagePath, {
        width: content.width || 200,
        align: content.align || 'center',
      });
      doc.moveDown(1);
    } catch (error) {
      console.error('Image not found:', imagePath);
    }
  }

  private static renderDivider(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    styles: any
  ) {
    doc.moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke(styles.accentColor);
    doc.moveDown(0.5);
  }

  private static renderSpacer(
    doc: PDFKit.PDFDocument,
    section: TemplateSection
  ) {
    const content = section.content as any;
    const height = content.height || 20;
    doc.y += height;
  }

  private static renderTerms(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;
    const title = language === 'ar' ? content.titleAr : content.title;
    const items = language === 'ar' ? content.itemsAr : content.items;

    if (title) {
      doc.fontSize(styles.fontSize + 2)
        .fillColor(styles.primaryColor)
        .text(this.replaceVariables(title, variables));
      doc.moveDown(0.5);
    }

    if (items && Array.isArray(items)) {
      items.forEach((item: string) => {
        doc.fontSize(styles.fontSize - 1)
          .fillColor(styles.secondaryColor)
          .text(this.replaceVariables(item, variables), {
            indent: 10,
          });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(0.5);
  }

  private static replaceVariables(
    text: string,
    variables: Array<{ key: string; value: any }>
  ): string {
    if (!text) return '';

    let result = text;
    variables.forEach(variable => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      result = result.replace(regex, String(variable.value || ''));
    });

    return result;
  }
}