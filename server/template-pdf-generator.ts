import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface TemplateSection {
  type: 'header' | 'body' | 'table' | 'terms' | 'signature' | 'footer' | 'image' | 'divider' | 'spacer';
  content: any;
}

interface TemplateStyles {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

interface Template {
  nameEn: string;
  nameAr: string;
  category: string;
  language: 'en' | 'ar' | 'both';
  sections: TemplateSection[];
  variables: string[];
  styles: TemplateStyles;
}

export class TemplatePDFGenerator {
  private static readonly LOGO_PATH = path.join(process.cwd(), 'client', 'public', 'logo.png');
  private static readonly DEFAULT_MARGIN = { top: 120, bottom: 80, left: 50, right: 50 };
  
  /**
   * Generate PDF from template and variables
   */
  static async generateFromTemplate(
    template: Template,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both' = 'both'
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const margins = template.styles.margins || this.DEFAULT_MARGIN;
        
        const doc = new PDFDocument({
          size: 'A4',
          margins,
          bufferPages: true,
          autoFirstPage: true,
          compress: true
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Process each section
        for (const section of template.sections) {
          this.renderSection(doc, section, variables, language, template.styles);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Render a single section
   */
  private static renderSection(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    switch (section.type) {
      case 'header':
        this.renderHeader(doc, section.content, variables, language, styles);
        break;
      case 'body':
        this.renderBody(doc, section.content, variables, language, styles);
        break;
      case 'table':
        this.renderTable(doc, section.content, variables, language, styles);
        break;
      case 'terms':
        this.renderTerms(doc, section.content, variables, language, styles);
        break;
      case 'signature':
        this.renderSignature(doc, section.content, variables, language, styles);
        break;
      case 'footer':
        this.renderFooter(doc, section.content, variables, language, styles);
        break;
      case 'image':
        this.renderImage(doc, section.content, variables, language, styles);
        break;
      case 'divider':
        this.renderDivider(doc, section.content, styles);
        break;
      case 'spacer':
        this.renderSpacer(doc, section.content);
        break;
    }
  }

  /**
   * Render header section with logo and company info
   */
  private static renderHeader(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const primaryColor = styles.primaryColor || '#1a365d';
    const accentColor = styles.accentColor || '#d4af37';
    
    // Logo (if exists and showLogo is true)
    if (content.showLogo && fs.existsSync(this.LOGO_PATH)) {
      try {
        doc.image(this.LOGO_PATH, 50, 30, { width: 60 });
      } catch (e) {
        // Skip logo if error
      }
    }

    // Company info (right side)
    const companyInfo = language === 'ar' ? content.companyInfoAr : content.companyInfoEn;
    if (companyInfo) {
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(this.substituteVariables(companyInfo.name, variables), 300, 35, { width: 250, align: 'right' });
      
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#4a5568')
        .text(this.substituteVariables(companyInfo.address, variables), 300, 50, { width: 250, align: 'right' })
        .text(this.substituteVariables(companyInfo.phone, variables), 300, 63, { width: 250, align: 'right' })
        .text(this.substituteVariables(companyInfo.email, variables), 300, 76, { width: 250, align: 'right' });
    }

    // Decorative line
    doc.moveTo(50, 100)
      .lineTo(545, 100)
      .lineWidth(2)
      .strokeColor(accentColor)
      .stroke();

    // Title
    if (content.titleEn || content.titleAr) {
      const title = language === 'ar' ? content.titleAr : content.titleEn;
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor(primaryColor)
        .text(this.substituteVariables(title, variables), 50, 110, { align: 'center' });
    }

    doc.y = 150;
  }

  /**
   * Render body text section
   */
  private static renderBody(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const text = language === 'ar' ? content.textAr : content.textEn;
    if (!text) return;

    const fontSize = styles.fontSize || 10;
    const processedText = this.substituteVariables(text, variables);

    doc.fontSize(fontSize)
      .font('Helvetica')
      .fillColor('#000000')
      .text(processedText, 50, doc.y, { width: 495, align: 'left' });
    
    doc.moveDown(1);
  }

  /**
   * Render table section
   */
  private static renderTable(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const primaryColor = styles.primaryColor || '#1a365d';
    const columns = language === 'ar' ? content.columnsAr : content.columnsEn;
    const rows = variables[content.rows] || [];

    if (!columns || rows.length === 0) return;

    const tableTop = doc.y;
    const colWidth = 495 / columns.length;

    // Table header
    doc.rect(50, tableTop, 495, 25)
      .fillAndStroke(primaryColor, primaryColor);

    doc.fontSize(9)
      .fillColor('#ffffff')
      .font('Helvetica-Bold');

    columns.forEach((col: string, i: number) => {
      doc.text(col, 55 + (i * colWidth), tableTop + 8, { width: colWidth - 10 });
    });

    // Table rows
    let yPos = tableTop + 25;
    doc.fillColor('#000000').font('Helvetica').fontSize(9);

    rows.forEach((row: any[], index: number) => {
      // Check for page break
      if (yPos > 680) {
        doc.addPage();
        yPos = 50;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        doc.rect(50, yPos, 495, 20).fillAndStroke('#f8f9fa', '#f8f9fa');
      }

      doc.fillColor('#000000');
      row.forEach((cell, i) => {
        doc.text(String(cell), 55 + (i * colWidth), yPos + 5, { width: colWidth - 10 });
      });

      yPos += 20;
    });

    // Bottom border
    doc.moveTo(50, yPos)
      .lineTo(545, yPos)
      .strokeColor(primaryColor)
      .lineWidth(1)
      .stroke();

    doc.y = yPos + 15;
  }

  /**
   * Render terms & conditions section
   */
  private static renderTerms(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const secondaryColor = styles.secondaryColor || '#2d3748';
    const title = language === 'ar' ? content.titleAr : content.titleEn;
    const items = language === 'ar' ? content.itemsAr : content.itemsEn;

    if (!items || items.length === 0) return;

    doc.moveDown(1);
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(secondaryColor)
      .text(title, 50, doc.y);

    doc.moveDown(0.5);
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('#000000');

    items.forEach((item: string, index: number) => {
      const processedItem = this.substituteVariables(item, variables);
      doc.text(`${index + 1}. ${processedItem}`, 60, doc.y, { width: 485 });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
  }

  /**
   * Render signature section
   */
  private static renderSignature(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const signatories = content.signatories || [];
    if (signatories.length === 0) return;

    doc.moveDown(2);
    const startX = 50;
    const sigWidth = 495 / signatories.length;

    signatories.forEach((signatory: any, index: number) => {
      const x = startX + (index * sigWidth);
      const name = language === 'ar' ? signatory.nameAr : signatory.nameEn;
      const title = language === 'ar' ? signatory.titleAr : signatory.titleEn;

      // Signature line
      doc.moveTo(x + 20, doc.y + 40)
        .lineTo(x + sigWidth - 40, doc.y + 40)
        .strokeColor('#000000')
        .lineWidth(1)
        .stroke();

      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(this.substituteVariables(name, variables), x + 20, doc.y + 45, { width: sigWidth - 60, align: 'center' });

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#4a5568')
        .text(this.substituteVariables(title, variables), x + 20, doc.y + 3, { width: sigWidth - 60, align: 'center' });
    });

    doc.moveDown(3);
  }

  /**
   * Render footer section
   */
  private static renderFooter(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const text = language === 'ar' ? content.textAr : content.textEn;
    if (!text) return;

    const pageHeight = doc.page.height;
    const processedText = this.substituteVariables(text, variables);

    doc.fontSize(7)
      .font('Helvetica')
      .fillColor('#9ca3af')
      .text(processedText, 50, pageHeight - 50, { width: 495, align: 'center' });
  }

  /**
   * Render image section
   */
  private static renderImage(
    doc: PDFKit.PDFDocument,
    content: any,
    variables: Record<string, any>,
    language: 'en' | 'ar' | 'both',
    styles: TemplateStyles
  ): void {
    const imagePath = this.substituteVariables(content.path, variables);
    if (!imagePath || !fs.existsSync(imagePath)) return;

    try {
      const width = content.width || 200;
      const align = content.align || 'center';
      let x = 50;

      if (align === 'center') {
        x = (595 - width) / 2; // A4 width is 595
      } else if (align === 'right') {
        x = 545 - width;
      }

      doc.image(imagePath, x, doc.y, { width });
      doc.moveDown(2);
    } catch (e) {
      // Skip image if error
    }
  }

  /**
   * Render divider line
   */
  private static renderDivider(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: TemplateStyles
  ): void {
    const color = content.color || styles.primaryColor || '#000000';
    const thickness = content.thickness || 1;

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(color)
      .lineWidth(thickness)
      .stroke();
    doc.moveDown(0.5);
  }

  /**
   * Render spacer (vertical space)
   */
  private static renderSpacer(
    doc: PDFKit.PDFDocument,
    content: any
  ): void {
    const height = content.height || 20;
    doc.y += height;
  }

  /**
   * Substitute variables in text using {{variable}} syntax
   */
  private static substituteVariables(text: string, variables: Record<string, any>): string {
    if (!text) return '';
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }
}
