import { useState, useMemo, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, ChevronLeft, ChevronRight, Search, Printer, Share2, Package, Trash2, FileSpreadsheet, MapPin, ExternalLink, FileText, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { formatDateLocalized } from '@/lib/dateUtils';
import { apiRequest, queryClient, cacheStrategies } from '@/lib/queryClient';
import { safeJsonParse } from '@/lib/safeJson';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualList } from "@/components/VirtualList";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/useDebounce";

interface Order {
  id: string;
  clientId: string;
  ltaId: string | null;
  items: string;
  totalAmount: string;
  status: string;
  pipefyCardId: string | null;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
}

interface LTA {
  id: string;
  name: string;
}

interface OrderItem {
  productId: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  sku: string;
  quantity: number;
  price: string;
}

// Admin Order Details Content Component
function AdminOrderDetailsContent({ 
  order, 
  language
}: { 
  order: Order; 
  language: string;
}) {
  const { toast } = useToast();
  // Fetch client information
  const { data: clientData } = useQuery({
    queryKey: ['/api/admin/clients', order.clientId],
    queryFn: async () => {
      if (!order.clientId) return null;
      const res = await apiRequest('GET', `/api/admin/clients/${order.clientId}`);
      if (!res.ok) throw new Error('Failed to fetch client');
      return res.json();
    },
    enabled: !!order.clientId,
  });

  const client = clientData?.client;
  const clientLocations = clientData?.locations || [];
  const clientDepartments = clientData?.departments || [];

  // Find headquarters or first available location
  const deliveryLocation = clientLocations.find((loc: any) => loc.isHeadquarters) || clientLocations[0];

  // Find warehouse department
  const warehouseDepartment = clientDepartments.find((dept: any) => dept.departmentType === 'warehouse');

  // Fetch LTA information
  const { data: ltaData } = useQuery({
    queryKey: ['/api/admin/ltas', order.ltaId],
    queryFn: async () => {
      if (!order.ltaId) return null;
      const res = await apiRequest('GET', `/api/admin/ltas/${order.ltaId}`);
      if (!res.ok) throw new Error('Failed to fetch LTA');
      return res.json();
    },
    enabled: !!order.ltaId,
  });

  // Helper function to generate map navigation URL
  const getMapNavigationUrl = (latitude: string | number | null, longitude: string | number | null): string | null => {
    if (!latitude || !longitude) return null;
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    if (isNaN(lat) || isNaN(lng)) return null;
    // Use Google Maps (works on all platforms)
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  const items: OrderItem[] = safeJsonParse<OrderItem[]>(order.items, []);
  
  // Fetch all products to get product names
  const { data: allProducts = [] } = useQuery({
    queryKey: ['/api/admin/products'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  // Enrich items with product names
  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const product = allProducts.find((p: any) => p.id === item.productId || p.sku === item.sku);
      return {
        ...item,
        name: product?.name || item.name || '',
        nameAr: product?.nameAr || item.nameAr || product?.name || item.name || '',
        nameEn: product?.nameEn || item.nameEn || product?.name || item.name || '',
      };
    });
  }, [items, allProducts]);

  const mapUrl = deliveryLocation ? getMapNavigationUrl(deliveryLocation.latitude, deliveryLocation.longitude) : null;

  // Print function
  const handlePrintOrderConfirmation = useMemo(() => {
    return () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل فتح نافذة الطباعة' : 'Failed to open print window',
      });
      return;
    }

    // Format date
    const orderDate = formatDateLocalized(new Date(order.createdAt), language as 'ar' | 'en');

    // Company information
    const companyName = 'شركة القاضي للمواد الاستهلاكية والتسويق';
    const companyAddress = 'البيرة – أمّ الشرايط، فلسطين';
    const companyPhone = '009705925555532 (قسم المبيعات)';
    const companyEmail = 'info@qadi.ps';
    const companyWebsite = 'qadi.ps';
    const taxNumber = '56256551';

    // Client and address information - matching dialog preview exactly
    const clientName = client?.nameAr || client?.nameEn || (language === 'ar' ? 'غير محدد' : 'Not specified');
    const addressText = deliveryLocation
      ? language === 'ar'
        ? deliveryLocation.addressAr || deliveryLocation.addressEn
        : deliveryLocation.addressEn || deliveryLocation.addressAr
      : language === 'ar'
      ? 'غير محدد'
      : 'Not specified';
    const contactPhone = client?.phone || deliveryLocation?.phone || (language === 'ar' ? 'غير محدد' : 'Not specified');
    const paymentMethod = language === 'ar' ? 'سيتم تحديدها لاحقاً' : 'To be determined later';
    const referenceName = ltaData
      ? language === 'ar'
        ? ltaData.nameAr || ltaData.nameEn
        : ltaData.nameEn || ltaData.nameAr
      : language === 'ar'
      ? 'غير محدد'
      : 'Not specified';

    const html = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}" lang="${language}">
        <head>
          <title>${language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'} #${order.id}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              size: A4;
              margin: 1.2cm 1cm;
            }
            body {
              font-family: 'Arial', 'Tahoma', sans-serif;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
              text-align: ${language === 'ar' ? 'right' : 'left'};
              font-size: 11pt;
              line-height: 1.5;
              color: #1a1a1a;
              background: white;
              width: 100%;
              max-width: 19cm;
              margin: 0 auto;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            /* Company Header - Matching Dialog */
            .company-header {
              border-bottom: 2px solid #1a365d;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .company-name {
              font-size: 20pt;
              font-weight: bold;
              color: #1a365d;
              margin-bottom: 8px;
              text-align: center;
            }
            .company-info {
              font-size: 9pt;
              color: #6b7280;
              line-height: 1.6;
              text-align: center;
            }
            .company-info span {
              display: inline-block;
              margin: 0 4px;
            }
            /* Document Title - Matching Dialog */
            .document-title {
              text-align: center;
              font-size: 16pt;
              font-weight: bold;
              color: #1a365d;
              margin: 0 0 16px 0;
              padding: 8px 16px;
              background: rgba(26, 54, 93, 0.1);
              border: 1px solid #1a365d;
              border-radius: 4px;
            }
            /* Order Info - Horizontal Compact Layout Matching Dialog */
            .order-info-row {
              display: flex;
              flex-wrap: wrap;
              gap: 12px 8px;
              margin-bottom: 6px;
              font-size: 9pt;
              align-items: center;
            }
            .info-item {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .info-label {
              font-weight: 600;
              color: #6b7280;
              font-size: 9pt;
            }
            .info-value {
              color: #1a1a1a;
              font-size: 9pt;
              word-break: break-word;
            }
            .info-separator {
              color: #9ca3af;
              margin: 0 2px;
            }
            .font-mono {
              font-family: 'Courier New', monospace;
              font-size: 9pt;
            }
            /* Address Row - Separate Row Matching Dialog */
            .address-row {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-top: 6px;
              margin-bottom: 12px;
              font-size: 9pt;
            }
            .address-label {
              font-weight: 600;
              color: #6b7280;
              font-size: 9pt;
            }
            .address-value {
              flex: 1;
              color: #1a1a1a;
              font-size: 9pt;
            }
            .separator {
              height: 1px;
              background: #e5e7eb;
              margin: 12px 0;
              border: none;
            }
            /* Items Section - Matching Dialog */
            .items-section {
              margin: 16px 0;
            }
            .section-title {
              font-size: 14pt;
              font-weight: bold;
              color: #1a365d;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px solid #cbd5e0;
            }
            .table-wrapper {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9pt;
              page-break-inside: auto;
            }
            thead {
              display: table-header-group;
            }
            tbody {
              display: table-row-group;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th {
              background: #1a365d;
              color: white;
              padding: 8px 6px;
              text-align: ${language === 'ar' ? 'right' : 'left'};
              font-weight: bold;
              font-size: 9pt;
              border: 1px solid #1a365d;
            }
            th.text-center {
              text-align: center;
            }
            td {
              padding: 6px;
              border: 1px solid #e5e7eb;
              text-align: ${language === 'ar' ? 'right' : 'left'};
              font-size: 9pt;
              vertical-align: middle;
            }
            td.text-center {
              text-align: center;
            }
            tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            /* Total Section - Matching Dialog */
            .total-container {
              margin-top: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              background: rgba(26, 54, 93, 0.1);
              border: 2px solid #1a365d;
              border-radius: 4px;
            }
            .total-label {
              font-size: 14pt;
              font-weight: bold;
              color: #1a365d;
            }
            .total-value {
              font-size: 20pt;
              font-weight: bold;
              color: #1a1a1a;
              font-family: 'Courier New', monospace;
            }
            /* Footer - Matching Dialog */
            .footer {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 8pt;
              color: #6b7280;
            }
            /* Print Optimizations */
            @media print {
              body {
                width: 100%;
                max-width: none;
                padding: 0;
              }
              .company-header {
                margin-bottom: 12px;
                padding-bottom: 10px;
              }
              .order-info-row {
                gap: 8px 4px;
                margin-bottom: 4px;
              }
              .section-title {
                margin: 12px 0 6px;
              }
              table {
                font-size: 8.5pt;
              }
              th, td {
                padding: 5px 4px;
                font-size: 8pt;
              }
              .total-container {
                margin-top: 10px;
                padding: 10px;
              }
              .total-label {
                font-size: 12pt;
              }
              .total-value {
                font-size: 18pt;
              }
              .footer {
                margin-top: 12px;
                padding-top: 8px;
                font-size: 7.5pt;
              }
              /* Prevent page breaks */
              .order-info-row,
              .address-row,
              .total-container {
                page-break-inside: avoid;
              }
              tbody tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <!-- Company Header -->
          <div class="company-header">
            <div class="company-name">${companyName}</div>
            <div class="company-info">
              <span>${companyAddress}</span>
              <span>|</span>
              <span>${companyPhone}</span>
              <span>|</span>
              <span>${companyEmail}</span>
              <span>|</span>
              <span>${companyWebsite}</span>
              <span>|</span>
              <span>${language === 'ar' ? 'الرقم الضريبي:' : 'Tax Number:'} ${taxNumber}</span>
            </div>
          </div>

          <!-- Document Title -->
          <div class="document-title">${language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}</div>

          <!-- Order Information - Horizontal Compact Layout -->
          <div class="order-info-row">
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'رقم الطلب:' : 'Order #:'}</span>
              <span class="info-value font-mono">#${order.id}</span>
            </div>
            <span class="info-separator">|</span>
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
              <span class="info-value">${orderDate}</span>
            </div>
            <span class="info-separator">|</span>
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'العميل:' : 'Client:'}</span>
              <span class="info-value">${clientName}</span>
            </div>
            <span class="info-separator">|</span>
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
              <span class="info-value">${contactPhone}</span>
            </div>
            <span class="info-separator">|</span>
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'الدفع:' : 'Payment:'}</span>
              <span class="info-value">${paymentMethod}</span>
            </div>
            ${referenceName !== (language === 'ar' ? 'غير محدد' : 'Not specified') ? `
            <span class="info-separator">|</span>
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'المرجع:' : 'Reference:'}</span>
              <span class="info-value">${referenceName}</span>
            </div>
            ` : ''}
            ${warehouseDepartment ? `
            <span class="info-separator">|</span>
            <div class="info-item">
              <span class="info-label">${language === 'ar' ? 'المستودع:' : 'Warehouse:'}</span>
              <span class="info-value">
                ${warehouseDepartment.contactName ? `${warehouseDepartment.contactName}` : ''}
                ${warehouseDepartment.contactPhone ? ` | ${warehouseDepartment.contactPhone}` : ''}
              </span>
            </div>
            ` : ''}
          </div>

          <!-- Address Row -->
          <div class="address-row">
            <span class="address-label">${language === 'ar' ? 'العنوان:' : 'Address:'}</span>
            <span class="address-value">${addressText}</span>
          </div>

          <!-- Separator -->
          <hr class="separator" />

          <!-- Order Items Section -->
          <div class="items-section">
            <h3 class="section-title">${language === 'ar' ? 'العناصر المطلوبة' : 'Order Items'}</h3>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">${language === 'ar' ? 'رمز المنتج' : 'SKU'}</th>
                    <th style="width: 35%;">${language === 'ar' ? 'اسم المنتج' : 'Product Name'}</th>
                    <th class="text-center" style="width: 12%;">${language === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th class="text-center" style="width: 18%;">${language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th class="text-center" style="width: 20%;">${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${enrichedItems.map((item, index) => {
                    const itemName = language === 'ar' 
                      ? (item.nameAr || item.nameEn || item.name || '')
                      : (item.nameEn || item.nameAr || item.name || '');
                    return `
                    <tr>
                      <td class="font-mono">${item.sku}</td>
                      <td>${itemName}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-center font-mono">${item.price}</td>
                      <td class="text-center font-mono">${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Total Section -->
          <div class="total-container">
            <span class="total-label">${language === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'}</span>
            <span class="total-value">ILS ${order.totalAmount}</span>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>${companyName} – ${companyEmail} – ${companyWebsite}</p>
          </div>

          <script>
            if (document.readyState === 'complete') {
              setTimeout(() => window.print(), 300);
            } else {
              window.addEventListener('load', function() {
                setTimeout(() => window.print(), 300);
              });
            }
          </script>
        </body>
      </html>
    `;

      printWindow.document.write(html);
      printWindow.document.close();
    };
  }, [
    order, language, client, deliveryLocation, ltaData, warehouseDepartment, enrichedItems, toast
  ]);

  // Format date
  const orderDate = formatDateLocalized(new Date(order.createdAt), language as 'ar' | 'en');
  const companyName = 'شركة القاضي للمواد الاستهلاكية والتسويق';
  const companyAddress = 'البيرة – أمّ الشرايط، فلسطين';
  const companyPhone = '009705925555532 (قسم المبيعات)';
  const companyEmail = 'info@qadi.ps';
  const companyWebsite = 'qadi.ps';
  const taxNumber = '562565515';
  const clientName = client?.nameAr || client?.nameEn || (language === 'ar' ? 'غير محدد' : 'Not specified');
  const addressText = deliveryLocation
    ? language === 'ar'
      ? deliveryLocation.addressAr || deliveryLocation.addressEn
      : deliveryLocation.addressEn || deliveryLocation.addressAr
    : language === 'ar'
    ? 'غير محدد'
    : 'Not specified';
  const contactPhone = client?.phone || deliveryLocation?.phone || (language === 'ar' ? 'غير محدد' : 'Not specified');
  const paymentMethod = language === 'ar' ? 'سيتم تحديدها لاحقاً' : 'To be determined later';
  const referenceName = ltaData
    ? language === 'ar'
      ? ltaData.nameAr || ltaData.nameEn
      : ltaData.nameEn || ltaData.nameAr
    : language === 'ar'
    ? 'غير محدد'
    : 'Not specified';

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Company Header */}
      <div className="border-b-2 border-primary pb-3 mb-4">
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-primary">
            {companyName}
          </h1>
        </div>
        <div className="text-center text-xs text-muted-foreground space-x-2">
          <span>{companyAddress}</span>
          <span>|</span>
          <span>{companyPhone}</span>
          <span>|</span>
          <span>{companyEmail}</span>
          <span>|</span>
          <span>{companyWebsite}</span>
          <span>|</span>
          <span>{language === 'ar' ? 'الرقم الضريبي:' : 'Tax Number:'} {taxNumber}</span>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center py-2 px-4 bg-primary/10 border border-primary rounded">
        <h2 className="text-lg font-bold text-primary">
          {language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}
        </h2>
      </div>

      {/* Order Information - Compact Horizontal */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">
            {language === 'ar' ? 'رقم الطلب:' : 'Order #:'}
          </span>
          <span className="font-mono">#{order.id}</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">
            {language === 'ar' ? 'التاريخ:' : 'Date:'}
          </span>
          <span>{orderDate}</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">
            {language === 'ar' ? 'العميل:' : 'Client:'}
          </span>
          <span className="truncate max-w-[150px]">{clientName}</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">
            {language === 'ar' ? 'الهاتف:' : 'Phone:'}
          </span>
          <span>{contactPhone}</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">
            {language === 'ar' ? 'الدفع:' : 'Payment:'}
          </span>
          <span>{paymentMethod}</span>
        </div>
        {referenceName !== (language === 'ar' ? 'غير محدد' : 'Not specified') && (
          <>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">
                {language === 'ar' ? 'المرجع:' : 'Reference:'}
              </span>
              <span className="truncate max-w-[120px]">{referenceName}</span>
            </div>
          </>
        )}
        {warehouseDepartment && (
          <>
            <span className="text-muted-foreground">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">
                {language === 'ar' ? 'المستودع:' : 'Warehouse:'}
              </span>
              <span className="text-xs">
                {warehouseDepartment.contactName ? `${warehouseDepartment.contactName}` : ''}
                {warehouseDepartment.contactPhone ? ` | ${warehouseDepartment.contactPhone}` : ''}
              </span>
            </div>
          </>
        )}
      </div>
      {/* Address Row */}
      <div className="flex items-center gap-2 text-xs mt-1.5">
        <span className="font-semibold text-muted-foreground">
          {language === 'ar' ? 'العنوان:' : 'Address:'}
        </span>
        <span className="flex-1">{addressText}</span>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
            title={language === 'ar' ? 'افتح في الخريطة' : 'Open in Maps'}
          >
            <MapPin className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <Separator />

      {/* Order Items Section */}
      <div>
        <h3 className="text-base font-bold text-primary mb-2 pb-1 border-b">
          {language === 'ar' ? 'العناصر المطلوبة' : 'Order Items'}
        </h3>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground">
                <TableHead style={{ width: '15%' }}>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                <TableHead style={{ width: '35%' }}>{language === 'ar' ? 'اسم المنتج' : 'Product Name'}</TableHead>
                <TableHead style={{ width: '12%' }} className="text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                <TableHead style={{ width: '18%' }} className="text-center">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                <TableHead style={{ width: '20%' }} className="text-center">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedItems.map((item, index) => {
                const itemName = language === 'ar' 
                  ? (item.nameAr || item.nameEn || item.name || '')
                  : (item.nameEn || item.nameAr || item.name || '');
                return (
                <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell className="text-xs">{itemName}</TableCell>
                  <TableCell className="text-center text-xs">{item.quantity}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{item.price}</TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    {(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Total Section */}
      <div className="flex justify-between items-center p-3 bg-primary/10 border-2 border-primary rounded">
        <span className="text-base font-bold text-primary">
          {language === 'ar' ? 'المجموع الكلي:' : 'Total Amount:'}
        </span>
        <span className="text-xl font-bold font-mono">ILS {order.totalAmount}</span>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-3 border-t">
        <p>
          {companyName} – {companyEmail} – {companyWebsite}
        </p>
      </div>

      {/* Print Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handlePrintOrderConfirmation}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          {language === 'ar' ? 'طباعة' : 'Print'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  const [hideDoneAndCancelled, setHideDoneAndCancelled] = useState(false);
  const queryClient = useQueryClient();


  // Fetch all orders for virtual scrolling
  const { data: allOrdersData, isLoading: isLoadingAll } = useQuery<any>({
    queryKey: ['/api/admin/orders', 'all'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders?all=true`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: useVirtualScrolling,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch paginated orders with optimized caching
  const { data: ordersData = { orders: [], totalPages: 1 }, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/orders', currentPage, itemsPerPage, statusFilter, debouncedSearchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders?page=${currentPage}&pageSize=${itemsPerPage}&status=${statusFilter}&search=${debouncedSearchQuery}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !useVirtualScrolling,
    placeholderData: (previousData: any) => previousData,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });

  const orders = useVirtualScrolling ? allOrdersData?.orders || [] : ordersData?.orders || [];
  const totalPages = useVirtualScrolling ? 1 : ordersData?.totalPages || 1;

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
    queryFn: async () => {
      const res = await fetch('/api/admin/clients', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/admin/ltas'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ltas', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch LTAs');
      return res.json();
    },
  });


  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update order status' }));
        throw new Error(errorData.message || 'Failed to update order status');
      }

      return response.json();
    },
    onSuccess: (updatedOrder, { orderId, status }) => {
      // Update all relevant query caches
      queryClient.setQueriesData(
        { queryKey: ['/api/admin/orders'] },
        (oldData: any) => {
          if (!oldData || !oldData.orders) return oldData;
          return {
            ...oldData,
            orders: oldData.orders.map((order: Order) =>
              order.id === orderId
                ? { ...order, status: status, updatedAt: new Date().toISOString() }
                : order
            ),
          };
        }
      );

      toast({
        title: language === 'ar' ? 'تم تحديث الحالة' : 'Status Updated',
        description: language === 'ar' ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/client/orders'] });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to delete order');
      }
    },
    onMutate: async (deletedOrderId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/admin/orders'] });
      const previousOrders = queryClient.getQueryData(['/api/admin/orders']);
      queryClient.setQueryData(['/api/admin/orders', currentPage, itemsPerPage, statusFilter, debouncedSearchQuery], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          orders: oldData.orders.filter((order: Order) => order.id !== deletedOrderId),
        };
      });
      return { previousOrders };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['/api/admin/orders', currentPage, itemsPerPage, statusFilter, debouncedSearchQuery], context.previousOrders);
      }
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الطلب بنجاح' : 'Order deleted successfully',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
  });

  const bulkDeleteOrdersMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const response = await fetch('/api/admin/orders/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete orders');
      }
    },
    onMutate: async (deletedOrderIds) => {
      await queryClient.cancelQueries({ queryKey: ['/api/admin/orders'] });
      const previousOrders = queryClient.getQueryData(['/api/admin/orders']);
      queryClient.setQueryData(['/api/admin/orders', currentPage, itemsPerPage, statusFilter, debouncedSearchQuery], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          orders: oldData.orders.filter((order: Order) => !deletedOrderIds.includes(order.id)),
        };
      });
      return { previousOrders };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['/api/admin/orders', currentPage, itemsPerPage, statusFilter, debouncedSearchQuery], context.previousOrders);
      }
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الطلبات بنجاح' : 'Orders deleted successfully',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : clientId;
  };

  const getLtaName = (ltaId: string | null) => {
    if (!ltaId) return '-';
    const lta = ltas.find(l => l.id === ltaId);
    return lta ? lta.name : ltaId;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string; labelAr: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800', label: 'Pending', labelAr: 'قيد الانتظار' },
      confirmed: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800', label: 'Confirmed', labelAr: 'مؤكد' },
      processing: { className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800', label: 'Processing', labelAr: 'قيد المعالجة' },
      shipped: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800', label: 'Shipped', labelAr: 'تم الشحن' },
      delivered: { className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800', label: 'Delivered', labelAr: 'تم التسليم' },
      cancelled: { className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800', label: 'Cancelled', labelAr: 'ملغي' },
    };

    const config = statusConfig[status] || { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-300 dark:border-gray-800', label: status, labelAr: status };
    return (
      <Badge variant="outline" className={config.className} data-testid={`badge-status-${status}`}>
        {language === 'ar' ? config.labelAr : config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'PPp', { locale: language === 'ar' ? ar : enUS });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleDeleteOrder = (orderId: string) => {
    deleteOrderMutation.mutate(orderId);
  };

  const handleBulkDeleteOrders = () => {
    bulkDeleteOrdersMutation.mutate(Array.from(selectedOrders));
  };

  const handlePrintOrder = (order: Order) => {
    const items = safeJsonParse<OrderItem[]>(order.items, []);
    const client = clients.find(c => c.id === order.clientId);
    const lta = ltas.find(l => l.id === order.ltaId);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل فتح نافذة الطباعة' : 'Failed to open print window',
      });
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${language === 'ar' ? 'طلب' : 'Order'} #${order.id.slice(0, 8)}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #d4af37;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1a365d;
              margin-bottom: 10px;
            }
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-block {
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .info-value {
              color: #111827;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #1a365d;
              color: white;
              padding: 12px;
              text-align: left;
            }
            td {
              border-bottom: 1px solid #e5e7eb;
              padding: 12px;
            }
            .total {
              text-align: right;
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #d4af37;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">
              ${language === 'ar' ? 'شركة القاضي التجارية' : 'Al Qadi Trading Company'}
            </div>
            <div style="color: #6b7280;">${language === 'ar' ? 'تفاصيل الطلب' : 'Order Details'}</div>
          </div>

          <div class="order-info">
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'رقم الطلب' : 'Order ID'}</div>
              <div class="info-value">${order.id}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'التاريخ' : 'Date'}</div>
              <div class="info-value">${formatDate(order.createdAt)}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'العميل' : 'Client'}</div>
              <div class="info-value">${client ? client.name : '-'}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'الاتفاقية' : 'LTA'}</div>
              <div class="info-value">${lta ? lta.name : '-'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${language === 'ar' ? '#' : 'No.'}</th>
                <th>${language === 'ar' ? 'رمز المنتج' : 'SKU'}</th>
                <th>${language === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>${language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>${language === 'ar' ? 'السعر' : 'Price'}</th>
                <th>${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.sku}</td>
                  <td>${language === 'ar' ? item.nameAr : item.nameEn}</td>
                  <td>${item.quantity}</td>
                  <td>${item.price}</td>
                  <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            ${language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}: ${order.totalAmount}
          </div>

          <div class="no-print" style="text-align: center; margin-top: 40px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 100);" style="padding: 12px 24px; background: #1a365d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              ${language === 'ar' ? 'طباعة' : 'Print'}
            </button>
          </div>

          <script>
            if (document.readyState === 'complete') {
              window.print();
            } else {
              window.addEventListener('load', function() {
                setTimeout(() => {
                  window.print();
                }, 100);
              });
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };


  const handleShareOrder = (order: Order) => {
    const shareUrl = `${window.location.origin}/admin/orders?orderId=${order.id}`;

    if (navigator.share) {
      navigator.share({
        title: `${language === 'ar' ? 'طلب' : 'Order'} #${order.id.slice(0, 8)}`,
        text: `${language === 'ar' ? 'تفاصيل الطلب' : 'Order details'}: ${order.totalAmount}`,
        url: shareUrl,
      }).catch(() => {
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: language === 'ar' ? 'تم النسخ' : 'Copied',
        description: language === 'ar' ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard',
      });
    });
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map((o: Order) => o.id)));
    }
  };

  const handleBulkPrint = () => {
    selectedOrders.forEach(orderId => {
      const order = orders.find((o: Order) => o.id === orderId);
      if (order) handlePrintOrder(order);
    });
  };


  const handleExportToExcel = (orders: Order[]) => {
    const headers = language === 'ar' 
      ? ['رقم الطلب', 'العميل', 'الاتفاقية', 'التاريخ', 'الحالة', 'عدد المنتجات', 'الإجمالي']
      : ['Order ID', 'Client', 'LTA', 'Date', 'Status', 'Items', 'Total'];
    
    let csv = headers.join(',') + '\n';
    
    orders.forEach(order => {
      const clientName = getClientName(order.clientId);
      const ltaName = order.ltaId ? (ltas.find((l: any) => l.id === order.ltaId)?.name || '-') : '-';
      const items = safeJsonParse<OrderItem[]>(order.items, []);
      
      const statusLabels: Record<string, {en: string, ar: string}> = {
        pending: {en: 'Pending', ar: 'قيد الانتظار'},
        confirmed: {en: 'Confirmed', ar: 'مؤكد'},
        processing: {en: 'Processing', ar: 'قيد المعالجة'},
        shipped: {en: 'Shipped', ar: 'تم الشحن'},
        delivered: {en: 'Delivered', ar: 'تم التوصيل'},
        cancelled: {en: 'Cancelled', ar: 'ملغى'}
      };
      
      const statusText = statusLabels[order.status]?.[language] || order.status;
      
      const row = [
        order.id,
        clientName,
        ltaName,
        formatDateLocalized(new Date(order.createdAt), language),
        statusText,
        items.length.toString(),
        order.totalAmount
      ];
      
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير الطلبات بنجاح' : 'Orders exported successfully',
    });
  };

  // Filter and search orders
  const filteredOrders = (orders || []).filter((order: Order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(order.clientId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pipefyCardId?.toLowerCase().includes(searchQuery.toLowerCase());

    // Hide done (delivered) and cancelled if toggle is on
    const shouldShow = !hideDoneAndCancelled || (order.status !== 'delivered' && order.status !== 'cancelled');

    return matchesStatus && matchesSearch && shouldShow;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    startTransition(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id}
      className="border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-xl dark:hover:shadow-[#d4af37]/30 transition-all duration-300 bg-card/50 dark:bg-card/30 backdrop-blur-sm group"
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={selectedOrders.has(order.id)}
                onChange={() => toggleOrderSelection(order.id)}
                className="rounded border-gray-300 shrink-0 h-4 w-4 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37]"
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="font-mono text-sm font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  #{order.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate ps-6">
              {getClientName(order.clientId)}
            </p>
          </div>
          <Select
            value={order.status}
            onValueChange={(value) => handleStatusChange(order.id, value)}
          >
            <SelectTrigger className="w-auto border-border/30 dark:border-[#d4af37]/10">
              {getStatusBadge(order.status)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
              <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
              <SelectItem value="shipped">{language === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
              <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
              <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/30">
            <span className="text-xs text-muted-foreground font-medium">
              {language === 'ar' ? 'المبلغ' : 'Amount'}
            </span>
            <span className="font-mono font-bold text-sm">{order.totalAmount}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 dark:bg-muted/20 border border-border/30">
            <span className="text-xs text-muted-foreground font-medium">
              {language === 'ar' ? 'التاريخ' : 'Date'}
            </span>
            <span className="text-xs font-medium truncate">{formatDateLocalized(new Date(order.createdAt), language)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(order)}
            className="flex-1 hover:bg-primary hover:text-primary-foreground dark:hover:bg-[#d4af37] dark:hover:text-black transition-all"
          >
            <Eye className="h-4 w-4 me-1" />
            {language === 'ar' ? 'عرض' : 'View'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShareOrder(order)}
            className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
            title={language === 'ar' ? 'مشاركة' : 'Share'}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteOrder(order.id)}
            className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-all"
            title={language === 'ar' ? 'حذف' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black" data-testid="page-admin-orders">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/95 backdrop-blur-xl shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="shrink-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all"
              data-testid="button-back-admin"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10 shrink-0">
                <Package className="h-5 w-5 text-primary dark:text-[#d4af37]" />
              </div>
              <h1 className="text-xl font-semibold truncate bg-gradient-to-r from-primary to-primary/70 dark:from-[#d4af37] dark:to-[#d4af37]/70 bg-clip-text text-transparent">
                {language === 'ar' ? 'إدارة الطلبات' : 'Orders Management'}
              </h1>
            </div>
            {orders.length > 0 && (
              <Badge variant="secondary" className="hidden sm:inline-flex shrink-0 bg-primary/10 dark:bg-[#d4af37]/10 text-primary dark:text-[#d4af37] border-primary/20 dark:border-[#d4af37]/20">
                {orders.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        <Card className="border-border/50 dark:border-[#d4af37]/20 shadow-xl bg-card/50 dark:bg-card/30 backdrop-blur-sm">
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10">
                <Package className="h-6 w-6 text-primary dark:text-[#d4af37]" />
              </div>
              {language === 'ar' ? 'جميع الطلبات' : 'All Orders'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary dark:group-focus-within:text-[#d4af37]" />
                  <Input
                    placeholder={language === 'ar' ? 'البحث في الطلبات...' : 'Search orders...'}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9 h-11 border-border/50 dark:border-[#d4af37]/20 focus-visible:ring-primary dark:focus-visible:ring-[#d4af37] bg-background/50 dark:bg-background/30 transition-all"
                    data-testid="input-search-orders"
                  />
                </div>

                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="h-11 border-border/50 dark:border-[#d4af37]/20 bg-background/50 dark:bg-background/30 transition-all" data-testid="select-filter-status">
                    <SelectValue placeholder={language === 'ar' ? 'جميع الحالات' : 'All Statuses'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</SelectItem>
                    <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                    <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                    <SelectItem value="processing">{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</SelectItem>
                    <SelectItem value="shipped">{language === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
                    <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                    <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="virtual-scroll"
                      checked={useVirtualScrolling}
                      onCheckedChange={setUseVirtualScrolling}
                    />
                    <Label htmlFor="virtual-scroll">{language === 'ar' ? 'التمرير الافتراضي' : 'Virtual Scrolling'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hide-done"
                      checked={hideDoneAndCancelled}
                      onCheckedChange={setHideDoneAndCancelled}
                    />
                    <Label htmlFor="hide-done">{language === 'ar' ? 'إخفاء المكتمل والملغي' : 'Hide Done & Cancelled'}</Label>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar'
                    ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} من ${filteredOrders.length} طلب`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} of ${filteredOrders.length} orders`
                  }
                </div>

                {selectedOrders.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {selectedOrders.size} {language === 'ar' ? 'محدد' : 'selected'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkPrint}
                    >
                      <Printer className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'طباعة' : 'Print'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportToExcel(Array.from(selectedOrders).map(id => orders.find((o: Order) => o.id === id)).filter(Boolean) as Order[])}
                    >
                      <FileSpreadsheet className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'Excel' : 'Excel'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteOrders}
                    >
                      <Trash2 className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {(isLoading || isLoadingAll) ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border border-border/50 dark:border-[#d4af37]/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {useVirtualScrolling ? (
                    <VirtualList
                      items={filteredOrders}
                      renderItem={(order: Order, index: number) => renderOrderCard(order)}
                      estimateSize={200}
                      height="calc(100vh - 300px)"
                      keyExtractor={(order: Order) => order.id}
                    />
                  ) : (
                    paginatedOrders.map((order: Order) => renderOrderCard(order))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block border border-border/50 dark:border-[#d4af37]/20 rounded-lg overflow-hidden bg-card/30 dark:bg-card/20 backdrop-blur-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 dark:hover:bg-muted/40">
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleAllOrders}
                            className="rounded border-gray-300 h-4 w-4 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37]"
                          />
                        </TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'رقم الطلب' : 'Order ID'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'الاتفاقية' : 'LTA'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead className="font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                        <TableHead className="text-end font-semibold">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order: Order) => (
                        <TableRow
                          key={order.id}
                          data-testid={`row-order-${order.id}`}
                          className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors group"
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.id)}
                              onChange={() => toggleOrderSelection(order.id)}
                              className="rounded border-gray-300 h-4 w-4 text-primary dark:text-[#d4af37] focus:ring-primary dark:focus:ring-[#d4af37]"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold">
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              #{order.id.slice(0, 8)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{getClientName(order.clientId)}</TableCell>
                          <TableCell className="text-muted-foreground">{getLtaName(order.ltaId)}</TableCell>
                          <TableCell className="font-mono font-semibold">{order.totalAmount}</TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-36 border-border/30 dark:border-[#d4af37]/10">
                                {getStatusBadge(order.status)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                                <SelectItem value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</SelectItem>
                                <SelectItem value="shipped">{language === 'ar' ? 'تم الشحن' : 'Shipped'}</SelectItem>
                                <SelectItem value="delivered">{language === 'ar' ? 'تم التسليم' : 'Delivered'}</SelectItem>
                                <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm">{formatDateLocalized(new Date(order.createdAt), language)}</TableCell>
                          <TableCell className="text-end">
                            <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                                data-testid={`button-view-${order.id}`}
                                className="hover:bg-primary hover:text-primary-foreground dark:hover:bg-[#d4af37] dark:hover:text-black transition-all"
                              >
                                <Eye className="h-4 w-4 me-1" />
                                {language === 'ar' ? 'عرض' : 'View'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintOrder(order)}
                                className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
                                title={language === 'ar' ? 'طباعة' : 'Print'}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShareOrder(order)}
                                className="h-9 w-9 p-0 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all"
                                title={language === 'ar' ? 'مشاركة' : 'Share'}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-all"
                                title={language === 'ar' ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && !useVirtualScrolling && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar'
                        ? `صفحة ${currentPage} من ${totalPages}`
                        : `Page ${currentPage} of ${totalPages}`
                      }
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        {language === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        {language === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-order-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === 'ar' ? 'تأكيد الطلب' : 'Order Confirmation'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'عرض تفاصيل الطلب الكاملة والحالة والعناصر'
                : 'View complete order details, status, and items'}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <>
              <AdminOrderDetailsContent 
                order={selectedOrder} 
                language={language}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}