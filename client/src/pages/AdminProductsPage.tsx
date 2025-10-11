import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, ArrowLeft, Plus, Pencil, Trash2, X, ImageIcon, Download, Upload, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
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
  categoryNum: z.string().optional(),
  mainCategory: z.string().optional(),
  unitType: z.string().optional(),
  unit: z.string().optional(),
  unitPerBox: z.string().optional(),
  costPricePerBox: z.string().optional(),
  costPricePerPiece: z.string().optional(),
  sellingPricePack: z.string().optional(),
  sellingPricePiece: z.string().optional(),
  specificationsAr: z.string().optional(),
  vendorId: z.string().optional().nullable(),
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
  categoryNum?: string | null;
  mainCategory?: string | null;
  unitType?: string | null;
  unit?: string | null;
  unitPerBox?: string | null;
  costPricePerBox?: string | null;
  costPricePerPiece?: string | null;
  sellingPricePack?: string | null;
  sellingPricePiece?: string | null;
  specificationsAr?: string | null;
  vendorId?: string | null;
  imageUrl?: string | null;
}

interface Vendor {
  id: string;
  vendorNumber: string;
  nameEn: string;
  nameAr: string;
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    processing: boolean;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const itemsPerPage = 50;

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/all'],
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['/api/admin/vendors'],
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
      categoryNum: '',
      mainCategory: '',
      unitType: '',
      unit: '',
      unitPerBox: '',
      costPricePerBox: '',
      costPricePerPiece: '',
      sellingPricePack: '',
      sellingPricePiece: '',
      specificationsAr: '',
      vendorId: null,
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
      categoryNum: '',
      mainCategory: '',
      unitType: '',
      unit: '',
      unitPerBox: '',
      costPricePerBox: '',
      costPricePerPiece: '',
      sellingPricePack: '',
      sellingPricePiece: '',
      specificationsAr: '',
      vendorId: null,
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

