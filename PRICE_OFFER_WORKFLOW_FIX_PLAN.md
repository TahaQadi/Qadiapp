# Price Offer Workflow Fix Plan

## Overview
This document provides a detailed plan to fix all identified issues in the price offer creation workflow. The plan is organized by priority and includes specific implementation steps.

## Phase 1: Critical Database Fixes (Day 1)

### 1.1 Add Currency Field to LTA Schema

**File**: `shared/schema.ts`

**Changes**:
```typescript
export const ltas = pgTable("ltas", {
  id: uuid("id").defaultRandom().primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status", { enum: ["draft", "active", "expired"] }).notNull().default("active"),
  currency: text("currency").notNull().default("USD"), // ADD THIS LINE
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 1.2 Create Database Migration

**File**: `migrations/0014_add_currency_to_ltas.sql`

**Content**:
```sql
-- Add currency column to ltas table
ALTER TABLE ltas ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Update existing LTAs with default currency
UPDATE ltas SET currency = 'USD' WHERE currency IS NULL;

-- Add index for currency queries
CREATE INDEX idx_ltas_currency ON ltas(currency);
```

### 1.3 Update LTA Insert Schema

**File**: `shared/schema.ts`

**Changes**:
```typescript
export const insertLtaSchema = createInsertSchema(ltas).omit({ id: true, createdAt: true }).extend({
  startDate: z.union([z.date(), z.string().transform(str => new Date(str))]).optional(),
  endDate: z.union([z.date(), z.string().transform(str => new Date(str))]).optional(),
  currency: z.string().default('USD'), // ADD THIS LINE
});
```

## Phase 2: API Validation Enhancement (Day 1-2)

### 2.1 Enhanced Price Offer Creation API

**File**: `server/routes.ts`

**Changes**:
```typescript
// Admin: Create price offer (draft)
app.post("/api/admin/price-offers", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const { requestId, clientId, ltaId, items, subtotal, tax, total, notes, validUntil } = req.body;

    // Enhanced validation
    if (!clientId || !ltaId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Client ID, LTA ID, and items are required",
        messageAr: "معرف العميل ومعرف الاتفاقية والمنتجات مطلوبة"
      });
    }

    // Validate LTA exists and is active
    const lta = await storage.getLta(ltaId);
    if (!lta) {
      return res.status(404).json({
        message: "LTA not found",
        messageAr: "الاتفاقية غير موجودة"
      });
    }

    if (lta.status !== 'active') {
      return res.status(400).json({
        message: "Only active LTAs can be used for price offers",
        messageAr: "يمكن استخدام الاتفاقيات النشطة فقط لعروض الأسعار"
      });
    }

    // Validate client-LTA relationship
    const ltaClients = await storage.getLtaClients(ltaId);
    const isClientAssigned = ltaClients.some(lc => lc.clientId === clientId);
    if (!isClientAssigned) {
      return res.status(400).json({
        message: "Client is not assigned to this LTA",
        messageAr: "العميل غير مخصص لهذه الاتفاقية"
      });
    }

    // Validate products are available in LTA
    const ltaProducts = await storage.getLtaProducts(ltaId);
    const ltaProductIds = ltaProducts.map(lp => lp.productId);
    const invalidProducts = items.filter(item => !ltaProductIds.includes(item.productId));
    if (invalidProducts.length > 0) {
      return res.status(400).json({
        message: "Some products are not available in this LTA",
        messageAr: "بعض المنتجات غير متاحة في هذه الاتفاقية"
      });
    }

    // Validate currency consistency
    const currencies = [...new Set(items.map(item => item.currency))];
    if (currencies.length > 1) {
      return res.status(400).json({
        message: "All items must use the same currency",
        messageAr: "يجب أن تستخدم جميع العناصر نفس العملة"
      });
    }

    // Validate currency matches LTA currency
    if (currencies.length > 0 && currencies[0] !== lta.currency) {
      return res.status(400).json({
        message: `Items must use LTA currency: ${lta.currency}`,
        messageAr: `يجب أن تستخدم العناصر عملة الاتفاقية: ${lta.currency}`
      });
    }

    // Validate validUntil date
    const validUntilDate = new Date(validUntil);
    if (validUntilDate <= new Date()) {
      return res.status(400).json({
        message: "Valid until date must be in the future",
        messageAr: "يجب أن يكون تاريخ انتهاء الصلاحية في المستقبل"
      });
    }

    // Validate subtotal and total
    if (subtotal === undefined || subtotal === null) {
      return res.status(400).json({
        message: "Subtotal is required",
        messageAr: "المجموع الفرعي مطلوب"
      });
    }

    if (total === undefined || total === null) {
      return res.status(400).json({
        message: "Total is required",
        messageAr: "المجموع الإجمالي مطلوب"
      });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.productId || !item.nameEn || !item.nameAr || !item.sku) {
        return res.status(400).json({
          message: "All items must have productId, nameEn, nameAr, and sku",
          messageAr: "يجب أن تحتوي جميع العناصر على معرف المنتج والأسماء ورمز المنتج"
        });
      }

      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          message: "All items must have positive quantity",
          messageAr: "يجب أن تحتوي جميع العناصر على كمية موجبة"
        });
      }

      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
        return res.status(400).json({
          message: "All items must have positive unit price",
          messageAr: "يجب أن تحتوي جميع العناصر على سعر وحدة موجب"
        });
      }
    }

    // Generate offer number
    const count = (await storage.getAllPriceOffers()).length + 1;
    const offerNumber = `PO-${Date.now()}-${count.toString().padStart(4, '0')}`;

    // Create price offer
    const offer = await storage.createPriceOffer({
      offerNumber,
      requestId: requestId || null,
      clientId,
      ltaId,
      items,
      subtotal: typeof subtotal === 'number' ? subtotal.toString() : subtotal.toString(),
      tax: tax !== undefined && tax !== null ? (typeof tax === 'number' ? tax.toString() : tax.toString()) : '0',
      total: typeof total === 'number' ? total.toString() : total.toString(),
      notes: notes || null,
      validUntil: validUntilDate,
      status: 'draft',
      createdBy: req.client.id
    });

    // Rest of the existing code...
    res.json(offer);
  } catch (error) {
    console.error('Create price offer error:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
});
```

### 2.2 Add LTA Currency to API Responses

**File**: `server/routes.ts`

**Changes**:
```typescript
// Admin: Get all LTAs
app.get("/api/admin/ltas", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const ltas = await storage.getAllLtas();
    res.json(ltas);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Admin: Get single LTA
app.get("/api/admin/ltas/:id", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const lta = await storage.getLta(req.params.id);
    if (!lta) {
      return res.status(404).json({ message: "LTA not found", messageAr: "الاتفاقية غير موجودة" });
    }
    res.json(lta);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
});
```

## Phase 3: Frontend Error Handling Enhancement (Day 2)

### 3.1 Enhanced Error Handling in Dialog

**File**: `client/src/components/PriceOfferCreationDialog.tsx`

**Changes**:
```typescript
// Add error state management
const [errors, setErrors] = useState<Record<string, string>>({});

