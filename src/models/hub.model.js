const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query('SELECT * FROM KitchenHubs');
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query('SELECT * FROM KitchenHubs WHERE hub_id = $1', [id]);
    return result.rows[0];
};

const create = async ({ name, location, status }) => {
    const result = await pool.query(
        'INSERT INTO KitchenHubs (name, location, status) VALUES ($1, $2, $3) RETURNING *',
        [name, location, status]
    );
    return result.rows[0];
};

const update = async (id, { name, location, status }) => {
    const result = await pool.query(
        'UPDATE KitchenHubs SET name = $1, location = $2, status = $3 WHERE hub_id = $4 RETURNING *',
        [name, location, status, id]
    );
    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query('DELETE FROM KitchenHubs WHERE hub_id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = { getAll, getById, create, update, remove };
