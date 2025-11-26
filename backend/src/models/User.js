const { query } = require('../config/database');

class User {
  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    return results[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT id, name, email, created_at FROM users WHERE id = ?';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Create a new user
  static async create({ name, email, passwordHash }) {
    const sql = 'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)';
    const result = await query(sql, [name, email, passwordHash]);
    return {
      id: result.insertId,
      name,
      email,
    };
  }

  // Update user
  static async update(id, { name, email }) {
    const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    await query(sql, [name, email, id]);
    return await this.findById(id);
  }

  // Delete user
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = User;

