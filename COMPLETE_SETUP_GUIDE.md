# Signatura PWA - Complete Setup Guide

## Overview

This guide will help you set up the complete Signatura system with:
- **Frontend**: React PWA (Landing page + Role-based login)
- **Backend**: Express.js API
- **Database**: Supabase with PostgreSQL (NOT MySQL)
- **Hosting**: Railway

---

## Part 1: Initial Setup

### 1.1 Prerequisites

```bash
# Check Node.js version (need 18+)
node --version
npm --version

# Install git if not already installed
git --version
```

### 1.2 Create Project Structure

```bash
mkdir signatura-pwa
cd signatura-pwa

# Create frontend and backend folders
mkdir frontend backend
cd frontend
npm init -y
cd ../backend
npm init -y
cd ..
```

---

## Part 2: Supabase Setup (PostgreSQL)

### 2.1 Create Supabase Project

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in:
   - Project name: `signatura`
   - Database password: Create a strong password (save it!)
   - Region: Choose closest to your users
4. Wait for project to be created (5-10 minutes)

### 2.2 Get Your API Keys

After project is created:

1. Go to **Settings** > **API**
2. Copy and save:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (starts with eyJ)
   - **service_role key**: (keep this secret, only for backend!)

### 2.3 Enable PostgreSQL Features

1. Go to **SQL Editor**
2. Click "New Query"
3. Run this SQL to enable extensions:

