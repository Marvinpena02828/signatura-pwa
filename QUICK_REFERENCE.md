# Signatura PWA - Quick Reference Guide

## 📋 Project Summary

Gawa natin ang Signatura - isang PWA para mag-issue, i-manage, at mag-verify ng digital credentials gamit ang cryptographic signatures. May landing page, role-based login (Issuer, Owner, Admin), at PostgreSQL database via Supabase.

## 🎯 Key Features

✅ **Landing Page** - Marketing & feature showcase (like Twala)
✅ **Role-Based Login** - Separate portals para sa 3 users
✅ **Progressive Web App** - Installable, offline-ready, mobile-friendly
✅ **PostgreSQL Database** - Supabase with proper schema
✅ **Express Backend** - API routes para sa lahat ng features
✅ **Railway Deployment** - One-click deploy sa production

## 📁 Files Created

### Documentation
- `SIGNATURA_PWA_PLAN.md` - Original architecture
- `REVISED_ARCHITECTURE.md` - Updated with PostgreSQL & landing page
- `COMPLETE_SETUP_GUIDE.md` - Step-by-step setup instructions

### Frontend Components
- `Landing.jsx` - Professional landing page with hero, features, pricing
- `AllLoginPages.jsx` - All 3 login pages (Issuer, Owner, Admin)
- `AppComplete.jsx` - Main App with routing
- `authStore.js` - Zustand auth state management
- `supabase.js` - Supabase client & helper functions
- `vite.config.js` - Vite PWA configuration

### Backend
- `server.js` - Express server setup
- `auth.js` - Authentication routes (signup, signin, logout)
- Additional routes (issuer.js, owner.js, verification.js, admin.js)
- Middleware (auth.js, errorHandler.js)

### Configuration
- `frontend-package.json` - Frontend dependencies
- `backend-package.json` - Backend dependencies
- `.env.example` - Environment variables template

## 🚀 Quick Start

### Step 1: Setup Supabase (5 mins)
```bash
1. Go to supabase.com
2. Create new project
3. Copy Project URL & API keys
4. Run SQL schema from REVISED_ARCHITECTURE.md
5. Create demo users (issuer@demo.com, owner@demo.com, admin@signatura.com)
```

### Step 2: Setup Frontend (10 mins)
```bash
cd frontend
npm install
# Copy all files into src/
# Create .env.local with Supabase keys
npm run dev
# Visit http://localhost:5173
```

### Step 3: Setup Backend (10 mins)
```bash
cd backend
npm install
# Copy all route files
# Create .env with Supabase keys
npm run dev
# Visit http://localhost:3000/api/health
```

### Step 4: Deploy to Railway (5 mins)
```bash
# Push to GitHub
git push origin main

# Connect Railway to GitHub repo
# Set environment variables
# Deploy!
```

## 🎨 Design Colors

- **Issuer**: Blue (#3B82F6)
- **Owner**: Green (#10B981)
- **Admin**: Purple (#A855F7)
- **Primary**: Gray (#1F2937)

## 📊 Database Tables (PostgreSQL)

1. **users** - Auth linked profiles
2. **documents** - Issued credentials
3. **verification_requests** - Access requests
4. **revocations** - Revoked documents
5. **audit_logs** - Activity tracking
6. **issuer_keys** - Public key registry
7. **allowed_verifiers** - Allowlist (optional)

## 🔑 Environment Variables

### Frontend (.env.local)
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3000/api
```

### Backend (.env)
```
NODE_ENV=development
PORT=3000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-super-secret-key-32-chars-min
FRONTEND_URL=http://localhost:5173
```

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Issuer | issuer@demo.com | Demo@1234 |
| Owner | owner@demo.com | Demo@1234 |
| Admin | admin@signatura.com | Admin@1234 |

## 📝 API Endpoints

### Auth
```
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/logout
POST /api/auth/verify-token
POST /api/auth/refresh-token
```

### Issuer
```
GET  /api/issuer/documents
POST /api/issuer/issue
POST /api/issuer/revoke/:documentId
```

### Owner
```
GET  /api/owner/documents
GET  /api/owner/verification-requests
POST /api/owner/approve-verification/:requestId
POST /api/owner/deny-verification/:requestId
```

### Verification
```
POST /api/verify/verify
POST /api/verify/request
```

### Admin
```
GET /api/admin/users
GET /api/admin/documents
GET /api/admin/audit-logs
GET /api/admin/stats
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | Zustand |
| Authentication | Supabase Auth |
| Database | PostgreSQL (via Supabase) |
| Backend | Express.js, Node.js |
| Hosting | Railway |
| PWA | Service Worker, Workbox |

## 📦 Project Structure

```
signatura-pwa/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing/
│   │   │   ├── Login/
│   │   │   └── Dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── config/
│   ├── server.js
│   ├── .env
│   └── package.json
└── README.md
```

## 🔄 User Flows

### Issuer Flow
1. Landing → Get Started
2. /login/issuer → Sign up
3. Dashboard → Create & issue credentials
4. View issued documents & audit logs

### Owner Flow
1. Landing → Document Owners
2. /login/owner → Sign up
3. Wallet → View received credentials
4. Approve/deny verification requests
5. View audit trail

### Admin Flow
1. Landing (admin link in footer)
2. /login/admin → Sign in
3. Dashboard → Manage users, documents, revocations
4. View system statistics & audit logs

## 🚨 Important Notes

⚠️ **Use PostgreSQL on Supabase** (NOT MySQL)
⚠️ **Store service_role_key securely** (backend only)
⚠️ **Enable RLS policies** for data security
⚠️ **Set proper CORS on backend**
⚠️ **Use HTTPS in production**
⚠️ **Rotate JWT secret regularly**

## 📱 PWA Features

✅ Installable on mobile & desktop
✅ Offline-first with Service Worker
✅ Push notifications ready
✅ Background sync support
✅ Add to home screen

## 🔐 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS everywhere
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all routes
- [ ] Audit logging active
- [ ] RLS policies enabled
- [ ] Environment variables secure
- [ ] No sensitive data in logs
- [ ] Regular key rotation

## 📚 Next Steps

1. Create complete dashboard components
2. Implement document issuance workflow
3. Build verification request UI
4. Add crypto signing (Ed25519/RSA)
5. Implement selective disclosure
6. Add notification system
7. Create admin analytics
8. Add email notifications
9. Implement 2FA
10. Add rate limiting per user

## 🆘 Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **Vite PWA**: https://vite-pwa-org.netlify.app
- **Railway Docs**: https://docs.railway.app
- **React Router**: https://reactrouter.com

## 📞 Support

For issues or questions:
1. Check COMPLETE_SETUP_GUIDE.md troubleshooting section
2. Review environment variables
3. Check Railway & Supabase logs
4. Verify network connectivity

---

**Created**: December 2025
**Version**: 1.0.0
**Status**: Ready for Development

