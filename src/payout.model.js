const pool = require('../config/db');

const findByUsername = async (username) => {
    const result = await pool.query(
        'SELECT * FROM Users WHERE username = $1',
        [username]
    );
    return result.rows[0];
};

const create = async ({ username, password_hash, role }) => {
    const result = await pool.query(
        'INSERT INTO Users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, username, role, created_at',
        [username, password_hash, role]
    );
    return result.rows[0];
};

const getAll = async () => {
    const result = await pool.query(
        'SELECT user_id, username, role, created_at FROM Users'
    );
    return result.rows;
};

module.exports = { findByUsername, create, getAll };
