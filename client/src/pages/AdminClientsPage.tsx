import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/components/LanguageProvider';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompanyUsersSection } from '@/components/CompanyUsersSection';
import { ClientImportDialog } from '@/components/ClientImportDialog';
import { DepartmentManagementDialog } from '@/components/DepartmentManagementDialog';
import { LocationManagementDialog } from '@/components/LocationManagementDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, User, Package, ArrowLeft, Plus, Trash2, ShieldCheck, KeyRound, Edit, Search, Filter, RefreshCw, Download, Upload, Users, UserCheck, UserX, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from '@/hooks/use-debounce';
import { arrayToCSV, downloadCSV, formatDateForCSV, formatTimestampForCSV, formatDepartmentsForCSV, formatLocationsForCSV } from '@/lib/csvExport';
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
import { Link } from 'wouter';

const clientFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  domain: z.string().optional(),
  registrationId: z.string().optional(),
  industry: z.string().optional(),
  hqCity: z.string().optional(),
  hqCountry: z.string().optional(),
  paymentTerms: z.string().optional(),
  priceTier: z.string().optional(),
  riskTier: z.enum(["A", "B", "C"]).optional().or(z.literal('')),
  contractModel: z.enum(["PO", "LTA", "Subscription"]).optional().or(z.literal('')),
});

const createClientSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  domain: z.string().optional(),
  registrationId: z.string().optional(),
  industry: z.string().optional(),
  hqCity: z.string().optional(),
  hqCountry: z.string().optional(),
  paymentTerms: z.string().optional(),
  priceTier: z.string().optional(),
  riskTier: z.enum(["A", "B", "C"]).optional().or(z.literal('')),
  contractModel: z.enum(["PO", "LTA", "Subscription"]).optional().or(z.literal('')),
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
  name: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Organization fields
  domain?: string | null;
  registrationId?: string | null;
  industry?: string | null;
  hqCity?: string | null;
  hqCountry?: string | null;
  paymentTerms?: string | null;
  priceTier?: string | null;
  riskTier?: string | null;
  contractModel?: string | null;
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
  name: string;
  address: string;
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

interface ClientDetailsCardProps {
  selectedClientId: string | null;
  clientDetails: ClientDetails | undefined;
  detailsLoading: boolean;
  detailsError: any;
  form: any; // Use a more specific type if available
  language: string;
  toggleAdminMutation: any; // Use a more specific type if available
  getDepartmentTypeLabel: (type: string) => string;
  setEditDialogOpen: (isOpen: boolean) => void;
  setDeleteDialogOpen: (isOpen: boolean) => void;
  setPasswordResetDialogOpen: (isOpen: boolean) => void;
  handleAddDepartment: () => void;
  handleEditDepartment: (department: Department) => void;
  handleDeleteDepartment: (id: string) => void;
  handleAddLocation: () => void;
  handleEditLocation: (location: Location) => void;
  handleDeleteLocation: (id: string) => void;
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

  // Department and Location dialog state
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'admin' | 'non-admin'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'email'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Bulk operations state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useQuery<ClientBasic[]>({
    queryKey: ['/api/admin/clients'],
  });

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client => {
      // Search filter
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesEmail = client.email?.toLowerCase().includes(query);
        const matchesUsername = client.username.toLowerCase().includes(query);

        if (!matchesName && !matchesEmail && !matchesUsername) {
          return false;
        }
      }

      // Admin filter
      if (adminFilter === 'admin' && !client.isAdmin) return false;
      if (adminFilter === 'non-admin' && client.isAdmin) return false;

