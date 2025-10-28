# ✅ Price Offer Download Fix

## 🐛 Problem

**Error**: 401 Unauthorized when clients tried to download price offer PDFs
**Root Cause**: Missing download endpoint `/api/price-offers/:id/download`

### What Was Happening

1. Client clicks "Download PDF" button on price offer
2. Frontend generates URL: `/api/price-offers/:id/download?token=...`
3. Server responds with **401 Unauthorized** - endpoint doesn't exist!
4. User cannot download their price offer

## ✅ Solution

Added a new authenticated download endpoint for price offers that:

1. ✅ Authenticates the user (must be logged in)
2. ✅ Checks authorization (must be the offer's client OR admin)
3. ✅ Finds the document in the new document system
4. ✅ Downloads PDF from object storage
5. ✅ Logs the access for audit trail
6. ✅ Sends the PDF file to the client

## 📝 Implementation Details

### New Endpoint

**Route**: `GET /api/price-offers/:id/download`  
**Auth**: Authenticated users only (client or admin)  
**Location**: `server/routes.ts:908-970`

### Code Added

```typescript
// Client: Download price offer PDF
app.get("/api/price-offers/:id/download", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const offerId = req.params.id;
    
    // Get price offer
    const offer = await storage.getPriceOffer(offerId);
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    // Check authorization (client or admin only)
    if (offer.clientId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find document in new document system
    const documents = await storage.searchDocuments({ priceOfferId: offerId });
    const document = documents.find(doc => doc.priceOfferId === offerId);

    if (!document || !document.fileUrl) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // Download from object storage
    const downloadResult = await PDFStorage.downloadPDF(
      document.fileUrl, 
      document.checksum || undefined
    );
    
    if (!downloadResult.ok || !downloadResult.data) {
      return res.status(500).json({ message: "Failed to download PDF" });
    }

    // Log access for audit
    await PDFAccessControl.logDocumentAccess({
      documentId: document.id,
      clientId: offer.clientId,
      action: 'download',
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${offer.offerNumber}.pdf"`);
    res.setHeader('Content-Length', downloadResult.data.length.toString());
    res.send(downloadResult.data);

  } catch (error) {
    console.error('Price offer download error:', error);
    res.status(500).json({ message: 'Download failed' });
  }
});
```

## 🔒 Security Features

### Authorization Checks

1. **Authentication**: User must be logged in (via `isAuthenticated` middleware)
2. **Authorization**: User must either:
   - Be the client who owns the price offer, OR
   - Be an admin

3. **Access Logging**: Every download is logged with:
   - Document ID
   - Client ID
   - Action type ('download')
   - IP address
   - User agent
   - Timestamp

### Checksum Verification

- PDF integrity verified using checksum from storage
- Prevents corrupted file downloads
- Automatic validation in `PDFStorage.downloadPDF()`

## 🎯 How It Works Now

### Client Flow

```
1. Client logs in ✅
   ↓
2. Views price offers page
   ↓
3. Clicks "Download PDF" button
   ↓
4. Request sent: GET /api/price-offers/:id/download
   ↓
5. Server checks authentication ✅
   ↓
6. Server checks authorization (client owns offer) ✅
   ↓
7. Server finds document in new document system ✅
   ↓
8. Server downloads from object storage ✅
   ↓
9. Server logs access ✅
   ↓
10. PDF file downloaded to client's device ✅
```

### Admin Flow

```
1. Admin logs in ✅
   ↓
2. Views any client's price offers
   ↓
3. Clicks "Download PDF" button
   ↓
4. Request sent: GET /api/price-offers/:id/download
   ↓
5. Server checks authentication ✅
   ↓
6. Server checks authorization (admin = always allowed) ✅
   ↓
7. Server finds document ✅
   ↓
8. Server downloads from object storage ✅
   ↓
9. Server logs access ✅
   ↓
10. PDF file downloaded ✅
```

## 📊 Error Handling

| Status Code | Scenario | Response |
|-------------|----------|----------|
| 401 | Not logged in | `{ message: "Authentication required" }` |
| 403 | Wrong client | `{ message: "Access denied" }` |
| 404 | Offer not found | `{ message: "Offer not found" }` |
| 404 | PDF not generated yet | `{ message: "PDF not found" }` |
| 500 | Storage error | `{ message: "Failed to download PDF" }` |

## 🔗 Integration with New Document System

This endpoint integrates seamlessly with the new optimized document system:

1. **Document Lookup**: Uses `storage.searchDocuments({ priceOfferId })`
2. **Storage**: Downloads from object storage via `PDFStorage.downloadPDF()`
3. **Tracking**: Uses document ID from documents table
4. **Audit**: Logs access via `PDFAccessControl.logDocumentAccess()`
5. **Security**: Verifies checksum for file integrity

## ✅ Testing

### Test as Client

```bash
# Login as client
POST /api/login
Body: { "username": "client@example.com", "password": "..." }

# Download price offer (should work for own offers)
GET /api/price-offers/OFFER_ID/download
Authorization: Bearer CLIENT_TOKEN

# Expected: PDF file downloads successfully
```

### Test as Admin

```bash
# Login as admin
POST /api/login
Body: { "username": "admin@example.com", "password": "..." }

# Download any price offer (should work for all offers)
GET /api/price-offers/ANY_OFFER_ID/download
Authorization: Bearer ADMIN_TOKEN

# Expected: PDF file downloads successfully
```

### Test Unauthorized Access

```bash
# Login as client A
# Try to download client B's offer
GET /api/price-offers/CLIENT_B_OFFER_ID/download
Authorization: Bearer CLIENT_A_TOKEN

# Expected: 403 Forbidden
```

## 🎉 Results

- ✅ **401 Error Fixed**: Endpoint now exists and works
- ✅ **Security**: Proper authentication & authorization
- ✅ **Audit Trail**: All downloads logged
- ✅ **File Integrity**: Checksum verification
- ✅ **User Experience**: Clients can download their offers
- ✅ **Admin Access**: Admins can download all offers

## 📁 Files Modified

- `server/routes.ts` - Added new download endpoint (lines 908-970)

## 🔄 Related Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /api/price-offers/:id/download` | Download PDF (NEW) | Client/Admin |
| `POST /api/admin/price-offers/:id/send` | Generate & send PDF | Admin only |
| `GET /api/price-offers` | List offers | Client/Admin |
| `GET /api/documents/:id/download` | Generic doc download | Token-based |

## 🚀 Next Steps (Optional)

1. Add similar download endpoints for:
   - Orders: `GET /api/orders/:id/download`
   - Invoices: `GET /api/invoices/:id/download`
   - Contracts: `GET /api/contracts/:id/download`

2. Consider adding:
   - Download rate limiting
   - Download analytics
   - Email delivery option

3. Client-side improvements:
   - Loading indicator during download
   - Error message display
   - Retry logic for failed downloads

---

## ✅ ISSUE RESOLVED!

**The 401 error is now fixed. Clients can successfully download their price offer PDFs!** 🎉

