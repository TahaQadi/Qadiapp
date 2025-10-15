
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface TemplateVariable {
  key: string;
  value: string;
}

interface TemplateSection {
  type: 'header' | 'body' | 'table' | 'footer' | 'signature';
  content: any;
}

interface DocumentTemplate {
  id: string;
  name: string;
  language: 'en' | 'ar';
  sections: TemplateSection[];
  variables: string[];
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontSize: number;
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
      let content = JSON.stringify(section.content);
      
      variableMap.forEach((value, key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      });
      
      return {
        ...section,
        content: JSON.parse(content)
      };
    });

    return { ...template, sections: processedSections };
  }

  private static renderSection(
    doc: PDFKit.PDFDocument,
    section: TemplateSection,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar'
  ) {
    switch (section.type) {
      case 'header':
        this.renderHeader(doc, section.content, styles, language);
        break;
      case 'body':
        this.renderBody(doc, section.content, styles);
        break;
      case 'table':
        this.renderTable(doc, section.content, styles);
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
    content: { terms: string[]; title?: string },
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar'
  ) {
    if (content.title) {
      doc.fontSize(12)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(content.title, 50, doc.y);
      doc.moveDown(0.5);
    }

    doc.fontSize(styles.fontSize)
      .fillColor('#444444')
      .font('Helvetica');

    content.terms.forEach((term, index) => {
      doc.text(`${index + 1}. ${term}`, 60, doc.y, { 
        width: 485,
        lineGap: 3 
      });
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
  }

  private static renderHeader(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar'
  ) {
    doc.rect(0, 0, 595, 100)
      .fillAndStroke(styles.primaryColor, styles.primaryColor);
    
    doc.rect(0, 100, 595, 3)
      .fillAndStroke(styles.accentColor, styles.accentColor);

    if (fs.existsSync(this.LOGO_PATH)) {
      doc.image(this.LOGO_PATH, 50, 25, { width: 60, height: 60 });
    }

    doc.fontSize(18)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(content.companyName, 130, 35);

    doc.fontSize(8)
      .fillColor('#e0e0e0')
      .font('Helvetica')
      .text(content.address, 130, 60)
      .text(content.contact, 130, 75);
  }

  private static renderBody(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles']
  ) {
    doc.fontSize(styles.fontSize)
      .fillColor('#000000')
      .font('Helvetica')
      .text(content.text, 50, doc.y, { align: content.align || 'left', lineGap: 5 });
    
    doc.moveDown(1);
  }

  private static renderTable(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles']
  ) {
    const tableTop = doc.y;
    const headers = content.headers;
    const rows = content.rows;
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
    
    rows.forEach((row: string[], index: number) => {
      if (yPosition > 680) {
        doc.addPage();
        yPosition = 140;
      }

      if (index % 2 === 0) {
        doc.rect(50, yPosition, 495, 22).fillAndStroke('#f8f9fa', '#f8f9fa');
      }

      xPos = 60;
      row.forEach((cell: string, i: number) => {
        doc.fontSize(9)
          .text(cell, xPos, yPosition + 6, { width: colWidths[i] - 10 });
        xPos += colWidths[i];
      });

      yPosition += 22;
    });

    doc.moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .strokeColor(styles.primaryColor)
      .lineWidth(2)
      .stroke();
    
    doc.y = yPosition + 15;
  }

  private static renderFooter(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar'
  ) {
    const footerY = doc.page.height - 60;
    
    doc.rect(0, footerY, 595, 2)
      .fillAndStroke(styles.accentColor, styles.accentColor);

    doc.rect(0, footerY + 2, 595, 60)
      .fillAndStroke(styles.primaryColor, styles.primaryColor);

    doc.fontSize(8)
      .fillColor('#ffffff')
      .font('Helvetica')
      .text(content.text, 50, footerY + 15, { align: 'center', width: 495 });
  }

  private static renderSignature(
    doc: PDFKit.PDFDocument,
    content: any,
    styles: DocumentTemplate['styles'],
    language: 'en' | 'ar'
  ) {
    const signatureY = Math.max(doc.y, 650);
    
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('_____________________', 80, signatureY)
      .text(content.label, 80, signatureY + 15, { align: 'center', width: 120 });
  }
}
