# Cursor → Replit: Safe Database Schema Changes

## 🎯 The Problem

When you make database schema changes in Cursor and push to Replit:
- ❌ Replit auto-deploys with old database schema
- ❌ App crashes with "column doesn't exist" errors
- ❌ Migration prompts hang automated deployments
- ❌ Data loss if migrations handled incorrectly

## ✅ The Solution: Safe Workflow

### Phase 1: Plan Your Changes (In Cursor)

**Before touching any code**, document your schema changes:

1. **List all table changes**:
   ```
   Adding to 'templates' table:
   - is_default (boolean, default: false)
   - version (integer, default: 1)
   - tags (jsonb)
   ```

2. **Identify breaking changes**:
   - New NOT NULL columns without defaults ❌ **DANGEROUS**
   - Removing columns ❌ **BREAKING**
   - Renaming columns ❌ **BREAKING**
   - Adding nullable or default columns ✅ **SAFE**
   - Adding new tables ✅ **SAFE**

3. **Plan migration strategy**:
   - Will this require data migration?
   - Can I add defaults to avoid breaking existing data?
   - Do I need a multi-step migration?

---

### Phase 2: Make Schema Changes (In Cursor)

#### Step 1: Update Schema File

**File**: `shared/schema.ts`

```typescript
// GOOD: Add with defaults
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false), // ✅ Has default
  version: integer("version").notNull().default(1),          // ✅ Has default
  tags: jsonb("tags"),                                        // ✅ Nullable
  // ... rest of fields
});

// BAD: Add without defaults
export const templates = pgTable("templates", {
  name: text("name").notNull(),
  requiredField: text("required_field").notNull(),  // ❌ No default!
  // This will FAIL on existing rows!
});
```

#### Step 2: Update TypeScript Types

Update all related types:

```typescript
// Update insert/select types if needed
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// Update validation schemas
export const createTemplateSchema = z.object({
  name: z.string(),
  isDefault: z.boolean().default(false),
  version: z.number().default(1),
  tags: z.array(z.string()).optional(),
});
```

#### Step 3: Update Code That Uses Schema

Find all places that query/insert into the changed table:

```bash
# In Cursor terminal
grep -r "templates" server/ --include="*.ts"
grep -r "templates" client/src/ --include="*.ts" --include="*.tsx"
```

Update each location to handle new fields.

#### Step 4: Test Locally (Optional but Recommended)

If you have a local Postgres setup:

```bash
# Test migration locally
npm run db:push

# Test code changes
npm run dev
```

---

### Phase 3: Prepare for Replit Deployment

#### Strategy A: Non-Interactive Migration (Preferred)

**Best for**: Safe changes (adding nullable/default columns, new tables)

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add isDefault, version, tags to templates table"
   git push
   ```

2. **Create migration script** (if complex):
   
   **File**: `server/scripts/safe-migrate.ts`
   ```typescript
   #!/usr/bin/env tsx
   
   import { db } from '../db';
   import { sql } from 'drizzle-orm';
   
   async function migrate() {
     console.log('🔄 Running safe migration...');
     
     try {
       // Add columns with defaults (safe, no data loss)
       await db.execute(sql`
         ALTER TABLE templates 
         ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
         ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
         ADD COLUMN IF NOT EXISTS tags JSONB;
       `);
       
       console.log('✅ Migration completed successfully');
     } catch (error) {
       console.error('❌ Migration failed:', error);
       process.exit(1);
     }
   }
   
   migrate();
   ```

3. **Add to package.json**:
   ```json
   {
     "scripts": {
       "migrate:safe": "tsx server/scripts/safe-migrate.ts"
     }
   }
   ```

#### Strategy B: Interactive Migration

**Best for**: Changes requiring user input

1. **Document the prompts** in a file:
   
   **File**: `MIGRATION-STEPS.md`
   ```markdown
   # Migration Steps for Replit
   
   Run these commands after deployment:
   
   1. npm run db:push
      - Prompt: "Add unique constraint to price_offers?"
      - Answer: "No, add the constraint without truncating"
   
   2. npm run seed:templates
      - Creates 4 default templates
   ```

2. **Commit and push**:
   ```bash
   git add MIGRATION-STEPS.md
   git commit -m "Add migration steps documentation"
   git push
   ```

---

### Phase 4: Deploy to Replit

#### Deployment Checklist

**In Replit Shell:**

1. **Stop the running server**:
   ```bash
   # Press Ctrl + C or click Stop button
   ```

2. **Pull latest changes**:
   ```bash
   git pull origin main
   ```

3. **Install new dependencies** (if any):
   ```bash
   npm install
   ```

4. **Run migration**:
   
   **Option A: Safe migration script**
   ```bash
   npm run migrate:safe
   ```
   
   **Option B: Interactive migration**
   ```bash
   npm run db:push
   # Respond to prompts as documented
   ```

5. **Seed data** (if needed):
   ```bash
   npm run seed:templates
   ```

6. **Restart server**:
   ```bash
   npm run dev
   ```

7. **Verify deployment**:
   - Check server logs for errors
   - Test the feature that uses new columns
   - Check admin panel/UI

---

## 🛡️ Best Practices

### 1. Always Add Defaults or Make Nullable

```typescript
// ✅ GOOD: Safe for existing data
columnName: text("column_name").default("default_value")
columnName: text("column_name")  // nullable by default