  const exportProductsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/products/export', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        description: language === 'ar' ? 'تم تصدير المنتجات بنجاح' : 'Products exported successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        description: error.message,
      });
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Read file to get total count
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const totalRows = Math.max(0, lines.length - 1); // Exclude header
      
      setImportProgress({ current: 0, total: totalRows, processing: true });
      
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setImportResults(data);
      setImportProgress(null);
      toast({
        description: language === 'ar' ? data.messageAr : data.message,
      });
    },
    onError: (error: Error) => {
      setImportProgress(null);
      toast({
        variant: 'destructive',
        description: error.message,
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        variant: 'destructive',
        description: language === 'ar' ? 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت' : 'Image must be less than 5MB',
      });
      return;
    }
    
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast({
        variant: 'destructive',
        description: language === 'ar' ? 'الرجاء اختيار ملف CSV' : 'Please select a CSV file',
      });
      return;
    }
    
    await importProductsMutation.mutateAsync(importFile);
  };

  const downloadTemplate = () => {
    const csvHeader = 'SKU,Name (EN),Name (AR),Category Num,Unit Type,Unit,Unit Per Box,Cost Price Per Box,Cost Price Per Piece,Specifications (AR),Vendor Number,Main Category,Category,Selling Price Pack,Selling Price Piece,Description (EN),Description (AR),Image URL\n';
    const csvExample = '"SAMPLE-001","Sample Product","منتج عينة","1101","Box","Piece","12","120.00","10.50","مواصفات المنتج","V001","Electronics","Mobile Phones","130.00","11.00","Sample product description","وصف المنتج النموذجي",""';
    const csv = csvHeader + csvExample;
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCreateProduct = async (data: ProductFormValues) => {
    try {
      const product = await createProductMutation.mutateAsync(data);
      
      if (imageFile && product.id) {
        await uploadImageMutation.mutateAsync({
          productId: product.id,
          file: imageFile,
        });
      }
      
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
      categoryNum: product.categoryNum || '',
      mainCategory: product.mainCategory || '',
      unitType: product.unitType || '',
      unit: product.unit || '',
      unitPerBox: product.unitPerBox || '',
      costPricePerBox: product.costPricePerBox || '',
      costPricePerPiece: product.costPricePerPiece || '',
      sellingPricePack: product.sellingPricePack || '',
      sellingPricePiece: product.sellingPricePiece || '',
      specificationsAr: product.specificationsAr || '',
      vendorId: product.vendorId || null,
    });
    setImagePreview(product.imageUrl || null);
    setImageFile(null);
    setEditDialogOpen(true);
  };

  const handleUpdateProduct = async (data: ProductFormValues) => {
    if (!selectedProduct) return;
    
    try {
      await updateProductMutation.mutateAsync({ id: selectedProduct.id, data });
      
      if (imageFile) {
        await uploadImageMutation.mutateAsync({
          productId: selectedProduct.id,
          file: imageFile,
        });
      }
      
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

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.nameAr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesVendor = vendorFilter === 'all' || product.vendorId === vendorFilter;
    
    return matchesSearch && matchesCategory && matchesVendor;
  });

  // Get unique categories and vendors for filters
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const productVendors = Array.from(new Set(products.map(p => p.vendorId).filter(Boolean)));

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleVendorChange = (value: string) => {
    setVendorFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              data-testid="button-back-admin"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">
              {language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <CardTitle>
              {language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => exportProductsMutation.mutate()}
                disabled={exportProductsMutation.isPending}
                data-testid="button-export-products"
              >
                <Download className="h-4 w-4 me-2" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                data-testid="button-import-products"
              >
                <Upload className="h-4 w-4 me-2" />
                {language === 'ar' ? 'استيراد' : 'Import'}
              </Button>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-create-product"
              >
                <Plus className="h-4 w-4 me-2" />
                {language === 'ar' ? 'منتج جديد' : 'New Product'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'ar' ? 'البحث...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-products"
                  />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger data-testid="select-filter-category">
                    <SelectValue placeholder={language === 'ar' ? 'جميع الفئات' : 'All Categories'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category || ''}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Vendor Filter */}
                <Select value={vendorFilter} onValueChange={handleVendorChange}>
                  <SelectTrigger data-testid="select-filter-vendor">
                    <SelectValue placeholder={language === 'ar' ? 'جميع الموردين' : 'All Vendors'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'جميع الموردين' : 'All Vendors'}</SelectItem>
                    {productVendors.map((vendorId) => {
                      const vendor = vendors.find(v => v.id === vendorId);
                      return vendor ? (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {language === 'ar' ? vendor.nameAr : vendor.nameEn}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              <div className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} من ${filteredProducts.length} منتج`
                  : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredProducts.length)} of ${filteredProducts.length} products`
                }
              </div>
            </div>

            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'ar' ? 'الصورة' : 'Image'}</TableHead>
                        <TableHead>{language === 'ar' ? 'رمز المنتج' : 'SKU'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الوصف' : 'Description'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الفئة' : 'Category'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {language === 'ar' ? 'لا توجد منتجات' : 'No products'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedProducts.map((product) => (
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? `صفحة ${currentPage} من ${totalPages}`
                      : `Page ${currentPage} of ${totalPages}`
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 me-1" />
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                      <ChevronRight className="h-4 w-4 ms-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Product Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-product">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'منتج جديد' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateProduct)} className="space-y-6">
              {/* Image Upload Section - Prominent at top */}
              <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
                <FormLabel className="text-base mb-3 block">{language === 'ar' ? 'صورة المنتج' : 'Product Image'}</FormLabel>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {imagePreview ? (
                    <div className="relative w-48 h-48 border-2 rounded-lg overflow-hidden shadow-md">
                      <img src={imagePreview} alt="Product" className="w-full h-full object-cover" data-testid="preview-product-image" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 shadow-lg"
                        onClick={() => {setImagePreview(null); setImageFile(null);}}
                        data-testid="button-remove-image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-background">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                      data-testid="input-product-image"
                    />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'اختر صورة (PNG, JPG, WEBP - حد أقصى 5MB)' 
                        : 'Select image (PNG, JPG, WEBP - max 5MB)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'معلومات أساسية' : 'Basic Information'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رمز المنتج' : 'SKU'} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'المورد' : 'Vendor'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-vendor">
                              <SelectValue placeholder={language === 'ar' ? 'اختر مورداً' : 'Select a vendor'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.vendorNumber} - {language === 'ar' ? vendor.nameAr : vendor.nameEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *</FormLabel>
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
                        <FormLabel>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name-ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-description-en" />
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
                          <Textarea {...field} rows={3} data-testid="input-description-ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'التصنيفات' : 'Categories'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="mainCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الفئة الرئيسية' : 'Main Category'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} data-testid="input-main-category" />
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
                    name="categoryNum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الفئة' : 'Category Number'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} data-testid="input-category-num" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Units & Packaging */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'الوحدات والتعبئة' : 'Units & Packaging'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="unitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'نوع الوحدة' : 'Unit Type'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Box, Pack, Piece" data-testid="input-unit-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الوحدة' : 'Unit'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} data-testid="input-unit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="unitPerBox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'وحدة لكل صندوق' : 'Unit Per Box'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" data-testid="input-unit-per-box" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'التسعير' : 'Pricing'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="costPricePerBox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر التكلفة (صندوق)' : 'Cost Price Per Box'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-cost-price-box" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="costPricePerPiece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر التكلفة (قطعة)' : 'Cost Price Per Piece'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-cost-price-piece" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="sellingPricePack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر البيع (عبوة)' : 'Selling Price Pack'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-selling-price-pack" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="sellingPricePiece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر البيع (قطعة)' : 'Selling Price Piece'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-selling-price-piece" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Specifications */}
              <FormField
                control={createForm.control}
                name="specificationsAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'المواصفات (عربي)' : 'Specifications (Arabic)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} rows={4} data-testid="input-specifications-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-product">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل المنتج' : 'Edit Product'}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateProduct)} className="space-y-6">
              {/* Image Upload Section - Prominent at top */}
              <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
                <FormLabel className="text-base mb-3 block">{language === 'ar' ? 'صورة المنتج' : 'Product Image'}</FormLabel>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {imagePreview ? (
                    <div className="relative w-48 h-48 border-2 rounded-lg overflow-hidden shadow-md">
                      <img src={imagePreview} alt="Product" className="w-full h-full object-cover" data-testid="preview-edit-product-image" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 shadow-lg"
                        onClick={() => {setImagePreview(selectedProduct?.imageUrl || null); setImageFile(null);}}
                        data-testid="button-remove-edit-image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center bg-background">
                      <ImageIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                      data-testid="input-edit-product-image"
                    />
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'اختر صورة جديدة (PNG, JPG, WEBP - حد أقصى 5MB)' 
                        : 'Select new image (PNG, JPG, WEBP - max 5MB)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'معلومات أساسية' : 'Basic Information'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رمز المنتج' : 'SKU'} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="vendorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'المورد' : 'Vendor'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-vendor">
                              <SelectValue placeholder={language === 'ar' ? 'اختر مورداً' : 'Select a vendor'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.vendorNumber} - {language === 'ar' ? vendor.nameAr : vendor.nameEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *</FormLabel>
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
                        <FormLabel>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-name-ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="descriptionEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-edit-description-en" />
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
                          <Textarea {...field} rows={3} data-testid="input-edit-description-ar" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'التصنيفات' : 'Categories'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="mainCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الفئة الرئيسية' : 'Main Category'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} data-testid="input-edit-main-category" />
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
                    name="categoryNum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الفئة' : 'Category Number'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} data-testid="input-edit-category-num" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Units & Packaging */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'الوحدات والتعبئة' : 'Units & Packaging'}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="unitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'نوع الوحدة' : 'Unit Type'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Box, Pack, Piece" data-testid="input-edit-unit-type" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الوحدة' : 'Unit'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} data-testid="input-edit-unit" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="unitPerBox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'وحدة لكل صندوق' : 'Unit Per Box'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" data-testid="input-edit-unit-per-box" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                  {language === 'ar' ? 'التسعير' : 'Pricing'}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="costPricePerBox"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر التكلفة (صندوق)' : 'Cost Price Per Box'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-edit-cost-price-box" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="costPricePerPiece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر التكلفة (قطعة)' : 'Cost Price Per Piece'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-edit-cost-price-piece" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="sellingPricePack"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر البيع (عبوة)' : 'Selling Price Pack'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-edit-selling-price-pack" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="sellingPricePiece"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'سعر البيع (قطعة)' : 'Selling Price Piece'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" data-testid="input-edit-selling-price-piece" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Specifications */}
              <FormField
                control={editForm.control}
                name="specificationsAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'المواصفات (عربي)' : 'Specifications (Arabic)'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} rows={4} data-testid="input-edit-specifications-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
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

      {/* Import Products Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportFile(null);
          setImportResults(null);
          setImportProgress(null);
        }
      }}>
        <DialogContent className="max-w-2xl" data-testid="dialog-import-products">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'استيراد المنتجات' : 'Import Products'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'رفع ملف CSV لإنشاء أو تحديث المنتجات. سيتم تحديث المنتجات الموجودة بناءً على رمز المنتج (SKU).'
                : 'Upload a CSV file to create or update products. Existing products will be updated based on SKU.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-md">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {language === 'ar' ? 'قالب CSV' : 'CSV Template'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' 
                    ? 'قم بتنزيل القالب لمعرفة التنسيق الصحيح' 
                    : 'Download the template to see the correct format'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4 me-2" />
                {language === 'ar' ? 'تحميل القالب' : 'Download Template'}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">
                {language === 'ar' ? 'ملف CSV' : 'CSV File'}
              </label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleImportFileChange}
                className="mt-2"
                data-testid="input-import-file"
              />
              {importFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ar' ? 'الملف المحدد:' : 'Selected file:'} {importFile.name}
                </p>
              )}
            </div>

            {importProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}
                  </span>
                  <span className="text-muted-foreground">
                    {language === 'ar' 
                      ? `${importProgress.current} من ${importProgress.total}`
                      : `${importProgress.current} of ${importProgress.total}`
                    }
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {importResults && (
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2">
                    {language === 'ar' ? 'نتائج الاستيراد' : 'Import Results'}
                  </p>
                  <p className="text-sm">
                    {language === 'ar' 
                      ? `نجح: ${importResults.success.length} | فشل: ${importResults.errors.length}`
                      : `Success: ${importResults.success.length} | Failed: ${importResults.errors.length}`
                    }
                  </p>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    <p className="text-sm font-medium text-destructive">
                      {language === 'ar' ? 'الأخطاء:' : 'Errors:'}
                    </p>
                    {importResults.errors.map((error: any, idx: number) => (
                      <div key={idx} className="text-xs p-2 bg-destructive/10 rounded">
                        {language === 'ar' 
                          ? `الصف ${error.row}: ${error.messageAr || error.message}`
                          : `Row ${error.row}: ${error.message}`
                        }
                      </div>
                    ))}
                  </div>
                )}

                {importResults.success.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {language === 'ar' ? 'نجح:' : 'Success:'}
                    </p>
                    {importResults.success.slice(0, 10).map((item: any, idx: number) => (
                      <div key={idx} className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        {language === 'ar' 
                          ? `الصف ${item.row}: ${item.sku} - ${item.actionAr}`
                          : `Row ${item.row}: ${item.sku} - ${item.action}`
                        }
                      </div>
                    ))}
                    {importResults.success.length > 10 && (
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' 
                          ? `و ${importResults.success.length - 10} أخرى...`
                          : `and ${importResults.success.length - 10} more...`
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              data-testid="button-cancel-import"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importProductsMutation.isPending || importProgress?.processing}
              data-testid="button-submit-import"
            >
              {importProductsMutation.isPending || importProgress?.processing
                ? (language === 'ar' ? 'جاري الاستيراد...' : 'Importing...') 
                : (language === 'ar' ? 'استيراد' : 'Import')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
