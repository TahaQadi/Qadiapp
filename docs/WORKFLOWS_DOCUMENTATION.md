# LTA Application - Workflows Documentation

## Table of Contents

1. [Authentication Workflows](#authentication-workflows)
2. [LTA Management Workflows](#lta-management-workflows)
3. [Order Fulfillment Workflows](#order-fulfillment-workflows)
4. [Price Management Workflows](#price-management-workflows)
5. [Feedback & Issue Workflows](#feedback--issue-workflows)
6. [Order Modification Workflows](#order-modification-workflows)
7. [Document Management Workflows](#document-management-workflows)

---

## Authentication Workflows

### 1. User Login Flow

```mermaid
graph TD
    A[User visits /login] --> B[Enter username/password]
    B --> C[Submit credentials]
    C --> D{Valid credentials?}
    D -->|No| E[Show error message]
    E --> B
    D -->|Yes| F{Is admin?}
    F -->|Yes| G[Redirect to /admin]
    F -->|No| H[Redirect to /ordering]
    G --> I[Create 30-day session]
    H --> I
    I --> J[Set HTTP-only session cookie]
```

**Steps**:
1. User navigates to `/login`
2. Frontend displays login form
3. User enters username and password
4. Frontend POSTs to `/api/auth/login`
5. Backend validates credentials with Passport.js
6. Backend checks password hash (scrypt)
7. If valid:
   - Create session in PostgreSQL
   - Set secure HTTP-only cookie (30-day expiry)
   - Return user object with `isAdmin` flag
8. Frontend redirects based on role:
   - Admin → `/admin` dashboard
   - Client → `/ordering` page

**Session Details**:
- **Storage**: PostgreSQL via connect-pg-simple
- **Cookie Name**: `connect.sid`
- **Max Age**: 30 days
- **Security**: HTTP-only, secure flag in production

---

### 2. Password Reset Flow

```mermaid
graph TD
    A[User clicks 'Forgot Password'] --> B[Enter email]
    B --> C[Submit email]
    C --> D[Backend generates reset token]
    D --> E[Token stored in DB with expiry]
    E --> F[Email sent with reset link]
    F --> G[User clicks link]
    G --> H[Enter new password]
    H --> I{Token valid?}
    I -->|No| J[Show error - expired/invalid]
    I -->|Yes| K[Hash new password]
    K --> L[Update user password]
    L --> M[Delete reset token]
    M --> N[Redirect to login]
```

**Steps**:
1. User clicks "Forgot Password" on login page
2. User enters email address
3. Backend generates random token
4. Token stored in `password_reset_tokens` table with 1-hour expiry
5. Email sent to user (implementation varies)
6. User clicks reset link: `/reset-password?token=xxx`
7. User enters new password
8. Backend validates token (exists and not expired)
9. Password hashed with scrypt
10. User password updated
11. Token deleted from database
12. User redirected to login

---

### 3. Session Validation Flow

```mermaid
graph TD
    A[Client makes API request] --> B{Session cookie present?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D[Load session from PostgreSQL]
    D --> E{Session exists & valid?}
    E -->|No| C
    E -->|Yes| F{Route requires admin?}
    F -->|Yes| G{User is admin?}
    G -->|No| H[Return 403 Forbidden]
    G -->|Yes| I[Attach user to request]
    F -->|No| I
    I --> J[Process request]
```

**Middleware Chain**:
1. `requireAuth` - Checks if user is logged in
2. `requireAdmin` - Checks if user has admin privileges

**Protected Routes**:
- All `/api/client/*` routes → require authentication
- All `/api/admin/*` routes → require admin + authentication

---

## LTA Management Workflows

### 1. Create LTA with Product & Client Assignments

```mermaid
graph TD
    A[Admin navigates to /admin/ltas] --> B[Click 'Create New LTA']
    B --> C[Fill LTA form]
    C --> D[Submit: Name, Description, Dates, Status]
    D --> E[POST /api/admin/ltas]
    E --> F[Validate data with Zod]
    F --> G[Insert into ltas table]
    G --> H[Redirect to /admin/ltas/:id]
    H --> I[Admin assigns products]
    I --> J{Bulk import or individual?}
    J -->|Individual| K[Select product, enter price]
    J -->|Bulk| L[Upload CSV with SKU + prices]
    K --> M[POST /api/admin/ltas/:id/products]
    L --> M
    M --> N[Insert into lta_products table]
    N --> O[Admin assigns clients]
    O --> P[Select clients from list]
    P --> Q[POST /api/admin/ltas/:id/clients]
    Q --> R[Insert into lta_clients table]
    R --> S[LTA fully configured]
```

**Database Changes**:
1. `ltas` table - New LTA record
2. `lta_products` table - Product assignments with contract pricing
3. `lta_clients` table - Client access grants

**Constraints**:
- `lta_products` has UNIQUE constraint on (ltaId, productId) - can't assign same product twice
- `lta_clients` has UNIQUE constraint on (ltaId, clientId) - can't assign same client twice

---

### 2. Bulk Product Assignment via CSV

```mermaid
graph TD
    A[Admin on LTA detail page] --> B[Click 'Bulk Assign Products']
    B --> C[Upload CSV file]
    C --> D[Frontend reads CSV]
    D --> E{Valid format?}
    E -->|No| F[Show validation errors]
    E -->|Yes| G[Parse rows: SKU, Price]
    G --> H[POST /api/admin/ltas/:id/products/bulk]
    H --> I[Backend validates each row]
    I --> J{All valid?}
    J -->|No| K[Return errors with line numbers]
    J -->|Yes| L[Begin transaction]
    L --> M[For each row: Insert or update lta_products]
    M --> N[Commit transaction]
    N --> O[Return success count]
    O --> P[Refresh product list]
```

**CSV Format**:
```csv
SKU,Contract Price
PROD-001,29.99
PROD-002,149.50
```

**Validation**:
- SKU must exist in products table
- Price must be valid decimal number
- Price must be positive

---

## Order Fulfillment Workflows

### 1. Complete Order Placement Flow

```mermaid
graph TD
    A[Client logs in] --> B[Navigate to /ordering]
    B --> C[View products from assigned LTAs]
    C --> D[Click product to add to cart]
    D --> E{Product from different LTA?}
    E -->|Yes| F[Show warning: 'Cart cleared - single LTA only']
    F --> G[Clear cart]
    G --> H[Add product to cart]
    E -->|No| H
    H --> I[Update cart in local storage]
    I --> J[Client reviews cart]
    J --> K[Click 'Place Order']
    K --> L[Select department & location]
    L --> M[POST /api/client/orders]
    M --> N[Backend validates]
    N --> O{Valid?}
    O -->|No| P[Return error]
    O -->|Yes| Q[Verify client has LTA access]
    Q --> R{Has access?}
    R -->|No| P
    R -->|Yes| S[Verify contract pricing]
    S --> T{Prices match?}
    T -->|No| P
    T -->|Yes| U[Create order in DB]
    U --> V[Generate order ID]
    V --> W[Send webhook to Pipefy]
    W --> X{Pipefy success?}
    X -->|Yes| Y[Update order.pipefyCardId]
    X -->|No| Z[Log error - continue anyway]
    Y --> AA[Notify admins]
    Z --> AA
    AA --> AB[Return order confirmation]
    AB --> AC[Clear cart]
    AC --> AD[Redirect to /orders]
```

**Critical Validations**:
1. **Single-LTA Rule**: All cart items must belong to same LTA
2. **Client Authorization**: Client must be assigned to the LTA
3. **Price Verification**: Order prices must match `lta_products.contract_price`
4. **Stock Availability**: (if implemented) - currently not enforced

**Database Changes**:
1. `orders` table - New order record
2. `notifications` table - Admin notification created

**External Integration**:
- Pipefy webhook receives order data (non-blocking)

---

### 2. Order Status Update Flow

```mermaid
graph TD
    A[Admin views order in /admin/orders] --> B[Click 'Update Status']
    B --> C[Select new status]
    C --> D{Valid transition?}
    D -->|No| E[Show error]
    D -->|Yes| F[PATCH /api/admin/orders/:id/status]
    F --> G[Update orders.status]
    G --> H[Update orders.updatedAt]
    H --> I[Insert into order_history]
    I --> J{Status = 'delivered'?}
    J -->|Yes| K[Schedule feedback notification]
    K --> L[After 1 hour: Notify client]
    J -->|No| M[Notify client immediately]
    L --> N[Client sees status update]
    M --> N
```

**Status Transitions**:
```
pending → confirmed → processing → shipped → delivered
         ↘ cancelled
```

**Special Cases**:
- **Delivered**: Triggers feedback notification 1 hour later
- **Cancelled**: Requires cancellation reason

---

### 3. Reorder from Order History

```mermaid
graph TD
    A[Client views /orders] --> B[Click 'Reorder' on past order]
    B --> C[Frontend extracts order items]
    C --> D{All items still in LTA?}
    D -->|No| E[Show warning: Some items unavailable]
    D -->|Yes| F[Get current contract prices]
    F --> G{Prices changed?}
    G -->|Yes| H[Show notification: Updated prices]
    G -->|No| I[Load items into cart]
    H --> I
    I --> J[Redirect to /ordering]
    J --> K[Client reviews cart]
    K --> L[Place new order]
```

**Price Update**: Reorders always use CURRENT contract pricing, not historical pricing

---

## Price Management Workflows

### 1. Price Request & Offer Flow

```mermaid
graph TD
    A[Client navigates to /price-request] --> B[Select LTA]
    B --> C[Select products needing quotes]
    C --> D[Enter quantities for each product]
    D --> E[Add optional notes]
    E --> F[Submit request]
    F --> G[POST /api/price-requests]
    G --> H[Generate request number: PR-timestamp-####]
    H --> I[Insert into price_requests table]
    I --> J[Notify ALL admins]
    J --> K[Notify client: Request submitted]
    K --> L[Admin views /admin/price-requests]
    L --> M[Admin clicks 'Create Offer from Request']
    M --> N[Form pre-filled with request data]
    N --> O[Admin adjusts prices/adds tax]
    O --> P[Admin sets validity date]
    P --> Q[POST /api/admin/price-offers]
    Q --> R[Generate offer number: PO-timestamp-####]
    R --> S[Insert into price_offers table]
    S --> T[Status = 'draft']
    T --> U[Admin clicks 'Send Offer']
    U --> V[POST /api/admin/price-offers/:id/send]
    V --> W[Load active price_offer template]
    W --> X[Generate PDF with PDFKit]
    X --> Y[Apply Arabic text reshaping]
    Y --> Z[Save PDF to Object Storage]
    Z --> AA[Update offer.pdfPath]
    AA --> AB[Update offer.status = 'sent']
    AB --> AC[Notify client: New offer available]
    AC --> AD[Client views /price-offers]
    AD --> AE[Click offer to view details]
    AE --> AF{Auto-mark as viewed}
    AF --> AG[Update offer.status = 'viewed']
    AG --> AH[Client clicks 'Accept' or 'Reject']
    AH --> AI[POST /api/price-offers/:id/respond]
    AI --> AJ{Response type?}
    AJ -->|Accept| AK[Update offer.status = 'accepted']
    AJ -->|Reject| AL[Update offer.status = 'rejected']
    AK --> AM[Notify admins: Offer accepted]
    AL --> AN[Notify admins: Offer rejected]
    AM --> AO[Client can now place order]
```

**Key Points**:
- Request number format: `PR-{timestamp}-{count}`
- Offer number format: `PO-{timestamp}-{count}`
- PDF generation uses active `price_offer` template
- Offers have validity period - cannot respond after expiry

---

### 2. PDF Generation for Price Offers

```mermaid
graph TD
    A[Admin clicks 'Send Offer'] --> B[Backend retrieves offer data]
    B --> C[Load active price_offer template]
    C --> D{Template exists?}
    D -->|No| E[Return error: No active template]
    D -->|Yes| F[Prepare template variables]
    F --> G[offerNumber, clientName, items, etc.]
    G --> H[Initialize PDFKit document]
    H --> I[Apply template styles]
    I --> J{Language = 'ar'?}
    J -->|Yes| K[Use arabic-reshaper for text]
    K --> L[Apply bidi-js for RTL]
    J -->|No| M[Standard LTR rendering]
    L --> N[Render template sections]
    M --> N
    N --> O[Header, Body, Items Table, Footer]
    O --> P[Generate PDF buffer]
    P --> Q[Upload to Object Storage]
    Q --> R[Get public URL]
    R --> S[Save URL to offer.pdfPath]
    S --> T[Return success]
```

**Template Variables**:
```javascript
{
  offerNumber: "PO-1234567890-0001",
  offerDate: "2024-01-15",
  clientNameEn: "ABC Company",
  clientNameAr: "شركة ABC",
  ltaNameEn: "2024 Supply Agreement",
  items: [{sku, name, quantity, price}],
  subtotal: "1000.00",
  tax: "150.00",
  total: "1150.00",
  validUntil: "2024-02-15",
  companyNameEn: "Al Qadi Trading Company"
}
```

---

## Feedback & Issue Workflows

### 1. Order Feedback Submission Flow

```mermaid
graph TD
    A[Order marked as 'delivered'] --> B[Wait 1 hour]
    B --> C[Create notification for client]
    C --> D[Client sees notification]
    D --> E[Client navigates to /orders]
    E --> F[Client sees 'Submit Feedback' button]
    F --> G{Already submitted?}
    G -->|Yes| H[Button disabled/hidden]
    G -->|No| I[Click 'Submit Feedback']
    I --> J[Open feedback dialog]
    J --> K[Rate overall experience: 1-5 stars]
    K --> L[Rate aspects: Ordering, Quality, Delivery, Communication]
    L --> M[Write comments optional]
    M --> N[Select: Would recommend? Yes/No]
    N --> O[Click 'Submit']
    O --> P[POST /api/feedback/order/:orderId]
    P --> Q[Validate: Order belongs to client]
    Q --> R{Valid?}
    R -->|No| S[Return 403 error]
    R -->|Yes| T[Insert into order_feedback table]
    T --> U[Calculate NPS category: Promoter/Passive/Detractor]
    U --> V[Update analytics cache]
    V --> W[Notify admins: New feedback received]
    W --> X[Return success]
    X --> Y[Close dialog]
    Y --> Z[Refresh order list]
    Z --> AA['Submit Feedback' button now disabled]
```

**Critical Points**:
- **Trigger**: 1 hour after delivery (3600000ms)
- **One-time**: Can only submit once per order
- **Separate from Issues**: Completely different button and dialog
- **NPS Calculation**:
  - Rating 5 = Promoter
  - Rating 4 = Passive
  - Rating 1-3 = Detractor

**Database Fields**:
```typescript
{
  orderId: string;
  clientId: string;
  rating: number; // 1-5
  orderingProcessRating: number; // 1-5
  productQualityRating: number; // 1-5
  deliverySpeedRating: number; // 1-5
  communicationRating: number; // 1-5
  comments: string | null;
  wouldRecommend: boolean;
}
```

---

### 2. Issue Reporting Flow (Separate from Feedback)

```mermaid
graph TD
    A[Client on /orders page] --> B[Click 'Report Issue' button]
    B --> C[Open issue report dialog]
    C --> D[Select issue type: Bug/Feature/Performance/etc.]
    D --> E[Select severity: Low/Medium/High/Critical]
    E --> F[Enter title]
    F --> G[Enter detailed description]
    G --> H[Enter steps to reproduce]
    H --> I[Enter expected behavior]
    I --> J[Enter actual behavior]
    J --> K{Want to add screenshots?}
    K -->|Yes| L[Upload images]
    K -->|No| M[Auto-capture browser info]
    L --> M
    M --> N[Auto-capture screen size]
    N --> O[Click 'Submit']
    O --> P[POST /api/feedback/issue]
    P --> Q[Insert into issue_reports table]
    Q --> R[Notify ALL admins regardless of severity]
    R --> S[Return success]
    S --> T[Close dialog]
    T --> U[Show success message]
    U --> V[Admin receives notification]
    V --> W[Admin navigates to /admin/issue-reports]
    W --> X[Admin clicks issue to view details]
    X --> Y[Admin updates status: open→in_progress→resolved→closed]
    Y --> Z[PATCH /api/feedback/issues/:id/status]
    Z --> AA[Update issue_reports.status]
    AA --> AB{Status changed to resolved/closed?}
    AB -->|Yes| AC[Set resolvedAt timestamp]
    AB -->|No| AD[Notify client of status change]
    AC --> AD
```

**Critical Points**:
- **Always Available**: Can report issue for ANY order status
- **Separate from Feedback**: Different button, different dialog
- **All Admins Notified**: Every issue triggers notifications to ALL admins
- **No Severity Filter**: High-priority and low-priority issues BOTH notify admins

**Issue Types**:
- Bug
- Feature Request
- Performance Issue
- Usability Problem
- Content Issue
- Other

**Severity Levels**:
- Low: Minor inconvenience
- Medium: Affects workflow
- High: Major blocker
- Critical: System down

---

### 3. Admin Response to Feedback

```mermaid
graph TD
    A[Admin views /admin/feedback] --> B[Switch to 'Ratings' tab]
    B --> C[View feedback list]
    C --> D[Click feedback to expand]
    D --> E[Read client comments]
    E --> F[Enter admin response]
    F --> G[Click 'Submit Response']
    G --> H[POST /api/feedback/:id/respond]
    H --> I[Update order_feedback table]
    I --> J[Set adminResponse, adminResponseAt, respondedBy]
    J --> K[Notify client: Admin responded]
    K --> L[Client views response in feedback history]
```

**Response Tracking**:
- `adminResponse`: Text of response
- `adminResponseAt`: Timestamp
- `respondedBy`: Admin client ID

---

## Order Modification Workflows

### 1. Client Request Order Modification

```mermaid
graph TD
    A[Client views order in /orders] --> B{Order status allows modification?}
    B -->|No - already shipped/delivered| C[Hide modification button]
    B -->|Yes - pending/confirmed/processing| D[Show 'Request Modification' button]
    D --> E[Click button]
    E --> F[Open modification dialog]
    F --> G{Type of modification?}
    G -->|Cancel entire order| H[Select 'Cancel Order']
    G -->|Change items| I[Select 'Modify Items']
    H --> J[Enter cancellation reason]
    I --> K[Adjust quantities or add/remove items]
    K --> L[System calculates new total]
    L --> M[Enter modification reason]
    J --> N[Click 'Submit Request']
    M --> N
    N --> O[POST /api/order-modifications]
    O --> P[Insert into order_modifications table]
    P --> Q[Update order.status = 'modification_requested']
    Q --> R[Notify admins: New modification request]
    R --> S[Return success]
    S --> T[Show 'Request Pending' badge on order]
```

**Modification Types**:
- `items`: Change order items/quantities
- `cancel`: Cancel entire order
- `both`: Combination (rarely used)

**Allowed Statuses**:
- pending
- confirmed  
- processing

**Not Allowed**:
- shipped (too late)
- delivered (completed)
- cancelled (already done)

---

### 2. Admin Review Modification Request

```mermaid
graph TD
    A[Admin receives notification] --> B[Navigate to /admin/order-modifications]
    B --> C[View modification requests]
    C --> D[Filter: Pending requests]
    D --> E[Click request to view details]
    E --> F[Review: Original vs Requested items]
    F --> G[Review client's reason]
    G --> H{Decision?}
    H -->|Approve| I[Enter approval notes optional]
    H -->|Reject| J[Enter rejection reason required]
    I --> K[Click 'Approve']
    J --> L[Click 'Reject']
    K --> M[POST /api/admin/order-modifications/:id/review]
    L --> M
    M --> N[Update orderModifications.status]
    N --> O[Set adminResponse, reviewedBy, reviewedAt]
    O --> P{Approved?}
    P -->|Yes| Q[Update order with new items/total]
    P -->|No| R[Restore order.status to previous]
    Q --> S[Notify client: Modification approved]
    R --> T[Notify client: Modification rejected]
    S --> U[Client can see admin response]
    T --> U
```

**Admin Response Fields**:
- `status`: 'approved' or 'rejected'
- `adminResponse`: Explanation from admin
- `reviewedBy`: Admin client ID
- `reviewedAt`: Timestamp

**If Approved**:
- Order items updated to `newItems`
- Order total updated to `newTotalAmount`
- Order status changes based on modification type

**If Rejected**:
- Order remains unchanged
- Client can see rejection reason

---

## Document Management Workflows

### 1. Upload LTA Document

```mermaid
graph TD
    A[Admin on LTA detail page] --> B[Navigate to 'Documents' tab]
    B --> C[Click 'Upload Document']
    C --> D[Select PDF file]
    D --> E{Valid file?}
    E -->|No - wrong type/too large| F[Show error]
    E -->|Yes| G[Upload file]
    G --> H[POST /api/admin/ltas/:id/documents]
    H --> I[Multer processes multipart form]
    I --> J[Validate: PDF, max 10MB]
    J --> K[Upload to Object Storage]
    K --> L[Generate unique filename]
    L --> M[Get public URL]
    M --> N[Insert into lta_documents table]
    N --> O[Save: ltaId, filename, url, size]
    O --> P[Return document metadata]
    P --> Q[Display in documents list]
```

**File Validation**:
- **Allowed Types**: `application/pdf`
- **Max Size**: 10MB
- **Storage**: Replit Object Storage

---

### 2. Template-Based PDF Generation

```mermaid
graph TD
    A[System needs to generate PDF] --> B[Determine document type]
    B --> C{Type?}
    C -->|Price Offer| D[Load price_offer template]
    C -->|Order| E[Load order template]
    C -->|Invoice| F[Load invoice template]
    C -->|Contract| G[Load contract template]
    D --> H[Get active template for category]
    E --> H
    F --> H
    G --> H
    H --> I{Template found?}
    I -->|No| J[Return error]
    I -->|Yes| K[Prepare template variables]
    K --> L[Load template.sections]
    L --> M[Initialize PDFKit]
    M --> N{Language?}
    N -->|Arabic| O[Use arabic-reshaper]
    N -->|English| P[Standard rendering]
    O --> Q[Apply bidi-js for RTL]
    Q --> R[Render sections in order]
    P --> R
    R --> S[Apply template.styles]
    S --> T[Header section]
    T --> U[Body sections]
    U --> V[Table sections]
    V --> W[Footer section]
    W --> X[Finalize PDF]
    X --> Y[Upload to Object Storage]
    Y --> Z[Return URL]
```

**Template Section Types**:
- `header`: Top of document (logo, title)
- `body`: Main content
- `table`: Tabular data (items, pricing)
- `footer`: Bottom content (signatures, terms)
- `text`: Free text
- `image`: Embedded images

**Template Variables** (examples):
```javascript
{
  documentNumber: "PO-xxx",
  date: "2024-01-15",
  clientName: "ABC Company",
  items: [{name, quantity, price}],
  total: "1000.00",
  ...custom variables
}
```

---

### 3. Template Management Flow

```mermaid
graph TD
    A[Admin navigates to /admin/templates/documents] --> B[View template list]
    B --> C{Action?}
    C -->|Create New| D[Click 'Create Template']
    C -->|Edit| E[Click template to edit]
    C -->|Duplicate| F[Click 'Duplicate']
    C -->|Delete| G[Click 'Delete']
    C -->|Toggle Active| H[Click active switch]
    D --> I[Fill template form]
    E --> I
    I --> J[Name, Category, Language]
    J --> K[Define sections array]
    K --> L[Define variables array]
    L --> M[Define styles object]
    M --> N[Preview template]
    N --> O{Looks good?}
    O -->|No| I
    O -->|Yes| P[Save template]
    P --> Q[POST /api/admin/templates]
    Q --> R[Insert into templates table]
    R --> S[Set isActive flag]
    S --> T[Return to list]
    H --> U[PATCH /api/admin/templates/:id/active]
    U --> V{Setting to active?}
    V -->|Yes| W[Deactivate other templates in same category]
    V -->|No| X[Just update this template]
    W --> Y[Update templates table]
    X --> Y
```

**Template Categories**:
- `price_offer` - Price quotations
- `order` - Order confirmations
- `invoice` - Invoices
- `contract` - LTA contracts
- `report` - Various reports
- `other` - Custom templates

**Active Template Rule**: Only ONE template per category can be active at a time

---

## Integration Workflows

### 1. Pipefy Order Webhook

```mermaid
graph TD
    A[Order created successfully] --> B[Prepare webhook payload]
    B --> C[Include: Order ID, Client, Items, Total]
    C --> D[POST to Pipefy webhook URL]
    D --> E{Success?}
    E -->|Yes| F[Save Pipefy card ID]
    F --> G[Update order.pipefyCardId]
    E -->|No| H[Log error]
    H --> I[Continue anyway - non-blocking]
    G --> J[Order processing continues]
    I --> J
```

**Webhook Payload**:
```javascript
{
  orderId: "uuid",
  clientName: "ABC Company",
  ltaName: "2024 Supply Agreement",
  items: [{sku, name, quantity, price}],
  total: "1000.00",
  department: "Purchasing",
  location: "Main Office"
}
```

**Error Handling**:
- Webhook failures are logged but don't block order creation
- Admin can manually sync to Pipefy if needed

---

### 2. Session Cleanup Workflow

```mermaid
graph TD
    A[Session created/updated] --> B[Store in PostgreSQL sessions table]
    B --> C[Set expire timestamp]
    C --> D[Session used during requests]
    D --> E[Session idle for 30 days]
    E --> F[PostgreSQL automatic cleanup]
    F --> G[connect-pg-simple prune]
    G --> H[Delete expired sessions]
```

**Session Cleanup**:
- Automatic cleanup by connect-pg-simple
- Runs periodically (default: every 15 minutes)
- Deletes sessions where `expire < NOW()`

---

## Data Synchronization Workflows

### 1. Product Price Sync Flow

```mermaid
graph TD
    A[Admin updates LTA product price] --> B[PATCH /api/admin/ltas/:ltaId/products/:productId]
    B --> C[Update lta_products.contract_price]
    C --> D[Invalidate query cache]
    D --> E[Clients see updated price immediately]
    E --> F[New orders use new price]
    F --> G[Existing orders unchanged]
```

**Price Update Scope**:
- Updates affect NEW orders only
- Historical orders keep original pricing
- Cart prices refreshed on page load

---

### 2. LTA Status Change Propagation

```mermaid
graph TD
    A[Admin changes LTA status to inactive] --> B[PATCH /api/admin/ltas/:id]
    B --> C[Update ltas.status = inactive]
    C --> D[Client product lists refresh]
    D --> E{Products from inactive LTA?}
    E -->|Yes| F[Hide from client view]
    E -->|No| G[Continue displaying]
    F --> H{Products in cart from inactive LTA?}
    H -->|Yes| I[Show warning: LTA no longer active]
    H -->|No| J[No action]
```

**Inactive LTA Rules**:
- Products no longer visible to clients
- Cannot add to cart
- Existing carts show warning
- Orders in progress can complete

---

## Notification Workflows

### 1. Notification Creation & Delivery

```mermaid
graph TD
    A[System event occurs] --> B{Event type?}
    B -->|New Order| C[Notify admins]
    B -->|Order Status Change| D[Notify client]
    B -->|New Feedback| C
    B -->|New Issue Report| C
    B -->|Price Request| C
    B -->|Price Offer| D
    C --> E[Get all admin clients]
    D --> F[Get specific client]
    E --> G[Create notification for each admin]
    F --> H[Create notification for client]
    G --> I[INSERT INTO notifications]
    H --> I
    I --> J[Client sees notification badge]
    J --> K[Client clicks notifications]
    K --> L[Fetch unread notifications]
    L --> M[Display list]
    M --> N[Client clicks notification]
    N --> O[Mark as read]
    O --> P[Navigate to relevant page]
```

**Notification Types**:
- `system`: System-generated events
- `order`: Order updates
- `feedback`: Feedback-related
- `price`: Price request/offer updates

---

## Summary

This document covers the major workflows in the LTA application:

- ✅ Authentication (login, password reset, session management)
- ✅ LTA Management (create, assign products/clients)
- ✅ Order Fulfillment (cart, placement, status updates, reordering)
- ✅ Price Management (requests, offers, PDF generation)
- ✅ Feedback & Issues (separate submission flows)
- ✅ Order Modifications (request and review)
- ✅ Document Management (uploads, PDF generation, templates)
- ✅ Integrations (Pipefy webhook)
- ✅ Notifications (creation and delivery)

Each workflow includes:
- Step-by-step process flows
- Decision points and validations
- Database changes
- API endpoints involved
- Special cases and error handling
