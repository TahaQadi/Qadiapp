import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  departmentType: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  departmentType: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

interface CompanyUser {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  departmentType: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CompanyUsersSectionProps {
  companyId: string | null;
}

export function CompanyUsersSection({ companyId }: CompanyUsersSectionProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);

  // Don't render if no company is selected
  if (!companyId) {
    return null;
  }

  const { data: users = [], isLoading } = useQuery<CompanyUser[]>({
    queryKey: ['/api/admin/company-users', companyId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/admin/company-users/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    },
    enabled: !!companyId,
  });

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      departmentType: '',
    },
  });

  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      departmentType: '',
      isActive: true,
      password: '',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormValues) => {
      const res = await apiRequest('POST', `/api/admin/company-users/${companyId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-users', companyId] });
      setCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: language === 'ar' ? 'تم إنشاء المستخدم' : 'User Created',
        description: language === 'ar' ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserFormValues) => {
      if (!selectedUser) throw new Error('No user selected');
      // Filter out empty password field
      const payload = { ...data };
      if (!payload.password || payload.password === '') {
        delete payload.password;
      }
      const res = await apiRequest('PATCH', `/api/admin/company-users/${selectedUser.id}`, payload);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-users', companyId] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      updateForm.reset();
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديث المستخدم بنجاح' : 'User updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/company-users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-users', companyId] });
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEditUser = (user: CompanyUser) => {
    setSelectedUser(user);
    updateForm.reset({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      departmentType: user.departmentType || '',
      isActive: user.isActive,
      password: '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteUser = async (user: CompanyUser) => {
    if (confirm(language === 'ar' ? `هل أنت متأكد من حذف المستخدم ${user.name}؟` : `Are you sure you want to delete user ${user.name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">
          {language === 'ar' ? 'مستخدمو الشركة' : 'Company Users'}
        </h3>
        <Button
          size="sm"
          onClick={() => setCreateDialogOpen(true)}
          data-testid="button-add-user"
        >
          <Plus className="w-4 h-4 mr-1" />
          {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground" data-testid="text-loading-users">
          {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : users.length === 0 ? (
        <div className="text-sm text-muted-foreground" data-testid="text-no-users">
          {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}
        </div>
      ) : (
        <div className="space-y-2" data-testid="list-company-users">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 border rounded-md hover-elevate"
              data-testid={`user-item-${user.id}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium" data-testid={`text-user-name-${user.id}`}>
                    {user.name}
                  </span>
                  {!user.isActive && (
                    <Badge variant="secondary" data-testid={`badge-inactive-${user.id}`}>
                      {language === 'ar' ? 'غير نشط' : 'Inactive'}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <span data-testid={`text-username-${user.id}`}>@{user.username}</span>
                  {user.email && <span className="ml-2" data-testid={`text-email-${user.id}`}>{user.email}</span>}
                  {user.departmentType && (
                    <span className="ml-2" data-testid={`text-department-${user.id}`}>
                      ({language === 'ar' ? 'القسم' : 'Dept'}: {user.departmentType})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditUser(user)}
                  data-testid={`button-edit-user-${user.id}`}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteUser(user)}
                  data-testid={`button-delete-user-${user.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className={`
          border-border/50 dark:border-[#d4af37]/30 
          bg-card dark:bg-black/95 
          backdrop-blur-xl 
          ${isMobile ? 'max-w-[95vw] p-4' : 'sm:max-w-[600px]'} 
          max-h-[90vh] overflow-y-auto
        `}>
          <DialogHeader className="space-y-3 pb-4 border-b border-border/50 dark:border-[#d4af37]/20">
            <DialogTitle className={`
              ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} 
              font-bold 
              bg-gradient-to-r from-foreground to-foreground/80 
              dark:from-white dark:to-gray-300 
              bg-clip-text text-transparent 
              flex items-center gap-2
            `}>
              <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} text-primary dark:text-[#d4af37]`} />
              {language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
            </DialogTitle>
            <DialogDescription className={`${isMobile ? 'text-xs' : 'text-sm sm:text-base'} text-muted-foreground dark:text-gray-400`}>
              {language === 'ar' 
                ? 'أدخل معلومات المستخدم الجديد للشركة' 
                : 'Enter the new user information for your company'}
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4 pt-2">
              <div className={isMobile ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                <FormField
                  control={createForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground dark:text-gray-200">
                        {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="input-username"
                          className="border-border/50 dark:border-[#d4af37]/30 focus:border-primary dark:focus:border-[#d4af37]"
                          placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                        />
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
                      <FormLabel className="text-foreground dark:text-gray-200">
                        {language === 'ar' ? 'كلمة المرور' : 'Password'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          data-testid="input-password"
                          className="border-border/50 dark:border-[#d4af37]/30 focus:border-primary dark:focus:border-[#d4af37]"
                          placeholder="••••••••"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground dark:text-gray-200">
                      {language === 'ar' ? 'الاسم' : 'Name'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-name"
                        className="border-border/50 dark:border-[#d4af37]/30 focus:border-primary dark:focus:border-[#d4af37]"
                        placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                      />
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
                    <FormLabel className="text-foreground dark:text-gray-200">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        data-testid="input-email"
                        className="border-border/50 dark:border-[#d4af37]/30 focus:border-primary dark:focus:border-[#d4af37]"
                        placeholder={language === 'ar' ? 'example@company.com' : 'example@company.com'}
                      />
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
                    <FormLabel className="text-foreground dark:text-gray-200">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="input-phone"
                        className="border-border/50 dark:border-[#d4af37]/30 focus:border-primary dark:focus:border-[#d4af37]"
                        placeholder={language === 'ar' ? '+970 xx xxx xxxx' : '+970 xx xxx xxxx'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  className={`
                    ${isMobile ? 'flex-1' : ''} 
                    border-border/50 dark:border-[#d4af37]/30 
                    hover:bg-accent/50
                  `}
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending} 
                  data-testid="button-submit-create-user"
                  className={`
                    ${isMobile ? 'flex-1' : ''} 
                    bg-primary dark:bg-[#d4af37] 
                    hover:bg-primary/90 dark:hover:bg-[#d4af37]/90 
                    text-primary-foreground dark:text-black
                  `}
                >
                  {createUserMutation.isPending
                    ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...')
                    : (language === 'ar' ? 'إضافة مستخدم' : 'Add User')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل المستخدم' : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'تعديل معلومات المستخدم' : 'Update user information'}
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit((data) => updateUserMutation.mutate(data))} className="space-y-4">
              <FormField
                control={updateForm.control}
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
                control={updateForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'الهاتف' : 'Phone'}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="departmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'القسم' : 'Department'}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={language === 'ar' ? 'اختياري' : 'Optional'} data-testid="input-edit-department" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{language === 'ar' ? 'كلمة المرور الجديدة (اختياري)' : 'New Password (Optional)'}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder={language === 'ar' ? 'اتركه فارغاً لعدم التغيير' : 'Leave blank to keep current'} data-testid="input-edit-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel>{language === 'ar' ? 'نشط' : 'Active'}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-active"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateUserMutation.isPending} data-testid="button-submit-edit-user">
                  {updateUserMutation.isPending
                    ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...')
                    : (language === 'ar' ? 'تحديث' : 'Update')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}