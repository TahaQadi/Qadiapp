#!/bin/bash

# Quick Implementation Script for Replit
# This script safely implements the template system changes

set -e  # Exit on any error

echo "🚀 Starting Template System Implementation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Backup current state
print_status "Step 1: Creating backup..."
if [ -d ".git" ]; then
    git add .
    git commit -m "Backup before template system implementation" || true
    print_success "Git backup created"
else
    print_warning "No git repository found. Skipping git backup."
fi

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."
npm install
print_success "Dependencies installed"

# Step 3: Create new files
print_status "Step 3: Creating new files..."

# Create server/seed-templates.ts
cat > server/seed-templates.ts << 'EOF'
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
EOF

# Create server/scripts directory and seeding script
mkdir -p server/scripts

cat > server/scripts/seed-templates.ts << 'EOF'
#!/usr/bin/env tsx

import { TemplateSeeder } from '../seed-templates';

async function main() {
  try {
    console.log('🚀 Starting template seeding process...');
    await TemplateSeeder.seedDefaultTemplates();
    console.log('✅ Template seeding process completed successfully!');
  } catch (error) {
    console.error('❌ Template seeding process failed:', error);
    process.exit(1);
  }
}

main();
EOF

print_success "New files created"

# Step 4: Update package.json
print_status "Step 4: Updating package.json..."
if ! grep -q "seed:templates" package.json; then
  sed -i 's/"test:coverage": "vitest run --coverage"/"test:coverage": "vitest run --coverage",\n    "seed:templates": "tsx server\/scripts\/seed-templates.ts"/' package.json
  print_success "Added seed:templates script to package.json"
else
  print_warning "seed:templates script already exists in package.json"
fi

# Step 5: Create test script
print_status "Step 5: Creating test script..."
cat > test-template-system.ts << 'EOF'
import { TemplateGenerator } from './server/template-generator';
import { DocumentTemplate, TemplateVariable } from './shared/template-schema';

