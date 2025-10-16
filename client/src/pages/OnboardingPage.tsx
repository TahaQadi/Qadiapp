
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, Building2, MapPin, Users, UserPlus, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapLocationPicker } from '@/components/MapLocationPicker';

interface OnboardingData {
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
  users: Array<{
    username: string;
    password: string;
    nameEn: string;
    nameAr: string;
    email: string;
    phone: string;
    departmentType: string;
    isAdmin: boolean;
  }>;
  termsAccepted: boolean;
}

const STEPS = [
  { id: 1, nameEn: 'Company Info', nameAr: 'معلومات الشركة', icon: Building2 },
  { id: 2, nameEn: 'Location', nameAr: 'الموقع', icon: MapPin },
  { id: 3, nameEn: 'Departments', nameAr: 'الأقسام', icon: Users },
  { id: 4, nameEn: 'Review', nameAr: 'المراجعة', icon: CheckCircle },
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
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    company: { nameEn: '', nameAr: '', email: '', phone: '' },
    headquarters: { 
      nameEn: '', nameAr: '', addressEn: '', addressAr: '', 
      city: '', country: '', phone: '' 
    },
    departments: [],
    users: [],
    termsAccepted: false,
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const res = await apiRequest('POST', '/api/onboarding/complete', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'تم التسجيل بنجاح!' : 'Onboarding Complete!',
        description: language === 'ar' 
          ? 'تم إنشاء حسابك. يرجى تسجيل الدخول.' 
          : 'Your account has been created. Please login.',
      });
      setLocation('/');
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
      case 2:
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
        // Require map pin location
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
      case 3:
        // Require at least one department with a valid type
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

  const addUser = () => {
    setOnboardingData(prev => ({
      ...prev,
      users: [
        ...prev.users,
        { 
          username: '', password: '', nameEn: '', nameAr: '', 
          email: '', phone: '', departmentType: '', isAdmin: false 
        }
      ]
    }));
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Show sign-up screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-3xl">
                  {language === 'ar' ? 'مرحباً بك!' : 'Welcome!'}
                </CardTitle>
                <CardDescription className="text-lg">
                  {language === 'ar' 
                    ? 'ابدأ بالتسجيل باستخدام حساب Replit الخاص بك لإنشاء ملف شركتك' 
                    : 'Sign up with your Replit account to create your company profile'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button
                    onClick={() => window.location.href = '/api/login'}
                    className="w-full h-12 text-lg"
                    size="lg"
                    data-testid="button-signup-replit"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    {language === 'ar' ? 'التسجيل عبر Replit' : 'Sign Up with Replit'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'يمكنك استخدام Google أو GitHub أو البريد الإلكتروني' 
                      : 'Use Google, GitHub, or Email to sign up'}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {language === 'ar' ? 'بعد التسجيل، ستتمكن من:' : 'After signing up, you can:'}
                  </p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>{language === 'ar' ? 'إضافة معلومات شركتك' : 'Add your company information'}</li>
                    <li>{language === 'ar' ? 'تحديد مواقع الفروع' : 'Set branch locations'}</li>
                    <li>{language === 'ar' ? 'إدارة الأقسام والمستخدمين' : 'Manage departments and users'}</li>
                    <li>{language === 'ar' ? 'البدء بتقديم الطلبات' : 'Start placing orders'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
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
          
          {/* Steps Indicator */}
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

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? STEPS[currentStep - 1].nameAr : STEPS[currentStep - 1].nameEn}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && (language === 'ar' ? 'أدخل معلومات شركتك الأساسية' : 'Enter your company basic information')}
                {currentStep === 2 && (language === 'ar' ? 'حدد موقع المقر الرئيسي على الخريطة' : 'Pin your headquarters location on the map')}
                {currentStep === 3 && (language === 'ar' ? 'أضف الأقسام وجهات الاتصال (مطلوب قسم واحد على الأقل)' : 'Add departments and contacts (at least one required)')}
                {currentStep === 4 && (language === 'ar' ? 'راجع وأكد المعلومات' : 'Review and confirm information')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Company Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nameAr">{language === 'ar' ? 'اسم الشركة' : 'Company Name (Arabic)'} *</Label>
                      <Input
                        id="nameAr"
                        value={onboardingData.company.nameAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, nameAr: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'الاسم بالعربية' : 'Name in Arabic'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameEn">{language === 'ar' ? 'الاسم الإنجليزي (اختياري)' : 'English Name (Optional)'}</Label>
                      <Input
                        id="nameEn"
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
                      <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={onboardingData.company.email}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                      <Input
                        id="phone"
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

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'اسم الموقع' : 'Location Name (Arabic)'} *</Label>
                      <Input
                        value={onboardingData.headquarters.nameAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, nameAr: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الاسم الإنجليزي (اختياري)' : 'English Name (Optional)'}</Label>
                      <Input
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
                      <Label>{language === 'ar' ? 'العنوان' : 'Address (Arabic)'} *</Label>
                      <Input
                        value={onboardingData.headquarters.addressAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, addressAr: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'العنوان بالعربية' : 'Address in Arabic'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'العنوان الإنجليزي (اختياري)' : 'English Address (Optional)'}</Label>
                      <Input
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
                      <Label>{language === 'ar' ? 'المدينة' : 'City'}</Label>
                      <Input
                        value={onboardingData.headquarters.city}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, city: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الدولة' : 'Country'}</Label>
                      <Input
                        value={onboardingData.headquarters.country}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, country: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                      <Input
                        value={onboardingData.headquarters.phone}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, phone: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'ar' ? 'الموقع على الخريطة *' : 'Map Location *'}</Label>
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

              {/* Step 3: Departments */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  {onboardingData.departments.map((dept, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{language === 'ar' ? 'نوع القسم' : 'Department Type'}</Label>
                            <Select
                              value={dept.type}
                              onValueChange={(value) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].type = value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            >
                              <SelectTrigger>
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
                            <Label>{language === 'ar' ? 'اسم جهة الاتصال' : 'Contact Name'}</Label>
                            <Input
                              value={dept.contactName}
                              onChange={(e) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].contactName = e.target.value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                            <Input
                              type="email"
                              value={dept.contactEmail}
                              onChange={(e) => {
                                const newDepts = [...onboardingData.departments];
                                newDepts[index].contactEmail = e.target.value;
                                setOnboardingData(prev => ({ ...prev, departments: newDepts }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                            <Input
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
                  <Button onClick={addDepartment} variant="outline" className="w-full">
                    {language === 'ar' ? '+ إضافة قسم' : '+ Add Department'}
                  </Button>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'معلومات الشركة' : 'Company Information'}</h3>
                    <p>{onboardingData.company.nameAr}{onboardingData.company.nameEn ? ` / ${onboardingData.company.nameEn}` : ''}</p>
                    <p className="text-sm text-muted-foreground">{onboardingData.company.email}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'الموقع' : 'Location'}</h3>
                    <p>{onboardingData.headquarters.nameAr}</p>
                    <p className="text-sm text-muted-foreground">{onboardingData.headquarters.addressAr}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'الأقسام' : 'Departments'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {onboardingData.departments.length} {language === 'ar' ? 'قسم' : 'department(s)'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={onboardingData.termsAccepted}
                      onCheckedChange={(checked) => {
                        setOnboardingData(prev => ({ ...prev, termsAccepted: checked as boolean }));
                      }}
                    />
                    <Label htmlFor="terms">
                      {language === 'ar' 
                        ? 'أوافق على الشروط والأحكام' 
                        : 'I accept the terms and conditions'}
                    </Label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                
                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext}>
                    {language === 'ar' ? 'التالي' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={onboardingMutation.isPending}
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
