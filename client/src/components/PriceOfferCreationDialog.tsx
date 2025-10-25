import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2, DollarSign, Package, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const priceOfferSchema = z.object({
  ltaId: z.string().min(1, 'LTA is required'),
  clientId: z.string().min(1, 'Client is required'),
  validUntil: z.date(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    nameEn: z.string(),
    nameAr: z.string(),
    sku: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.string().min(1, 'Unit price is required'),
    currency: z.string().default('USD'),
  })).min(1, 'At least one product is required'),
});

type PriceOfferFormValues = z.infer<typeof priceOfferSchema>;

interface LTA {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  status: 'active' | 'inactive';
  currency?: string; // LTA currency
}

interface Client {
  id: string;
  nameEn: string;
  nameAr: string;
  email?: string | null;
}

interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  contractPrice?: string;
  currency?: string;
}

interface PriceOfferCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId?: string; // Optional: if creating from a price request
  onSuccess?: () => void;
}

export default function PriceOfferCreationDialog({
  open,
  onOpenChange,
  requestId,
  onSuccess
}: PriceOfferCreationDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<PriceOfferFormValues>({
    resolver: zodResolver(priceOfferSchema),
    defaultValues: {
      ltaId: '',
      clientId: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: '',
      items: [],
    },
  });

  const { data: ltas = [] } = useQuery<LTA[]>({
    queryKey: ['/api/admin/ltas'],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
  });

  const { data: priceRequest } = useQuery({
    queryKey: ['/api/admin/price-requests', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await apiRequest('GET', `/api/admin/price-requests/${requestId}`);
      return res.json();
    },
    enabled: !!requestId,
  });

  // Load LTA products when LTA is selected
  const selectedLtaId = form.watch('ltaId');
  const { data: ltaProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/admin/ltas', selectedLtaId, 'products'],
    queryFn: async () => {
      if (!selectedLtaId) return [];
      const res = await apiRequest('GET', `/api/admin/ltas/${selectedLtaId}/products`);
      return res.json();
    },
    enabled: !!selectedLtaId,
  });

  // Get LTA details to fetch currency
  const { data: selectedLta } = useQuery<LTA>({
    queryKey: ['/api/admin/ltas', selectedLtaId],
    queryFn: async () => {
      if (!selectedLtaId) return null;
      const res = await apiRequest('GET', `/api/admin/ltas/${selectedLtaId}`);
      return res.json();
    },
    enabled: !!selectedLtaId,
  });

  // Load LTA clients when LTA is selected
  const { data: ltaClients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/ltas', selectedLtaId, 'clients'],
    queryFn: async () => {
      if (!selectedLtaId) return [];
      const res = await apiRequest('GET', `/api/admin/ltas/${selectedLtaId}/clients`);
      return res.json();
    },
    enabled: !!selectedLtaId,
  });

  const createPriceOfferMutation = useMutation({
    mutationFn: async (data: PriceOfferFormValues) => {
      const res = await apiRequest('POST', '/api/admin/price-offers', {
        requestId: requestId || null,
        clientId: data.clientId,
        ltaId: data.ltaId,
        items: data.items,
        subtotal: calculateSubtotal(data.items),
        tax: 0, // Can be calculated later if needed
        total: calculateTotal(data.items),
        notes: data.notes,
        validUntil: data.validUntil.toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم إنشاء عرض السعر بنجاح' : 'Price Offer Created Successfully',
        description: language === 'ar' ? 'تم إنشاء عرض السعر بنجاح' : 'Price offer has been created successfully',
      });
      onOpenChange(false);
      form.reset();
      setSelectedProducts([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ في إنشاء عرض السعر' : 'Error Creating Price Offer',
        description: error.message || (language === 'ar' ? 'فشل في إنشاء عرض السعر' : 'Failed to create price offer'),
      });
    },
  });

  const calculateSubtotal = (items: PriceOfferFormValues['items']) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };

  const calculateTotal = (items: PriceOfferFormValues['items']) => {
    return calculateSubtotal(items);
  };

  // Update available products when LTA changes
  useEffect(() => {
    if (selectedLtaId && ltaProducts.length > 0) {
      setAvailableProducts(ltaProducts);
    } else {
      setAvailableProducts(allProducts);
    }
  }, [selectedLtaId, ltaProducts, allProducts]);

  // Update currency for all items when LTA changes
  useEffect(() => {
    if (selectedLta?.currency) {
      const currentItems = form.getValues('items');
      const updatedItems = currentItems.map(item => ({
        ...item,
        currency: selectedLta.currency || 'USD'
      }));
      form.setValue('items', updatedItems);
    }
  }, [selectedLta?.currency, form]);

  // Auto-fill from price request if provided
  useEffect(() => {
    if (priceRequest && open) {
      form.setValue('ltaId', priceRequest.ltaId || '');
      form.setValue('clientId', priceRequest.clientId);
      form.setValue('notes', priceRequest.notes || '');

      // Add products from request
      const products = typeof priceRequest.products === 'string'
        ? JSON.parse(priceRequest.products)
        : priceRequest.products || [];

      const items = products.map((product: any) => ({
        productId: product.id || product.productId,
        nameEn: product.nameEn || 'Unknown Product',
        nameAr: product.nameAr || 'منتج غير معروف',
        sku: product.sku || 'N/A',
        quantity: product.quantity || 1,
        unitPrice: product.contractPrice || product.unitPrice || '0',
        currency: 'USD', // Will be updated when LTA loads
      }));

      form.setValue('items', items);
      setSelectedProducts(products);
    }
  }, [priceRequest, open, form]);

  // Update currency when LTA is loaded
  useEffect(() => {
    if (selectedLta?.currency && priceRequest && open) {
      const currentItems = form.getValues('items');
      const updatedItems = currentItems.map(item => ({
        ...item,
        currency: selectedLta.currency || 'USD'
      }));
      form.setValue('items', updatedItems);
    }
  }, [selectedLta?.currency, priceRequest, open, form]);

  const handleAddProduct = (product: Product) => {
    const currentItems = form.getValues('items');
    const existingItem = currentItems.find(item => item.productId === product.id);

    if (existingItem) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'المنتج موجود بالفعل' : 'Product Already Added',
        description: language === 'ar' ? 'هذا المنتج موجود بالفعل في القائمة' : 'This product is already in the list',
      });
      return;
    }

    const newItem = {
      productId: product.id,
      nameEn: product.nameEn || product.nameAr || 'Unknown Product',
      nameAr: product.nameAr || product.nameEn || 'منتج غير معروف',
      sku: product.sku || 'N/A',
      quantity: 1,
      unitPrice: product.contractPrice || '0',
      currency: selectedLta?.currency || product.currency || 'USD',
    };

    const updatedItems = [...currentItems, newItem];
    form.setValue('items', updatedItems);
    setSelectedProducts(prev => [...prev, product]);
  };

  const handleRemoveProduct = (productId: string) => {
    const currentItems = form.getValues('items');
    const updatedItems = currentItems.filter(item => item.productId !== productId);
    form.setValue('items', updatedItems);
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const currentItems = form.getValues('items');
    const updatedItems = currentItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    form.setValue('items', updatedItems);
  };

  const handlePriceChange = (productId: string, unitPrice: string) => {
    const currentItems = form.getValues('items');
    const updatedItems = currentItems.map(item =>
      item.productId === productId ? { ...item, unitPrice } : item
    );
    form.setValue('items', updatedItems);
  };

  // Get the current currency (from LTA or default)
  const currentCurrency = selectedLta?.currency || 'USD';

  const onSubmit = (data: PriceOfferFormValues) => {
    createPriceOfferMutation.mutate(data);
  };

  const currentItems = form.watch('items');
  const subtotal = calculateSubtotal(currentItems);
  const total = calculateTotal(currentItems);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            {language === 'ar' ? 'إنشاء عرض سعر جديد' : 'Create New Price Offer'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* LTA Selection */}
              <FormField
                control={form.control}
                name="ltaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      {language === 'ar' ? 'الاتفاقية طويلة الأجل' : 'Long Term Agreement'}
                      {selectedLta?.currency && (
                        <Badge variant="outline" className="text-xs">
                          {selectedLta.currency}
                        </Badge>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر الاتفاقية' : 'Select LTA'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ltas.filter(lta => lta.status === 'active').map((lta) => (
                          <SelectItem key={lta.id} value={lta.id}>
                            {language === 'ar' ? lta.nameAr : lta.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      {language === 'ar' ? 'العميل' : 'Client'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'ar' ? 'اختر العميل' : 'Select Client'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(selectedLtaId ? ltaClients : clients).map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {language === 'ar' ? client.nameAr : client.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Expiration Date */}
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    {language === 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expiration Date'}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal h-9",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: language === 'ar' ? ar : undefined })
                          ) : (
                            <span>{language === 'ar' ? 'اختر التاريخ' : 'Pick a date'}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Selection */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {language === 'ar' ? 'المنتجات' : 'Products'}
                </h3>
                <Select onValueChange={(productId) => {
                  const product = availableProducts.find(p => p.id === productId);
                  if (product) handleAddProduct(product);
                }}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder={language === 'ar' ? 'إضافة منتج' : 'Add Product'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts
                      .filter(p => !currentItems.some(item => item.productId === p.id))
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {language === 'ar' ? product.nameAr : product.nameEn} ({product.sku})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {currentItems.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {language === 'ar' ? 'منتجات العرض' : 'Offer Items'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-sm">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                            <TableHead className="text-sm w-20">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                            <TableHead className="text-sm w-32">{language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}</TableHead>
                            <TableHead className="text-sm w-24">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((item) => {
                            const itemPrice = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                            const itemQuantity = Number(item.quantity) || 0;
                            const total = itemPrice * itemQuantity;

                            return (
                              <TableRow key={item.productId}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {language === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      SKU: {item.sku || 'N/A'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 text-sm"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.unitPrice}
                                      onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                                      className="w-24 h-8 text-sm"
                                      placeholder="0.00"
                                    />
                                    <span className="text-xs text-muted-foreground">{currentCurrency}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {currentCurrency} {total.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveProduct(item.productId)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3 p-4">
                      {currentItems.map((item) => {
                        const itemPrice = parseFloat(String(item.unitPrice || '0').replace(/[^0-9.-]/g, '')) || 0;
                        const itemQuantity = Number(item.quantity) || 0;
                        const total = itemPrice * itemQuantity;

                        return (
                          <div key={item.productId} className="border rounded-lg p-3 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">
                                  {language === 'ar' ? item.nameAr : item.nameEn}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {language === 'ar' ? 'رمز المنتج:' : 'SKU:'} {item.sku}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(item.productId)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  {language === 'ar' ? 'سعر الوحدة' : 'Unit Price'}
                                </Label>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.unitPrice}
                                    onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="0.00"
                                  />
                                  <span className="text-xs text-muted-foreground">{currentCurrency}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-sm font-medium">
                                {language === 'ar' ? 'المجموع' : 'Total'}
                              </span>
                              <span className="font-semibold text-sm">
                                {currentCurrency} {total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 border-t">
                      <div className="flex justify-between items-center text-base font-semibold">
                        <span>{language === 'ar' ? 'المجموع الكلي' : 'Total Amount'}:</span>
                        <span>{currentCurrency} {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">{language === 'ar' ? 'ملاحظات' : 'Notes'}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={language === 'ar' ? 'أدخل أي ملاحظات إضافية...' : 'Enter any additional notes...'}
                      rows={3}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={createPriceOfferMutation.isPending || currentItems.length === 0}
                className="w-full sm:w-auto"
              >
                {createPriceOfferMutation.isPending
                  ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                  : (language === 'ar' ? 'إنشاء عرض السعر' : 'Create Price Offer')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}