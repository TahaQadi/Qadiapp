
# Workflows Quick Reference Guide

**Last Updated**: January 2025  
**Version**: 1.0 - Phase 1  
**Status**: Active

---

## 📋 Quick Access

### Via Tools Sidebar
1. Click Tools icon (left sidebar)
2. Select "Workflows"
3. Choose your workflow

### Via Command Palette
1. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Type "workflow" or workflow name
3. Select from dropdown

### Via Workflow Dropdown
- Look for dropdown menu near Run button
- Click to see all available workflows
- Select to execute

---

## 🚀 Available Workflows (Phase 1)

### 1. Start application ⭐
**Status**: Default (Run Button)  
**Mode**: Sequential  
**Purpose**: Start full-stack development server

```bash
npm run dev
```

**When to use**:
- Starting daily development work
- Running the complete application
- Default development workflow

**What it does**:
- Starts both frontend (Vite) and backend (Express)
- Opens on port 5000
- Hot-reloads on file changes

---

### 2. Test - Run All 🧪
**Mode**: Sequential  
**Purpose**: Execute complete test suite

```bash
echo "🧪 Running test suite..."
npm test
echo "✅ Tests completed!"
```

**When to use**:
- Before committing code
- After making functionality changes
- Pre-pull request validation

**What it does**:
- Runs all unit + integration tests
- Shows coverage report
- Identifies failing tests

**Expected duration**: 30-60 seconds

---

### 3. DB - Migrate 📦
**Mode**: Sequential  
**Purpose**: Push database schema changes

```bash
echo "📦 Running database migrations..."
npm run db:push
echo "✅ Migrations completed!"
```

**When to use**:
- After modifying schema files
- Before running app with schema changes
- During deployment preparation

**What it does**:
- Synchronizes database with schema
- Creates/updates tables
- Preserves existing data

**Expected duration**: 5-10 seconds

**⚠️ Important**: Always backup data before running migrations

---

### 4. Quality - Full Check 🔍
**Mode**: Sequential  
**Purpose**: Comprehensive quality validation

```bash
echo "🔍 Running comprehensive quality checks..."
echo "Step 1: Type Checking..."
npm run check
echo "Step 2: Running Tests..."
npm test
echo "✅ All quality checks passed!"
```

**When to use**:
- Before deploying to production
- Final check before code review
- Ensuring code quality standards

**What it does**:
1. Validates TypeScript types
2. Runs complete test suite
3. Reports any errors

**Expected duration**: 40-70 seconds

---

## 📊 Workflow Comparison

| Workflow | Speed | Scope | Use Case |
|----------|-------|-------|----------|
| Start application | Fast | Full App | Daily dev work |
| Test - Run All | Medium | All Tests | Pre-commit checks |
| DB - Migrate | Very Fast | Database | Schema updates |
| Quality - Full Check | Slow | Everything | Pre-deployment |

---

## 🎯 Common Scenarios

### Scenario 1: Starting Your Day
```
1. Run "Start application" (Run button)
2. Verify app is running
3. Start coding
```

### Scenario 2: Before Committing
```
1. Run "Test - Run All"
2. Fix any failures
3. Run "Quality - Full Check"
4. Commit if all pass
```

### Scenario 3: After Schema Changes
```
1. Stop "Start application"
2. Run "DB - Migrate"
3. Restart "Start application"
4. Test your changes
```

### Scenario 4: Pre-Deployment
```
1. Run "Quality - Full Check"
2. Fix any issues
3. Run "DB - Migrate" if needed
4. Deploy with confidence
```

---

## 🔧 Troubleshooting

### Workflow Not Starting
**Symptom**: Workflow doesn't execute when clicked

**Solutions**:
1. Refresh browser
2. Check console for errors
3. Verify `.replit` configuration
4. Stop any running workflows first

---

### Tests Failing
**Symptom**: "Test - Run All" shows failures

**Solutions**:
1. Read error messages carefully
2. Check if dependencies are installed (`npm ci`)
3. Verify database is running
4. Review recent code changes

---

### Migration Errors
**Symptom**: "DB - Migrate" fails

**Solutions**:
1. Check schema files for syntax errors
2. Review migration logs in console
3. Ensure database connection is active
4. Verify environment variables are set

