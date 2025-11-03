import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
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
import { Plus, Pencil, Trash2, Eye, CalendarIcon, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { cn } from '@/lib/utils';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PaginationControls } from '@/components/PaginationControls';
import { EmptyState } from '@/components/EmptyState';

const ltaFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['active', 'inactive']),
  currency: z.string().min(1, 'Currency is required'),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type LtaFormValues = z.infer<typeof ltaFormSchema>;

interface Lta {
  id: string;
  name: string;
  description?: string | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: ltas = [], isLoading } = useQuery<Lta[]>({
    queryKey: ['/api/admin/ltas'],
  });

  const filteredLtas = useMemo(() => {
    return ltas.filter(lta => {
      const matchesStatus = statusFilter === 'all' || lta.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        lta.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [ltas, statusFilter, searchTerm]);

  const paginatedLtas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLtas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLtas, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLtas.length / itemsPerPage);

  const createForm = useForm<LtaFormValues>({
    resolver: zodResolver(ltaFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      currency: 'ILS',
    },
  });

  const editForm = useForm<LtaFormValues>({
    resolver: zodResolver(ltaFormSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active',
      currency: 'ILS',
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
      name: lta.name,
      description: lta.description || '',
      startDate: new Date(lta.startDate),
      endDate: new Date(lta.endDate),
      status: lta.status,
      currency: (lta as any).currency || 'ILS',
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
    if (status === 'draft') {
      return <Badge variant="outline" data-testid={`badge-status-${status}`}>{language === 'ar' ? 'مسودة' : 'Draft'}</Badge>;
    }
    if (status === 'expired') {
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}>{language === 'ar' ? 'منتهي' : 'Expired'}</Badge>;
    }
    return <Badge variant="secondary" data-testid={`badge-status-${status}`}>{language === 'ar' ? 'غير نشط' : 'Inactive'}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'PP', { locale: language === 'ar' ? ar : undefined });
  };

  return (
    <PageLayout>
      <PageHeader
        title={language === 'ar' ? 'إدارة الاتفاقيات' : 'LTA Management'}
        backHref="/admin"
        showLogo={true}
        actions={
          <>
            <LanguageToggle />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/api/logout'}
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        }
      />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <Card className="border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-black/40 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-semibold">
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
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <Input
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                  <SelectItem value="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
                  <SelectItem value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <LoadingSkeleton variant="list" count={5} />
            ) : filteredLtas.length === 0 ? (
              <EmptyState
                icon={Plus}
                title={language === 'ar' ? 'لا توجد اتفاقيات' : 'No LTAs Found'}
                description={language === 'ar' ? 'ابدأ بإنشاء اتفاقية جديدة' : 'Get started by creating a new LTA'}
                actionLabel={language === 'ar' ? 'إنشاء اتفاقية' : 'Create LTA'}
                onAction={() => setCreateDialogOpen(true)}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4">
                  {paginatedLtas.map((lta) => (
                  <div 
                    key={lta.id}
                    className="group relative overflow-hidden rounded-lg border border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-white/5 p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-[#d4af37]/10 transition-all duration-300"
                    data-testid={`row-lta-${lta.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {lta.name}
                          </h3>
                          {getStatusBadge(lta.status)}
                        </div>
                        {lta.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {lta.description}
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
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredLtas.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  language={language}
                />
              </>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الاسم' : 'Name'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الوصف' : 'Description'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-description" />
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
              <FormField
                control={createForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'العملة' : 'Currency'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue placeholder={language === 'ar' ? 'اختر العملة' : 'Select currency'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ILS">ILS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الاسم' : 'Name'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الوصف' : 'Description'}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-edit-description" />
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
              <FormField
                control={editForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'العملة' : 'Currency'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-currency">
                          <SelectValue placeholder={language === 'ar' ? 'اختر العملة' : 'Select currency'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ILS">ILS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
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
                ? `هل أنت متأكد من حذف الاتفاقية "${selectedLta?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete the LTA "${selectedLta?.name}"? This action cannot be undone.`}
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
    </PageLayout>
  );
}