// Enhanced error handling for LTA currency
useEffect(() => {
  if (selectedLta?.currency) {
    const currentItems = form.getValues('items');
    const updatedItems = currentItems.map(item => ({
      ...item,
      currency: selectedLta.currency || 'USD'
    }));
    form.setValue('items', updatedItems);
  } else if (selectedLta && !selectedLta.currency) {
    // Handle case where LTA doesn't have currency
    console.warn('LTA does not have currency field, defaulting to USD');
    setErrors(prev => ({
      ...prev,
      ltaCurrency: 'LTA currency not available, using USD'
    }));
  }
}, [selectedLta?.currency, form]);

// Enhanced error handling for API calls
const createPriceOfferMutation = useMutation({
  mutationFn: async (data: PriceOfferFormValues) => {
    try {
      const res = await apiRequest('POST', '/api/admin/price-offers', {
        requestId: requestId || null,
        clientId: data.clientId,
        ltaId: data.ltaId,
        items: data.items,
        subtotal: calculateSubtotal(data.items),
        tax: 0,
        total: calculateTotal(data.items),
        notes: data.notes,
        validUntil: data.validUntil.toISOString(),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create price offer');
      }
      
      return res.json();
    } catch (error) {
      console.error('Price offer creation error:', error);
      throw error;
    }
  },
  onSuccess: () => {
    toast({
      title: language === 'ar' ? 'تم إنشاء عرض السعر بنجاح' : 'Price Offer Created Successfully',
      description: language === 'ar' ? 'تم إنشاء عرض السعر بنجاح' : 'Price offer has been created successfully',
    });
    onOpenChange(false);
    form.reset();
    setSelectedProducts([]);
    setErrors({});
    queryClient.invalidateQueries({ queryKey: ['/api/admin/price-offers'] });
    onSuccess?.();
  },
  onError: (error: any) => {
    console.error('Price offer creation error:', error);
    
    // Parse error message for better user feedback
    let errorMessage = error.message || 'Failed to create price offer';
    let errorMessageAr = 'فشل في إنشاء عرض السعر';
    
    if (error.message?.includes('LTA not found')) {
      errorMessage = 'Selected LTA not found';
      errorMessageAr = 'الاتفاقية المحددة غير موجودة';
    } else if (error.message?.includes('Client is not assigned')) {
      errorMessage = 'Client is not assigned to this LTA';
      errorMessageAr = 'العميل غير مخصص لهذه الاتفاقية';
    } else if (error.message?.includes('products are not available')) {
      errorMessage = 'Some products are not available in this LTA';
      errorMessageAr = 'بعض المنتجات غير متاحة في هذه الاتفاقية';
    } else if (error.message?.includes('currency')) {
      errorMessage = 'Currency validation failed';
      errorMessageAr = 'فشل في التحقق من العملة';
    }
    
    toast({
      variant: 'destructive',
      title: language === 'ar' ? 'خطأ في إنشاء عرض السعر' : 'Error Creating Price Offer',
      description: language === 'ar' ? errorMessageAr : errorMessage,
    });
  },
});
```

### 3.2 Enhanced Form Validation

**File**: `client/src/components/PriceOfferCreationDialog.tsx`

**Changes**:
```typescript
const priceOfferSchema = z.object({
  ltaId: z.string().min(1, 'LTA is required'),
  clientId: z.string().min(1, 'Client is required'),
  validUntil: z.date().refine((date) => date > new Date(), {
    message: 'Valid until date must be in the future'
  }),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    nameEn: z.string().min(1, 'English name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    sku: z.string().min(1, 'SKU is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.string().min(1, 'Unit price is required').refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Unit price must be a positive number'),
    currency: z.string().min(1, 'Currency is required'),
  })).min(1, 'At least one product is required'),
});
```

## Phase 4: Integration Tests (Day 2-3)

### 4.1 API Tests

**File**: `server/tests/price-offers.test.ts`

**Content**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { storage } from '../storage';

describe('Price Offers API', () => {
  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
  });

  describe('POST /api/admin/price-offers', () => {
    it('should create price offer with valid data', async () => {
      const offerData = {
        clientId: 'test-client-id',
        ltaId: 'test-lta-id',
        items: [{
          productId: 'test-product-id',
          nameEn: 'Test Product',
          nameAr: 'منتج تجريبي',
          sku: 'TEST-001',
          quantity: 1,
          unitPrice: '100.00',
          currency: 'USD'
        }],
        subtotal: '100.00',
        tax: '0.00',
        total: '100.00',
        notes: 'Test offer',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/admin/price-offers')
        .send(offerData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.offerNumber).toMatch(/^PO-\d+-\d{4}$/);
    });

    it('should reject offer with invalid LTA', async () => {
      const offerData = {
        clientId: 'test-client-id',
        ltaId: 'invalid-lta-id',
        items: [],
        subtotal: '0.00',
        total: '0.00',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/admin/price-offers')
        .send(offerData)
        .expect(404);

      expect(response.body.message).toContain('LTA not found');
    });

    it('should reject offer with invalid client-LTA relationship', async () => {
      // Test case for client not assigned to LTA
    });

    it('should reject offer with invalid products', async () => {
      // Test case for products not available in LTA
    });

    it('should reject offer with invalid currency', async () => {
      // Test case for currency mismatch
    });

    it('should reject offer with past validUntil date', async () => {
      // Test case for invalid date
    });
  });
});
```

