# Signatura PWA - Implementation Plan

## Tech Stack
- **Frontend**: React + Vite (PWA ready)
- **Backend**: Supabase (Auth, DB, Real-time)
- **Hosting**: Railway (API backend + Static hosting)
- **Package Manager**: npm/pnpm

## Project Structure

```
signatura-pwa/
├── frontend/                    # React PWA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── IssuerLogin.jsx
│   │   │   │   ├── OwnerLogin.jsx
│   │   │   │   └── AdminLogin.jsx
│   │   │   ├── Issuer/
│   │   │   │   ├── IssueDashboard.jsx
│   │   │   │   ├── DocumentForm.jsx
│   │   │   │   ├── IssueDocument.jsx
│   │   │   │   └── AuditLogs.jsx
│   │   │   ├── Owner/
│   │   │   │   ├── WalletDashboard.jsx
│   │   │   │   ├── DocumentList.jsx
│   │   │   │   ├── DocumentDetail.jsx
│   │   │   │   ├── VerificationRequest.jsx
│   │   │   │   ├── ConsentModal.jsx
│   │   │   │   └── AuditTrail.jsx
│   │   │   ├── Admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── IssuerManagement.jsx
│   │   │   │   ├── RevocationManagement.jsx
│   │   │   │   ├── SystemAudit.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   └── Common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── IssuerPortal.jsx
│   │   │   ├── OwnerPortal.jsx
│   │   │   ├── AdminPortal.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Home.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useDocument.js
│   │   │   ├── useVerification.js
│   │   │   └── useOffline.js
│   │   ├── utils/
│   │   │   ├── crypto.js
│   │   │   ├── supabase.js
│   │   │   ├── validation.js
│   │   │   └── formatters.js
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── documentStore.js
│   │   │   └── uiStore.js
│   │   ├── styles/
│   │   │   ├── tailwind.css
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── manifest.json
│   ├── public/
│   │   ├── icons/
│   │   ├── sw.js (Service Worker)
│   │   └── favicon.ico
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── backend/                     # API Server (Railway)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── issuer.js
│   │   │   ├── owner.js
│   │   │   ├── verification.js
│   │   │   ├── admin.js
│   │   │   └── health.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── roleCheck.js
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── issuerController.js
│   │   │   ├── ownerController.js
│   │   │   ├── verificationController.js
│   │   │   └── adminController.js
│   │   ├── services/
│   │   │   ├── cryptoService.js
│   │   │   ├── documentService.js
│   │   │   ├── verificationService.js
│   │   │   ├── auditService.js
│   │   │   └── emailService.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Document.js
│   │   │   ├── VerificationRequest.js
│   │   │   ├── RevocationRegistry.js
│   │   │   └── AuditLog.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── app.js
│   ├── package.json
│   ├── .env.example
│   └── server.js
└── README.md
```

## Database Schema (Supabase)

```sql
-- Users Table (Supabase Auth integration)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('issuer', 'owner', 'admin')),
  organization_name TEXT,
  public_key TEXT,
  did TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID NOT NULL REFERENCES users(id),
  owner_id UUID,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_hash TEXT NOT NULL UNIQUE,
  document_blob TEXT, -- Encrypted JSON or PDF reference
  signed_credential JSONB NOT NULL, -- VC/JWT credential
  issuer_signature TEXT NOT NULL,
  issuance_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification Requests Table
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  verifier_id UUID NOT NULL REFERENCES users(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL,
  required_claims JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  scope TEXT, -- 'full', 'partial', or specific claims list
  time_limit INTEGER, -- minutes (NULL = one-time only)
  verification_token TEXT,
  token_created_at TIMESTAMP,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Revocation Registry
CREATE TABLE revocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  revoked_by_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  revoked_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  document_id UUID REFERENCES documents(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_issuer_id ON documents(issuer_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## Authentication Flow

1. **Supabase Auth** for email/password authentication
2. **JWT tokens** issued by Supabase
3. **Role-based access control** on both frontend and backend
4. **Session persistence** using IndexedDB for offline support

## PWA Features

- **Offline-first** with Service Worker
- **Installable** on mobile and desktop
- **Background sync** para sa verification requests
- **Push notifications** (optional)
- **Local storage** para sa drafts at cached data

## Security Highlights

- End-to-end encryption para sa sensitive documents
- JWT token verification sa backend
- CORS at rate limiting
- Data encryption at rest (Supabase)
- TLS/HTTPS everywhere

