import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Phone, Mail, Upload, Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ClientDepartment, ClientLocation } from '@shared/schema';

interface ClientProfile {
  client: {
    id: string;
    nameEn: string;
    nameAr: string;
    username: string;
    email?: string | null;
    phone?: string | null;
  };
  departments: ClientDepartment[];
  locations: ClientLocation[];
}

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [priceFile, setPriceFile] = useState<File | null>(null);

  const { data: profile } = useQuery<ClientProfile>({
    queryKey: ['/api/client/profile'],
  });

  const uploadPricesMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/client/import-prices', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload failed');
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === 'ar' ? 'تم الاستيراد بنجاح' : 'Import successful',
        description: `${data.imported} ${language === 'ar' ? 'سعر تم استيراده' : 'prices imported'}`,
      });
      setPriceFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const handleFileUpload = () => {
    if (priceFile) {
      uploadPricesMutation.mutate(priceFile);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {language === 'ar' ? 'الملف الشخصي' : 'Client Profile'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? profile?.client.nameAr : profile?.client.nameEn}
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">
            <Building className="h-4 w-4 me-2" />
            {language === 'ar' ? 'المعلومات' : 'Information'}
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building className="h-4 w-4 me-2" />
            {language === 'ar' ? 'الأقسام' : 'Departments'}
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="h-4 w-4 me-2" />
            {language === 'ar' ? 'المواقع' : 'Locations'}
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <Upload className="h-4 w-4 me-2" />
            {language === 'ar' ? 'استيراد الأسعار' : 'Import Prices'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
                <p className="mt-1 font-medium">{profile?.client.username}</p>
              </div>
              <div>
                <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                <p className="mt-1 font-medium">{profile?.client.email || '-'}</p>
              </div>
              <div>
                <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
                <p className="mt-1 font-medium">{profile?.client.phone || '-'}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          {profile?.departments?.map((dept: ClientDepartment) => (
            <Card key={dept.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">
                    {dept.departmentType === 'finance' 
                      ? (language === 'ar' ? 'المالية' : 'Finance')
                      : dept.departmentType === 'purchase'
                      ? (language === 'ar' ? 'المشتريات' : 'Purchase')
                      : (language === 'ar' ? 'المستودع' : 'Warehouse')
                    }
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dept.contactName || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dept.contactEmail || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{dept.contactPhone || '-'}</span>
                </div>
              </div>
            </Card>
          ))}
          {(!profile?.departments || profile.departments.length === 0) && (
            <Card className="p-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد أقسام' : 'No departments configured'}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          {profile?.locations?.map((location: ClientLocation) => (
            <Card key={location.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold mb-1">
                    {language === 'ar' ? location.nameAr : location.nameEn}
                  </h3>
                  {location.isHeadquarters && (
                    <Badge variant="default" className="text-xs">
                      {language === 'ar' ? 'المقر الرئيسي' : 'Headquarters'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{language === 'ar' ? location.addressAr : location.addressEn}</p>
                    {location.city && location.country && (
                      <p className="text-muted-foreground">
                        {location.city}, {location.country}
                      </p>
                    )}
                  </div>
                </div>
                {location.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location.phone}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {(!profile?.locations || profile.locations.length === 0) && (
            <Card className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد مواقع' : 'No locations configured'}
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              {language === 'ar' ? 'استيراد قائمة الأسعار' : 'Import Price List'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {language === 'ar' 
                ? 'قم بتحميل ملف CSV يحتوي على SKU، السعر، والعملة (اختياري)'
                : 'Upload a CSV file with SKU, price, and currency (optional)'}
            </p>

            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setPriceFile(e.target.files?.[0] || null)}
                  className="max-w-xs mx-auto"
                  data-testid="input-price-file"
                />
                {priceFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {language === 'ar' ? 'الملف المحدد:' : 'Selected file:'} {priceFile.name}
                  </p>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">
                  {language === 'ar' ? 'تنسيق الملف:' : 'File format:'}
                </p>
                <code className="text-xs">
                  SKU,Price,Currency<br />
                  CHAIR-001,299.99,USD<br />
                  DESK-001,599.99,USD
                </code>
              </div>

              <Button
                onClick={handleFileUpload}
                disabled={!priceFile || uploadPricesMutation.isPending}
                className="w-full"
                data-testid="button-upload-prices"
              >
                {uploadPricesMutation.isPending
                  ? (language === 'ar' ? 'جاري الاستيراد...' : 'Importing...')
                  : (language === 'ar' ? 'استيراد الأسعار' : 'Import Prices')
                }
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
