
import { Router } from 'express';
import { storage } from './storage';
import { hashPassword } from './auth';
import { z } from 'zod';

const router = Router();

// Zod schema for onboarding validation
const onboardingSchema = z.object({
  user: z.object({
    email: z.string().email('Valid email is required / البريد الإلكتروني صالح مطلوب'),
    password: z.string().min(8, 'Password must be at least 8 characters / كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match / كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  }),
  company: z.object({
    nameEn: z.string().optional(),
    nameAr: z.string().min(1, 'Company name in Arabic is required / اسم الشركة بالعربية مطلوب'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  headquarters: z.object({
    nameEn: z.string().optional(),
    nameAr: z.string().min(1, 'HQ name in Arabic is required / اسم المقر بالعربية مطلوب'),
    addressEn: z.string().optional(),
    addressAr: z.string().min(1, 'HQ address in Arabic is required / عنوان المقر بالعربية مطلوب'),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    latitude: z.number({ required_error: 'Map location is required / الموقع على الخريطة مطلوب' }),
    longitude: z.number({ required_error: 'Map location is required / الموقع على الخريطة مطلوب' }),
  }),
  departments: z.array(z.object({
    type: z.string().min(1, 'Department type is required / نوع القسم مطلوب'),
    contactName: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
  })).min(1, 'At least one department is required / قسم واحد على الأقل مطلوب'),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

router.post('/onboarding/complete', async (req, res) => {
  try {
    // Validate request body with Zod
    const validationResult = onboardingSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: errors,
        messageAr: errors
      });
    }

    const data = validationResult.data;

    // Check if email already exists
    const existingClients = await storage.getClients();
    const existingClient = existingClients.find(c => c.email === data.user.email);
    if (existingClient) {
      return res.status(400).json({ 
        message: 'Email already registered / البريد الإلكتروني مسجل بالفعل',
        messageAr: 'البريد الإلكتروني مسجل بالفعل'
      });
    }

    // Determine if this is the first user (becomes admin)
    const isFirstUser = existingClients.length === 0;

    // Hash password
    const hashedPassword = await hashPassword(data.user.password);

    // Create client/company account
    const client = await storage.createClient({
      nameEn: data.company.nameEn || data.company.nameAr,
      nameAr: data.company.nameAr,
      username: data.user.email,
      password: hashedPassword,
      email: data.user.email,
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
      isFirstUser: isFirstUser,
      message: isFirstUser 
        ? 'Welcome! You are the first user and have been granted admin privileges.'
        : 'Onboarding completed successfully',
      messageAr: isFirstUser
        ? 'مرحباً! أنت أول مستخدم وتم منحك صلاحيات المسؤول.'
        : 'تم التسجيل بنجاح',
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
