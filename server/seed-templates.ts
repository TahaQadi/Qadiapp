import { TemplateStorage } from './template-storage';
import fs from 'fs';
import path from 'path';

interface TemplateData {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category: string;
  language: string;
  sections: any[];
  variables: string[];
  styles: any;
  isActive: boolean;
  isDefault?: boolean;
}

const DEFAULT_TEMPLATES: TemplateData[] = [
  {
    nameEn: "Standard Price Offer Template",
    nameAr: "قالب عرض السعر القياسي",
    descriptionEn: "Professional price offer template for LTA products with bilingual support",
    descriptionAr: "قالب عرض سعر احترافي لمنتجات الاتفاقية طويلة الأجل مع دعم ثنائي اللغة",
    category: "price_offer",
    language: "both",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyName}}",
          companyNameAr: "{{companyNameAr}}",
          address: "{{companyAddress}}",
          addressAr: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "Price Offer",
          titleAr: "عرض السعر",
          date: "{{date}}",
          offerNumber: "{{offerNumber}}",
          clientName: "{{clientName}}",
          clientNameAr: "{{clientNameAr}}",
          ltaName: "{{ltaName}}",
          ltaNameAr: "{{ltaNameAr}}",
          validUntil: "{{validUntil}}"
        },
        order: 1
      },
      {
        type: "table",
        content: {
          headers: ["#", "SKU", "Product Name", "Unit", "Qty", "Unit Price", "Total"],
          headersAr: ["#", "الرمز", "اسم المنتج", "الوحدة", "الكمية", "سعر الوحدة", "المجموع"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 2
      },
      {
        type: "spacer",
        content: {
          height: 20
        },
        order: 3
      },
      {
        type: "body",
        content: {
          subtotal: "{{subtotal}}",
          tax: "{{tax}}",
          taxRate: "{{taxRate}}",
          discount: "{{discount}}",
          total: "{{total}}",
          currency: "{{currency}}"
        },
        order: 4
      },
      {
        type: "terms",
        content: {
          title: "Terms & Conditions",
          titleAr: "الشروط والأحكام",
          items: [
            "This offer is valid until {{validUntil}}",
            "Prices are based on the LTA contract: {{ltaName}}",
            "Payment terms: {{paymentTerms}}",
            "Delivery time: {{deliveryTime}}",
            "All prices are in {{currency}}"
          ],
          itemsAr: [
            "هذا العرض صالح حتى {{validUntil}}",
            "الأسعار مبنية على الاتفاقية: {{ltaNameAr}}",
            "شروط الدفع: {{paymentTermsAr}}",
            "وقت التسليم: {{deliveryTimeAr}}",
            "جميع الأسعار بـ {{currency}}"
          ]
        },
        order: 5
      },
      {
        type: "footer",
        content: {
          text: "Thank you for your business | شكراً لتعاملكم معنا",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyName", "companyNameAr", "companyAddress", "companyAddressAr",
      "companyPhone", "companyEmail", "date", "offerNumber", "clientName",
      "clientNameAr", "ltaName", "ltaNameAr", "validUntil", "products",
      "subtotal", "tax", "taxRate", "discount", "total", "currency",
      "paymentTerms", "paymentTermsAr", "deliveryTime", "deliveryTimeAr"
    ],
    styles: {
      primaryColor: "#2563eb",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: {
        top: 140,
        bottom: 90,
        left: 50,
        right: 50
      }
    },
    isActive: true,
    isDefault: true
  },
  {
    nameEn: "Order Confirmation Template",
    nameAr: "قالب تأكيد الطلب",
    descriptionEn: "Professional order confirmation template with delivery details",
    descriptionAr: "قالب تأكيد طلب احترافي مع تفاصيل التسليم",
    category: "order",
    language: "both",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyName}}",
          companyNameAr: "{{companyNameAr}}",
          address: "{{companyAddress}}",
          addressAr: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "Order Confirmation",
          titleAr: "تأكيد الطلب",
          orderNumber: "{{orderNumber}}",
          date: "{{date}}",
          clientName: "{{clientName}}",
          clientNameAr: "{{clientNameAr}}",
          department: "{{department}}",
          location: "{{location}}",
          locationAr: "{{locationAr}}"
        },
        order: 1
      },
      {
        type: "table",
        content: {
          headers: ["#", "SKU", "Product Name", "Unit", "Qty", "Unit Price", "Total"],
          headersAr: ["#", "الرمز", "اسم المنتج", "الوحدة", "الكمية", "سعر الوحدة", "المجموع"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 2
      },
      {
        type: "spacer",
        content: {
          height: 20
        },
        order: 3
      },
      {
        type: "body",
        content: {
          subtotal: "{{subtotal}}",
          tax: "{{tax}}",
          total: "{{total}}",
          currency: "{{currency}}"
        },
        order: 4
      },
      {
        type: "terms",
        content: {
          title: "Delivery Information",
          titleAr: "معلومات التسليم",
          items: [
            "Delivery Address: {{deliveryAddress}}",
            "Contact Person: {{contactPerson}}",
            "Expected Delivery: {{expectedDelivery}}",
            "Special Instructions: {{specialInstructions}}"
          ],
          itemsAr: [
            "عنوان التسليم: {{deliveryAddressAr}}",
            "الشخص المسؤول: {{contactPersonAr}}",
            "التسليم المتوقع: {{expectedDeliveryAr}}",
            "تعليمات خاصة: {{specialInstructionsAr}}"
          ]
        },
        order: 5
      },
      {
        type: "footer",
        content: {
          text: "Thank you for your order | شكراً لطلبكم",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyName", "companyNameAr", "companyAddress", "companyAddressAr",
      "companyPhone", "companyEmail", "orderNumber", "date", "clientName",
      "clientNameAr", "department", "location", "locationAr", "products",
      "subtotal", "tax", "total", "currency", "deliveryAddress", "deliveryAddressAr",
      "contactPerson", "contactPersonAr", "expectedDelivery", "expectedDeliveryAr",
      "specialInstructions", "specialInstructionsAr"
    ],
    styles: {
      primaryColor: "#059669",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: {
        top: 140,
        bottom: 90,
        left: 50,
        right: 50
      }
    },
    isActive: true,
    isDefault: true
  },
  {
    nameEn: "Invoice Template",
    nameAr: "قالب الفاتورة",
    descriptionEn: "Professional invoice template with payment terms and bank details",
    descriptionAr: "قالب فاتورة احترافي مع شروط الدفع وتفاصيل البنك",
    category: "invoice",
    language: "both",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyName}}",
          companyNameAr: "{{companyNameAr}}",
          address: "{{companyAddress}}",
          addressAr: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          taxNumber: "{{taxNumber}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "Invoice",
          titleAr: "فاتورة",
          invoiceNumber: "{{invoiceNumber}}",
          date: "{{date}}",
          dueDate: "{{dueDate}}",
          clientName: "{{clientName}}",
          clientNameAr: "{{clientNameAr}}",
          clientAddress: "{{clientAddress}}",
          clientAddressAr: "{{clientAddressAr}}"
        },
        order: 1
      },
      {
        type: "table",
        content: {
          headers: ["#", "Description", "Qty", "Unit Price", "Total"],
          headersAr: ["#", "الوصف", "الكمية", "سعر الوحدة", "المجموع"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 2
      },
      {
        type: "spacer",
        content: {
          height: 20
        },
        order: 3
      },
      {
        type: "body",
        content: {
          subtotal: "{{subtotal}}",
          tax: "{{tax}}",
          taxRate: "{{taxRate}}",
          total: "{{total}}",
          currency: "{{currency}}"
        },
        order: 4
      },
      {
        type: "terms",
        content: {
          title: "Payment Information",
          titleAr: "معلومات الدفع",
          items: [
            "Payment Due: {{dueDate}}",
            "Bank: {{bankName}}",
            "Account: {{accountNumber}}",
            "IBAN: {{iban}}",
            "Payment Terms: {{paymentTerms}}"
          ],
          itemsAr: [
            "استحقاق الدفع: {{dueDateAr}}",
            "البنك: {{bankNameAr}}",
            "الحساب: {{accountNumber}}",
            "الأيبان: {{iban}}",
            "شروط الدفع: {{paymentTermsAr}}"
          ]
        },
        order: 5
      },
      {
        type: "footer",
        content: {
          text: "Thank you for your business | شكراً لتعاملكم معنا",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyName", "companyNameAr", "companyAddress", "companyAddressAr",
      "companyPhone", "companyEmail", "taxNumber", "invoiceNumber", "date",
      "dueDate", "clientName", "clientNameAr", "clientAddress", "clientAddressAr",
      "products", "subtotal", "tax", "taxRate", "total", "currency",
      "bankName", "bankNameAr", "accountNumber", "iban", "paymentTerms", "paymentTermsAr"
    ],
    styles: {
      primaryColor: "#dc2626",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: {
        top: 140,
        bottom: 90,
        left: 50,
        right: 50
      }
    },
    isActive: true,
    isDefault: true
  },
  {
    nameEn: "LTA Contract Template",
    nameAr: "قالب عقد الاتفاقية طويلة الأجل",
    descriptionEn: "Formal LTA contract template with legal terms and product schedule",
    descriptionAr: "قالب عقد اتفاقية طويلة الأجل رسمي مع الشروط القانونية وجدول المنتجات",
    category: "contract",
    language: "both",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyName}}",
          companyNameAr: "{{companyNameAr}}",
          address: "{{companyAddress}}",
          addressAr: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "Long-Term Agreement Contract",
          titleAr: "عقد اتفاقية طويلة الأجل",
          contractNumber: "{{contractNumber}}",
          date: "{{date}}",
          validFrom: "{{validFrom}}",
          validTo: "{{validTo}}",
          party1Name: "{{party1Name}}",
          party1NameAr: "{{party1NameAr}}",
          party2Name: "{{party2Name}}",
          party2NameAr: "{{party2NameAr}}"
        },
        order: 1
      },
      {
        type: "body",
        content: {
          sectionTitle: "Contract Terms",
          sectionTitleAr: "شروط العقد",
          text: "This Long-Term Agreement (LTA) is entered into between {{party1Name}} and {{party2Name}} for the supply of products as specified in the attached schedule.",
          textAr: "تم إبرام هذه الاتفاقية طويلة الأجل بين {{party1NameAr}} و {{party2NameAr}} لتوريد المنتجات كما هو محدد في الجدول المرفق."
        },
        order: 2
      },
      {
        type: "table",
        content: {
          headers: ["Product Code", "Product Name", "Unit", "Contract Price", "Currency"],
          headersAr: ["رمز المنتج", "اسم المنتج", "الوحدة", "سعر العقد", "العملة"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 3
      },
      {
        type: "terms",
        content: {
          title: "Terms and Conditions",
          titleAr: "الشروط والأحكام",
          items: [
            "Contract Duration: {{validFrom}} to {{validTo}}",
            "Payment Terms: {{paymentTerms}}",
            "Delivery Terms: {{deliveryTerms}}",
            "Quality Standards: {{qualityStandards}}",
            "Force Majeure: {{forceMajeure}}",
            "Dispute Resolution: {{disputeResolution}}"
          ],
          itemsAr: [
            "مدة العقد: من {{validFromAr}} إلى {{validToAr}}",
            "شروط الدفع: {{paymentTermsAr}}",
            "شروط التسليم: {{deliveryTermsAr}}",
            "معايير الجودة: {{qualityStandardsAr}}",
            "القوة القاهرة: {{forceMajeureAr}}",
            "حل النزاعات: {{disputeResolutionAr}}"
          ]
        },
        order: 4
      },
      {
        type: "signature",
        content: {
          party1Label: "Supplier Signature",
          party1LabelAr: "توقيع المورد",
          party1Name: "{{party1Signatory}}",
          party1NameAr: "{{party1SignatoryAr}}",
          party2Label: "Client Signature",
          party2LabelAr: "توقيع العميل",
          party2Name: "{{party2Signatory}}",
          party2NameAr: "{{party2SignatoryAr}}"
        },
        order: 5
      },
      {
        type: "footer",
        content: {
          text: "This contract is legally binding | هذا العقد ملزم قانونياً",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyName", "companyNameAr", "companyAddress", "companyAddressAr",
      "companyPhone", "companyEmail", "contractNumber", "date", "validFrom",
      "validFromAr", "validTo", "validToAr", "party1Name", "party1NameAr",
      "party2Name", "party2NameAr", "products", "paymentTerms", "paymentTermsAr",
      "deliveryTerms", "deliveryTermsAr", "qualityStandards", "qualityStandardsAr",
      "forceMajeure", "forceMajeureAr", "disputeResolution", "disputeResolutionAr",
      "party1Signatory", "party1SignatoryAr", "party2Signatory", "party2SignatoryAr"
    ],
    styles: {
      primaryColor: "#7c3aed",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: {
        top: 140,
        bottom: 90,
        left: 50,
        right: 50
      }
    },
    isActive: true,
    isDefault: true
  }
];

export class TemplateSeeder {
  static async seedDefaultTemplates(): Promise<void> {
    console.log('🌱 Starting template seeding...');
    
    try {
      // Check if templates already exist
      const existingTemplates = await TemplateStorage.getTemplates();
      
      if (existingTemplates.length > 0) {
        console.log(`✅ Found ${existingTemplates.length} existing templates. Skipping seeding.`);
        return;
      }

      console.log('📝 Creating default templates...');
      
      for (const templateData of DEFAULT_TEMPLATES) {
        try {
          const template = await TemplateStorage.createTemplate(templateData);
          console.log(`✅ Created template: ${template.nameEn} (${template.category})`);
        } catch (error) {
          console.error(`❌ Failed to create template ${templateData.nameEn}:`, error);
        }
      }
      
      console.log('✨ Template seeding completed successfully!');
    } catch (error) {
      console.error('❌ Template seeding failed:', error);
      throw error;
    }
  }

  static async ensureDefaultTemplates(): Promise<void> {
    console.log('🔍 Ensuring default templates exist...');
    
    try {
      const existingTemplates = await TemplateStorage.getTemplates();
      const categories = ['price_offer', 'order', 'invoice', 'contract'];
      
      for (const category of categories) {
        const categoryTemplates = existingTemplates.filter(t => t.category === category);
        
        if (categoryTemplates.length === 0) {
          console.log(`⚠️  No templates found for category: ${category}`);
          const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.category === category);
          
          if (defaultTemplate) {
            try {
              await TemplateStorage.createTemplate(defaultTemplate);
              console.log(`✅ Created default template for category: ${category}`);
            } catch (error) {
              console.error(`❌ Failed to create default template for ${category}:`, error);
            }
          }
        } else {
          console.log(`✅ Found ${categoryTemplates.length} template(s) for category: ${category}`);
        }
      }
      
      console.log('✨ Default templates verification completed!');
    } catch (error) {
      console.error('❌ Default templates verification failed:', error);
      throw error;
    }
  }

  static async loadTemplatesFromFiles(): Promise<void> {
    const templatesDir = path.join(process.cwd(), 'templates', 'production');
    
    if (!fs.existsSync(templatesDir)) {
      console.log('📁 No production templates directory found. Skipping file loading.');
      return;
    }

    console.log('📁 Loading templates from production files...');
    
    try {
      const files = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
      
      for (const file of files) {
        const filePath = path.join(templatesDir, file);
        const templateData: TemplateData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        try {
          // Check if template already exists
          const existingTemplates = await TemplateStorage.getTemplates(templateData.category);
          const exists = existingTemplates.some(t => 
            t.nameEn === templateData.nameEn || t.nameAr === templateData.nameAr
          );
          
          if (!exists) {
            await TemplateStorage.createTemplate(templateData);
            console.log(`✅ Loaded template from file: ${templateData.nameEn}`);
          } else {
            console.log(`⏭️  Template already exists: ${templateData.nameEn}`);
          }
        } catch (error) {
          console.error(`❌ Failed to load template from ${file}:`, error);
        }
      }
      
      console.log('✨ File template loading completed!');
    } catch (error) {
      console.error('❌ File template loading failed:', error);
      throw error;
    }
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  TemplateSeeder.seedDefaultTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Template seeding failed:', error);
      process.exit(1);
    });
}