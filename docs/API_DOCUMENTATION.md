# LTA Application - API Documentation

## Overview

This document provides comprehensive documentation for all REST API endpoints in the LTA Contract Fulfillment Application.

**Base URL**: `/api`

**Authentication**: Session-based (HTTP-only cookies)

**Response Format**: JSON

**Error Handling**: All errors return appropriate HTTP status codes with bilingual error messages.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Client Profile](#client-profile)
3. [Products](#products)
4. [Orders](#orders)
5. [Order Modifications](#order-modifications)
6. [Price Management](#price-management)
7. [LTA Management (Admin)](#lta-management-admin)
8. [Product Management (Admin)](#product-management-admin)
9. [Client Management (Admin)](#client-management-admin)
10. [Vendor Management (Admin)](#vendor-management-admin)
11. [Feedback & Analytics](#feedback--analytics)
12. [Templates & Documents](#templates--documents)
13. [Notifications](#notifications)
14. [Demo Requests](#demo-requests)
15. [Error Logs](#error-logs)

---

## Authentication

### Login

Authenticate a user and create a session.

```http
POST /api/auth/login
```

**Request Body**:
```json
{
  "username": "client1",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "username": "client1",
  "nameEn": "ABC Company",
  "nameAr": "شركة ABC",
  "email": "contact@abc.com",
  "phone": "+966XXXXXXXXX",
  "isAdmin": false
}
```

**Errors**:
- `401` - Invalid credentials

---

### Logout

End the current session.

```http
POST /api/auth/logout
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully",
  "messageAr": "تم تسجيل الخروج بنجاح"
}
```

---

### Get Current User

Retrieve authenticated user information.

```http
GET /api/auth/user
```

**Auth**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "username": "client1",
  "nameEn": "ABC Company",
  "nameAr": "شركة ABC",
  "email": "contact@abc.com",
  "phone": "+966XXXXXXXXX",
  "isAdmin": false,
  "client": {
    "id": "uuid",
    "nameEn": "ABC Company",
    "nameAr": "شركة ABC"
  }
}
```

**Errors**:
- `401` - Not authenticated

---

## Client Profile

### Get Client Profile

Retrieve current client's profile with departments and locations.

```http
GET /api/client/profile
```

**Auth**: Required (Client)

**Response** (200 OK):
```json
{
  "client": {
    "id": "uuid",
    "nameEn": "ABC Company",
    "nameAr": "شركة ABC",
    "username": "client1",
    "email": "contact@abc.com",
    "phone": "+966XXXXXXXXX"
  },
  "departments": [...],
  "locations": [...]
}
```

---

### Update Client Profile

Update own profile information.

```http
PUT /api/client/profile
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "nameEn": "Updated Company Name",
  "nameAr": "اسم الشركة المحدث",
  "email": "newemail@company.com",
  "phone": "+966XXXXXXXXX"
}
```

**Validation**:
- `nameEn`: Required, min 1 character
- `nameAr`: Required, min 1 character
- `email`: Optional, must be valid email or empty
- `phone`: Optional

---

### Create Department

Add a department to client's profile.

```http
POST /api/client/departments
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "departmentType": "finance",
  "contactName": "John Doe",
  "contactEmail": "finance@company.com",
  "contactPhone": "+966XXXXXXXXX"
}
```

**Department Types**: `finance`, `purchase`, `warehouse`

---

### Update Department

```http
PUT /api/client/departments/:id
```

**Auth**: Required (Client)

---

### Delete Department

```http
DELETE /api/client/departments/:id
```

**Auth**: Required (Client)

**Response** (204 No Content)

---

### Create Location

Add a delivery/branch location.

```http
POST /api/client/locations
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "nameEn": "Main Office",
  "nameAr": "المكتب الرئيسي",
  "addressEn": "123 King Fahd Road",
  "addressAr": "طريق الملك فهد 123",
  "city": "Riyadh",
  "country": "Saudi Arabia",
  "isHeadquarters": true,
  "phone": "+966XXXXXXXXX",
  "latitude": 24.7136,
  "longitude": 46.6753
}
```

**Validation**:
- `nameEn`, `nameAr`, `addressEn`, `addressAr`: Required
- `latitude`, `longitude`: Optional numbers
- `isHeadquarters`: Boolean, default false

---

### Update Location

```http
PUT /api/client/locations/:id
```

**Auth**: Required (Client)

---

### Delete Location

```http
DELETE /api/client/locations/:id
```

**Auth**: Required (Client)

---

## Products

### Get All Products (Client)

Retrieve all products from client's assigned LTAs with contract pricing.

```http
GET /api/products
```

**Auth**: Required (Client)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "sku": "PROD-001",
    "nameEn": "Product Name",
    "nameAr": "اسم المنتج",
    "descriptionEn": "Description",
    "descriptionAr": "الوصف",
    "category": "Electronics",
    "mainCategory": "Tech",
    "imageUrl": "https://...",
    "imageUrls": ["https://..."],
    "contractPrice": "29.99",
    "currency": "USD",
    "ltaId": "uuid",
    "ltaNameEn": "2024 Supply Agreement",
    "ltaNameAr": "اتفاقية التوريد 2024"
  }
]
```

**Notes**:
- Only returns products from LTAs assigned to the client
- Includes contract pricing from `lta_products` table
- Products are de-duplicated if assigned to multiple LTAs

---

### Get Product by SKU (Public)

Retrieve a single product without pricing (public access).

```http
GET /api/products/sku/:sku
```

**Auth**: None

**Response** (200 OK):
```json
{
  "id": "uuid",
  "sku": "PROD-001",
  "nameEn": "Product Name",
  "nameAr": "اسم المنتج",
  "descriptionEn": "Description",
  "descriptionAr": "الوصف",
  "category": "Electronics",
  "imageUrl": "https://..."
}
```

**Notes**: Pricing excluded for public access

---

## Orders

### Create Order (Client)

Place a new order.

```http
POST /api/client/orders
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 5,
      "price": "29.99",
      "ltaId": "uuid",
      "sku": "PROD-001"
    }
  ],
  "totalAmount": "149.95",
  "department": "uuid",
  "location": "uuid"
}
```

**Validation**:
- All items must belong to SAME LTA
- Client must be assigned to the LTA
- Prices must match contract pricing
- Quantities must be positive integers

**Response** (201 Created):
```json
{
  "id": "uuid",
  "clientId": "uuid",
  "ltaId": "uuid",
  "items": "[...]",
  "totalAmount": "149.95",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z",
  "pipefyCardId": "12345"
}
```

**Side Effects**:
- Webhook sent to Pipefy (non-blocking)
- Admin notification created

---

### Get Client Orders

Retrieve all orders for the authenticated client.

```http
GET /api/client/orders
```

**Auth**: Required (Client)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "ltaId": "uuid",
    "ltaNameEn": "2024 Supply Agreement",
    "ltaNameAr": "اتفاقية التوريد 2024",
    "items": "[...]",
    "totalAmount": "149.95",
    "status": "delivered",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:00:00Z"
  }
]
```

**Order Statuses**:
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by admin
- `processing` - Being processed
- `shipped` - In transit
- `delivered` - Delivered to client
- `cancelled` - Cancelled
- `modification_requested` - Client requested changes

---

### Get Order History

Retrieve status change history for an order.

```http
GET /api/orders/:id/history
```

**Auth**: Required

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "orderId": "uuid",
    "status": "confirmed",
    "changedBy": "uuid",
    "changedAt": "2024-01-15T11:00:00Z",
    "notes": "Order confirmed",
    "isAdminNote": true
  }
]
```

---

### Get All Orders (Admin)

Retrieve all orders from all clients.

```http
GET /api/admin/orders
```

**Auth**: Required (Admin)

**Response** (200 OK): Same as client orders but includes all clients

---

### Update Order Status (Admin)

Change order status.

```http
PATCH /api/admin/orders/:id/status
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "status": "confirmed",
  "notes": "Order confirmed and sent to warehouse"
}
```

**Response** (200 OK): Updated order object

**Side Effects**:
- Order history entry created
- Client notification created
- If status = `delivered`, feedback notification scheduled for 1 hour later

---

## Order Modifications

### Request Order Modification (Client)

Submit a request to modify or cancel an order.

```http
POST /api/order-modifications
```

**Auth**: Required (Client)

**Request Body (Cancellation)**:
```json
{
  "orderId": "uuid",
  "modificationType": "cancel",
  "reason": "No longer needed"
}
```

**Request Body (Items Modification)**:
```json
{
  "orderId": "uuid",
  "modificationType": "items",
  "newItems": "[{...}]",
  "newTotalAmount": "99.99",
  "reason": "Need different quantities"
}
```

**Validation**:
- Order must be in `pending`, `confirmed`, or `processing` status
- Cannot modify `shipped` or `delivered` orders

**Response** (201 Created):
```json
{
  "id": "uuid",
  "orderId": "uuid",
  "modificationType": "items",
  "status": "pending",
  "reason": "Need different quantities",
  "createdAt": "2024-01-16T09:00:00Z"
}
```

**Side Effects**:
- Order status changed to `modification_requested`
- Admin notifications created

---

### Get Order Modifications (Admin)

Retrieve all modification requests.

```http
GET /api/admin/order-modifications
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "orderId": "uuid",
    "orderNumber": "ORD-001",
    "clientNameEn": "ABC Company",
    "modificationType": "cancel",
    "reason": "No longer needed",
    "status": "pending",
    "createdAt": "2024-01-16T09:00:00Z"
  }
]
```

---

### Review Order Modification (Admin)

Approve or reject a modification request.

```http
POST /api/admin/order-modifications/:id/review
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "status": "approved",
  "adminResponse": "Modification approved. Order updated."
}
```

**Status Values**: `approved`, `rejected`

**Response** (200 OK): Updated modification object

**Side Effects** (if approved):
- Order items/total updated
- Order status restored
- Client notification created

**Side Effects** (if rejected):
- Order status restored to previous
- Client notification created

---

## Price Management

### Create Price Request (Client)

Submit a price quote request.

```http
POST /api/price-requests
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "ltaId": "uuid",
  "products": [
    {
      "productId": "uuid",
      "quantity": 100
    }
  ],
  "notes": "Urgent quote needed for Q1 2024"
}
```

**Validation**:
- Client must be assigned to the LTA
- Products array cannot be empty

**Response** (201 Created):
```json
{
  "id": "uuid",
  "requestNumber": "PR-1705308600000-0001",
  "clientId": "uuid",
  "ltaId": "uuid",
  "products": "[...]",
  "notes": "Urgent quote needed",
  "status": "pending",
  "requestedAt": "2024-01-15T10:30:00Z"
}
```

**Request Number Format**: `PR-{timestamp}-{count}`

**Side Effects**:
- Admin notifications created for ALL admins
- Client notification created (confirmation)

---

### Get Price Requests (Client)

Retrieve own price requests.

```http
GET /api/price-requests
```

**Auth**: Required (Client)

**Response** (200 OK): Array of price requests

---

### Get All Price Requests (Admin)

Retrieve all client price requests.

```http
GET /api/admin/price-requests
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "requestNumber": "PR-1705308600000-0001",
    "clientNameEn": "ABC Company",
    "ltaNameEn": "2024 Supply Agreement",
    "products": "[...]",
    "status": "pending",
    "requestedAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Create Price Offer (Admin)

Create a price quotation draft.

```http
POST /api/admin/price-offers
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "requestId": "uuid",
  "clientId": "uuid",
  "ltaId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "nameEn": "Product Name",
      "nameAr": "اسم المنتج",
      "sku": "PROD-001",
      "quantity": 100,
      "unitPrice": "29.99",
      "total": "2999.00"
    }
  ],
  "subtotal": "2999.00",
  "tax": "449.85",
  "total": "3448.85",
  "notes": "15% discount applied",
  "validUntil": "2024-02-15T23:59:59Z"
}
```

**Validation**:
- `clientId`, `ltaId`, `items`: Required
- `subtotal`, `total`: Required (numeric strings)
- `validUntil`: Required, must be future date

**Response** (201 Created):
```json
{
  "id": "uuid",
  "offerNumber": "PO-1705308600000-0001",
  "status": "draft",
  "createdAt": "2024-01-15T10:30:00Z",
  ...
}
```

**Offer Number Format**: `PO-{timestamp}-{count}`

---

### Send Price Offer (Admin)

Generate PDF and send offer to client.

```http
POST /api/admin/price-offers/:id/send
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "offerNumber": "PO-1705308600000-0001",
  "status": "sent",
  "pdfFileName": "price-offer-PO-xxx.pdf",
  "sentAt": "2024-01-15T10:35:00Z"
}
```

**Process**:
1. Load active `price_offer` template
2. Generate PDF with PDFKit (Arabic support)
3. Upload PDF to Object Storage
4. Update offer status to `sent`
5. Notify client

**Errors**:
- `404` - Offer not found
- `400` - Offer not in draft status
- `500` - No active price offer template found

---

### Get Price Offers (Client)

Retrieve received price offers.

```http
GET /api/price-offers
```

**Auth**: Required (Client)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "offerNumber": "PO-1705308600000-0001",
    "ltaNameEn": "2024 Supply Agreement",
    "items": "[...]",
    "total": "3448.85",
    "status": "sent",
    "validUntil": "2024-02-15T23:59:59Z",
    "pdfFileName": "price-offer-PO-xxx.pdf",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Get Price Offer Details (Client)

View a specific offer (auto-marks as viewed).

```http
GET /api/price-offers/:id
```

**Auth**: Required (Client)

**Response** (200 OK): Full offer object

**Side Effect**: If status was `sent`, updates to `viewed` with `viewedAt` timestamp

---

### Respond to Price Offer (Client)

Accept or reject an offer.

```http
POST /api/price-offers/:id/respond
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "status": "accepted",
  "note": "We accept the offer and will proceed with order"
}
```

**Status Values**: `accepted`, `rejected`

**Validation**:
- Offer must be in `sent` or `viewed` status
- Cannot respond to expired offers

**Response** (200 OK): Updated offer object

**Side Effects**:
- Admin notifications created
- Offer status updated
- Response timestamp recorded

---

### Delete Price Offer (Admin)

Delete a draft offer.

```http
DELETE /api/admin/price-offers/:id
```

**Auth**: Required (Admin)

**Response** (204 No Content)

**Validation**: Can only delete draft offers

---

## LTA Management (Admin)

### Get All LTAs

```http
GET /api/admin/ltas
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "nameEn": "2024 Supply Agreement",
    "nameAr": "اتفاقية التوريد 2024",
    "descriptionEn": "Annual supply contract",
    "descriptionAr": "عقد توريد سنوي",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "status": "active",
    "createdAt": "2023-12-01T00:00:00Z"
  }
]
```

---

### Get LTA Details

```http
GET /api/admin/ltas/:id
```

**Auth**: Required (Admin)

**Response** (200 OK): Single LTA object

---

### Create LTA

```http
POST /api/admin/ltas
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "nameEn": "2025 Supply Agreement",
  "nameAr": "اتفاقية التوريد 2025",
  "descriptionEn": "Annual supply contract for 2025",
  "descriptionAr": "عقد توريد سنوي لعام 2025",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "status": "active"
}
```

**Validation**:
- `nameEn`, `nameAr`: Required
- `startDate`, `endDate`: Required, endDate must be after startDate
- `status`: Default "active"

**Response** (201 Created): Created LTA object

---

### Update LTA

```http
PUT /api/admin/ltas/:id
```

**Auth**: Required (Admin)

**Request Body**: Same as create (all fields optional)

---

### Delete LTA

```http
DELETE /api/admin/ltas/:id
```

**Auth**: Required (Admin)

**Response** (204 No Content)

**Constraints**: May fail if LTA has assigned products or clients (database foreign key constraints)

---

### Assign Products to LTA

```http
POST /api/admin/ltas/:ltaId/products
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "productId": "uuid",
  "contractPrice": "29.99",
  "currency": "USD"
}
```

**Response** (201 Created): Created LTA product assignment

**Unique Constraint**: Cannot assign same product twice to same LTA

---

### Bulk Assign Products to LTA

```http
POST /api/admin/ltas/:ltaId/products/bulk
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "products": [
    {
      "sku": "PROD-001",
      "contractPrice": "29.99",
      "currency": "USD"
    },
    {
      "sku": "PROD-002",
      "contractPrice": "149.50",
      "currency": "USD"
    }
  ]
}
```

**Process**:
1. Validate each SKU exists
2. Validate prices are valid numbers
3. Insert or update each assignment in transaction
4. Return summary

**Response** (200 OK):
```json
{
  "success": true,
  "assigned": 2,
  "errors": []
}
```

---

### Update LTA Product Price

```http
PATCH /api/admin/ltas/:ltaId/products/:productId
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "contractPrice": "34.99"
}
```

---

### Remove Product from LTA

```http
DELETE /api/admin/ltas/:ltaId/products/:productId
```

**Auth**: Required (Admin)

**Response** (204 No Content)

---

### Assign Clients to LTA

```http
POST /api/admin/ltas/:ltaId/clients
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "clientIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** (201 Created): Array of created assignments

