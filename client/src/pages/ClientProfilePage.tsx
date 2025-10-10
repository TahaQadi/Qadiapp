import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LogOut, ArrowLeft, User, Building2, MapPin, Phone, Mail, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
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

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nameEn: user?.client?.nameEn || '',
      nameAr: user?.client?.nameAr || '',
      email: user?.client?.email || '',
      phone: user?.client?.phone || '',
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
        title: language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile Updated',
        description: language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Your changes have been saved successfully',
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile',
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

  const departments = (user.departments || []) as ClientDepartment[];
  const locations = (user.locations || []) as ClientLocation[];

  // Department Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/client/departments', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: language === 'ar' ? 'تمت الإضافة' : 'Added',
        description: language === 'ar' ? 'تم إضافة القسم بنجاح' : 'Department added successfully',
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
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث القسم بنجاح' : 'Department updated successfully',
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
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف القسم بنجاح' : 'Department deleted successfully',
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
        title: language === 'ar' ? 'تمت الإضافة' : 'Added',
        description: language === 'ar' ? 'تم إضافة الموقع بنجاح' : 'Location added successfully',
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
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث الموقع بنجاح' : 'Location updated successfully',
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
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الموقع بنجاح' : 'Location deleted successfully',
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
    finance: language === 'ar' ? 'المالية' : 'Finance',
    purchase: language === 'ar' ? 'المشتريات' : 'Purchase',
    warehouse: language === 'ar' ? 'المستودع' : 'Warehouse',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-10 w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] transition-transform hover:scale-110 duration-300"
            />
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent">
                {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 hover:text-primary dark:hover:text-[#d4af37] transition-all duration-300"
            >
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              className="hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 animate-slide-down">
            {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
          </h2>

          <div className="grid gap-6">
            {/* Personal Information Card */}
            <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 transition-all duration-500 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                    <User className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                  </div>
                  {language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}</p>
                    <p className="font-medium text-foreground dark:text-white">{user.nameAr}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                    <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}</p>
                    <p className="font-medium text-foreground dark:text-white">{user.nameEn}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10 md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <p className="font-medium text-foreground dark:text-white">{user.email}</p>
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
                    {language === 'ar' ? 'معلومات العميل' : 'Client Information'}
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
                      {language === 'ar' ? 'تعديل' : 'Edit'}
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
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
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
                          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                          : (language === 'ar' ? 'حفظ' : 'Save')
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
                      <Label htmlFor="nameAr">{language === 'ar' ? 'اسم العميل (عربي)' : 'Client Name (Arabic)'}</Label>
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
                      <Label htmlFor="nameEn">{language === 'ar' ? 'اسم العميل (إنجليزي)' : 'Client Name (English)'}</Label>
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
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
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
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
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
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'اسم العميل (عربي)' : 'Client Name (Arabic)'}</p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.nameAr || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'اسم العميل (إنجليزي)' : 'Client Name (English)'}</p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.nameEn || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.email || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 dark:bg-accent/10 border border-border/50 dark:border-[#d4af37]/10">
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </p>
                      <p className="font-medium text-foreground dark:text-white">{user.client?.phone || '-'}</p>
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
                    {language === 'ar' ? 'الأقسام' : 'Departments'}
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
                    {language === 'ar' ? 'إضافة قسم' : 'Add Department'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {departments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'لا توجد أقسام مسجلة' : 'No departments registered'}
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
                    {language === 'ar' ? 'المواقع' : 'Locations'}
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
                    {language === 'ar' ? 'إضافة موقع' : 'Add Location'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مواقع مسجلة' : 'No locations registered'}
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
                                {language === 'ar' ? location.nameAr : location.nameEn}
                              </h4>
                              {location.isHeadquarters && (
                                <Badge variant="default" data-testid={`badge-headquarters-${location.id}`}>
                                  {language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {language === 'ar' ? location.addressAr : location.addressEn}
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
        </div>
      </main>

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
    </div>
  );
}