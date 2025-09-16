# CLI Scripts

This directory contains useful CLI scripts for managing the application.

## Create Admin User

Creates a new admin user by registering them with Supabase and promoting their role, or promotes an existing user to admin role.

### Usage

```bash
# Interactive mode (will prompt for password and name)
npm run create-admin <email>

# With all parameters
npm run create-admin <email> <password> <name>
```

### Examples

```bash
# Interactive mode - will prompt for password and name
npm run create-admin admin@example.com

# With all parameters provided
npm run create-admin admin@example.com mySecurePassword123 "Admin User"
```

### Prerequisites

1. Database must be running and accessible
2. Supabase must be properly configured
3. Environment variables must be set (SUPABASE_URL, SUPABASE_ANON_KEY)

### Process

The script follows this secure process:

1. **Check existing user**: Looks for user in local database
2. **If user exists**: Promotes them to admin role (if not already admin)
3. **If user doesn't exist**: 
   - Registers user with Supabase (handles password hashing/security)
   - Creates user record in local database with admin role
   - Links the Supabase user ID to local database record

### Security Features

- **Proper authentication**: Uses Supabase for secure password handling
- **Password validation**: Enforces minimum 6 character requirement
- **No password storage**: Passwords are never stored in local database
- **Supabase integration**: Leverages professional auth service
- **Error handling**: Graceful handling of existing users and edge cases

### Alternative: Manual Registration + Promotion

If you prefer, you can also:

1. Have the user register normally via the API:
```bash
POST /api/auth/register
```
```json
{
  "email": "admin@example.com",
  "password": "secure_password",
  "name": "Admin User",
  "phone": "1234567890"
}
```

2. Then run the script to promote them:
```bash
npm run create-admin admin@example.com
```

### Troubleshooting

- **"User already registered"**: The email exists in Supabase but not locally - script will attempt to link them
- **"Supabase registration failed"**: Check your Supabase configuration and network connectivity
- **"Password too short"**: Ensure password is at least 6 characters
- **"Database connection failed"**: Verify your database is running and connection settings are correct