---

### Remove Client from LTA

```http
DELETE /api/admin/ltas/:ltaId/clients/:clientId
```

**Auth**: Required (Admin)

**Response** (204 No Content)

---

### Get Client's LTAs

```http
GET /api/client/ltas
```

**Auth**: Required (Client)

**Response** (200 OK): Array of LTAs assigned to client

---

## Product Management (Admin)

### Get All Products (Admin)

```http
GET /api/admin/products
```

**Auth**: Required (Admin)

**Response** (200 OK): Array of all products

---

### Get Product by ID (Admin)

```http
GET /api/admin/products/:id
```

**Auth**: Required (Admin)

---

### Create Product

```http
POST /api/admin/products
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "sku": "PROD-003",
  "nameEn": "Wireless Mouse",
  "nameAr": "فأرة لاسلكية",
  "descriptionEn": "Ergonomic wireless mouse",
  "descriptionAr": "فأرة لاسلكية مريحة",
  "category": "Computer Accessories",
  "mainCategory": "Electronics",
  "unitType": "piece",
  "unit": "pcs",
  "costPricePerPiece": "15.00",
  "sellingPricePiece": "25.00",
  "vendorId": "uuid",
  "imageUrl": "https://..."
}
```

**Validation**:
- `sku`: Required, unique
- `nameEn`, `nameAr`: Required
- Prices: Optional, numeric strings

