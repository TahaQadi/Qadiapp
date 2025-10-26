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

        // Validate template structure
        if (!template || typeof template !== 'object') {
          throw new Error('Invalid template: template must be an object');
        }

        if (!template.sections || !Array.isArray(template.sections)) {
          throw new Error('Invalid template: sections array is required');
        }

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
        } else {
          doc.font('Helvetica');
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
        const logoPath = content.logoPath || 'public/logo.png';
        doc.image(logoPath, 50, y, { width: 60 });
      } catch (error) {
        console.error('Logo not found:', content.logoPath || 'public/logo.png');
      }
    }

    // Company info - handle both structured and simple formats
    let companyName = '';
    let companyAddress = '';
    let companyPhone = '';
    let companyEmail = '';
    let companyTaxNumber = '';

    if (content.companyInfo || content.companyInfoEn || content.companyInfoAr) {
      const companyInfo = language === 'ar' ? content.companyInfoAr : (content.companyInfoEn || content.companyInfo);

      if (typeof companyInfo === 'object') {
        companyName = companyInfo.name || '';
        companyAddress = companyInfo.address || '';
        companyPhone = companyInfo.phone || '';
        companyEmail = companyInfo.email || '';
        companyTaxNumber = companyInfo.taxNumber || '';
      }
    } else {
      // Handle simple string fields
      companyName = this.replaceVariables(content.companyName || '', variables);
      companyAddress = this.replaceVariables(content.address || content.companyAddress || '', variables);
      companyPhone = this.replaceVariables(content.phone || content.companyPhone || '', variables);
      companyEmail = this.replaceVariables(content.email || content.companyEmail || '', variables);
      companyTaxNumber = this.replaceVariables(content.taxNumber || content.companyTaxNumber || '', variables);
    }

    // Render company information
    if (companyName) {
      doc.fontSize(styles.fontSize + 2)
        .fillColor(styles.primaryColor)
        .text(companyName, 120, y, { align: 'left' });
    }

    doc.fontSize(styles.fontSize - 1)
      .fillColor(styles.secondaryColor);

    if (companyAddress) {
      doc.text(companyAddress, 120, doc.y + 2);
    }
    if (companyPhone) {
      doc.text(companyPhone, 120, doc.y + 2);
    }
    if (companyEmail) {
      doc.text(companyEmail, 120, doc.y + 2);
    }
    if (companyTaxNumber) {
      const taxLabel = language === 'ar' ? 'الرقم الضريبي:' : 'Tax ID:';
      doc.text(`${taxLabel} ${companyTaxNumber}`, 120, doc.y + 2);
    }

    // Title
    const title = language === 'ar' ? content.titleAr : content.title;
    if (title) {
      doc.moveDown(1);
      doc.fontSize(styles.fontSize + 6)
        .fillColor(styles.primaryColor)
        .text(this.replaceVariables(title, variables), { align: 'center' });
    }

    // Additional header fields
    const headerFields = ['date', 'offerNumber', 'clientName', 'ltaName', 'validUntil'];
    headerFields.forEach(field => {
      if (content[field]) {
        const value = this.replaceVariables(content[field], variables);
        if (value && value !== content[field]) {
          const label = language === 'ar' ? this.getArabicLabel(field) : this.getEnglishLabel(field);
          doc.fontSize(styles.fontSize - 1)
            .fillColor(styles.secondaryColor)
            .text(`${label}: ${value}`, { align: 'center' });
        }
      }
    });

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

    // Handle section title
    if (content.sectionTitle) {
      const title = language === 'ar' ? content.sectionTitleAr : content.sectionTitle;
      doc.fontSize(styles.fontSize + 2)
        .fillColor(styles.primaryColor)
        .text(this.replaceVariables(title, variables));
      doc.moveDown(0.5);
    }

    // Handle main text content
    const text = language === 'ar' ? content.textAr : content.textEn || content.text;
    if (text) {
      doc.fontSize(styles.fontSize)
        .fillColor(styles.secondaryColor);

      this.renderText(doc, this.replaceVariables(text, variables), {
        align: content.align || 'left',
      }, language);
    }

    // Handle structured data fields (like subtotal, tax, etc.)
    const structuredFields = ['subtotal', 'tax', 'taxRate', 'discount', 'total', 'currency', 'date', 'offerNumber'];
    structuredFields.forEach(field => {
      if (content[field]) {
        const value = this.replaceVariables(content[field], variables);
        if (value && value !== content[field]) {
          const label = language === 'ar' ? this.getArabicLabel(field) : this.getEnglishLabel(field);
          doc.fontSize(styles.fontSize)
            .fillColor(styles.secondaryColor)
            .text(`${label}: ${value}`, {
              align: content.align || 'left',
            });
        }
      }
    });

    // Handle client/party information
    const partyFields = ['clientName', 'clientNameAr', 'ltaName', 'ltaNameAr', 'validUntil'];
    partyFields.forEach(field => {
      if (content[field]) {
        const value = this.replaceVariables(content[field], variables);
        if (value && value !== content[field]) {
          const label = language === 'ar' ? this.getArabicLabel(field) : this.getEnglishLabel(field);
          doc.fontSize(styles.fontSize - 1)
            .fillColor(styles.secondaryColor)
            .text(`${label}: ${value}`);
        }
      }
    });

    // Handle any other dynamic fields
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

  private static getEnglishLabel(field: string): string {
    const labels: Record<string, string> = {
      subtotal: 'Subtotal',
      tax: 'Tax',
      taxRate: 'Tax Rate',
      discount: 'Discount',
      total: 'Total',
      currency: 'Currency',
      date: 'Date',
      offerNumber: 'Offer Number',
      clientName: 'Client',
      ltaName: 'LTA Agreement',
      validUntil: 'Valid Until'
    };
    return labels[field] || field;
  }

  private static getArabicLabel(field: string): string {
    const labels: Record<string, string> = {
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة',
      taxRate: 'معدل الضريبة',
      discount: 'الخصم',
      total: 'المجموع',
      currency: 'العملة',
      date: 'التاريخ',
      offerNumber: 'رقم العرض',
      clientName: 'العميل',
      ltaName: 'الاتفاقية',
      validUntil: 'صالح حتى'
    };
    return labels[field] || field;
  }

  private static renderText(
    doc: PDFKit.PDFDocument,
    text: string,
    options: any,
    language: 'en' | 'ar'
  ) {
    // Handle RTL for Arabic text
    if (language === 'ar' && options.align !== 'center') {
      options.align = 'right';
    }

    doc.text(text, options);
  }

  private static isArabicText(text: string): boolean {
    // Simple check for Arabic characters
    return /[\u0600-\u06FF]/.test(text);
  }

  private static renderTable(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Array<{ key: string; value: any }>,
    styles: any,
    language: 'en' | 'ar'
  ) {
    const content = section.content as any;

    // Support both naming conventions: headers/headersAr and columnsEn/columnsAr
    let headers: string[];
    if (language === 'ar') {
      headers = content.headersAr || content.columnsAr;
    } else {
      headers = content.headers || content.columnsEn;
    }

    const dataSource = content.dataSource || content.rows;

    // Validate table structure
    if (!headers || !Array.isArray(headers)) {
      console.error('Invalid table section:', JSON.stringify(section, null, 2));
      throw new Error(`Table headers not found or invalid in section: ${section.title || 'unnamed'}`);
    }

    // Get data from variables - handle both direct variable and nested access
    let data: any[] = [];
    if (dataSource) {
      const cleanDataSource = dataSource.replace(/[{}]/g, '');
      const dataVar = variables.find(v => v.key === cleanDataSource);
      data = dataVar?.value || [];
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('Table data not found or empty');
      return;
    }

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

      // Check if we need a new page
      if (currentY + rowHeight > doc.page.height - 100) {
        // Render footer before adding new page for page numbers
        if (content.pageNumbers) {
          this.renderFooter(doc, { content: { text: '', pageNumbers: true } } as any, variables, styles, language);
        }
        doc.addPage();
        currentY = 50; // Start after header space
      }

      if (content.alternateRowColors && rowIndex % 2 === 1) {
        doc.rect(50, currentY, doc.page.width - 100, rowHeight)
          .fillOpacity(0.1)
          .fill(styles.secondaryColor)
          .fillOpacity(1);
      }

      // Handle both object and array row data
      const rowValues = Array.isArray(row) ? row : Object.values(row);

      rowValues.forEach((cell: any, colIndex: number) => {
        if (colIndex < headers.length) {
          doc.fontSize(styles.fontSize - 1)
            .fillColor(styles.secondaryColor);

          this.renderText(doc, String(cell || ''), {
            x: 50 + colIndex * columnWidth + 5,
            y: currentY + 3,
            width: columnWidth - 10,
            align: 'center',
          }, language);
        }
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

  // Cache for compiled variable patterns
  private static variableCache = new Map<string, RegExp>();

  private static replaceVariables(
    text: string,
    variables: Array<{ key: string; value: any }>
  ): string {
    if (!text) return '';

    // Create optimized variable map
    const varMap = new Map<string, any>();
    variables.forEach(({ key, value }) => varMap.set(key, value));

    // Single pass replacement with caching
    return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      const value = this.getNestedValue(varMap, trimmedPath);
      return value !== undefined ? String(value) : match;
    });
  }

  private static getNestedValue(varMap: Map<string, any>, path: string): any {
    // Direct lookup for simple variables (most common case)
    if (varMap.has(path)) {
      return varMap.get(path);
    }

    // Handle nested paths efficiently
    const parts = path.split('.');
    let current: any = varMap.get(parts[0]);

    for (let i = 1; i < parts.length && current != null; i++) {
      current = current[parts[i]];
    }

    return current;
  }
}