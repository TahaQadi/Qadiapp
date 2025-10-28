import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';
import { MapLocationPicker } from '@/components/MapLocationPicker';
import type { ClientLocation } from '@shared/schema';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().min(1, 'Address is required'),
  isHeadquarters: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type LocationForm = z.infer<typeof locationSchema>;

interface LocationManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: ClientLocation | null;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export function LocationManagementDialog({
  open,
  onOpenChange,
  location,
  onSave,
  isSaving,
}: LocationManagementDialogProps) {
  const { language } = useLanguage();

  const form = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      isHeadquarters: false,
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Reset form when dialog opens or location changes
  useEffect(() => {
    if (open) {
      form.reset(location ? {
        name: language === 'ar' ? location.nameAr : location.nameEn,
        address: language === 'ar' ? location.addressAr : location.addressEn,
        isHeadquarters: location.isHeadquarters || false,
        latitude: location.latitude ? Number(location.latitude) : undefined,
        longitude: location.longitude ? Number(location.longitude) : undefined,
      } : {
        name: '',
        address: '',
        isHeadquarters: false,
        latitude: undefined,
        longitude: undefined,
      });
    }
  }, [open, location, form, language]);

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      // Transform data to match backend expectation (dual language)
      const transformedData = {
        nameEn: data.name,
        nameAr: data.name,
        addressEn: data.address,
        addressAr: data.address,
        isHeadquarters: data.isHeadquarters,
        latitude: data.latitude,
        longitude: data.longitude,
      };
      onSave(transformedData);
    })();
  };

  const handleCancel = () => {
    form.reset(location ? {
      name: language === 'ar' ? location.nameAr : location.nameEn,
      address: language === 'ar' ? location.addressAr : location.addressEn,
      isHeadquarters: location.isHeadquarters || false,
      latitude: location.latitude ? Number(location.latitude) : undefined,
      longitude: location.longitude ? Number(location.longitude) : undefined,
    } : {
      name: '',
      address: '',
      isHeadquarters: false,
      latitude: undefined,
      longitude: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6" data-testid="dialog-location">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            {location 
              ? (language === 'ar' ? 'تعديل الموقع' : 'Edit Location')
              : (language === 'ar' ? 'إضافة موقع' : 'Add Location')
            }
          </DialogTitle>
          <DialogDescription className="text-sm">
            {location
              ? (language === 'ar' 
                  ? 'تحديث معلومات الموقع والعنوان على الخريطة'
                  : 'Update location information and address on the map')
              : (language === 'ar' 
                  ? 'أدخل معلومات الموقع واختر العنوان على الخريطة'
                  : 'Enter location information and select address on the map')
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Location Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {language === 'ar' ? 'اسم الموقع' : 'Location Name'}
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              className="h-10"
              placeholder={language === 'ar' ? 'أدخل اسم الموقع' : 'Enter location name'}
              data-testid="input-name"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              {language === 'ar' ? 'العنوان' : 'Address'}
            </Label>
            <Input
              id="address"
              {...form.register('address')}
              className="h-10"
              placeholder={language === 'ar' ? 'أدخل العنوان' : 'Enter address'}
              data-testid="input-address"
            />
            {form.formState.errors.address && (
              <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          {/* Headquarters Checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Controller
              name="isHeadquarters"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="isHeadquarters"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-headquarters"
                />
              )}
            />
            <Label 
              htmlFor="isHeadquarters" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
            </Label>
          </div>

          <Separator />

          {/* Map Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'الموقع على الخريطة' : 'Location on Map'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' 
                ? 'انقر على الخريطة لتحديد الموقع (اختياري)' 
                : 'Click on the map to pin location (optional)'}
            </p>
            <div className="rounded-lg overflow-hidden border">
              <MapLocationPicker
                latitude={form.watch('latitude')}
                longitude={form.watch('longitude')}
                onLocationSelect={(lat, lng) => {
                  form.setValue('latitude', lat);
                  form.setValue('longitude', lng);
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
            data-testid="button-cancel"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full sm:w-auto"
            data-testid="button-save-location"
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