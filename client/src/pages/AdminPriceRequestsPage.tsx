import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, Clock, CheckCircle, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatDateLocalized } from "@/lib/dateUtils";
import type { PriceRequest, Client, Lta } from "@shared/schema";

export default function AdminPriceRequestsPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
    setLocation(`/admin/price-offers/create?requestId=${request.id}`);
  };

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
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCreateOffer(request)}
                          data-testid={`button-create-offer-${request.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {language === "ar" ? "إنشاء عرض" : "Create Offer"}
                        </Button>
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
    </div>
  );
}