---

### Type Check Errors
**Symptom**: "Quality - Full Check" fails on type checking

**Solutions**:
1. Run `npm run check` manually for details
2. Fix TypeScript errors in flagged files
3. Update type definitions if needed
4. Ensure all imports are correct

---

## 💡 Pro Tips

### Keyboard Shortcuts
- `Cmd+K` → Quick workflow access
- `Cmd+Enter` → Run selected workflow
- `Esc` → Close workflow panel

### Best Practices
1. **Always run tests before committing**
2. **Run migrations in test environment first**
3. **Use Quality Check before major releases**
4. **Keep workflows running in sequence, not parallel**

### Time-Saving Tips
- Bookmark frequently used workflows
- Create custom keyboard shortcuts in IDE
- Chain workflows for complex operations
- Document your team's workflow conventions

---

## 📈 Performance Expectations

### Typical Execution Times
```
Start application:    2-5 seconds
Test - Run All:       30-60 seconds
DB - Migrate:         5-10 seconds
Quality - Full Check: 40-70 seconds
```

### Resource Usage
- **CPU**: Moderate during tests, low otherwise
- **Memory**: ~200-400MB per workflow
- **Network**: Minimal (only dependency resolution)
- **Disk**: Low I/O

---

## 🚦 Workflow Status Indicators

### Console Output Colors
- 🔵 **Blue**: Informational messages
- 🟢 **Green**: Success/completion
- 🟡 **Yellow**: Warnings
- 🔴 **Red**: Errors/failures

### Common Messages
```bash
✅ Tests completed!          # All tests passed
❌ 3 tests failed           # Some tests failed
📦 Migrations completed!     # Migration successful
⚠️  Type errors found       # Type checking failed
```

---

## 📝 Cheat Sheet

### Quick Command Reference
```bash
# Run all tests
npm test

# Type check only
npm run check

# Database migration
npm run db:push

# Start dev server
npm run dev

# Build for production
npm run build
```

### Environment Variables
```bash
NODE_ENV=development    # Development mode
NODE_ENV=production     # Production mode
DATABASE_URL=...        # Database connection
SESSION_SECRET=...      # Session encryption
```

---

## 🔄 Phase 2 Preview

### Coming Soon (8+ New Workflows)

1. **Dev - Frontend Only** - UI-only development
2. **Dev - Backend Only** - API-only development
3. **Test - Quick Check** - Critical path tests
4. **Test - Watch Mode** - Continuous testing
5. **Test - Accessibility** - A11y compliance
6. **DB - Reset & Seed** - Fresh database setup
7. **Quality - Lint & Format** - Code style checks
8. **Quality - Type Check Only** - Fast TS validation

**Stay tuned!** Phase 2 launches in February 2025.

---

## 📚 Additional Resources

### Documentation
- [Full Implementation Plan](./WORKFLOWS_IMPLEMENTATION_PLAN.md)
- [Detailed Changelog](./WORKFLOWS_CHANGELOG.md)
- [Replit Workflows Docs](https://docs.replit.com/workflows)

### Support
- **Issues**: Report in project tracker
- **Questions**: Team development channel
- **Feedback**: Contact project lead

---

## 🎓 Training Resources

### For New Developers
1. Read this quick reference
2. Try each workflow once
3. Practice common scenarios
4. Ask questions in team chat

### For Team Leads
1. Review implementation plan
2. Set up team conventions
3. Document custom workflows
4. Monitor usage metrics

---

## ✅ Workflow Checklist

### Daily Workflow
- [ ] Start application
- [ ] Code and test
- [ ] Run tests before commits
- [ ] Push clean code

### Pre-Deployment
- [ ] Run full quality check
- [ ] Review test coverage
- [ ] Run migrations if needed
- [ ] Deploy to staging first

### Troubleshooting
- [ ] Check console output
- [ ] Review error messages
- [ ] Verify environment setup
- [ ] Ask team if stuck

---

**Remember**: Workflows are tools to help you work faster and more reliably. Use them consistently for the best results!

**Questions?** Check the [full documentation](./WORKFLOWS_IMPLEMENTATION_PLAN.md) or ask your team lead.

---

**Version History**
- v1.0 (January 2025) - Phase 1 release with 4 core workflows
