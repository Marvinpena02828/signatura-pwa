# Signatura PWA - Revised Architecture

## New Structure

```
signatura-pwa/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing/
│   │   │   │   ├── index.jsx          # Main landing page (features, benefits)
│   │   │   │   ├── HeroSection.jsx    # Hero banner
│   │   │   │   ├── FeaturesSection.jsx
│   │   │   │   ├── HowItWorks.jsx
│   │   │   │   ├── CTASection.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── Login/
│   │   │   │   ├── IssuerLogin.jsx    # /login/issuer
│   │   │   │   ├── OwnerLogin.jsx     # /login/owner
│   │   │   │   └── AdminLogin.jsx     # /login/admin
│   │   │   ├── Dashboard/
│   │   │   │   ├── IssuerDashboard.jsx
│   │   │   │   ├── OwnerDashboard.jsx
│   │   │   │   └── AdminDashboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── AuthGuard.jsx
│   │   │   └── Common/
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── ErrorBoundary.jsx
│   │   │       └── Toast.jsx
│   │   └── App.jsx
│   └── ...
```

## User Flow

1. Visit https://signatura.app → **Landing Page** (features, benefits, pricing, etc.)
2. Click "Get Started" or "Login"
3. Choose role:
   - **Issuer** → /login/issuer
   - **Document Owner** → /login/owner
   - **Admin** → /login/admin
4. After login → Role-specific Dashboard

## Database: PostgreSQL (via Supabase)

Using Supabase with PostgreSQL (not MySQL) for better performance and features.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('issuer', 'owner', 'admin')),
  organization_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  public_key TEXT,
  did TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  phone_number TEXT,
  country TEXT,
  metadata JSONB DEFAULT '{}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL, -- degree, certificate, license, etc.
  document_hash TEXT NOT NULL UNIQUE,
  document_blob BYTEA, -- For storing encrypted document content
  document_url TEXT, -- For reference to external storage
  signed_credential JSONB NOT NULL, -- VC or JWT credential
  issuer_signature TEXT NOT NULL,
  issuance_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification Requests table
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verifier_email TEXT,
  verifier_org TEXT,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL, -- hiring, loan, credential check, etc.
  required_claims JSONB, -- specific fields to verify
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  scope TEXT, -- 'full', 'partial', or specific claims
  time_limit INTEGER DEFAULT 1440, -- minutes (default 24 hours)
  one_time_only BOOLEAN DEFAULT TRUE,
  verification_token TEXT,
  token_hash TEXT UNIQUE,
  token_created_at TIMESTAMP,
  token_expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  request_expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Revocations table
CREATE TABLE revocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  revoked_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  revoked_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL, -- signin, document_issued, verification_approved, etc.
  resource_type TEXT NOT NULL, -- user, document, verification_request
  resource_id UUID,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Issuer Public Keys registry (for external verifiers)
CREATE TABLE issuer_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  key_type TEXT NOT NULL, -- Ed25519, RSA, ES256, etc.
  algorithm TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(issuer_id, key_id)
);

-- Allowed Verifiers (optional allowlist feature)
CREATE TABLE allowed_verifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'full' CHECK (permission_level IN ('full', 'partial', 'one_time')),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_issuer_id ON documents(issuer_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_verification_requests_owner_id ON verification_requests(owner_id);
CREATE INDEX idx_verification_requests_verifier_id ON verification_requests(verifier_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_token_hash ON verification_requests(token_hash);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_revocations_document_id ON revocations(document_id);
CREATE INDEX idx_issuer_keys_issuer_id ON issuer_keys(issuer_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view/update their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Issuers can view their issued documents
CREATE POLICY "Issuers can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = issuer_id OR auth.uid() = owner_id);

-- Owners can view their documents
CREATE POLICY "Owners can view received documents"
  ON documents FOR SELECT
  USING (auth.uid() = owner_id);

-- Verification requests visible to relevant parties
CREATE POLICY "Verification visible to owner and verifier"
  ON verification_requests FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = verifier_id);

-- Admin access (via JWT role claim)
CREATE POLICY "Admins can view all"
  ON audit_logs FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
```

## Updated Auth Schema (Supabase)

Supabase uses PostgreSQL's `auth` schema. We link our `users` table to `auth.users`.

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'owner'); -- Default role
  RETURN new;
END;
$$;

-- Trigger for new auth users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
```

