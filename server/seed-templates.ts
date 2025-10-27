import { TemplateStorage } from './template-storage';

interface TemplateData {
  name: string;
  description?: string;
  category: string;
  language: 'ar'; // Arabic-only
  sections: any[];
  variables: string[];
  styles: any;
  isActive: boolean;
  isDefault?: boolean;
}

const DEFAULT_TEMPLATES: TemplateData[] = [
  {
    name: "قالب عرض السعر القياسي",
    description: "قالب عرض سعر احترافي لمنتجات الاتفاقية طويلة الأجل",
    category: "price_offer",
    language: "ar",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyNameAr}}",
          address: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "عرض السعر",
          date: "{{date}}",
          offerNumber: "{{offerNumber}}",
          clientName: "{{clientNameAr}}",
          ltaName: "{{ltaNameAr}}",
          validUntil: "{{validUntil}}"
        },
        order: 1
      },
      {
        type: "table",
        content: {
          headers: ["#", "الرمز", "اسم المنتج", "الوحدة", "الكمية", "سعر الوحدة", "المجموع"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 2
      },
      {
        type: "spacer",
        content: { height: 20 },
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
          title: "الشروط والأحكام",
          items: [
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
          text: "شكراً لتعاملكم معنا",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyNameAr", "companyAddressAr", "companyPhone", "companyEmail",
      "date", "offerNumber", "clientNameAr", "ltaNameAr", "validUntil",
      "products", "subtotal", "tax", "taxRate", "discount", "total",
      "currency", "paymentTermsAr", "deliveryTimeAr"
    ],
    styles: {
      primaryColor: "#2563eb",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: { top: 140, bottom: 90, left: 50, right: 50 }
    },
    isActive: true,
    isDefault: true
  },
  {
    name: "قالب تأكيد الطلب",
    description: "قالب تأكيد طلب احترافي مع تفاصيل التسليم",
    category: "order",
    language: "ar",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyNameAr}}",
          address: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "تأكيد الطلب",
          orderNumber: "{{orderNumber}}",
          date: "{{date}}",
          clientName: "{{clientNameAr}}",
          department: "{{department}}",
          location: "{{locationAr}}"
        },
        order: 1
      },
      {
        type: "table",
        content: {
          headers: ["#", "الرمز", "اسم المنتج", "الوحدة", "الكمية", "سعر الوحدة", "المجموع"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 2
      },
      {
        type: "spacer",
        content: { height: 20 },
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
          title: "معلومات التسليم",
          items: [
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
          text: "شكراً لطلبكم",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyNameAr", "companyAddressAr", "companyPhone", "companyEmail",
      "orderNumber", "date", "clientNameAr", "department", "locationAr",
      "products", "subtotal", "tax", "total", "currency",
      "deliveryAddressAr", "contactPersonAr", "expectedDeliveryAr",
      "specialInstructionsAr"
    ],
    styles: {
      primaryColor: "#059669",
      secondaryColor: "#64748b",
      accentColor: "#10b981",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: { top: 140, bottom: 90, left: 50, right: 50 }
    },
    isActive: true,
    isDefault: true
  },
  {
    name: "قالب الفاتورة",
    description: "قالب فاتورة احترافي مع شروط الدفع وتفاصيل البنك",
    category: "invoice",
    language: "ar",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyNameAr}}",
          address: "{{companyAddressAr}}",
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
          title: "فاتورة",
          invoiceNumber: "{{invoiceNumber}}",
          date: "{{date}}",
          dueDate: "{{dueDate}}",
          clientName: "{{clientNameAr}}",
          clientAddress: "{{clientAddressAr}}"
        },
        order: 1
      },
      {
        type: "table",
        content: {
          headers: ["#", "الوصف", "الكمية", "سعر الوحدة", "المجموع"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 2
      },
      {
        type: "spacer",
        content: { height: 20 },
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
          title: "شروط الدفع",
          items: [
            "تاريخ الاستحقاق: {{dueDate}}",
            "طريقة الدفع: {{paymentMethodAr}}",
            "تفاصيل البنك: {{bankDetailsAr}}",
            "ملاحظات: {{notesAr}}"
          ]
        },
        order: 5
      },
      {
        type: "footer",
        content: {
          text: "شكراً لثقتكم بنا",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 6
      }
    ],
    variables: [
      "companyNameAr", "companyAddressAr", "companyPhone", "companyEmail",
      "taxNumber", "invoiceNumber", "date", "dueDate", "clientNameAr",
      "clientAddressAr", "products", "subtotal", "tax", "taxRate", "total",
      "currency", "paymentMethodAr", "bankDetailsAr", "notesAr"
    ],
    styles: {
      primaryColor: "#dc2626",
      secondaryColor: "#64748b",
      accentColor: "#f97316",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: { top: 140, bottom: 90, left: 50, right: 50 }
    },
    isActive: true,
    isDefault: true
  },
  {
    name: "قالب عقد الاتفاقية",
    description: "قالب عقد الاتفاقية طويلة الأجل (LTA)",
    category: "contract",
    language: "ar",
    sections: [
      {
        type: "header",
        content: {
          companyName: "{{companyNameAr}}",
          address: "{{companyAddressAr}}",
          phone: "{{companyPhone}}",
          email: "{{companyEmail}}",
          logo: true
        },
        order: 0
      },
      {
        type: "body",
        content: {
          title: "عقد اتفاقية طويلة الأجل",
          contractNumber: "{{contractNumber}}",
          date: "{{date}}",
          clientName: "{{clientNameAr}}",
          ltaName: "{{ltaNameAr}}",
          startDate: "{{startDate}}",
          endDate: "{{endDate}}"
        },
        order: 1
      },
      {
        type: "terms",
        content: {
          title: "بنود الاتفاقية",
          items: [
            "مدة الاتفاقية: من {{startDate}} إلى {{endDate}}",
            "نطاق الاتفاقية: {{scopeAr}}",
            "شروط التسعير: {{pricingTermsAr}}",
            "شروط الدفع: {{paymentTermsAr}}",
            "شروط التسليم: {{deliveryTermsAr}}"
          ]
        },
        order: 2
      },
      {
        type: "table",
        content: {
          headers: ["#", "اسم المنتج", "الكمية المتعاقد عليها", "السعر", "ملاحظات"],
          dataSource: "{{products}}",
          showBorders: true,
          alternateRowColors: true
        },
        order: 3
      },
      {
        type: "footer",
        content: {
          text: "التوقيعات",
          contact: "{{companyPhone}} | {{companyEmail}}",
          pageNumbers: true
        },
        order: 4
      }
    ],
    variables: [
      "companyNameAr", "companyAddressAr", "companyPhone", "companyEmail",
      "contractNumber", "date", "clientNameAr", "ltaNameAr", "startDate",
      "endDate", "scopeAr", "pricingTermsAr", "paymentTermsAr",
      "deliveryTermsAr", "products"
    ],
    styles: {
      primaryColor: "#7c3aed",
      secondaryColor: "#64748b",
      accentColor: "#8b5cf6",
      fontSize: 10,
      fontFamily: "Helvetica",
      headerHeight: 120,
      footerHeight: 70,
      margins: { top: 140, bottom: 90, left: 50, right: 50 }
    },
    isActive: true,
    isDefault: true
  }
];

export async function seedTemplates() {
  console.log('🌱 Seeding default templates...');

  try {
    const existingTemplates = await TemplateStorage.getTemplates();
    
    if (existingTemplates.length > 0) {
      console.log(`ℹ️  Found ${existingTemplates.length} existing templates. Skipping seed.`);
      return;
    }

    for (const templateData of DEFAULT_TEMPLATES) {
      await TemplateStorage.createTemplate({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category as any,
        language: templateData.language,
        sections: templateData.sections,
        variables: templateData.variables,
        styles: templateData.styles,
        isActive: templateData.isActive,
        isDefault: templateData.isDefault ?? false,
        version: 1,
        tags: []
      });
      
      console.log(`✅ Created template: ${templateData.name}`);
    }

    console.log(`✅ Successfully seeded ${DEFAULT_TEMPLATES.length} templates`);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  }
}
