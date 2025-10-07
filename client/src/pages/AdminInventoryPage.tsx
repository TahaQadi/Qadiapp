import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, User, Package, ArrowLeft, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import type { Product } from '@shared/schema';

const adjustmentFormSchema = z.object({
  adjustmentType: z.enum(['add', 'remove']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface InventoryTransaction {
  id: string;
  productId: string;
  type: string;
  quantityChange: number;
  reason?: string | null;
  notes?: string | null;
  userId?: string | null;
  createdAt: string;
}

export default function AdminInventoryPage() {
  const { user, logoutMutation } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterProductId, setFilterProductId] = useState<string>('all');

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
  });

  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ['/api/admin/inventory/transactions'],
  });

  const filteredTransactions = useMemo(() => {
    if (!filterProductId || filterProductId === 'all') return allTransactions;
    return allTransactions.filter(t => t.productId === filterProductId);
  }, [allTransactions, filterProductId]);

  const transactionsWithProducts = useMemo(() => {
    return filteredTransactions.map(transaction => {
      const product = products.find(p => p.id === transaction.productId);
      return {
        ...transaction,
        productNameEn: product?.nameEn || 'Unknown Product',
        productNameAr: product?.nameAr || 'منتج غير معروف',
      };
    });
  }, [filteredTransactions, products]);

  const adjustForm = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      adjustmentType: 'add',
      quantity: 1,
      reason: '',
      notes: '',
    },
  });

  const adjustInventoryMutation = useMutation({
    mutationFn: async (data: { productId: string; quantityChange: number; reason: string; notes?: string }) => {
      const res = await apiRequest('POST', '/api/admin/inventory/adjust', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: language === 'ar' ? 'تم تعديل المخزون بنجاح' : 'Inventory adjusted successfully',
      });
      setAdjustDialogOpen(false);
      setSelectedProduct(null);
      adjustForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تعديل المخزون' : 'Error adjusting inventory',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAdjustClick = (product: Product) => {
    setSelectedProduct(product);
    adjustForm.reset({
      adjustmentType: 'add',
      quantity: 1,
      reason: '',
      notes: '',
    });
    setAdjustDialogOpen(true);
  };

  const handleAdjustSubmit = (data: AdjustmentFormValues) => {
    if (!selectedProduct) return;

    const quantityChange = data.adjustmentType === 'add' ? data.quantity : -data.quantity;
    
    adjustInventoryMutation.mutate({
      productId: selectedProduct.id,
      quantityChange,
      reason: data.reason,
      notes: data.notes || undefined,
    });
  };

  const getQuantityColor = (product: Product) => {
    if (product.quantity === 0) return 'text-destructive';
    if (product.quantity <= product.lowStockThreshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusBadge = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge variant="destructive" data-testid={`badge-stock-out-${product.id}`}>
        {language === 'ar' ? 'غير متوفر' : 'Out of Stock'}
      </Badge>;
    }
    if (product.quantity <= product.lowStockThreshold) {
      return <Badge variant="secondary" data-testid={`badge-stock-low-${product.id}`}>
        {language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}
      </Badge>;
    }
    return <Badge variant="default" data-testid={`badge-stock-in-${product.id}`}>
      {language === 'ar' ? 'متوفر' : 'In Stock'}
    </Badge>;
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeMap: Record<string, { en: string; ar: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'adjustment': { en: 'Adjustment', ar: 'تعديل', variant: 'default' },
      'sale': { en: 'Sale', ar: 'بيع', variant: 'secondary' },
      'return': { en: 'Return', ar: 'إرجاع', variant: 'outline' },
      'initial': { en: 'Initial', ar: 'أولي', variant: 'outline' },
    };
    
    const typeInfo = typeMap[type.toLowerCase()] || { en: type, ar: type, variant: 'outline' as const };
    return (
      <Badge variant={typeInfo.variant} data-testid={`badge-type-${type}`}>
        {language === 'ar' ? typeInfo.ar : typeInfo.en}
      </Badge>
    );
  };

  const quantity = adjustForm.watch('quantity');
  const adjustmentType = adjustForm.watch('adjustmentType');
  const newQuantity = selectedProduct
    ? adjustmentType === 'add'
      ? selectedProduct.quantity + (quantity || 0)
      : selectedProduct.quantity - (quantity || 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/admin')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
            </h1>
            <Badge variant="secondary" className="hidden md:flex">
              {language === 'ar' ? user?.nameAr : user?.nameEn}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="button-profile"
            >
              <Link href="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="button-ordering"
            >
              <Link href="/">
                <Package className="h-5 w-5" />
              </Link>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Product Inventory List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'قائمة المنتجات' : 'Product Inventory'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-products">
                {language === 'ar' ? 'لا توجد منتجات' : 'No products'}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                      <TableHead>{language === 'ar' ? 'اسم المنتج' : 'Product Name'}</TableHead>
                      <TableHead className="text-center">{language === 'ar' ? 'الكمية' : 'Quantity'}</TableHead>
                      <TableHead className="text-center">{language === 'ar' ? 'حد الانخفاض' : 'Low Stock Threshold'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium">
                          {language === 'ar' ? product.nameAr : product.nameEn}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${getQuantityColor(product)}`} data-testid={`quantity-${product.id}`}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {product.lowStockThreshold}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjustClick(product)}
                            data-testid={`button-adjust-${product.id}`}
                          >
                            <Edit3 className="h-4 w-4 me-1" />
                            {language === 'ar' ? 'تعديل' : 'Adjust'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>
              {language === 'ar' ? 'سجل حركات المخزون' : 'Inventory Transactions'}
            </CardTitle>
            <div className="w-64">
              <Select value={filterProductId} onValueChange={setFilterProductId}>
                <SelectTrigger data-testid="select-filter-product">
                  <SelectValue placeholder={language === 'ar' ? 'تصفية حسب المنتج' : 'Filter by product'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'ar' ? 'جميع المنتجات' : 'All Products'}
                  </SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : transactionsWithProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="empty-transactions">
                {language === 'ar' ? 'لا توجد حركات مخزون' : 'No inventory transactions'}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'التاريخ والوقت' : 'Date/Time'}</TableHead>
                      <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                      <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                      <TableHead className="text-center">{language === 'ar' ? 'التغيير في الكمية' : 'Quantity Change'}</TableHead>
                      <TableHead>{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
                      <TableHead>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsWithProducts.slice(0, 50).map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell className="text-sm">
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {language === 'ar' ? transaction.productNameAr : transaction.productNameEn}
                        </TableCell>
                        <TableCell>{getTransactionTypeBadge(transaction.type)}</TableCell>
                        <TableCell className="text-center">
                          <span 
                            className={`font-semibold ${transaction.quantityChange > 0 ? 'text-green-600' : 'text-destructive'}`}
                            data-testid={`change-${transaction.id}`}
                          >
                            {transaction.quantityChange > 0 ? '+' : ''}{transaction.quantityChange}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {transaction.reason || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {transaction.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Inventory Adjustment Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-adjust-inventory">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل المخزون' : 'Adjust Inventory'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'قم بتعديل كمية المخزون للمنتج' : 'Adjust the inventory quantity for the product'}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <Form {...adjustForm}>
              <form onSubmit={adjustForm.handleSubmit(handleAdjustSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'المنتج: ' : 'Product: '}
                    </span>
                    <span className="font-medium" data-testid="product-name">
                      {language === 'ar' ? selectedProduct.nameAr : selectedProduct.nameEn}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الكمية الحالية: ' : 'Current Quantity: '}
                    </span>
                    <span className="font-semibold" data-testid="current-quantity">
                      {selectedProduct.quantity}
                    </span>
                  </div>
                </div>

                <FormField
                  control={adjustForm.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'نوع التعديل' : 'Adjustment Type'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-adjustment-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="add">
                            {language === 'ar' ? 'إضافة مخزون' : 'Add Stock'}
                          </SelectItem>
                          <SelectItem value="remove">
                            {language === 'ar' ? 'إزالة مخزون' : 'Remove Stock'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adjustForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الكمية' : 'Quantity'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الكمية الجديدة: ' : 'New Quantity: '}
                    </span>
                    <span className={`font-semibold ${newQuantity < 0 ? 'text-destructive' : ''}`} data-testid="new-quantity">
                      {newQuantity}
                    </span>
                  </div>
                </div>

                <FormField
                  control={adjustForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'سبب التعديل' : 'Reason for adjustment'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-reason" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={adjustForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Additional notes (optional)'}</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAdjustDialogOpen(false)}
                    data-testid="button-cancel-adjust"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={adjustInventoryMutation.isPending || newQuantity < 0}
                    data-testid="button-submit-adjust"
                  >
                    {adjustInventoryMutation.isPending
                      ? (language === 'ar' ? 'جاري التعديل...' : 'Adjusting...')
                      : (language === 'ar' ? 'تعديل المخزون' : 'Adjust Inventory')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