### 4.2 Frontend Component Tests

**File**: `client/src/components/__tests__/PriceOfferCreationDialog.test.tsx`

**Content**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PriceOfferCreationDialog from '../PriceOfferCreationDialog';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('PriceOfferCreationDialog', () => {
  it('renders dialog when open', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PriceOfferCreationDialog
          open={true}
          onOpenChange={() => {}}
          onSuccess={() => {}}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Create New Price Offer')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <PriceOfferCreationDialog
          open={true}
          onOpenChange={() => {}}
          onSuccess={() => {}}
        />
      </QueryClientProvider>
    );

    const submitButton = screen.getByText('Create Price Offer');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('LTA is required')).toBeInTheDocument();
    });
  });

  it('handles LTA currency correctly', async () => {
    // Test currency handling
  });

  it('validates date in future', async () => {
    // Test date validation
  });

  it('handles API errors gracefully', async () => {
    // Test error handling
  });
});
```

## Phase 5: Performance Optimization (Day 3)

### 5.1 Optimize Database Queries

**File**: `server/storage.ts`

**Changes**:
```typescript
// Optimize LTA products query
async getLtaProductsWithDetails(ltaId: string): Promise<Array<Product & { contractPrice: string; currency: string }>> {
  const result = await this.db
    .select({
      product: products,
      ltaProduct: ltaProducts
    })
    .from(ltaProducts)
    .innerJoin(products, eq(ltaProducts.productId, products.id))
    .where(eq(ltaProducts.ltaId, ltaId))
    .execute();

  return result.map(row => ({
    ...row.product,
    contractPrice: row.ltaProduct.contractPrice,
    currency: row.ltaProduct.currency
  }));
}
```

### 5.2 Add Caching

**File**: `server/routes.ts`

**Changes**:
```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Cache LTA data
app.get("/api/admin/ltas", requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const cacheKey = 'ltas';
    let ltas = cache.get(cacheKey);
    
    if (!ltas) {
      ltas = await storage.getAllLtas();
      cache.set(cacheKey, ltas);
    }
    
    res.json(ltas);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
});
```

## Phase 6: Documentation (Day 3)

### 6.1 API Documentation

**File**: `docs/API_PRICE_OFFERS.md`

**Content**:
```markdown
# Price Offers API Documentation

