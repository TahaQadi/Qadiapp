
# Email Service Setup Guide

## Overview

The LTA Contract Fulfillment System uses a robust email service for sending order confirmations, password resets, and welcome emails. This guide will help you configure the email service properly.

## Environment Variables

Set these environment variables in your Replit Secrets (🔒 icon in the left sidebar):

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | Your SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | Your email address | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Your email password or app password | `your-app-password` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_FROM` | Email address shown as sender | Uses `SMTP_USER` |
| `SMTP_SECURE` | Use SSL/TLS (set to `true` for port 465) | `false` |

## Popular Email Providers

### Gmail

1. **Enable 2-Factor Authentication** in your Google Account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Configuration**:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_SECURE=false
   ```

### Outlook/Office 365

```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_SECURE=false
```

### SendGrid

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_SECURE=false
```

### Amazon SES

```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_SECURE=false
```

## Email Features

### 1. Order Confirmation Emails
- Sent automatically when an order is created
- Includes order details, items, and pricing
- Bilingual support (English/Arabic)
- Professional HTML template

### 2. Password Reset Emails
- Secure token-based reset links
- 1-hour expiration for security
- Clear call-to-action button

### 3. Welcome Emails
- Sent when new client accounts are created
- Overview of system features
- Direct login link

## Best Practices

### Security
- ✅ Always use App Passwords (not your main password)
- ✅ Enable 2-Factor Authentication on your email account
- ✅ Keep SMTP credentials in Replit Secrets, never in code
- ✅ Use TLS/SSL encryption (port 587 or 465)

### Deliverability
- ✅ Use a verified domain email address
- ✅ Include both HTML and text versions of emails
- ✅ Keep email content professional and concise
- ✅ Avoid spam trigger words

### Error Handling
- ✅ Automatic retry mechanism (3 attempts)
- ✅ Exponential backoff between retries
- ✅ Detailed logging for debugging
- ✅ Graceful degradation if email fails

## Testing Email Configuration

Add this endpoint to test your email setup:

```typescript
// In server/routes.ts or server/index.ts
app.get('/api/test-email', async (req, res) => {
  const result = await emailService.testConnection();
  res.json(result);
});
```

## Troubleshooting

### "Authentication failed"
- Check that SMTP_USER and SMTP_PASSWORD are correct
- For Gmail, ensure you're using an App Password, not your account password
- Verify 2FA is enabled if using Gmail

### "Connection timeout"
- Check SMTP_HOST is correct
- Verify SMTP_PORT matches your provider
- Check if your network allows SMTP connections

### "TLS/SSL errors"
- Set SMTP_SECURE=true for port 465
- Set SMTP_SECURE=false for port 587
- Update Node.js if using an old version

### Emails not being received
- Check spam/junk folders
- Verify FROM address is valid
- Review email provider's sending limits
- Check recipient email is correct

## Rate Limits

Be aware of sending limits:

| Provider | Limit |
|----------|-------|
| Gmail | 500 emails/day (free), 2000/day (workspace) |
| Outlook | 300 emails/day |
| SendGrid | 100 emails/day (free tier) |
| Amazon SES | 200 emails/day (free tier) |

## Monitoring

The email service logs all operations:

- ✅ `Email service ready` - Successfully configured
- ⚠️ `Email service not configured` - Missing credentials
- ❌ `Email verification failed` - Configuration error
- ✅ `Email sent successfully` - Email delivered
- ❌ `Email attempt failed` - Sending error

## Production Recommendations

For production use, consider:

1. **Dedicated Email Service**: Use SendGrid, AWS SES, or Mailgun
2. **Email Queue**: Implement a job queue for high-volume sending
3. **Monitoring**: Set up alerts for email delivery failures
4. **Analytics**: Track open rates and click-through rates
5. **Templates**: Store templates in database for easy updates

## Support

For issues or questions about email configuration, check:
- Server logs for error messages
- `/api/test-email` endpoint for connection testing
- Provider-specific documentation
- Replit community forums