---

### Update Product

```http
PUT /api/admin/products/:id
```

**Auth**: Required (Admin)

**Request Body**: Same as create (all fields optional)

---

### Delete Product

```http
DELETE /api/admin/products/:id
```

**Auth**: Required (Admin)

**Response** (204 No Content)

---

### Upload Product Image

```http
POST /api/admin/products/:id/image
```

**Auth**: Required (Admin)

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `image`: File (JPEG/PNG/WEBP, max 5MB)

**Response** (200 OK):
```json
{
  "imageUrl": "https://..."
}
```

**Process**:
1. Validate file type and size
2. Upload to Object Storage
3. Update product.imageUrl
4. Return public URL

---

### Import Products (CSV)

```http
POST /api/admin/products/import
```

**Auth**: Required (Admin)

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `file`: CSV file

**CSV Format**: First row = headers matching product fields (sku, nameEn, nameAr, category, etc.)

**Response** (200 OK):
```json
{
  "success": true,
  "imported": 45,
  "skipped": 2,
  "errors": [
    {
      "row": 15,
      "error": "Invalid SKU format"
    }
  ]
}
```

---

### Export Products (CSV)

```http
GET /api/admin/products/export
```

**Auth**: Required (Admin)

**Response** (200 OK):
- Content-Type: `text/csv`
- CSV file download

