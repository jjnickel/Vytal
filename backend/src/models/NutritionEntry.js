const { query } = require('../config/database');

class NutritionEntry {
  // Create a new nutrition entry
  static async create({ userId, meal, calories, protein, carbs, fat, date }) {
    const sql = `
      INSERT INTO nutrition_entries (user_id, meal, calories, protein, carbs, fat, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [userId, meal, calories || 0, protein || 0, carbs || 0, fat || 0, date]);
    return {
      id: result.insertId,
      userId,
      meal,
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      date,
    };
  }

  // Get all nutrition entries for a user
  static async findByUserId(userId) {
    const sql = `
      SELECT id, user_id as userId, meal, calories, protein, carbs, fat, date, created_at as createdAt
      FROM nutrition_entries
      WHERE user_id = ?
      ORDER BY date DESC, created_at DESC
    `;
    return await query(sql, [userId]);
  }

  // Get nutrition entries for a specific date
  static async findByUserIdAndDate(userId, date) {
    const sql = `
      SELECT id, user_id as userId, meal, calories, protein, carbs, fat, date, created_at as createdAt
      FROM nutrition_entries
      WHERE user_id = ? AND date = ?
      ORDER BY created_at DESC
    `;
    return await query(sql, [userId, date]);
  }

  // Get daily totals for a date range
  static async getDailyTotals(userId, startDate, endDate) {
    const sql = `
      SELECT 
        date,
        SUM(calories) as totalCalories,
        SUM(protein) as totalProtein,
        SUM(carbs) as totalCarbs,
        SUM(fat) as totalFat
      FROM nutrition_entries
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date DESC
    `;
    return await query(sql, [userId, startDate, endDate]);
  }

  // Delete a nutrition entry
  static async delete(id) {
    const sql = 'DELETE FROM nutrition_entries WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = NutritionEntry;

