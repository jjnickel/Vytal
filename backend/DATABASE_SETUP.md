# Database Setup Guide

This guide will help you set up MySQL for the AI Fitness application.

## Prerequisites

- MySQL Server installed and running (version 5.7+ or 8.0+)
- Node.js and npm installed

## Step 1: Install MySQL

If you don't have MySQL installed:

- **Windows**: Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
- **macOS**: `brew install mysql` or download from MySQL website
- **Linux**: `sudo apt-get install mysql-server` (Ubuntu/Debian) or use your distribution's package manager

Start MySQL service:
- **Windows**: MySQL should start automatically, or use Services
- **macOS**: `brew services start mysql`
- **Linux**: `sudo systemctl start mysql`

## Step 2: Configure Environment Variables

Create a `.env` file in the `backend` directory (or copy from `.env.example` if it exists):

```env
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=aifitness

# JWT Secret (use a strong random string in production)
JWT_SECRET=your_jwt_secret_here

# OpenAI API Key (optional, for AI workout generation)
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: Replace `your_mysql_password_here` with your actual MySQL root password (or create a dedicated user).

## Step 3: Initialize the Database

Run the database initialization script:

```bash
cd backend
node src/database/init.js
```

This will:
- Create the `aifitness` database if it doesn't exist
- Create all necessary tables (users, workout_logs, workout_exercises, weight_entries, nutrition_entries, workout_plans)

Alternatively, you can manually run the SQL schema:

```bash
mysql -u root -p < src/database/schema.sql
```

## Step 4: Verify Database Connection

Start the backend server:

```bash
npm start
```

Check the console output. You should see:
- `✅ Database connected successfully` if the connection is working
- `⚠️ Warning: Database connection failed` if there's an issue

You can also test the connection via the health endpoint:

```bash
curl http://localhost:3000/health
```

## Database Schema

The database includes the following tables:

### `users`
- Stores user account information (id, name, email, password_hash)

### `workout_logs`
- Stores workout session information (id, user_id, date)

### `workout_exercises`
- Stores individual exercises within a workout (id, workout_log_id, exercise_name, sets, reps, weight, rpe)

### `weight_entries`
- Stores weight tracking data (id, user_id, weight, date)

### `nutrition_entries`
- Stores nutrition/meal data (id, user_id, meal, calories, protein, carbs, fat, date)

### `workout_plans`
- Stores AI-generated workout plans (id, user_id, goal, experience, plan_data as JSON)

## Troubleshooting

### Connection Refused
- Make sure MySQL server is running
- Check that the port (default 3306) is not blocked by firewall
- Verify DB_HOST in `.env` is correct

### Access Denied
- Verify DB_USER and DB_PASSWORD in `.env` are correct
- Make sure the MySQL user has proper permissions
- Try creating a dedicated database user:
  ```sql
  CREATE USER 'aifitness_user'@'localhost' IDENTIFIED BY 'your_password';
  GRANT ALL PRIVILEGES ON aifitness.* TO 'aifitness_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

### Database Doesn't Exist
- Run the initialization script: `node src/database/init.js`
- Or manually create: `CREATE DATABASE aifitness;`

### Tables Already Exist
- The initialization script is idempotent - it's safe to run multiple times
- It will skip creating tables that already exist

## Production Considerations

For production deployments:

1. **Use a dedicated database user** with limited privileges (not root)
2. **Use strong passwords** for database and JWT secret
3. **Enable SSL** for database connections
4. **Set up database backups** regularly
5. **Use connection pooling** (already configured in `database.js`)
6. **Monitor database performance** and optimize queries as needed
7. **Consider using environment-specific databases** (dev, staging, production)

## Manual Database Access

To access the database directly:

```bash
mysql -u root -p aifitness
```

Or with a specific user:

```bash
mysql -u aifitness_user -p aifitness
```

## Useful SQL Queries

View all users:
```sql
SELECT id, name, email, created_at FROM users;
```

View workout logs for a user:
```sql
SELECT wl.*, COUNT(we.id) as exercise_count 
FROM workout_logs wl 
LEFT JOIN workout_exercises we ON wl.id = we.workout_log_id 
WHERE wl.user_id = 1 
GROUP BY wl.id;
```

View weight entries:
```sql
SELECT * FROM weight_entries WHERE user_id = 1 ORDER BY date DESC;
```

