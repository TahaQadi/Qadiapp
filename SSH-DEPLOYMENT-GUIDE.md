# SSH Deployment Guide - Apply Changes via SSH

## 🎯 You're Using SSH - This is Actually Better!

SSH gives you direct control and avoids Replit's auto-deployment issues.

---

## ✅ Current Status

**Already done automatically** ✅:
- Variable shadowing bug fixed in `server/storage.ts`
- All code changes committed to the workspace
- Template system code ready

**Need to run** ⏳:
- Database migration (add columns)
- Seed Arabic templates
- Restart server

---

## 🚀 SSH Deployment Steps

### Step 1: Check Current Directory

```bash
pwd
# Should show: /home/runner/workspace
```

If not in the right directory:
```bash
cd /home/runner/workspace
```

---

### Step 2: Stop Running Server (if any)

Check if server is running:
```bash
ps aux | grep node
```

If you see node processes, kill them:
```bash
pkill -f "tsx server"
# or
pkill node
```

Or if you have the terminal where it's running, press `Ctrl + C`

---

### Step 3: Run Database Migration

This adds the missing columns (`is_default`, `version`, `tags`) to the templates table:

```bash
npm run db:push
```

**Expected interaction:**

```
· You're about to add price_offers_offer_number_unique unique constraint...
  Do you want to truncate price_offers table?

❯ No, add the constraint without truncating the table
  Yes, truncate the table
```

**Action**: 
- Use arrow keys (↓/↑) to select **"No, add the constraint without truncating the table"**
- Press `Enter`

**Success output:**
```
✓ Changes applied successfully
```

**If it hangs**: Press `Ctrl + C` and try the manual SQL approach (see Troubleshooting below)

---

### Step 4: Seed Arabic Templates

This creates 4 default templates in the database:

```bash
npm run seed:templates
```

**Expected output:**
```
🚀 Starting template seeding process...
🌱 Seeding default templates...
✅ Created template: قالب عرض السعر القياسي
✅ Created template: قالب تأكيد الطلب
✅ Created template: قالب الفاتورة
✅ Created template: قالب العقد
✅ Successfully seeded 4 templates
```

**If you see "Found X existing templates. Skipping seed":**
- Templates already exist! ✅ Skip to Step 5.

---

### Step 5: Restart Server

```bash
npm run dev
```

**Expected output:**
```
Server running on port 5000
✓ Database connected
```

**Keep this terminal open** - server logs will appear here.

---

### Step 6: Test in Browser

Open your Replit app URL and test:

1. **Check templates exist**:
   - Admin → Document Templates
   - Should see 4 Arabic templates

2. **Test PDF download**:
   - Go to any price offer
   - Click "Download PDF"
   - PDF should download (no error!)

3. **Verify print works**:
   - Click "Print" button
   - Print dialog should open

---

## 🔧 Troubleshooting

### Issue: Migration Prompt Hangs or Loops

**Solution: Manual SQL Migration**

1. Stop the migration (`Ctrl + C`)

2. Connect to database directly:
```bash
# If using Neon, Supabase, or other PostgreSQL
psql $DATABASE_URL
```

3. Run SQL manually:
```sql
-- Add columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS tags JSONB;

-- Add unique constraint to price_offers
ALTER TABLE price_offers 
ADD CONSTRAINT IF NOT EXISTS price_offers_offer_number_unique 
UNIQUE (offer_number);

-- Verify
\d templates
\d price_offers
```

4. Exit psql:
```sql
\q
```

5. Continue to Step 4 (seed templates)

---

### Issue: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9

# Or kill all node processes
pkill node

# Then restart
npm run dev
```

---

### Issue: "Cannot find module" Errors

**Solution:**
```bash
# Reinstall dependencies
npm install

# Then restart
npm run dev
```

---

### Issue: Database Connection Failed

```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# If empty, check .env or Replit Secrets
cat .env | grep DATABASE_URL
```

In Replit UI:
- Go to Tools → Secrets
- Verify `DATABASE_URL` is set

---

### Issue: Templates Not Showing in Admin Panel

**Solution:**
```bash
# Check if templates were created
npm run seed:templates

# Or query directly
psql $DATABASE_URL -c "SELECT id, name, category, is_active FROM templates;"
```

If no templates:
- Run `npm run seed:templates` again
- Check server logs for errors

---

## 📝 Quick Command Reference

```bash
# Stop server
pkill node

# Check what's running
ps aux | grep node

# Database migration
npm run db:push

# Seed templates
npm run seed:templates

# Start server (foreground)
npm run dev

# Start server (background - keeps running after SSH disconnect)
nohup npm run dev > server.log 2>&1 &

# View logs (if running in background)
tail -f server.log

# Check if server is running
curl http://localhost:5000/api/health

# Database query
psql $DATABASE_URL -c "SELECT * FROM templates LIMIT 5;"
```

---

## 🎯 SSH Workflow for Future Changes

### Making Changes from Cursor

**Option A: Edit files locally, then push**
```bash
# In Cursor (your local machine)
# Make changes...
git add .
git commit -m "Your changes"
git push

# In SSH (Replit)
git pull
npm run dev
```

**Option B: Edit directly via SSH**
```bash
# In SSH (Replit)
nano server/routes.ts
# Make changes...
# Save: Ctrl+O, Enter, Ctrl+X

# Restart server
pkill node
npm run dev
```

**Option C: Use VS Code Remote SSH**
- Install "Remote - SSH" extension in VS Code
- Connect to Replit via SSH
- Edit files directly in VS Code
- Changes apply immediately on Replit

---

## ⚡ Pro SSH Tips

### Keep Server Running After Disconnect

Use `screen` or `tmux`:

```bash
# Install screen (if not installed)
# (usually pre-installed on Replit)

# Start a screen session
screen -S server

# Start server
npm run dev

# Detach: Press Ctrl+A, then D
# Server keeps running!

# Reconnect later
screen -r server

# List sessions
screen -ls
```

### Alternative: Use PM2

```bash
# Install PM2
npm install -g pm2

# Start server with PM2
pm2 start npm --name "app" -- run dev

# Check status
pm2 status

# View logs
pm2 logs

# Restart
pm2 restart app

# Stop
pm2 stop app
```

### Watch for File Changes

```bash
# Install nodemon globally
npm install -g nodemon

# Run with auto-restart
nodemon server/index.ts
```

---

## ✅ Checklist

After running all steps:

- [ ] Database migration completed (`npm run db:push`)
- [ ] Templates seeded (`npm run seed:templates`)
- [ ] Server running (`npm run dev`)
- [ ] Admin panel shows 4 templates
- [ ] PDF downloads work
- [ ] Print buttons work
- [ ] No errors in server logs

---

## 🎉 You're Done!

Your template system is now fully operational via SSH!

**Current working directory**: `/home/runner/workspace`
**Server port**: `5000`
**Database**: Connected via `DATABASE_URL`

All PDF downloads now use your custom Arabic templates! 🚀