      return true;
    });

    // Sort clients
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (language === 'ar' ? a.nameAr : a.nameEn)
            .localeCompare(language === 'ar' ? b.nameAr : b.nameEn);
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'created':
          // Note: We don't have created date in ClientBasic, so we'll skip this for now
          comparison = 0;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [clients, debouncedSearchQuery, adminFilter, sortBy, sortOrder, language]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredAndSortedClients.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => ({
    total: clients.length,
    admin: clients.filter(c => c.isAdmin).length,
    nonAdmin: clients.filter(c => !c.isAdmin).length,
    filtered: filteredAndSortedClients.length,
  }), [clients, filteredAndSortedClients]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, adminFilter, sortBy, sortOrder]);

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
      const res = await apiRequest('DELETE', `/api/admin/clients/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete client');
      }
      return res.json();
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
        description: error.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'),
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (clientIds: string[]) => {
      const results = await Promise.allSettled(
        clientIds.map(id => apiRequest('DELETE', `/api/admin/clients/${id}`))
      );

      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} out of ${clientIds.length} clients`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
      setSelectedClients(new Set());
      setBulkDeleteDialogOpen(false);
      toast({
        title: language === 'ar' ? 'تم حذف العملاء بنجاح' : 'Clients deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في حذف العملاء' : 'Error deleting clients',
        description: error.message || (language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'),
        variant: 'destructive',
      });
    },
  });

  // Department mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: { departmentType: string; contactName?: string; contactEmail?: string; contactPhone?: string }) => {
      if (!selectedClientId) throw new Error('No client selected');
      const res = await apiRequest('POST', `/api/admin/clients/${selectedClientId}/departments`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      setDepartmentDialogOpen(false);
      setEditingDepartment(null);
      toast({
        title: language === 'ar' ? 'تم إضافة القسم' : 'Department Added',
        description: language === 'ar' ? 'تم إضافة القسم بنجاح' : 'Department added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إضافة القسم' : 'Error Adding Department',
        description: error.message || (language === 'ar' ? 'فشل في إضافة القسم' : 'Failed to add department'),
        variant: 'destructive',
      });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { departmentType: string; contactName?: string; contactEmail?: string; contactPhone?: string } }) => {
      const res = await apiRequest('PUT', `/api/admin/departments/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      setDepartmentDialogOpen(false);
      setEditingDepartment(null);
      toast({
        title: language === 'ar' ? 'تم تحديث القسم' : 'Department Updated',
        description: language === 'ar' ? 'تم تحديث القسم بنجاح' : 'Department updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث القسم' : 'Error Updating Department',
        description: error.message || (language === 'ar' ? 'فشل في تحديث القسم' : 'Failed to update department'),
        variant: 'destructive',
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/departments/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      toast({
        title: language === 'ar' ? 'تم حذف القسم' : 'Department Deleted',
        description: language === 'ar' ? 'تم حذف القسم بنجاح' : 'Department deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في حذف القسم' : 'Error Deleting Department',
        description: error.message || (language === 'ar' ? 'فشل في حذف القسم' : 'Failed to delete department'),
        variant: 'destructive',
      });
    },
  });

  // Location mutations
  const createLocationMutation = useMutation({
    mutationFn: async (data: { nameEn: string; nameAr: string; addressEn: string; addressAr: string; city?: string; country?: string; phone?: string; latitude?: number; longitude?: number; isHeadquarters?: boolean }) => {
      if (!selectedClientId) throw new Error('No client selected');
      const res = await apiRequest('POST', `/api/admin/clients/${selectedClientId}/locations`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      setLocationDialogOpen(false);
      setEditingLocation(null);
      toast({
        title: language === 'ar' ? 'تم إضافة الموقع' : 'Location Added',
        description: language === 'ar' ? 'تم إضافة الموقع بنجاح' : 'Location added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في إضافة الموقع' : 'Error Adding Location',
        description: error.message || (language === 'ar' ? 'فشل في إضافة الموقع' : 'Failed to add location'),
        variant: 'destructive',
      });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nameEn: string; nameAr: string; addressEn: string; addressAr: string; city?: string; country?: string; phone?: string; latitude?: number; longitude?: number; isHeadquarters?: boolean } }) => {
      const res = await apiRequest('PUT', `/api/admin/locations/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      setLocationDialogOpen(false);
      setEditingLocation(null);
      toast({
        title: language === 'ar' ? 'تم تحديث الموقع' : 'Location Updated',
        description: language === 'ar' ? 'تم تحديث الموقع بنجاح' : 'Location updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في تحديث الموقع' : 'Error Updating Location',
        description: error.message || (language === 'ar' ? 'فشل في تحديث الموقع' : 'Failed to update location'),
        variant: 'destructive',
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/locations/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete location');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clients', selectedClientId] });
      toast({
        title: language === 'ar' ? 'تم حذف الموقع' : 'Location Deleted',
        description: language === 'ar' ? 'تم حذف الموقع بنجاح' : 'Location deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ في حذف الموقع' : 'Error Deleting Location',
        description: error.message || (language === 'ar' ? 'فشل في حذف الموقع' : 'Failed to delete location'),
        variant: 'destructive',
      });
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

  // Bulk operation handlers
  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClients);
    if (checked) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(paginatedClients.map(c => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleBulkDelete = () => {
    const clientIds = Array.from(selectedClients);

    // Check if trying to delete all admin users
    const selectedClientsData = clients.filter(c => clientIds.includes(c.id));
    const adminClientsSelected = selectedClientsData.filter(c => c.isAdmin);
    const totalAdminClients = clients.filter(c => c.isAdmin);

    if (adminClientsSelected.length === totalAdminClients.length && totalAdminClients.length > 0) {
      toast({
        title: language === 'ar' ? 'خطأ في الحذف' : 'Delete Error',
        description: language === 'ar' 
          ? 'لا يمكن حذف جميع المسؤولين. يجب أن يبقى مسؤول واحد على الأقل.' 
          : 'Cannot delete all admin users. At least one admin must remain.',
        variant: 'destructive',
      });
      return;
    }

    bulkDeleteMutation.mutate(clientIds);
  };

  const handleExportCSV = async () => {
    try {
      // Get detailed client data including departments and locations
      const detailedClients = await Promise.all(
        filteredAndSortedClients.map(async (client) => {
          try {
            const res = await apiRequest('GET', `/api/admin/clients/${client.id}`);
            if (res.ok) {
              const data = await res.json();
              return {
                client: data.client,
                departments: data.departments || [],
                locations: data.locations || [],
                companyUsers: data.companyUsers || []
              };
            }
            return {
              client,
              departments: [],
              locations: [],
              companyUsers: []
            };
          } catch (error) {
            console.error(`Error fetching details for client ${client.id}:`, error);
            return {
              client,
              departments: [],
              locations: [],
              companyUsers: []
            };
          }
        })
      );

      const exportData = detailedClients.map(({ client, departments, locations, companyUsers }) => ({
        'Username': client.username,
        'Name': client.name,
        'Email': client.email || '',
        'Phone': client.phone || '',
        'Admin Status': client.isAdmin ? (language === 'ar' ? 'مسؤول' : 'Admin') : (language === 'ar' ? 'عميل' : 'Client'),
        'Departments': formatDepartmentsForCSV(departments),
        'Department Count': departments.length,
        'Locations': formatLocationsForCSV(locations),
        'Location Count': locations.length,
        'Company Users': companyUsers.length,
        'Created At': client.createdAt ? formatTimestampForCSV(client.createdAt, language) : '',
        'Updated At': client.updatedAt ? formatTimestampForCSV(client.updatedAt, language) : '',
      }));

      const csvContent = arrayToCSV(exportData, { includeBOM: true });
      const filename = `clients_detailed_export_${new Date().toISOString().split('T')[0]}.csv`;

      downloadCSV(csvContent, filename);

      toast({
        title: language === 'ar' ? 'تم التصدير بنجاح' : 'Export Successful',
        description: language === 'ar' 
          ? `تم تصدير ${exportData.length} عميل مع التفاصيل الكاملة إلى ملف CSV` 
          : `Successfully exported ${exportData.length} clients with full details to CSV`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: language === 'ar' ? 'خطأ في التصدير' : 'Export Error',
        description: language === 'ar' ? 'فشل في تصدير البيانات' : 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  // Inline editing handlers
  // Department and Location handlers
  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setDepartmentDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentDialogOpen(true);
  };

  const handleDeleteDepartment = async (id: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this department?')) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  const handleSaveDepartment = (data: { departmentType: string; contactName?: string; contactEmail?: string; contactPhone?: string }) => {
    if (editingDepartment) {
      updateDepartmentMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createDepartmentMutation.mutate(data);
    }
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setLocationDialogOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationDialogOpen(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الموقع؟' : 'Are you sure you want to delete this location?')) {
      deleteLocationMutation.mutate(id);
    }
  };

  const handleSaveLocation = (data: { nameEn: string; nameAr: string; addressEn: string; addressAr: string; city?: string; country?: string; phone?: string; latitude?: number; longitude?: number; isHeadquarters?: boolean }) => {
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data });
    } else {
      createLocationMutation.mutate(data);
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
        name: clientDetails.client.name,
        email: clientDetails.client.email || '',
        phone: clientDetails.client.phone || '',
      });
    }
  }, [clientDetails, form]);

  return (
    <PageLayout>
      <PageHeader
        title={language === 'ar' ? 'إدارة العملاء' : 'Client Management'}
        subtitle={language === 'ar' ? 'إدارة معلومات العملاء والمستخدمين' : 'Manage client information and users'}
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
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8 animate-slide-down">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            {language === 'ar' ? 'لوحة إدارة العملاء' : 'Client Management Dashboard'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {language === 'ar' 
              ? 'إدارة معلومات العملاء والمستخدمين' 
              : 'Manage client information and users'}
          </p>
        </div>

        {/* Statistics Cards */}
        {!clientsLoading && clients.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6 animate-fade-in">
            <Card className="hover:shadow-md dark:hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm" onClick={() => setAdminFilter('all')}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary dark:text-[#d4af37]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {language === 'ar' ? 'الإجمالي' : 'Total'}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground dark:text-white">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md dark:hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm" onClick={() => setAdminFilter('admin')}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 dark:from-blue-500/20 dark:to-blue-500/10">
                    <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {language === 'ar' ? 'المسؤولين' : 'Admins'}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground dark:text-white">{stats.admin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md dark:hover:shadow-[#d4af37]/20 transition-all duration-300 cursor-pointer border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm" onClick={() => setAdminFilter('non-admin')}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 dark:from-green-500/20 dark:to-green-500/10">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {language === 'ar' ? 'العملاء' : 'Clients'}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground dark:text-white">{stats.nonAdmin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md dark:hover:shadow-[#d4af37]/20 transition-all duration-300 border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 dark:from-purple-500/20 dark:to-purple-500/10">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {language === 'ar' ? 'المعروض' : 'Filtered'}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground dark:text-white">{stats.filtered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Controls */}
        <Card className="mb-4 sm:mb-6 border-border/50 dark:border-[#d4af37]/20 bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={language === 'ar' ? 'البحث في العملاء...' : 'Search clients...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 sm:h-11 text-sm sm:text-base border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37] bg-background/50 dark:bg-black/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Select value={adminFilter} onValueChange={(v) => setAdminFilter(v as any)}>
                  <SelectTrigger className="w-28 sm:w-32 h-9 sm:h-10 text-xs sm:text-sm border-border/50 dark:border-[#d4af37]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="admin">{language === 'ar' ? 'مسؤولين' : 'Admins'}</SelectItem>
                    <SelectItem value="non-admin">{language === 'ar' ? 'عملاء' : 'Clients'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-28 sm:w-32 h-9 sm:h-10 text-xs sm:text-sm border-border/50 dark:border-[#d4af37]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{language === 'ar' ? 'الاسم' : 'Name'}</SelectItem>
                    <SelectItem value="email">{language === 'ar' ? 'البريد' : 'Email'}</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={language === 'ar' ? 'ترتيب' : 'Sort'}
                  className="touch-target h-9 w-9 sm:h-10 sm:w-10 border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetchClients()}
                  title={language === 'ar' ? 'تحديث' : 'Refresh'}
                  className="touch-target h-9 w-9 sm:h-10 sm:w-10 border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedClients.size > 0 && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 dark:border-[#d4af37]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {language === 'ar' 
                    ? `${selectedClients.size} عميل محدد` 
                    : `${selectedClients.size} clients selected`}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    disabled={bulkDeleteMutation.isPending}
                    className="flex-1 sm:flex-none h-9 text-xs sm:text-sm touch-target"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">{language === 'ar' ? 'حذف محدد' : 'Delete Selected'}</span>
                    <span className="xs:hidden">{language === 'ar' ? 'حذف' : 'Delete'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClients(new Set())}
                    className="flex-1 sm:flex-none h-9 text-xs sm:text-sm border-border/50 dark:border-[#d4af37]/20 touch-target"
                  >
                    {language === 'ar' ? 'إلغاء التحديد' : 'Clear'}
                  </Button>
                </div>
              </div>
            )}

            {/* Export and Import Buttons */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 dark:border-[#d4af37]/20 flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportDialogOpen(true)}
                className="w-full sm:w-auto h-9 text-xs sm:text-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 touch-target"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {language === 'ar' ? 'استيراد CSV' : 'Import CSV'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredAndSortedClients.length === 0}
                className="w-full sm:w-auto h-9 text-xs sm:text-sm border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 touch-target"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  <Button 
                    size="icon" 
                    variant="outline" 
                    data-testid="button-create-client"
                    className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border-border/50 dark:border-[#d4af37]/30 hover:border-primary dark:hover:border-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-border/50 dark:border-[#d4af37]/30 bg-gradient-to-br from-card/95 to-card dark:from-black/95 dark:to-[#1a1a1a]/95 backdrop-blur-xl">
                  <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-border/50 dark:border-[#d4af37]/20">
                    <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent flex items-center gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary dark:text-[#d4af37]" />
                      </div>
                      {language === 'ar' ? 'إنشاء عميل جديد' : 'Create New Client'}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
                      {language === 'ar' 
                        ? 'أدخل معلومات العميل الجديد لإنشاء حساب جديد في النظام' 
                        : 'Enter the new client information to create a new account in the system'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit((data) => createClientMutation.mutate(data))} className="space-y-3 sm:space-y-4 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={createForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="input-create-username" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'كلمة المرور' : 'Password'}</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="input-create-password" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="nameEn"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="input-create-name-en" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="nameAr"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="input-create-name-ar" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="input-create-email" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                              <FormControl>
                                <Input {...field} className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="input-create-phone" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Organization Information Section */}
                      <Separator />
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        {language === 'ar' ? 'معلومات المنظمة (اختياري)' : 'Organization Information (Optional)'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={createForm.control}
                          name="domain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'المجال' : 'Domain'}</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} className="h-10 sm:h-11" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="registrationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'رقم التسجيل / الضريبة' : 'Registration ID / VAT'}</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} className="h-10 sm:h-11" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'القطاع' : 'Industry'}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder={language === 'ar' ? 'اختر القطاع' : 'Select industry'} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">{language === 'ar' ? 'لا شيء' : 'None'}</SelectItem>
                                  <SelectItem value="technology">{language === 'ar' ? 'التكنولوجيا' : 'Technology'}</SelectItem>
                                  <SelectItem value="manufacturing">{language === 'ar' ? 'التصنيع' : 'Manufacturing'}</SelectItem>
                                  <SelectItem value="healthcare">{language === 'ar' ? 'الرعاية الصحية' : 'Healthcare'}</SelectItem>
                                  <SelectItem value="finance">{language === 'ar' ? 'المالية' : 'Finance'}</SelectItem>
                                  <SelectItem value="retail">{language === 'ar' ? 'التجزئة' : 'Retail'}</SelectItem>
                                  <SelectItem value="education">{language === 'ar' ? 'التعليم' : 'Education'}</SelectItem>
                                  <SelectItem value="logistics">{language === 'ar' ? 'اللوجستيات' : 'Logistics'}</SelectItem>
                                  <SelectItem value="construction">{language === 'ar' ? 'البناء' : 'Construction'}</SelectItem>
                                  <SelectItem value="hospitality">{language === 'ar' ? 'الضيافة' : 'Hospitality'}</SelectItem>
                                  <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="paymentTerms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'شروط الدفع' : 'Payment Terms'}</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder={language === 'ar' ? 'مثال: 30 يوم' : 'e.g., Net 30'} className="h-10 sm:h-11" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="priceTier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'فئة السعر' : 'Price Tier'}</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} className="h-10 sm:h-11" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="riskTier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'مستوى المخاطر' : 'Risk Tier'}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder={language === 'ar' ? 'اختر المستوى' : 'Select tier'} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">{language === 'ar' ? 'لا شيء' : 'None'}</SelectItem>
                                  <SelectItem value="A">{language === 'ar' ? 'أ - منخفض' : 'A - Low'}</SelectItem>
                                  <SelectItem value="B">{language === 'ar' ? 'ب - متوسط' : 'B - Medium'}</SelectItem>
                                  <SelectItem value="C">{language === 'ar' ? 'ج - عالي' : 'C - High'}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="contractModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{language === 'ar' ? 'نموذج العقد' : 'Contract Model'}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger className="h-10 sm:h-11">
                                    <SelectValue placeholder={language === 'ar' ? 'اختر النموذج' : 'Select model'} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">{language === 'ar' ? 'لا شيء' : 'None'}</SelectItem>
                                  <SelectItem value="PO">{language === 'ar' ? 'أمر شراء' : 'Purchase Order (PO)'}</SelectItem>
                                  <SelectItem value="LTA">{language === 'ar' ? 'اتفاقية طويلة الأجل' : 'Long-Term Agreement (LTA)'}</SelectItem>
                                  <SelectItem value="Subscription">{language === 'ar' ? 'اشتراك' : 'Subscription'}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter className="pt-3 sm:pt-4">
                        <Button 
                          type="submit" 
                          disabled={createClientMutation.isPending} 
                          className="w-full h-10 sm:h-11 touch-target bg-gradient-to-r from-primary to-primary/90 dark:from-[#d4af37] dark:to-[#f9c800] hover:shadow-lg dark:hover:shadow-[#d4af37]/20 transition-all duration-300"
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
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : paginatedClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {filteredAndSortedClients.length === 0 ? (
                    language === 'ar' ? 'لا يوجد عملاء' : 'No clients'
                  ) : (
                    language === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results'
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select All Checkbox */}
                  <div className="flex items-center gap-3 p-2 border-b">
                    <Checkbox
                      checked={selectedClients.size === paginatedClients.length && paginatedClients.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                    </span>
                  </div>

                  {paginatedClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 p-3 rounded-md border transition-colors hover-elevate bg-card border-border"
                    >
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={() => handleClientSelect(client)}
                        className="flex-1 text-start"
                      >
                        <div className="font-medium">
                          {client.name}
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
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedClients.length)} من ${filteredAndSortedClients.length}`
                      : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedClients.length)} of ${filteredAndSortedClients.length}`
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </Button>
                    <span className="text-sm">
                      {language === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
                    <Button 
                      size="icon" 
                      variant="outline" 
                      data-testid="button-create-client"
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg border-border/50 dark:border-[#d4af37]/30 hover:border-primary dark:hover:border-[#d4af37] hover:bg-primary/10 dark:hover:bg-[#d4af37]/10 transition-all duration-300"
                    >
                      <Plus className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-border/50 dark:border-[#d4af37]/30 bg-card dark:bg-black/95 backdrop-blur-xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3 pb-4 border-b border-border/50 dark:border-[#d4af37]/20">
                      <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary dark:text-[#d4af37]" />
                        {language === 'ar' ? 'إنشاء عميل جديد' : 'Create New Client'}
                      </DialogTitle>
                      <DialogDescription className="text-sm sm:text-base text-muted-foreground dark:text-gray-400">
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
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'ar' ? 'الاسم' : 'Name'}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-create-name" />
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
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : paginatedClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {filteredAndSortedClients.length === 0 ? (
                      language === 'ar' ? 'لا يوجد عملاء' : 'No clients'
                    ) : (
                      language === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results'
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Select All Checkbox */}
                    <div className="flex items-center gap-3 p-2 border-b">
                      <Checkbox
                        checked={selectedClients.size === paginatedClients.length && paginatedClients.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                      </span>
                    </div>

                    {paginatedClients.map((client) => (
                      <div
                        key={client.id}
                        className={`flex items-center gap-3 p-3 rounded-md border transition-colors hover-elevate ${
                          selectedClientId === client.id
                            ? 'bg-accent border-accent-border'
                            : 'bg-card border-border'
                        }`}
                      >
                        <Checkbox
                          checked={selectedClients.has(client.id)}
                          onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={() => handleClientSelect(client)}
                          className="flex-1 text-start"
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' 
                        ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedClients.length)} من ${filteredAndSortedClients.length}`
                        : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAndSortedClients.length)} of ${filteredAndSortedClients.length}`
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </Button>
                      <span className="text-sm">
                        {language === 'ar' ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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
              handleAddDepartment={handleAddDepartment}
              handleEditDepartment={handleEditDepartment}
              handleDeleteDepartment={handleDeleteDepartment}
              handleAddLocation={handleAddLocation}
              handleEditLocation={handleEditLocation}
              handleDeleteLocation={handleDeleteLocation}
            />
          </div>
        )}

        {/* Mobile Sheet for Client Details */}
        <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {clientDetails?.client 
                  ? clientDetails.client.name
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
                  {(clientDetails.client.createdAt || clientDetails.client.updatedAt) && (
                    <>
                      {clientDetails.client.createdAt && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                          </div>
                          <div className="text-sm">
                            {new Date(clientDetails.client.createdAt).toLocaleString(
                              language === 'ar' ? 'ar-SA' : 'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      )}
                      {clientDetails.client.updatedAt && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                          </div>
                          <div className="text-sm">
                            {new Date(clientDetails.client.updatedAt).toLocaleString(
                              language === 'ar' ? 'ar-SA' : 'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      {language === 'ar' ? 'الأقسام' : 'Departments'}
                    </h3>
                    <Button
                      size="sm"
                      onClick={handleAddDepartment}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {language === 'ar' ? 'إضافة قسم' : 'Add Department'}
                    </Button>
                  </div>
                  {clientDetails.departments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا توجد أقسام' : 'No departments'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDetails.departments.map((dept) => (
                        <div key={dept.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{getDepartmentTypeLabel(dept.departmentType)}</div>
                              {dept.contactName && <div className="text-sm text-muted-foreground">{dept.contactName}</div>}
                              {dept.contactEmail && <div className="text-sm text-muted-foreground">{dept.contactEmail}</div>}
                              {dept.contactPhone && <div className="text-sm text-muted-foreground">{dept.contactPhone}</div>}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditDepartment(dept)}
                                title={language === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDepartment(dept.id)}
                                title={language === 'ar' ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      {language === 'ar' ? 'المواقع' : 'Locations'}
                    </h3>
                    <Button
                      size="sm"
                      onClick={handleAddLocation}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {language === 'ar' ? 'إضافة موقع' : 'Add Location'}
                    </Button>
                  </div>
                  {clientDetails.locations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا توجد مواقع' : 'No locations'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDetails.locations.map((loc) => (
                        <div key={loc.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{language === 'ar' ? loc.nameAr : loc.nameEn}</div>
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
                              {loc.phone && (
                                <div className="text-sm text-muted-foreground">
                                  {loc.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditLocation(loc)}
                                title={language === 'ar' ? 'تعديل' : 'Edit'}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteLocation(loc.id)}
                                title={language === 'ar' ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
          <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-border/50 dark:border-[#d4af37]/30 bg-gradient-to-br from-card/95 to-card dark:from-black/95 dark:to-[#1a1a1a]/95 backdrop-blur-xl">
            <DialogHeader className="space-y-2 pb-3 border-b border-border/50 dark:border-[#d4af37]/20">
              <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
                  <Edit className="h-4 w-4 text-primary dark:text-[#d4af37]" />
                </div>
                {language === 'ar' ? 'تعديل العميل' : 'Edit Client'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
                {language === 'ar' ? 'تحديث معلومات العميل' : 'Update client information'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-sm font-medium">{language === 'ar' ? 'الاسم' : 'Name'}</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-sm font-medium">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-sm font-medium">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Organization Information Section */}
                <Separator />
                <h4 className="text-sm font-semibold text-muted-foreground">
                  {language === 'ar' ? 'معلومات المنظمة' : 'Organization Information'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'المجال' : 'Domain'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="registrationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'رقم التسجيل / الضريبة' : 'Registration ID / VAT'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'القطاع' : 'Industry'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder={language === 'ar' ? 'اختر القطاع' : 'Select industry'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{language === 'ar' ? 'لا شيء' : 'None'}</SelectItem>
                            <SelectItem value="technology">{language === 'ar' ? 'التكنولوجيا' : 'Technology'}</SelectItem>
                            <SelectItem value="manufacturing">{language === 'ar' ? 'التصنيع' : 'Manufacturing'}</SelectItem>
                            <SelectItem value="healthcare">{language === 'ar' ? 'الرعاية الصحية' : 'Healthcare'}</SelectItem>
                            <SelectItem value="finance">{language === 'ar' ? 'المالية' : 'Finance'}</SelectItem>
                            <SelectItem value="retail">{language === 'ar' ? 'التجزئة' : 'Retail'}</SelectItem>
                            <SelectItem value="education">{language === 'ar' ? 'التعليم' : 'Education'}</SelectItem>
                            <SelectItem value="logistics">{language === 'ar' ? 'اللوجستيات' : 'Logistics'}</SelectItem>
                            <SelectItem value="construction">{language === 'ar' ? 'البناء' : 'Construction'}</SelectItem>
                            <SelectItem value="hospitality">{language === 'ar' ? 'الضيافة' : 'Hospitality'}</SelectItem>
                            <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'شروط الدفع' : 'Payment Terms'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder={language === 'ar' ? 'مثال: 30 يوم' : 'e.g., Net 30'} className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'فئة السعر' : 'Price Tier'}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} className="h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'مستوى المخاطر' : 'Risk Tier'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder={language === 'ar' ? 'اختر المستوى' : 'Select tier'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{language === 'ar' ? 'لا شيء' : 'None'}</SelectItem>
                            <SelectItem value="A">{language === 'ar' ? 'أ - منخفض' : 'A - Low'}</SelectItem>
                            <SelectItem value="B">{language === 'ar' ? 'ب - متوسط' : 'B - Medium'}</SelectItem>
                            <SelectItem value="C">{language === 'ar' ? 'ج - عالي' : 'C - High'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{language === 'ar' ? 'نموذج العقد' : 'Contract Model'}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="h-10 sm:h-11">
                              <SelectValue placeholder={language === 'ar' ? 'اختر النموذج' : 'Select model'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{language === 'ar' ? 'لا شيء' : 'None'}</SelectItem>
                            <SelectItem value="PO">{language === 'ar' ? 'أمر شراء' : 'Purchase Order (PO)'}</SelectItem>
                            <SelectItem value="LTA">{language === 'ar' ? 'اتفاقية طويلة الأجل' : 'Long-Term Agreement (LTA)'}</SelectItem>
                            <SelectItem value="Subscription">{language === 'ar' ? 'اشتراك' : 'Subscription'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="pt-3 sm:pt-4">
                  <Button 
                    type="submit" 
                    disabled={updateClientMutation.isPending} 
                    className="w-full h-10 sm:h-11 touch-target bg-gradient-to-r from-primary to-primary/90 dark:from-[#d4af37] dark:to-[#f9c800] hover:shadow-lg dark:hover:shadow-[#d4af37]/20 transition-all duration-300"
                  >
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
                    const clientToDelete = clients.find(c => c.id === selectedClientId);
                    const totalAdminClients = clients.filter(c => c.isAdmin);

                    // Check if trying to delete the last admin user
                    if (clientToDelete?.isAdmin && totalAdminClients.length === 1) {
                      toast({
                        title: language === 'ar' ? 'خطأ في الحذف' : 'Delete Error',
                        description: language === 'ar' 
                          ? 'لا يمكن حذف آخر مسؤول. يجب أن يبقى مسؤول واحد على الأقل.' 
                          : 'Cannot delete the last admin user. At least one admin must remain.',
                        variant: 'destructive',
                      });
                      setDeleteDialogOpen(false);
                      return;
                    }

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

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'ar' ? 'حذف العملاء المحددين' : 'Delete Selected Clients'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'ar' 
                  ? `سيتم حذف ${selectedClients.size} عميل وجميع بياناتهم بشكل دائم. لا يمكن التراجع عن هذا الإجراء.` 
                  : `${selectedClients.size} clients and all their data will be permanently deleted. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending 
                  ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...')
                  : (language === 'ar' ? 'حذف' : 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Department Management Dialog */}
        <DepartmentManagementDialog
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          department={editingDepartment}
          onSave={handleSaveDepartment}
          isSaving={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
        />

        {/* Location Management Dialog */}
        <LocationManagementDialog
          open={locationDialogOpen}
          onOpenChange={setLocationDialogOpen}
          location={editingLocation}
          onSave={handleSaveLocation}
          isSaving={createLocationMutation.isPending || updateLocationMutation.isPending}
        />

        {/* Client Import Dialog */}
        <ClientImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/clients'] });
          }}
        />
      </main>
    </PageLayout>
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
  handleAddDepartment,
  handleEditDepartment,
  handleDeleteDepartment,
  handleAddLocation,
  handleEditLocation,
  handleDeleteLocation,
}: ClientDetailsCardProps) {
  return (
    <Card className="md:col-span-2 bg-card/50 dark:bg-[#222222]/50 backdrop-blur-sm 
      border-border/50 dark:border-[#d4af37]/20 
      hover:border-primary dark:hover:border-[#d4af37] 
      hover:shadow-2xl dark:hover:shadow-[#d4af37]/20 
      transition-all duration-500 animate-fade-in" 
      style={{ animationDelay: '200ms' }}>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10 flex-shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary dark:text-[#d4af37]" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl text-foreground dark:text-white">
              {language === 'ar' ? 'تفاصيل العميل' : 'Client Details'}
            </CardTitle>
            {selectedClientId && clientDetails?.client && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {clientDetails.client.username}
              </p>
            )}
          </div>
        </div>
        {selectedClientId && clientDetails?.client && (
          <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="flex-1 sm:flex-none gap-2 border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37]"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden xs:inline">{language === 'ar' ? 'تعديل' : 'Edit'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordResetDialogOpen(true)}
              className="flex-1 sm:flex-none gap-2 border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37]"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden xs:inline">{language === 'ar' ? 'كلمة السر' : 'Password'}</span>
            </Button>
            {!clientDetails.client.isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1 sm:flex-none gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden xs:inline">{language === 'ar' ? 'حذف' : 'Delete'}</span>
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!selectedClientId ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
            <div className="p-4 sm:p-5 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-[#d4af37]/10 dark:to-[#f9c800]/5 mb-4">
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary/50 dark:text-[#d4af37]/50" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xs">
              {language === 'ar' ? 'اختر عميلاً من القائمة لعرض التفاصيل' : 'Select a client from the list to view details'}
            </p>
          </div>
        ) : detailsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 sm:h-20 bg-gradient-to-r from-muted/50 via-muted to-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : detailsError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <User className="h-10 w-10 text-destructive/50" />
            </div>
            <p className="text-sm text-destructive">
              {language === 'ar' ? 'خطأ في تحميل تفاصيل العميل' : 'Error loading client details'}
            </p>
          </div>
        ) : clientDetails?.client && (
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {language === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                  <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </div>
                  <div className="font-semibold text-foreground dark:text-white">{clientDetails.client.name}</div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                  <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </div>
                  <div className="font-medium text-foreground dark:text-white text-sm truncate">{clientDetails.client.email || '-'}</div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                  <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                  </div>
                  <div className="font-medium text-foreground dark:text-white">{clientDetails.client.phone || '-'}</div>
                </div>
              </div>

              {/* Timestamps */}
              {(clientDetails.client.createdAt || clientDetails.client.updatedAt) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {clientDetails.client.createdAt && (
                    <div className="p-3 rounded-lg bg-muted/20 dark:bg-muted/10 border border-border/30 dark:border-[#d4af37]/10">
                      <div className="text-xs text-muted-foreground mb-1">
                        {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                      </div>
                      <div className="text-xs font-medium text-foreground dark:text-white">
                        {new Date(clientDetails.client.createdAt).toLocaleString(
                          language === 'ar' ? 'ar-SA' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </div>
                    </div>
                  )}
                  {clientDetails.client.updatedAt && (
                    <div className="p-3 rounded-lg bg-muted/20 dark:bg-muted/10 border border-border/30 dark:border-[#d4af37]/10">
                      <div className="text-xs text-muted-foreground mb-1">
                        {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                      </div>
                      <div className="text-xs font-medium text-foreground dark:text-white">
                        {new Date(clientDetails.client.updatedAt).toLocaleString(
                          language === 'ar' ? 'ar-SA' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Organization Information Section */}
            {(clientDetails.client.domain || clientDetails.client.registrationId || clientDetails.client.industry || 
              clientDetails.client.hqCity || clientDetails.client.hqCountry || clientDetails.client.paymentTerms || 
              clientDetails.client.priceTier || clientDetails.client.riskTier || clientDetails.client.contractModel) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {language === 'ar' ? 'معلومات المنظمة' : 'Organization Information'}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientDetails.client.domain && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'المجال' : 'Domain'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">{clientDetails.client.domain}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.registrationId && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'رقم التسجيل / الضريبة' : 'Registration ID / VAT'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">{clientDetails.client.registrationId}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.industry && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'القطاع' : 'Industry'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm capitalize">{clientDetails.client.industry}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.hqCity && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'مدينة المقر' : 'HQ City'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">{clientDetails.client.hqCity}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.hqCountry && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'بلد المقر' : 'HQ Country'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">{clientDetails.client.hqCountry}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.paymentTerms && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'شروط الدفع' : 'Payment Terms'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">{clientDetails.client.paymentTerms}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.priceTier && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'فئة السعر' : 'Price Tier'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">{clientDetails.client.priceTier}</div>
                    </div>
                  )}
                  
                  {clientDetails.client.riskTier && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'مستوى المخاطر' : 'Risk Tier'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">
                        <Badge variant={clientDetails.client.riskTier === 'A' ? 'default' : clientDetails.client.riskTier === 'B' ? 'secondary' : 'destructive'}>
                          {clientDetails.client.riskTier}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {clientDetails.client.contractModel && (
                    <div className="p-4 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">
                        {language === 'ar' ? 'نموذج العقد' : 'Contract Model'}
                      </div>
                      <div className="font-medium text-foreground dark:text-white text-sm">
                        <Badge variant="outline">{clientDetails.client.contractModel}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Toggle Section */}
            <div className="p-4 sm:p-5 border-2 rounded-xl bg-gradient-to-br from-primary/5 to-primary/[0.02] dark:from-[#d4af37]/5 dark:to-[#f9c800]/[0.02] border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37] transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 dark:bg-[#d4af37]/10 flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary dark:text-[#d4af37]" />
                  </div>
                  <label htmlFor="admin-toggle" className="flex-1 cursor-pointer min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-foreground dark:text-white">
                      {language === 'ar' ? 'صلاحيات المسؤول' : 'Admin Privileges'}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
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
                  className="flex-shrink-0"
                />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Departments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {language === 'ar' ? 'الأقسام' : 'Departments'}
                  <Badge variant="secondary" className="ml-1">
                    {clientDetails.departments.length}
                  </Badge>
                </h3>
                <Button
                  size="sm"
                  onClick={handleAddDepartment}
                  className="gap-2 h-8"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">{language === 'ar' ? 'إضافة' : 'Add'}</span>
                </Button>
              </div>
              
              {clientDetails.departments.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-lg bg-muted/20 dark:bg-muted/10 border border-dashed border-border/50">
                  <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد أقسام مسجلة' : 'No departments registered'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {clientDetails.departments.map((dept: any) => (
                    <div key={dept.id} className="p-4 rounded-lg border border-border/50 dark:border-[#d4af37]/10 bg-card/50 dark:bg-card/30 hover:shadow-md dark:hover:shadow-[#d4af37]/10 transition-all duration-300 group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-semibold">
                              {getDepartmentTypeLabel(dept.departmentType)}
                            </Badge>
                          </div>
                          {dept.contactName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{dept.contactName}</span>
                            </div>
                          )}
                          {dept.contactEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{dept.contactEmail}</span>
                            </div>
                          )}
                          {dept.contactPhone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{dept.contactPhone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDepartment(dept)}
                            className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100"
                            title={language === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDepartment(dept.id)}
                            className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 hover:text-destructive"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Locations Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {language === 'ar' ? 'المواقع' : 'Locations'}
                  <Badge variant="secondary" className="ml-1">
                    {clientDetails.locations.length}
                  </Badge>
                </h3>
                <Button
                  size="sm"
                  onClick={handleAddLocation}
                  className="gap-2 h-8"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden xs:inline">{language === 'ar' ? 'إضافة' : 'Add'}</span>
                </Button>
              </div>
              
              {clientDetails.locations.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-lg bg-muted/20 dark:bg-muted/10 border border-dashed border-border/50">
                  <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'لا توجد مواقع مسجلة' : 'No locations registered'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {clientDetails.locations.map((loc: any) => (
                    <div key={loc.id} className="p-4 rounded-lg border border-border/50 dark:border-[#d4af37]/10 bg-card/50 dark:bg-card/30 hover:shadow-md dark:hover:shadow-[#d4af37]/10 transition-all duration-300 group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-foreground dark:text-white">
                              {language === 'ar' ? loc.nameAr : loc.nameEn}
                            </div>
                            {loc.isHeadquarters && (
                              <Badge className="bg-primary/10 dark:bg-[#d4af37]/10 text-primary dark:text-[#d4af37] border-primary/20 dark:border-[#d4af37]/20">
                                {language === 'ar' ? 'المقر الرئيسي' : 'HQ'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {language === 'ar' ? loc.addressAr : loc.addressEn}
                              {(loc.city || loc.country) && (
                                <span className="text-muted-foreground/70">
                                  {', '}
                                  {[loc.city, loc.country].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </span>
                          </div>
                          {loc.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{loc.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditLocation(loc)}
                            className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100"
                            title={language === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLocation(loc.id)}
                            className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 hover:text-destructive"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <CompanyUsersSection companyId={selectedClientId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}