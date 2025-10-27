# Onboarding ↔ Admin Client Debugging Guide

## 🚨 **Common Issues & Solutions**

### **1. ONBOARDING PROCESS ISSUES**

#### **Issue: Validation Errors**
```typescript
// Common validation failures:
- Arabic name required but not provided
- Map location not selected (latitude/longitude missing)
- Email already exists
- Password confirmation mismatch
- Department contact info incomplete
```

**Debug Steps:**
1. **Check Browser Console** for validation errors
2. **Check Network Tab** for API response details
3. **Verify Required Fields** are filled:
   - Company name (Arabic) ✓
   - Headquarters name (Arabic) ✓
   - Headquarters address (Arabic) ✓
   - Map location selected ✓
   - Department contact info ✓

**Solution:**
```typescript
// Add better error handling in OnboardingPage.tsx
const onboardingMutation = useMutation({
  mutationFn: async (data: OnboardingData) => {
    try {
      const payload = {
        user: {
          email: data.user.email,
          password: data.user.password,
          confirmPassword: data.user.confirmPassword,
        },
        company: data.company,
        headquarters: data.headquarters,
        departments: data.departments,
      };
      const res = await apiRequest('POST', '/api/onboarding/complete', payload);
      return await res.json();
    } catch (error) {
      console.error('Onboarding error:', error);
      throw error;
    }
  },
  onError: (error: any) => {
    console.error('Detailed onboarding error:', error);
    toast({
      title: language === 'ar' ? 'خطأ في التسجيل' : 'Registration Error',
      description: error.message || 'Unknown error occurred',
      variant: 'destructive',
    });
  },
});
```

#### **Issue: Map Location Not Working**
```typescript
// Problem: MapLocationPicker not saving coordinates
// Check if latitude/longitude are being captured
```

**Debug Steps:**
1. **Check MapLocationPicker component** for coordinate capture
2. **Verify state updates** when location is selected
3. **Check validation** requires latitude/longitude

**Solution:**
```typescript
// Add debugging to MapLocationPicker
const handleLocationSelect = (lat: number, lng: number) => {
  console.log('Location selected:', { lat, lng });
  setOnboardingData(prev => ({
    ...prev,
    headquarters: {
      ...prev.headquarters,
      latitude: lat,
      longitude: lng,
    }
  }));
};
```

#### **Issue: Email Already Exists**
```typescript
// Problem: User tries to register with existing email
// Check: /api/onboarding/complete returns 400 with email conflict
```

**Debug Steps:**
1. **Check database** for existing emails
2. **Verify email uniqueness** check in onboarding-routes.ts
3. **Check case sensitivity** in email comparison

**Solution:**
```typescript
// Improve email checking in onboarding-routes.ts
const existingClient = existingClients.find(c => 
  c.email?.toLowerCase() === data.user.email.toLowerCase()
);
```

### **2. ADMIN CLIENT MANAGEMENT ISSUES**

#### **Issue: Client Creation Fails**
```typescript
// Common failures:
- Username already exists
- Validation errors
- Database connection issues
- Permission errors
```

**Debug Steps:**
1. **Check Admin Panel Console** for errors
2. **Verify Admin Permissions** (isAdmin: true)
3. **Check API Response** in Network tab
4. **Validate Form Data** before submission

**Solution:**
```typescript
// Add better error handling in AdminClientsPage.tsx
const createClientMutation = useMutation({
  mutationFn: async (data: CreateClientFormValues) => {
    console.log('Creating client with data:', data);
    const res = await apiRequest('POST', '/api/admin/clients', data);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create client');
    }
    return await res.json();
  },
  onError: (error: any) => {
    console.error('Client creation error:', error);
    toast({
      title: language === 'ar' ? 'خطأ في إنشاء العميل' : 'Error creating client',
      description: error.message,
      variant: 'destructive',
    });
  },
});
```

#### **Issue: Client Details Not Loading**
```typescript
// Problem: Client details query fails
// Check: /api/admin/clients/:id endpoint
```

