# Order Modification & Cancellation - Testing Guide

## Prerequisites
1. Application running on port 5000
2. Admin user: `taha@qadi.ps` / `Admin@Qadi2025`
3. At least one client with an active order

## Test Scenarios

### Scenario 1: Client Requests Order Cancellation

**Steps:**
1. Login as a client user
2. Navigate to "My Orders" (`/orders`)
3. Find an order with status `pending`, `confirmed`, or `processing`
4. Click "Request Modification" button
5. Select modification type: "Cancel"
6. Enter a reason (e.g., "Changed requirements")
7. Click "Submit Request"

**Expected Results:**
- Success toast message appears
- Order status changes to "modification_requested"
- Request appears in pending modifications list
- Admin receives notification

### Scenario 2: Admin Reviews and Approves Cancellation

**Steps:**
1. Login as admin (`taha@qadi.ps`)
2. Navigate to "Order Modifications" (`/admin/order-modifications`)
3. Verify pending request appears in "Pending Review" section
4. Click "Review" button on the modification request
5. Review details:
   - Order ID
   - Modification type (Cancel badge)
   - Client's reason
6. (Optional) Add admin response
7. Click "Approve" button

**Expected Results:**
- Success toast: "Modification approved successfully"
- Order status changes to "cancelled"
- Order shows cancellation details:
  - cancellationReason: Client's reason
  - cancelledAt: Current timestamp
  - cancelledBy: Client ID
- Modification moved to "Reviewed" section
- Client receives notification about approval

### Scenario 3: Admin Reviews and Rejects Modification

**Steps:**
1. Login as admin
2. Navigate to "Order Modifications"
3. Click "Review" on a pending modification
4. Add admin response (e.g., "Order already in shipping process")
5. Click "Reject" button

**Expected Results:**
- Success toast: "Modification rejected successfully"
- Order status reverts to "pending"
- Modification moved to "Reviewed" section with "Rejected" badge
- Admin response displayed
- Client receives notification about rejection

### Scenario 4: Validate Modification Restrictions

**Test 4.1: Cannot modify already modified order**
1. Request modification on an order
2. Try to request another modification on same order
3. **Expected**: Error message "This order already has a pending modification request"

**Test 4.2: Cannot modify cancelled order**
1. Find a cancelled order
2. Try to click "Request Modification"
3. **Expected**: Button is disabled or not shown

**Test 4.3: Cannot modify delivered order**
1. Find a delivered order
2. Try to click "Request Modification"
3. **Expected**: Button is disabled or not shown

**Test 4.4: Cannot modify shipped order**
1. Find a shipped order
2. Try to click "Request Modification"
3. **Expected**: Button is disabled or not shown

### Scenario 5: Direct Order Cancellation (Alternative Flow)

**API Endpoint Test:**
```bash
# Login as client first to get session cookie
curl -X POST http://localhost:5000/api/orders/{orderId}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Direct cancellation test"}' \
  --cookie-jar cookies.txt
```

**Expected Results:**
- Order immediately cancelled (no admin review)
- Status changes to "cancelled"
- Admin receives notification

### Scenario 6: Authorization Tests

**Test 6.1: Client cannot modify other client's orders**
1. Login as Client A
2. Try to request modification on Client B's order via API
3. **Expected**: 403 Forbidden error

**Test 6.2: Non-admin cannot access admin endpoints**
1. Login as regular client
2. Try to access `/admin/order-modifications`
3. **Expected**: Redirect or 403 error

**Test 6.3: Client can only view own modifications**
1. Login as Client A
2. Request modification on own order
3. Try to view modifications of Client B's order
4. **Expected**: 403 Forbidden error

### Scenario 7: Bilingual Support Test

**English:**
1. Set language to English
2. Request modification
3. Verify all UI text is in English:
   - Button labels
   - Status badges
   - Toast messages
   - Dialog content

**Arabic:**
1. Set language to Arabic (العربية)
2. Request modification
3. Verify all UI text is in Arabic:
   - Button labels (طلب تعديل)
   - Status badges
   - Toast messages
   - Dialog content
4. Verify RTL layout is correct

### Scenario 8: Notification Integration

**Steps:**
1. Request order modification as client
2. Check notifications table in database:
   ```sql
   SELECT * FROM notifications WHERE type = 'order_modification_requested' ORDER BY created_at DESC LIMIT 1;
   ```
3. Verify admin notification created with clientId = NULL
4. Admin reviews modification
5. Check for client notification:
   ```sql
   SELECT * FROM notifications WHERE type = 'order_modification_reviewed' ORDER BY created_at DESC LIMIT 1;
   ```

**Expected Results:**
- Notifications created with correct types
- Admin notifications have clientId = NULL
- Client notifications have correct clientId
- Metadata contains orderId and modificationId

## Database Verification Queries

### Check Modification Records
```sql
SELECT 
  om.id,
  om.order_id,
  om.modification_type,
  om.status,
  om.reason,
  om.admin_response,
  om.created_at,
  om.reviewed_at
FROM order_modifications om
ORDER BY om.created_at DESC
LIMIT 10;
```

### Check Order Status Changes
```sql
SELECT 
  id,
  status,
  cancellation_reason,
  cancelled_at,
  cancelled_by,
  updated_at
FROM orders
WHERE status IN ('modification_requested', 'cancelled')
ORDER BY updated_at DESC
LIMIT 10;
```

### Check Notifications
```sql
SELECT 
  id,
  client_id,
  type,
  title_en,
  message_en,
  is_read,
  created_at
FROM notifications
WHERE type IN ('order_modification_requested', 'order_modification_reviewed', 'order_cancelled')
ORDER BY created_at DESC
LIMIT 10;
```

## Known Limitations

1. **Item Modification UI**: Currently only cancellation is fully implemented in the UI. Item modification logic exists in the backend but requires frontend UI completion.

2. **Modification Types**: 
   - ✅ Fully Working: Cancellation
   - ⚠️ Backend Only: Item modification (needs frontend UI)

3. **Status Restrictions**:
   - ✅ Can modify: pending, confirmed, processing
   - ❌ Cannot modify: shipped, delivered, cancelled

## Troubleshooting

### Issue: "SW registration failed" in browser console
**Solution**: This is expected during development. Service worker registration for PWA functionality may fail in dev mode. It will work in production.

### Issue: TypeScript errors in IDE
**Solution**: Run `npm run typecheck` to verify. All errors should be resolved after the recent fixes.

### Issue: apiRequest signature error
**Solution**: Ensure apiRequest is called with correct signature: `apiRequest(method, url, data)`

### Issue: Admin notifications not appearing
**Solution**: Verify `clientId: null` is supported in notifications table schema (it is by default).

## Performance Considerations

- Modification requests are lightweight (single DB insert + order status update)
- Notification creation is async and doesn't block the response
- Admin UI uses React Query caching to minimize API calls
- HMR (Hot Module Replacement) works correctly for all components

## Success Metrics

✅ Complete Feature Checklist:
- [x] Backend API routes implemented
- [x] Database schema created (order_modifications table)
- [x] Client UI for requesting modifications
- [x] Admin UI for reviewing modifications
- [x] Notification system integrated
- [x] Bilingual support (EN/AR)
- [x] Security and authorization checks
- [x] Input validation with Zod
- [x] Error handling and user feedback
- [x] TypeScript type safety
- [x] Documentation complete
