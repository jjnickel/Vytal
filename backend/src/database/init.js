/**
 * Database initialization script
 * 
 * This script creates the database and all tables if they don't exist.
 * Run this with: node src/database/init.js
 * 
 * Make sure your .env file is configured with the correct database credentials.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
  let connection;
  
  try {
    // Check if .env file exists and show configuration
    const envPath = path.join(__dirname, '../../.env');
    const envExists = fs.existsSync(envPath);
    
    if (!envExists) {
      console.warn('⚠️  Warning: .env file not found. Using default values.');
    }
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Sw6m03040506',
    };
    
    console.log('📋 Database configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ${dbConfig.password ? '***' : '(empty)'}`);
    console.log('   Attempting connection...\n');
    
    // Connect to MySQL server (without selecting a database first)
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connected to MySQL server');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute each statement
    // Better handling for multi-line statements and comments
    const statements = schema
      .split(';')
      .map(stmt => {
        // Remove single-line comments
        return stmt.split('\n')
          .map(line => {
            const commentIndex = line.indexOf('--');
            if (commentIndex >= 0) {
              return line.substring(0, commentIndex);
            }
            return line;
          })
          .join('\n')
          .trim();
      })
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.query(statement);
          // Show progress for key statements
          if (statement.toUpperCase().includes('CREATE DATABASE')) {
            console.log('✅ Database created');
          } else if (statement.toUpperCase().includes('CREATE TABLE')) {
            // Better regex to extract table name, handling IF NOT EXISTS
            const tableMatch = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:`?(\w+)`?|(\w+))/i);
            if (tableMatch) {
              const tableName = tableMatch[1] || tableMatch[2];
              if (tableName && tableName.toUpperCase() !== 'IF' && tableName.toUpperCase() !== 'NOT' && tableName.toUpperCase() !== 'EXISTS') {
                console.log(`✅ Table created: ${tableName}`);
              }
            }
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate') ||
              error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.code === 'ER_DB_CREATE_EXISTS') {
            // Silently ignore - these are expected if running multiple times
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`);
            console.error(`   ${error.message}`);
            console.error(`   Code: ${error.code}`);
            throw error; // Re-throw unexpected errors
          }
        }
      }
    }

    console.log('✅ Database schema initialized successfully');
    console.log('✅ Tables created: users, workout_logs, workout_exercises, weight_entries, nutrition_entries, workout_plans');
    
  } catch (error) {
    console.error('❌ Error initializing database:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Full error:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure MySQL server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Tip: Check your DB_USER and DB_PASSWORD in .env file');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Tip: Check your DB_HOST in .env file');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();

