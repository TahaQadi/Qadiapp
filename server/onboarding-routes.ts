
import { Router } from 'express';
import { storage } from './storage';
import { hashPassword } from './auth';

const router = Router();

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
}

router.post('/onboarding/complete', async (req, res) => {
  try {
    const data: OnboardingData = req.body;

    // Create client/company
    const client = await storage.createClient({
      nameEn: data.company.nameEn,
      nameAr: data.company.nameAr,
      username: data.users[0]?.username || `company_${Date.now()}`,
      password: await hashPassword(data.users[0]?.password || 'temp123'),
      email: data.company.email || null,
      phone: data.company.phone || null,
      isAdmin: data.users[0]?.isAdmin || false,
    });

    // Create headquarters location
    await storage.createClientLocation({
      clientId: client.id,
      nameEn: data.headquarters.nameEn,
      nameAr: data.headquarters.nameAr,
      addressEn: data.headquarters.addressEn,
      addressAr: data.headquarters.addressAr,
      city: data.headquarters.city || null,
      country: data.headquarters.country || null,
      phone: data.headquarters.phone || null,
      latitude: data.headquarters.latitude?.toString() || null,
      longitude: data.headquarters.longitude?.toString() || null,
      isHeadquarters: true,
    });

    // Create departments
    for (const dept of data.departments) {
      if (dept.type) {
        await storage.createClientDepartment({
          clientId: client.id,
          departmentType: dept.type,
          contactName: dept.contactName || null,
          contactEmail: dept.contactEmail || null,
          contactPhone: dept.contactPhone || null,
        });
      }
    }

    // Create company users
    for (const user of data.users) {
      if (user.username && user.password) {
        await storage.createCompanyUser({
          companyId: client.id,
          username: user.username,
          password: await hashPassword(user.password),
          nameEn: user.nameEn,
          nameAr: user.nameAr,
          email: user.email || null,
          phone: user.phone || null,
          departmentType: user.departmentType || null,
          isActive: true,
        });
      }
    }

    res.json({
      success: true,
      clientId: client.id,
      message: 'Onboarding completed successfully',
      messageAr: 'تم التسجيل بنجاح',
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Onboarding failed',
      messageAr: 'فشل التسجيل',
    });
  }
});

export default router;