**Debug Steps:**
1. **Check Client ID** is valid
2. **Verify API Endpoint** exists
3. **Check Database** for client record
4. **Verify Permissions** for client access

**Solution:**
```typescript
// Add error handling for client details query
const { data: clientDetails, isLoading: detailsLoading, error: detailsError } = useQuery<ClientDetails>({
  queryKey: ['/api/admin/clients', selectedClientId],
  queryFn: async () => {
    if (!selectedClientId) throw new Error('No client selected');
    console.log('Fetching client details for:', selectedClientId);
    const res = await apiRequest('GET', `/api/admin/clients/${selectedClientId}`);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch client details');
    }
    return await res.json();
  },
  enabled: !!selectedClientId,
  retry: 1,
  onError: (error) => {
    console.error('Client details error:', error);
  },
});
```

#### **Issue: Department/Location Management Fails**
```typescript
// Problem: Adding/editing departments or locations fails
// Check: API endpoints for department/location management
```

**Debug Steps:**
1. **Check API Endpoints** exist for department/location management
2. **Verify Form Validation** in dialogs
3. **Check Database** for foreign key constraints
4. **Verify Client ID** is valid

**Solution:**
```typescript
// Add debugging to DepartmentManagementDialog
const handleSubmit = () => {
  form.handleSubmit((data) => {
    console.log('Saving department:', data);
    onSave(data);
  })();
};
```

### **3. DATABASE CONNECTION ISSUES**

#### **Issue: Database Not Initialized**
```typescript
// Problem: Database tables don't exist
// Check: Database initialization in storage.ts
```

**Debug Steps:**
1. **Check Database Connection** in server logs
2. **Verify Table Creation** in database
3. **Check Migration Status**
4. **Verify Environment Variables**

**Solution:**
```typescript
// Add database health check
app.get('/api/health/database', async (req, res) => {
  try {
    const clients = await storage.getClients();
    res.json({ 
      status: 'healthy', 
      clientCount: clients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});
```

#### **Issue: Foreign Key Constraints**
```typescript
// Problem: Creating departments/locations fails due to invalid client ID
// Check: Client ID exists before creating related records
```

**Debug Steps:**
1. **Verify Client Exists** before creating departments/locations
2. **Check Foreign Key Constraints** in database
3. **Verify Client ID Format** (UUID)
4. **Check Cascade Delete** settings

**Solution:**
```typescript
// Add client existence check in storage methods
async createClientDepartment(data: InsertClientDepartment): Promise<ClientDepartment> {
  // Check if client exists first
  const client = await this.getClient(data.clientId);
  if (!client) {
    throw new Error(`Client with ID ${data.clientId} not found`);
  }
  
  const inserted = await this.db
    .insert(clientDepartments)
    .values(data)
    .returning();
  return inserted[0];
}
```

### **4. AUTHENTICATION ISSUES**

#### **Issue: Admin Access Denied**
```typescript
// Problem: User can't access admin panel
// Check: isAdmin flag in user record
```

**Debug Steps:**
1. **Check User Record** in database for isAdmin flag
2. **Verify Session** contains correct user data
3. **Check requireAdmin Middleware**
4. **Verify First User Logic** in onboarding

**Solution:**
```typescript
// Add admin check endpoint
app.get('/api/auth/admin-check', requireAuth, async (req: any, res) => {
  const user = req.user;
  res.json({
    isAdmin: user.isAdmin,
    userId: user.id,
    username: user.username
  });
});
```

#### **Issue: Session Not Persisting**
```typescript
// Problem: User gets logged out after onboarding
// Check: Session configuration and cookies
```

**Debug Steps:**
1. **Check Session Configuration** in auth.ts
2. **Verify Cookie Settings** (secure, httpOnly, sameSite)
3. **Check SESSION_SECRET** environment variable
4. **Verify Session Store** configuration

**Solution:**
```typescript
// Add session debugging
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Add session logging middleware
app.use((req, res, next) => {
  console.log('Session data:', req.session);
  next();
});
```

### **5. API ENDPOINT ISSUES**

#### **Issue: Missing API Endpoints**
```typescript
// Problem: API endpoints return 404
// Check: Route registration in routes.ts
```

