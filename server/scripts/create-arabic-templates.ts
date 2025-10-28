import { TemplateStorage } from '../template-storage';

/**
 * Create production-ready Arabic templates
 * Based on user-provided content for Al Qadi company
 */

const COMPANY_INFO = {
  nameAr: 'شركة القاضي للمواد الاستهلاكية والتسويق',
  addressAr: 'البيرة – أمّ الشرايط، فلسطين',
  phone: '00970592555532',
  email: 'info@qadi.ps',
  website: 'qadi.ps',
  taxNumber: '', // To be filled when available
  departments: {
    sales: { phone: '00970592555532', email: 'taha@qadi.ps' },
    logistics: { phone: '0592555534', email: 'issam@qadi.ps' },
    accounting: { phone: '0592555536', email: 'info@qadi.ps' }
  }
};

const SHARED_STYLES = {
  primaryColor: '#1a365d',
  secondaryColor: '#2d3748',
  accentColor: '#3182ce',
  fontSize: 11,
  fontFamily: 'NotoSansArabic',
  headerHeight: 120,
  footerHeight: 80,
  margins: {
    top: 120,
    bottom: 80,
    left: 50,
    right: 50
  }
};

/**
 * Price Offer Template (عرض سعر)
 */
const priceOfferTemplate = {
  name: 'قالب عرض السعر الافتراضي',
  description: 'قالب عرض السعر الرسمي لشركة القاضي',
  category: 'price_offer' as const,
  language: 'ar' as const,
  sections: [
    {
      type: 'header',
      order: 0,
      content: {
        showLogo: true,
        logoPath: 'public/logo.png',
        companyName: COMPANY_INFO.nameAr,
        companyAddress: COMPANY_INFO.addressAr,
        companyPhone: COMPANY_INFO.phone,
        companyEmail: COMPANY_INFO.email,
        titleAr: 'عرض سعر',
        date: '{{date}}',
        offerNumber: '{{offerNumber}}',
        clientName: '{{clientName}}',
        validUntil: '{{validUntil}}'
      }
    },
    {
      type: 'body',
      order: 1,
      content: {
        textAr: 'تحية طيبة وبعد،\n\nيسرنا تقديم عرض السعر التالي بناءً على طلبكم الكريم:'
      }
    },
    {
      type: 'table',
      order: 2,
      content: {
        headersAr: [
          'رقم الصنف',
          'اسم الصنف',
          'الوصف',
          'الوحدة',
          'الكمية',
          'سعر الوحدة (شيكل)',
          'الخصم',
          'الإجمالي'
        ],
        dataSource: '{{items}}',
        showBorders: true,
        alternateRowColors: true
      }
    },
    {
      type: 'spacer',
      order: 3,
      content: { height: 20 }
    },
    {
      type: 'body',
      order: 4,
      content: {
        textAr: 'المجموع الفرعي: {{subtotal}} شيكل\nالخصم الإجمالي: {{discount}} شيكل\nالمجموع النهائي (شامل ضريبة القيمة المضافة): {{total}} شيكل'
      }
    },
    {
      type: 'divider',
      order: 5,
      content: {}
    },
    {
      type: 'terms',
      order: 6,
      content: {
        titleAr: 'الشروط والأحكام',
        itemsAr: [
          'الأسعار: تشمل ضريبة القيمة المضافة دائمًا.',
          'الصلاحية: يسري العرض لمدة ({{validityDays}} يومًا) من تاريخ الإصدار.',
          'التوريد: خلال ({{deliveryDays}} أيام عمل) من تأكيد الطلب/الدفع، حسب التوفّر.',
          'التسليم: إلى موقع العميل، وقد تُضاف كلفة شحن بحسب الموقع والكمية.',
          'الدفع: (تحويل بنكي/نقدًا عند التسليم/آجل {{paymentTerms}} يومًا) حسب الاتفاق المكتوب.',
          'الضمان: مطابقة المواصفات، وتُقبل الملاحظات خلال ({{warrantyDays}} أيام) من التسليم.',
          'الإلغاء: قبل بدء التجهيز الفعلي؛ وتُحمّل أي تكاليف مترتبة على طالب الإلغاء.',
          'أخرى: يحق للشركة مراجعة المواعيد عند ظروف قاهرة أو تغيّرات سوقية جوهرية.'
        ]
      }
    },
    {
      type: 'footer',
      order: 7,
      content: {
        text: `${COMPANY_INFO.nameAr} – ${COMPANY_INFO.email} – ${COMPANY_INFO.website}\nالمبيعات: ${COMPANY_INFO.departments.sales.phone} | اللوجستيات: ${COMPANY_INFO.departments.logistics.phone} | الحسابات: ${COMPANY_INFO.departments.accounting.phone}\nهذا المستند مُنشأ إلكترونيًا.`,
        pageNumbers: true
      }
    }
  ],
  variables: [
    'date',
    'offerNumber',
    'clientName',
    'validUntil',
    'items',
    'subtotal',
    'discount',
    'total',
    'validityDays',
    'deliveryDays',
    'paymentTerms',
    'warrantyDays'
  ],
  styles: SHARED_STYLES,
  isActive: true,
  isDefault: true
};

