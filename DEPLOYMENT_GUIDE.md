# Signatura PWA - Deployment Guide

## Prerequisites
- Node.js 18+
- Railway account (https://railway.app)
- Supabase account (https://supabase.com)
- GitHub account

## Step 1: Supabase Setup

### Create Project
1. Go to supabase.com and create a new project
2. Note your project URL and anon key
3. Create tables using the SQL schema provided in SIGNATURA_PWA_PLAN.md

### Enable Authentication
1. Go to Authentication > Providers
2. Enable Email/Password provider
3. Set up JWT secret in Authentication > JWT Settings

### Get API Keys
1. Go to Settings > API
2. Copy:
   - Project URL
   - anon key (public)
   - service_role key (private - for backend only)

## Step 2: Setup Frontend

```bash
# Clone or create project
mkdir signatura-pwa
cd signatura-pwa/frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Fill in Supabase keys
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-railway-backend.up.railway.app/api
```

### Build for PWA
```bash
npm run build
```

## Step 3: Setup Backend

```bash
cd ../backend

# Install dependencies
npm install

# Create .env
cp ../.env.example .env

# Fill in credentials
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=generate-a-long-random-string
FRONTEND_URL=https://your-railway-frontend.up.railway.app
```

## Step 4: Deploy to Railway

### Frontend Deployment

1. **Connect GitHub**
   - Push your frontend folder to GitHub
   - Go to railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

2. **Configure Build**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Start Command: `npm run preview` (or serve dist folder)
   - Add Environment Variables:
     ```
     VITE_SUPABASE_URL=your-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     VITE_API_URL=${{BACKEND_URL}}/api
     ```

3. **Deploy**
   - Click Deploy
   - Railway will automatically deploy on every push

### Backend Deployment

1. **Create Backend Service**
   - In your Railway project, click "New Service"
   - Select "Deploy from GitHub repo"
   - Choose your repository (backend folder)

2. **Configure Build**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add Environment Variables**
   - In Railway dashboard, go to your backend service
   - Go to Variables tab
   - Add all from .env:
     ```
     NODE_ENV=production
     PORT=3000
     SUPABASE_URL=your-url
     SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     JWT_SECRET=your-secret
     FRONTEND_URL=${{FRONTEND_URL}}
     ```

4. **Link Services**
   - In Railway, create a reference:
   - Backend Variable: `BACKEND_URL` = your backend public URL
   - Frontend Variable: `VITE_API_URL` = `${{BACKEND_URL}}/api`

## Step 5: Supabase Database Setup

Run this SQL in Supabase SQL Editor:

```sql
-- Create users table
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

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID NOT NULL REFERENCES users(id),
  owner_id UUID,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_hash TEXT NOT NULL UNIQUE,
  document_blob TEXT,
  signed_credential JSONB NOT NULL,
  issuer_signature TEXT NOT NULL,
  issuance_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification_requests table
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  verifier_id UUID NOT NULL REFERENCES users(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL,
  required_claims JSONB,
  status TEXT DEFAULT 'pending',
  scope TEXT,
  time_limit INTEGER,
  verification_token TEXT,
  token_created_at TIMESTAMP,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create revocations table
CREATE TABLE revocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  revoked_by_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  revoked_at TIMESTAMP DEFAULT NOW()
);

-- Create audit_logs table
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

-- Create indexes
CREATE INDEX idx_documents_issuer_id ON documents(issuer_id);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

## Step 6: Testing

### Test Issuer Flow
1. Go to `https://your-app.up.railway.app/login`
2. Sign up as issuer
3. Create and sign a document
4. Check if signed credential is stored

### Test Owner Flow
1. Sign up as document owner
2. Receive issued document
3. Store in wallet
4. Grant verification permission

### Test Admin Flow
1. Sign up as admin
2. View all documents and users
3. Manage revocations
4. View audit logs

## Step 7: Database Migrations (Future)

When you need to update schema:

```bash
# Create migration file
npm run migrate create add_new_field

# Run migrations
npm run migrate up
```

## Monitoring & Logging

### In Railway Dashboard
- View logs in real-time
- Monitor CPU, Memory usage
- Check deployment status
- Set up alerts

### Supabase Monitoring
- Go to Supabase Dashboard
- Monitor API usage
- Check database performance
- View auth logs

## Scaling Tips

1. **Database**
   - Enable Supabase replication
   - Use read replicas for heavy queries
   - Optimize indexes

2. **Backend**
   - Use Railway horizontal scaling
   - Cache issuer public keys
   - Implement request queuing

3. **Frontend**
   - Use CDN for static files
   - Implement lazy loading
   - Optimize bundle size

## Security Checklist

- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Rotate keys regularly
- [ ] Enable audit logging
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable Row Level Security in Supabase
- [ ] Implement CSRF protection
- [ ] Add input validation

## Troubleshooting

### Frontend build fails
- Check Node version: `node --version`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check .env variables

### Backend not connecting to Supabase
- Verify SUPABASE_URL and keys
- Check network/firewall
- Look at Railway logs

### Database connection errors
- Verify DATABASE_URL format
- Check if tables exist
- Run migrations

### CORS errors
- Update FRONTEND_URL in backend
- Check CORS middleware settings
- Verify API routes

## Support
- Railway docs: https://docs.railway.app
- Supabase docs: https://supabase.com/docs
- Vite PWA: https://vite-pwa-org.netlify.app
