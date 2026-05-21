const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

const registerCandidate = async (email, password, name) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into users
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, role',
      [email, passwordHash, 'candidate']
    );
    const userId = userResult.rows[0].id;
    const role = userResult.rows[0].role;

    // Insert into candidates
    await client.query(
      'INSERT INTO candidates (user_id, name) VALUES ($1, $2)',
      [userId, name]
    );

    await client.query('COMMIT');

    // Generate JWT
    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return { token, user: { id: userId, email, role, name } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const registerCompany = async (email, password, companyName) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into users
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, role',
      [email, passwordHash, 'company']
    );
    const userId = userResult.rows[0].id;
    const role = userResult.rows[0].role;

    // Insert into companies
    await client.query(
      'INSERT INTO companies (user_id, company_name) VALUES ($1, $2)',
      [userId, companyName]
    );

    await client.query('COMMIT');

    // Generate JWT
    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return { token, user: { id: userId, email, role, companyName } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const loginUser = async (email, password) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '24h' }
  );

  return { token, user: { id: user.id, email: user.email, role: user.role } };
};

module.exports = {
  registerCandidate,
  registerCompany,
  loginUser,
};