// Test template data
const testTemplate: DocumentTemplate = {
  id: 'test-template-1',
  nameEn: 'Test Price Offer',
  nameAr: 'عرض سعر تجريبي',
  descriptionEn: 'Test template for price offers',
  descriptionAr: 'قالب تجريبي لعروض الأسعار',
  category: 'price_offer',
  language: 'both',
  sections: [
    {
      type: 'header',
      content: {
        companyName: '{{companyName}}',
        companyNameAr: '{{companyNameAr}}',
        address: '{{companyAddress}}',
        addressAr: '{{companyAddressAr}}',
        phone: '{{companyPhone}}',
        email: '{{companyEmail}}',
        logo: true
      },
      order: 0
    },
    {
      type: 'body',
      content: {
        title: 'Price Offer',
        titleAr: 'عرض السعر',
        date: '{{date}}',
        offerNumber: '{{offerNumber}}',
        clientName: '{{clientName}}',
        clientNameAr: '{{clientNameAr}}',
        ltaName: '{{ltaName}}',
        ltaNameAr: '{{ltaNameAr}}',
        validUntil: '{{validUntil}}'
      },
      order: 1
    },
    {
      type: 'table',
      content: {
        headers: ['#', 'SKU', 'Product Name', 'Unit', 'Qty', 'Unit Price', 'Total'],
        headersAr: ['#', 'الرمز', 'اسم المنتج', 'الوحدة', 'الكمية', 'سعر الوحدة', 'المجموع'],
        dataSource: '{{products}}',
        showBorders: true,
        alternateRowColors: true
      },
      order: 2
    },
    {
      type: 'spacer',
      content: {
        height: 20
      },
      order: 3
    },
    {
      type: 'body',
      content: {
        subtotal: '{{subtotal}}',
        tax: '{{tax}}',
        taxRate: '{{taxRate}}',
        discount: '{{discount}}',
        total: '{{total}}',
        currency: '{{currency}}'
      },
      order: 4
    },
    {
      type: 'terms',
      content: {
        title: 'Terms & Conditions',
        titleAr: 'الشروط والأحكام',
        items: [
          'This offer is valid until {{validUntil}}',
          'Prices are based on the LTA contract: {{ltaName}}',
          'Payment terms: {{paymentTerms}}',
          'Delivery time: {{deliveryTime}}',
          'All prices are in {{currency}}'
        ],
        itemsAr: [
          'هذا العرض صالح حتى {{validUntil}}',
          'الأسعار مبنية على الاتفاقية: {{ltaNameAr}}',
          'شروط الدفع: {{paymentTermsAr}}',
          'وقت التسليم: {{deliveryTimeAr}}',
          'جميع الأسعار بـ {{currency}}'
        ]
      },
      order: 5
    },
    {
      type: 'footer',
      content: {
        text: 'Thank you for your business | شكراً لتعاملكم معنا',
        contact: '{{companyPhone}} | {{companyEmail}}',
        pageNumbers: true
      },
      order: 6
    }
  ],
  variables: [
    'companyName', 'companyNameAr', 'companyAddress', 'companyAddressAr',
    'companyPhone', 'companyEmail', 'date', 'offerNumber', 'clientName',
    'clientNameAr', 'ltaName', 'ltaNameAr', 'validUntil', 'products',
    'subtotal', 'tax', 'taxRate', 'discount', 'total', 'currency',
    'paymentTerms', 'paymentTermsAr', 'deliveryTime', 'deliveryTimeAr'
  ],
  styles: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    fontSize: 10,
    fontFamily: 'Helvetica',
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
  isDefault: true,
  version: 1,
  tags: ['test', 'price-offer'],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Test variables
const testVariables: TemplateVariable[] = [
  { key: 'companyName', value: 'ACME Corporation' },
  { key: 'companyNameAr', value: 'شركة إيه سي إم إي' },
  { key: 'companyAddress', value: '123 Business St, City, Country' },
  { key: 'companyAddressAr', value: 'شارع الأعمال 123، المدينة، البلد' },
  { key: 'companyPhone', value: '+1-555-0123' },
  { key: 'companyEmail', value: 'info@acme.com' },
  { key: 'date', value: '2024-01-15' },
  { key: 'offerNumber', value: 'PO-2024-001' },
  { key: 'clientName', value: 'Client Inc.' },
  { key: 'clientNameAr', value: 'شركة العميل' },
  { key: 'ltaName', value: 'LTA-2024-001' },
  { key: 'ltaNameAr', value: 'اتفاقية طويلة الأجل 2024-001' },
  { key: 'validUntil', value: '2024-02-15' },
  { key: 'products', value: [
    { sku: 'SKU001', name: 'Product 1', unit: 'pcs', qty: 10, price: 100, total: 1000 },
    { sku: 'SKU002', name: 'Product 2', unit: 'pcs', qty: 5, price: 200, total: 1000 }
  ]},
  { key: 'subtotal', value: '2000.00' },
  { key: 'tax', value: '200.00' },
  { key: 'taxRate', value: '10%' },
  { key: 'discount', value: '0.00' },
  { key: 'total', value: '2200.00' },
  { key: 'currency', value: 'USD' },
  { key: 'paymentTerms', value: 'Net 30 days' },
  { key: 'paymentTermsAr', value: 'صافي 30 يوماً' },
  { key: 'deliveryTime', value: '2-3 weeks' },
  { key: 'deliveryTimeAr', value: '2-3 أسابيع' }
];

async function testTemplateSystem() {
  try {
    console.log('🧪 Testing template system...');
    
    // Test PDF generation
    console.log('📄 Generating PDF...');
    const pdfBuffer = await TemplateGenerator.generateFromTemplate(testTemplate, testVariables);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation returned empty buffer');
    }
    
    console.log('✅ PDF generated successfully!');
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes (${Math.round(pdfBuffer.length / 1024)} KB)`);
    
    // Save test PDF
    const fs = await import('fs');
    const testFileName = `test-output-${Date.now()}.pdf`;
    fs.writeFileSync(testFileName, pdfBuffer);
    console.log(`💾 Test PDF saved as: ${testFileName}`);
    
    console.log('🎉 Template system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Template system test failed:', error);
    process.exit(1);
  }
}

testTemplateSystem();
EOF

print_success "Test script created"

# Step 6: Test the implementation
print_status "Step 6: Testing template system..."
if npx tsx test-template-system.ts; then
  print_success "Template system test passed!"
else
  print_error "Template system test failed. Please check the errors above."
  exit 1
fi

# Step 7: Final instructions
print_success "🎉 Template System Implementation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Run 'npm run seed:templates' to seed default templates"
echo "2. Test the API endpoints in your application"
echo "3. Check the generated PDF files"
echo "4. Integrate with your frontend if needed"
echo ""
echo "📚 Documentation:"
echo "- Template System Guide: /workspace/docs/TEMPLATE_SYSTEM_GUIDE.md"
echo "- Implementation Guide: /workspace/REPLIT_IMPLEMENTATION_GUIDE.md"
echo "- Comprehensive Report: /workspace/docs/COMPREHENSIVE_APPLICATION_REPORT.md"
echo ""
echo "🔧 Commands:"
echo "- Test template system: npx tsx test-template-system.ts"
echo "- Seed templates: npm run seed:templates"
echo "- Start development: npm run dev"
echo ""
print_warning "Remember to backup your database before running template seeding!"