## POST /api/admin/price-offers

Creates a new price offer.

### Request Body
```json
{
  "requestId": "string (optional)",
  "clientId": "string (required)",
  "ltaId": "string (required)",
  "items": [
    {
      "productId": "string (required)",
      "nameEn": "string (required)",
      "nameAr": "string (required)",
      "sku": "string (required)",
      "quantity": "number (required, min: 1)",
      "unitPrice": "string (required, positive number)",
      "currency": "string (required)"
    }
  ],
  "subtotal": "string (required)",
  "tax": "string (optional, default: 0)",
  "total": "string (required)",
  "notes": "string (optional)",
  "validUntil": "string (required, ISO date, future date)"
}
```

### Validation Rules
- LTA must exist and be active
- Client must be assigned to the LTA
- All products must be available in the LTA
- All items must use the same currency
- Currency must match LTA currency
- ValidUntil must be in the future
- All quantities must be positive
- All unit prices must be positive

### Response
```json
{
  "id": "string",
  "offerNumber": "string",
  "status": "draft",
  "createdAt": "string",
  // ... other fields
}
```

### Error Responses
- 400: Validation errors
- 404: LTA or client not found
- 500: Server error
```

### 6.2 Component Documentation

**File**: `client/src/components/PriceOfferCreationDialog.md`

**Content**:
```markdown
# PriceOfferCreationDialog Component

## Overview
A comprehensive dialog for creating price offers with LTA integration, client selection, and product management.

## Props
- `open: boolean` - Controls dialog visibility
- `onOpenChange: (open: boolean) => void` - Callback for dialog state changes
- `requestId?: string` - Optional price request ID for pre-filling data
- `onSuccess?: () => void` - Callback for successful creation

## Features
- LTA selection with currency handling
- Client filtering by LTA
- Product management with pricing
- Form validation
- Error handling
- Responsive design

## Usage
```tsx
<PriceOfferCreationDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  requestId={selectedRequestId}
  onSuccess={() => {
    // Handle success
  }}
/>
```
```

## Implementation Timeline

### Day 1
- [ ] Add currency field to LTA schema
- [ ] Create database migration
- [ ] Update LTA insert schema
- [ ] Test database changes

### Day 2
- [ ] Enhance API validation
- [ ] Improve frontend error handling
- [ ] Add integration tests
- [ ] Test complete workflow

### Day 3
- [ ] Performance optimization
- [ ] Add comprehensive documentation
- [ ] Final testing and validation
- [ ] Deployment preparation

## Success Criteria

1. **Database**: LTA currency field added and working
2. **API**: Comprehensive validation and error handling
3. **Frontend**: Robust error handling and user feedback
4. **Tests**: Comprehensive test coverage
5. **Performance**: Optimized queries and rendering
6. **Documentation**: Complete API and component documentation

## Risk Mitigation

1. **Database Changes**: Test migration on staging environment first
2. **API Changes**: Maintain backward compatibility where possible
3. **Frontend Changes**: Gradual rollout with feature flags
4. **Testing**: Comprehensive testing before deployment
5. **Rollback Plan**: Keep previous version available for quick rollback

## Conclusion

This fix plan addresses all identified issues in the price offer creation workflow. The implementation is prioritized by criticality and includes comprehensive testing and documentation. Following this plan will result in a robust, reliable, and well-documented price offer creation system.