```sql
-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.4 Create Database Tables

1. Stay in SQL Editor
2. Create a new query and run the entire SQL schema from `REVISED_ARCHITECTURE.md`

```sql
-- Copy the entire database schema from REVISED_ARCHITECTURE.md
-- This creates all tables with proper relationships and indexes
```

### 2.5 Set Up Authentication Trigger

Run this SQL to automatically create user profiles on signup:

```sql
-- Function to create user profile on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (new.id, new.email, 'owner', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 2.6 Create Demo Users (Optional)

Run this SQL to create test accounts:

```sql
-- Note: Replace with actual Supabase hashed passwords
-- For now, use Supabase UI to create users

-- Better way: Use Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Create:
--    - issuer@demo.com (password: Demo@1234, role: issuer)
--    - owner@demo.com (password: Demo@1234, role: owner)
--    - admin@signatura.com (password: Admin@1234, role: admin)
```

---

## Part 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd frontend

npm install react react-dom react-router-dom zustand
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install axios jose crypto-js qrcode date-fns
npm install tailwindcss autoprefixer postcss
npm install framer-motion react-icons react-hot-toast react-qr-code
npm install -D vite @vitejs/plugin-react vite-plugin-pwa
```

### 3.2 Create Folder Structure

```bash
mkdir -p src/{pages/{Landing,Login,Dashboard},components,hooks,store,utils,styles}
mkdir -p public/icons
```

### 3.3 Create Configuration Files

#### 3.3.1 `vite.config.js`

Copy the vite config from earlier (includes PWA configuration)

#### 3.3.2 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### 3.3.3 `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 3.3.4 `.env.local`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:3000/api
```

### 3.4 Create Source Files

1. **`src/main.jsx`** - Entry point
2. **`src/App.jsx`** - Main app with routing (use AppComplete.jsx)
3. **`src/store/authStore.js`** - Zustand auth state
4. **`src/utils/supabase.js`** - Supabase client and helpers
5. **`src/pages/Landing.jsx`** - Landing page (copy from earlier)
6. **`src/pages/Login/IssuerLogin.jsx`** - Issuer login
7. **`src/pages/Login/OwnerLogin.jsx`** - Owner login
8. **`src/pages/Login/AdminLogin.jsx`** - Admin login
9. **`src/pages/Dashboard/IssuerDashboard.jsx`** - Issuer dashboard
10. **`src/pages/Dashboard/OwnerDashboard.jsx`** - Owner dashboard
11. **`src/pages/Dashboard/AdminDashboard.jsx`** - Admin dashboard
12. **`src/pages/NotFound.jsx`** - 404 page
13. **`src/styles/tailwind.css`** - Tailwind imports

### 3.5 Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1f2937" />
    <title>Signatura - Digital Document Verification</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 3.6 Create `public/manifest.json`

```json
{
  "name": "Signatura",
  "short_name": "Signatura",
  "description": "Digital Document Verification System",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

### 3.7 Update `package.json`

```json
{
  "name": "signatura-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    // ... (list from 3.1)
  },
  "devDependencies": {
    // ... (list from 3.1)
  }
}
```

### 3.8 Test Frontend Locally

```bash
npm run dev
```

Visit http://localhost:5173 - you should see the landing page!

---

## Part 4: Backend Setup

### 4.1 Install Dependencies

```bash
cd ../backend

npm install express dotenv cors helmet express-rate-limit morgan
npm install @supabase/supabase-js jsonwebtoken bcryptjs
npm install express-validator uuid moment winston
npm install -D nodemon jest
```

### 4.2 Create Folder Structure

```bash
mkdir -p src/{routes,middleware,controllers,services,config}
```

### 4.3 Create Configuration Files

#### 4.3.1 `.env`

```
NODE_ENV=development
PORT=3000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4.4 Create Server Files

Copy these files from earlier:
- `server.js` - Main server entry
- `src/routes/auth.js` - Authentication routes
- `src/middleware/auth.js` - JWT middleware
- `src/middleware/errorHandler.js` - Error handling

### 4.5 Create Additional Routes

#### `src/routes/issuer.js`

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../../server.js';

const router = express.Router();

// Get issuer's documents
router.get('/documents', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('issuer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ documents: data });
  } catch (error) {
    next(error);
  }
});

// Issue a new document
router.post('/issue', [
  body('title').notEmpty().withMessage('Title is required'),
  body('documentType').notEmpty().withMessage('Document type is required'),
  body('ownerEmail').isEmail().withMessage('Valid owner email is required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { title, documentType, ownerEmail, documentPayload, expiryDate } = req.body;

    // Hash document
    const documentHash = require('crypto').createHash('sha256').update(JSON.stringify(documentPayload)).digest('hex');

    // Create document
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        issuer_id: userId,
        title,
        document_type: documentType,
        document_hash: documentHash,
        signed_credential: documentPayload,
        issuer_signature: 'signed-by-issuer', // Replace with actual signature
        issuance_date: new Date(),
        expiry_date: expiryDate,
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: userId,
      action: 'document_issued',
      resource_type: 'document',
      resource_id: document.id,
      details: { title, documentType },
    });

    res.status(201).json({
      message: 'Document issued successfully',
      document,
    });
  } catch (error) {
    next(error);
  }
});

// Revoke document
router.post('/revoke/:documentId', [
  body('reason').optional(),
], async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;
    const { reason } = req.body;

    // Revoke
    const { error: revokeError } = await supabase
      .from('revocations')
      .insert({
        document_id: documentId,
        revoked_by_id: userId,
        reason,
      });

    if (revokeError) throw revokeError;

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'revoked' })
      .eq('id', documentId);

    // Log audit
    await supabase.from('audit_logs').insert({
      actor_id: userId,
      action: 'document_revoked',
      resource_type: 'document',
      resource_id: documentId,
      details: { reason },
    });

    res.json({ message: 'Document revoked successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### `src/routes/owner.js`

```javascript
import express from 'express';
import { supabase } from '../../server.js';

const router = express.Router();

// Get owner's documents
router.get('/documents', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ documents: data });
  } catch (error) {
    next(error);
  }
});

// Get verification requests
router.get('/verification-requests', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ requests: data });
  } catch (error) {
    next(error);
  }
});

// Approve verification request
router.post('/approve-verification/:requestId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { scope, timeLimit } = req.body;

    // Update request
    const { data: request, error } = await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        scope,
        time_limit: timeLimit,
        token_created_at: new Date(),
        token_expires_at: new Date(Date.now() + timeLimit * 60000),
      })
      .eq('id', requestId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log
    await supabase.from('audit_logs').insert({
      actor_id: userId,
      action: 'verification_approved',
      resource_type: 'verification_request',
      resource_id: requestId,
    });

    res.json({
      message: 'Verification approved',
      request,
    });
  } catch (error) {
    next(error);
  }
});

