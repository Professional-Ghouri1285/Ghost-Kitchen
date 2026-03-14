const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        `SELECT c.*, u.username
         FROM Couriers c
         LEFT JOIN Users u ON c.user_id = u.user_id
         ORDER BY c.courier_id`
    );
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query(
        `SELECT c.*, u.username
         FROM Couriers c
         LEFT JOIN Users u ON c.user_id = u.user_id
         WHERE c.courier_id = $1`,
        [id]
    );
    return result.rows[0];
};

const create = async ({ user_id, name, status, rating }) => {
    const result = await pool.query(
        'INSERT INTO Couriers (user_id, name, status, rating) VALUES ($1, $2, $3, $4) RETURNING *',
        [user_id || null, name, status || 'AVAILABLE', rating || null]
    );
    return result.rows[0];
};

const update = async (id, { name, status, rating }) => {
    const result = await pool.query(
        'UPDATE Couriers SET name = $1, status = $2, rating = $3 WHERE courier_id = $4 RETURNING *',
        [name, status, rating, id]
    );
    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query('DELETE FROM Couriers WHERE courier_id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = { getAll, getById, create, update, remove };
