import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Printer, MapPin } from 'lucide-react';
import { formatDateLocalized } from '@/lib/dateUtils';
import { apiRequest } from '@/lib/queryClient';
import { safeJsonParse } from '@/lib/safeJson';

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

interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: string;
}

interface ClientData {
  client?: {
    nameAr?: string;
    nameEn?: string;
    phone?: string;
  };
  locations?: Array<{
    isHeadquarters?: boolean;
    addressAr?: string;
    addressEn?: string;
    phone?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
  }>;
  departments?: Array<{
    departmentType?: string;
    contactName?: string;
    contactPhone?: string;
  }>;
}

interface LtaData {
  nameAr?: string;
  nameEn?: string;
}

interface Product {
  id: string;
  sku: string;
  name?: string;
  nameEn?: string;
  nameAr?: string;
}

interface AdminOrderDetailsContentProps {
  order: Order;
  language: string;
}

export function AdminOrderDetailsContent({ 
  order, 
  language
}: AdminOrderDetailsContentProps): JSX.Element {
  const { toast } = useToast();
  
  // Fetch client information
  const { data: clientData } = useQuery<ClientData>({
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
  const deliveryLocation = clientLocations.find((loc) => loc.isHeadquarters) || clientLocations[0];

  // Find warehouse department
  const warehouseDepartment = clientDepartments.find((dept) => dept.departmentType === 'warehouse');

  // Fetch LTA information
  const { data: ltaData } = useQuery<LtaData>({
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
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/products/all');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  // Enrich items with product names
  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      // First, try to find product by multiple matching strategies
      const product = allProducts.find((p) => {
        // Try exact matches first
        if (p.id === item.productId) return true;
        if (p.sku === item.sku) return true;
        // Try case-insensitive SKU match
        if (p.sku?.toLowerCase() === item.sku?.toLowerCase()) return true;
        return false;
      });
      
      // Get product name - check for nameEn/nameAr if name doesn't exist
      const productName = product?.name || product?.nameEn || product?.nameAr;
      
      // Priority: 1) product name, 2) item's existing name, 3) SKU, 4) Unknown Product
      const displayName = productName || item.name || (item.sku ? `Product (${item.sku})` : 'Unknown Product');
      
      return {
        ...item,
        name: displayName,
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
                  ${enrichedItems.map((item) => {
                    return `
                    <tr>
                      <td class="font-mono">${item.sku}</td>
                      <td>${item.name}</td>
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
          <h1 className="text-lg sm:text-xl font-bold text-primary">
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
        <h2 className="text-base sm:text-lg font-bold text-primary">
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
                return (
                <TableRow key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell className="text-xs">{item.name}</TableCell>
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

