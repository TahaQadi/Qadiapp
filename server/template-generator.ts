
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface TemplateVariable {
  key: string;
  value: string;
}

interface TemplateSection {
  type: 'header' | 'body' | 'table' | 'footer' | 'signature' | 'image' | 'divider' | 'spacer' | 'terms';
  content: any;
  condition?: string;
  order?: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  language: 'en' | 'ar' | 'both';
  sections: TemplateSection[];
  variables: string[];
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontSize: number;
    fontFamily?: string;
    headerHeight?: number;
    footerHeight?: number;
    margins?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
}

export class TemplateGenerator {
  private static readonly LOGO_PATH = path.join(process.cwd(), 'client', 'public', 'logo.png');
  
  static async generateFromTemplate(
    template: DocumentTemplate,
    variables: TemplateVariable[]
  ): Promise<Buffer> {
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
        
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Replace variables in template
        const processedTemplate = this.replaceVariables(template, variables);

        // Render sections
        for (const section of processedTemplate.sections) {
          this.renderSection(doc, section, processedTemplate.styles, processedTemplate.language);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static replaceVariables(
    template: DocumentTemplate,
    variables: TemplateVariable[]
  ): DocumentTemplate {
    const variableMap = new Map(variables.map(v => [v.key, v.value]));
    
    const processedSections = template.sections.map(section => {
      const content = { ...section.content };
      
      // Recursively replace variables in the content object
      const replaceInObject = (obj: any): any => {
        if (typeof obj === 'string') {
          let result = obj;
          variableMap.forEach((value, key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
          });
          return result;
        } else if (Array.isArray(obj)) {
          return obj.map(item => replaceInObject(item));
        } else if (obj && typeof obj === 'object') {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            result[key] = replaceInObject(value);
          }
          return result;
        }
        return obj;
      };
      
      return {
        ...section,
        content: replaceInObject(content)
      };
    });

    return { ...template, sections: processedSections };
  }

  private static renderSection(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar' | 'both'
  ) {
    switch (section.type) {
      case 'header':
        this.renderHeader(doc, section.content, styles, language);
        break;
      case 'body':
        this.renderBody(doc, section.content, styles, language);
        break;
      case 'table':
        this.renderTable(doc, section.content, styles, language);
        break;
      case 'footer':
        this.renderFooter(doc, section.content, styles, language);
        break;
      case 'signature':
        this.renderSignature(doc, section.content, styles, language);
        break;
      case 'image':
        this.renderImage(doc, section.content);
        break;
      case 'divider':
        this.renderDivider(doc, styles);
        break;
      case 'spacer':
        this.renderSpacer(doc, section.content);
        break;
      case 'terms':
        this.renderTerms(doc, section.content, styles, language);
        break;
    }
  }

  private static renderImage(
    doc: PDFKit.PDFDocument,
    content: { url: string; width?: number; height?: number; align?: string }
  ) {
    const width = content.width || 200;
    const height = content.height || 150;
    const x = content.align === 'center' ? (595 - width) / 2 : 50;
    
    if (content.url) {
      doc.image(content.url, x, doc.y, { width, height });
      doc.moveDown(height / 20);
    }
  }

  private static renderDivider(
    doc: PDFKit.PDFDocument,
    styles: DocumentTemplate['styles']
  ) {
    doc.moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(styles.accentColor)
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.5);
  }

  private static renderSpacer(
    doc: PDFKit.PDFDocument,
    content: { height: number }
  ) {
    doc.moveDown(content.height / 20 || 1);
  }