/**
 * Order Confirmation Template (تأكيد الطلب)
 */
const orderTemplate = {
  name: 'قالب تأكيد الطلب الافتراضي',
  description: 'قالب تأكيد الطلب الرسمي لشركة القاضي',
  category: 'order' as const,
  language: 'ar' as const,
  sections: [
    {
      type: 'header',
      order: 0,
      content: {
        showLogo: true,
        logoPath: 'public/logo.png',
        companyName: COMPANY_INFO.nameAr,
        companyAddress: COMPANY_INFO.addressAr,
        companyPhone: COMPANY_INFO.phone,
        companyEmail: COMPANY_INFO.email,
        titleAr: 'تأكيد الطلب'
      }
    },
    {
      type: 'body',
      order: 1,
      content: {
        sectionTitleAr: 'تفاصيل الطلب',
        textAr: `رقم الطلب: {{orderId}}
تاريخ الطلب: {{orderDate}}
اسم العميل/الجهة: {{clientName}}
العنوان: {{deliveryAddress}}
رقم الاتصال: {{clientPhone}}
طريقة الدفع: {{paymentMethod}}
المرجع (عرض السعر/اتفاق): {{reference}}`
      }
    },
    {
      type: 'table',
      order: 2,
      content: {
        headersAr: [
          'رقم الصنف',
          'اسم الصنف',
          'الوصف',
          'الوحدة',
          'الكمية',
          'سعر الوحدة (شيكل)',
          'الإجمالي'
        ],
        dataSource: '{{items}}',
        showBorders: true,
        alternateRowColors: true
      }
    },
    {
      type: 'spacer',
      order: 3,
      content: { height: 20 }
    },
    {
      type: 'body',
      order: 4,
      content: {
        textAr: 'المجموع الإجمالي (شامل ضريبة القيمة المضافة): {{totalAmount}} شيكل'
      }
    },
    {
      type: 'divider',
      order: 5,
      content: {}
    },
    {
      type: 'body',
      order: 6,
      content: {
        sectionTitleAr: 'معلومات التسليم',
        textAr: 'سيجري تجهيز وتسليم الطلب خلال ({{deliveryDays}} أيام عمل) إلى عنوان التسليم الموضّح. يرجى توفير جهة اتصال للتنسيق والاستلام. أي فروقات تُوثّق على سند التسليم فور الوصول. الأسعار شاملة لضريبة القيمة المضافة.'
      }
    },
    {
      type: 'body',
      order: 7,
      content: {
        sectionTitleAr: 'جهات الاتصال',
        textAr: `قسم المبيعات: ${COMPANY_INFO.departments.sales.phone} | ${COMPANY_INFO.departments.sales.email}
اللوجستيات والتسليم: ${COMPANY_INFO.departments.logistics.phone} | ${COMPANY_INFO.departments.logistics.email}
الحسابات والفوترة: ${COMPANY_INFO.departments.accounting.phone} | ${COMPANY_INFO.departments.accounting.email}`
      }
    },
    {
      type: 'body',
      order: 8,
      content: {
        textAr: 'شكرًا لثقتكم بشركة القاضي. نلتزم بسرعة التنفيذ وجودة الخدمة.',
        align: 'center'
      }
    },
    {
      type: 'footer',
      order: 9,
      content: {
        text: `${COMPANY_INFO.nameAr} – ${COMPANY_INFO.email} – ${COMPANY_INFO.website} | جميع العمليات خاضعة لشروط وأحكام الشركة.`,
        pageNumbers: true
      }
    }
  ],
  variables: [
    'orderId',
    'orderDate',
    'clientName',
    'deliveryAddress',
    'clientPhone',
    'paymentMethod',
    'reference',
    'items',
    'totalAmount',
    'deliveryDays'
  ],
  styles: SHARED_STYLES,
  isActive: true,
  isDefault: true
};

/**
 * Invoice Template (فاتورة)
 */
