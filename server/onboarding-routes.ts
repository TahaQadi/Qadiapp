
import { Router } from 'express';
import { storage } from './storage';
import { isAuthenticated } from './replitAuth';

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
}

router.post('/onboarding/complete', isAuthenticated, async (req, res) => {
  try {
    const data: OnboardingData = req.body;
    const user = req.user as any;
    const userId = user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({ 
        message: 'Unauthorized - User not authenticated',
        messageAr: 'غير مصرح - المستخدم غير مسجل الدخول'
      });
    }

    // Get Replit user details
    const replitUser = await storage.getUser(userId);
    if (!replitUser) {
      return res.status(404).json({ 
        message: 'User not found',
        messageAr: 'المستخدم غير موجود'
      });
    }

    // Check if user already has a company (prevent duplicate onboarding)
    const existingClients = await storage.getClients();
    const existingClient = existingClients.find(c => c.userId === userId);
    if (existingClient) {
      return res.status(400).json({ 
        message: 'You have already completed onboarding',
        messageAr: 'لقد أكملت التسجيل بالفعل'
      });
    }

    // Determine if this is the first user (becomes admin)
    const isFirstUser = existingClients.length === 0;

    // Create client/company linked to Replit user
    const client = await storage.createClient({
      userId: userId,
      nameEn: data.company.nameEn || data.company.nameAr,
      nameAr: data.company.nameAr,
      username: replitUser.email || `user_${userId.substring(0, 8)}`,
      password: '', // Not used with Replit Auth
      email: data.company.email || replitUser.email || null,
      phone: data.company.phone || null,
      isAdmin: isFirstUser,
    });

    // Create headquarters location
    await storage.createClientLocation({
      clientId: client.id,
      nameEn: data.headquarters.nameEn || data.headquarters.nameAr,
      nameAr: data.headquarters.nameAr,
      addressEn: data.headquarters.addressEn || data.headquarters.addressAr,
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
