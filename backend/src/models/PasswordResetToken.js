const crypto = require('crypto');
const { query } = require('../config/database');

class PasswordResetToken {
  static hash(plain) {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }

  static async create(userId) {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hash(plainToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
    await query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );

    return plainToken;
  }

  static async findValid(plainToken) {
    const tokenHash = this.hash(plainToken);
    const results = await query(
      'SELECT * FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );
    return results[0] || null;
  }

  static async deleteForUser(userId) {
    await query('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);
  }
}

module.exports = PasswordResetToken;
