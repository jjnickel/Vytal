const { query } = require('../config/database');

class WeightEntry {
  // Create a new weight entry
  static async create({ userId, weight, date }) {
    const sql = `
      INSERT INTO weight_entries (user_id, weight, date)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE weight = VALUES(weight)
    `;
    const result = await query(sql, [userId, weight, date]);
    return {
      id: result.insertId || result.affectedRows > 0,
      userId,
      weight,
      date,
    };
  }

  // Get all weight entries for a user, ordered by date
  static async findByUserId(userId) {
    const sql = `
      SELECT id, user_id as userId, weight, date, created_at as createdAt
      FROM weight_entries
      WHERE user_id = ?
      ORDER BY date ASC
    `;
    return await query(sql, [userId]);
  }

  // Get weight entries for a date range
  static async findByUserIdAndDateRange(userId, startDate, endDate) {
    const sql = `
      SELECT id, user_id as userId, weight, date, created_at as createdAt
      FROM weight_entries
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `;
    return await query(sql, [userId, startDate, endDate]);
  }

  // Delete a weight entry
  static async delete(id) {
    const sql = 'DELETE FROM weight_entries WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = WeightEntry;