// Deny verification request
router.post('/deny-verification/:requestId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    await supabase
      .from('verification_requests')
      .update({ status: 'denied' })
      .eq('id', requestId)
      .eq('owner_id', userId);

    res.json({ message: 'Verification request denied' });
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### `src/routes/verification.js`

```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../../server.js';

const router = express.Router();

// Verify document with token
router.post('/verify', [
  body('documentId').notEmpty(),
  body('token').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId, token } = req.body;

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;

    // Check if revoked
    const { data: revocation } = await supabase
      .from('revocations')
      .select('id')
      .eq('document_id', documentId)
      .single();

    if (revocation) {
      return res.status(403).json({ error: 'Document has been revoked' });
    }

    // Verify signature (in production, verify actual crypto signature)
    // For now, just return the document

    res.json({
      verified: true,
      document,
      verificationTime: new Date(),
    });
  } catch (error) {
    next(error);
  }
});

// Request verification (as external verifier)
router.post('/request', [
  body('documentId').notEmpty(),
  body('verifierEmail').isEmail(),
  body('purpose').notEmpty(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentId, verifierEmail, purpose, requiredClaims } = req.body;

    // Get document to find owner
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;

    if (!document.owner_id) {
      return res.status(400).json({ error: 'Document has no owner assigned' });
    }

    // Create verification request
    const { data: request, error } = await supabase
      .from('verification_requests')
      .insert({
        document_id: documentId,
        verifier_email: verifierEmail,
        owner_id: document.owner_id,
        purpose,
        required_claims: requiredClaims,
        status: 'pending',
        request_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send push notification to owner

    res.status(201).json({
      message: 'Verification request created',
      request,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### `src/routes/admin.js`

```javascript
import express from 'express';
import { supabase } from '../../server.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Get all documents (admin only)
router.get('/documents', async (req, res, next) => {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

// Get statistics
router.get('/stats', async (req, res, next) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total documents
    const { count: totalDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    // Total verification requests
    const { count: totalRequests } = await supabase
      .from('verification_requests')
      .select('*', { count: 'exact', head: true });

    res.json({
      stats: {
        totalUsers,
        totalDocuments,
        totalVerificationRequests: totalRequests,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

#### `src/routes/health.js`

```javascript
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
```

### 4.6 Create Middleware Files

#### `src/middleware/auth.js`

```javascript
import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### `src/middleware/errorHandler.js`

```javascript
export default function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
```

### 4.7 Update `package.json`

```json
{
  "name": "signatura-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    // ... (from 4.1)
  },
  "devDependencies": {
    // ... (from 4.1)
  }
}
```

### 4.8 Test Backend Locally

```bash
npm run dev
```

Visit http://localhost:3000/api/health - should return OK!

---

## Part 5: Deploy to Railway

### 5.1 Push Code to GitHub

```bash
cd ..
git init
git add .
git commit -m "Initial commit: Signatura PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/signatura-pwa.git
git push -u origin main
```

### 5.2 Deploy Frontend

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect to your `signatura-pwa` repository
6. Select the `frontend` directory
7. Add environment variables:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=${{ services.backend.public.url }}/api
   ```
8. Click "Deploy"

### 5.3 Deploy Backend

1. In the same Railway project, click "New Service"
2. Select GitHub repo again
3. Select the `backend` directory
4. Add environment variables from `.env`:
   ```
   NODE_ENV=production
   PORT=3000
   SUPABASE_URL=your-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-secret
   FRONTEND_URL=${{ services.frontend.public.url }}
   ```
5. Click "Deploy"

### 5.4 Link Services

In Railway dashboard:
1. Click the backend service
2. Go to "Variables"
3. Add: `BACKEND_URL=${{ PUBLIC_URL }}`
4. Update frontend env var: `VITE_API_URL=${{ services.backend.public.url }}/api`

---

## Part 6: Testing

### Test Landing Page
Visit your Railway frontend URL - should see landing page

### Test Issuer Login
1. Click "Get Started"
2. Sign up with issuer credentials
3. Should see issuer dashboard

### Test Owner Login
1. Go to /login/owner
2. Sign up with owner credentials
3. Should see wallet

### Test Admin Login
1. Go to /login/admin
2. Use admin credentials
3. Should see admin panel

---

## Troubleshooting

### Database Connection Error
- Check SUPABASE_URL and keys in .env
- Verify tables exist in Supabase

### CORS Error
- Make sure FRONTEND_URL is set in backend
- Check frontend VITE_API_URL points to correct backend

### Build Fails on Railway
- Check all environment variables are set
- Verify Node version is 18+
- Check logs in Railway dashboard

---

## Next Steps

1. Create dashboard components for each role
2. Implement document issuance workflow
3. Build document verification flow
4. Add notification system
5. Implement selective disclosure
6. Set up proper cryptographic signing

