# Environment Variables Setup

## Quick Fix for MySQL Connection Error

If you're getting `Access denied for user 'root'@'localhost' (using password: NO)`, you need to add your MySQL password to the `.env` file.

## Steps:

1. **Open `backend/.env` file** in your editor

2. **Add or update the `DB_PASSWORD` line**:
   ```env
   DB_PASSWORD=your_mysql_root_password_here
   ```

3. **If you don't know your MySQL root password**, you have a few options:

   **Option A: Try common defaults**
   - Empty password: `DB_PASSWORD=`
   - Common passwords: `root`, `password`, `admin`
   
   **Option B: Reset MySQL root password**
   - Stop MySQL service: `net stop MySQL95`
   - Start MySQL in safe mode (see MySQL documentation)
   - Or use MySQL Workbench to reset password
   
   **Option C: Create a new MySQL user** (recommended for development)
   ```sql
   CREATE USER 'aifitness'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON aifitness.* TO 'aifitness'@'localhost';
   FLUSH PRIVILEGES;
   ```
   Then use in `.env`:
   ```env
   DB_USER=aifitness
   DB_PASSWORD=your_password
   ```

## Complete .env Example:

```env
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=aifitness

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# OpenAI API Key (optional)
OPENAI_API_KEY=your_openai_api_key_here
```

## After updating .env:

Run the database initialization:
```bash
npm run db:init
```

Or:
```bash
node src/database/init.js
```

