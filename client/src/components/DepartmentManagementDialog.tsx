import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/components/LanguageProvider';
import { Building2 } from 'lucide-react';
import type { ClientDepartment } from '@shared/schema';

const departmentSchema = z.object({
  departmentType: z.enum(['finance', 'purchase', 'warehouse']),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type DepartmentForm = z.infer<typeof departmentSchema>;

interface DepartmentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: ClientDepartment | null;
  onSave: (data: DepartmentForm) => void;
  isSaving: boolean;
}

export function DepartmentManagementDialog({
  open,
  onOpenChange,
  department,
  onSave,
  isSaving,
}: DepartmentManagementDialogProps) {
  const { language } = useLanguage();

  const form = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      departmentType: 'finance',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  // Reset form when dialog opens or department changes
  useEffect(() => {
    if (open) {
      form.reset(department ? {
        departmentType: department.departmentType as 'finance' | 'purchase' | 'warehouse',
        contactName: department.contactName || '',
        contactEmail: department.contactEmail || '',
        contactPhone: department.contactPhone || '',
      } : {
        departmentType: 'finance',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
      });
    }
  }, [open, department, form]);

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      onSave(data);
    })();
  };

  const handleCancel = () => {
    // Reset form to current department data or empty state
    form.reset(department ? {
      departmentType: department.departmentType as 'finance' | 'purchase' | 'warehouse',
      contactName: department.contactName || '',
      contactEmail: department.contactEmail || '',
      contactPhone: department.contactPhone || '',
    } : {
      departmentType: 'finance',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
    });
    onOpenChange(false);
  };

  const departmentTypeLabels = {
    finance: language === 'ar' ? 'المالية' : 'Finance',
    purchase: language === 'ar' ? 'المشتريات' : 'Purchase',
    warehouse: language === 'ar' ? 'المستودع' : 'Warehouse',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[525px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-border/50 dark:border-[#d4af37]/30 bg-gradient-to-br from-card/95 to-card dark:from-black/95 dark:to-[#1a1a1a]/95 backdrop-blur-xl" data-testid="dialog-department">
        <DialogHeader className="space-y-2 pb-3 border-b border-border/50 dark:border-[#d4af37]/20">
          <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
              <Building2 className="h-4 w-4 text-primary dark:text-[#d4af37]" />
            </div>
            {department 
              ? (language === 'ar' ? 'تعديل القسم' : 'Edit Department')
              : (language === 'ar' ? 'إضافة قسم' : 'Add Department')
            }
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
            {department
              ? (language === 'ar' 
                  ? 'تحديث معلومات القسم والشخص المسؤول عنه'
                  : 'Update department information and contact person')
              : (language === 'ar' 
                  ? 'أدخل معلومات القسم والشخص المسؤول عنه'
                  : 'Enter department information and contact person')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="departmentType" className="text-sm font-medium">
              {language === 'ar' ? 'نوع القسم' : 'Department Type'}
            </Label>
            <Select
              value={form.watch('departmentType')}
              onValueChange={(value) => form.setValue('departmentType', value as any)}
            >
              <SelectTrigger className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]" data-testid="select-department-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="finance">{departmentTypeLabels.finance}</SelectItem>
                <SelectItem value="purchase">{departmentTypeLabels.purchase}</SelectItem>
                <SelectItem value="warehouse">{departmentTypeLabels.warehouse}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-sm font-medium">
              {language === 'ar' ? 'اسم المسؤول' : 'Contact Name'}
            </Label>
            <Input
              id="contactName"
              {...form.register('contactName')}
              className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
              placeholder={language === 'ar' ? 'أدخل اسم المسؤول' : 'Enter contact name'}
              data-testid="input-contact-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-sm font-medium">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </Label>
            <Input
              id="contactEmail"
              type="email"
              {...form.register('contactEmail')}
              className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
              placeholder={language === 'ar' ? 'example@domain.com' : 'example@domain.com'}
              data-testid="input-contact-email"
            />
            {form.formState.errors.contactEmail && (
              <p className="text-xs text-destructive">{form.formState.errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-sm font-medium">
              {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              {...form.register('contactPhone')}
              className="h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
              placeholder={language === 'ar' ? '+966 XX XXX XXXX' : '+966 XX XXX XXXX'}
              data-testid="input-contact-phone"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto h-10 sm:h-11 border-border/50 dark:border-[#d4af37]/20 hover:border-primary dark:hover:border-[#d4af37]"
            data-testid="button-cancel"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full sm:w-auto h-10 sm:h-11 touch-target bg-gradient-to-r from-primary to-primary/90 dark:from-[#d4af37] dark:to-[#f9c800] hover:shadow-lg dark:hover:shadow-[#d4af37]/20 transition-all duration-300"
            data-testid="button-save-department"
          >
            {isSaving 
              ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
              : (language === 'ar' ? 'حفظ' : 'Save')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
