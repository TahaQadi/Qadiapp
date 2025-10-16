import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Plus, Pencil, Trash2, Eye, CalendarIcon } from 'lucide-react';
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

type LtaFormValues = z.infer<typeof ltaFormSchema>;

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

export default function AdminLtaListPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLta, setSelectedLta] = useState<Lta | null>(null);

  const { data: ltas = [], isLoading } = useQuery<Lta[]>({
    queryKey: ['/api/admin/ltas'],
  });

  const createForm = useForm<LtaFormValues>({
    resolver: zodResolver(ltaFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
    },
  });

  const editForm = useForm<LtaFormValues>({
    resolver: zodResolver(ltaFormSchema),
    defaultValues: {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LtaFormValues) => {
      const res = await apiRequest('POST', '/api/admin/ltas', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas'] });
      toast({
        title: language === 'ar' ? 'تم إنشاء الاتفاقية بنجاح' : 'LTA created successfully',
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إنشاء الاتفاقية' : 'Error creating LTA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: LtaFormValues }) => {
      const res = await apiRequest('PATCH', `/api/admin/ltas/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas'] });
      toast({
        title: language === 'ar' ? 'تم تحديث الاتفاقية بنجاح' : 'LTA updated successfully',
      });
      setEditDialogOpen(false);
      setSelectedLta(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث الاتفاقية' : 'Error updating LTA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/ltas/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ltas'] });
      toast({
        title: language === 'ar' ? 'تم حذف الاتفاقية بنجاح' : 'LTA deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSelectedLta(null);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في حذف الاتفاقية' : 'Error deleting LTA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateLta = (data: LtaFormValues) => {
    createMutation.mutate(data);
  };

  const handleEditLta = (lta: Lta) => {
    setSelectedLta(lta);
    editForm.reset({
      nameEn: lta.nameEn,
      nameAr: lta.nameAr,
      descriptionEn: lta.descriptionEn || '',
      descriptionAr: lta.descriptionAr || '',
      startDate: new Date(lta.startDate),
      endDate: new Date(lta.endDate),
      status: lta.status,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateLta = (data: LtaFormValues) => {
    if (selectedLta) {
      updateMutation.mutate({ id: selectedLta.id, data });
    }
  };

  const handleDeleteLta = (lta: Lta) => {
    setSelectedLta(lta);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedLta) {
      deleteMutation.mutate(selectedLta.id);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge data-testid={`badge-status-${status}`}>{language === 'ar' ? 'نشط' : 'Active'}</Badge>;
    }
    return <Badge variant="secondary" data-testid={`badge-status-${status}`}>{language === 'ar' ? 'غير نشط' : 'Inactive'}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PP', { locale: language === 'ar' ? ar : undefined });
  };

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
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 sm:h-10 sm:w-10 text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
            data-testid="button-back-admin"
          >
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 dark:from-[#d4af37] dark:to-[#d4af37]/60 bg-clip-text text-transparent">
            {language === 'ar' ? 'إدارة الاتفاقيات' : 'LTA Management'}
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold">
                {language === 'ar' ? 'الاتفاقيات طويلة الأجل' : 'Long-Term Agreements'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {language === 'ar' ? 'إدارة جميع الاتفاقيات والعقود' : 'Manage all agreements and contracts'}
              </p>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 dark:bg-[#d4af37] dark:hover:bg-[#d4af37]/90 text-primary-foreground dark:text-black font-medium shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              data-testid="button-create-lta"
            >
              <Plus className="h-4 w-4 me-2" />
              {language === 'ar' ? 'اتفاقية جديدة' : 'New LTA'}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/50 dark:bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : ltas.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 dark:bg-[#d4af37]/10 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-primary dark:text-[#d4af37]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'لا توجد اتفاقيات' : 'No LTAs Yet'}</h3>
                <p className="text-muted-foreground mb-4">
                  {language === 'ar' ? 'ابدأ بإنشاء اتفاقية جديدة' : 'Get started by creating a new LTA'}
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  variant="outline"
                  className="border-primary dark:border-[#d4af37]"
                >
                  <Plus className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'إنشاء اتفاقية' : 'Create LTA'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ltas.map((lta) => (
                  <div 
                    key={lta.id}
                    className="group relative overflow-hidden rounded-lg border border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-white/5 p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300"
                    data-testid={`row-lta-${lta.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {language === 'ar' ? lta.nameAr : lta.nameEn}
                          </h3>
                          {getStatusBadge(lta.status)}
                        </div>
                        {(lta.descriptionEn || lta.descriptionAr) && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {language === 'ar' ? lta.descriptionAr : lta.descriptionEn}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(lta.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(lta.endDate)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/ltas/${lta.id}`)}
                          className="hover:bg-primary/10 dark:hover:bg-[#d4af37]/10"
                          data-testid={`button-view-${lta.id}`}
                        >
                          <Eye className="h-4 w-4 me-1" />
                          {language === 'ar' ? 'عرض' : 'View'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditLta(lta)}
                          className="hover:bg-primary/10 dark:hover:bg-[#d4af37]/10"
                          data-testid={`button-edit-${lta.id}`}
                        >
                          <Pencil className="h-4 w-4 me-1" />
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLta(lta)}
                          className="hover:bg-destructive/10 text-destructive"
                          data-testid={`button-delete-${lta.id}`}
                        >
                          <Trash2 className="h-4 w-4 me-1" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-lta">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إنشاء اتفاقية جديدة' : 'Create New LTA'}</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateLta)} className="space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
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
                              data-testid="button-start-date"
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
                  control={createForm.control}
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
                              data-testid="button-end-date"
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
                control={createForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الحالة' : 'Status'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
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
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                  {createMutation.isPending ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') : (language === 'ar' ? 'إنشاء' : 'Create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-lta">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تعديل الاتفاقية' : 'Edit LTA'}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateLta)} className="space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
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
                control={editForm.control}
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
                  onClick={() => setEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث' : 'Update')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-lta">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? `هل أنت متأكد من حذف الاتفاقية "${selectedLta?.nameAr}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete the LTA "${selectedLta?.nameEn}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') : (language === 'ar' ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}