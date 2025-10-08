import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, User, Package, ArrowLeft, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clientFormSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

const createClientSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;
type CreateClientFormValues = z.infer<typeof createClientSchema>;

interface ClientBasic {
  id: string;
  username: string;
  nameEn: string;
  nameAr: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
}

interface Department {
  id: string;
  departmentType: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface Location {
  id: string;
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  city: string | null;
  country: string | null;
  isHeadquarters: boolean;
  phone: string | null;
}

interface ClientDetails {
  client: ClientBasic;
  departments: Department[];
  locations: Location[];
}

export default function AdminClientsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: clients = [], isLoading: clientsLoading } = useQuery<ClientBasic[]>({
    queryKey: ['/api/admin/clients'],
  });

  const { data: clientDetails, isLoading: detailsLoading } = useQuery<ClientDetails>({
    queryKey: ['/api/admin/clients', selectedClientId],
    enabled: !!selectedClientId,
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      email: '',
      phone: '',
    },
  });

  const createForm = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      username: '',
      password: '',
      nameEn: '',
      nameAr: '',
      email: '',
      phone: '',
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: CreateClientFormValues) => {
      const res = await apiRequest('POST', '/api/admin/clients', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: language === 'ar' ? 'تم إنشاء العميل بنجاح' : 'Client created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إنشاء العميل' : 'Error creating client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientFormValues }) => {
      const res = await apiRequest('PUT', `/api/admin/clients/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      if (selectedClientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      }
      toast({
        title: language === 'ar' ? 'تم تحديث العميل بنجاح' : 'Client updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث العميل' : 'Error updating client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      setSelectedClientId(null);
      toast({
        title: language === 'ar' ? 'تم حذف العميل بنجاح' : 'Client deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في حذف العميل' : 'Error deleting client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/clients/${id}/admin-status`, { isAdmin });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      if (selectedClientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      }
      toast({
        title: language === 'ar' ? data.messageAr : data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث حالة المسؤول' : 'Error updating admin status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClientSelect = (client: ClientBasic) => {
    setSelectedClientId(client.id);
  };

  const handleSubmit = (data: ClientFormValues) => {
    if (selectedClientId) {
      updateClientMutation.mutate({ id: selectedClientId, data });
    }
  };

  const getDepartmentTypeLabel = (type: string) => {
    const types: Record<string, { en: string; ar: string }> = {
      sales: { en: 'Sales', ar: 'المبيعات' },
      operations: { en: 'Operations', ar: 'العمليات' },
      finance: { en: 'Finance', ar: 'المالية' },
      other: { en: 'Other', ar: 'أخرى' },
    };
    return language === 'ar' ? types[type]?.ar || type : types[type]?.en || type;
  };

  useEffect(() => {
    if (clientDetails?.client) {
      form.reset({
        nameEn: clientDetails.client.nameEn,
        nameAr: clientDetails.client.nameAr,
        email: clientDetails.client.email || '',
        phone: clientDetails.client.phone || '',
      });
    }
  }, [clientDetails, form]);

  return (
    <div className="min-h-screen bg-background">
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
              {language === 'ar' ? 'إدارة العملاء' : 'Client Management'}
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
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>
                {language === 'ar' ? 'قائمة العملاء' : 'Client List'}
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline" data-testid="button-create-client">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'ar' ? 'إنشاء عميل جديد' : 'Create New Client'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'ar' 
                        ? 'أدخل معلومات العميل الجديد' 
                        : 'Enter the new client information'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit((data) => createClientMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-create-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'كلمة المرور' : 'Password'}</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" data-testid="input-create-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={createForm.control}
                          name="nameEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-create-name-en" />
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
                                <Input {...field} data-testid="input-create-name-ar" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-create-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-create-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={createClientMutation.isPending}
                          data-testid="button-submit-create-client"
                        >
                          {createClientMutation.isPending
                            ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
                            : (language === 'ar' ? 'إنشاء عميل' : 'Create Client')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا يوجد عملاء' : 'No clients'}
                </div>
              ) : (
                <div className="space-y-2">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className={`w-full text-start p-3 rounded-md border transition-colors hover-elevate ${
                        selectedClientId === client.id
                          ? 'bg-accent border-accent-border'
                          : 'bg-card border-border'
                      }`}
                      data-testid={`button-select-client-${client.id}`}
                    >
                      <div className="font-medium">
                        {language === 'ar' ? client.nameAr : client.nameEn}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {client.email || client.username}
                      </div>
                      {client.isAdmin && (
                        <Badge variant="secondary" className="mt-1">
                          {language === 'ar' ? 'مسؤول' : 'Admin'}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>
                {language === 'ar' ? 'تفاصيل العميل' : 'Client Details'}
              </CardTitle>
              {selectedClientId && clientDetails?.client && !clientDetails.client.isAdmin && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this client?')) {
                      deleteClientMutation.mutate(selectedClientId);
                    }
                  }}
                  disabled={deleteClientMutation.isPending}
                  data-testid="button-delete-client"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedClientId ? (
                <div className="text-center py-12 text-muted-foreground">
                  {language === 'ar' ? 'اختر عميلاً لعرض التفاصيل' : 'Select a client to view details'}
                </div>
              ) : detailsLoading ? (
                <div className="space-y-4">
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                  <div className="text-center py-4 text-sm text-muted-foreground" data-testid="text-loading">
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                </div>
              ) : clientDetails?.client ? (
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                    </div>
                    <div className="font-medium" data-testid="text-username">
                      {clientDetails.client.username}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={`h-5 w-5 ${clientDetails.client.isAdmin ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium">
                          {language === 'ar' ? 'صلاحيات المسؤول' : 'Admin Privileges'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const adminCount = clients.filter(c => c.isAdmin).length;
                            const isLastAdmin = clientDetails.client.isAdmin && adminCount === 1;
                            
                            if (isLastAdmin) {
                              return language === 'ar' 
                                ? 'المسؤول الأخير - لا يمكن تخفيض الرتبة'
                                : 'Last admin - cannot demote';
                            }
                            
                            return language === 'ar' 
                              ? (clientDetails.client.isAdmin ? 'لدى هذا المستخدم صلاحيات المسؤول' : 'مستخدم عادي')
                              : (clientDetails.client.isAdmin ? 'This user has admin privileges' : 'Regular user');
                          })()}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={clientDetails.client.isAdmin}
                      onCheckedChange={(checked) => {
                        toggleAdminMutation.mutate({ 
                          id: clientDetails.client.id, 
                          isAdmin: checked 
                        });
                      }}
                      disabled={
                        toggleAdminMutation.isPending || 
                        (clientDetails.client.isAdmin && clients.filter(c => c.isAdmin).length === 1)
                      }
                      data-testid="switch-admin-status"
                    />
                  </div>

                  <Separator />

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
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
                          control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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

                      <Button
                        type="submit"
                        disabled={updateClientMutation.isPending}
                        data-testid="button-save-client"
                      >
                        {updateClientMutation.isPending
                          ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                          : (language === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
                      </Button>
                    </form>
                  </Form>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">
                      {language === 'ar' ? 'الأقسام' : 'Departments'}
                    </h3>
                    {clientDetails.departments.length === 0 ? (
                      <div className="text-sm text-muted-foreground" data-testid="text-no-departments">
                        {language === 'ar' ? 'لا توجد أقسام' : 'No departments'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientDetails.departments.map((dept) => (
                          <div
                            key={dept.id}
                            className="p-3 border rounded-md"
                            data-testid={`card-department-${dept.id}`}
                          >
                            <div className="font-medium">
                              {getDepartmentTypeLabel(dept.departmentType)}
                            </div>
                            {dept.contactName && (
                              <div className="text-sm text-muted-foreground">
                                {dept.contactName}
                              </div>
                            )}
                            {dept.contactEmail && (
                              <div className="text-sm text-muted-foreground">
                                {dept.contactEmail}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">
                      {language === 'ar' ? 'المواقع' : 'Locations'}
                    </h3>
                    {clientDetails.locations.length === 0 ? (
                      <div className="text-sm text-muted-foreground" data-testid="text-no-locations">
                        {language === 'ar' ? 'لا توجد مواقع' : 'No locations'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientDetails.locations.map((loc) => (
                          <div
                            key={loc.id}
                            className="p-3 border rounded-md"
                            data-testid={`card-location-${loc.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="font-medium">
                                {language === 'ar' ? loc.nameAr : loc.nameEn}
                              </div>
                              {loc.isHeadquarters && (
                                <Badge variant="secondary" data-testid={`badge-hq-${loc.id}`}>
                                  {language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {language === 'ar' ? loc.addressAr : loc.addressEn}
                            </div>
                            {(loc.city || loc.country) && (
                              <div className="text-sm text-muted-foreground">
                                {[loc.city, loc.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-destructive" data-testid="text-error">
                  {language === 'ar' ? 'خطأ في تحميل التفاصيل' : 'Error loading details'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
