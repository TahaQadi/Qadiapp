
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, Building2, MapPin, Users, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapLocationPicker } from '@/components/MapLocationPicker';

interface OnboardingData {
  user: {
    email: string;
    password: string;
    confirmPassword: string;
  };
  company: {
    nameEn: string;
    nameAr: string;
    email: string;
    phone: string;
  };
  headquarters: {
    nameEn: string;
    nameAr: string;
    addressEn: string;
    addressAr: string;
    city: string;
    country: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  };
  departments: Array<{
    type: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  }>;
  termsAccepted: boolean;
}

const STEPS = [
  { id: 1, nameEn: 'User Account', nameAr: 'حساب المستخدم', icon: UserPlus },
  { id: 2, nameEn: 'Company Info', nameAr: 'معلومات الشركة', icon: Building2 },
  { id: 3, nameEn: 'Location', nameAr: 'الموقع', icon: MapPin },
  { id: 4, nameEn: 'Departments', nameAr: 'الأقسام', icon: Users },
  { id: 5, nameEn: 'Review', nameAr: 'المراجعة', icon: CheckCircle },
];

const DEPARTMENT_TYPES = [
  { value: 'finance', labelEn: 'Finance', labelAr: 'المالية' },
  { value: 'purchase', labelEn: 'Purchase', labelAr: 'المشتريات' },
  { value: 'warehouse', labelEn: 'Warehouse', labelAr: 'المستودع' },
];

