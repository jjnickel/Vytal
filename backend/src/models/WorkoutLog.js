const { query } = require('../config/database');

class WorkoutLog {
  // Create a new workout log
  static async create({ userId, date, exercises }) {
    const connection = await require('../config/database').getConnection();
    try {
      await connection.beginTransaction();

      // Insert workout log
      const logSql = 'INSERT INTO workout_logs (user_id, date) VALUES (?, ?)';
      const [logResult] = await connection.execute(logSql, [userId, date]);
      const workoutLogId = logResult.insertId;

      // Insert exercises
      if (exercises && exercises.length > 0) {
        const exerciseSql = `
          INSERT INTO workout_exercises (workout_log_id, exercise_name, sets, reps, weight, rpe)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        for (const exercise of exercises) {
          await connection.execute(exerciseSql, [
            workoutLogId,
            exercise.name,
            exercise.sets || 1,
            exercise.reps || 1,
            exercise.weight || null,
            exercise.rpe || null,
          ]);
        }
      }

      await connection.commit();
      return { id: workoutLogId, userId, date, exercises };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get all workout logs for a user
  static async findByUserId(userId) {
    const sql = `
      SELECT 
        wl.id,
        wl.user_id as userId,
        wl.date,
        wl.created_at as createdAt,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', we.id,
            'name', we.exercise_name,
            'sets', we.sets,
            'reps', we.reps,
            'weight', we.weight,
            'rpe', we.rpe
          )
        ) as exercises
      FROM workout_logs wl
      LEFT JOIN workout_exercises we ON wl.id = we.workout_log_id
      WHERE wl.user_id = ?
      GROUP BY wl.id
      ORDER BY wl.date DESC
    `;
    const results = await query(sql, [userId]);
    
    // Parse JSON exercises (handle both string and already-parsed JSON)
    return results.map(log => {
      let exercises = [];
      if (log.exercises) {
        try {
          exercises = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
          // Filter out null entries (from LEFT JOIN when no exercises exist)
          exercises = exercises.filter(ex => ex && ex.id !== null);
        } catch (e) {
          exercises = [];
        }
      }
      return {
        ...log,
        exercises,
      };
    });
  }

  // Get a single workout log by ID
  static async findById(id) {
    const sql = `
      SELECT 
        wl.id,
        wl.user_id as userId,
        wl.date,
        wl.created_at as createdAt,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', we.id,
            'name', we.exercise_name,
            'sets', we.sets,
            'reps', we.reps,
            'weight', we.weight,
            'rpe', we.rpe
          )
        ) as exercises
      FROM workout_logs wl
      LEFT JOIN workout_exercises we ON wl.id = we.workout_log_id
      WHERE wl.id = ?
      GROUP BY wl.id
    `;
    const results = await query(sql, [id]);
    if (results.length === 0) return null;
    
    const log = results[0];
    let exercises = [];
    if (log.exercises) {
      try {
        exercises = typeof log.exercises === 'string' ? JSON.parse(log.exercises) : log.exercises;
        // Filter out null entries
        exercises = exercises.filter(ex => ex && ex.id !== null);
      } catch (e) {
        exercises = [];
      }
    }
    return {
      ...log,
      exercises,
    };
  }

  // Delete a workout log
  static async delete(id) {
    const sql = 'DELETE FROM workout_logs WHERE id = ?';
    await query(sql, [id]);
    return true;
  }
}

module.exports = WorkoutLog;

