import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye, Send, Trash2, Download, Plus, Minus } from "lucide-react";
import { Link, useRoute } from "wouter";
import { formatDateLocalized } from "@/lib/dateUtils";
import type { PriceOffer, PriceRequest, Client, Lta, Product } from "@shared/schema";

interface ProductWithPrice extends Product {
  contractPrice: string;
  currency: string;
}

export default function AdminPriceOffersPage() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [match, params] = useRoute("/admin/price-offers/create");
  const requestIdFromUrl = new URLSearchParams(window.location.search).get("requestId");

  const [createDialogOpen, setCreateDialogOpen] = useState(!!requestIdFromUrl);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const [selectedOffer, setSelectedOffer] = useState<PriceOffer | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState(requestIdFromUrl || "");
  const [selectedLtaId, setSelectedLtaId] = useState("");
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; price: string }>>(new Map());
  const [offerNotes, setOfferNotes] = useState("");
  const [validityDays, setValidityDays] = useState("30");

  const { data: offers = [], isLoading: offersLoading } = useQuery<PriceOffer[]>({
    queryKey: ["/api/admin/price-offers"],
  });

  const { data: requests = [] } = useQuery<PriceRequest[]>({
    queryKey: ["/api/admin/price-requests"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: ltas = [] } = useQuery<Lta[]>({
    queryKey: ["/api/ltas"],
  });

  const { data: products = [] } = useQuery<ProductWithPrice[]>({
    queryKey: [`/api/ltas/${selectedLtaId}/products`],
    enabled: !!selectedLtaId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/price-offers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم الإنشاء" : "Created",
        description: language === "ar" ? "تم إنشاء عرض السعر بنجاح" : "Price offer created successfully",
      });
      setCreateDialogOpen(false);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "فشل إنشاء العرض" : "Failed to create offer"),
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const res = await apiRequest("POST", `/api/admin/price-offers/${offerId}/send`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم الإرسال" : "Sent",
        description: language === "ar" ? "تم إرسال عرض السعر بنجاح" : "Price offer sent successfully",
      });
      setSendDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-offers"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "فشل إرسال العرض" : "Failed to send offer"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      await apiRequest("DELETE", `/api/admin/price-offers/${offerId}`, {});
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم الحذف" : "Deleted",
        description: language === "ar" ? "تم حذف العرض بنجاح" : "Offer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/price-offers"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "فشل حذف العرض" : "Failed to delete offer"),
        variant: "destructive",
      });
    },
  });

  const resetCreateForm = () => {
    setSelectedRequestId("");
    setSelectedLtaId("");
    setSelectedItems(new Map());
    setOfferNotes("");
    setValidityDays("30");
  };

  const handleRequestSelect = (requestId: string) => {
    setSelectedRequestId(requestId);
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      setSelectedLtaId(request.ltaId);
      const requestProducts = typeof request.products === "string" ? JSON.parse(request.products) : request.products;
      const newMap = new Map();
      requestProducts.forEach((p: any) => {
        newMap.set(p.productId, { quantity: p.quantity, price: "" });
      });
      setSelectedItems(newMap);
    }
  };

  const updateItemPrice = (productId: string, price: string) => {
    const newMap = new Map(selectedItems);
    const current = newMap.get(productId);
    if (current) {
      newMap.set(productId, { ...current, price });
    }
    setSelectedItems(newMap);
  };

  const updateItemQuantity = (productId: string, delta: number) => {
    const newMap = new Map(selectedItems);
    const current = newMap.get(productId);
    if (current) {
      const newQty = Math.max(1, current.quantity + delta);
      newMap.set(productId, { ...current, quantity: newQty });
    }
    setSelectedItems(newMap);
  };

  const handleCreateOffer = () => {
    if (!selectedRequestId || !selectedLtaId || selectedItems.size === 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "اختر طلب واتفاقية ومنتجات" : "Select request, LTA, and products",
        variant: "destructive",
      });
      return;
    }

    // Validate all prices are filled
    const missingPrices = Array.from(selectedItems.entries()).filter(([_, data]) => !data.price || parseFloat(data.price) <= 0);
    if (missingPrices.length > 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" 
          ? `يرجى إدخال أسعار صحيحة لجميع المنتجات (${missingPrices.length} منتج بدون سعر)`
          : `Please enter valid prices for all products (${missingPrices.length} items missing prices)`,
        variant: "destructive",
      });
      return;
    }

    const request = requests.find((r) => r.id === selectedRequestId);
    if (!request) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "الطلب غير موجود" : "Request not found",
        variant: "destructive",
      });
      return;
    }

    const items = Array.from(selectedItems.entries()).map(([productId, data]) => {
      const product = products.find((p) => p.id === productId);
      return {
        productId,
        sku: product?.sku || "",
        nameEn: product?.nameEn || "",
        nameAr: product?.nameAr || "",
        quantity: data.quantity,
        price: data.price,
      };
    });

    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + parseInt(validityDays || "30"));

    createMutation.mutate({
      requestId: selectedRequestId,
      clientId: request.clientId,
      ltaId: selectedLtaId,
      items,
      subtotal: total.toFixed(2),
      tax: "0.00",
      total: total.toFixed(2),
      notes: offerNotes || undefined,
      validUntil: validUntil.toISOString(),
    });
  };

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

  const generateDownloadUrl = (offer: PriceOffer) => {
    if (!offer.pdfFileName) return "#";
    const token = btoa(`${offer.id}:${Date.now()}`);
    return `/api/price-offers/${offer.id}/download?token=${token}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{language === "ar" ? "عروض الأسعار" : "Price Offers"}</h1>
            <p className="text-muted-foreground mt-1">
              {language === "ar" ? "إدارة عروض الأسعار للعملاء" : "Manage client price offers"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/price-requests">
                <FileText className="h-4 w-4 mr-2" />
                {language === "ar" ? "الطلبات" : "Requests"}
              </Link>
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-offer">
              <Plus className="h-4 w-4 mr-2" />
              {language === "ar" ? "إنشاء عرض" : "Create Offer"}
            </Button>
          </div>
        </div>

        {offersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {language === "ar" ? "لا توجد عروض أسعار" : "No price offers"}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              {language === "ar" ? "إنشاء عرض" : "Create First Offer"}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const items = typeof offer.items === "string" ? JSON.parse(offer.items) : offer.items;
              const isDraft = offer.status === "draft";

              return (
                <Card key={offer.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{offer.offerNumber}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getClientName(offer.clientId)}
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
                        <span>{formatDateLocalized(new Date(offer.validUntil), language)}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setViewDialogOpen(true);
                      }}
                      data-testid={`button-view-${offer.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {language === "ar" ? "عرض" : "View"}
                    </Button>
                    {isDraft && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedOffer(offer);
                            setSendDialogOpen(true);
                          }}
                          data-testid={`button-send-${offer.id}`}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {language === "ar" ? "إرسال" : "Send"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(offer.id)}
                          data-testid={`button-delete-${offer.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {offer.pdfFileName && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        data-testid={`button-download-${offer.id}`}
                      >
                        <a href={generateDownloadUrl(offer)} download>
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Offer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "إنشاء عرض سعر جديد" : "Create New Price Offer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{language === "ar" ? "اختر طلب السعر" : "Select Price Request"}</Label>
              <Select value={selectedRequestId} onValueChange={handleRequestSelect}>
                <SelectTrigger data-testid="select-request">
                  <SelectValue placeholder={language === "ar" ? "اختر طلباً" : "Select request"} />
                </SelectTrigger>
                <SelectContent>
                  {requests.filter((r) => r.status === "pending").map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.requestNumber} - {getClientName(request.clientId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRequestId && selectedLtaId && products.length > 0 && (
              <>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{language === "ar" ? "المنتجات والأسعار" : "Products & Pricing"}</h4>
                    <span className="text-sm text-muted-foreground">
                      {language === "ar" ? `${selectedItems.size} منتج` : `${selectedItems.size} items`}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground pb-2 border-b">
                      <div className="col-span-5">{language === "ar" ? "المنتج" : "Product"}</div>
                      <div className="col-span-2 text-center">{language === "ar" ? "الكمية" : "Qty"}</div>
                      <div className="col-span-3">{language === "ar" ? "سعر الوحدة" : "Unit Price"}</div>
                      <div className="col-span-2 text-right">{language === "ar" ? "الإجمالي" : "Total"}</div>
                    </div>
                    
                    {Array.from(selectedItems.entries()).map(([productId, data]) => {
                      const product = products.find((p) => p.id === productId);
                      if (!product) return null;

                      const itemTotal = data.price ? (parseFloat(data.price) * data.quantity).toFixed(2) : "0.00";

                      return (
                        <div key={productId} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="col-span-5">
                            <div className="font-medium text-sm">
                              {language === "ar" ? product.nameAr : product.nameEn}
                            </div>
                            <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                          </div>
                          
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateItemQuantity(productId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <div className="w-12 text-center font-medium">{data.quantity}</div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateItemQuantity(productId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="col-span-3">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={data.price}
                                onChange={(e) => updateItemPrice(productId, e.target.value)}
                                className="h-9"
                                data-testid={`input-price-${productId}`}
                              />
                            </div>
                          </div>
                          
                          <div className="col-span-2 text-right font-semibold">
                            ${itemTotal}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{language === "ar" ? "المجموع الفرعي" : "Subtotal"}:</span>
                      <span className="font-medium">
                        ${Array.from(selectedItems.entries()).reduce((sum, [productId, data]) => {
                          return sum + (data.price ? parseFloat(data.price) * data.quantity : 0);
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>{language === "ar" ? "الإجمالي (شامل الضريبة)" : "Total (Tax Included)"}:</span>
                      <span className="text-primary">
                        ${Array.from(selectedItems.entries()).reduce((sum, [productId, data]) => {
                          return sum + (data.price ? parseFloat(data.price) * data.quantity : 0);
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === "ar" ? "الصلاحية (أيام)" : "Validity (Days)"}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                      data-testid="input-validity-days"
                    />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
                    <Input
                      type="text"
                      value={new Date(Date.now() + parseInt(validityDays || "30") * 24 * 60 * 60 * 1000).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label>{language === "ar" ? "ملاحظات (اختياري)" : "Notes (Optional)"}</Label>
                  <Textarea
                    value={offerNotes}
                    onChange={(e) => setOfferNotes(e.target.value)}
                    rows={3}
                    placeholder={language === "ar" ? "أضف أي ملاحظات إضافية..." : "Add any additional notes..."}
                    data-testid="textarea-notes"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetCreateForm();
              }}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleCreateOffer}
              disabled={createMutation.isPending || selectedItems.size === 0}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending
                ? language === "ar" ? "جاري الإنشاء..." : "Creating..."
                : language === "ar" ? "إنشاء عرض" : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === "ar" ? "إرسال عرض السعر" : "Send Price Offer"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            {language === "ar"
              ? "سيتم إنشاء ملف PDF وإرسال إشعار للعميل. هل أنت متأكد؟"
              : "A PDF will be generated and the client will be notified. Are you sure?"}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => selectedOffer && sendMutation.mutate(selectedOffer.id)}
              disabled={sendMutation.isPending}
              data-testid="button-confirm-send"
            >
              {sendMutation.isPending
                ? language === "ar" ? "جاري الإرسال..." : "Sending..."
                : language === "ar" ? "إرسال" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <span className="text-muted-foreground">{language === "ar" ? "العميل" : "Client"}:</span>
                  <div className="mt-1 font-medium">{getClientName(selectedOffer.clientId)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}:</span>
                  <div className="mt-1">{getStatusBadge(selectedOffer.status)}</div>
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

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>{language === "ar" ? "الإجمالي (شامل الضريبة)" : "Total (Tax Included)"}:</span>
                  <span>${selectedOffer.total}</span>
                </div>
              </div>

              {selectedOffer.notes && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{language === "ar" ? "ملاحظات" : "Notes"}</h4>
                  <p className="text-sm text-muted-foreground">{selectedOffer.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
