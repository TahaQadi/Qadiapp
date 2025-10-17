# Order Modification and Cancellation Feature

## Overview
The order modification and cancellation system allows clients to request changes to their orders, with admin review and approval workflow. The system supports full bilingual operation (English/Arabic).

## Architecture

### Database Schema
**Table: `order_modifications`**
- `id` (UUID): Primary key
- `orderId` (varchar): Reference to orders table
- `requestedBy` (varchar): Client ID who requested the modification
- `modificationType` (text): Type of modification ('items' | 'cancel')
- `newItems` (text): JSON string of new items (if modifying items)
- `newTotalAmount` (decimal): New total amount (if modifying items)
- `reason` (text): Reason for the modification request
- `status` (text): Request status ('pending' | 'approved' | 'rejected')
- `adminResponse` (text): Optional response from admin
- `reviewedBy` (varchar): Admin ID who reviewed the request
- `reviewedAt` (timestamp): When the request was reviewed
- `createdAt` (timestamp): When the request was created

### Order Status Flow
1. **Normal Order**: `pending` → `confirmed` → `processing` → `shipped` → `delivered`
2. **With Modification Request**: `pending` → `modification_requested` → `approved/rejected`
3. **If Approved for Cancellation**: → `cancelled`
4. **If Rejected**: → back to `pending`

### Modification Rules
- Orders can be modified only if status is: `pending`, `confirmed`, or `processing`
- Orders CANNOT be modified if status is: `cancelled`, `delivered`, or `shipped`
- Only one pending modification request allowed per order at a time
- Clients can only modify their own orders

## API Endpoints

### Client Endpoints

#### 1. Request Order Modification
```
POST /api/orders/:orderId/modify
```
**Request Body:**
```json
{
  "modificationType": "cancel" | "items",
  "reason": "string (required)",
  "newItems": [/* array of cart items, required if type is 'items' */]
}
```

**Response:**
```json
{
  "success": true,
  "modification": { /* modification object */ },
  "message": "Modification request submitted successfully",
  "messageAr": "تم إرسال طلب التعديل بنجاح"
}
```

#### 2. Direct Order Cancellation
```
POST /api/orders/:orderId/cancel
```
**Request Body:**
```json
{
  "reason": "string (required)"
}
```

#### 3. Get Order Modifications
```
GET /api/orders/:orderId/modifications
```
Returns all modification requests for a specific order.

### Admin Endpoints

#### 1. Get All Modification Requests
```
GET /api/admin/order-modifications
```
Returns all modification requests across all orders.

#### 2. Review Modification Request
```
POST /api/admin/order-modifications/:modificationId/review
```
**Request Body:**
```json
{
  "status": "approved" | "rejected",
  "adminResponse": "string (optional)"
}
```

## Frontend Components

### Client Interface

#### OrdersPage (`client/src/pages/OrdersPage.tsx`)
- Displays all orders for the logged-in client
- Shows order status with color-coded badges
- "Request Modification" button for eligible orders
- Integrated with `OrderModificationDialog`

#### OrderModificationDialog (`client/src/components/OrderModificationDialog.tsx`)
- Modal dialog for submitting modification requests
- Type selection: Cancel or Modify Items (currently only cancel is active)
- Reason input (required)
- Validates order status before allowing submission
- Bilingual support

### Admin Interface

#### OrderModificationsPage (`client/src/pages/admin/OrderModificationsPage.tsx`)
- Lists all modification requests
- Separated into "Pending Review" and "Reviewed" sections
- Shows pending count badge
- Review dialog with approve/reject actions
- Optional admin response field
- Full bilingual support

## Notification System

### Client Notifications
- **Order Modification Requested**: Sent to admin when client requests modification
- **Order Modification Reviewed**: Sent to client when admin approves/rejects

### Notification Types
```typescript
- 'order_modification_requested': When client submits request
- 'order_modification_reviewed': When admin reviews request
- 'order_cancelled': When order is directly cancelled
```

## User Flow

### Client Workflow
1. Client navigates to "My Orders" page
2. Clicks "Request Modification" on an eligible order
3. Selects modification type (currently only "Cancel")
4. Enters reason for modification
5. Submits request
6. Order status changes to "modification_requested"
7. Receives notification when admin reviews the request

### Admin Workflow
1. Admin navigates to "Order Modifications" page
2. Reviews pending modification requests
3. Clicks "Review" on a pending request
4. Views order details and modification reason
5. Optionally adds admin response
6. Approves or rejects the request
7. System automatically:
   - Applies changes if approved (cancels order or updates items)
   - Reverts order status if rejected
   - Sends notification to client

## Validation Rules

### Client-side
- Reason field is required
- Order must not already have a pending modification
- Order status must allow modifications

### Server-side
- Verify order ownership (client can only modify own orders)
- Check order status eligibility
- Validate no existing pending modifications
- Ensure modification type is valid
- Calculate new totals for item modifications

## Security
- Authentication required for all endpoints
- Authorization checks:
  - Clients can only view/modify their own orders
  - Admin access required for review endpoints
- Input validation using Zod schemas
- SQL injection prevention via Drizzle ORM

## Bilingual Support
All user-facing text supports both English and Arabic:
- UI labels and buttons
- Status badges
- Error messages
- Notification content
- Success/failure messages

## Future Enhancements
- Full item modification UI (currently only cancellation is UI-complete)
- Batch modification approval
- Modification history tracking
- Email notifications
- Push notifications for modification updates
- Automated cancellation for specific conditions
- Partial order modifications
