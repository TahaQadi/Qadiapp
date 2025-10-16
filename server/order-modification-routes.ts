import { Router } from 'express';
import { storage } from './storage';
import { isAuthenticated } from './auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const requestOrderModificationSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required / معرف الطلب مطلوب'),
  modificationType: z.enum(['items', 'cancel'], {
    errorMap: () => ({ message: 'Invalid modification type / نوع التعديل غير صالح' })
  }),
  newItems: z.array(z.object({
    productId: z.string(),
    sku: z.string(),
    nameEn: z.string(),
    nameAr: z.string(),
    price: z.string(),
    quantity: z.number().int().positive(),
    ltaId: z.string(),
    currency: z.string(),
  })).optional(),
  reason: z.string().min(1, 'Reason is required / السبب مطلوب'),
});

const reviewModificationSchema = z.object({
  modificationId: z.string().min(1, 'Modification ID is required / معرف التعديل مطلوب'),
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Invalid status / الحالة غير صالحة' })
  }),
  adminResponse: z.string().optional(),
});

// Client: Request order modification
router.post('/orders/:orderId/modify', isAuthenticated, async (req, res) => {
  try {
    const user = req.user!;
    const { orderId } = req.params;

    // Validate request body
    const validationResult = requestOrderModificationSchema.safeParse({
      orderId,
      ...req.body
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        message: errors,
        messageAr: errors
      });
    }

    const { modificationType, newItems, reason } = validationResult.data;

    // Get order and verify ownership
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found / الطلب غير موجود',
        messageAr: 'الطلب غير موجود'
      });
    }

    if (order.clientId !== user.id) {
      return res.status(403).json({
        message: 'You can only modify your own orders / يمكنك فقط تعديل طلباتك الخاصة',
        messageAr: 'يمكنك فقط تعديل طلباتك الخاصة'
      });
    }

    // Check if order can be modified
    const nonModifiableStatuses = ['cancelled', 'delivered', 'shipped'];
    if (nonModifiableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Orders with status "${order.status}" cannot be modified / لا يمكن تعديل الطلبات بحالة "${order.status}"`,
        messageAr: `لا يمكن تعديل الطلبات بحالة "${order.status}"`
      });
    }

    // Check if there's already a pending modification
    const pendingModifications = await storage.getOrderModifications(orderId);
    const hasPending = pendingModifications.some(m => m.status === 'pending');
    if (hasPending) {
      return res.status(400).json({
        message: 'This order already has a pending modification request / هذا الطلب لديه بالفعل طلب تعديل معلق',
        messageAr: 'هذا الطلب لديه بالفعل طلب تعديل معلق'
      });
    }

    // Calculate new total if modifying items
    let newTotalAmount = null;
    if (modificationType === 'items' && newItems) {
      const total = newItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      newTotalAmount = total.toFixed(2);
    }

    // Create modification request
    const modification = await storage.createOrderModification({
      orderId,
      requestedBy: user.id,
      modificationType,
      newItems: newItems ? JSON.stringify(newItems) : null,
      newTotalAmount: newTotalAmount,
      reason,
      status: 'pending',
    });

    // Update order status to modification_requested
    await storage.updateOrderStatus(orderId, 'modification_requested');

    // Create notification for admin
    await storage.createNotification({
      clientId: null, // Admin notification
      type: 'order_modification_requested',
      titleEn: 'Order Modification Request',
      titleAr: 'طلب تعديل طلب',
      messageEn: `Client ${user.nameEn} requested to ${modificationType === 'cancel' ? 'cancel' : 'modify'} order ${orderId.substring(0, 8)}`,
      messageAr: `طلب العميل ${user.nameAr} ${modificationType === 'cancel' ? 'إلغاء' : 'تعديل'} الطلب ${orderId.substring(0, 8)}`,
      metadata: JSON.stringify({ orderId, modificationId: modification.id })
    });

    res.json({
      success: true,
      modification,
      message: 'Modification request submitted successfully / تم إرسال طلب التعديل بنجاح',
      messageAr: 'تم إرسال طلب التعديل بنجاح'
    });
  } catch (error) {
    console.error('Request order modification error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to request modification',
      messageAr: 'فشل طلب التعديل',
    });
  }
});

// Admin: Get all modification requests
router.get('/admin/order-modifications', isAuthenticated, async (req, res) => {
  try {
    const user = req.user!;
    if (!user.isAdmin) {
      return res.status(403).json({
        message: 'Admin access required / مطلوب صلاحيات المسؤول',
        messageAr: 'مطلوب صلاحيات المسؤول'
      });
    }

    const modifications = await storage.getAllOrderModifications();
    res.json(modifications);
  } catch (error) {
    console.error('Get order modifications error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch modifications',
      messageAr: 'فشل في جلب التعديلات',
    });
  }
});

// Client: Get own order modifications
router.get('/orders/:orderId/modifications', isAuthenticated, async (req, res) => {
  try {
    const user = req.user!;
    const { orderId } = req.params;

    // Verify order ownership
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found / الطلب غير موجود',
        messageAr: 'الطلب غير موجود'
      });
    }

    if (order.clientId !== user.id && !user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied / الوصول مرفوض',
        messageAr: 'الوصول مرفوض'
      });
    }

    const modifications = await storage.getOrderModifications(orderId);
    res.json(modifications);
  } catch (error) {
    console.error('Get order modifications error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch modifications',
      messageAr: 'فشل في جلب التعديلات',
    });
  }
});

// Admin: Review modification request
router.post('/admin/order-modifications/:modificationId/review', isAuthenticated, async (req, res) => {
  try {
    const user = req.user!;
    if (!user.isAdmin) {
      return res.status(403).json({
        message: 'Admin access required / مطلوب صلاحيات المسؤول',
        messageAr: 'مطلوب صلاحيات المسؤول'
      });
    }

    const { modificationId } = req.params;

    // Validate request body
    const validationResult = reviewModificationSchema.safeParse({
      modificationId,
      ...req.body
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({
        message: errors,
        messageAr: errors
      });
    }

    const { status, adminResponse } = validationResult.data;

    // Get modification request
    const modification = await storage.getOrderModification(modificationId);
    if (!modification) {
      return res.status(404).json({
        message: 'Modification request not found / طلب التعديل غير موجود',
        messageAr: 'طلب التعديل غير موجود'
      });
    }

    if (modification.status !== 'pending') {
      return res.status(400).json({
        message: 'This modification request has already been reviewed / تمت مراجعة طلب التعديل هذا بالفعل',
        messageAr: 'تمت مراجعة طلب التعديل هذا بالفعل'
      });
    }

    // Update modification status
    await storage.updateOrderModificationStatus(modificationId, {
      status,
      adminResponse: adminResponse || null,
      reviewedBy: user.id,
      reviewedAt: new Date(),
    });

    // Get the order
    const order = await storage.getOrder(modification.orderId);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found / الطلب غير موجود',
        messageAr: 'الطلب غير موجود'
      });
    }

    // If approved, apply the modification
    if (status === 'approved') {
      if (modification.modificationType === 'cancel') {
        // Cancel the order
        await storage.cancelOrder(modification.orderId, {
          cancellationReason: modification.reason,
          cancelledAt: new Date(),
          cancelledBy: modification.requestedBy,
          status: 'cancelled',
        });
      } else if (modification.modificationType === 'items' && modification.newItems) {
        // Update order items
        await storage.updateOrder(modification.orderId, {
          items: modification.newItems,
          totalAmount: modification.newTotalAmount || order.totalAmount,
          status: 'pending', // Reset to pending after modification
        });
      }
    } else {
      // If rejected, revert order status
      await storage.updateOrderStatus(modification.orderId, 'pending');
    }

    // Notify client
    await storage.createNotification({
      clientId: modification.requestedBy,
      type: 'order_modification_reviewed',
      titleEn: status === 'approved' ? 'Modification Approved' : 'Modification Rejected',
      titleAr: status === 'approved' ? 'تمت الموافقة على التعديل' : 'تم رفض التعديل',
      messageEn: `Your modification request for order ${modification.orderId.substring(0, 8)} has been ${status}${adminResponse ? ': ' + adminResponse : ''}`,
      messageAr: `تم ${status === 'approved' ? 'الموافقة على' : 'رفض'} طلب التعديل للطلب ${modification.orderId.substring(0, 8)}${adminResponse ? ': ' + adminResponse : ''}`,
      metadata: JSON.stringify({ orderId: modification.orderId, modificationId })
    });

    res.json({
      success: true,
      message: `Modification ${status} successfully / تم ${status === 'approved' ? 'الموافقة' : 'الرفض'} على التعديل بنجاح`,
      messageAr: `تم ${status === 'approved' ? 'الموافقة' : 'الرفض'} على التعديل بنجاح`
    });
  } catch (error) {
    console.error('Review modification error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to review modification',
      messageAr: 'فشل في مراجعة التعديل',
    });
  }
});

// Direct cancel order (for quick cancellation without modification request)
router.post('/orders/:orderId/cancel', isAuthenticated, async (req, res) => {
  try {
    const user = req.user!;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        message: 'Cancellation reason is required / سبب الإلغاء مطلوب',
        messageAr: 'سبب الإلغاء مطلوب'
      });
    }

    // Get order and verify ownership
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        message: 'Order not found / الطلب غير موجود',
        messageAr: 'الطلب غير موجود'
      });
    }

    if (order.clientId !== user.id && !user.isAdmin) {
      return res.status(403).json({
        message: 'Access denied / الوصول مرفوض',
        messageAr: 'الوصول مرفوض'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        message: 'Order is already cancelled / الطلب ملغى بالفعل',
        messageAr: 'الطلب ملغى بالفعل'
      });
    }

    const nonCancellableStatuses = ['delivered', 'shipped'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Orders with status "${order.status}" cannot be cancelled / لا يمكن إلغاء الطلبات بحالة "${order.status}"`,
        messageAr: `لا يمكن إلغاء الطلبات بحالة "${order.status}"`
      });
    }

    // Cancel the order
    await storage.cancelOrder(orderId, {
      cancellationReason: reason,
      cancelledAt: new Date(),
      cancelledBy: user.id,
      status: 'cancelled',
    });

    // Notify admin if client cancelled
    if (!user.isAdmin) {
      await storage.createNotification({
        clientId: null, // Admin notification
        type: 'order_cancelled',
        titleEn: 'Order Cancelled',
        titleAr: 'تم إلغاء الطلب',
        messageEn: `Client ${user.nameEn} cancelled order ${orderId.substring(0, 8)}`,
        messageAr: `ألغى العميل ${user.nameAr} الطلب ${orderId.substring(0, 8)}`,
        metadata: JSON.stringify({ orderId, reason })
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully / تم إلغاء الطلب بنجاح',
      messageAr: 'تم إلغاء الطلب بنجاح'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to cancel order',
      messageAr: 'فشل إلغاء الطلب',
    });
  }
});

export default router;
