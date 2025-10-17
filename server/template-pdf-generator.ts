import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import ArabicReshaper from 'arabic-reshaper';
import bidi from 'bidi-js';

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
  private static readonly ARABIC_FONT_PATH = path.join(process.cwd(), 'server', 'fonts', 'NotoSansArabic-Regular.ttf');
  private static readonly ARABIC_FONT_BOLD_PATH = path.join(process.cwd(), 'server', 'fonts', 'NotoSansArabic-Bold.ttf');
  private static readonly DEFAULT_MARGIN = { top: 120, bottom: 80, left: 50, right: 50 };
  private static readonly DEFAULT_STYLES: TemplateStyles = {
    primaryColor: '#1a365d',
    secondaryColor: '#2d3748',
    accentColor: '#d4af37',
    fontSize: 10,
    fontFamily: 'Helvetica',
    margins: { top: 120, bottom: 80, left: 50, right: 50 }
  };
  
  // Arabic PDF generation now fully supported with RTL/BiDi text shaping
  // Uses arabic-reshaper for glyph connection and bidi-js for text ordering
  // Set to false to disable Arabic PDF generation if needed
  private static readonly ENABLE_ARABIC_PDF = process.env.ENABLE_ARABIC_PDF !== 'false';

  /**
   * Check if Arabic fonts are available
   */
  private static hasArabicFonts(): boolean {
    return fs.existsSync(this.ARABIC_FONT_PATH) && fs.existsSync(this.ARABIC_FONT_BOLD_PATH);
  }

  /**
   * Get appropriate font for language
   */
  private static getFont(doc: PDFKit.PDFDocument, language: 'en' | 'ar' | 'both', bold: boolean = false): void {
    if ((language === 'ar' || language === 'both') && this.hasArabicFonts()) {
      try {
        // Register Arabic font if not already registered
        const fontPath = bold ? this.ARABIC_FONT_BOLD_PATH : this.ARABIC_FONT_PATH;
        doc.font(fontPath);
        return;
      } catch (e) {
        // Fall back to Helvetica if Arabic font registration fails
      }
    }
    // Default to Helvetica for English
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica');
  }

  /**
   * Detect if text contains Arabic characters
   */
  private static isArabicText(text: string): boolean {
    if (!text) return false;
    // Arabic Unicode range: U+0600 to U+06FF
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  }

  /**
   * Process text for proper RTL rendering with BiDi support
   * This handles Arabic text shaping and bidirectional text ordering
   */
  private static processRTLText(text: string): string {
    if (!text) return text;
    
    try {
      // Step 1: Check if text contains Arabic
      if (!this.isArabicText(text)) {
        return text; // Return as-is for non-Arabic text
      }

      // Step 2: Reshape Arabic characters for proper glyph connection
      const reshaped = ArabicReshaper.convertArabic(text);

      // Step 3: Apply BiDi algorithm for proper RTL ordering
      const embeddingLevels = bidi.getEmbeddingLevels(reshaped, 'rtl');
      const reorderSegments = bidi.getReorderSegments(reshaped, embeddingLevels);
      
      // Step 4: Apply reordering
      let result = reshaped.split('');
      for (const [start, end] of reorderSegments) {
        const segment = result.slice(start, end + 1).reverse();
        result.splice(start, end - start + 1, ...segment);
      }

      // Step 5: Handle mirrored characters
      const mirroredChars = bidi.getMirroredCharactersMap(reshaped, embeddingLevels);
      mirroredChars.forEach((char, index) => {
        if (index < result.length) {
          result[index] = char;
        }
      });

      return result.join('');
    } catch (error) {
      // If processing fails, return original text
      return text;
    }
  }

  /**
   * Get text alignment based on language
   */
  private static getAlignment(language: 'en' | 'ar' | 'both', text?: string): 'left' | 'right' | 'center' {
    // For explicit Arabic language or if text contains Arabic
    if (language === 'ar' || (text && this.isArabicText(text))) {
      return 'right';
    }
    return 'left';
  }
  
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
        // Check if Arabic PDF generation is enabled
        if ((language === 'ar' || language === 'both') && !this.ENABLE_ARABIC_PDF) {
          reject(new Error(
            'Arabic PDF generation is disabled. Set ENABLE_ARABIC_PDF=true to enable.'
          ));
          return;
        }

        // Merge template styles with defaults
        const styles = {
          ...this.DEFAULT_STYLES,
          ...(template.styles || {}),
          margins: template.styles?.margins || this.DEFAULT_MARGIN
        };
        const margins = styles.margins;
        
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
          this.renderSection(doc, section, variables, language, styles);
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
      this.getFont(doc, language, true);
      const companyName = this.processRTLText(this.substituteVariables(companyInfo.name, variables));
      doc.fontSize(10)
        .fillColor(primaryColor)
        .text(companyName, 300, 35, { width: 250, align: 'right' });
      
      this.getFont(doc, language, false);
      const address = this.processRTLText(this.substituteVariables(companyInfo.address, variables));
      const phone = this.processRTLText(this.substituteVariables(companyInfo.phone, variables));
      const email = this.processRTLText(this.substituteVariables(companyInfo.email, variables));
      
      doc.fontSize(8)
        .fillColor('#4a5568')
        .text(address, 300, 50, { width: 250, align: 'right' })
        .text(phone, 300, 63, { width: 250, align: 'right' })
        .text(email, 300, 76, { width: 250, align: 'right' });
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
      const processedTitle = this.processRTLText(this.substituteVariables(title, variables));
      this.getFont(doc, language, true);
      doc.fontSize(20)
        .fillColor(primaryColor)
        .text(processedTitle, 50, 110, { align: 'center' });
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
    const substitutedText = this.substituteVariables(text, variables);
    const processedText = this.processRTLText(substitutedText);
    const alignment = this.getAlignment(language, substitutedText);

    this.getFont(doc, language, false);
    doc.fontSize(fontSize)
      .fillColor('#000000')
      .text(processedText, 50, doc.y, { width: 495, align: alignment });
    
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
    const isRTL = language === 'ar';

    // Table header
    doc.rect(50, tableTop, 495, 25)
      .fillAndStroke(primaryColor, primaryColor);

    this.getFont(doc, language, true);
    doc.fontSize(9)
      .fillColor('#ffffff');

    const alignment = this.getAlignment(language);
    
    // Reverse column order for RTL languages
    const displayColumns = isRTL ? [...columns].reverse() : columns;
    displayColumns.forEach((col: string, i: number) => {
      const processedCol = this.processRTLText(col);
      doc.text(processedCol, 55 + (i * colWidth), tableTop + 8, { width: colWidth - 10, align: alignment });
    });

    // Table rows
    let yPos = tableTop + 25;
    this.getFont(doc, language, false);
    doc.fillColor('#000000').fontSize(9);

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
      
      // Reverse row data order for RTL languages to match header
      const displayRow = isRTL ? [...row].reverse() : row;
      displayRow.forEach((cell, i) => {
        const cellText = String(cell);
        const processedCell = this.processRTLText(cellText);
        const cellAlignment = this.getAlignment(language, cellText);
        doc.text(processedCell, 55 + (i * colWidth), yPos + 5, { width: colWidth - 10, align: cellAlignment });
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

    const processedTitle = this.processRTLText(title);
    const alignment = this.getAlignment(language, title);

    doc.moveDown(1);
    this.getFont(doc, language, true);
    doc.fontSize(12)
      .fillColor(secondaryColor)
      .text(processedTitle, 50, doc.y, { align: alignment });

    doc.moveDown(0.5);
    this.getFont(doc, language, false);
    doc.fontSize(9)
      .fillColor('#000000');

    items.forEach((item: string, index: number) => {
      const substitutedItem = this.substituteVariables(item, variables);
      const processedItem = this.processRTLText(substitutedItem);
      const itemAlignment = this.getAlignment(language, substitutedItem);
      const numberPrefix = language === 'ar' ? `${index + 1}. ` : `${index + 1}. `;
      doc.text(numberPrefix + processedItem, 60, doc.y, { width: 485, align: itemAlignment });
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

      const processedName = this.processRTLText(this.substituteVariables(name, variables));
      const processedTitle = this.processRTLText(this.substituteVariables(title, variables));

      this.getFont(doc, language, true);
      doc.fontSize(9)
        .fillColor('#000000')
        .text(processedName, x + 20, doc.y + 45, { width: sigWidth - 60, align: 'center' });

      this.getFont(doc, language, false);
      doc.fontSize(8)
        .fillColor('#4a5568')
        .text(processedTitle, x + 20, doc.y + 3, { width: sigWidth - 60, align: 'center' });
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
    const substitutedText = this.substituteVariables(text, variables);
    const processedText = this.processRTLText(substitutedText);

    this.getFont(doc, language, false);
    doc.fontSize(7)
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
