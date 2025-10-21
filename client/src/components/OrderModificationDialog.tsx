import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Trash2, Minus } from "lucide-react";
import { safeJsonParse } from "@/lib/safeJson";
import type { Order, Product } from "@shared/schema";

interface CartItem {
  productId: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  price: string;
  quantity: number;
  ltaId: string;
  currency: string;
}

interface OrderModificationDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderModificationDialog({ order, open, onOpenChange }: OrderModificationDialogProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [modificationType, setModificationType] = useState<'cancel' | 'items'>('cancel');
  const [reason, setReason] = useState("");
  const [modifiedItems, setModifiedItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Fetch LTA products for adding new items
  const { data: ltaProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/ltas', order?.ltaId, 'products'],
    enabled: !!order?.ltaId && modificationType === 'items',
  });

  // Initialize modified items when order changes
  useEffect(() => {
    if (order && open) {
      const items = safeJsonParse<CartItem[]>(order.items, []);
      setModifiedItems(items);
      setModificationType('cancel');
      setReason("");
      setSelectedProductId("");
    }
  }, [order, open]);

  // Calculate new total
  const calculateTotal = () => {
    return modifiedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0).toFixed(2);
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, change: number) => {
    setModifiedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  // Remove item
  const removeItem = (productId: string) => {
    setModifiedItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Add new item from LTA
  const addNewItem = () => {
    if (!selectedProductId || !order) return;

    const product = ltaProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if item already exists
    const existingItem = modifiedItems.find(item => item.productId === selectedProductId);
    if (existingItem) {
      updateItemQuantity(selectedProductId, 1);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        sku: product.sku,
        nameEn: product.nameEn,
        nameAr: product.nameAr,
        price: product.price || "0",
        quantity: 1,
        ltaId: order.ltaId,
        currency: product.currency || "SAR",
      };
      setModifiedItems(prev => [...prev, newItem]);
    }
    setSelectedProductId("");
  };

  const requestModificationMutation = useMutation({
    mutationFn: async ({ orderId, modificationType, reason, newItems }: { 
      orderId: string; 
      modificationType: string; 
      reason: string;
      newItems?: CartItem[];
    }) => {
      return apiRequest(`/api/orders/${orderId}/modify`, {
        method: 'POST',
        body: JSON.stringify({ 
          modificationType, 
          reason,
          newItems: newItems || undefined
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', order?.id, 'modifications'] });
      onOpenChange(false);
      setReason("");
      toast({
        title: i18n.language === 'ar' ? 'تم إرسال الطلب' : 'Request Submitted',
        description: i18n.language === 'ar' ? 'تم إرسال طلب التعديل بنجاح' : 'Modification request submitted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (i18n.language === 'ar' ? 'فشل إرسال الطلب' : 'Failed to submit request'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!order || !reason.trim()) {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: i18n.language === 'ar' ? 'الرجاء إدخال السبب' : 'Please enter a reason',
        variant: "destructive",
      });
      return;
    }

    if (modificationType === 'items' && modifiedItems.length === 0) {
      toast({
        title: i18n.language === 'ar' ? 'خطأ' : 'Error',
        description: i18n.language === 'ar' ? 'يجب أن يحتوي الطلب على عنصر واحد على الأقل' : 'Order must contain at least one item',
        variant: "destructive",
      });
      return;
    }

    requestModificationMutation.mutate({
      orderId: order.id,
      modificationType,
      reason: reason.trim(),
      newItems: modificationType === 'items' ? modifiedItems : undefined,
    });
  };

  // Check if order can be modified
  const canModify = order && !['cancelled', 'delivered', 'shipped'].includes(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-modify-order">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {i18n.language === 'ar' ? 'طلب تعديل الطلب' : 'Request Order Modification'}
          </DialogTitle>
          <DialogDescription data-testid="dialog-description">
            {canModify 
              ? (i18n.language === 'ar' ? 'اختر نوع التعديل وقدم السبب' : 'Choose modification type and provide a reason')
              : (i18n.language === 'ar' ? `لا يمكن تعديل هذا الطلب (الحالة: ${order?.status})` : `This order cannot be modified (Status: ${order?.status})`)
            }
          </DialogDescription>
        </DialogHeader>

        {canModify && order && (
          <div className="space-y-4">
            <div>
              <Label data-testid="label-order-id">
                {i18n.language === 'ar' ? 'رقم الطلب' : 'Order ID'}
              </Label>
              <p className="text-sm font-mono" data-testid="text-order-id">
                #{order.id.substring(0, 8)}
              </p>
            </div>

            <div>
              <Label data-testid="label-modification-type">
                {i18n.language === 'ar' ? 'نوع التعديل' : 'Modification Type'}
              </Label>
              <RadioGroup value={modificationType} onValueChange={(value: any) => setModificationType(value)} className="mt-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse" data-testid="radio-cancel">
                  <RadioGroupItem value="cancel" id="cancel" />
                  <Label htmlFor="cancel" className="cursor-pointer">
                    {i18n.language === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse" data-testid="radio-items">
                  <RadioGroupItem value="items" id="items" />
                  <Label htmlFor="items" className="cursor-pointer">
                    {i18n.language === 'ar' ? 'تعديل الأصناف' : 'Modify Items'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {modificationType === 'items' && (
              <div className="space-y-3">
                <Label>{i18n.language === 'ar' ? 'الأصناف المعدلة' : 'Modified Items'}</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{i18n.language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{i18n.language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                        <TableHead>{i18n.language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modifiedItems.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">
                            {i18n.language === 'ar' ? item.nameAr : item.nameEn}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateItemQuantity(item.productId, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                className="w-16 h-7 text-center"
                                readOnly
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateItemQuantity(item.productId, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {parseFloat(item.price).toFixed(2)} {item.currency}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeItem(item.productId)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {modifiedItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                            {i18n.language === 'ar' ? 'لا توجد أصناف' : 'No items'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Add new item */}
                <div className="flex gap-2">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={i18n.language === 'ar' ? 'اختر منتج للإضافة' : 'Select product to add'} />
                    </SelectTrigger>
                    <SelectContent>
                      {ltaProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {i18n.language === 'ar' ? product.nameAr : product.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={addNewItem}
                    disabled={!selectedProductId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-semibold">
                    {i18n.language === 'ar' ? 'الإجمالي الجديد' : 'New Total'}
                  </span>
                  <span className="text-lg font-bold">
                    {calculateTotal()} {modifiedItems[0]?.currency || 'SAR'}
                  </span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="reason" data-testid="label-reason">
                {i18n.language === 'ar' ? 'السبب' : 'Reason'} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={i18n.language === 'ar' ? 'اشرح سبب التعديل...' : 'Explain the reason for modification...'}
                className="mt-1"
                rows={4}
                data-testid="input-reason"
              />
            </div>
          </div>
        )}

        {!canModify && (
          <div className="py-4 text-center text-muted-foreground" data-testid="text-cannot-modify">
            {i18n.language === 'ar' ? 'هذا الطلب لا يمكن تعديله بسبب حالته الحالية.' : 'This order cannot be modified due to its current status.'}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          {canModify && (
            <Button
              onClick={handleSubmit}
              disabled={requestModificationMutation.isPending || !reason.trim()}
              data-testid="button-submit"
            >
              {requestModificationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {i18n.language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
