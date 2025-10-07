import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Package, ArrowLeft } from 'lucide-react';
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

type ClientFormValues = z.infer<typeof clientFormSchema>;

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
  const { user, logoutMutation } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

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
              onClick={() => logoutMutation.mutate()}
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
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'قائمة العملاء' : 'Client List'}
              </CardTitle>
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
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? 'تفاصيل العميل' : 'Client Details'}
              </CardTitle>
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