const invoiceTemplate = {
  name: 'قالب الفاتورة الافتراضي',
  description: 'قالب الفاتورة الرسمي لشركة القاضي',
  category: 'invoice' as const,
  language: 'ar' as const,
  sections: [
    {
      type: 'header',
      order: 0,
      content: {
        showLogo: true,
        logoPath: 'public/logo.png',
        companyName: COMPANY_INFO.nameAr,
        companyAddress: COMPANY_INFO.addressAr,
        companyPhone: COMPANY_INFO.phone,
        companyEmail: COMPANY_INFO.email,
        titleAr: 'فاتورة',
        date: '{{invoiceDate}}',
        offerNumber: '{{invoiceNumber}}'
      }
    },
    {
      type: 'body',
      order: 1,
      content: {
        textAr: `رقم الفاتورة: {{invoiceNumber}}
تاريخ الإصدار: {{invoiceDate}}
تاريخ الاستحقاق: {{dueDate}}
العميل: {{clientName}}
العنوان: {{clientAddress}}`
      }
    },
    {
      type: 'table',
      order: 2,
      content: {
        headersAr: [
          'رقم الصنف',
          'اسم الصنف',
          'الوصف',
          'الوحدة',
          'الكمية',
          'سعر الوحدة (شيكل)',
          'الخصم',
          'الإجمالي'
        ],
        dataSource: '{{items}}',
        showBorders: true,
        alternateRowColors: true
      }
    },
    {
      type: 'spacer',
      order: 3,
      content: { height: 20 }
    },
    {
      type: 'body',
      order: 4,
      content: {
        sectionTitleAr: 'ملخص الفاتورة',
        textAr: `الإجمالي قبل الخصم: {{subtotal}} شيكل
إجمالي الخصومات: {{discount}} شيكل
صافي الفاتورة (شامل الضريبة): {{netAmount}} شيكل
بيان ضريبة القيمة المضافة ضمن السعر: ({{taxRate}}%) = {{taxAmount}} شيكل
الإجمالي المستحق (شامل الضريبة): {{total}} شيكل

ملاحظة: أسعار الأصناف تتضمن ضريبة القيمة المضافة، ويُبيَّن مقدار الضريبة ضمن التفصيل لغرض الإفصاح المحاسبي فقط.`
      }
    },
    {
      type: 'divider',
      order: 5,
      content: {}
    },
    {
      type: 'body',
      order: 6,
      content: {
        sectionTitleAr: 'تفاصيل الدفع',
        textAr: `اسم البنك: {{bankName}}
الفرع: {{bankBranch}}
اسم الحساب: ${COMPANY_INFO.nameAr}
رقم الحساب/IBAN: {{bankAccount}}
مرجع التحويل: رقم الفاتورة + اسم الجهة`
      }
    },
    {
      type: 'body',
      order: 7,
      content: {
        textAr: `تُسدد الفاتورة خلال ({{paymentDays}} يومًا) من تاريخ الإصدار ما لم يُتفق خلاف ذلك كتابةً. قد تُطبّق رسوم تأخير عند تجاوز الأجل. للاستفسارات المالية: ${COMPANY_INFO.departments.accounting.phone} | ${COMPANY_INFO.departments.accounting.email}`
      }
    },
    {
      type: 'footer',
      order: 8,
      content: {
        text: `${COMPANY_INFO.nameAr} – ${COMPANY_INFO.email} – ${COMPANY_INFO.website}\nالمبيعات: ${COMPANY_INFO.departments.sales.phone} | اللوجستيات: ${COMPANY_INFO.departments.logistics.phone} | الحسابات: ${COMPANY_INFO.departments.accounting.phone}`,
        pageNumbers: true
      }
    }
  ],
  variables: [
    'invoiceNumber',
    'invoiceDate',
    'dueDate',
    'clientName',
    'clientAddress',
    'items',
    'subtotal',
    'discount',
    'netAmount',
    'taxRate',
    'taxAmount',
    'total',
    'bankName',
    'bankBranch',
    'bankAccount',
    'paymentDays'
  ],
  styles: SHARED_STYLES,
  isActive: true,
  isDefault: true
};

/**
 * Contract Template (عقد اتفاقية إطارية)
 */