  private static renderTerms(
    doc: PDFKit.PDFDocument,
    content: { terms?: string[]; title?: string; titleAr?: string; items?: string[]; itemsAr?: string[] },
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar' | 'both'
  ) {
    if (language === 'both') {
      // Render both languages
      if (content.title) {
        doc.fontSize(12)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(content.title, 50, doc.y);
        if (content.titleAr) {
          doc.fontSize(11)
            .text(content.titleAr, 50, doc.y);
        }
        doc.moveDown(0.5);
      }

      const enItems = content.items || content.terms || [];
      const arItems = content.itemsAr || [];
      const maxLength = Math.max(enItems.length, arItems.length);

      doc.fontSize(styles.fontSize)
        .fillColor('#444444')
        .font('Helvetica');

      for (let i = 0; i < maxLength; i++) {
        if (enItems[i]) {
          doc.text(enItems[i], 60, doc.y, { width: 485, lineGap: 2 });
        }
        if (arItems[i]) {
          doc.fontSize(styles.fontSize - 1)
            .fillColor('#666666')
            .text(arItems[i], 60, doc.y, { width: 485, lineGap: 2 });
        }
        doc.moveDown(0.3);
      }
    } else {
      // Single language
      const title = language === 'ar' ? content.titleAr : content.title;
      const items = (language === 'ar' ? content.itemsAr : content.items) || content.terms || [];

      if (title) {
        doc.fontSize(12)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text(title, 50, doc.y);
        doc.moveDown(0.5);
      }

      doc.fontSize(styles.fontSize)
        .fillColor('#444444')
        .font('Helvetica');

      items.forEach((term) => {
        doc.text(term, 60, doc.y, { width: 485, lineGap: 3 });
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1);
  }

  private static renderHeader(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar' | 'both'
  ) {
    doc.rect(0, 0, 595, 100)
      .fillAndStroke(styles.primaryColor, styles.primaryColor);
    
    doc.rect(0, 100, 595, 3)
      .fillAndStroke(styles.accentColor, styles.accentColor);

    if (content.logo && fs.existsSync(this.LOGO_PATH)) {
      doc.image(this.LOGO_PATH, 50, 25, { width: 60, height: 60 });
    }

    doc.fontSize(18)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(content.companyName || '', 130, 35);

    let yPos = 55;
    if (language === 'both' && content.companyNameAr) {
      doc.fontSize(14).text(content.companyNameAr, 130, yPos);
      yPos += 18;
    } else if (language === 'ar' && content.companyNameAr) {
      doc.fontSize(18).text(content.companyNameAr, 130, 35);
      yPos = 60;
    }

    doc.fontSize(8)
      .fillColor('#e0e0e0')
      .font('Helvetica');
    
    if (language === 'both') {
      doc.text(`${content.address || ''} | ${content.addressAr || ''}`, 130, yPos, { width: 400 });
      doc.text(`${content.contact || content.phone || ''} | ${content.email || ''}`, 130, yPos + 12, { width: 400 });
    } else if (language === 'ar') {
      doc.text(content.addressAr || content.address || '', 130, yPos);
      doc.text(content.contact || content.phone || '', 130, yPos + 12);
    } else {
      doc.text(content.address || '', 130, yPos);
      doc.text(content.contact || content.phone || '', 130, yPos + 12);
    }
  }

  private static renderBody(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language?: 'en' | 'ar' | 'both'
  ) {
    const title = language === 'ar' ? (content.titleAr || content.title) : content.title;
    
    if (title) {
      doc.fontSize(14)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(title, 50, doc.y);
      
      if (language === 'both' && content.titleAr && content.title !== content.titleAr) {
        doc.fontSize(12)
          .text(content.titleAr, 50, doc.y);
      }
      doc.moveDown(0.5);
    }

    if (content.text) {
      doc.fontSize(styles.fontSize)
        .fillColor('#000000')
        .font('Helvetica')
        .text(content.text, 50, doc.y, { align: content.align || 'left', lineGap: 5 });
    }

    // Render all content fields, including Arabic ones for bilingual mode
    Object.keys(content).forEach(key => {
      const skipKeys = ['title', 'text', 'align', 'titleAr', 'sectionTitle', 'sectionTitleAr'];
      const isArabicField = key.endsWith('Ar');
      
      // Skip Arabic fields in English mode, skip English fields' Arabic duplicates, skip meta fields
      if (skipKeys.includes(key)) return;
      if (language === 'en' && isArabicField) return;
      if (language === 'ar' && !isArabicField && content[key + 'Ar']) return;
      
      const value = content[key];
      if (value && typeof value === 'string') {
        doc.fontSize(isArabicField ? styles.fontSize - 1 : styles.fontSize)
          .fillColor(isArabicField ? '#666666' : '#333333')
          .font('Helvetica')
          .text(value, 50, doc.y, { lineGap: 2 });
        doc.moveDown(0.3);
      }
    });
    
    doc.moveDown(1);
  }

  private static renderTable(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language?: 'en' | 'ar' | 'both'
  ) {
    const tableTop = doc.y;
    let headers = content.headers || [];
    let rows = content.rows || content.dataSource || [];
    
    // Ensure rows is an array
    if (!Array.isArray(rows)) {
      rows = [];
    }
    
    // For bilingual mode, combine headers
    if (language === 'both' && content.headersAr) {
      headers = content.headers.map((h: string, i: number) => `${h} / ${content.headersAr[i] || h}`);
    } else if (language === 'ar') {
      headers = content.headersAr || content.headers;
    }
    
    if (headers.length === 0 || rows.length === 0) {
      doc.moveDown(1);
      return;
    }
    
    const colWidths = content.columnWidths || headers.map(() => 495 / headers.length);

    // Header
    doc.rect(50, tableTop, 495, 25)
      .fillAndStroke(styles.primaryColor, styles.primaryColor);
    
    let xPos = 60;
    headers.forEach((header: string, i: number) => {
      doc.fontSize(10)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text(header, xPos, tableTop + 8, { width: colWidths[i] - 10 });
      xPos += colWidths[i];
    });

    // Rows
    let yPosition = tableTop + 25;
    doc.fillColor('#000000').font('Helvetica');
    
    rows.forEach((row: any, index: number) => {
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 140;
      }

      if (content.alternateRowColors && index % 2 === 0) {
        doc.rect(50, yPosition, 495, 22).fillAndStroke('#f8f9fa', '#f8f9fa');
      }

      xPos = 60;
      let rowData: any[];
      
      if (Array.isArray(row)) {
        rowData = row;
      } else {
        // For object rows, combine bilingual field pairs when language='both'
        if (language === 'both') {
          const keys = Object.keys(row).filter(k => !k.endsWith('Ar'));
          rowData = keys.map(key => {
            const enValue = row[key];
            const arValue = row[key + 'Ar'];
            // Handle both languages with proper fallbacks
            if (enValue && arValue) {
              return `${enValue} / ${arValue}`;
            } else if (arValue) {
              return arValue;
            }
            return enValue || '';
          });
        } else if (language === 'ar') {
          // For Arabic mode, prefer Arabic fields
          rowData = Object.keys(row).filter(k => !k.endsWith('Ar')).map(key => {
            return row[key + 'Ar'] || row[key];
          });
        } else {
          // For English mode, use English fields only
          rowData = Object.values(row).filter((_, i) => !Object.keys(row)[i].endsWith('Ar'));
        }
      }
      
      rowData.forEach((cell: any, i: number) => {
        doc.fontSize(9)
          .text(String(cell || ''), xPos, yPosition + 6, { width: colWidths[i] - 10 });
        xPos += colWidths[i];
      });

      yPosition += 22;
    });

    if (content.showBorders) {
      doc.moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .strokeColor(styles.primaryColor)
        .lineWidth(2)
        .stroke();
    }
    
    doc.y = yPosition + 15;
  }

  private static renderFooter(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar' | 'both'
  ) {
    const footerY = doc.page.height - 60;
    
    doc.rect(0, footerY, 595, 2)
      .fillAndStroke(styles.accentColor, styles.accentColor);

    doc.rect(0, footerY + 2, 595, 60)
      .fillAndStroke(styles.primaryColor, styles.primaryColor);

    let text = '';
    const enText = content.text || '';
    const arText = content.textAr || '';
    
    if (language === 'both') {
      if (enText && arText) {
        text = `${enText} | ${arText}`;
      } else {
        text = enText || arText;
      }
    } else if (language === 'ar') {
      text = arText || enText;
    } else {
      text = enText;
    }
    
    doc.fontSize(8)
      .fillColor('#ffffff')
      .font('Helvetica')
      .text(text, 50, footerY + 15, { align: 'center', width: 495 });

    if (content.contact || content.contactAr) {
      const enContact = content.contact || '';
      const arContact = content.contactAr || '';
      let contactText = '';
      
      if (language === 'both') {
        if (enContact && arContact) {
          contactText = `${enContact} | ${arContact}`;
        } else {
          contactText = enContact || arContact;
        }
      } else if (language === 'ar') {
        contactText = arContact || enContact;
      } else {
        contactText = enContact;
      }
      
      doc.fontSize(7)
        .text(contactText, 50, footerY + 32, { align: 'center', width: 495 });
    }

    if (content.pageNumbers) {
      const pageRange = doc.bufferedPageRange();
      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7)
          .fillColor('#e0e0e0')
          .text(`Page ${i + 1} of ${pageRange.count}`, 50, footerY + 45, { align: 'center', width: 495 });
      }
    }
  }

  private static renderSignature(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar' | 'both'
  ) {
    const signatureY = Math.max(doc.y, 650);
    
    // Party 1 (Supplier/Left side)
    if (content.party1Label || content.party1Name) {
      doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('_____________________', 80, signatureY);
      
      const enLabel1 = content.party1Label || content.label || 'Signature';
      const arLabel1 = content.party1LabelAr || '';
      let label1 = enLabel1;
      
      if (language === 'both') {
        if (enLabel1 && arLabel1) {
          label1 = `${enLabel1} | ${arLabel1}`;
        } else {
          label1 = enLabel1 || arLabel1;
        }
      } else if (language === 'ar') {
        label1 = arLabel1 || enLabel1;
      }
      
      doc.fontSize(9)
        .text(label1, 80, signatureY + 15, { align: 'center', width: 120 });
      
      if (content.party1Name || content.party1NameAr) {
        const enName1 = content.party1Name || '';
        const arName1 = content.party1NameAr || '';
        let name1 = enName1;
        
        if (language === 'both') {
          if (enName1 && arName1) {
            name1 = `${enName1}\n${arName1}`;
          } else {
            name1 = enName1 || arName1;
          }
        } else if (language === 'ar') {
          name1 = arName1 || enName1;
        }
        
        doc.fontSize(8)
          .fillColor('#666666')
          .font('Helvetica')
          .text(name1, 80, signatureY + 32, { align: 'center', width: 120 });
      }
    }

    // Party 2 (Client/Right side) 
    if (content.party2Label || content.party2Name) {
      doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('_____________________', 335, signatureY);
      
      const enLabel2 = content.party2Label || 'Signature';
      const arLabel2 = content.party2LabelAr || '';
      let label2 = enLabel2;
      
      if (language === 'both') {
        if (enLabel2 && arLabel2) {
          label2 = `${enLabel2} | ${arLabel2}`;
        } else {
          label2 = enLabel2 || arLabel2;
        }
      } else if (language === 'ar') {
        label2 = arLabel2 || enLabel2;
      }
      
      doc.fontSize(9)
        .text(label2, 335, signatureY + 15, { align: 'center', width: 120 });
      
      if (content.party2Name || content.party2NameAr) {
        const enName2 = content.party2Name || '';
        const arName2 = content.party2NameAr || '';
        let name2 = enName2;
        
        if (language === 'both') {
          if (enName2 && arName2) {
            name2 = `${enName2}\n${arName2}`;
          } else {
            name2 = enName2 || arName2;
          }
        } else if (language === 'ar') {
          name2 = arName2 || enName2;
        }
        
        doc.fontSize(8)
          .fillColor('#666666')
          .font('Helvetica')
          .text(name2, 335, signatureY + 32, { align: 'center', width: 120 });
      }
    }

    // Witness (if provided)
    if (content.witnessLabel || content.witnessLabelAr) {
      const enWitnessLabel = content.witnessLabel || '';
      const arWitnessLabel = content.witnessLabelAr || '';
      let witnessLabel = enWitnessLabel;
      
      if (language === 'both') {
        if (enWitnessLabel && arWitnessLabel) {
          witnessLabel = `${enWitnessLabel} | ${arWitnessLabel}`;
        } else {
          witnessLabel = enWitnessLabel || arWitnessLabel;
        }
      } else if (language === 'ar') {
        witnessLabel = arWitnessLabel || enWitnessLabel;
      }
      
      doc.fontSize(10)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('_____________________', 210, signatureY + 60);
      
      doc.fontSize(9)
        .text(witnessLabel, 210, signatureY + 75, { align: 'center', width: 120 });
    }

    doc.moveDown(6);
  }
}
