const { query } = require('../config/database');

class WorkoutPlan {
  // Create or update a workout plan for a user
  static async createOrUpdate({ userId, goal, experience, planData }) {
    const sql = `
      INSERT INTO workout_plans (user_id, goal, experience, plan_data)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        goal = VALUES(goal),
        experience = VALUES(experience),
        plan_data = VALUES(plan_data),
        updated_at = CURRENT_TIMESTAMP
    `;
    const result = await query(sql, [userId, goal, experience, JSON.stringify(planData)]);
    return {
      id: result.insertId,
      userId,
      goal,
      experience,
      planData,
    };
  }

  // Get the latest workout plan for a user
  static async findByUserId(userId) {
    const sql = `
      SELECT id, user_id as userId, goal, experience, plan_data as planData, created_at as createdAt, updated_at as updatedAt
      FROM workout_plans
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const results = await query(sql, [userId]);
    if (results.length === 0) return null;
    
    const plan = results[0];
    return {
      ...plan,
      planData: typeof plan.planData === 'string' ? JSON.parse(plan.planData) : plan.planData,
    };
  }

  // Get workout plan by ID
  static async findById(id) {
    const sql = `
      SELECT id, user_id as userId, goal, experience, plan_data as planData, created_at as createdAt, updated_at as updatedAt
      FROM workout_plans
      WHERE id = ?
    `;
    const results = await query(sql, [id]);
    if (results.length === 0) return null;
    
    const plan = results[0];
    return {
      ...plan,
      planData: typeof plan.planData === 'string' ? JSON.parse(plan.planData) : plan.planData,
    };
  }

  // Delete a workout plan
  static async delete(id) {
    const sql = 'DELETE FROM workout_plans WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = WorkoutPlan;

