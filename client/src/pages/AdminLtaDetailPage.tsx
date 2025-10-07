import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Pencil, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ltaFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['active', 'inactive']),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

const ltaProductSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  contractPrice: z.string().min(1, 'Contract price is required'),
  currency: z.string().default('USD'),
});

const ltaClientSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
});

type LtaFormValues = z.infer<typeof ltaFormSchema>;
type LtaProductFormValues = z.infer<typeof ltaProductSchema>;
type LtaClientFormValues = z.infer<typeof ltaClientSchema>;

interface Lta {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  contractPrice?: string;
  currency?: string;
}

interface Client {
  id: string;
  nameEn: string;
  nameAr: string;
  email?: string | null;
}

interface LtaProduct {
  id: string;
  ltaId: string;
  productId: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  contractPrice: string;
  currency: string;
}

export default function AdminLtaDetailPage() {
  const [, params] = useRoute('/admin/ltas/:id');
  const ltaId = params?.id;
  const { language } = useLanguage();
  const { toast } = useToast();

  const [editLtaDialogOpen, setEditLtaDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editPriceDialogOpen, setEditPriceDialogOpen] = useState(false);
  const [removeProductDialogOpen, setRemoveProductDialogOpen] = useState(false);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [removeClientDialogOpen, setRemoveClientDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LtaProduct | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: lta, isLoading: ltaLoading } = useQuery<Lta>({
    queryKey: ['/api/admin/ltas', ltaId],
    enabled: !!ltaId,
  });

  const { data: ltaProducts = [], isLoading: productsLoading } = useQuery<LtaProduct[]>({
    queryKey: ['/api/admin/ltas', ltaId, 'products'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ltas/${ltaId}/products`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
    enabled: !!ltaId,
  });

  const { data: ltaClients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/admin/ltas', ltaId, 'clients'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ltas/${ltaId}/clients`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      return res.json();
    },
    enabled: !!ltaId,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
  });

  const { data: allClients = [] } = useQuery<Client[]>({
    queryKey: ['/api/admin/clients'],
  });

  const editLtaForm = useForm<LtaFormValues>({
    resolver: zodResolver(ltaFormSchema),
    defaultValues: {
      nameEn: lta?.nameEn || '',
      nameAr: lta?.nameAr || '',
      descriptionEn: lta?.descriptionEn || '',
      descriptionAr: lta?.descriptionAr || '',
      startDate: lta ? new Date(lta.startDate) : new Date(),
      endDate: lta ? new Date(lta.endDate) : new Date(),
      status: lta?.status || 'active',
    },
  });

  const addProductForm = useForm<LtaProductFormValues>({
    resolver: zodResolver(ltaProductSchema),
    defaultValues: {
      productId: '',
      contractPrice: '',
      currency: 'USD',
    },
  });

  const editPriceForm = useForm<{ contractPrice: string; currency: string }>({
    defaultValues: {
      contractPrice: '',
      currency: 'USD',
    },
  });

  const addClientForm = useForm<LtaClientFormValues>({
    resolver: zodResolver(ltaClientSchema),
    defaultValues: {
      clientId: '',
    },
  });

  const updateLtaMutation = useMutation({
    mutationFn: async (data: LtaFormValues) => {
      const res = await apiRequest('PATCH', `/api/admin/ltas/${ltaId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas', ltaId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas'] });
      toast({
        title: language === 'ar' ? 'تم تحديث الاتفاقية بنجاح' : 'LTA updated successfully',
      });
      setEditLtaDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث الاتفاقية' : 'Error updating LTA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: LtaProductFormValues) => {
      const res = await apiRequest('POST', `/api/admin/ltas/${ltaId}/products`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas', ltaId, 'products'] });
      toast({
        title: language === 'ar' ? 'تم إضافة المنتج بنجاح' : 'Product added successfully',
      });
      setAddProductDialogOpen(false);
      addProductForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إضافة المنتج' : 'Error adding product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async (data: { contractPrice: string; currency: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/lta-products/${selectedProduct?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas', ltaId, 'products'] });
      toast({
        title: language === 'ar' ? 'تم تحديث السعر بنجاح' : 'Price updated successfully',
      });
      setEditPriceDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث السعر' : 'Error updating price',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/ltas/${ltaId}/products/${productId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas', ltaId, 'products'] });
      toast({
        title: language === 'ar' ? 'تم إزالة المنتج بنجاح' : 'Product removed successfully',
      });
      setRemoveProductDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إزالة المنتج' : 'Error removing product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (data: LtaClientFormValues) => {
      const res = await apiRequest('POST', `/api/admin/ltas/${ltaId}/clients`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas', ltaId, 'clients'] });
      toast({
        title: language === 'ar' ? 'تم إضافة العميل بنجاح' : 'Client added successfully',
      });
      setAddClientDialogOpen(false);
      addClientForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إضافة العميل' : 'Error adding client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/ltas/${ltaId}/clients/${clientId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas', ltaId, 'clients'] });
      toast({
        title: language === 'ar' ? 'تم إزالة العميل بنجاح' : 'Client removed successfully',
      });
      setRemoveClientDialogOpen(false);
      setSelectedClient(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إزالة العميل' : 'Error removing client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEditLta = () => {
    if (lta) {
      editLtaForm.reset({
        nameEn: lta.nameEn,
        nameAr: lta.nameAr,
        descriptionEn: lta.descriptionEn || '',
        descriptionAr: lta.descriptionAr || '',
        startDate: new Date(lta.startDate),
        endDate: new Date(lta.endDate),
        status: lta.status,
      });
      setEditLtaDialogOpen(true);
    }
  };

  const handleEditPrice = (product: LtaProduct) => {
    setSelectedProduct(product);
    editPriceForm.reset({
      contractPrice: product.contractPrice,
      currency: product.currency,
    });
    setEditPriceDialogOpen(true);
  };

  const handleRemoveProduct = (product: LtaProduct) => {
    setSelectedProduct(product);
    setRemoveProductDialogOpen(true);
  };

  const handleRemoveClient = (client: Client) => {
    setSelectedClient(client);
    setRemoveClientDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PP', { locale: language === 'ar' ? ar : undefined });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge data-testid="badge-status-active">{language === 'ar' ? 'نشط' : 'Active'}</Badge>;
    }
    return <Badge variant="secondary" data-testid="badge-status-inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</Badge>;
  };

  if (ltaLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container mx-auto px-4 h-16 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/ltas">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!lta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{language === 'ar' ? 'الاتفاقية غير موجودة' : 'LTA not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            data-testid="button-back-ltas"
          >
            <Link href="/admin/ltas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">
            {language === 'ar' ? lta.nameAr : lta.nameEn}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Section 1: LTA Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{language === 'ar' ? 'معلومات الاتفاقية' : 'LTA Information'}</CardTitle>
              <CardDescription className="mt-1">
                {language === 'ar' ? lta.descriptionAr : lta.descriptionEn}
              </CardDescription>
            </div>
            <Button onClick={handleEditLta} data-testid="button-edit-lta">
              <Pencil className="h-4 w-4 me-2" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</p>
                <p className="font-medium">{lta.nameEn}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</p>
                <p className="font-medium">{lta.nameAr}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</p>
                <p className="font-medium">{formatDate(lta.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</p>
                <p className="font-medium">{formatDate(lta.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                <div className="mt-1">{getStatusBadge(lta.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Assigned Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{language === 'ar' ? 'المنتجات في هذه الاتفاقية' : 'Products in this LTA'}</CardTitle>
            <Button 
              onClick={() => setAddProductDialogOpen(true)}
              data-testid="button-add-product"
            >
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{language === 'ar' ? 'سعر العقد' : 'Contract Price'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ltaProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {language === 'ar' ? 'لا توجد منتجات' : 'No products'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      ltaProducts.map((product) => (
                        <TableRow key={product.id} data-testid={`row-product-${product.productId}`}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">
                            {language === 'ar' ? product.nameAr : product.nameEn}
                          </TableCell>
                          <TableCell>
                            {product.contractPrice} {product.currency}
                          </TableCell>
                          <TableCell className="text-end">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPrice(product)}
                                data-testid={`button-edit-price-${product.productId}`}
                              >
                                <Pencil className="h-4 w-4 me-1" />
                                {language === 'ar' ? 'تعديل السعر' : 'Edit Price'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(product)}
                                data-testid={`button-remove-product-${product.productId}`}
                              >
                                <Trash2 className="h-4 w-4 me-1" />
                                {language === 'ar' ? 'إزالة' : 'Remove'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Assigned Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{language === 'ar' ? 'العملاء في هذه الاتفاقية' : 'Clients in this LTA'}</CardTitle>
            <Button 
              onClick={() => setAddClientDialogOpen(true)}
              data-testid="button-add-client"
            >
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إضافة عميل' : 'Add Client'}
            </Button>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ltaClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          {language === 'ar' ? 'لا يوجد عملاء' : 'No clients'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      ltaClients.map((client) => (
                        <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                          <TableCell className="font-medium">
                            {language === 'ar' ? client.nameAr : client.nameEn}
                          </TableCell>
                          <TableCell>{client.email || '-'}</TableCell>
                          <TableCell className="text-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveClient(client)}
                              data-testid={`button-remove-client-${client.id}`}
                            >
                              <Trash2 className="h-4 w-4 me-1" />
                              {language === 'ar' ? 'إزالة' : 'Remove'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit LTA Dialog */}
      <Dialog open={editLtaDialogOpen} onOpenChange={setEditLtaDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-lta">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الاتفاقية' : 'Edit LTA'}</DialogTitle>
          </DialogHeader>
          <Form {...editLtaForm}>
            <form onSubmit={editLtaForm.handleSubmit((data) => updateLtaMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editLtaForm.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name-en" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLtaForm.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLtaForm.control}
                name="descriptionEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-edit-description-en" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editLtaForm.control}
                name="descriptionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-edit-description-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editLtaForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full ps-3 text-start font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-edit-start-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: language === 'ar' ? ar : undefined })
                              ) : (
                                <span>{language === 'ar' ? 'اختر تاريخ' : 'Pick a date'}</span>
                              )}
                              <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editLtaForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full ps-3 text-start font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-edit-end-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: language === 'ar' ? ar : undefined })
                              ) : (
                                <span>{language === 'ar' ? 'اختر تاريخ' : 'Pick a date'}</span>
                              )}
                              <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editLtaForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الحالة' : 'Status'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Select status'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                        <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditLtaDialogOpen(false)}
                  data-testid="button-cancel-edit-lta"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={updateLtaMutation.isPending} data-testid="button-submit-edit-lta">
                  {updateLtaMutation.isPending ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث' : 'Update')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent data-testid="dialog-add-product">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة منتج' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <Form {...addProductForm}>
            <form onSubmit={addProductForm.handleSubmit((data) => addProductMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addProductForm.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'المنتج' : 'Product'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder={language === 'ar' ? 'اختر منتج' : 'Select product'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {language === 'ar' ? product.nameAr : product.nameEn} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addProductForm.control}
                name="contractPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'سعر العقد' : 'Contract Price'}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-contract-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addProductForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'العملة' : 'Currency'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder={language === 'ar' ? 'اختر العملة' : 'Select currency'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddProductDialogOpen(false)}
                  data-testid="button-cancel-add-product"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={addProductMutation.isPending} data-testid="button-submit-add-product">
                  {addProductMutation.isPending ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (language === 'ar' ? 'إضافة' : 'Add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Price Dialog */}
      <Dialog open={editPriceDialogOpen} onOpenChange={setEditPriceDialogOpen}>
        <DialogContent data-testid="dialog-edit-price">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل السعر' : 'Edit Price'}</DialogTitle>
          </DialogHeader>
          <Form {...editPriceForm}>
            <form onSubmit={editPriceForm.handleSubmit((data) => updatePriceMutation.mutate(data))} className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'المنتج' : 'Product'}</p>
                <p className="font-medium">{selectedProduct && (language === 'ar' ? selectedProduct.nameAr : selectedProduct?.nameEn)}</p>
              </div>
              <FormField
                control={editPriceForm.control}
                name="contractPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'سعر العقد الجديد' : 'New Contract Price'}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-edit-contract-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPriceForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'العملة' : 'Currency'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-currency">
                          <SelectValue placeholder={language === 'ar' ? 'اختر العملة' : 'Select currency'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditPriceDialogOpen(false)}
                  data-testid="button-cancel-edit-price"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={updatePriceMutation.isPending} data-testid="button-submit-edit-price">
                  {updatePriceMutation.isPending ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث' : 'Update')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Product Dialog */}
      <AlertDialog open={removeProductDialogOpen} onOpenChange={setRemoveProductDialogOpen}>
        <AlertDialogContent data-testid="dialog-remove-product">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الإزالة' : 'Confirm Removal'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من إزالة "${selectedProduct?.nameAr}" من الاتفاقية؟`
                : `Are you sure you want to remove "${selectedProduct?.nameEn}" from the LTA?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-product">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProduct && removeProductMutation.mutate(selectedProduct.productId)}
              disabled={removeProductMutation.isPending}
              data-testid="button-confirm-remove-product"
            >
              {removeProductMutation.isPending ? (language === 'ar' ? 'جاري الإزالة...' : 'Removing...') : (language === 'ar' ? 'إزالة' : 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Client Dialog */}
      <Dialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
        <DialogContent data-testid="dialog-add-client">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إضافة عميل' : 'Add Client'}</DialogTitle>
          </DialogHeader>
          <Form {...addClientForm}>
            <form onSubmit={addClientForm.handleSubmit((data) => addClientMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addClientForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'العميل' : 'Client'}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder={language === 'ar' ? 'اختر عميل' : 'Select client'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allClients.map((client) => (
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddClientDialogOpen(false)}
                  data-testid="button-cancel-add-client"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={addClientMutation.isPending} data-testid="button-submit-add-client">
                  {addClientMutation.isPending ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (language === 'ar' ? 'إضافة' : 'Add')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Client Dialog */}
      <AlertDialog open={removeClientDialogOpen} onOpenChange={setRemoveClientDialogOpen}>
        <AlertDialogContent data-testid="dialog-remove-client">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الإزالة' : 'Confirm Removal'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من إزالة "${selectedClient?.nameAr}" من الاتفاقية؟`
                : `Are you sure you want to remove "${selectedClient?.nameEn}" from the LTA?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove-client">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedClient && removeClientMutation.mutate(selectedClient.id)}
              disabled={removeClientMutation.isPending}
              data-testid="button-confirm-remove-client"
            >
              {removeClientMutation.isPending ? (language === 'ar' ? 'جاري الإزالة...' : 'Removing...') : (language === 'ar' ? 'إزالة' : 'Remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