export default function OnboardingPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    user: { email: '', password: '', confirmPassword: '' },
    company: { nameEn: '', nameAr: '', email: '', phone: '' },
    headquarters: { 
      nameEn: '', nameAr: '', addressEn: '', addressAr: '', 
      city: '', country: '', phone: '' 
    },
    departments: [],
    termsAccepted: false,
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const payload = {
        user: {
          email: data.user.email,
          password: data.user.password,
        },
        company: data.company,
        headquarters: data.headquarters,
        departments: data.departments,
      };
      const res = await apiRequest('POST', '/api/onboarding/complete', payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? '🎉 مرحباً بك!' : '🎉 Welcome!',
        description: language === 'ar' 
          ? 'تم إنشاء حسابك بنجاح. مرحباً بك في نظام الطلبات!' 
          : 'Your account has been created successfully. Welcome to the ordering system!',
      });
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!onboardingData.user.email) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى إدخال البريد الإلكتروني' 
              : 'Please enter your email',
            variant: 'destructive',
          });
          return false;
        }
        if (!emailRegex.test(onboardingData.user.email)) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى إدخال بريد إلكتروني صحيح' 
              : 'Please enter a valid email address',
            variant: 'destructive',
          });
          return false;
        }
        if (!onboardingData.user.password) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى إدخال كلمة المرور' 
              : 'Please enter a password',
            variant: 'destructive',
          });
          return false;
        }
        if (onboardingData.user.password.length < 6) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' 
              : 'Password must be at least 6 characters',
            variant: 'destructive',
          });
          return false;
        }
        if (onboardingData.user.password !== onboardingData.user.confirmPassword) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'كلمات المرور غير متطابقة' 
              : 'Passwords do not match',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 2:
        if (!onboardingData.company.nameAr) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى إدخال اسم الشركة بالعربية' 
              : 'Please enter company name in Arabic',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 3:
        if (!onboardingData.headquarters.nameAr || !onboardingData.headquarters.addressAr) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى ملء معلومات الموقع بالعربية' 
              : 'Please fill location details in Arabic',
            variant: 'destructive',
          });
          return false;
        }
        if (!onboardingData.headquarters.latitude || !onboardingData.headquarters.longitude) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى تحديد الموقع على الخريطة' 
              : 'Please pin the location on the map',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 4:
        const validDepartments = onboardingData.departments.filter(dept => dept.type);
        if (validDepartments.length === 0) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى إضافة قسم واحد على الأقل مع تحديد النوع' 
              : 'Please add at least one department with a type selected',
            variant: 'destructive',
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!onboardingData.termsAccepted) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' 
          ? 'يرجى قبول الشروط والأحكام' 
          : 'Please accept terms and conditions',
        variant: 'destructive',
      });
      return;
    }
    onboardingMutation.mutate(onboardingData);
  };

  const addDepartment = () => {
    setOnboardingData(prev => ({
      ...prev,
      departments: [
        ...prev.departments,
        { type: '', contactName: '', contactEmail: '', contactPhone: '' }
      ]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">
              {language === 'ar' ? 'تسجيل عميل جديد' : 'Client Onboarding'}
            </h1>
            <div className="text-sm text-muted-foreground">
              {language === 'ar' ? `الخطوة ${currentStep} من ${STEPS.length}` : `Step ${currentStep} of ${STEPS.length}`}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-6">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-primary text-primary-foreground' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-xs text-center">
                    {language === 'ar' ? step.nameAr : step.nameEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? STEPS[currentStep - 1].nameAr : STEPS[currentStep - 1].nameEn}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && (language === 'ar' ? 'أنشئ حساب المستخدم الخاص بك' : 'Create your user account')}
                {currentStep === 2 && (language === 'ar' ? 'أدخل معلومات شركتك الأساسية' : 'Enter your company basic information')}
                {currentStep === 3 && (language === 'ar' ? 'حدد موقع المقر الرئيسي على الخريطة' : 'Pin your headquarters location on the map')}
                {currentStep === 4 && (language === 'ar' ? 'أضف الأقسام وجهات الاتصال (مطلوب قسم واحد على الأقل)' : 'Add departments and contacts (at least one required)')}
                {currentStep === 5 && (language === 'ar' ? 'راجع وأكد المعلومات' : 'Review and confirm information')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-email" data-testid="label-user-email">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email'} *
                    </Label>
                    <Input
                      id="user-email"
                      type="email"
                      data-testid="input-user-email"
                      value={onboardingData.user.email}
                      onChange={(e) => setOnboardingData(prev => ({
                        ...prev,
                        user: { ...prev.user, email: e.target.value }
                      }))}
                      placeholder={language === 'ar' ? 'user@example.com' : 'user@example.com'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-password" data-testid="label-user-password">
                      {language === 'ar' ? 'كلمة المرور' : 'Password'} *
                    </Label>
                    <Input
                      id="user-password"
                      type="password"
                      data-testid="input-user-password"
                      value={onboardingData.user.password}
                      onChange={(e) => setOnboardingData(prev => ({
                        ...prev,
                        user: { ...prev.user, password: e.target.value }
                      }))}
                      placeholder={language === 'ar' ? '6 أحرف على الأقل' : 'At least 6 characters'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-confirm-password" data-testid="label-user-confirm-password">
                      {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
                    </Label>
                    <Input
                      id="user-confirm-password"
                      type="password"
                      data-testid="input-user-confirm-password"
                      value={onboardingData.user.confirmPassword}
                      onChange={(e) => setOnboardingData(prev => ({
                        ...prev,
                        user: { ...prev.user, confirmPassword: e.target.value }
                      }))}
                      placeholder={language === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nameAr" data-testid="label-company-name-ar">
                        {language === 'ar' ? 'اسم الشركة' : 'Company Name (Arabic)'} *
                      </Label>
                      <Input
                        id="nameAr"
                        data-testid="input-company-name-ar"
                        value={onboardingData.company.nameAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, nameAr: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameEn" data-testid="label-company-name-en">
                        {language === 'ar' ? 'الاسم الإنجليزي (اختياري)' : 'English Name (Optional)'}
                      </Label>
                      <Input
                        id="nameEn"
                        data-testid="input-company-name-en"
                        value={onboardingData.company.nameEn}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, nameEn: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'الاسم بالإنجليزية (اختياري)' : 'Name in English (Optional)'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" data-testid="label-company-email">
                        {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        data-testid="input-company-email"
                        value={onboardingData.company.email}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" data-testid="label-company-phone">
                        {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                      </Label>
                      <Input
                        id="phone"
                        data-testid="input-company-phone"
                        value={onboardingData.company.phone}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, phone: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label data-testid="label-location-name-ar">
                        {language === 'ar' ? 'اسم الموقع' : 'Location Name (Arabic)'} *
                      </Label>
                      <Input
                        data-testid="input-location-name-ar"
                        value={onboardingData.headquarters.nameAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, nameAr: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                      />
                    </div>
                    <div>
                      <Label data-testid="label-location-name-en">
                        {language === 'ar' ? 'الاسم الإنجليزي (اختياري)' : 'English Name (Optional)'}
                      </Label>
                      <Input
                        data-testid="input-location-name-en"
                        value={onboardingData.headquarters.nameEn}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, nameEn: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'الاسم بالإنجليزية (اختياري)' : 'Name in English (Optional)'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label data-testid="label-location-address-ar">
                        {language === 'ar' ? 'العنوان' : 'Address (Arabic)'} *
                      </Label>
                      <Input
                        data-testid="input-location-address-ar"
                        value={onboardingData.headquarters.addressAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, addressAr: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'العنوان بالعربية' : 'Address in Arabic'}
                      />
                    </div>
                    <div>
                      <Label data-testid="label-location-address-en">
                        {language === 'ar' ? 'العنوان الإنجليزي (اختياري)' : 'English Address (Optional)'}
                      </Label>
                      <Input
                        data-testid="input-location-address-en"
                        value={onboardingData.headquarters.addressEn}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, addressEn: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'العنوان بالإنجليزية (اختياري)' : 'Address in English (Optional)'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label data-testid="label-location-city">
                        {language === 'ar' ? 'المدينة' : 'City'}
                      </Label>
                      <Input
                        data-testid="input-location-city"
                        value={onboardingData.headquarters.city}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label data-testid="label-location-country">
                        {language === 'ar' ? 'الدولة' : 'Country'}
                      </Label>
                      <Input
                        data-testid="input-location-country"
                        value={onboardingData.headquarters.country}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, country: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label data-testid="label-location-phone">
                        {language === 'ar' ? 'الهاتف' : 'Phone'}
                      </Label>
                      <Input
                        data-testid="input-location-phone"
                        value={onboardingData.headquarters.phone}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, phone: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label data-testid="label-location-map">
                      {language === 'ar' ? 'الموقع على الخريطة *' : 'Map Location *'}
                    </Label>
                    <MapLocationPicker
                      latitude={onboardingData.headquarters.latitude}
                      longitude={onboardingData.headquarters.longitude}
                      onLocationSelect={(lat, lng) => {
                        setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, latitude: lat, longitude: lng }
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  {onboardingData.departments.map((dept, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label data-testid={`label-department-type-${index}`}>
                              {language === 'ar' ? 'نوع القسم' : 'Department Type'}
                            </Label>
                            <Select
                              value={dept.type}
                              onValueChange={(value) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].type = value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            >
                              <SelectTrigger data-testid={`select-department-type-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DEPARTMENT_TYPES.map(dt => (
                                  <SelectItem key={dt.value} value={dt.value}>
                                    {language === 'ar' ? dt.labelAr : dt.labelEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label data-testid={`label-department-contact-name-${index}`}>
                              {language === 'ar' ? 'اسم جهة الاتصال' : 'Contact Name'}
                            </Label>
                            <Input
                              data-testid={`input-department-contact-name-${index}`}
                              value={dept.contactName}
                              onChange={(e) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].contactName = e.target.value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            />
                          </div>
                          <div>
                            <Label data-testid={`label-department-contact-email-${index}`}>
                              {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                            </Label>
                            <Input
                              type="email"
                              data-testid={`input-department-contact-email-${index}`}
                              value={dept.contactEmail}
                              onChange={(e) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].contactEmail = e.target.value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            />
                          </div>
                          <div>
                            <Label data-testid={`label-department-contact-phone-${index}`}>
                              {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
                            </Label>
                            <Input
                              data-testid={`input-department-contact-phone-${index}`}
                              value={dept.contactPhone}
                              onChange={(e) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].contactPhone = e.target.value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={addDepartment} variant="outline" className="w-full" data-testid="button-add-department">
                    {language === 'ar' ? '+ إضافة قسم' : '+ Add Department'}
                  </Button>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'حساب المستخدم' : 'User Account'}</h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-review-user-email">{onboardingData.user.email}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'معلومات الشركة' : 'Company Information'}</h3>
                    <p data-testid="text-review-company-name">{onboardingData.company.nameAr}{onboardingData.company.nameEn ? ` / ${onboardingData.company.nameEn}` : ''}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-review-company-email">{onboardingData.company.email}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'الموقع' : 'Location'}</h3>
                    <p data-testid="text-review-location-name">{onboardingData.headquarters.nameAr}</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-review-location-address">{onboardingData.headquarters.addressAr}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'الأقسام' : 'Departments'}</h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-review-departments-count">
                      {onboardingData.departments.length} {language === 'ar' ? 'قسم' : 'department(s)'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      data-testid="checkbox-terms"
                      checked={onboardingData.termsAccepted}
                      onCheckedChange={(checked) => {
                        setOnboardingData(prev => ({ ...prev, termsAccepted: checked as boolean }));
                      }}
                    />
                    <Label htmlFor="terms" data-testid="label-terms">
                      {language === 'ar' 
                        ? 'أوافق على الشروط والأحكام' 
                        : 'I accept the terms and conditions'}
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                
                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} data-testid="button-next">
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={onboardingMutation.isPending}
                    data-testid="button-submit"
                  >
                    {onboardingMutation.isPending 
                      ? (language === 'ar' ? 'جاري التسجيل...' : 'Submitting...') 
                      : (language === 'ar' ? 'إنهاء التسجيل' : 'Complete Onboarding')
                    }
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
