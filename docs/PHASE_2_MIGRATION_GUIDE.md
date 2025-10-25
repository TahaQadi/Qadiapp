# Phase 2 Migration Guide: API Improvements

This guide explains how to migrate existing code to use the new Phase 2 improvements.

## 1. Query Key Factory Migration

### Before (Old Pattern)
```typescript
// Hardcoded query keys scattered throughout components
const { data: products } = useQuery({
  queryKey: ['/api/products'],
  // ...
});

// Inconsistent invalidation
queryClient.invalidateQueries({ queryKey: ['/api/products'] });
```

### After (New Pattern)
```typescript
import { queryKeys } from '@/lib/queryKeys';

// Type-safe, centralized query keys
const { data: products } = useQuery({
  queryKey: queryKeys.products.list(),
  // ...
});

// Consistent invalidation - invalidates all product queries
queryClient.invalidateQueries({ queryKey: queryKeys.products.all });

// Invalidate specific product
queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
```

### Benefits
- **Type Safety**: TypeScript catches typos and ensures consistency
- **Hierarchical**: Easy to invalidate all related queries (e.g., all products)
- **Centralized**: Single source of truth for query keys
- **Discoverable**: IDE autocomplete shows all available query keys

## 2. Request Validation Migration

### Before (Old Pattern)
```typescript
// Manual validation in routes
app.post('/api/products', requireAdmin, async (req, res) => {
  const { nameEn, nameAr, sku } = req.body;
  
  if (!nameEn || !nameAr || !sku) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // ... rest of handler
});
```

### After (New Pattern)
```typescript
import { validate, validateBody } from '../validation-middleware';
import { createProductSchema } from '@shared/api-validation';

// Automatic validation with standardized errors
app.post('/api/products', 
  requireAdmin,
  validateBody(createProductSchema),
  async (req, res) => {
    // req.body is now typed and validated!
    const product = await storage.createProduct(req.body);
    res.json(createSuccessResponse(product));
  }
);
```

### Benefits
- **Automatic Validation**: Zod handles all validation automatically
- **Type Safety**: Request body is properly typed
- **Standardized Errors**: Consistent error format with ErrorCode
- **Bilingual Messages**: English and Arabic error messages
- **Less Boilerplate**: No manual validation checks

## 3. Multiple Validation Targets

### Example: Validate Body, Query, and Params
```typescript
import { validate } from '../validation-middleware';
import { updateProductSchema, paginatedRequestSchema } from '@shared/api-validation';
import { z } from 'zod';

app.patch('/api/products/:id',
  requireAdmin,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: updateProductSchema,
    query: paginatedRequestSchema,
  }),
  async (req, res) => {
    const { id } = req.params; // typed as string (UUID)
    const updates = req.body; // typed from updateProductSchema
    const pagination = req.query; // typed from paginatedRequestSchema
    
    // All validated and typed!
  }
);
```

## 4. File Upload Validation

### Before
```typescript
app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'File required' });
  }
  if (file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ message: 'File too large' });
  }
  // ... more manual checks
});
```

### After
```typescript
import { validateFile } from '../validation-middleware';

app.post('/api/upload',
  upload.single('file'),
  validateFile({
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    required: true,
  }),
  async (req, res) => {
    // File is validated automatically!
    const file = req.file;
    // ... handle upload
  }
);
```

## 5. Common Validation Helpers

### Validate ID Parameter
```typescript
import { validateId } from '../validation-middleware';

// Before
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || !isUUID(id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  // ...
});

// After
app.get('/api/products/:id', validateId, async (req, res) => {
  const { id } = req.params; // already validated as UUID
  // ...
});
```

### Validate Pagination

**Recommended: Use the helper function**
```typescript
import { validatePagination } from '../validation-middleware';

app.get('/api/products',
  validatePagination,
  async (req, res) => {
    const { page, pageSize, sortBy, sortOrder } = req.query;
    // All validated, coerced, and typed with defaults applied
    // page and pageSize are numbers (coerced from query strings)
  }
);
```

**Alternative: Use the schema directly**
```typescript
import { validateQuery } from '../validation-middleware';
import { paginatedRequestSchema } from '@shared/api-validation';

app.get('/api/products',
  validateQuery(paginatedRequestSchema),
  async (req, res) => {
    const { page, pageSize } = req.query;
    // Query strings are automatically coerced to numbers
  }
);
```

**Important**: Always use `paginatedRequestSchema` or `validatePagination` for query parameters, as they include `z.coerce.number()` to handle string-to-number conversion from URL query strings.

## 6. Custom Validation Schemas

### Creating Custom Schemas