---

## Client Management (Admin)

### Get All Clients

```http
GET /api/admin/clients
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "username": "client1",
    "nameEn": "ABC Company",
    "nameAr": "شركة ABC",
    "email": "contact@abc.com",
    "phone": "+966XXXXXXXXX",
    "isAdmin": false
  }
]
```

---

### Get Client Details

```http
GET /api/admin/clients/:id
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
{
  "client": {
    "id": "uuid",
    "username": "client1",
    "nameEn": "ABC Company",
    "nameAr": "شركة ABC",
    "email": "contact@abc.com",
    "phone": "+966XXXXXXXXX",
    "isAdmin": false
  },
  "departments": [...],
  "locations": [...]
}
```

---

### Create Client

```http
POST /api/admin/clients
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "username": "newclient",
  "password": "SecurePassword123",
  "nameEn": "New Company",
  "nameAr": "شركة جديدة",
  "email": "info@newcompany.com",
  "phone": "+966XXXXXXXXX"
}
```

**Validation**:
- `username`: Required, unique
- `password`: Required, min 6 characters (will be hashed with scrypt)
- `nameEn`, `nameAr`: Required

---

### Update Client

```http
PUT /api/admin/clients/:id
```

**Auth**: Required (Admin)

**Request Body**: Same as create (except username, password) - all optional

