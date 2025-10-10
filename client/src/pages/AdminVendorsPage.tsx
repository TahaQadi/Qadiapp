import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const vendorFormSchema = z.object({
  vendorNumber: z.string().min(1, 'Vendor number is required'),
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface Vendor {
  id: string;
  vendorNumber: string;
  nameEn: string;
  nameAr: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

export default function AdminVendorsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ['/api/admin/vendors'],
  });

  const createForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendorNumber: '',
      nameEn: '',
      nameAr: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
  });

  const editForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendorNumber: '',
      nameEn: '',
      nameAr: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VendorFormValues) => {
      const res = await apiRequest('POST', '/api/admin/vendors', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: language === 'ar' ? 'تم إنشاء المورد' : 'Vendor Created',
        description: language === 'ar' ? 'تم إنشاء المورد بنجاح' : 'Vendor has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في إنشاء المورد' : 'Failed to create vendor'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: VendorFormValues) => {
      if (!selectedVendor) return;
      const res = await apiRequest('PUT', `/api/admin/vendors/${selectedVendor.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      setEditDialogOpen(false);
      setSelectedVendor(null);
      editForm.reset();
      toast({
        title: language === 'ar' ? 'تم تحديث المورد' : 'Vendor Updated',
        description: language === 'ar' ? 'تم تحديث المورد بنجاح' : 'Vendor has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في تحديث المورد' : 'Failed to update vendor'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
      toast({
        title: language === 'ar' ? 'تم حذف المورد' : 'Vendor Deleted',
        description: language === 'ar' ? 'تم حذف المورد بنجاح' : 'Vendor has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في حذف المورد' : 'Failed to delete vendor'),
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    editForm.reset({
      vendorNumber: vendor.vendorNumber,
      nameEn: vendor.nameEn,
      nameAr: vendor.nameAr,
      contactEmail: vendor.contactEmail || '',
      contactPhone: vendor.contactPhone || '',
      address: vendor.address || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const onCreateSubmit = (data: VendorFormValues) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: VendorFormValues) => {
    updateMutation.mutate(data);
  };

  const confirmDelete = () => {
    if (selectedVendor) {
      deleteMutation.mutate(selectedVendor.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin" data-testid="link-admin">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                {language === 'ar' ? 'إدارة الموردين' : 'Vendor Management'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle data-testid="text-vendors-title">
              {language === 'ar' ? 'قائمة الموردين' : 'Vendors List'}
            </CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-vendor">
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إضافة مورد' : 'Add Vendor'}
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-create-vendor">
                <DialogHeader>
                  <DialogTitle>
                    {language === 'ar' ? 'إضافة مورد جديد' : 'Add New Vendor'}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'ar' 
                      ? 'أدخل معلومات المورد الجديد' 
                      : 'Enter the details for the new vendor'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="vendorNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'رقم المورد' : 'Vendor Number'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-vendor-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <FormField
                      control={createForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'العنوان' : 'Address'}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        data-testid="button-submit-create"
                      >
                        {createMutation.isPending
                          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                          : (language === 'ar' ? 'حفظ' : 'Save')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8" data-testid="text-loading">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-vendors">
                {language === 'ar' ? 'لا توجد موردين' : 'No vendors found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">
                        {language === 'ar' ? 'رقم المورد' : 'Vendor #'}
                      </th>
                      <th className="text-left p-3 font-semibold">
                        {language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}
                      </th>
                      <th className="text-left p-3 font-semibold">
                        {language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}
                      </th>
                      <th className="text-left p-3 font-semibold">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </th>
                      <th className="text-left p-3 font-semibold">
                        {language === 'ar' ? 'الهاتف' : 'Phone'}
                      </th>
                      <th className="text-left p-3 font-semibold">
                        {language === 'ar' ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b" data-testid={`row-vendor-${vendor.id}`}>
                        <td className="p-3" data-testid={`text-vendor-number-${vendor.id}`}>
                          {vendor.vendorNumber}
                        </td>
                        <td className="p-3" data-testid={`text-name-en-${vendor.id}`}>
                          {vendor.nameEn}
                        </td>
                        <td className="p-3" data-testid={`text-name-ar-${vendor.id}`}>
                          {vendor.nameAr}
                        </td>
                        <td className="p-3" data-testid={`text-email-${vendor.id}`}>
                          {vendor.contactEmail || '-'}
                        </td>
                        <td className="p-3" data-testid={`text-phone-${vendor.id}`}>
                          {vendor.contactPhone || '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(vendor)}
                              data-testid={`button-edit-${vendor.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(vendor)}
                              data-testid={`button-delete-${vendor.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-vendor">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل المورد' : 'Edit Vendor'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'قم بتحديث معلومات المورد' 
                : 'Update the vendor details'}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="vendorNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'رقم المورد' : 'Vendor Number'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-vendor-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={editForm.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'العنوان' : 'Address'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-edit-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث' : 'Update')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? `سيتم حذف المورد "${selectedVendor?.nameAr}" بشكل دائم. لا يمكن التراجع عن هذا الإجراء.`
                : `This will permanently delete vendor "${selectedVendor?.nameEn}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
