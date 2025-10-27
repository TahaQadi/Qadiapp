import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LogOut, ArrowLeft, User, Building2, MapPin, Phone, Mail, Edit2, Save, X, Plus, Trash2, Package, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ClientDepartment, ClientLocation } from '@shared/schema';
import { DepartmentManagementDialog } from '@/components/DepartmentManagementDialog';
import { LocationManagementDialog } from '@/components/LocationManagementDialog';
import { SEO } from '@/components/SEO';

const updateProfileSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const isArabic = language === 'ar';

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nameEn: user?.nameEn || '',
      nameAr: user?.nameAr || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileForm) => {
      const res = await apiRequest('PUT', '/api/client/profile', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تم تحديث الملف الشخصي' : 'Profile Updated',
        description: isArabic ? 'تم حفظ التغييرات بنجاح' : 'Your changes have been saved successfully',
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile',
      });
    },
  });

  const handleSave = () => {
    form.handleSubmit((data) => {
      updateProfileMutation.mutate(data);
    })();
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  // Departments & Locations State
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<ClientDepartment | null>(null);
  const [editingLocation, setEditingLocation] = useState<ClientLocation | null>(null);

  const departments = (user?.departments || []) as ClientDepartment[];
  const locations = (user?.locations || []) as ClientLocation[];

  // Department Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/client/departments', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تمت الإضافة' : 'Added',
        description: isArabic ? 'تم إضافة القسم بنجاح' : 'Department added successfully',
      });
      setDepartmentDialogOpen(false);
      setEditingDepartment(null);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiRequest('PUT', `/api/client/departments/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تم التحديث' : 'Updated',
        description: isArabic ? 'تم تحديث القسم بنجاح' : 'Department updated successfully',
      });
      setDepartmentDialogOpen(false);
      setEditingDepartment(null);
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تم الحذف' : 'Deleted',
        description: isArabic ? 'تم حذف القسم بنجاح' : 'Department deleted successfully',
      });
    },
  });

  // Location Mutations
  const createLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/client/locations', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تمت الإضافة' : 'Added',
        description: isArabic ? 'تم إضافة الموقع بنجاح' : 'Location added successfully',
      });
      setLocationDialogOpen(false);
      setEditingLocation(null);
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiRequest('PUT', `/api/client/locations/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تم التحديث' : 'Updated',
        description: isArabic ? 'تم تحديث الموقع بنجاح' : 'Location updated successfully',
      });
      setLocationDialogOpen(false);
      setEditingLocation(null);
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: isArabic ? 'تم الحذف' : 'Deleted',
        description: isArabic ? 'تم حذف الموقع بنجاح' : 'Location deleted successfully',
      });
    },
  });

  const handleSaveDepartment = (data: any) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const handleSaveLocation = (data: any) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data });
    } else {
      createLocationMutation.mutate(data);
    }
  };

  const departmentTypeLabels = {
    finance: isArabic ? 'المالية' : 'Finance',
    purchase: isArabic ? 'المشتريات' : 'Purchase',
    warehouse: isArabic ? 'المستودع' : 'Warehouse',
  };

  if (!user) return null;

  return (
    <>
      <SEO
        title={isArabic ? "الملف الشخصي" : "Profile"}
        description={isArabic ? "إدارة معلومات الملف الشخصي" : "Manage your profile information"}
        noIndex={true}
      />
      <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
          <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300"
                title={isArabic ? 'العودة للطلبات' : 'Back to Ordering'}
              >
                <Link href="/ordering">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <img 
                src="/logo.png" 
                alt={isArabic ? 'شعار الشركة' : 'Company Logo'} 
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
              />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                  {isArabic ? 'الملف الشخصي' : 'Profile'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10">
                <Link href="/orders">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              {user?.isAdmin && (
                <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10">
                  <Link href="/admin">
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              )}
              <LanguageToggle />
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 sm:h-10 sm:w-10">
                <Link href="/logout">
                  <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
          <div className="grid gap-6">
            {/* Personal Information Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                    <User className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                  </div>
                  {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1">{isArabic ? 'الاسم بالعربية' : 'Name (Arabic)'}</p>
                    <p className="font-medium text-foreground dark:text-white">{user?.nameAr || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'Name (English)'}</p>
                    <p className="font-medium text-foreground dark:text-white">{user?.nameEn || '-'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10 md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <p className="font-medium text-foreground dark:text-white">{user?.email || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                      <Building2 className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                    </div>
                    {isArabic ? 'معلومات العميل' : 'Client Information'}
                  </CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="h-4 w-4" />
                      {isArabic ? 'تعديل' : 'Edit'}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        className="gap-2"
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4" />
                        {isArabic ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="gap-2"
                        data-testid="button-save-profile"
                      >
                        <Save className="h-4 w-4" />
                        {updateProfileMutation.isPending
                          ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                          : (isArabic ? 'حفظ' : 'Save')
                        }
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nameAr">{isArabic ? 'اسم العميل (عربي)' : 'Client Name (Arabic)'}</Label>
                      <Input
                        id="nameAr"
                        {...form.register('nameAr')}
                        data-testid="input-name-ar"
                      />
                      {form.formState.errors.nameAr && (
                        <p className="text-sm text-destructive">{form.formState.errors.nameAr.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameEn">{isArabic ? 'اسم العميل (إنجليزي)' : 'Client Name (English)'}</Label>
                      <Input
                        id="nameEn"
                        {...form.register('nameEn')}
                        data-testid="input-name-en"
                      />
                      {form.formState.errors.nameEn && (
                        <p className="text-sm text-destructive">{form.formState.errors.nameEn.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        data-testid="input-email"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register('phone')}
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1">{isArabic ? 'اسم العميل (عربي)' : 'Client Name (Arabic)'}</p>
                      <p className="font-medium text-foreground dark:text-white">{user?.nameAr || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1">{isArabic ? 'اسم العميل (إنجليزي)' : 'Client Name (English)'}</p>
                      <p className="font-medium text-foreground dark:text-white">{user?.nameEn || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user?.email || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user?.phone || '-'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Departments Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                      <Building2 className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                    </div>
                    {isArabic ? 'الأقسام' : 'Departments'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDepartment(null);
                      setDepartmentDialogOpen(true);
                    }}
                    className="gap-2"
                    data-testid="button-add-department"
                  >
                    <Plus className="h-4 w-4" />
                    {isArabic ? 'إضافة قسم' : 'Add Department'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isArabic ? 'لا توجد أقسام مسجلة' : 'No departments registered'}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10 hover-elevate"
                        data-testid={`department-card-${dept.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" data-testid={`badge-department-type-${dept.id}`}>
                                {departmentTypeLabels[dept.departmentType as keyof typeof departmentTypeLabels]}
                              </Badge>
                            </div>
                            {dept.contactName && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground dark:text-white">{dept.contactName}</span>
                              </div>
                            )}
                            {dept.contactEmail && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground dark:text-white">{dept.contactEmail}</span>
                              </div>
                            )}
                            {dept.contactPhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground dark:text-white">{dept.contactPhone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingDepartment(dept);
                                setDepartmentDialogOpen(true);
                              }}
                              data-testid={`button-edit-department-${dept.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDepartmentMutation.mutate(dept.id)}
                              disabled={deleteDepartmentMutation.isPending}
                              data-testid={`button-delete-department-${dept.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locations Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                      <MapPin className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                    </div>
                    {isArabic ? 'المواقع' : 'Locations'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingLocation(null);
                      setLocationDialogOpen(true);
                    }}
                    className="gap-2"
                    data-testid="button-add-location"
                  >
                    <Plus className="h-4 w-4" />
                    {isArabic ? 'إضافة موقع' : 'Add Location'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isArabic ? 'لا توجد مواقع مسجلة' : 'No locations registered'}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10 hover-elevate"
                        data-testid={`location-card-${location.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-foreground dark:text-white">
                                {isArabic ? location.nameAr : location.nameEn}
                              </h4>
                              {location.isHeadquarters && (
                                <Badge variant="default" data-testid={`badge-headquarters-${location.id}`}>
                                  {isArabic ? 'المقر الرئيسي' : 'Headquarters'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {isArabic ? location.addressAr : location.addressEn}
                              {(location.city || location.country) && (
                                <span>
                                  {', '}
                                  {[location.city, location.country].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>
                            {location.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground dark:text-white">{location.phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingLocation(location);
                                setLocationDialogOpen(true);
                              }}
                              data-testid={`button-edit-location-${location.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLocationMutation.mutate(location.id)}
                              disabled={deleteLocationMutation.isPending}
                              data-testid={`button-delete-location-${location.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <DepartmentManagementDialog
        open={departmentDialogOpen}
        onOpenChange={setDepartmentDialogOpen}
        department={editingDepartment}
        onSave={handleSaveDepartment}
        isSaving={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
      />
      <LocationManagementDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        location={editingLocation}
        onSave={handleSaveLocation}
        isSaving={createLocationMutation.isPending || updateLocationMutation.isPending}
      />
    </>
  );
}