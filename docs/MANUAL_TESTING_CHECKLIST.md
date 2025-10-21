
# Manual Testing Checklist - Phase 1

**Date**: 2025-01-19  
**Tester**: _______________  
**Environment**: Development

---

## Pre-Testing Setup

- [ ] Clear browser cache
- [ ] Login as admin user
- [ ] Navigate to `/admin` dashboard

---

## Test Suite 1: Navigation & Routing

### Test 1.1: Admin Dashboard Navigation
- [ ] Click "Document Library" card from admin dashboard
- [ ] **Expected**: Navigate to `/admin/documents`
- [ ] **Expected**: No console errors
- [ ] **Actual Result**: _______________

### Test 1.2: Tab Switching
- [ ] Click "Documents" tab
- [ ] **Expected**: Documents list visible
- [ ] Click "Templates" tab
- [ ] **Expected**: Templates grid visible
- [ ] **Expected**: Smooth transition, no flickering
- [ ] **Actual Result**: _______________

### Test 1.3: Back Navigation
- [ ] Click back arrow button
- [ ] **Expected**: Return to `/admin` dashboard
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Test Suite 2: Document Management

### Test 2.1: Search Functionality
- [ ] Go to Documents tab
- [ ] Enter search term in search box
- [ ] **Expected**: Documents filter in real-time
- [ ] Clear search
- [ ] **Expected**: All documents visible again
- [ ] **Actual Result**: _______________

### Test 2.2: Document Type Filter
- [ ] Select "Price Offer" from document type dropdown
- [ ] **Expected**: Only price offer documents shown
- [ ] Select "All" 
- [ ] **Expected**: All documents visible
- [ ] **Actual Result**: _______________

### Test 2.3: Date Range Filter
- [ ] Set start date
- [ ] Set end date
- [ ] **Expected**: Documents filtered by date range
- [ ] **Actual Result**: _______________

### Test 2.4: Download Document
- [ ] Click download button on any document
- [ ] **Expected**: PDF opens in new tab
- [ ] **Expected**: View count increments
- [ ] **Actual Result**: _______________

### Test 2.5: Version History
- [ ] Click history button on document with versions
- [ ] **Expected**: Modal opens showing version history
- [ ] Click download on a version
- [ ] **Expected**: Version PDF downloads
- [ ] Close modal
- [ ] **Actual Result**: _______________

### Test 2.6: Access Logs
- [ ] Click logs button on any document
- [ ] **Expected**: Modal opens showing access logs
- [ ] **Expected**: Logs show user, action, timestamp
- [ ] Close modal
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Test Suite 3: Template Management

### Test 3.1: Template Categories
- [ ] Go to Templates tab
- [ ] Click each category tab (All, Price Offers, Orders, etc.)
- [ ] **Expected**: Templates filter by category
- [ ] **Expected**: No loading errors
- [ ] **Actual Result**: _______________

### Test 3.2: Create New Template
- [ ] Click "New Template" button
- [ ] **Expected**: Template editor dialog opens
- [ ] Fill in template details:
  - [ ] Name (EN & AR)
  - [ ] Description (EN & AR)
  - [ ] Category
- [ ] Click Save
- [ ] **Expected**: Template created, appears in list
- [ ] **Actual Result**: _______________

### Test 3.3: Edit Template
- [ ] Click Edit button on existing template
- [ ] **Expected**: Template editor opens with data
- [ ] Modify template name
- [ ] Click Save
- [ ] **Expected**: Template updated in list
- [ ] **Actual Result**: _______________

### Test 3.4: Duplicate Template
- [ ] Click Copy button on template
- [ ] **Expected**: Duplicate created with "(Copy)" suffix
- [ ] **Expected**: New template appears in list
- [ ] **Actual Result**: _______________

### Test 3.5: Delete Template
- [ ] Click Delete button on test template
- [ ] **Expected**: Confirmation may appear
- [ ] Confirm deletion
- [ ] **Expected**: Template removed from list
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Test Suite 4: UI/UX Quality

### Test 4.1: Loading States
- [ ] Refresh page while on Documents tab
- [ ] **Expected**: Skeleton loaders shown
- [ ] **Expected**: Smooth transition to content
- [ ] **Actual Result**: _______________

### Test 4.2: Empty States
- [ ] Apply filters that return no results
- [ ] **Expected**: Empty state message shown
- [ ] **Expected**: Clear filters option visible
- [ ] **Actual Result**: _______________

### Test 4.3: Error Handling
- [ ] Disconnect internet
- [ ] Try to download document
- [ ] **Expected**: Error toast notification
- [ ] Reconnect internet
- [ ] **Actual Result**: _______________

### Test 4.4: Pagination
- [ ] Check if pagination controls visible (if >10 docs)
- [ ] Click next page
- [ ] **Expected**: New documents loaded
- [ ] Click previous page
- [ ] **Expected**: Previous documents shown
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Test Suite 5: Responsive Design

### Test 5.1: Desktop (>1024px)
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] **Expected**: All elements properly aligned
- [ ] **Expected**: No overflow or truncation
- [ ] **Actual Result**: _______________

### Test 5.2: Tablet (768px - 1024px)
- [ ] Resize browser to tablet width
- [ ] **Expected**: Cards adapt to 2 columns
- [ ] **Expected**: Filters remain accessible
- [ ] **Actual Result**: _______________

### Test 5.3: Mobile (<768px)
- [ ] Resize to mobile width
- [ ] **Expected**: Single column layout
- [ ] **Expected**: Touch-friendly buttons (min 44px)
- [ ] **Expected**: Sidebar menu works
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Test Suite 6: Accessibility

### Test 6.1: Keyboard Navigation
- [ ] Use Tab to navigate through page
- [ ] **Expected**: All interactive elements focusable
- [ ] **Expected**: Focus indicators visible
- [ ] Press Enter on buttons
- [ ] **Expected**: Actions triggered
- [ ] **Actual Result**: _______________

### Test 6.2: Screen Reader (Optional)
- [ ] Enable screen reader
- [ ] Navigate through page
- [ ] **Expected**: All content announced
- [ ] **Expected**: Buttons have descriptive labels
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Performance Checks

### Performance 6.1: Page Load Time
- [ ] Open DevTools Network tab
- [ ] Refresh page
- [ ] **Expected**: Page loads in <2 seconds
- [ ] **Actual Time**: _______ms
- [ ] **Actual Result**: _______________

### Performance 6.2: Console Errors
- [ ] Open DevTools Console
- [ ] Navigate through all features
- [ ] **Expected**: No errors or warnings
- [ ] **Actual Result**: _______________

**Status**: ⬜ Pass ⬜ Fail  
**Notes**: _______________

---

## Summary

**Total Tests**: 27  
**Passed**: ___  
**Failed**: ___  
**Blocked**: ___  
**Pass Rate**: ___%

**Critical Issues Found**: _______________

**Recommendations**: _______________

**Sign-off**: _______________  
**Date**: _______________

---

## Next Steps

- [ ] Document all failures in bug tracker
- [ ] Create tickets for enhancements
- [ ] Update DOCUMENT_TESTING_RESULTS.md
- [ ] Plan Phase 2 based on findings
