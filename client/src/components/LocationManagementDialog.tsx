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
import { MapPin, Globe } from 'lucide-react';
import type { ClientLocation } from '@shared/schema';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
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
      city: '',
      country: '',
      phone: '',
      isHeadquarters: false,
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Reset form when dialog opens or location changes
  useEffect(() => {
    if (open) {
      form.reset(location ? {
        name: location.name || '',
        address: location.address || '',
        city: location.city || '',
        country: location.country || '',
        phone: location.phone || '',
        isHeadquarters: location.isHeadquarters || false,
        latitude: location.latitude ? Number(location.latitude) : undefined,
        longitude: location.longitude ? Number(location.longitude) : undefined,
      } : {
        name: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        isHeadquarters: false,
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
    form.reset(location ? {
      name: location.name || '',
      address: location.address || '',
      city: location.city || '',
      country: location.country || '',
      phone: location.phone || '',
      isHeadquarters: location.isHeadquarters || false,
      latitude: location.latitude ? Number(location.latitude) : undefined,
      longitude: location.longitude ? Number(location.longitude) : undefined,
    } : {
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      isHeadquarters: false,
      latitude: undefined,
      longitude: undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 border-border/50 dark:border-[#d4af37]/30 bg-gradient-to-br from-card/95 to-card dark:from-black/95 dark:to-[#1a1a1a]/95 backdrop-blur-xl" data-testid="dialog-location">
        <DialogHeader className="space-y-2 pb-3 border-b border-border/50 dark:border-[#d4af37]/20">
          <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-[#d4af37] dark:to-[#f9c800] bg-clip-text text-transparent flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-[#d4af37]/20 dark:to-[#f9c800]/10">
              <MapPin className="h-4 w-4 text-primary dark:text-[#d4af37]" />
            </div>
            {location 
              ? (language === 'ar' ? 'تعديل الموقع' : 'Edit Location')
              : (language === 'ar' ? 'إضافة موقع' : 'Add Location')
            }
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
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

        <div className="grid gap-3 sm:gap-4 py-4">
          {/* Name Section */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {language === 'ar' ? 'اسم الموقع' : 'Location Name'}
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              className="h-10 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
              placeholder={language === 'ar' ? 'المكتب الرئيسي' : 'Main Office'}
              data-testid="input-name"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Address Section */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              {language === 'ar' ? 'العنوان' : 'Address'}
            </Label>
            <Input
              id="address"
              {...form.register('address')}
              className="h-10 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
              placeholder={language === 'ar' ? 'العنوان' : 'Address'}
              data-testid="input-address"
            />
            {form.formState.errors.address && (
              <p className="text-xs text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          {/* Additional Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                {language === 'ar' ? 'المدينة' : 'City'}
              </Label>
              <Input
                id="city"
                {...form.register('city')}
                className="h-10 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
                placeholder={language === 'ar' ? 'المدينة' : 'City'}
                data-testid="input-city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                {language === 'ar' ? 'الدولة' : 'Country'}
              </Label>
              <Input
                id="country"
                {...form.register('country')}
                className="h-10 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
                placeholder={language === 'ar' ? 'الدولة' : 'Country'}
                data-testid="input-country"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              {language === 'ar' ? 'الهاتف' : 'Phone'}
            </Label>
            <Input
              id="phone"
              {...form.register('phone')}
              className="h-10 border-border/50 dark:border-[#d4af37]/20 focus:border-primary dark:focus:border-[#d4af37]"
              placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'}
              data-testid="input-phone"
            />
          </div>

          {/* Headquarters Checkbox */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 dark:from-accent/20 dark:to-accent/5 border border-border/50 dark:border-[#d4af37]/10">
            <Controller
              name="isHeadquarters"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="isHeadquarters"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-border/50 dark:border-[#d4af37]/30"
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

          <Separator className="my-2" />

          {/* Map Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {language === 'ar' ? 'الموقع على الخريطة' : 'Location on Map'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' 
                ? 'انقر على الخريطة لتحديد الموقع (اختياري)' 
                : 'Click on the map to pin location (optional)'}
            </p>
            <div className="rounded-lg overflow-hidden border-2 border-border/50 dark:border-[#d4af37]/20 shadow-md">
              <MapLocationPicker
                latitude={form.watch('latitude')}
                longitude={form.watch('longitude')}
                onLocationSelect={(lat, lng, address) => {
                  form.setValue('latitude', lat);
                  form.setValue('longitude', lng);
                  if (address) {
                    // Only update if fields are empty to avoid overwriting user input
                    if (!form.getValues('address')) {
                      form.setValue('address', address.address || '');
                    }
                    if (!form.getValues('city')) {
                      form.setValue('city', address.city);
                    }
                    if (!form.getValues('country')) {
                      form.setValue('country', address.country);
                    }
                  }
                }}
              />
            </div>
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