// ❌ BAD: Breaks existing data
columnName: text("column_name").notNull()  // No default!
```

### 2. Multi-Step Migrations for Breaking Changes

If you must make breaking changes:

**Step 1**: Add new column (nullable)
```typescript
newColumn: text("new_column")  // nullable first
```

**Step 2**: Migrate data
```typescript
// Script to copy old_column → new_column
UPDATE table SET new_column = old_column WHERE new_column IS NULL;
```

**Step 3**: Make it required
```typescript
newColumn: text("new_column").notNull()  // Now safe
```

**Step 4**: Drop old column
```typescript
// Remove old_column from schema
```

### 3. Test Migrations Before Deploying

Create a test database on Replit:

```bash
# In Replit, create a test DB connection
DATABASE_URL_TEST="postgresql://..."
```

Test migration there first before running on production.

### 4. Use Migration Scripts for Complex Changes

For anything beyond simple column additions:

```typescript
// server/scripts/migrate-v2.ts
export async function migrateToV2() {
  // 1. Add new columns
  // 2. Copy data
  // 3. Validate data
  // 4. Remove old columns
  // 5. Update indexes
}
```

### 5. Keep Schema and Code in Sync

**Create a checklist**:
- [ ] Updated `shared/schema.ts`
- [ ] Updated TypeScript types
- [ ] Updated validation schemas (Zod)
- [ ] Updated all queries that use this table
- [ ] Updated frontend components
- [ ] Created migration script (if complex)
- [ ] Documented migration steps
- [ ] Tested locally (if possible)

---

## 🚨 Emergency Rollback

If deployment breaks:

### Option 1: Rollback Code

```bash
# In Replit Shell
git log --oneline  # Find last working commit
git reset --hard <commit-hash>
npm run dev
```

### Option 2: Fix Forward

```bash
# Add missing column immediately
npm run db:push

# Or run emergency fix script
tsx server/scripts/emergency-fix.ts
```

### Option 3: Rollback Database

```bash
# If you have a backup (Neon/Supabase usually have point-in-time restore)
# Restore from backup via hosting provider dashboard
```

---

## 📋 Common Scenarios

### Scenario 1: Adding a New Column

**In Cursor**:
```typescript
// shared/schema.ts
export const myTable = pgTable("my_table", {
  id: uuid("id").primaryKey(),
  existingColumn: text("existing_column"),
  newColumn: text("new_column").default("default_value"), // ✅ Safe
});
```

**In Replit**:
```bash
git pull
npm run db:push  # Usually auto-answers "yes" for safe changes
npm run dev
```

### Scenario 2: Adding a Required Column

**Step 1 - In Cursor** (nullable first):
```typescript
newColumn: text("new_column"),  // nullable
```

**Step 2 - In Replit**:
```bash
git pull
npm run db:push
```

**Step 3 - In Cursor** (add data migration):
```typescript
// server/scripts/migrate-new-column.ts
await db.update(myTable).set({ newColumn: "default" }).where(isNull(myTable.newColumn));
```

**Step 4 - In Replit**:
```bash
git pull
npm run migrate:new-column
```

**Step 5 - In Cursor** (make required):
```typescript
newColumn: text("new_column").notNull(),
```

**Step 6 - In Replit**:
```bash
git pull
npm run db:push
```

### Scenario 3: Renaming a Column

**Don't rename directly!** Use this pattern:

**Step 1**: Add new column
```typescript
oldColumn: text("old_column"),
newColumn: text("new_column"),
```

**Step 2**: Copy data
```typescript
UPDATE table SET new_column = old_column;
```

**Step 3**: Update code to use newColumn

**Step 4**: Remove oldColumn
```typescript
// Remove oldColumn from schema
```

---

## 🎯 Quick Reference

### Safe Changes (No Risk)
- ✅ Add nullable column
- ✅ Add column with default
- ✅ Add new table
- ✅ Add index
- ✅ Update column default value

### Risky Changes (Needs Care)
- ⚠️ Add NOT NULL column (add nullable first, migrate data, then make required)
- ⚠️ Add unique constraint (ensure no duplicates first)
- ⚠️ Change column type (test data compatibility)

### Breaking Changes (Multi-Step Required)
- ❌ Remove column (deprecate first, remove later)
- ❌ Rename column (add new, migrate, remove old)
- ❌ Change NOT NULL to nullable (update code first)
- ❌ Drop table (backup data first!)

---

## ✅ Workflow Summary

```
┌─────────────────────────────────────────────┐
│ 1. Plan schema changes in Cursor           │
│    - List all changes                        │
│    - Identify risks                          │
│    - Plan migration strategy                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 2. Make changes in Cursor                   │
│    - Update schema.ts                        │
│    - Update types                            │
│    - Update code                             │
│    - Test locally (optional)                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 3. Prepare for deployment                   │
│    - Create migration script (if complex)    │
│    - Document manual steps                   │
│    - Commit and push                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 4. Deploy to Replit                         │
│    - Stop server                             │
│    - Pull changes                            │
│    - Run migration                           │
│    - Restart server                          │
│    - Verify                                  │
└─────────────────────────────────────────────┘
```

---

## 🔧 Current Project Setup

For your current changes:

```bash
# In Replit Shell (in order):
git pull origin main          # Get latest code
npm run db:push               # Add is_default, version, tags
npm run seed:templates        # Create 4 templates
npm run dev                   # Restart server
```

Done! 🎉