---

### Delete Client

```http
DELETE /api/admin/clients/:id
```

**Auth**: Required (Admin)

**Response** (204 No Content)

**Cascade**: Deletes all related data (departments, locations, orders, etc.)

---

### Toggle Admin Status

```http
PATCH /api/admin/clients/:id/toggle-admin
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "isAdmin": true,
  "message": "Admin status updated",
  "messageAr": "تم تحديث حالة المسؤول"
}
```

---

### Create Company User

```http
POST /api/admin/company-users/:companyId
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "username": "user1",
  "password": "SecurePass123",
  "nameEn": "John Doe",
  "nameAr": "جون دو",
  "email": "john@company.com",
  "phone": "+966XXXXXXXXX",
  "departmentType": "purchase",
  "isActive": true
}
```

**Department Types**: `finance`, `purchase`, `warehouse`, `null`

---

### Update Company User

```http
PATCH /api/admin/company-users/:id
```

**Auth**: Required (Admin)

**Request Body**: Same as create (all optional)

---

### Delete Company User

```http
DELETE /api/admin/company-users/:id
```

**Auth**: Required (Admin)

---

## Vendor Management (Admin)

### Get All Vendors

```http
GET /api/admin/vendors
```

**Auth**: Required (Admin)

---

### Get Vendor Details

