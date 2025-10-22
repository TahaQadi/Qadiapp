# LTA Application - Complete Features Documentation

## Table of Contents

1. [Admin Features](#admin-features)
2. [Client Features](#client-features)
3. [Public Features](#public-features)
4. [System Features](#system-features)

---

## Admin Features

### 1. LTA Management

#### 1.1 LTA CRUD Operations
- **Create LTAs**: Define new long-term agreements with bilingual names and descriptions
- **Edit LTAs**: Update contract details, dates, and status
- **Delete LTAs**: Remove contracts (restricted if clients/products are assigned)
- **View LTAs**: List all contracts with filtering and search
- **Status Management**: Activate/deactivate contracts

**Fields**:
- Name (English/Arabic)
- Description (English/Arabic)
- Start Date / End Date
- Status (active/inactive)

**Routes**:
- `/admin/ltas` - List all LTAs
- `/admin/ltas/:id` - LTA detail page

---

#### 1.2 Product Assignment to LTAs
- **Individual Assignment**: Add single products with contract pricing
- **Bulk Assignment**: Import CSV file with product SKUs and prices
- **Price Management**: Update contract prices for assigned products
- **Remove Products**: Unassign products from LTA
- **View Assignments**: See all products assigned to an LTA

**CSV Import Format**:
```csv
SKU,Contract Price
PROD-001,29.99
PROD-002,149.50
```

**Routes**: `/admin/ltas/:id` (Products tab)

---

#### 1.3 Client Assignment to LTAs
- **Assign Clients**: Grant clients access to specific LTAs
- **Bulk Assignment**: Select multiple clients at once
- **Revoke Access**: Remove client assignments
- **View Assignments**: See all clients with access to an LTA

**Routes**: `/admin/ltas/:id` (Clients tab)

---

#### 1.4 LTA Documents
- **Upload Documents**: Attach PDFs, contracts, terms & conditions
- **Download Documents**: Retrieve uploaded files
- **Document Metadata**: Track upload date and file size
- **Delete Documents**: Remove attachments

**Routes**: `/admin/ltas/:id` (Documents tab)

---

### 2. Product Management

#### 2.1 Product CRUD Operations
- **Create Products**: Add new products with bilingual details
- **Edit Products**: Update product information
- **Delete Products**: Remove products from catalog
- **Search Products**: Find products by SKU, name, category
- **Filter Products**: By category, vendor, price range

**Fields**:
- SKU (unique identifier)
- Name (English/Arabic)
- Description (English/Arabic)
- Category, Main Category
- Unit Type, Units per Box
- Cost Price (per box/per piece)
- Selling Price (pack/piece)
- Specifications (Arabic)
- Image(s)
- Vendor

**Routes**: `/admin/products`

---

#### 2.2 Product Image Management
- **Upload Images**: Single or multiple images per product
- **Image Validation**: JPEG, PNG, WEBP only, 5MB max
- **Primary Image**: First image is default display
- **Multiple Images**: Gallery support
- **Delete Images**: Remove product images

**Supported Formats**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

---

#### 2.3 Product Import/Export
- **Bulk Import**: Upload CSV with product data
- **Export to CSV**: Download all products as CSV
- **Field Mapping**: Automatic mapping of CSV columns
- **Validation**: Pre-import data validation
- **Error Reporting**: Display import errors with line numbers

**CSV Format**: Matches database fields (SKU, nameEn, nameAr, category, etc.)

---

### 3. Client Management

#### 3.1 Client CRUD Operations
- **Create Clients**: Add new client companies
- **Edit Clients**: Update client information
- **Delete Clients**: Remove clients (cascades to related data)
- **View Clients**: List all client companies
- **Admin Toggle**: Grant/revoke admin privileges

**Fields**:
- Username (unique login)
- Password (hashed with scrypt)
- Name (English/Arabic)
- Email, Phone
- Admin Status

**Routes**: `/admin/clients`

---

#### 3.2 Company User Management
- **Create Users**: Add multiple users per company
- **Edit Users**: Update user details
- **Deactivate Users**: Soft-delete users (isActive flag)
- **Department Assignment**: Assign to finance, purchase, warehouse
- **Password Management**: Reset user passwords

**Use Case**: Multiple employees from same company need access

---

#### 3.3 Department Management
- **Create Departments**: Finance, Purchase, Warehouse departments
- **Edit Departments**: Update contact information
- **Delete Departments**: Remove department entries
- **Department Contacts**: Name, email, phone per department

---

#### 3.4 Location Management
- **Create Locations**: Add delivery/branch locations
- **Edit Locations**: Update location details
- **Delete Locations**: Remove locations
- **Headquarters Flag**: Mark primary location
- **Geolocation**: Latitude/longitude support

**Fields**:
- Name (English/Arabic)
- Address (English/Arabic)
- City, Country
- Phone
- Coordinates (lat/lng)
- Headquarters flag

---

### 4. Vendor Management

#### 4.1 Vendor CRUD Operations
- **Create Vendors**: Add product suppliers
- **Edit Vendors**: Update vendor information
- **Delete Vendors**: Remove vendors
- **Vendor Assignment**: Link products to vendors

**Fields**:
- Vendor Number (unique)
- Name (English/Arabic)
- Contact Email, Phone
- Address

**Routes**: `/admin/vendors`

---

#### 4.2 Vendor Import/Export
- **Bulk Import**: Upload CSV with vendor data
- **Export to CSV**: Download all vendors

---

### 5. Price Management

#### 5.1 Price Requests (Admin View)
- **View All Requests**: See all client price requests
- **Request Details**: View products and quantities requested
- **Create Offer from Request**: Pre-fill offer form with request data
- **Mark as Processed**: Update request status

**Routes**: `/admin/price-requests`

---

#### 5.2 Price Offers (Admin)
- **Create Draft Offers**: Build quotations with pricing
- **Edit Drafts**: Modify offers before sending
- **Send Offers**: Generate PDF and notify client
- **Track Status**: Draft, Sent, Viewed, Accepted, Rejected, Expired
- **Download PDFs**: Retrieve generated offer documents
- **Delete Drafts**: Remove unsent offers
- **View Responses**: See client acceptance/rejection with notes

**Offer Fields**:
- Client, LTA
- Products with quantities and prices
- Subtotal, Tax, Total
- Valid Until date
- Notes

**PDF Generation**:
- Uses active price_offer template
- Includes company branding
- Bilingual support with Arabic text shaping
- Auto-generated offer number

**Routes**: `/admin/price-offers`

---

#### 5.3 Client Pricing Management
- **Bulk Import**: Upload client-specific pricing via CSV
- **View Pricing**: See custom prices per client
- **Update Pricing**: Modify client-specific rates

**Routes**: `/admin/price-management`

---

### 6. Order Management

#### 6.1 Order Overview
- **View All Orders**: List all client orders
- **Filter Orders**: By status, client, date range, LTA
- **Search Orders**: By order ID, client name
- **Order Details**: View full order information
- **Order History**: Track status changes

**Order Statuses**:
- Pending
- Confirmed
- Processing
- Shipped
- Delivered
- Cancelled
- Modification Requested

**Routes**: `/admin/orders`

---

#### 6.2 Order Status Management
- **Update Status**: Change order status (pending → confirmed → processing → shipped → delivered)
- **Cancellation Handling**: Review cancellation requests
- **Notifications**: Auto-notify clients on status change

---

#### 6.3 Order Export
- **Export to PDF**: Generate order documents
- **Export to CSV**: Download order data
- **Bulk Export**: Export multiple orders

---

#### 6.4 Order Modifications
- **View Modification Requests**: See all client requests to modify/cancel orders
- **Review Requests**: Approve or reject modifications
- **Admin Response**: Add notes explaining decisions
- **Status Tracking**: Pending, Approved, Rejected

**Modification Types**:
- Items modification (add/remove products)
- Cancellation request

**Routes**: `/admin/order-modifications`

---

### 7. Feedback & Analytics

#### 7.1 Customer Feedback Dashboard
- **Analytics Tab**: View aggregated feedback metrics
  - Total feedback count
  - Average overall rating (1-5 stars)
  - NPS Score (Net Promoter Score)
  - Would Recommend percentage
  - Aspect ratings (ordering process, product quality, delivery speed, communication)
  - Rating distribution chart
  - Trend over time chart
  - Top reported issues
  - Recent feedback entries

- **Ratings Tab**: View individual feedback submissions
  - Order details
  - Client name
  - Overall rating and aspect ratings
  - Comments
  - Recommendation status
  - Admin response capability

- **Issues Tab**: Manage issue reports
  - View all reported issues
  - Update status (open → in progress → resolved → closed)
  - Priority levels
  - Issue types categorization

**Time Ranges**: 7 days, 30 days, 90 days, All time

**Routes**: `/admin/feedback`

---

#### 7.2 Admin Responses to Feedback
- **Respond to Feedback**: Add admin comments to customer feedback
- **Response Tracking**: Track who responded and when
- **Client Notification**: Auto-notify clients of responses

---

#### 7.3 Issue Reports Management
- **View All Issues**: List all reported problems
- **Issue Details**: View full issue report with:
  - Title, description
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser information
  - Screenshots
  - Severity level (low, medium, high, critical)
  - Issue type (bug, feature request, performance, etc.)

- **Status Updates**: Change issue status
- **Priority Management**: Set issue priority
- **Client Notifications**: Notify on status changes

**Routes**: `/admin/issue-reports`

---

### 8. Template Management

#### 8.1 Document Templates
- **View Templates**: List all document templates
- **Create Templates**: Define new PDF templates
- **Edit Templates**: Modify template structure
- **Delete Templates**: Remove templates
- **Toggle Active**: Enable/disable templates
- **Duplicate Templates**: Clone existing templates

**Template Categories**:
- Price Offer
- Order
- Invoice
- Contract
- Report
- Other

**Template Components**:
- Sections (header, body, footer, table, text, image)
- Variables (dynamic data placeholders)
- Styles (fonts, colors, spacing)
- Language support (English, Arabic, Both)

**Routes**: `/admin/templates/documents`

---

#### 8.2 Template Preview
- **Live Preview**: See template output with sample data
- **Test PDF Generation**: Generate test PDFs

---

### 9. Document Management

#### 9.1 Document Library
- **View All Documents**: List generated documents
- **Document Metadata**: Track creation date, size, type, status
- **Download Documents**: Retrieve generated PDFs
- **Delete Documents**: Remove documents from storage

**Routes**: `/admin/documents`

---

### 10. Error Logs & Monitoring

#### 10.1 Error Log Viewer
- **View Error Logs**: List application errors
- **Filter by Level**: Error, Warning, Info
- **Set Limits**: Control number of displayed logs
- **Refresh Logs**: Reload log data
- **Clear Old Logs**: Remove logs older than X days
- **Log Details**: Expand to see stack trace, user info, timestamp

**Statistics**:
- Total errors
- Errors by level
- Recent error trends

**Routes**: `/admin/error-logs`

---

### 11. Demo Requests Management

#### 11.1 Demo Request Handling
- **View Requests**: List all demo requests from landing page
- **Mark as Contacted**: Track follow-up status
- **Contact Information**: Name, email, phone, company, message

**Routes**: `/admin/demo-requests`

---

### 12. Reports & Analytics

#### 12.1 Admin Dashboard
- **Key Metrics**: Orders, revenue, clients, products
- **Recent Activity**: Latest orders and feedback
- **Quick Actions**: Navigate to common tasks

**Routes**: `/admin`

---

#### 12.2 Custom Reports
- **Sales Reports**: Revenue by period, client, LTA
- **Product Reports**: Best sellers, inventory status
- **Client Reports**: Order history, spending patterns

**Routes**: `/admin/reports`

---

## Client Features

### 1. Authentication

#### 1.1 Login
- **Username/Password Login**: Standard authentication
- **Session Management**: 30-day persistent sessions
- **Remember Me**: Optional extended sessions

**Routes**: `/login`

---

#### 1.2 Password Management
- **Forgot Password**: Request password reset via email
- **Reset Password**: Set new password with token
- **Change Password**: Update password while logged in

---

### 2. Product Browsing

#### 2.1 Product Catalog
- **View Products**: Browse all products assigned to client's LTAs
- **Product Grid**: Responsive grid layout (1-5 columns based on screen size)
- **Product Cards**: Display image, name, SKU, price, LTA badge
- **Search Products**: Find by name or SKU
- **Filter Products**: By LTA, category
- **Sort Products**: By name, price

**Access Control**: Only see products from assigned LTAs

**Routes**: `/ordering`

---

#### 2.2 Product Details
- **Product Information**: Full details with images
- **Pricing**: Contract-based pricing from LTA
- **Specifications**: Arabic/English descriptions
- **LTA Badge**: Shows which contract product belongs to

**Routes**: `/products/:subCategory/:productName`

---

### 3. Shopping & Ordering

#### 3.1 Shopping Cart
- **Add to Cart**: Add products with quantities
- **Update Quantities**: Modify item quantities
- **Remove Items**: Delete items from cart
- **Single-LTA Enforcement**: Cart cleared if adding from different LTA
- **Cart Persistence**: Saved in browser local storage
- **Price Calculation**: Real-time total calculation

---

#### 3.2 Order Placement
- **Review Order**: See all items and total before submitting
- **Department Selection**: Choose ordering department
- **Location Selection**: Choose delivery location
- **Order Validation**: Verify LTA access and pricing
- **Order Submission**: Create order and send to Pipefy
- **Order Confirmation**: Receive order number and status

**Validation**:
- Client has access to LTA
- All products belong to same LTA
- Prices match contract pricing

---

#### 3.3 Order Templates
- **Create Templates**: Save frequent orders as templates
- **Use Templates**: Quick reorder from template
- **Edit Templates**: Update template items
- **Delete Templates**: Remove saved templates
- **Template Naming**: Bilingual names

**Use Case**: Recurring orders (monthly supplies, etc.)

---

### 4. Order Management

#### 4.1 Order History
- **View All Orders**: List all placed orders
- **Order Details**: Full order information
- **Status Tracking**: See current order status
- **Order Timeline**: View status history
- **Download PDF**: Get order documents

**Routes**: `/orders`

---

#### 4.2 Reordering
- **Reorder Button**: Quick reorder from past orders
- **Cart Population**: Auto-fill cart with previous order items
- **Price Update**: Use current contract pricing

---

#### 4.3 Order Modifications
- **Request Modification**: Ask to change order items
- **Request Cancellation**: Ask to cancel order
- **Provide Reason**: Explain modification request
- **Track Request Status**: See if approved/rejected
- **View Admin Response**: Read admin feedback

**Allowed When**: Order not yet shipped

---

### 5. Feedback & Issue Reporting

#### 5.1 Order Feedback Submission
- **Trigger**: 1 hour after order marked as delivered
- **Overall Rating**: 1-5 stars
- **Aspect Ratings**: Rate ordering process, product quality, delivery speed, communication
- **Comments**: Free text feedback
- **Recommendation**: Would you recommend? (Yes/No)
- **Submission**: One-time per order

**Critical**: Completely separate from issue reporting

**Access**: Separate "Submit Feedback" button in order history

---

#### 5.2 Issue Reporting
- **Trigger**: Available for ANY order status
- **Issue Type**: Bug, feature request, performance, usability, content, other
- **Severity**: Low, medium, high, critical
- **Title**: Short issue description
- **Description**: Detailed explanation
- **Steps to Reproduce**: How to trigger the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Browser Info**: Auto-captured user agent
- **Screen Size**: Auto-captured dimensions
- **Screenshots**: Optional image uploads
- **Order Context**: Linked to specific order (optional)

**Critical**: Completely separate from feedback submission

**Access**: Separate "Report Issue" button in order history

**Admin Notification**: ALL admins notified for EVERY issue report regardless of severity

---

#### 5.3 View Own Feedback
- **Feedback History**: See all submitted feedback
- **Admin Responses**: Read responses from admins

---

### 6. Price Requests

#### 6.1 Request Price Quote
- **Select LTA**: Choose contract
- **Select Products**: Pick products needing quotes
- **Specify Quantities**: Enter quantities needed
- **Add Notes**: Additional information or requirements
- **Submit Request**: Send to admin for quotation

**Routes**: `/price-request`

---

#### 6.2 View Price Requests
- **Request History**: See all submitted requests
- **Request Status**: Pending or Processed
- **Request Details**: View products and quantities

---

### 7. Price Offers

#### 7.1 View Price Offers
- **Offer List**: See all received offers
- **Offer Details**: View complete quotation
- **Auto-mark as Viewed**: Status updates when opened
- **Download PDF**: Get offer document
- **Offer Status**: Draft, Sent, Viewed, Accepted, Rejected, Expired

**Routes**: `/price-offers`

---

#### 7.2 Respond to Price Offers
- **Accept Offer**: Approve quotation
- **Reject Offer**: Decline quotation
- **Add Note**: Explain response
- **Expiry Check**: Cannot respond to expired offers

---

### 8. Profile Management

#### 8.1 Update Profile
- **Edit Information**: Update name, email, phone
- **Bilingual Names**: English and Arabic names

**Routes**: `/profile`

---

#### 8.2 Department Management
- **Add Departments**: Create department entries
- **Edit Departments**: Update department info
- **Delete Departments**: Remove departments
- **Department Types**: Finance, Purchase, Warehouse

---

#### 8.3 Location Management
- **Add Locations**: Create delivery locations
- **Edit Locations**: Update location details
- **Delete Locations**: Remove locations
- **Mark Headquarters**: Designate primary location

---

## Public Features

### 1. Landing Page
- **Public Catalog**: Browse products without login
- **Product Categories**: Navigate by category
- **Product Details**: View product information
- **Demo Request Form**: Request business demo
- **SEO Optimized**: Meta tags, structured data

**Routes**: `/landing`, `/catalog`, `/catalog/:category`, `/products/:subCategory/:productName`

---

### 2. Product Details (Public)
- **View Products**: See product information without pricing
- **Product Images**: Gallery view
- **Specifications**: Full product details
- **Call-to-Action**: Login to see pricing

---

### 3. Onboarding
- **Account Setup**: Initial client setup wizard
- **Profile Configuration**: Set up company profile
- **Department/Location Setup**: Initial configuration

**Routes**: `/onboarding`

---

## System Features

### 1. Internationalization (i18n)
- **Dual Language**: English and Arabic support
- **RTL/LTR Layout**: Automatic direction switching
- **Language Toggle**: Switch languages anytime
- **Persistent Preference**: Save language choice
- **Bilingual Data**: All content in both languages

**Languages**: English (en), Arabic (ar)

---

### 2. Theme System
- **Light/Dark Mode**: Toggle theme
- **Persistent Theme**: Save theme choice
- **System Preference**: Auto-detect OS theme
- **Custom Theme**: Material Design 3 inspired

---

### 3. Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: xs, sm, md, lg, xl, 2xl
- **Adaptive Grid**: 1-5 columns based on screen width
- **Touch-Friendly**: Large tap targets

---

### 4. Notifications
- **In-App Notifications**: Real-time notification badge
- **Notification Types**: System, order, feedback
- **Mark as Read**: Clear notifications
- **Notification History**: View all notifications

---

### 5. Session Management
- **30-Day Sessions**: Long-lived sessions
- **Auto-Logout**: Logout button
- **Session Security**: HTTP-only cookies
- **Session Storage**: PostgreSQL (connect-pg-simple)

---

### 6. File Upload
- **Image Upload**: Product images (5MB max)
- **Document Upload**: PDF documents for LTAs
- **File Validation**: MIME type and size checking
- **Storage**: Replit Object Storage

---

### 7. PDF Generation
- **Template-Based**: Use document templates
- **Arabic Support**: RTL text with reshaping
- **Branding**: Company logo and colors
- **Multiple Types**: Offers, orders, invoices, contracts

---

### 8. Search & Filter
- **Global Search**: Search across products
- **Advanced Filters**: Multi-criteria filtering
- **Real-Time Results**: Instant search feedback

---

### 9. Data Export
- **CSV Export**: Products, vendors, orders
- **PDF Export**: Orders, reports
- **Bulk Export**: Multiple records at once

---

### 10. Webhooks
- **Pipefy Integration**: Auto-send order data on creation
- **Webhook Retry**: Handle failures
- **Webhook Logging**: Track integration status

---

## Feature Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| LTA Management | ✅ Complete | Full CRUD, assignments |
| Product Management | ✅ Complete | CRUD, images, import/export |
| Client Management | ✅ Complete | CRUD, departments, locations |
| Vendor Management | ✅ Complete | CRUD, import/export |
| Order Management | ✅ Complete | Full workflow, modifications |
| Price Management | ✅ Complete | Requests, offers, PDFs |
| Feedback System | ✅ Complete | Separate feedback & issues |
| Issue Reporting | ✅ Complete | Comprehensive issue tracking |
| Template System | ✅ Complete | JSON-based templates |
| Error Logging | ✅ Complete | Admin error dashboard |
| Internationalization | ✅ Complete | EN/AR with RTL |
| Theme System | ✅ Complete | Light/dark mode |
| PDF Generation | ✅ Complete | Arabic RTL support |
| Responsive Design | ✅ Complete | Mobile-first |
| Session Auth | ✅ Complete | 30-day sessions |
| Pipefy Integration | ✅ Complete | Order webhook |

---

## Feature Dependencies

### Product Ordering Flow
```
Client Login → View Products (LTA-filtered) → Add to Cart → Select Department/Location → Place Order → Pipefy Webhook
```

### Price Management Flow
```
Client Submits Price Request → Admin Views Request → Admin Creates Offer → PDF Generated → Client Views Offer → Client Accepts/Rejects
```

### Feedback Flow
```
Order Delivered → Wait 1 hour → Client Sees "Submit Feedback" Button → Submit Ratings/Comments → Admin Views in Dashboard → Admin Responds
```

### Issue Reporting Flow
```
Client Experiences Problem → Click "Report Issue" → Fill Form → Submit → ALL Admins Notified → Admin Updates Status → Client Notified
```

---

## Unused/Deprecated Features

### Identified Unused Code
1. **WishlistPage.tsx** - File exists but not routed in App.tsx (potentially deprecated)
2. **users table** - Reserved for future multi-tenancy but not currently used
3. **microFeedback table** - Schema exists but minimal usage

See [Code Audit](./CODE_AUDIT.md) for complete analysis.
