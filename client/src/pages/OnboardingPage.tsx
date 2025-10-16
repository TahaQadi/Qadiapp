
import { useState } from 'react';
import { useNavigate } from 'wouter';
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
  { id: 4, nameEn: 'User Accounts', nameAr: 'حسابات المستخدمين', icon: UserPlus },
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
  const navigate = useNavigate();
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
      navigate('/');
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
        if (!onboardingData.company.nameEn || !onboardingData.company.nameAr) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى ملء جميع الحقول المطلوبة' 
              : 'Please fill all required fields',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 2:
        if (!onboardingData.headquarters.nameEn || !onboardingData.headquarters.addressEn) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى ملء معلومات الموقع' 
              : 'Please fill location details',
            variant: 'destructive',
          });
          return false;
        }
        break;
      case 4:
        if (onboardingData.users.length === 0) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'يرجى إضافة مستخدم واحد على الأقل' 
              : 'Please add at least one user',
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
                {currentStep === 2 && (language === 'ar' ? 'حدد موقع المقر الرئيسي' : 'Set your headquarters location')}
                {currentStep === 3 && (language === 'ar' ? 'أضف الأقسام وجهات الاتصال' : 'Add departments and contacts')}
                {currentStep === 4 && (language === 'ar' ? 'أنشئ حسابات المستخدمين' : 'Create user accounts')}
                {currentStep === 5 && (language === 'ar' ? 'راجع وأكد المعلومات' : 'Review and confirm information')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Company Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nameEn">{language === 'ar' ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'} *</Label>
                      <Input
                        id="nameEn"
                        value={onboardingData.company.nameEn}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, nameEn: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameAr">{language === 'ar' ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'} *</Label>
                      <Input
                        id="nameAr"
                        value={onboardingData.company.nameAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          company: { ...prev.company, nameAr: e.target.value }
                        }))}
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
                      <Label>{language === 'ar' ? 'اسم الموقع (إنجليزي)' : 'Location Name (English)'} *</Label>
                      <Input
                        value={onboardingData.headquarters.nameEn}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, nameEn: e.target.value }
                        }))}
                        placeholder={language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'اسم الموقع (عربي)' : 'Location Name (Arabic)'} *</Label>
                      <Input
                        value={onboardingData.headquarters.nameAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, nameAr: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'ar' ? 'العنوان (إنجليزي)' : 'Address (English)'} *</Label>
                      <Input
                        value={onboardingData.headquarters.addressEn}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, addressEn: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>{language === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'} *</Label>
                      <Input
                        value={onboardingData.headquarters.addressAr}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          headquarters: { ...prev.headquarters, addressAr: e.target.value }
                        }))}
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
                    <Label>{language === 'ar' ? 'الموقع على الخريطة (اختياري)' : 'Map Location (Optional)'}</Label>
                    <MapLocationPicker
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

              {/* Step 4: Users */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  {onboardingData.users.map((user, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>{language === 'ar' ? 'اسم المستخدم' : 'Username'} *</Label>
                            <Input
                              value={user.username}
                              onChange={(e) => {
                                const newUsers = [...onboardingData.users];
                                newUsers[index].username = e.target.value;
                                setOnboardingData(prev => ({ ...prev, users: newUsers }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'} *</Label>
                            <Input
                              type="password"
                              value={user.password}
                              onChange={(e) => {
                                const newUsers = [...onboardingData.users];
                                newUsers[index].password = e.target.value;
                                setOnboardingData(prev => ({ ...prev, users: newUsers }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'} *</Label>
                            <Input
                              value={user.nameEn}
                              onChange={(e) => {
                                const newUsers = [...onboardingData.users];
                                newUsers[index].nameEn = e.target.value;
                                setOnboardingData(prev => ({ ...prev, users: newUsers }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'} *</Label>
                            <Input
                              value={user.nameAr}
                              onChange={(e) => {
                                const newUsers = [...onboardingData.users];
                                newUsers[index].nameAr = e.target.value;
                                setOnboardingData(prev => ({ ...prev, users: newUsers }));
                              }}
                            />
                          </div>
                          <div>
                            <Label>{language === 'ar' ? 'القسم' : 'Department'}</Label>
                            <Select
                              value={user.departmentType}
                              onValueChange={(value) => {
                                const newUsers = [...onboardingData.users];
                                newUsers[index].departmentType = value;
                                setOnboardingData(prev => ({ ...prev, users: newUsers }));
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
                          <div className="flex items-center space-x-2 pt-8">
                            <Checkbox
                              id={`admin-${index}`}
                              checked={user.isAdmin}
                              onCheckedChange={(checked) => {
                                const newUsers = [...onboardingData.users];
                                newUsers[index].isAdmin = checked as boolean;
                                setOnboardingData(prev => ({ ...prev, users: newUsers }));
                              }}
                            />
                            <Label htmlFor={`admin-${index}`}>
                              {language === 'ar' ? 'مسؤول النظام' : 'System Admin'}
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={addUser} variant="outline" className="w-full">
                    {language === 'ar' ? '+ إضافة مستخدم' : '+ Add User'}
                  </Button>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'معلومات الشركة' : 'Company Information'}</h3>
                    <p>{onboardingData.company.nameEn} / {onboardingData.company.nameAr}</p>
                    <p className="text-sm text-muted-foreground">{onboardingData.company.email}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'الموقع' : 'Location'}</h3>
                    <p>{onboardingData.headquarters.nameEn}</p>
                    <p className="text-sm text-muted-foreground">{onboardingData.headquarters.addressEn}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'الأقسام' : 'Departments'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {onboardingData.departments.length} {language === 'ar' ? 'قسم' : 'department(s)'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold mb-2">{language === 'ar' ? 'المستخدمون' : 'Users'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {onboardingData.users.length} {language === 'ar' ? 'مستخدم' : 'user(s)'}
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