```http
GET /api/admin/vendors/:id
```

**Auth**: Required (Admin)

---

### Create Vendor

```http
POST /api/admin/vendors
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "vendorNumber": "VEN-001",
  "nameEn": "Tech Suppliers Inc",
  "nameAr": "شركة موردي التقنية",
  "contactEmail": "sales@techsuppliers.com",
  "contactPhone": "+1234567890",
  "address": "123 Tech Street, Silicon Valley"
}
```

**Validation**:
- `vendorNumber`: Required, unique
- `nameEn`, `nameAr`: Required

---

### Update Vendor

```http
PUT /api/admin/vendors/:id
```

**Auth**: Required (Admin)

---

### Delete Vendor

```http
DELETE /api/admin/vendors/:id
```

**Auth**: Required (Admin)

---

### Import Vendors (CSV)

```http
POST /api/admin/vendors/import
```

**Auth**: Required (Admin)

**Content-Type**: `multipart/form-data`

---

### Export Vendors (CSV)

```http
GET /api/admin/vendors/export
```

**Auth**: Required (Admin)

---

## Feedback & Analytics

### Submit Order Feedback (Client)

```http
POST /api/feedback/order/:orderId
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "rating": 5,
  "orderingProcessRating": 5,
  "productQualityRating": 4,
  "deliverySpeedRating": 5,
  "communicationRating": 5,
  "comments": "Excellent service! Very satisfied.",
  "wouldRecommend": true
}
```

**Validation**:
- All ratings: 1-5 (integers)
- `rating`: Required
- Other ratings: Optional
- `wouldRecommend`: Required (boolean)
- Order must belong to client
- Order must be delivered
- Can only submit once per order

**Response** (200 OK):
```json
{
  "message": "Feedback submitted successfully",
  "messageAr": "تم إرسال التقييم بنجاح",
  "feedback": {...}
}
```

---

### Submit Issue Report (Client)

```http
POST /api/feedback/issue
```

**Auth**: Required (Client)

**Request Body**:
```json
{
  "orderId": "uuid",
  "issueType": "bug",
  "severity": "high",
  "title": "Cart total calculation error",
  "description": "When adding 5 items, total shows incorrect amount",
  "steps": "1. Add product to cart\n2. Update quantity to 5\n3. Check total",
  "expectedBehavior": "Total should be 5 × $29.99 = $149.95",
  "actualBehavior": "Total shows $150.00",
  "browserInfo": "Mozilla/5.0...",
  "screenSize": "1920x1080",
  "screenshots": ["https://..."]
}
```

**Issue Types**: `bug`, `feature_request`, `performance`, `usability`, `content`, `other`

**Severity Levels**: `low`, `medium`, `high`, `critical`

**Response** (200 OK):
```json
{
  "success": true,
  "id": "uuid"
}
```

**Side Effect**: ALL admins notified regardless of severity

---

### Get Feedback Analytics (Admin)

```http
GET /api/feedback/analytics
```

**Auth**: Required (Admin)

**Query Parameters**:
- `range`: `7d`, `30d`, `90d`, `all` (default: `30d`)

