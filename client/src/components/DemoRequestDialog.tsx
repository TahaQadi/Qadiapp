
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PlayCircle, Phone, Mail, Building2, MessageSquare } from 'lucide-react';

const demoRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  company: z.string().min(2, 'Company name is required'),
  message: z.string().optional(),
});

type DemoRequestForm = z.infer<typeof demoRequestSchema>;

interface DemoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoRequestDialog({ open, onOpenChange }: DemoRequestDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DemoRequestForm>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
    },
  });

  const onSubmit = async (data: DemoRequestForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/demo-request', data);

      toast({
        title: language === 'ar' ? 'تم الإرسال بنجاح' : 'Request Sent Successfully',
        description: language === 'ar' 
          ? 'سنتواصل معك قريباً لترتيب العرض التوضيحي'
          : 'We will contact you soon to schedule your demo',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar'
          ? 'فشل إرسال الطلب. يرجى المحاولة مرة أخرى'
          : 'Failed to send request. Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-[#d4af37]" />
            {language === 'ar' ? 'طلب عرض توضيحي' : 'Request a Demo'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar'
              ? 'املأ النموذج أدناه وسنتواصل معك لترتيب عرض توضيحي مخصص'
              : 'Fill out the form below and we will contact you to arrange a personalized demo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder={language === 'ar' ? 'name@company.com' : 'name@company.com'}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
            </Label>
            <Input
              id="phone"
              type="tel"
              {...form.register('phone')}
              placeholder={language === 'ar' ? '+970 59 123 4567' : '+970 59 123 4567'}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {language === 'ar' ? 'اسم الشركة/المؤسسة' : 'Company/Organization'}
            </Label>
            <Input
              id="company"
              {...form.register('company')}
              placeholder={language === 'ar' ? 'أدخل اسم الشركة' : 'Enter company name'}
            />
            {form.formState.errors.company && (
              <p className="text-sm text-red-500">{form.formState.errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === 'ar' ? 'رسالة (اختياري)' : 'Message (Optional)'}
            </Label>
            <Textarea
              id="message"
              {...form.register('message')}
              placeholder={language === 'ar' 
                ? 'أخبرنا عن احتياجاتك...'
                : 'Tell us about your needs...'}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#d4af37] to-[#f9c800] hover:from-[#f9c800] hover:to-[#d4af37] text-black"
            >
              {isSubmitting
                ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                : (language === 'ar' ? 'إرسال الطلب' : 'Send Request')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
