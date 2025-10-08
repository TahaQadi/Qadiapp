import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Building, MapPin, Phone, Mail, Plus, Pencil, Trash2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ClientDepartment, ClientLocation } from '@shared/schema';

const profileFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

const departmentFormSchema = z.object({
  departmentType: z.string().min(1, 'Department type is required'),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

const locationFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  addressEn: z.string().min(1, 'English address is required'),
  addressAr: z.string().min(1, 'Arabic address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  isHeadquarters: z.boolean().default(false),
});

interface ClientProfile {
  client: {
    id: string;
    nameEn: string;
    nameAr: string;
    username: string;
    email?: string | null;
    phone?: string | null;
  };
  departments: ClientDepartment[];
  locations: ClientLocation[];
}

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [editingProfile, setEditingProfile] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<ClientDepartment | null>(null);
  const [editingLocation, setEditingLocation] = useState<ClientLocation | null>(null);

  const { data: profile } = useQuery<ClientProfile>({
    queryKey: ['/api/client/profile'],
  });

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      email: '',
      phone: '',
    },
  });

  const deptForm = useForm({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      departmentType: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  const locationForm = useForm({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      addressEn: '',
      addressAr: '',
      city: '',
      country: '',
      phone: '',
      isHeadquarters: false as boolean,
    },
  });

  useEffect(() => {
    if (profile?.client) {
      profileForm.reset({
        nameEn: profile.client.nameEn,
        nameAr: profile.client.nameAr,
        email: profile.client.email || '',
        phone: profile.client.phone || '',
      });
    }
  }, [profile, profileForm]);

  useEffect(() => {
    if (editingDept) {
      deptForm.reset({
        departmentType: editingDept.departmentType,
        contactName: editingDept.contactName || '',
        contactEmail: editingDept.contactEmail || '',
        contactPhone: editingDept.contactPhone || '',
      });
      setDeptDialogOpen(true);
    } else {
      deptForm.reset({
        departmentType: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
      });
    }
  }, [editingDept, deptForm]);

  useEffect(() => {
    if (editingLocation) {
      locationForm.reset({
        nameEn: editingLocation.nameEn,
        nameAr: editingLocation.nameAr,
        addressEn: editingLocation.addressEn,
        addressAr: editingLocation.addressAr,
        city: editingLocation.city || '',
        country: editingLocation.country || '',
        phone: editingLocation.phone || '',
        isHeadquarters: !!editingLocation.isHeadquarters,
      });
      setLocationDialogOpen(true);
    } else {
      locationForm.reset({
        nameEn: '',
        nameAr: '',
        addressEn: '',
        addressAr: '',
        city: '',
        country: '',
        phone: '',
        isHeadquarters: false,
      });
    }
  }, [editingLocation, locationForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PUT', '/api/client/profile', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/profile'] });
      setEditingProfile(false);
      toast({
        title: language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في التحديث' : 'Error updating',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const saveDeptMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingDept) {
        const res = await apiRequest('PUT', `/api/client/departments/${editingDept.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest('POST', '/api/client/departments', data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/profile'] });
      setDeptDialogOpen(false);
      setEditingDept(null);
      toast({
        title: language === 'ar' 
          ? (editingDept ? 'تم تحديث القسم بنجاح' : 'تم إضافة القسم بنجاح')
          : (editingDept ? 'Department updated successfully' : 'Department added successfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/profile'] });
      toast({
        title: language === 'ar' ? 'تم حذف القسم بنجاح' : 'Department deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في الحذف' : 'Error deleting',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const saveLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingLocation) {
        const res = await apiRequest('PUT', `/api/client/locations/${editingLocation.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest('POST', '/api/client/locations', data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/profile'] });
      setLocationDialogOpen(false);
      setEditingLocation(null);
      toast({
        title: language === 'ar' 
          ? (editingLocation ? 'تم تحديث الموقع بنجاح' : 'تم إضافة الموقع بنجاح')
          : (editingLocation ? 'Location updated successfully' : 'Location added successfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/client/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/client/profile'] });
      toast({
        title: language === 'ar' ? 'تم حذف الموقع بنجاح' : 'Location deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في الحذف' : 'Error deleting',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getDepartmentTypeLabel = (type: string) => {
    const types: Record<string, { en: string; ar: string }> = {
      finance: { en: 'Finance', ar: 'المالية' },
      purchase: { en: 'Purchase', ar: 'المشتريات' },
      warehouse: { en: 'Warehouse', ar: 'المستودع' },
    };
    return language === 'ar' ? types[type]?.ar || type : types[type]?.en || type;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'الملف الشخصي' : 'Client Profile'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? profile?.client.nameAr : profile?.client.nameEn}
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" data-testid="tab-info">
            <Building className="h-4 w-4 me-2" />
            {language === 'ar' ? 'المعلومات' : 'Information'}
          </TabsTrigger>
          <TabsTrigger value="departments" data-testid="tab-departments">
            <Building className="h-4 w-4 me-2" />
            {language === 'ar' ? 'الأقسام' : 'Departments'}
          </TabsTrigger>
          <TabsTrigger value="locations" data-testid="tab-locations">
            <MapPin className="h-4 w-4 me-2" />
            {language === 'ar' ? 'المواقع' : 'Locations'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
              </h2>
              {!editingProfile && (
                <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} data-testid="button-edit-profile">
                  <Pencil className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
              )}
            </div>

            {editingProfile ? (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
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
                      control={profileForm.control}
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
                  <FormField
                    control={profileForm.control}
                    name="email"
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
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                      {updateProfileMutation.isPending
                        ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                        : (language === 'ar' ? 'حفظ' : 'Save')}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingProfile(false)} data-testid="button-cancel-profile">
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
                  <p className="mt-1 font-medium" data-testid="text-username">{profile?.client.username}</p>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <p className="mt-1 font-medium" data-testid="text-email">{profile?.client.email || '-'}</p>
                </div>
                <div>
                  <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                  <p className="mt-1 font-medium" data-testid="text-phone">{profile?.client.phone || '-'}</p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingDept(null); setDeptDialogOpen(true); }} data-testid="button-add-department">
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إضافة قسم' : 'Add Department'}
            </Button>
          </div>

          {profile?.departments?.map((dept: ClientDepartment) => (
            <Card key={dept.id} className="p-6" data-testid={`card-department-${dept.id}`}>
              <div className="flex items-start justify-between mb-4">
                <Badge>
                  {getDepartmentTypeLabel(dept.departmentType)}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setEditingDept(dept)} data-testid={`button-edit-dept-${dept.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this department?')) {
                        deleteDeptMutation.mutate(dept.id);
                      }
                    }}
                    data-testid={`button-delete-dept-${dept.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dept.contactName || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dept.contactEmail || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dept.contactPhone || '-'}</span>
                </div>
              </div>
            </Card>
          ))}

          {(!profile?.departments || profile.departments.length === 0) && (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد أقسام' : 'No departments configured'}
              </p>
            </Card>
          )}

          <Dialog open={deptDialogOpen} onOpenChange={(open) => { setDeptDialogOpen(open); if (!open) setEditingDept(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDept
                    ? (language === 'ar' ? 'تعديل القسم' : 'Edit Department')
                    : (language === 'ar' ? 'إضافة قسم' : 'Add Department')}
                </DialogTitle>
              </DialogHeader>
              <Form {...deptForm}>
                <form onSubmit={deptForm.handleSubmit((data) => saveDeptMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={deptForm.control}
                    name="departmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'نوع القسم' : 'Department Type'}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-dept-type">
                              <SelectValue placeholder={language === 'ar' ? 'اختر نوع القسم' : 'Select department type'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="finance">{language === 'ar' ? 'المالية' : 'Finance'}</SelectItem>
                            <SelectItem value="purchase">{language === 'ar' ? 'المشتريات' : 'Purchase'}</SelectItem>
                            <SelectItem value="warehouse">{language === 'ar' ? 'المستودع' : 'Warehouse'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={deptForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'اسم جهة الاتصال' : 'Contact Name'}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-dept-contact-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={deptForm.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-dept-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={deptForm.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-dept-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={saveDeptMutation.isPending} data-testid="button-submit-dept">
                      {saveDeptMutation.isPending
                        ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                        : (language === 'ar' ? 'حفظ' : 'Save')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingLocation(null); setLocationDialogOpen(true); }} data-testid="button-add-location">
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إضافة موقع' : 'Add Location'}
            </Button>
          </div>

          {profile?.locations?.map((location: ClientLocation) => (
            <Card key={location.id} className="p-6" data-testid={`card-location-${location.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === 'ar' ? location.nameAr : location.nameEn}
                  </h3>
                  {location.isHeadquarters && (
                    <Badge variant="default" className="text-xs">
                      {language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setEditingLocation(location)} data-testid={`button-edit-location-${location.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الموقع؟' : 'Are you sure you want to delete this location?')) {
                        deleteLocationMutation.mutate(location.id);
                      }
                    }}
                    data-testid={`button-delete-location-${location.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{language === 'ar' ? location.addressAr : location.addressEn}</p>
                    {location.city && location.country && (
                      <p className="text-muted-foreground">
                        {location.city}, {location.country}
                      </p>
                    )}
                  </div>
                </div>
                {location.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location.phone}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {(!profile?.locations || profile.locations.length === 0) && (
            <Card className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد مواقع' : 'No locations configured'}
              </p>
            </Card>
          )}

          <Dialog open={locationDialogOpen} onOpenChange={(open) => { setLocationDialogOpen(open); if (!open) setEditingLocation(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation
                    ? (language === 'ar' ? 'تعديل الموقع' : 'Edit Location')
                    : (language === 'ar' ? 'إضافة موقع' : 'Add Location')}
                </DialogTitle>
              </DialogHeader>
              <Form {...locationForm}>
                <form onSubmit={locationForm.handleSubmit((data) => saveLocationMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={locationForm.control}
                      name="nameEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-location-name-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={locationForm.control}
                      name="nameAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-location-name-ar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={locationForm.control}
                      name="addressEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'العنوان (إنجليزي)' : 'Address (English)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-location-address-en" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={locationForm.control}
                      name="addressAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-location-address-ar" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={locationForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'المدينة' : 'City'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-location-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={locationForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === 'ar' ? 'الدولة' : 'Country'}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-location-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={locationForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-location-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={locationForm.control}
                    name="isHeadquarters"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-headquarters"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={saveLocationMutation.isPending} data-testid="button-submit-location">
                      {saveLocationMutation.isPending
                        ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                        : (language === 'ar' ? 'حفظ' : 'Save')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