const contractTemplate = {
  name: 'قالب العقد الإطاري الافتراضي',
  description: 'قالب العقد الإطاري الرسمي لشركة القاضي',
  category: 'contract' as const,
  language: 'ar' as const,
  sections: [
    {
      type: 'header',
      order: 0,
      content: {
        showLogo: true,
        logoPath: 'public/logo.png',
        companyName: COMPANY_INFO.nameAr,
        companyAddress: COMPANY_INFO.addressAr,
        companyPhone: COMPANY_INFO.phone,
        companyEmail: COMPANY_INFO.email,
        titleAr: 'عقد اتفاقية إطارية'
      }
    },
    {
      type: 'body',
      order: 1,
      content: {
        sectionTitleAr: 'الأطراف المتعاقدة',
        textAr: `تمّ هذا العقد الإطاري بين:

${COMPANY_INFO.nameAr} (المورّد)، الكائن مقرّها في ${COMPANY_INFO.addressAr}، البريد الإلكتروني: ${COMPANY_INFO.email}، الموقع: ${COMPANY_INFO.website}.

{{clientName}} (العميل).

يهدف هذا العقد إلى تنظيم توريد المنتجات الاستهلاكية والتنظيف والتغليف وفقًا للبنود التالية. جميع الأسعار في هذه الاتفاقية تشمل ضريبة القيمة المضافة.`
      }
    },
    {
      type: 'divider',
      order: 2,
      content: {}
    },
    {
      type: 'body',
      order: 3,
      content: {
        sectionTitleAr: 'بنود العقد',
        textAr: `1. التعريفات
2. نطاق المنتجات والخدمات
3. مدة العقد والتجديد
4. الأسعار وآلية التعديل (شاملة ضريبة القيمة المضافة)
5. أوامر الشراء وآلية التوريد
6. شروط الدفع والفوترة
7. التسليم ونقل المخاطر (التنسيق عبر ${COMPANY_INFO.departments.logistics.phone} | ${COMPANY_INFO.departments.logistics.email})
8. الجودة والضمان
9. الإرجاع والاستبدال
10. السرية وحماية البيانات
11. القوة القاهرة
12. إنهاء العقد وآثاره
13. القانون الواجب التطبيق وتسوية النزاعات`
      }
    },
    {
      type: 'spacer',
      order: 4,
      content: { height: 30 }
    },
    {
      type: 'body',
      order: 5,
      content: {
        sectionTitleAr: 'جدول المنتجات',
        textAr: 'فيما يلي المنتجات المتفق عليها ضمن هذا العقد الإطاري:'
      }
    },
    {
      type: 'table',
      order: 6,
      content: {
        headersAr: [
          'رقم البند',
          'اسم المنتج/الوصف',
          'الوحدة',
          'السعر (شيكل)',
          'الحد الأدنى (MOQ)',
          'زمن التوريد',
          'ملاحظات'
        ],
        dataSource: '{{products}}',
        showBorders: true,
        alternateRowColors: true
      }
    },
    {
      type: 'spacer',
      order: 7,
      content: { height: 40 }
    },
    {
      type: 'signature',
      order: 8,
      content: {
        signatories: [
          {
            nameAr: COMPANY_INFO.nameAr,
            titleAr: 'المورّد',
            fields: 'الاسم: ... | الصفة: ... | التوقيع: ... | الختم: ... | التاريخ: ...'
          },
          {
            nameAr: '{{clientName}}',
            titleAr: 'العميل',
            fields: 'الاسم: ... | الصفة: ... | التوقيع: ... | الختم: ... | التاريخ: ...'
          }
        ]
      }
    },
    {
      type: 'footer',
      order: 9,
      content: {
        text: `للاستعلامات العامة: ${COMPANY_INFO.email} | ${COMPANY_INFO.website}\nالمبيعات: ${COMPANY_INFO.departments.sales.phone} | الحسابات: ${COMPANY_INFO.departments.accounting.phone} | اللوجستيات: ${COMPANY_INFO.departments.logistics.phone}`,
        pageNumbers: true
      }
    }
  ],
  variables: [
    'clientName',
    'contractDate',
    'startDate',
    'endDate',
    'products'
  ],
  styles: SHARED_STYLES,
  isActive: true,
  isDefault: true
};

/**
 * Main function to create all templates
 */
export async function createArabicTemplates(): Promise<void> {
  console.log('🚀 Creating Arabic templates for Al Qadi company...\n');

  try {
    // 1. Price Offer Template
    console.log('📄 Creating Price Offer Template...');
    const priceOffer = await TemplateStorage.createTemplate(priceOfferTemplate);
    console.log(`✅ Price Offer Template created: ${priceOffer.id}\n`);

    // 2. Order Confirmation Template
    console.log('📄 Creating Order Confirmation Template...');
    const order = await TemplateStorage.createTemplate(orderTemplate);
    console.log(`✅ Order Confirmation Template created: ${order.id}\n`);

    // 3. Invoice Template
    console.log('📄 Creating Invoice Template...');
    const invoice = await TemplateStorage.createTemplate(invoiceTemplate);
    console.log(`✅ Invoice Template created: ${invoice.id}\n`);

    // 4. Contract Template
    console.log('📄 Creating Contract Template...');
    const contract = await TemplateStorage.createTemplate(contractTemplate);
    console.log(`✅ Contract Template created: ${contract.id}\n`);

    console.log('🎉 All Arabic templates created successfully!');
    console.log('\nTemplate Summary:');
    console.log(`- Price Offer: ${priceOffer.name} (${priceOffer.id})`);
    console.log(`- Order Confirmation: ${order.name} (${order.id})`);
    console.log(`- Invoice: ${invoice.name} (${invoice.id})`);
    console.log(`- Contract: ${contract.name} (${contract.id})`);
  } catch (error) {
    console.error('❌ Error creating templates:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createArabicTemplates()
    .then(() => {
      console.log('\n✅ Template creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Template creation failed:', error);
      process.exit(1);
    });
}

