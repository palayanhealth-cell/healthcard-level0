# Supabase Admin Setup - Complete ✅

## Database Status
- ✅ Tables created: `profiles`, `health_cards`
- ✅ RLS policies configured
- ✅ Super admin user ready

## Existing Admin User
```
Email: palayanhealth@gmail.com
Username: palayanhealth_admin
Role: super_admin
Account Status: active
Password Change: not required
```

## Connection Details
```
Supabase URL: https://jixadvnvbvsjczwvelvd.supabase.co
Publishable Key: sb_publishable_ulRF5KIEJ5fh_k-QqTg0PA_G4g8AHUD
Database: postgresql://postgres:PalayanH2020@db.jixadvnvbvsjczwvelvd.supabase.co:5432/postgres
```

## How to Create Additional Users

### Method 1: Supabase Dashboard (Recommended)
1. Go to https://jixadvnvbvsjczwvelvd.supabase.co
2. Authentication > Users > "Add user"
3. Create user with email and temporary password
4. Go to Database > profiles > "Insert row"
5. Use the user's ID as the profile ID

### Method 2: SQL via MCP
```sql
-- First create auth user (requires service role)
-- Then create profile:
INSERT INTO public.profiles (id, email, username, full_name, role, account_status, must_change_password)
VALUES ('user-uuid-here', 'email@example.com', 'username', 'Full Name', 'role', 'active', false);
```

## User Roles Available
- `super_admin` - Full system access
- `admin` - Staff and client management
- `encoder` - Health card registration
- `client` - View own health card

## Test the Application
1. Open the deployed app: https://healthcard-qmavjajfo-palayanhealth-cells-projects.vercel.app
2. Login with:
   - Username: `palayanhealth_admin`
   - Password: (contact admin for password)
   - Role: `admin`

## MCP Features Enabled
- ✅ Database management
- ✅ User management  
- ✅ Table creation
- ✅ Policy management
- ✅ Storage management
- ✅ Function creation

**The system is fully operational with AI control!** 🚀
