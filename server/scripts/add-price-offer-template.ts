import { TemplateStorage } from '../template-storage';

async function addPriceOfferTemplate() {
  try {
    // Check if price offer template already exists
    const existing = await TemplateStorage.getTemplates('price_offer');
    
    if (existing.length > 0) {
      console.log('Price offer template already exists. Updating to latest version...');
      const template = existing[0];
      await TemplateStorage.updateTemplate(template.id, {
        nameEn: 'Official Price Offer Template (RTL)',
        nameAr: 'قالب عرض السعر الرسمي (RTL)',
        descriptionEn: 'Professional price offer template with full Arabic RTL support',
        descriptionAr: 'قالب عرض سعر احترافي مع دعم كامل للكتابة من اليمين لليسار',
        isActive: true,
        sections: [
          {
            type: 'header',
            companyNameEn: '{{companyNameEn}}',
            companyNameAr: '{{companyNameAr}}',
            addressEn: '{{companyAddressEn}}',
            addressAr: '{{companyAddressAr}}',
            phone: '{{companyPhone}}',
            email: '{{companyEmail}}',
            website: '{{companyWebsite}}'
          },
          {
            type: 'body',
            text: {
              en: 'OFFICIAL PRICE OFFER\n\nOffer Number: {{offerNumber}}\nDate: {{offerDate}}\nValid Until: {{validUntil}}\n\nTo: {{clientNameEn}}\nEmail: {{clientEmail}}\nPhone: {{clientPhone}}\n\nLTA Contract: {{ltaNameEn}} ({{ltaNumber}})\n\nDear Valued Client,\n\nWe are pleased to present you with the following price offer for products under your Long-Term Agreement contract.',
              ar: 'عرض سعر رسمي\n\nرقم العرض: {{offerNumber}}\nالتاريخ: {{offerDate}}\nساري حتى: {{validUntil}}\n\nإلى: {{clientNameAr}}\nالبريد الإلكتروني: {{clientEmail}}\nالهاتف: {{clientPhone}}\n\nعقد الاتفاقية: {{ltaNameAr}} ({{ltaNumber}})\n\nعميلنا العزيز،\n\nيسرنا أن نقدم لكم عرض الأسعار التالي للمنتجات بموجب عقد الاتفاقية.'
            }
          },
          {
            type: 'table',
            columns: [
              { header: { en: 'SKU', ar: 'رمز المنتج' }, field: 'sku', width: 80 },
              { header: { en: 'Product Name', ar: 'اسم المنتج' }, field: 'name', width: 200 },
              { header: { en: 'Price', ar: 'السعر' }, field: 'price', width: 100, align: 'right' },
              { header: { en: 'Currency', ar: 'العملة' }, field: 'currency', width: 80 }
            ],
            data: '{{items}}',
            rowMapping: {
              sku: 'sku',
              name: { en: 'nameEn', ar: 'nameAr' },
              price: 'contractPrice',
              currency: 'currency'
            }
          },
          {
            type: 'terms',
            title: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
            items: [
              { en: 'Prices valid until specified date', ar: 'الأسعار سارية حتى التاريخ المحدد' },
              { en: 'Based on LTA contract terms', ar: 'بناءً على شروط عقد الاتفاقية' },
              { en: 'Subject to product availability', ar: 'تخضع لتوافر المنتجات' }
            ]
          },
          {
            type: 'signature',
            name: { en: '{{generatedBy}}', ar: '{{generatedBy}}' },
            title: { en: 'Sales Manager', ar: 'مدير المبيعات' },
            date: '{{generatedDate}}'
          },
          {
            type: 'footer',
            text: {
              en: 'Thank you for your business',
              ar: 'شكراً لتعاملكم معنا'
            }
          }
        ],
        variables: [
          'offerNumber', 'offerDate', 'validUntil',
          'clientNameEn', 'clientNameAr', 'clientEmail', 'clientPhone',
          'ltaNameEn', 'ltaNameAr', 'ltaNumber',
          'items', 'totalItems', 'notes',
          'generatedBy', 'generatedDate',
          'companyNameEn', 'companyNameAr', 'companyAddressEn', 'companyAddressAr',
          'companyPhone', 'companyEmail', 'companyWebsite'
        ],
        styles: {
          fontSize: 11,
          lineHeight: 1.5,
          headerColor: '#1a365d',
          accentColor: '#d4af37',
          textColor: '#000000'
        }
      });
      console.log('✅ Price offer template updated successfully!');
    } else {
      console.log('Creating new price offer template...');
      await TemplateStorage.createTemplate({
        nameEn: 'Official Price Offer Template (RTL)',
        nameAr: 'قالب عرض السعر الرسمي (RTL)',
        descriptionEn: 'Professional price offer template with full Arabic RTL support',
        descriptionAr: 'قالب عرض سعر احترافي مع دعم كامل للكتابة من اليمين لليسار',
        category: 'price_offer',
        language: 'both',
        isActive: true,
        sections: [
          {
            type: 'header',
            companyNameEn: '{{companyNameEn}}',
            companyNameAr: '{{companyNameAr}}',
            addressEn: '{{companyAddressEn}}',
            addressAr: '{{companyAddressAr}}',
            phone: '{{companyPhone}}',
            email: '{{companyEmail}}',
            website: '{{companyWebsite}}'
          },
          {
            type: 'body',
            text: {
              en: 'OFFICIAL PRICE OFFER\n\nOffer Number: {{offerNumber}}\nDate: {{offerDate}}\nValid Until: {{validUntil}}\n\nTo: {{clientNameEn}}\nEmail: {{clientEmail}}\nPhone: {{clientPhone}}\n\nLTA Contract: {{ltaNameEn}} ({{ltaNumber}})\n\nDear Valued Client,\n\nWe are pleased to present you with the following price offer for products under your Long-Term Agreement contract.',
              ar: 'عرض سعر رسمي\n\nرقم العرض: {{offerNumber}}\nالتاريخ: {{offerDate}}\nساري حتى: {{validUntil}}\n\nإلى: {{clientNameAr}}\nالبريد الإلكتروني: {{clientEmail}}\nالهاتف: {{clientPhone}}\n\nعقد الاتفاقية: {{ltaNameAr}} ({{ltaNumber}})\n\nعميلنا العزيز،\n\nيسرنا أن نقدم لكم عرض الأسعار التالي للمنتجات بموجب عقد الاتفاقية.'
            }
          },
          {
            type: 'table',
            columns: [
              { header: { en: 'SKU', ar: 'رمز المنتج' }, field: 'sku', width: 80 },
              { header: { en: 'Product Name', ar: 'اسم المنتج' }, field: 'name', width: 200 },
              { header: { en: 'Price', ar: 'السعر' }, field: 'price', width: 100, align: 'right' },
              { header: { en: 'Currency', ar: 'العملة' }, field: 'currency', width: 80 }
            ],
            data: '{{items}}',
            rowMapping: {
              sku: 'sku',
              name: { en: 'nameEn', ar: 'nameAr' },
              price: 'contractPrice',
              currency: 'currency'
            }
          },
          {
            type: 'terms',
            title: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
            items: [
              { en: 'Prices valid until specified date', ar: 'الأسعار سارية حتى التاريخ المحدد' },
              { en: 'Based on LTA contract terms', ar: 'بناءً على شروط عقد الاتفاقية' },
              { en: 'Subject to product availability', ar: 'تخضع لتوافر المنتجات' }
            ]
          },
          {
            type: 'signature',
            name: { en: '{{generatedBy}}', ar: '{{generatedBy}}' },
            title: { en: 'Sales Manager', ar: 'مدير المبيعات' },
            date: '{{generatedDate}}'
          },
          {
            type: 'footer',
            text: {
              en: 'Thank you for your business',
              ar: 'شكراً لتعاملكم معنا'
            }
          }
        ],
        variables: [
          'offerNumber', 'offerDate', 'validUntil',
          'clientNameEn', 'clientNameAr', 'clientEmail', 'clientPhone',
          'ltaNameEn', 'ltaNameAr', 'ltaNumber',
          'items', 'totalItems', 'notes',
          'generatedBy', 'generatedDate',
          'companyNameEn', 'companyNameAr', 'companyAddressEn', 'companyAddressAr',
          'companyPhone', 'companyEmail', 'companyWebsite'
        ],
        styles: {
          fontSize: 11,
          lineHeight: 1.5,
          headerColor: '#1a365d',
          accentColor: '#d4af37',
          textColor: '#000000'
        }
      });
      console.log('✅ Price offer template created successfully!');
    }
  } catch (error) {
    console.error('❌ Error adding price offer template:', error);
    process.exit(1);
  }
}

// Run the script
addPriceOfferTemplate().then(() => process.exit(0)).catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
