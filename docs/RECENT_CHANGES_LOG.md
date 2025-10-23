
# Recent Changes Log

## January 21, 2025 - Price Request/Offer Linking Fix

### Issue
Price requests and price offers were not properly linked, making it difficult to track which offers were created from which requests.

### Changes Made

#### 1. AdminPriceRequestsPage.tsx
- **Removed**: Next.js `Link` import (not available in React Router setup)
- **Fixed**: "Create Offer" button now uses direct navigation via `window.location.href`
- **Added**: Visual indicator (badge) showing when a request has been processed
- **Added**: Button state management - button is disabled after offer is created
- **Updated**: UI to show "Already Created" text when request status is 'processed'
- **Removed**: Duplicate offer creation dialog - simplified to direct navigation

#### 2. Server Routes (routes.ts)
- **Confirmed**: `requestId` field exists in `price_offers` table schema
- **Confirmed**: Offer creation endpoint accepts `requestId` parameter
- **Confirmed**: Request status is updated to 'processed' when offer is created

#### 3. Database Schema
```typescript
priceOffers: {
  requestId: varchar("request_id").references(() => priceRequests.id, { onDelete: "set null" })
  // This allows linking offers back to their originating requests
}
```

### Technical Details

**Navigation Flow**:
1. Admin clicks "Create Offer" on a pending price request
2. Page navigates to `/admin/price-offers/create?requestId={request.id}`
3. Offer creation page pre-fills data from the request
4. When offer is saved, `requestId` is included in the POST request
5. Server updates request status to 'processed'
6. UI reflects the change immediately

**Status Management**:
- Request status: `pending` → `processed` (when offer is created)
- Offer status: `draft` → `sent` → `viewed` → `accepted/rejected`

### Testing
- ✅ Price request creation works
- ✅ "Create Offer" button navigates correctly
- ✅ Request status updates to 'processed'
- ✅ Visual feedback shows when request is processed
- ✅ Button is disabled after offer creation

### Files Modified
- `client/src/pages/AdminPriceRequestsPage.tsx`
- `docs/WORKFLOWS_DOCUMENTATION.md` (this update)
- `docs/RECENT_CHANGES_LOG.md` (this file)

---



# Recent Changes Log

## Date: 2025-01-23

### Price Management System Improvements

#### 1. Fixed Currency Display Issue in Order History
**File:** `client/src/pages/OrderingPage.tsx`

**Changes:**
- Fixed hardcoded 'SAR' currency display in order cards
- Now correctly uses `order.currency` from the database
- Updated currency display logic to use actual order currency instead of first item's currency

**Impact:**
- Order history now displays correct currency for each order
- Fixes multi-currency support in order display

#### 2. Fixed Items Counter in Order History
**File:** `client/src/pages/OrderingPage.tsx`

**Changes:**
- Changed item count calculation from counting unique items to total quantity
- Updated `itemCount` to use `reduce()` to sum all item quantities
- Previously: `orderItems.length` (number of unique products)
- Now: `orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)` (total quantity)

**Impact:**
- Order cards now show accurate total item count
- Better reflects actual order size

#### 3. Fixed Feedback Analytics Date Comparison
**File:** `server/feedback-analytics-routes.ts`

**Changes:**
- Fixed `TypeError: value.toISOString is not a function` error
- Changed date comparison to pass Date objects instead of ISO strings
- Updated three query locations:
  - Main feedback data query
  - Issues query
  - Recent feedback query
- Changed from: `greaterThanOrEqual(orderFeedback.createdAt, startDate.toISOString())`
- Changed to: `greaterThanOrEqual(orderFeedback.createdAt, startDate)`

**Impact:**
- Admin feedback analytics now loads correctly
- Fixes 500 error when viewing feedback section

#### 4. Price Request Details View Implementation
**File:** `client/src/pages/AdminPriceManagementPage.tsx`

**Changes:**
- Implemented "View Details" dialog for price requests
- Added `ViewRequestDialog` component with detailed request information
- Dialog shows:
  - Request number and status
  - Client and LTA information
  - Request date with full formatting
  - List of requested products with quantities
  - Notes if present
  - Action button to create offer (for pending requests)
- Added `handleViewRequest()` function to open dialog
- Integrated dialog into price requests tab

**Impact:**
- Admins can now view full price request details without navigation
- Improved UX for reviewing requests before creating offers

#### 5. Price Request to Offer Flow
**File:** `client/src/pages/AdminPriceManagementPage.tsx`

**Changes:**
- Added "Create Offer" button on each price request card
- Implemented `handleCreateOffer()` function
- Navigates to `/admin/price-offers/create?requestId={id}`
- Only shows for pending requests (not completed ones)
- Updated request status filtering to distinguish pending vs. completed

**Impact:**
- Streamlined workflow from request to offer creation
- Clear visual distinction between actionable and completed requests

### Order Details and Feedback System

#### 6. Order Details Dialog in Ordering Page
**File:** `client/src/pages/OrderingPage.tsx`

**Changes:**
- Updated "Details" button behavior in history tab
- Changed from navigation to orders page to opening details dialog
- Shows order information inline without page navigation
- Maintains all existing dialog functionality (issue reporting, feedback)

**Impact:**
- Faster access to order details
- Better mobile experience
- Reduced navigation complexity

#### 7. History Tab UI Improvements
**File:** `client/src/pages/OrderingPage.tsx`

**Changes:**
- Added three compact action buttons on order cards:
  - "Details" button (text button)
  - Report issue icon button
  - Feedback icon button
- Improved button layout and spacing
- Added responsive design for mobile devices
- Consolidated actions in one row

**Impact:**
- Cleaner, more organized UI
- Better mobile usability
- Quick access to all order actions

### Database and Migration Issues

#### 8. Issue Report Priority Column Migration
**Status:** Migration file created but needs to be run

**File:** `migrations/0007_split_feedback_issues.sql`

**Changes:**
- Added `priority` column to `issue_reports` table
- Migration created but not yet applied
- Causes 500 error when submitting issue reports

**Action Required:**
- Run `npm run db:push` to apply migration
- This will fix the issue reporting functionality

### Code Quality and Error Handling

#### 9. JSON Parsing Error Handling
**Console Warnings:** Multiple "Failed to parse JSON: {}" warnings

**Issues Identified:**
- JSON parsing failures in order items and metadata
- Affects order history display
- Related to `safeJsonParse()` utility usage

**Status:** Needs investigation and fix

#### 10. Dialog Accessibility Warnings
**Console Warnings:**
- Missing `Description` or `aria-describedby` for DialogContent
- Missing `DialogTitle` for screen reader accessibility

**Files Affected:**
- `client/src/pages/AdminPriceManagementPage.tsx`
- Other dialog implementations

**Status:** Needs accessibility improvements

## Summary of Changes

### Critical Fixes
1. ✅ Fixed feedback analytics date comparison (production breaking)
2. ✅ Fixed currency display in order history
3. ✅ Fixed item counter in order history
4. ⚠️ Issue report migration pending (breaks issue submission)

### Feature Implementations
1. ✅ Price request details view dialog
2. ✅ Price request to offer creation flow
3. ✅ Order details dialog in ordering page
4. ✅ Improved history tab UI with action buttons

### Pending Issues
1. 🔴 Run database migration for issue reports
2. 🟡 Fix JSON parsing errors in order data
3. 🟡 Add accessibility improvements to dialogs

## Next Steps

1. Apply pending migration: `npm run db:push`
2. Investigate and fix JSON parsing issues
3. Add proper ARIA labels and descriptions to all dialogs
4. Test end-to-end price request workflow
5. Verify issue reporting functionality after migration
