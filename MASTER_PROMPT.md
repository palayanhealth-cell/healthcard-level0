# Palayan City Health Card System - Master Context

## Project Overview
- **Name**: Palayan City Health Card System
- **Repository**: `playancardrevamp` (cloned from GitHub)
- **Main App Location**: `healthcard-app/`
- **Tech Stack**: Ionic React + Vite + TypeScript + Supabase

## Database Connection (Supabase)
- **Project ID**: `qzrfzpzfgqctrkkthhvk`
- **Project Name**: `palayancityhealthcare`
- **URL**: `https://qzrfzpzfgqctrkkthhvk.supabase.co`
- **Status**: ✅ Connected and operational
- **MCP Config Location**: `~/.codeium/windsurf/mcp_config.json`

## Database Schema

### Tables
1. **profiles** (3 rows, RLS enabled)
   - id, email, username, full_name, role, account_status, must_change_password, created_at, updated_at

2. **auth.users** (managed by Supabase Auth)
   - Stores encrypted passwords using bcrypt

### User Accounts (Created with Working Passwords)

| Username | Email | Role | Password |
|----------|-------|------|----------|
| superadmin | admin@palayanhealth.gov.ph | super_admin | Admin@2026! |
| jsmith1 | jsmith1@gmail.com | encoder | Encoder2026!@ |
| bwayne | bwayne@gmail.com | encoder | Encoder2026! |

**Password Hashes (bcrypt)**:
- Admin: `$2a$10$GA2/UgEacISLgP/RTJYUkudk3KIGDBezt6QQJAjaZwEZFQYF67Lh2`
- Encoder1: `$2a$10$fSWswq9BcHvGI1kchZgiIenQdwHIMSy9LH1wpHr8lHBaEoJ0gtEDu`
- Encoder2: `$2a$10$aWA4DpYMOVPQ0xoTXRzGAO/NTBthANCi6IyyAwmjoU8HvH0X2pR0.`

## Key Application Files

### Configuration
- `healthcard-app/.env` - Contains Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- `healthcard-app/vite.config.ts` - Vite configuration
- `healthcard-app/ionic.config.json` - Ionic config

### Core Services
- `healthcard-app/src/lib/supabase.ts` - Supabase client initialization
- `healthcard-app/src/services/authService.ts` - Authentication logic (login, password reset, etc.)
- `healthcard-app/src/services/healthCardService.ts` - Health card operations
- `healthcard-app/src/services/draftService.ts` - Local draft persistence

### Main Pages
- `healthcard-app/src/pages/LoginPage.tsx` - Login with role selection (Client/Encoder/Admin)
- `healthcard-app/src/pages/EncoderFormPage.tsx` - Multi-step encoder registration
- `healthcard-app/src/pages/EncoderClientsPage.tsx` - Draft list and resume
- `healthcard-app/src/pages/Admin*.tsx` - Admin portal pages

### Edge Functions (Supabase)
- `supabase/functions/staff-admin/index.ts` - Staff management (create/update/delete/reset_password)
- **Deployed**: Version 3, Status: ACTIVE
- **Actions**: create, update, delete, reset_password
- **Permissions**: super_admin only for sensitive operations

### Routing (App.tsx)
```
/ - Landing (redirects based on role)
/login - Login page
/admin - Admin dashboard (admin/super_admin only)
/encoder - Encoder dashboard (encoder only)
/client - Client portal
/change-password - Password change (when must_change_password=true)
```

## Important Features

### Authentication Flow
1. Login supports **email OR username**
2. Uses `resolve_login_email` RPC function for username resolution
3. Role-based redirects after login
4. Password reset via Supabase Auth

### Security
- RLS enabled on all tables
- JWT-based authentication
- Role-based access control (super_admin, admin, encoder)
- Password requirements: minimum 8 characters

### Local Development
- **Start script**: `start-server.bat` (double-click to run)
- **Dev server**: `http://localhost:5173`
- **Command**: `npm run dev` (from healthcard-app/)

## Current Status
- ✅ Repository cloned and configured
- ✅ Supabase MCP connected
- ✅ Database users created with working passwords
- ✅ Edge function deployed (staff-admin v3)
- ✅ Environment variables set
- ✅ Dependencies installed (npm install completed)

## Known Issues & Notes
- Last password update was successful (bcrypt hashes properly set)
- Users can now login with the credentials above
- If login fails, check that dev server is running on localhost:5173
- Admin role selection in login page must match the user's actual role in database

## Testing Checklist
1. Start server with `start-server.bat`
2. Open `http://localhost:5173`
3. Select appropriate role (Admin for superadmin account)
4. Enter email/username and password
5. Should redirect to role-specific dashboard

## Future AI Instructions
When continuing work on this project:
1. Verify Supabase MCP connection is active
2. Check database tables before making schema changes
3. Test authentication flow when modifying auth-related code
4. Use existing patterns in authService.ts for new features
5. Maintain RLS policies for security
6. Update Edge Functions via MCP deploy tool when modifying supabase/functions/
