import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { FileText, Eye, Check, X, ArrowLeft, User, LogOut, Package, Printer, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import { formatDateLocalized } from "@/lib/dateUtils";
import { DocumentViewer } from "@/components/DocumentViewer";
import type { PriceOffer } from "@shared/schema";

export default function ClientPriceOffersPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseAction, setResponseAction] = useState<"accept" | "reject">("accept");
  const [responseNote, setResponseNote] = useState("");

  const { data: offers = [], isLoading } = useQuery<PriceOffer[]>({
    queryKey: ["/api/price-offers"],
  });

  const responseMutation = useMutation({
    mutationFn: async (data: { offerId: string; action: "accept" | "reject"; note?: string }) => {
      const res = await apiRequest("POST", `/api/price-offers/${data.offerId}/respond`, {
        action: data.action,
        note: data.note,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم إرسال الرد" : "Response Sent",
        description: language === "ar" ? "تم إرسال ردك بنجاح" : "Your response has been sent successfully",
      });
      setResponseDialogOpen(false);
      setResponseNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/price-offers"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "فشل إرسال الرد" : "Failed to send response"),
        variant: "destructive",
      });
    },
  });

  const handleViewOffer = async (offer: PriceOffer) => {
    setSelectedOffer(offer);
    setViewDialogOpen(true);

    if (offer.status === "sent") {
      try {
        await apiRequest("POST", `/api/price-offers/${offer.id}/view`, {});
        queryClient.invalidateQueries({ queryKey: ["/api/price-offers"] });
      } catch (error) {
        console.error("Failed to mark offer as viewed:", error);
      }
    }
  };

  const handleResponse = (offer: PriceOffer, action: "accept" | "reject") => {
    setSelectedOffer(offer);
    setResponseAction(action);
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = () => {
    if (!selectedOffer) return;

    responseMutation.mutate({
      offerId: selectedOffer.id,
      action: responseAction,
      note: responseNote || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "Draft", labelAr: "مسودة", variant: "secondary" },
      sent: { label: "Sent", labelAr: "مرسل", variant: "default" },
      viewed: { label: "Viewed", labelAr: "تمت المشاهدة", variant: "outline" },
      accepted: { label: "Accepted", labelAr: "مقبول", variant: "default" },
      rejected: { label: "Rejected", labelAr: "مرفوض", variant: "destructive" },
      expired: { label: "Expired", labelAr: "منتهي", variant: "secondary" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant}>
        {language === "ar" ? config.labelAr : config.label}
      </Badge>
    );
  };

  const handlePrintOffer = (offer: PriceOffer) => {
    const items = typeof offer.items === "string" ? JSON.parse(offer.items) : offer.items;

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
      <html dir="${language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <title>${language === 'ar' ? 'عرض سعر' : 'Price Offer'} #${offer.offerNumber}</title>
          <meta charset="UTF-8">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: ${language === 'ar' ? 'Arial' : 'Arial, sans-serif'};
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              direction: ${language === 'ar' ? 'rtl' : 'ltr'};
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
            .offer-info {
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
              text-align: ${language === 'ar' ? 'right' : 'left'};
            }
            td {
              border-bottom: 1px solid #e5e7eb;
              padding: 12px;
              text-align: ${language === 'ar' ? 'right' : 'left'};
            }
            .total-section {
              margin-top: 30px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .grand-total {
              font-size: 20px;
              font-weight: bold;
              border-top: 2px solid #d4af37;
              padding-top: 12px;
              margin-top: 12px;
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
            <div style="color: #6b7280;">${language === 'ar' ? 'عرض سعر' : 'Price Offer'}</div>
          </div>

          <div class="offer-info">
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'رقم العرض' : 'Offer Number'}</div>
              <div class="info-value">${offer.offerNumber}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'التاريخ' : 'Date'}</div>
              <div class="info-value">${formatDateLocalized(new Date(offer.createdAt), language)}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'الحالة' : 'Status'}</div>
              <div class="info-value">${offer.status === 'pending' ? (language === 'ar' ? 'قيد الانتظار' : 'Pending') : 
                offer.status === 'accepted' ? (language === 'ar' ? 'مقبول' : 'Accepted') : 
                (language === 'ar' ? 'مرفوض' : 'Rejected')}</div>
            </div>
            <div class="info-block">
              <div class="info-label">${language === 'ar' ? 'صالح حتى' : 'Valid Until'}</div>
              <div class="info-value">${offer.validUntil ? formatDateLocalized(new Date(offer.validUntil), language) : '-'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${language === 'ar' ? '#' : 'No.'}</th>
                <th>${language === 'ar' ? 'رمز المنتج' : 'SKU'}</th>
                <th>${language === 'ar' ? 'المنتج' : 'Product'}</th>
                <th>${language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th>${language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th>${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.sku || '-'}</td>
                  <td>${language === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}</td>
                  <td>${item.quantity}</td>
                  <td>${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td>${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>${language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}:</span>
              <span>${offer.subtotal}</span>
            </div>
            <div class="total-row">
              <span>${language === 'ar' ? 'الضريبة' : 'Tax'}:</span>
              <span>${offer.tax || 0}</span>
            </div>
            <div class="total-row grand-total">
              <span>${language === 'ar' ? 'المجموع الكلي' : 'Grand Total'}:</span>
              <span>${offer.total}</span>
            </div>
          </div>

          ${offer.notes ? `
            <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${language === 'ar' ? 'ملاحظات' : 'Notes'}:</div>
              <div style="white-space: pre-wrap;">${offer.notes}</div>
            </div>
          ` : ''}

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

  const handleExportToExcel = (offers: PriceOffer[]) => {
    // Create CSV content
    const headers = language === 'ar' 
      ? ['رقم العرض', 'التاريخ', 'الحالة', 'المجموع الفرعي', 'الضريبة', 'الإجمالي', 'صالح حتى']
      : ['Offer Number', 'Date', 'Status', 'Subtotal', 'Tax', 'Total', 'Valid Until'];
    
    let csv = headers.join(',') + '\n';
    
    offers.forEach(offer => {
      const status = offer.status === 'pending' ? (language === 'ar' ? 'قيد الانتظار' : 'Pending') :
                     offer.status === 'accepted' ? (language === 'ar' ? 'مقبول' : 'Accepted') :
                     (language === 'ar' ? 'مرفوض' : 'Rejected');
      
      const row = [
        offer.offerNumber,
        formatDateLocalized(new Date(offer.createdAt), language),
        status,
        offer.subtotal,
        offer.tax || 0,
        offer.total,
        offer.validUntil ? formatDateLocalized(new Date(offer.validUntil), language) : '-'
      ];
      
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-offers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير عروض الأسعار بنجاح' : 'Price offers exported successfully',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300"
              title={language === 'ar' ? 'العودة للطلبات' : 'Back to Ordering'}
            >
              <Link href="/ordering">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'عروض الأسعار' : 'Price Offers'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            {user?.isAdmin && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin">
                  <Package className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <NotificationCenter />
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => window.location.href = "/api/logout"}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 relative">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {language === "ar" ? "عروض الأسعار الخاصة بك" : "Your Price Offers"}
            </h2>
            {offers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportToExcel(offers)}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {language === "ar" ? "تصدير Excel" : "Export to Excel"}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted"></CardHeader>
                  <CardContent className="h-32 bg-muted/50"></CardContent>
                </Card>
              ))}
            </div>
          ) : offers.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد عروض أسعار" : "No price offers available"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => {
                const items = typeof offer.items === "string" ? JSON.parse(offer.items) : offer.items;
                const isExpired = offer.status === "expired";
                const canRespond = offer.status === "sent" || offer.status === "viewed";

                return (
                  <Card key={offer.id} className={isExpired ? "opacity-60" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{offer.offerNumber}</CardTitle>
                            {offer.requestId && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {language === 'ar' ? 'من طلب' : 'From Request'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDateLocalized(new Date(offer.createdAt), language)}
                          </p>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {language === "ar" ? "عدد المنتجات" : "Products"}
                        </span>
                        <span className="font-medium">{items.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {language === "ar" ? "الإجمالي" : "Total"}
                        </span>
                        <span className="font-bold text-lg">${offer.total}</span>
                      </div>
                      {offer.validUntil && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {language === "ar" ? "صالح حتى" : "Valid Until"}
                          </span>
                          <span className="font-medium">
                            {formatDateLocalized(new Date(offer.validUntil), language)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewOffer(offer)}
                        data-testid={`button-view-${offer.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {language === "ar" ? "عرض" : "View"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintOffer(offer)}
                        title={language === "ar" ? "طباعة" : "Print"}
                        data-testid={`button-print-${offer.id}`}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {canRespond && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResponse(offer, "accept")}
                            data-testid={`button-accept-${offer.id}`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {language === "ar" ? "قبول" : "Accept"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleResponse(offer, "reject")}
                            data-testid={`button-reject-${offer.id}`}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {language === "ar" ? "رفض" : "Reject"}
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* View Offer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOffer?.offerNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}:</span>
                  <div className="mt-1">{getStatusBadge(selectedOffer.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "التاريخ" : "Date"}:</span>
                  <div className="mt-1 font-medium">
                    {formatDateLocalized(new Date(selectedOffer.createdAt), language)}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">{language === "ar" ? "المنتجات" : "Products"}</h4>
                {(typeof selectedOffer.items === "string" ? JSON.parse(selectedOffer.items) : selectedOffer.items).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0">
                    <span>{language === "ar" ? item.nameAr : item.nameEn}</span>
                    <span className="font-medium">{item.quantity} × ${item.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>{language === "ar" ? "الإجمالي (شامل الضريبة)" : "Total (Tax Included)"}:</span>
                <span>${selectedOffer.total}</span>
              </div>

              {selectedOffer.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{language === "ar" ? "ملاحظات" : "Notes"}</h4>
                  <p className="text-sm text-muted-foreground">{selectedOffer.notes}</p>
                </div>
              )}

              {/* Related Documents */}
              <DocumentViewer
                relatedId={selectedOffer.id}
                relatedType="priceOffer"
                showTitle={true}
                className="mt-4"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseAction === "accept"
                ? language === "ar" ? "قبول العرض" : "Accept Offer"
                : language === "ar" ? "رفض العرض" : "Reject Offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {responseAction === "accept"
                ? language === "ar"
                  ? "هل أنت متأكد من قبول هذا العرض؟"
                  : "Are you sure you want to accept this offer?"
                : language === "ar"
                ? "يرجى تقديم سبب الرفض"
                : "Please provide a reason for rejection"}
            </p>
            <Textarea
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder={language === "ar" ? "ملاحظات..." : "Notes..."}
              rows={4}
              data-testid="textarea-response-note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={responseMutation.isPending}
              variant={responseAction === "accept" ? "default" : "destructive"}
              data-testid="button-confirm-response"
            >
              {responseMutation.isPending
                ? language === "ar" ? "جاري الإرسال..." : "Sending..."
                : responseAction === "accept"
                ? language === "ar" ? "قبول" : "Accept"
                : language === "ar" ? "رفض" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}