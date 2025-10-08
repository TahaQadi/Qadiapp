
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

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Check if email configuration exists
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    // Only initialize if credentials are provided
    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('Email service initialized');
    } else {
      console.log('Email service not configured - set SMTP environment variables');
    }
  }

  async sendOrderConfirmation(data: OrderEmailData, language: 'en' | 'ar' = 'en'): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not configured, skipping email');
      return false;
    }

    if (!data.client.email) {
      console.log('Client has no email address');
      return false;
    }

    try {
      const subject = language === 'ar' 
        ? `تأكيد الطلب #${data.order.id.substring(0, 8)}`
        : `Order Confirmation #${data.order.id.substring(0, 8)}`;

      const html = this.generateOrderConfirmationHTML(data, language);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: data.client.email,
        subject,
        html,
      });

      console.log(`Order confirmation email sent to ${data.client.email}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
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
    const itemsTotal = data.items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.quantity), 0
    );

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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
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
}

export const emailService = new EmailService();