**Debug Steps:**
1. **Check Route Registration** in routes.ts
2. **Verify HTTP Methods** (GET, POST, PUT, DELETE)
3. **Check URL Patterns** match frontend requests
4. **Verify Middleware** order

**Solution:**
```typescript
// Add route debugging middleware
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});
```

#### **Issue: CORS Errors**
```typescript
// Problem: Frontend can't access API
// Check: CORS configuration
```

**Debug Steps:**
1. **Check CORS Headers** in API responses
2. **Verify Origin** in CORS configuration
3. **Check Preflight Requests** (OPTIONS)
4. **Verify Credentials** setting

**Solution:**
```typescript
// Add CORS debugging
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
```

## 🔧 **Debugging Tools & Commands**

### **1. Browser Developer Tools**
```javascript
// Console debugging commands
console.log('Current user:', window.user);
console.log('Session data:', document.cookie);
console.log('API base URL:', process.env.API_URL);

// Network tab debugging
// Check API requests/responses
// Verify status codes
// Check request/response payloads
```

### **2. Server Logging**
```typescript
// Add comprehensive logging
console.log('Onboarding request:', {
  body: req.body,
  user: req.user,
  timestamp: new Date().toISOString()
});

// Database query logging
console.log('Database query:', {
  table: 'clients',
  operation: 'create',
  data: insertData
});
```

### **3. Database Inspection**
```sql
-- Check clients table
SELECT * FROM clients ORDER BY created_at DESC;

-- Check client departments
SELECT cd.*, c.nameEn as client_name 
FROM client_departments cd 
JOIN clients c ON cd.clientId = c.id;

-- Check client locations
SELECT cl.*, c.nameEn as client_name 
FROM client_locations cl 
JOIN clients c ON cl.clientId = c.id;
```

### **4. API Testing**
```bash
# Test onboarding endpoint
curl -X POST http://localhost:5000/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "password": "password123",
      "confirmPassword": "password123"
    },
    "company": {
      "nameEn": "Test Company",
      "nameAr": "شركة تجريبية"
    },
    "headquarters": {
      "nameEn": "HQ",
      "nameAr": "المقر",
      "addressEn": "123 Test St",
      "addressAr": "١٢٣ شارع تجريبي",
      "latitude": 31.7683,
      "longitude": 35.2137
    },
    "departments": [{
      "type": "finance",
      "contactName": "John Doe",
      "contactEmail": "john@example.com",
      "contactPhone": "+1234567890"
    }]
  }'

# Test admin client creation
curl -X POST http://localhost:5000/api/admin/clients \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your_session_id" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "nameEn": "Test User",
    "nameAr": "مستخدم تجريبي",
    "email": "testuser@example.com",
    "phone": "+1234567890"
  }'
```

## 🚀 **Quick Fixes**

### **1. Reset Database**
```typescript
// Clear all data and start fresh
await storage.clearAllData();
```

### **2. Create Admin User Manually**
```typescript
// Create admin user directly
const adminUser = await storage.createClient({
  username: 'admin',
  password: await hashPassword('admin123'),
  nameEn: 'Administrator',
  nameAr: 'المسؤول',
  email: 'admin@system.com',
  phone: '+1111111111',
  isAdmin: true,
});
```

### **3. Fix Session Issues**
```typescript
// Clear browser cookies and localStorage
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### **4. Check Environment Variables**
```bash
# Verify required environment variables
echo $SESSION_SECRET
echo $NODE_ENV
echo $PORT
```

## 📊 **Monitoring & Alerts**

### **1. Error Tracking**
```typescript
// Add error tracking to critical functions
try {
  const result = await criticalOperation();
  return result;
} catch (error) {
  console.error('Critical operation failed:', error);
  // Send to error tracking service
  throw error;
}
```

### **2. Performance Monitoring**
```typescript
// Add performance monitoring
const startTime = Date.now();
const result = await operation();
const duration = Date.now() - startTime;
console.log(`Operation took ${duration}ms`);
```

### **3. Health Checks**
```typescript
// Add health check endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```
