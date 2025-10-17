
import nodemailer from 'nodemailer';
import type { Client, Order } from '@shared/schema';

interface OrderEmailData {
  order: Order;
  client: Client;
  items: Array<{
    nameEn: string;
    nameAr: string;
    sku: string;
    quantity: number;
    price: string;
    currency: string;
  }>;
}

interface PasswordResetEmailData {
  client: Client;
  resetToken: string;
  resetUrl: string;
}

interface WelcomeEmailData {
  client: Client;
  loginUrl: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    };

    // Validate configuration
    if (!emailConfig.host || !emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  Email service not configured. Set these environment variables:');
      console.warn('   - SMTP_HOST (e.g., smtp.gmail.com)');
      console.warn('   - SMTP_PORT (e.g., 587)');
      console.warn('   - SMTP_USER (your email address)');
      console.warn('   - SMTP_PASSWORD (your email password or app password)');
      console.warn('   - SMTP_FROM (optional, defaults to SMTP_USER)');
      console.warn('   - SMTP_SECURE (optional, true for port 465)');
      return;
    }

    try {
      this.config = emailConfig;
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth,
        // Connection timeout
        connectionTimeout: 10000,
        // Socket timeout
        greetingTimeout: 10000,
        // TLS options for better security
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          console.error('❌ Email service verification failed:', error.message);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  private async sendWithRetry(
    mailOptions: nodemailer.SendMailOptions,
    retries = this.maxRetries
  ): Promise<boolean> {
    if (!this.transporter) {
      console.log('📧 Email service not configured, skipping email');
      return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${mailOptions.to}`);
        return true;
      } catch (error: any) {
        console.error(`❌ Email attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt < retries) {
          const delay = this.retryDelay * attempt;
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`❌ Failed to send email after ${retries} attempts`);
    return false;
  }

  async sendOrderConfirmation(data: OrderEmailData, language: 'en' | 'ar' = 'en'): Promise<boolean> {
    if (!data.client.email) {
      console.log('📧 Client has no email address');
      return false;
    }

    const subject = language === 'ar' 
      ? `تأكيد الطلب #${data.order.id.substring(0, 8)}`
      : `Order Confirmation #${data.order.id.substring(0, 8)}`;

    const html = this.generateOrderConfirmationHTML(data, language);

    return this.sendWithRetry({
      from: this.config?.from,
      to: data.client.email,
      subject,
      html,
      // Add text version for better deliverability
      text: this.generateOrderConfirmationText(data, language),
    });
  }

  async sendPasswordReset(data: PasswordResetEmailData, language: 'en' | 'ar' = 'en'): Promise<boolean> {
    if (!data.client.email) {
      console.log('📧 Client has no email address');
      return false;
    }

    const subject = language === 'ar' 
      ? 'إعادة تعيين كلمة المرور'
      : 'Password Reset Request';

    const html = this.generatePasswordResetHTML(data, language);

    return this.sendWithRetry({
      from: this.config?.from,
      to: data.client.email,
      subject,
      html,
      text: this.generatePasswordResetText(data, language),
    });
  }

  async sendWelcomeEmail(data: WelcomeEmailData, language: 'en' | 'ar' = 'en'): Promise<boolean> {
    if (!data.client.email) {
      console.log('📧 Client has no email address');
      return false;
    }

    const subject = language === 'ar' 
      ? 'مرحباً بك في نظام تنفيذ العقود'
      : 'Welcome to LTA Contract Fulfillment System';

    const html = this.generateWelcomeEmailHTML(data, language);

    return this.sendWithRetry({
      from: this.config?.from,
      to: data.client.email,
      subject,
      html,
      text: this.generateWelcomeEmailText(data, language),
    });
  }

  private generateOrderConfirmationText(data: OrderEmailData, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const clientName = isArabic ? data.client.nameAr : data.client.nameEn;
    
    const translations = {
      dear: isArabic ? 'عزيزي' : 'Dear',
      orderReceived: isArabic ? 'تم استلام طلبك بنجاح' : 'Your order has been successfully received',
      orderId: isArabic ? 'رقم الطلب' : 'Order ID',
      total: isArabic ? 'المجموع' : 'Total',
    };

    return `${translations.dear} ${clientName},

${translations.orderReceived}

${translations.orderId}: ${data.order.id}
${translations.total}: ${data.order.totalAmount} ${data.items[0]?.currency || 'USD'}

LTA Contract Fulfillment System`;
  }

  private generatePasswordResetText(data: PasswordResetEmailData, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const clientName = isArabic ? data.client.nameAr : data.client.nameEn;
    
    return isArabic 
      ? `عزيزي ${clientName},

تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك.

انقر على الرابط التالي لإعادة تعيين كلمة المرور:
${data.resetUrl}

هذا الرابط صالح لمدة ساعة واحدة فقط.

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.

نظام تنفيذ العقود`
      : `Dear ${clientName},

We received a request to reset your password.

Click the following link to reset your password:
${data.resetUrl}

This link is valid for 1 hour only.

If you didn't request a password reset, please ignore this email.

LTA Contract Fulfillment System`;
  }

  private generateWelcomeEmailText(data: WelcomeEmailData, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const clientName = isArabic ? data.client.nameAr : data.client.nameEn;
    
    return isArabic 
      ? `مرحباً ${clientName},

مرحباً بك في نظام تنفيذ العقود!

تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول والبدء في تقديم الطلبات.

تسجيل الدخول: ${data.loginUrl}

نظام تنفيذ العقود`
      : `Welcome ${clientName},

Welcome to LTA Contract Fulfillment System!

Your account has been successfully created. You can now log in and start ordering.

Login: ${data.loginUrl}

LTA Contract Fulfillment System`;
  }

  private generatePasswordResetHTML(data: PasswordResetEmailData, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';
    const clientName = isArabic ? data.client.nameAr : data.client.nameEn;

    const translations = {
      title: isArabic ? 'إعادة تعيين كلمة المرور' : 'Password Reset',
      dear: isArabic ? 'عزيزي' : 'Dear',
      message: isArabic 
        ? 'تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك.'
        : 'We received a request to reset your password.',
      button: isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
      validity: isArabic 
        ? 'هذا الرابط صالح لمدة ساعة واحدة فقط.'
        : 'This link is valid for 1 hour only.',
      ignore: isArabic 
        ? 'إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني.'
        : 'If you didn\'t request a password reset, please ignore this email.',
    };

    return `
      <!DOCTYPE html>
      <html dir="${dir}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">${translations.title}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${translations.dear} ${clientName},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            ${translations.message}
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${data.resetUrl}" style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              ${translations.button}
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
            ${translations.validity}
          </p>

          <p style="font-size: 14px; color: #6b7280;">
            ${translations.ignore}
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>LTA Contract Fulfillment System</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateWelcomeEmailHTML(data: WelcomeEmailData, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';
    const clientName = isArabic ? data.client.nameAr : data.client.nameEn;

    const translations = {
      title: isArabic ? 'مرحباً بك!' : 'Welcome!',
      dear: isArabic ? 'مرحباً' : 'Welcome',
      message: isArabic 
        ? 'تم إنشاء حسابك بنجاح في نظام تنفيذ العقود. يمكنك الآن تسجيل الدخول والبدء في تقديم الطلبات.'
        : 'Your account has been successfully created in the LTA Contract Fulfillment System. You can now log in and start ordering.',
      button: isArabic ? 'تسجيل الدخول' : 'Log In',
      features: isArabic ? 'الميزات المتاحة:' : 'Available Features:',
      feature1: isArabic ? 'تصفح الكتالوج الكامل للمنتجات' : 'Browse the complete product catalog',
      feature2: isArabic ? 'تقديم الطلبات بسهولة' : 'Submit orders easily',
      feature3: isArabic ? 'تتبع حالة الطلبات' : 'Track order status',
      feature4: isArabic ? 'عرض الأسعار والعروض' : 'View prices and offers',
    };

    return `
      <!DOCTYPE html>
      <html dir="${dir}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">${translations.title}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-bottom: 20px; font-weight: bold;">
            ${translations.dear} ${clientName},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            ${translations.message}
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${data.loginUrl}" style="background: #059669; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">
              ${translations.button}
            </a>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
            <h3 style="margin-top: 0; color: #059669;">${translations.features}</h3>
            <ul style="margin: 0; padding-${isArabic ? 'right' : 'left'}: 20px;">
              <li style="margin-bottom: 8px;">${translations.feature1}</li>
              <li style="margin-bottom: 8px;">${translations.feature2}</li>
              <li style="margin-bottom: 8px;">${translations.feature3}</li>
              <li style="margin-bottom: 8px;">${translations.feature4}</li>
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>LTA Contract Fulfillment System</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateOrderConfirmationHTML(data: OrderEmailData, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const dir = isArabic ? 'rtl' : 'ltr';
    
    const translations = {
      title: isArabic ? 'تأكيد الطلب' : 'Order Confirmation',
      dear: isArabic ? 'عزيزي' : 'Dear',
      orderReceived: isArabic ? 'تم استلام طلبك بنجاح' : 'Your order has been successfully received',
      orderDetails: isArabic ? 'تفاصيل الطلب' : 'Order Details',
      orderId: isArabic ? 'رقم الطلب' : 'Order ID',
      orderDate: isArabic ? 'تاريخ الطلب' : 'Order Date',
      status: isArabic ? 'الحالة' : 'Status',
      items: isArabic ? 'العناصر' : 'Items',
      item: isArabic ? 'عنصر' : 'Item',
      quantity: isArabic ? 'الكمية' : 'Quantity',
      price: isArabic ? 'السعر' : 'Price',
      total: isArabic ? 'المجموع' : 'Total',
      totalAmount: isArabic ? 'المجموع الكلي' : 'Total Amount',
      thankYou: isArabic ? 'شكراً لطلبك!' : 'Thank you for your order!',
      pipefyCard: isArabic ? 'معرف بطاقة Pipefy' : 'Pipefy Card ID',
    };

    const statusTranslations: Record<string, string> = {
      pending: isArabic ? 'قيد الانتظار' : 'Pending',
      confirmed: isArabic ? 'مؤكد' : 'Confirmed',
      shipped: isArabic ? 'تم الشحن' : 'Shipped',
      delivered: isArabic ? 'تم التسليم' : 'Delivered',
    };

    const clientName = isArabic ? data.client.nameAr : data.client.nameEn;

    const itemsHTML = data.items.map(item => {
      const name = isArabic ? item.nameAr : item.nameEn;
      const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
      
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <strong>${name}</strong><br>
            <small style="color: #6b7280;">SKU: ${item.sku}</small>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: ${isArabic ? 'left' : 'right'};">${item.price} ${item.currency}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: ${isArabic ? 'left' : 'right'};">
            <strong>${itemTotal} ${item.currency}</strong>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html dir="${dir}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${translations.title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f3f4f6;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">${translations.title}</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            ${translations.dear} ${clientName},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            ${translations.orderReceived}
          </p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">${translations.orderDetails}</h2>
            
            <table style="width: 100%; margin-bottom: 15px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>${translations.orderId}:</strong></td>
                <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'}; font-family: monospace;">${data.order.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>${translations.orderDate}:</strong></td>
                <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'};">${new Date(data.order.createdAt).toLocaleString(isArabic ? 'ar' : 'en')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>${translations.status}:</strong></td>
                <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'};">
                  <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 14px;">
                    ${statusTranslations[data.order.status] || data.order.status}
                  </span>
                </td>
              </tr>
              ${data.order.pipefyCardId ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>${translations.pipefyCard}:</strong></td>
                <td style="padding: 8px 0; text-align: ${isArabic ? 'left' : 'right'}; font-family: monospace;">${data.order.pipefyCardId}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <h3 style="color: #667eea; margin-bottom: 15px;">${translations.items} (${data.items.length})</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: ${isArabic ? 'right' : 'left'}; border-bottom: 2px solid #e5e7eb;">${translations.item}</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">${translations.quantity}</th>
                <th style="padding: 12px; text-align: ${isArabic ? 'left' : 'right'}; border-bottom: 2px solid #e5e7eb;">${translations.price}</th>
                <th style="padding: 12px; text-align: ${isArabic ? 'left' : 'right'}; border-bottom: 2px solid #e5e7eb;">${translations.total}</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 16px; text-align: ${isArabic ? 'left' : 'right'}; font-size: 18px;">
                  <strong>${translations.totalAmount}:</strong>
                </td>
                <td style="padding: 16px; text-align: ${isArabic ? 'left' : 'right'}; font-size: 20px;">
                  <strong style="color: #667eea;">${data.order.totalAmount} ${data.items[0]?.currency || 'USD'}</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin-top: 30px;">
            <p style="margin: 0; color: #065f46; text-align: center; font-size: 16px;">
              ✓ ${translations.thankYou}
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
          <p>LTA Contract Fulfillment System</p>
        </div>
      </body>
      </html>
    `;
  }

  // Utility method to test email configuration
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'Email service not configured. Please set SMTP environment variables.',
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email service is configured correctly and ready to send emails.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Email service verification failed: ${error.message}`,
      };
    }
  }
}

export const emailService = new EmailService();
