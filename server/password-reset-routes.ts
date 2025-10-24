import { Router } from 'express';
import { storage } from './storage';
import { hashPassword, comparePasswords } from './auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const router = Router();

// Validation schemas
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required / كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters / كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match / كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

const adminResetPasswordSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required / معرف العميل مطلوب'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters / كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required / البريد الإلكتروني صالح مطلوب'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required / رمز إعادة التعيين مطلوب'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters / كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match / كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

// Change own password (authenticated users)
router.post('/password/change', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        message: 'Unauthorized / غير مصرح',
        messageAr: 'غير مصرح'
      });
    }

    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: errors,
        messageAr: errors
      });
    }

    const { currentPassword, newPassword } = validationResult.data;
    const user = req.user!;

    // Get current user's account
    const client = await storage.getClient(user.id);
    if (!client || !client.password) {
      return res.status(404).json({
        message: 'Account not found / الحساب غير موجود',
        messageAr: 'الحساب غير موجود'
      });
    }

    // Verify current password
    const isValidPassword = await comparePasswords(currentPassword, client.password);
    if (!isValidPassword) {
      return res.status(400).json({
        message: 'Current password is incorrect / كلمة المرور الحالية غير صحيحة',
        messageAr: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateClient(client.id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully / تم تغيير كلمة المرور بنجاح',
      messageAr: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Password change failed',
      messageAr: 'فشل تغيير كلمة المرور',
    });
  }
});

// Admin reset user password
router.post('/password/admin-reset', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
      return res.status(403).json({ 
        message: 'Admin access required / مطلوب صلاحيات المسؤول',
        messageAr: 'مطلوب صلاحيات المسؤول'
      });
    }

    const validationResult = adminResetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: errors,
        messageAr: errors
      });
    }

    const { clientId, newPassword } = validationResult.data;

    // Get client
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({
        message: 'Client not found / العميل غير موجود',
        messageAr: 'العميل غير موجود'
      });
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateClient(clientId, { password: hashedPassword });

    res.json({
      success: true,
      message: `Password reset successfully for ${client.nameEn} / تم إعادة تعيين كلمة المرور بنجاح لـ ${client.nameAr}`,
      messageAr: `تم إعادة تعيين كلمة المرور بنجاح لـ ${client.nameAr}`
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Password reset failed',
      messageAr: 'فشل إعادة تعيين كلمة المرور',
    });
  }
});

// Request password reset (forgot password)
router.post('/password/forgot', async (req, res) => {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: errors,
        messageAr: errors
      });
    }

    const { email } = validationResult.data;

    // Check if user exists
    const clients = await storage.getClients();
    const client = clients.find(c => c.email === email);

    // Always return success to avoid email enumeration
    if (!client) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent / إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور',
        messageAr: 'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور'
      });
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await storage.createPasswordResetToken({
      email,
      token,
      expiresAt,
    });

    // TODO: Send email with reset link
    // For now, log the token (in production, this should be sent via email)

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent / إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور',
      messageAr: 'إذا كان هناك حساب بهذا البريد الإلكتروني، فقد تم إرسال رابط إعادة تعيين كلمة المرور',
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken: token })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Password reset request failed',
      messageAr: 'فشل طلب إعادة تعيين كلمة المرور',
    });
  }
});

// Reset password with token
router.post('/password/reset', async (req, res) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: errors,
        messageAr: errors
      });
    }

    const { token, newPassword } = validationResult.data;

    // Find and validate reset token
    const resetToken = await storage.getPasswordResetToken(token);
    if (!resetToken) {
      return res.status(400).json({
        message: 'Invalid or expired reset token / رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
        messageAr: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية'
      });
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      await storage.deletePasswordResetToken(resetToken.id);
      return res.status(400).json({
        message: 'Reset token has expired / رمز إعادة التعيين منتهي الصلاحية',
        messageAr: 'رمز إعادة التعيين منتهي الصلاحية'
      });
    }

    // Find client by email
    const clients = await storage.getClients();
    const client = clients.find(c => c.email === resetToken.email);
    if (!client) {
      return res.status(404).json({
        message: 'Account not found / الحساب غير موجود',
        messageAr: 'الحساب غير موجود'
      });
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateClient(client.id, { password: hashedPassword });

    // Delete used token
    await storage.deletePasswordResetToken(resetToken.id);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password / تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
      messageAr: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Password reset failed',
      messageAr: 'فشل إعادة تعيين كلمة المرور',
    });
  }
});

export default router;