**Response** (200 OK):
```json
{
  "totalFeedback": 150,
  "averageRating": 4.3,
  "npsScore": 45,
  "wouldRecommendPercent": 85,
  "aspectRatings": {
    "orderingProcess": 4.5,
    "productQuality": 4.2,
    "deliverySpeed": 4.0,
    "communication": 4.4
  },
  "ratingDistribution": [
    {"rating": 5, "count": 80},
    {"rating": 4, "count": 40},
    {"rating": 3, "count": 20},
    {"rating": 2, "count": 7},
    {"rating": 1, "count": 3}
  ],
  "trendData": [
    {"date": "2024-01-01", "rating": 4.2, "count": 10},
    {"date": "2024-01-02", "rating": 4.5, "count": 12}
  ],
  "topIssues": [
    {"issue": "Delivery delays", "count": 15},
    {"issue": "Product quality", "count": 8}
  ],
  "recentFeedback": [...]
}
```

**NPS Calculation**:
- Promoters (rating 5): +1
- Passives (rating 4): 0
- Detractors (rating 1-3): -1
- Score = ((Promoters - Detractors) / Total) × 100

---

### Get All Feedback (Admin)

```http
GET /api/feedback/all
```

**Auth**: Required (Admin)

**Response** (200 OK): Array of all feedback submissions

---

### Respond to Feedback (Admin)

```http
POST /api/feedback/:id/respond
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "response": "Thank you for your feedback! We're working on improving our delivery speed."
}
```

**Response** (200 OK): Updated feedback object

**Side Effect**: Client notification created

---

### Get All Issues (Admin)

```http
GET /api/feedback/issues
```

**Auth**: Required (Admin)

**Response** (200 OK): Array of all issue reports

---

### Update Issue Status (Admin)

```http
PATCH /api/feedback/issues/:id/status
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "status": "in_progress"
}
```

**Status Values**: `open`, `in_progress`, `resolved`, `closed`

**Response** (200 OK): Updated issue object

**Side Effect**: If status = `resolved` or `closed`, sets `resolvedAt` timestamp and notifies client

---

### Update Issue Priority (Admin)

```http
PATCH /api/feedback/issues/:id/priority
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "priority": "high"
}
```

**Priority Values**: `low`, `medium`, `high`, `critical`

---

## Templates & Documents

### Get Templates (Admin)

```http
GET /api/admin/templates
```

**Auth**: Required (Admin)

**Query Parameters**:
- `category`: Filter by category (optional)

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "nameEn": "Standard Price Offer",
    "nameAr": "عرض السعر القياسي",
    "category": "price_offer",
    "language": "both",
    "isActive": true,
    "createdAt": "2023-12-01T00:00:00Z"
  }
]
```

---

### Get Template Details (Admin)

```http
GET /api/admin/templates/:id
```

**Auth**: Required (Admin)

**Response** (200 OK): Full template object with sections, variables, styles

---

### Create Template (Admin)

```http
POST /api/admin/templates
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "nameEn": "Custom Invoice Template",
  "nameAr": "قالب فاتورة مخصص",
  "descriptionEn": "Invoice template with company branding",
  "descriptionAr": "قالب فاتورة مع العلامة التجارية للشركة",
  "category": "invoice",
  "language": "both",
  "sections": [...],
  "variables": [...],
  "styles": {...},
  "isActive": false
}
```

**Categories**: `price_offer`, `order`, `invoice`, `contract`, `report`, `other`

**Languages**: `en`, `ar`, `both`

---

### Update Template (Admin)

```http
PUT /api/admin/templates/:id
```

**Auth**: Required (Admin)

---

### Delete Template (Admin)

```http
DELETE /api/admin/templates/:id
```

**Auth**: Required (Admin)

---

### Toggle Template Active (Admin)

```http
PATCH /api/admin/templates/:id/active
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "isActive": true
}
```

**Business Rule**: Only ONE template per category can be active at a time. Setting a template to active automatically deactivates others in the same category.

---

### Get Documents (Admin)

```http
GET /api/admin/documents
```

**Auth**: Required (Admin)

**Response** (200 OK): Array of all generated documents

---

### Download Document

```http
GET /api/documents/:id/download
```

**Auth**: Required

**Response** (200 OK):
- Content-Type: `application/pdf`
- PDF file download

**Side Effect**: Increments `viewCount` and updates `lastViewedAt`

---

## Notifications

### Get Notifications

```http
GET /api/notifications
```

**Auth**: Required

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "type": "order",
    "titleEn": "Order Status Updated",
    "titleAr": "تم تحديث حالة الطلب",
    "messageEn": "Your order #12345 has been shipped",
    "messageAr": "تم شحن طلبك #12345",
    "isRead": false,
    "metadata": "{\"orderId\": \"uuid\"}",
    "createdAt": "2024-01-15T14:30:00Z"
  }
]
```

