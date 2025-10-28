import type { Express, Response } from "express";
import { requireAdmin, AdminRequest } from "./auth";
import { storage } from "./storage";
import { DocumentUtils } from "./document-utils";
import { PDFStorage } from "./object-storage";

/**
 * Invoice and Contract Generation Routes
 * 
 * NEW endpoints for invoice and contract generation using the optimized template system
 */

export function setupInvoiceContractRoutes(app: Express): void {
  
  // Generate invoice for an order
  app.post('/api/admin/orders/:id/generate-invoice', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const orderId = req.params.id;
      const { dueDate, bankName, bankBranch, bankAccount, paymentDays = '30', taxRate = '16' } = req.body;

      // Get order details
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({
          message: 'Order not found',
          messageAr: 'الطلب غير موجود'
        });
      }

      // Get client
      const client = await storage.getClient(order.clientId);
      if (!client) {
        return res.status(404).json({
          message: 'Client not found',
          messageAr: 'العميل غير موجود'
        });
      }

      // Parse order items
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;

      // Calculate tax breakdown
      const subtotal = order.totalAmount || 0;
      const taxAmount = (subtotal * parseFloat(taxRate)) / (100 + parseFloat(taxRate)); // VAT included in price
      const netAmount = subtotal;

      // Generate invoice using new template system
      const documentResult = await DocumentUtils.generateDocument({
        templateCategory: 'invoice',
        variables: [
          { key: 'invoiceNumber', value: `INV-${orderId.slice(0, 8)}` },
          { key: 'invoiceDate', value: new Date().toLocaleDateString('ar-SA') },
          { key: 'dueDate', value: dueDate || new Date(Date.now() + parseInt(paymentDays) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA') },
          { key: 'clientName', value: client.nameAr || client.nameEn },
          { key: 'clientAddress', value: client.address || '' },
          { key: 'items', value: items },
          { key: 'subtotal', value: subtotal.toFixed(2) },
          { key: 'discount', value: '0' },
          { key: 'netAmount', value: netAmount.toFixed(2) },
          { key: 'taxRate', value: taxRate },
          { key: 'taxAmount', value: taxAmount.toFixed(2) },
          { key: 'total', value: netAmount.toFixed(2) },
          { key: 'bankName', value: bankName || 'البنك...' },
          { key: 'bankBranch', value: bankBranch || 'الفرع...' },
          { key: 'bankAccount', value: bankAccount || 'IBAN...' },
          { key: 'paymentDays', value: paymentDays }
        ],
        clientId: order.clientId,
        metadata: { orderId: order.id }
      });

      if (!documentResult.success) {
        return res.status(500).json({
          message: documentResult.error || 'Failed to generate invoice',
          messageAr: 'فشل إنشاء الفاتورة'
        });
      }

      // Download and send PDF
      const downloadResult = await PDFStorage.downloadPDF(documentResult.fileName!);
      
      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(500).json({
          message: 'Failed to retrieve invoice PDF',
          messageAr: 'فشل استرجاع الفاتورة'
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderId.slice(0, 8)}.pdf"`);
      res.send(downloadResult.data);

    } catch (error) {
      console.error('Invoice generation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate invoice',
        messageAr: 'فشل إنشاء الفاتورة'
      });
    }
  });

  // Generate contract for an LTA
  app.post('/api/admin/ltas/:id/generate-contract', requireAdmin, async (req: AdminRequest, res: Response) => {
    try {
      const ltaId = req.params.id;
      const { products, startDate, endDate } = req.body;

      // Get LTA details
      const lta = await storage.getLta(ltaId);
      if (!lta) {
        return res.status(404).json({
          message: 'LTA not found',
          messageAr: 'الاتفاقية غير موجودة'
        });
      }

      // Get client
      const client = await storage.getClient(lta.clientId);
      if (!client) {
        return res.status(404).json({
          message: 'Client not found',
          messageAr: 'العميل غير موجود'
        });
      }

      // Prepare products for contract
      const contractProducts = products || [];

      // Generate contract using new template system
      const documentResult = await DocumentUtils.generateDocument({
        templateCategory: 'contract',
        variables: [
          { key: 'clientName', value: client.nameAr || client.nameEn },
          { key: 'contractDate', value: new Date().toLocaleDateString('ar-SA') },
          { key: 'startDate', value: startDate || new Date().toLocaleDateString('ar-SA') },
          { key: 'endDate', value: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA') },
          { key: 'products', value: contractProducts }
        ],
        clientId: lta.clientId,
        metadata: { ltaId: lta.id }
      });

      if (!documentResult.success) {
        return res.status(500).json({
          message: documentResult.error || 'Failed to generate contract',
          messageAr: 'فشل إنشاء العقد'
        });
      }

      // Download and send PDF
      const downloadResult = await PDFStorage.downloadPDF(documentResult.fileName!);
      
      if (!downloadResult.ok || !downloadResult.data) {
        return res.status(500).json({
          message: 'Failed to retrieve contract PDF',
          messageAr: 'فشل استرجاع العقد'
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contract-${ltaId.slice(0, 8)}.pdf"`);
      res.send(downloadResult.data);

    } catch (error) {
      console.error('Contract generation error:', error);
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Failed to generate contract',
        messageAr: 'فشل إنشاء العقد'
      });
    }
  });
}

