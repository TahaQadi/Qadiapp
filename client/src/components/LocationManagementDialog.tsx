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
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  addressEn: z.string().min(1, 'English address is required'),
  addressAr: z.string().min(1, 'Arabic address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  isHeadquarters: z.boolean().default(false),
  phone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type LocationForm = z.infer<typeof locationSchema>;

interface LocationManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: ClientLocation | null;
  onSave: (data: LocationForm) => void;
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
      nameEn: '',
      nameAr: '',
      addressEn: '',
      addressAr: '',
      city: '',
      country: '',
      isHeadquarters: false,
      phone: '',
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Reset form when dialog opens or location changes
  useEffect(() => {
    if (open) {
      form.reset(location ? {
        nameEn: location.nameEn,
        nameAr: location.nameAr,
        addressEn: location.addressEn,
        addressAr: location.addressAr,
        city: location.city || '',
        country: location.country || '',
        isHeadquarters: location.isHeadquarters || false,
        phone: location.phone || '',
        latitude: location.latitude ? Number(location.latitude) : undefined,
        longitude: location.longitude ? Number(location.longitude) : undefined,
      } : {
        nameEn: '',
        nameAr: '',
        addressEn: '',
        addressAr: '',
        city: '',
        country: '',
        isHeadquarters: false,
        phone: '',
        latitude: undefined,
        longitude: undefined,
      });
    }
  }, [open, location, form]);

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      onSave(data);
    })();
  };

  const handleCancel = () => {
    // Reset form to current location data or empty state
    form.reset(location ? {
      nameEn: location.nameEn,
      nameAr: location.nameAr,
      addressEn: location.addressEn,
      addressAr: location.addressAr,
      city: location.city || '',
      country: location.country || '',
      isHeadquarters: location.isHeadquarters || false,
      phone: location.phone || '',
      latitude: location.latitude ? Number(location.latitude) : undefined,
      longitude: location.longitude ? Number(location.longitude) : undefined,
    } : {
      nameEn: '',
      nameAr: '',
      addressEn: '',
      addressAr: '',
      city: '',
      country: '',
      isHeadquarters: false,
      phone: '',
      latitude: undefined,
      longitude: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[625px] max-h-[90vh] overflow-y-auto p-4 sm:p-6" data-testid="dialog-location">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            {location 
              ? (language === 'ar' ? 'تعديل الموقع' : 'Edit Location')
              : (language === 'ar' ? 'إضافة موقع' : 'Add Location')
            }
          </DialogTitle>
          <DialogDescription className="text-sm">
            {language === 'ar' 
              ? 'أدخل معلومات الموقع بالعربية والإنجليزية'
              : 'Enter location information in both Arabic and English'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
          {/* Location Names Section */}
          <div className="space-y-3">
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'ar' ? 'اسم الموقع' : 'Location Name'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nameAr" className="text-sm">
                  {language === 'ar' ? 'عربي' : 'Arabic'}
                </Label>
                <Input
                  id="nameAr"
                  {...form.register('nameAr')}
                  className="h-10"
                  data-testid="input-name-ar"
                />
                {form.formState.errors.nameAr && (
                  <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nameEn" className="text-sm">
                  {language === 'ar' ? 'إنجليزي' : 'English'}
                </Label>
                <Input
                  id="nameEn"
                  {...form.register('nameEn')}
                  className="h-10"
                  data-testid="input-name-en"
                />
                {form.formState.errors.nameEn && (
                  <p className="text-xs text-destructive">{form.formState.errors.nameEn.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Section */}
          <div className="space-y-3">
            <div className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {language === 'ar' ? 'العنوان' : 'Address'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="addressAr" className="text-sm">
                  {language === 'ar' ? 'عربي' : 'Arabic'}
                </Label>
                <Input
                  id="addressAr"
                  {...form.register('addressAr')}
                  className="h-10"
                  data-testid="input-address-ar"
                />
                {form.formState.errors.addressAr && (
                  <p className="text-xs text-destructive">{form.formState.errors.addressAr.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addressEn" className="text-sm">
                  {language === 'ar' ? 'إنجليزي' : 'English'}
                </Label>
                <Input
                  id="addressEn"
                  {...form.register('addressEn')}
                  className="h-10"
                  data-testid="input-address-en"
                />
                {form.formState.errors.addressEn && (
                  <p className="text-xs text-destructive">{form.formState.errors.addressEn.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* City & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-sm">
                {language === 'ar' ? 'المدينة' : 'City'}
              </Label>
              <Input
                id="city"
                {...form.register('city')}
                className="h-10"
                placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                data-testid="input-city"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-sm">
                {language === 'ar' ? 'الدولة' : 'Country'}
              </Label>
              <Input
                id="country"
                {...form.register('country')}
                className="h-10"
                placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
                data-testid="input-country"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm">
              {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
            </Label>
            <Input
              id="phone"
              type="tel"
              {...form.register('phone')}
              className="h-10"
              placeholder={language === 'ar' ? 'اختياري' : 'Optional'}
              data-testid="input-phone"
            />
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
            <Label className="text-sm font-semibold">
              {language === 'ar' ? 'تحديد الموقع على الخريطة' : 'Pin Location on Map'}
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
