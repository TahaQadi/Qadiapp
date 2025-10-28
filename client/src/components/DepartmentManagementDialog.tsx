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
      <DialogContent className="sm:max-w-[525px]" data-testid="dialog-department">
        <DialogHeader>
          <DialogTitle>
            {department 
              ? (language === 'ar' ? 'تعديل القسم' : 'Edit Department')
              : (language === 'ar' ? 'إضافة قسم' : 'Add Department')
            }
          </DialogTitle>
          <DialogDescription>
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

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="departmentType">
              {language === 'ar' ? 'نوع القسم' : 'Department Type'}
            </Label>
            <Select
              value={form.watch('departmentType')}
              onValueChange={(value) => form.setValue('departmentType', value as any)}
            >
              <SelectTrigger data-testid="select-department-type">
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
            <Label htmlFor="contactName">
              {language === 'ar' ? 'اسم المسؤول' : 'Contact Name'}
            </Label>
            <Input
              id="contactName"
              {...form.register('contactName')}
              data-testid="input-contact-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
            </Label>
            <Input
              id="contactEmail"
              type="email"
              {...form.register('contactEmail')}
              data-testid="input-contact-email"
            />
            {form.formState.errors.contactEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">
              {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
            </Label>
            <Input
              id="contactPhone"
              type="tel"
              {...form.register('contactPhone')}
              data-testid="input-contact-phone"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
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