---

### Mark Notification as Read

```http
PATCH /api/notifications/:id/read
```

**Auth**: Required

**Response** (200 OK): Updated notification

---

### Mark All Notifications as Read

```http
POST /api/notifications/read-all
```

**Auth**: Required

---

## Demo Requests

### Submit Demo Request (Public)

```http
POST /api/demo-request
```

**Auth**: None (Public)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+966XXXXXXXXX",
  "company": "ABC Corporation",
  "message": "Interested in a demo for our procurement team"
}
```

**Validation**:
- All fields required except `message`

**Response** (201 Created):
```json
{
  "id": 1,
  "message": "Demo request submitted successfully",
  "messageAr": "تم إرسال طلب العرض التوضيحي بنجاح"
}
```

---

### Get Demo Requests (Admin)

```http
GET /api/admin/demo-requests
```

**Auth**: Required (Admin)

---

### Update Demo Request Status (Admin)

```http
PATCH /api/admin/demo-requests/:id
```

**Auth**: Required (Admin)

**Request Body**:
```json
{
  "status": "contacted",
  "notes": "Called and scheduled demo for next week"
}
```

**Status Values**: `pending`, `contacted`, `scheduled`, `completed`, `cancelled`

---

## Error Logs

### Get Error Logs (Admin)

```http
GET /api/admin/error-logs
```

**Auth**: Required (Admin)

**Query Parameters**:
- `level`: Filter by level (`error`, `warning`, `info`)
- `limit`: Max number of logs to return (default 50)

**Response** (200 OK): Array of error logs with stack traces, timestamps, user info

---

### Get Error Stats (Admin)

```http
GET /api/admin/error-logs/stats
```

**Auth**: Required (Admin)

**Response** (200 OK):
```json
{
  "totalErrors": 150,
  "errorsByLevel": {
    "error": 50,
    "warning": 80,
    "info": 20
  },
  "recentErrors": 15
}
```

---

### Clear Old Logs (Admin)

```http
DELETE /api/admin/error-logs/clear
```

**Auth**: Required (Admin)

**Query Parameters**:
- `daysToKeep`: Keep logs from last X days (default 30)

**Response** (200 OK):
```json
{
  "message": "Cleared 45 old error logs",
  "messageAr": "تم مسح 45 سجل خطأ قديم"
}
```

---

## Error Responses

All API endpoints follow consistent error response format:

**400 Bad Request** - Validation Error:
```json
{
  "message": "Validation error: nameEn is required",
  "messageAr": "خطأ في التحقق: nameEn مطلوب"
}
```

**401 Unauthorized** - Not authenticated:
```json
{
  "message": "Authentication required",
  "messageAr": "المصادقة مطلوبة"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "message": "Admin access required",
  "messageAr": "مطلوب وصول المسؤول"
}
```

**404 Not Found** - Resource not found:
```json
{
  "message": "Order not found",
  "messageAr": "الطلب غير موجود"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "message": "Internal server error",
  "messageAr": "خطأ في الخادم الداخلي"
}
```

---

## Rate Limiting

**Current Implementation**: None

**Future Consideration**: Add rate limiting middleware to prevent abuse

---

## API Versioning

**Current Version**: No versioning (single version)

**Future Strategy**: URL-based versioning (`/api/v2/...`) when breaking changes are needed

---

## Pagination

**Current Implementation**: No pagination

**Note**: All list endpoints return full results. For large datasets, consider implementing cursor or offset-based pagination.

---

## Summary

This API documentation covers:
- ✅ **63+ endpoints** across 15 feature areas
- ✅ **RESTful design** with proper HTTP methods
- ✅ **Session-based authentication** (30-day cookies)
- ✅ **Role-based access control** (Admin vs Client)
- ✅ **Bilingual error messages** (English/Arabic)
- ✅ **Comprehensive validation** with Zod schemas
- ✅ **File uploads** (images, documents, CSV)
- ✅ **PDF generation** (price offers with Arabic support)
- ✅ **Webhook integration** (Pipefy)
- ✅ **Real-time notifications** (in-app)

All endpoints follow consistent patterns for maintainability and developer experience.
