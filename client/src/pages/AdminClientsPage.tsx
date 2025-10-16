import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CompanyUsersSection } from '@/components/CompanyUsersSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogOut, User, Package, ArrowLeft, Plus, Trash2, ShieldCheck, KeyRound, Edit } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

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

const passwordResetSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;
type CreateClientFormValues = z.infer<typeof createClientSchema>;
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

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
  const isMobile = useIsMobile();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  const { data: clients = [], isLoading: clientsLoading } = useQuery<ClientBasic[]>({
    queryKey: ['/api/admin/clients'],
  });

  const { data: clientDetails, isLoading: detailsLoading, error: detailsError } = useQuery<ClientDetails>({
    queryKey: ['/api/admin/clients', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) throw new Error('No client selected');
      const res = await apiRequest('GET', `/api/admin/clients/${selectedClientId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch client details');
      }
      return await res.json();
    },
    enabled: !!selectedClientId,
    retry: 1,
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

  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: '',
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
      setDeleteDialogOpen(false);
      if (isMobile) setDetailsSheetOpen(false);
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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ clientId, newPassword }: { clientId: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/password/admin-reset', {
        clientId,
        newPassword,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setPasswordResetDialogOpen(false);
      passwordResetForm.reset();
      toast({
        title: language === 'ar' ? data.messageAr : data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إعادة تعيين كلمة المرور' : 'Error resetting password',
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
    onMutate: async ({ id, isAdmin }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/admin/clients', id] });
      await queryClient.cancelQueries({ queryKey: ['/api/admin/clients'] });

      const previousClientDetails = queryClient.getQueryData(['/api/admin/clients', id]);
      const previousClients = queryClient.getQueryData(['/api/admin/clients']);

      queryClient.setQueryData(['/api/admin/clients', id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          client: { ...old.client, isAdmin }
        };
      });

      queryClient.setQueryData(['/api/admin/clients'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(client => 
          client.id === id ? { ...client, isAdmin } : client
        );
      });

      return { previousClientDetails, previousClients };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousClientDetails) {
        queryClient.setQueryData(['/api/admin/clients', variables.id], context.previousClientDetails);
      }
      if (context?.previousClients) {
        queryClient.setQueryData(['/api/admin/clients'], context.previousClients);
      }
      toast({
        title: language === 'ar' ? 'خطأ في تحديث حالة المسؤول' : 'Error updating admin status',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? data.messageAr : data.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      if (selectedClientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      }
    },
  });

  const handleClientSelect = (client: ClientBasic) => {
    setSelectedClientId(client.id);
    if (isMobile) {
      setDetailsSheetOpen(true);
    }
  };

  const handleSubmit = (data: ClientFormValues) => {
    if (selectedClientId) {
      updateClientMutation.mutate({ id: selectedClientId, data }, {
        onSuccess: () => {
          setEditDialogOpen(false);
          if (isMobile) setDetailsSheetOpen(false);
        }
      });
    }
  };

  const handlePasswordReset = (data: PasswordResetFormValues) => {
    if (selectedClientId) {
      resetPasswordMutation.mutate({
        clientId: selectedClientId,
        newPassword: data.newPassword,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 dark:from-black dark:via-[#1a1a1a] dark:to-black">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/5 dark:bg-[#d4af37]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/2 w-2 h-2 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border/50 dark:border-[#d4af37]/20 bg-background/95 dark:bg-black/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              data-testid="button-back-admin"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <img 
              src="/logo.png" 
              alt={language === 'ar' ? 'شعار الشركة' : 'Company Logo'} 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain dark:filter dark:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0 transition-transform hover:scale-110 duration-300"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent truncate">
                {language === 'ar' ? 'إدارة العملاء' : 'Client Management'}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {language === 'ar' ? 'مرحباً' : 'Welcome'}, {language === 'ar' ? user?.nameAr : user?.nameEn}
              </p>
            </div>
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

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-down">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {language === 'ar' ? 'لوحة إدارة العملاء' : 'Client Management Dashboard'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'إدارة معلومات العملاء والمستخدمين' 
              : 'Manage client information and users'}
          </p>
        </div>

        {/* Mobile: Client List Only */}
        {isMobile ? (
          <Card className="bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
            border-border/50 dark:border-[#d4af37]/20 
            hover:border-primary dark:hover:border-[#d4af37] 
            hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
            transition-all duration-500 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-foreground dark:text-white">
                {language === 'ar' ? 'قائمة العملاء' : 'Client List'}
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline" data-testid="button-create-client">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw]">
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'ar' ? 'إنشاء عميل جديد' : 'Create New Client'}
                    </DialogTitle>
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
                              <Input {...field} />
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
                              <Input {...field} type="password" />
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
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={createClientMutation.isPending} className="w-full">
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
                      className="w-full text-start p-3 rounded-md border transition-colors hover-elevate bg-card border-border"
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
        ) : (
          /* Desktop: Side-by-side Layout */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
              border-border/50 dark:border-[#d4af37]/20 
              hover:border-primary dark:hover:border-[#d4af37] 
              hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
              transition-all duration-500 animate-fade-in" 
              style={{ animationDelay: '100ms' }}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-foreground dark:text-white">
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

            <ClientDetailsCard
              selectedClientId={selectedClientId}
              clientDetails={clientDetails}
              detailsLoading={detailsLoading}
              detailsError={detailsError}
              form={form}
              language={language}
              toggleAdminMutation={toggleAdminMutation}
              getDepartmentTypeLabel={getDepartmentTypeLabel}
              setEditDialogOpen={setEditDialogOpen}
              setDeleteDialogOpen={setDeleteDialogOpen}
              setPasswordResetDialogOpen={setPasswordResetDialogOpen}
            />
          </div>
        )}

        {/* Mobile Sheet for Client Details */}
        <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {clientDetails?.client 
                  ? (language === 'ar' ? clientDetails.client.nameAr : clientDetails.client.nameEn)
                  : (language === 'ar' ? 'تفاصيل العميل' : 'Client Details')}
              </SheetTitle>
            </SheetHeader>
            {selectedClientId && clientDetails?.client && (
              <div className="mt-6 space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPasswordResetDialogOpen(true)}
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                  </Button>
                  {!clientDetails.client.isAdmin && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'حذف' : 'Delete'}
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </div>
                    <div>{clientDetails.client.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                    </div>
                    <div>{clientDetails.client.phone || '-'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{language === 'ar' ? 'صلاحيات المسؤول' : 'Admin Privileges'}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'منح صلاحيات المسؤول' : 'Grant admin access'}
                      </div>
                    </div>
                    <Switch
                      checked={clientDetails.client.isAdmin}
                      onCheckedChange={(checked) => {
                        toggleAdminMutation.mutate({
                          id: selectedClientId,
                          isAdmin: checked
                        });
                      }}
                      disabled={toggleAdminMutation.isPending}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">
                    {language === 'ar' ? 'الأقسام' : 'Departments'}
                  </h3>
                  {clientDetails.departments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا توجد أقسام' : 'No departments'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDetails.departments.map((dept) => (
                        <div key={dept.id} className="p-3 border rounded-md">
                          <div className="font-medium">{getDepartmentTypeLabel(dept.departmentType)}</div>
                          {dept.contactName && <div className="text-sm text-muted-foreground">{dept.contactName}</div>}
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
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا توجد مواقع' : 'No locations'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDetails.locations.map((loc) => (
                        <div key={loc.id} className="p-3 border rounded-md">
                          <div className="font-medium">{language === 'ar' ? loc.nameAr : loc.nameEn}</div>
                          <div className="text-sm text-muted-foreground">
                            {language === 'ar' ? loc.addressAr : loc.addressEn}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <CompanyUsersSection companyId={selectedClientId} />
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'تعديل العميل' : 'Edit Client'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                        <Input {...field} type="email" />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={updateClientMutation.isPending} className={isMobile ? "w-full" : ""}>
                    {updateClientMutation.isPending
                      ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                      : (language === 'ar' ? 'حفظ' : 'Save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
          <DialogContent className={isMobile ? "max-w-[95vw]" : ""}>
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</DialogTitle>
              <DialogDescription>
                {language === 'ar' 
                  ? 'أدخل كلمة مرور جديدة للعميل' 
                  : 'Enter a new password for the client'}
              </DialogDescription>
            </DialogHeader>
            <Form {...passwordResetForm}>
              <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                <FormField
                  control={passwordResetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="********" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={resetPasswordMutation.isPending} className={isMobile ? "w-full" : ""}>
                    {resetPasswordMutation.isPending
                      ? (language === 'ar' ? 'جاري إعادة التعيين...' : 'Resetting...')
                      : (language === 'ar' ? 'إعادة تعيين' : 'Reset Password')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'ar' 
                  ? 'سيتم حذف هذا العميل وجميع بياناته بشكل دائم. لا يمكن التراجع عن هذا الإجراء.' 
                  : 'This client and all their data will be permanently deleted. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedClientId) {
                    deleteClientMutation.mutate(selectedClientId);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

// Desktop Client Details Card Component
function ClientDetailsCard({
  selectedClientId,
  clientDetails,
  detailsLoading,
  detailsError,
  form,
  language,
  toggleAdminMutation,
  getDepartmentTypeLabel,
  setEditDialogOpen,
  setDeleteDialogOpen,
  setPasswordResetDialogOpen,
}: any) {
  return (
    <Card className="md:col-span-2 bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
      border-border/50 dark:border-[#d4af37]/20 
      hover:border-primary dark:hover:border-[#d4af37] 
      hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
      transition-all duration-500 animate-fade-in" 
      style={{ animationDelay: '200ms' }}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-foreground dark:text-white">
          {language === 'ar' ? 'تفاصيل العميل' : 'Client Details'}
        </CardTitle>
        {selectedClientId && clientDetails?.client && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditDialogOpen(true)}
              title={language === 'ar' ? 'تعديل' : 'Edit'}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPasswordResetDialogOpen(true)}
              title={language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            >
              <KeyRound className="h-4 w-4" />
            </Button>
            {!clientDetails.client.isAdmin && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                title={language === 'ar' ? 'حذف' : 'Delete'}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
          </div>
        ) : detailsError ? (
          <div className="text-center py-8 text-destructive">
            {language === 'ar' ? 'خطأ في تحميل تفاصيل العميل' : 'Error loading client details'}
          </div>
        ) : clientDetails?.client && (
          <>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </div>
                  <div className="font-medium">{clientDetails.client.nameEn}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </div>
                  <div className="font-medium">{clientDetails.client.nameAr}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </div>
                <div>{clientDetails.client.email || '-'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                </div>
                <div>{clientDetails.client.phone || '-'}</div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                <div className="flex items-center gap-3 flex-1">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <label htmlFor="admin-toggle" className="flex-1 cursor-pointer">
                    <div className="font-medium">
                      {language === 'ar' ? 'صلاحيات المسؤول' : 'Admin Privileges'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? 'منح صلاحيات المسؤول لهذا العميل' 
                        : 'Grant admin access to this client'}
                    </div>
                  </label>
                </div>
                <Switch
                  id="admin-toggle"
                  checked={clientDetails.client.isAdmin}
                  onCheckedChange={(checked) => {
                    toggleAdminMutation.mutate({
                      id: selectedClientId,
                      isAdmin: checked
                    });
                  }}
                  disabled={toggleAdminMutation.isPending}
                />
              </div>
            </div>

            <Separator />

            <div className="mt-6">
              <h3 className="font-semibold mb-3">
                {language === 'ar' ? 'الأقسام' : 'Departments'}
              </h3>
              {clientDetails.departments.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد أقسام' : 'No departments'}
                </div>
              ) : (
                <div className="space-y-2">
                  {clientDetails.departments.map((dept: any) => (
                    <div key={dept.id} className="p-3 border rounded-md">
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

            <Separator className="my-6" />

            <div>
              <h3 className="font-semibold mb-3">
                {language === 'ar' ? 'المواقع' : 'Locations'}
              </h3>
              {clientDetails.locations.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لا توجد مواقع' : 'No locations'}
                </div>
              ) : (
                <div className="space-y-2">
                  {clientDetails.locations.map((loc: any) => (
                    <div key={loc.id} className="p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">
                          {language === 'ar' ? loc.nameAr : loc.nameEn}
                        </div>
                        {loc.isHeadquarters && (
                          <Badge variant="secondary">
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

            <Separator className="my-6" />

            <CompanyUsersSection companyId={selectedClientId} />
          </>
        )}
      </CardContent>
    </Card>
  );
}