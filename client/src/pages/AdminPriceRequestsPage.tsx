import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, Clock, CheckCircle, Package, Loader2, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatDateLocalized } from "@/lib/dateUtils";
import type { PriceRequest, Client, Lta } from "@shared/schema";
import Link from "next/link";


export default function AdminPriceRequestsPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfRequest, setPdfRequest] = useState<PriceRequest | null>(null);
  const [pdfLanguage, setPdfLanguage] = useState<'en' | 'ar'>('en');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false); // Added for offer dialog

  const { data: requests = [], isLoading } = useQuery<PriceRequest[]>({
    queryKey: ["/api/admin/price-requests"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: ltas = [] } = useQuery<Lta[]>({
    queryKey: ["/api/ltas"],
  });

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? (language === "ar" ? client.nameAr : client.nameEn) : clientId;
  };

  const getLtaName = (ltaId: string) => {
    const lta = ltas.find((l) => l.id === ltaId);
    return lta ? (language === "ar" ? lta.nameAr : lta.nameEn) : ltaId;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "Pending", labelAr: "قيد الانتظار", variant: "default" },
      processed: { label: "Processed", labelAr: "تمت المعالجة", variant: "secondary" },
      cancelled: { label: "Cancelled", labelAr: "ملغي", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant}>
        {language === "ar" ? config.labelAr : config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleViewRequest = (request: PriceRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleCreateOffer = (request: PriceRequest) => {
    // Pre-fill offer data from request
    setSelectedRequest(request);
    setOfferDialogOpen(true);

    // Show linking indicator
    toast({
      title: language === "ar" ? "إنشاء عرض من الطلب" : "Creating Offer from Request",
      description: language === "ar" 
        ? `سيتم ربط العرض بالطلب ${request.requestNumber}` 
        : `Offer will be linked to request ${request.requestNumber}`,
    });
  };

  const handleGeneratePDF = (request: PriceRequest) => {
    setPdfRequest(request);
    setPdfDialogOpen(true);
  };

  const generatePdfMutation = useMutation({
    mutationFn: async (data: { requestId: string; language: 'en' | 'ar' }) => {
      const res = await apiRequest('POST', `/api/admin/price-requests/${data.requestId}/generate-pdf`, {
        language: data.language
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate PDF');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === "ar" ? "تم إنشاء PDF" : "PDF Generated",
        description: data.message || (language === "ar" ? "تم إنشاء ملف PDF بنجاح" : "PDF generated successfully")
      });
      setPdfDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-requests"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message
      });
    }
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{language === "ar" ? "طلبات الأسعار" : "Price Requests"}</h1>
            <p className="text-muted-foreground mt-1">
              {language === "ar" ? "إدارة طلبات الأسعار من العملاء" : "Manage client price requests"}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/price-offers">
              <FileText className="h-4 w-4 mr-2" />
              {language === "ar" ? "عروض الأسعار" : "Price Offers"}
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted"></CardHeader>
                <CardContent className="h-32 bg-muted/50"></CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد طلبات أسعار" : "No price requests"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((request) => {
              const products = typeof request.products === "string" ? JSON.parse(request.products) : request.products;
              const isPending = request.status === "pending";

              return (
                <Card key={request.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          {request.requestNumber}
                          {request.status === 'processed' && (
                            <Badge variant="outline" className="text-xs">
                              {language === "ar" ? "تم إنشاء عرض" : "Offer Created"}
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getClientName(request.clientId)}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === "ar" ? "الاتفاقية" : "LTA"}
                      </span>
                      <span className="font-medium text-right flex-1 ml-2 truncate">
                        {getLtaName(request.ltaId)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === "ar" ? "عدد المنتجات" : "Products"}
                      </span>
                      <span className="font-medium">{products.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {language === "ar" ? "التاريخ" : "Date"}
                      </span>
                      <span className="font-medium">
                        {formatDateLocalized(new Date(request.requestedAt), language)}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewRequest(request)}
                        data-testid={`button-view-${request.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {language === "ar" ? "عرض" : "View"}
                      </Button>
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleCreateOffer(request)}
                            disabled={request.status === 'processed'}
                            data-testid={`button-create-offer-${request.id}`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {request.status === 'processed' 
                              ? (language === "ar" ? "تم الإنشاء" : "Already Created")
                              : (language === "ar" ? "إنشاء عرض" : "Create Offer")
                            }
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleGeneratePDF(request)}
                            data-testid={`button-generate-pdf-${request.id}`}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {language === "ar" ? "PDF" : "PDF"}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "العميل" : "Client"}:</span>
                  <div className="mt-1 font-medium">{getClientName(selectedRequest.clientId)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "الاتفاقية" : "LTA"}:</span>
                  <div className="mt-1 font-medium">{getLtaName(selectedRequest.ltaId)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}:</span>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "التاريخ" : "Date"}:</span>
                  <div className="mt-1 font-medium">
                    {formatDateLocalized(new Date(selectedRequest.requestedAt), language)}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">{language === "ar" ? "المنتجات المطلوبة" : "Requested Products"}</h4>
                {(typeof selectedRequest.products === "string" ? JSON.parse(selectedRequest.products) : selectedRequest.products).map((product: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{product.productId}</div>
                      <div className="text-muted-foreground">SKU: {product.sku || "N/A"}</div>
                    </div>
                    <span className="font-medium">{language === "ar" ? "الكمية" : "Qty"}: {product.quantity}</span>
                  </div>
                ))}
              </div>

              {selectedRequest.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{language === "ar" ? "ملاحظات" : "Notes"}</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleCreateOffer(selectedRequest)} data-testid="button-create-offer-from-dialog">
                    <FileText className="h-4 w-4 mr-2" />
                    {language === "ar" ? "إنشاء عرض سعر" : "Create Price Offer"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Generation Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "إنشاء PDF لطلب السعر" : "Generate PDF for Price Request"}
            </DialogTitle>
          </DialogHeader>
          {pdfRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {language === "ar" ? "اللغة" : "Language"}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={pdfLanguage === 'en' ? 'default' : 'outline'}
                    onClick={() => setPdfLanguage('en')}
                    className="flex-1"
                  >
                    English
                  </Button>
                  <Button
                    variant={pdfLanguage === 'ar' ? 'default' : 'outline'}
                    onClick={() => setPdfLanguage('ar')}
                    className="flex-1"
                  >
                    العربية
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPdfDialogOpen(false)}
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={() => {
                    generatePdfMutation.mutate({
                      requestId: pdfRequest.id,
                      language: pdfLanguage
                    });
                  }}
                  disabled={generatePdfMutation.isPending}
                >
                  {generatePdfMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === "ar" ? "جاري الإنشاء..." : "Generating..."}
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {language === "ar" ? "إنشاء PDF" : "Generate PDF"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Offer Creation Dialog (Placeholder - actual implementation would be here) */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إنشاء عرض سعر" : "Create Price Offer"}</DialogTitle>
          </DialogHeader>
          <DialogContent>
            {selectedRequest ? (
              <p>
                {language === "ar"
                  ? `هل أنت متأكد أنك تريد إنشاء عرض سعر لهذا الطلب: ${selectedRequest.requestNumber}؟`
                  : `Are you sure you want to create a price offer for this request: ${selectedRequest.requestNumber}?`}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={() => { /* handle confirmed offer creation */ setOfferDialogOpen(false); }}>
                {language === "ar" ? "إنشاء عرض" : "Create Offer"}
              </Button>
            </div>
          </DialogContent>
        </DialogContent>
      </Dialog>
    </div>
  );
}