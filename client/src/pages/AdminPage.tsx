import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, User, Plus, Pencil, Trash2, Package, Users, Boxes, FileText, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  stockStatus: z.enum(['in-stock', 'low-stock', 'out-of-stock']).default('in-stock'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  sku: string;
  category?: string | null;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  imageUrl?: string | null;
}

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
  });

  const createForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      sku: '',
      category: '',
      stockStatus: 'in-stock',
    },
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      sku: '',
      category: '',
      stockStatus: 'in-stock',
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest('POST', '/api/products', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: language === 'ar' ? 'تم إنشاء المنتج بنجاح' : 'Product created successfully',
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إنشاء المنتج' : 'Error creating product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormValues }) => {
      const res = await apiRequest('PUT', `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: language === 'ar' ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully',
      });
      setEditDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث المنتج' : 'Error updating product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: language === 'ar' ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في حذف المنتج' : 'Error deleting product',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/admin/products/${productId}/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        description: language === 'ar' ? 'تم رفع صورة المنتج بنجاح' : 'Product image uploaded successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        description: error.message,
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        variant: 'destructive',
        description: language === 'ar' ? 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت' : 'Image must be less than 5MB',
      });
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (data: ProductFormValues) => {
    try {
      const product = await createProductMutation.mutateAsync(data);
      
      // Upload image if file selected
      if (imageFile && product.id) {
        await uploadImageMutation.mutateAsync({
          productId: product.id,
          file: imageFile,
        });
      }
      
      // Close dialog and reset
      setCreateDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
      createForm.reset();
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    editForm.reset({
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      descriptionEn: product.descriptionEn || '',
      descriptionAr: product.descriptionAr || '',
      sku: product.sku,
      category: product.category || '',
      stockStatus: product.stockStatus,
    });
    // Set preview to existing image if available
    setImagePreview(product.imageUrl || null);
    setImageFile(null);
    setEditDialogOpen(true);
  };

  const handleUpdateProduct = async (data: ProductFormValues) => {
    if (!selectedProduct) return;
    
    try {
      await updateProductMutation.mutateAsync({ id: selectedProduct.id, data });
      
      // Upload image if file selected
      if (imageFile) {
        await uploadImageMutation.mutateAsync({
          productId: selectedProduct.id,
          file: imageFile,
        });
      }
      
      // Close dialog and reset
      setEditDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
      setSelectedProduct(null);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge variant="default" data-testid={`badge-stock-${status}`}>{language === 'ar' ? 'متوفر' : 'In Stock'}</Badge>;
      case 'low-stock':
        return <Badge variant="secondary" data-testid={`badge-stock-${status}`}>{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</Badge>;
      case 'out-of-stock':
        return <Badge variant="destructive" data-testid={`badge-stock-${status}`}>{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
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
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card 
            className="hover-elevate cursor-pointer" 
            onClick={() => setLocation('/admin/ltas')}
            data-testid="card-manage-ltas"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'إدارة الاتفاقيات' : 'LTA Management'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'إدارة العقود والمنتجات والعملاء' : 'Manage contracts, products, and clients'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover-elevate cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'إدارة المنتجات' : 'Manage Products'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'إدارة كتالوج المنتجات' : 'Manage product catalog'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card 
            className="hover-elevate cursor-pointer" 
            onClick={() => setLocation('/admin/inventory')}
            data-testid="card-manage-inventory"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <Boxes className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'إدارة المخزون' : 'Manage Inventory'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'ar' ? 'تتبع وتعديل مخزون المنتجات' : 'Track and adjust product stock'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>
              {language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}
            </CardTitle>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              data-testid="button-create-product"
            >
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'منتج جديد' : 'New Product'}
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                      <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {language === 'ar' ? 'لا توجد منتجات' : 'No products'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                          <TableCell>
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={language === 'ar' ? product.nameAr : product.nameEn}
                                className="w-12 h-12 object-cover rounded"
                                data-testid={`img-product-${product.id}`}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center" data-testid={`placeholder-product-${product.id}`}>
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium">
                            {language === 'ar' ? product.nameAr : product.nameEn}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {language === 'ar' ? product.descriptionAr : product.descriptionEn}
                          </TableCell>
                          <TableCell className="text-sm">{product.category || '-'}</TableCell>
                          <TableCell>{getStockStatusBadge(product.stockStatus)}</TableCell>
                          <TableCell className="text-end">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Pencil className="h-4 w-4 me-1" />
                                {language === 'ar' ? 'تعديل' : 'Edit'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
                                data-testid={`button-delete-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4 me-1" />
                                {language === 'ar' ? 'حذف' : 'Delete'}
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
      </main>

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-create-product">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'منتج جديد' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateProduct)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="nameAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name-ar" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-description-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="descriptionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-description-ar" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الفئة' : 'Category'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="stockStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'حالة المخزون' : 'Stock Status'}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stock-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in-stock">{language === 'ar' ? 'متوفر' : 'In Stock'}</SelectItem>
                          <SelectItem value="low-stock">{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</SelectItem>
                          <SelectItem value="out-of-stock">{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>{language === 'ar' ? 'صورة المنتج' : 'Product Image'}</FormLabel>
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Product" className="w-full h-full object-cover" data-testid="preview-product-image" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {setImagePreview(null); setImageFile(null);}}
                      data-testid="button-remove-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  data-testid="input-product-image"
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createProductMutation.isPending ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (language === 'ar' ? 'إنشاء' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-product">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProduct)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'الفئة' : 'Category'}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-category" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="stockStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'حالة المخزون' : 'Stock Status'}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-stock-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in-stock">{language === 'ar' ? 'متوفر' : 'In Stock'}</SelectItem>
                          <SelectItem value="low-stock">{language === 'ar' ? 'مخزون منخفض' : 'Low Stock'}</SelectItem>
                          <SelectItem value="out-of-stock">{language === 'ar' ? 'غير متوفر' : 'Out of Stock'}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>{language === 'ar' ? 'صورة المنتج' : 'Product Image'}</FormLabel>
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Product" className="w-full h-full object-cover" data-testid="preview-edit-product-image" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {setImagePreview(selectedProduct?.imageUrl || null); setImageFile(null);}}
                      data-testid="button-remove-edit-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  data-testid="input-edit-product-image"
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProductMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateProductMutation.isPending ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'حفظ' : 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-product">
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف المنتج "${selectedProduct?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete product "${selectedProduct?.nameEn}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteProductMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteProductMutation.isPending ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (language === 'ar' ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
