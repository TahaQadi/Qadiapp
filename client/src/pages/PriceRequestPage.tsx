import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/components/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ShoppingCart, Plus, Minus, Send, ArrowLeft, User, LogOut, Package } from "lucide-react";
import { Link } from "wouter";
import type { Lta, Product } from "@shared/schema";

interface ProductWithPrice extends Product {
  contractPrice: string;
  currency: string;
}

export default function PriceRequestPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedLtaId, setSelectedLtaId] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [notes, setNotes] = useState("");

  const { data: ltas = [] } = useQuery<Lta[]>({
    queryKey: ["/api/client/ltas"],
  });

  const activeLtas = ltas.filter(lta => lta.status === 'active');
  const hasNoActiveLtas = activeLtas.length === 0;

  // Load products from LTA if selected, otherwise load all products for bootstrap flow
  const { data: ltaProducts = [] } = useQuery<ProductWithPrice[]>({
    queryKey: [`/api/ltas/${selectedLtaId}/products`],
    enabled: !!selectedLtaId,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: hasNoActiveLtas && !selectedLtaId,
  });

  const products = selectedLtaId ? ltaProducts : (allProducts as any);

  const requestMutation = useMutation({
    mutationFn: async (data: { ltaId: string; products: { productId: string; quantity: number }[]; notes?: string }) => {
      const res = await apiRequest("POST", "/api/price-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم إرسال الطلب" : "Request Submitted",
        description: language === "ar" ? "تم إرسال طلب السعر بنجاح" : "Price request submitted successfully",
      });
      setSelectedProducts(new Map());
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/price-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message || (language === "ar" ? "فشل إرسال الطلب" : "Failed to submit request"),
        variant: "destructive",
      });
    },
  });

  const toggleProduct = (productId: string) => {
    const newMap = new Map(selectedProducts);
    if (newMap.has(productId)) {
      newMap.delete(productId);
    } else {
      newMap.set(productId, 1);
    }
    setSelectedProducts(newMap);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newMap = new Map(selectedProducts);
    const current = newMap.get(productId) || 1;
    const newQty = Math.max(1, current + delta);
    newMap.set(productId, newQty);
    setSelectedProducts(newMap);
  };

  const handleSubmit = () => {
    if (selectedProducts.size === 0) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "اختر منتج واحد على الأقل" : "Select at least one product",
        variant: "destructive",
      });
      return;
    }

    const productsArray = Array.from(selectedProducts.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const requestData: any = {
      products: productsArray,
    };

    // Only include ltaId if one is selected
    if (selectedLtaId) {
      requestData.ltaId = selectedLtaId;
    }

    // Only include notes if provided
    if (notes && notes.trim()) {
      requestData.notes = notes;
    }

    requestMutation.mutate(requestData);
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
              className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:border-primary transition-all duration-300"
              title={language === "ar" ? "العودة للطلبات" : "Back to Ordering"}
            >
              <Link href="/ordering">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === "ar" ? "بوابة القاضي" : "AlQadi Gate"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "طلب عرض سعر" : "Request Price Quote"}
              </p>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {hasNoActiveLtas && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" 
                      ? "ليس لديك اتفاقيات نشطة. يمكنك تقديم طلب سعر من الكتالوج وسيتم إنشاء اتفاقية مسودة تلقائياً."
                      : "You have no active contracts. Submit a price request from the catalog and a draft contract will be created automatically."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeLtas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "اختر الاتفاقية" : "Select Agreement"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedLtaId} onValueChange={setSelectedLtaId}>
                  <SelectTrigger data-testid="select-lta">
                    <SelectValue placeholder={language === "ar" ? "اختر اتفاقية" : "Select LTA"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLtas.map((lta) => (
                      <SelectItem key={lta.id} value={lta.id}>
                        {language === "ar" ? lta.nameAr : lta.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {(selectedLtaId || hasNoActiveLtas) && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "اختر المنتجات" : "Select Products"}
                    {selectedProducts.size > 0 && (
                      <Badge className="ml-2" variant="secondary">
                        {selectedProducts.size} {language === "ar" ? "محدد" : "selected"}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.map((product: Product | ProductWithPrice) => {
                      const isSelected = selectedProducts.has(product.id);
                      const quantity = selectedProducts.get(product.id) || 1;

                      return (
                        <div
                          key={product.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                            isSelected ? "bg-accent/10 border-accent" : "bg-card hover-elevate"
                          }`}
                          data-testid={`product-item-${product.id}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProduct(product.id)}
                            data-testid={`checkbox-product-${product.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold">
                              {language === "ar" ? product.nameAr : product.nameEn}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {product.sku}
                              {('contractPrice' in product && product.contractPrice) && (
                                <span className="ml-2 text-primary font-medium">
                                  {product.currency} {product.contractPrice}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(product.id, -1)}
                                data-testid={`button-decrease-${product.id}`}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={quantity}
                                className="w-20 text-center"
                                readOnly
                                data-testid={`input-quantity-${product.id}`}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(product.id, 1)}
                                data-testid={`button-increase-${product.id}`}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {products.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        {language === "ar" ? "لا توجد منتجات في هذه الاتفاقية" : "No products in this LTA"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "ملاحظات إضافية" : "Additional Notes"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === "ar" ? "أضف ملاحظات..." : "Add notes..."}
                    rows={4}
                    data-testid="textarea-notes"
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={requestMutation.isPending || selectedProducts.size === 0}
                  size="lg"
                  data-testid="button-submit-request"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {requestMutation.isPending
                    ? language === "ar"
                      ? "جاري الإرسال..."
                      : "Submitting..."
                    : language === "ar"
                    ? "إرسال الطلب"
                    : "Submit Request"}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}