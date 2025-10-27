# Safe Implementation Guide for Replit

## Overview

This guide provides step-by-step instructions for safely implementing the template system changes in your Replit environment. The implementation includes a comprehensive template management system with default templates, PDF generation, and bilingual support.

## ⚠️ Important Safety Notes

1. **Backup First**: Always backup your current code before making changes
2. **Test Environment**: Consider testing in a separate Replit project first
3. **Database Backup**: Ensure your database is backed up before running migrations
4. **Gradual Implementation**: Implement changes in small, manageable steps

## Pre-Implementation Checklist

- [ ] Current code is committed to Git
- [ ] Database backup is available
- [ ] Replit project is running without errors
- [ ] All dependencies are installed (`npm install`)
- [ ] Database connection is working

## Implementation Steps

### Step 1: Backup Current State

```bash
# 1. Commit current changes
git add .
git commit -m "Backup before template system implementation"

# 2. Create a backup branch
git checkout -b backup-before-templates
git push origin backup-before-templates

# 3. Return to main branch
git checkout main
```

### Step 2: Install Dependencies

The template system uses existing dependencies, but verify they're installed:

```bash
npm install
```

**Required Dependencies** (should already be installed):
- `pdfkit` - PDF generation
- `arabic-reshaper` - Arabic text shaping
- `bidi-js` - Bidirectional text handling
- `zod` - Validation
- `drizzle-orm` - Database ORM

### Step 3: Database Migration

**⚠️ CRITICAL**: This step modifies the database schema. Ensure you have a backup.

```bash
# 1. Check current database status
npm run db:push --dry-run

# 2. Apply database changes
npm run db:push
```

**Expected Changes**:
- `templates` table will be updated with new fields:
  - `nameEn`, `nameAr` (bilingual names)
  - `descriptionEn`, `descriptionAr` (bilingual descriptions)
  - `variables` (JSON array of template variables)
  - `isDefault` (boolean for default templates)
  - `version` (integer for template versioning)
  - `tags` (text array for template tags)

### Step 4: Add New Files

Create the following new files in your Replit project:

#### 4.1 Template Seeding System
```bash
# Create the main seeding file
touch server/seed-templates.ts
```

Copy the content from `/workspace/server/seed-templates.ts` to this file.

#### 4.2 Template Manager
```bash
# Create template management utilities
touch server/template-manager.ts
```

Copy the content from `/workspace/server/template-manager.ts` to this file.

#### 4.3 Template Management Routes
```bash
# Create template API routes
touch server/template-management-routes.ts
```

Copy the content from `/workspace/server/template-management-routes.ts` to this file.

#### 4.4 Template Seeding Script
```bash
# Create seeding script
mkdir -p server/scripts
touch server/scripts/seed-templates.ts
```

Copy the content from `/workspace/server/scripts/seed-templates.ts` to this file.

### Step 5: Update Existing Files

#### 5.1 Update Template Storage
Modify `server/template-storage.ts` to add `isDefault` support:

```typescript
// In createTemplate method, add:
isDefault: data.isDefault || false,

// In updateTemplate method, add:
if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
```

#### 5.2 Update Template Generator
Modify `server/template-generator.ts` to fix variable replacement:

Replace the `replaceVariables` method with the improved recursive version from the implementation.

#### 5.3 Update Document Routes
Modify `server/document-routes.ts` to integrate TemplateManager:

Add the import:
```typescript
import { TemplateManager } from "./template-manager";
import { DocumentTemplate, TemplateVariable } from "@shared/template-schema";
```

Update the PDF generation section to use TemplateManager.

#### 5.4 Update Main Routes
Modify `server/routes.ts` to include template management routes:

Add the import:
```typescript
import { setupTemplateManagementRoutes } from './template-management-routes';
```

Add the route setup:
```typescript
setupTemplateManagementRoutes(app);
```

#### 5.5 Update Package.json
Add the seeding script to `package.json`:

```json
{
  "scripts": {
    "seed:templates": "tsx server/scripts/seed-templates.ts"
  }
}
```

### Step 6: Test the Implementation

#### 6.1 Test Template Generator (Safe)
```bash
# Create a test file
touch test-template-generator.ts
```

Copy the content from `/workspace/test-template-generator-only.ts` to this file.

```bash
# Run the test
npx tsx test-template-generator.ts
```

**Expected Output**:
- ✅ PDF generated successfully
- PDF file created in project root
- No errors in console

#### 6.2 Test Template Seeding
```bash
# Run template seeding
npm run seed:templates
```

**Expected Output**:
- Templates loaded from production files
- Default templates created for each category
- Success message

### Step 7: Verify API Endpoints

Test the new API endpoints:

#### 7.1 Test Template Generation
```bash
# Test template generation endpoint
curl -X POST http://localhost:5000/api/templates/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your-session-cookie" \
  -d '{
    "category": "price_offer",
    "variables": [
      {"key": "companyName", "value": "Test Company"},
      {"key": "clientName", "value": "Test Client"},
      {"key": "date", "value": "2024-01-15"}
    ]
  }' \
  --output test-document.pdf
```

#### 7.2 Test Default Template Retrieval
```bash
# Test default template endpoint
curl -X GET http://localhost:5000/api/templates/default/price_offer \
  -H "Cookie: connect.sid=your-session-cookie"
```

### Step 8: Frontend Integration (Optional)

If you want to integrate the template system with your frontend:

#### 8.1 Add Template API Hooks
Create React hooks for template management:

```typescript
// client/src/hooks/useTemplates.ts
export const useTemplates = (category?: string) => {
  return useQuery({
    queryKey: ['templates', category],
    queryFn: () => fetch(`/api/templates/category/${category}`).then(res => res.json())
  });
};

export const useGenerateDocument = () => {
  return useMutation({
    mutationFn: (data: GenerateDocumentRequest) => 
      fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
  });
};
```

#### 8.2 Add Template Management UI
Create admin pages for template management:

- Template list page
- Template editor
- Template preview
- Default template settings

### Step 9: Production Deployment

#### 9.1 Pre-deployment Checklist
- [ ] All tests pass
- [ ] Template seeding works
- [ ] API endpoints respond correctly
- [ ] PDF generation works
- [ ] No console errors
- [ ] Database migration successful

#### 9.2 Deploy to Production
```bash
# 1. Commit all changes
git add .
git commit -m "Implement template system with default templates"

# 2. Push to main branch
git push origin main

# 3. Replit will auto-deploy
# Wait for deployment to complete

# 4. Run template seeding in production
npm run seed:templates
```

### Step 10: Post-Implementation Verification

#### 10.1 Verify Template System
1. Check that default templates exist for each category
2. Test PDF generation with different templates
3. Verify bilingual support works
4. Test template management API endpoints

#### 10.2 Monitor for Issues
1. Check Replit logs for errors
2. Monitor database performance
3. Verify PDF generation works consistently
4. Test with different browsers and devices

## Troubleshooting

### Common Issues

#### 1. Database Migration Fails
**Error**: `relation "templates" does not exist`
**Solution**: Run `npm run db:push` to create the table

#### 2. Template Seeding Fails
**Error**: `DATABASE_URL must be set`
**Solution**: Check your `.env` file has the correct database URL

#### 3. PDF Generation Fails
**Error**: `rows.forEach is not a function`
**Solution**: Ensure the template generator has the latest variable replacement logic

#### 4. API Endpoints Not Found
**Error**: `404 Not Found`
**Solution**: Verify the template management routes are properly imported in `routes.ts`

#### 5. Arabic Text Not Rendering
**Error**: Arabic text appears as boxes
**Solution**: Ensure `arabic-reshaper` and `bidi-js` are installed and working

### Debug Commands

```bash
# Check database connection
npx tsx -e "import { db } from './server/db'; console.log('DB connected')"

# Test template generator
npx tsx test-template-generator.ts

# Check template seeding
npm run seed:templates

# Verify API endpoints
curl -X GET http://localhost:5000/api/templates/default/price_offer
```

## Rollback Plan

If something goes wrong, you can rollback:

```bash
# 1. Switch to backup branch
git checkout backup-before-templates

# 2. Force push to main (DESTRUCTIVE)
git checkout main
git reset --hard backup-before-templates
git push origin main --force

# 3. Restore database from backup
# (Use your database backup restoration process)
```

## Support

If you encounter issues:

1. Check the Replit console for error messages
2. Verify all files were created correctly
3. Ensure database migration completed successfully
4. Test individual components (template generator, seeding, API)
5. Check the comprehensive documentation in `/workspace/docs/TEMPLATE_SYSTEM_GUIDE.md`

## Success Criteria

The implementation is successful when:

- [ ] Default templates exist for all categories
- [ ] PDF generation works without errors
- [ ] Bilingual support works correctly
- [ ] Template management API endpoints respond
- [ ] No console errors or warnings
- [ ] Database schema is updated correctly
- [ ] Template seeding runs successfully

## Next Steps

After successful implementation:

1. **Customize Templates**: Modify default templates to match your brand
2. **Add More Templates**: Create additional templates for specific use cases
3. **Frontend Integration**: Build admin interface for template management
4. **Testing**: Add comprehensive tests for the template system
5. **Documentation**: Update user documentation with template usage

---

**Remember**: Always test thoroughly in a development environment before deploying to production. The template system is designed to be robust and prevent document generation failures, but proper testing ensures everything works as expected.