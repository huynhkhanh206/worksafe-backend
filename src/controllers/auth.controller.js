const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');
const { ok, fail } = require('../utils/response');

async function register(req, res) {
  const { phoneOrEmail, password } = req.body || {};

  if (!phoneOrEmail || !password) {
    return res.status(400).json(fail('MISSING_FIELDS', 'Thiếu số điện thoại/email hoặc mật khẩu.'));
  }

  const existing = await pool.query('SELECT id FROM users WHERE phone_or_email = $1', [phoneOrEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json(fail('USER_EXISTS', 'Tài khoản đã tồn tại.'));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (phone_or_email, password_hash) VALUES ($1, $2) RETURNING id',
    [phoneOrEmail, passwordHash]
  );

  const userId = rows[0].id;
  const token = signToken({ userId });
  res.status(201).json(ok({ token, userId }));
}

async function login(req, res) {
  const { phoneOrEmail, password } = req.body || {};

  if (!phoneOrEmail || !password) {
    return res.status(400).json(fail('MISSING_FIELDS', 'Thiếu số điện thoại/email hoặc mật khẩu.'));
  }

  const { rows } = await pool.query(
    'SELECT id, password_hash FROM users WHERE phone_or_email = $1',
    [phoneOrEmail]
  );
  const user = rows[0];

  if (!user) {
    return res.status(401).json(fail('INVALID_CREDENTIALS', 'Sai số điện thoại/email hoặc mật khẩu.'));
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json(fail('INVALID_CREDENTIALS', 'Sai số điện thoại/email hoặc mật khẩu.'));
  }

  const token = signToken({ userId: user.id });
  res.json(ok({ token, userId: user.id }));
}

module.exports = { register, login };