**For Request Bodies (JSON)**
```typescript
// In your route file or shared/api-validation.ts
import { z } from 'zod';
import { validators } from '@shared/api-validation';

const myCustomSchema = z.object({
  email: validators.email,
  age: z.number().int().min(18).max(120), // Use z.number() for JSON bodies
  preferences: z.object({
    notifications: z.boolean(),
    language: z.enum(['en', 'ar']),
  }),
});

// Use it
app.post('/api/custom', validateBody(myCustomSchema), handler);
```

**For Query Parameters (URL strings)**
```typescript
// Query parameters always come as strings, so use z.coerce
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().max(100).default(20),
  minPrice: z.coerce.number().optional(),
  category: z.string().optional(),
});

app.get('/api/products', validateQuery(querySchema), handler);
```

**Key Difference:**
- **Request Body (JSON)**: Use `z.number()`, `z.boolean()` directly
- **Query Parameters (URL)**: Use `z.coerce.number()`, `z.coerce.boolean()` to convert strings

## 7. Error Handling

### Validation Errors
Validation errors automatically return standardized format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be at least 3 characters",
    "messageAr": "فشل التحقق من الصحة. يرجى التحقق من المدخلات",
    "details": [/* Zod error details */],
    "field": "username"
  },
  "meta": {
    "timestamp": "2024-12-01T10:30:00Z"
  }
}
```

### Frontend Handling
```typescript
import { ApiResponse } from '@shared/api-types';

const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await apiRequest<Product>('/api/products', {
      method: 'POST',
      body: data,
    });
    return response;
  },
  onError: (error: any) => {
    if (error.error?.code === 'VALIDATION_ERROR') {
      // Handle validation error
      toast({
        title: error.error.message,
        description: error.error.field,
        variant: 'destructive',
      });
    }
  },
});
```

## 8. Migration Checklist

When migrating a route or component:

### Backend Routes
- [ ] Replace hardcoded validation with `validate()` middleware
- [ ] Use schemas from `@shared/api-validation`
- [ ] Return `createSuccessResponse()` for success
- [ ] Let error handler catch and format errors
- [ ] Remove manual error formatting

### Frontend Queries
- [ ] Import `queryKeys` from `@/lib/queryKeys`
- [ ] Replace hardcoded queryKey strings with factory functions
- [ ] Update invalidation calls to use query key factory
- [ ] Use hierarchical invalidation (e.g., `queryKeys.products.all`)

### Frontend Mutations
- [ ] Use `apiRequest` helper for mutations
- [ ] Handle `ApiResponse` error format
- [ ] Display bilingual error messages
- [ ] Show field-specific errors from validation

## 9. Complete Example: Product CRUD

### Backend Route
```typescript
import { Router } from 'express';
import { requireAdmin } from '../auth';
import { validateBody, validateId } from '../validation-middleware';
import { createProductSchema, updateProductSchema } from '@shared/api-validation';
import { createSuccessResponse, createErrorResponse, ErrorCode } from '@shared/api-types';
import { errors } from '../error-handler';

const router = Router();

// Create product
router.post('/',
  requireAdmin,
  validateBody(createProductSchema),
  async (req, res, next) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(createSuccessResponse(product));
    } catch (error) {
      next(error);
    }
  }
);

// Get product
router.get('/:id',
  validateId,
  async (req, res, next) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        throw errors.notFound('Product', req.params.id);
      }
      res.json(createSuccessResponse(product));
    } catch (error) {
      next(error);
    }
  }
);

// Update product
router.patch('/:id',
  requireAdmin,
  validateId,
  validateBody(updateProductSchema),
  async (req, res, next) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        throw errors.notFound('Product', req.params.id);
      }
      res.json(createSuccessResponse(product));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### Frontend Component
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Product } from '@shared/schema';
import { createProductSchema } from '@shared/api-validation';
import { z } from 'zod';

type CreateProductData = z.infer<typeof createProductSchema>;

export function ProductsPage() {
  // List products
  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.products.list(),
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: async (data: CreateProductData) => {
      return apiRequest<Product>('/api/products', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      toast({ title: 'Product created successfully' });
    },
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProductData> }) => {
      return apiRequest<Product>(`/api/products/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate specific product and list
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      toast({ title: 'Product updated successfully' });
    },
  });

  // ... render component
}
```

## Summary

Phase 2 improvements provide:
- ✅ **Type-safe query management** with query key factory
- ✅ **Automatic request validation** with Zod schemas
- ✅ **Standardized error responses** with bilingual support
- ✅ **Less boilerplate code** in routes and components
- ✅ **Better developer experience** with TypeScript and IDE support
- ✅ **Consistent patterns** across the entire application

Start migrating critical routes first, then gradually update the rest of the application.
