const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query('SELECT * FROM Inventory ORDER BY ingredient_id');
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query('SELECT * FROM Inventory WHERE ingredient_id = $1', [id]);
    return result.rows[0];
};

const create = async ({ name, total_quantity, unit }) => {
    const result = await pool.query(
        'INSERT INTO Inventory (name, total_quantity, unit) VALUES ($1, $2, $3) RETURNING *',
        [name, total_quantity, unit]
    );
    return result.rows[0];
};

const update = async (id, { name, total_quantity, unit }) => {
    const result = await pool.query(
        'UPDATE Inventory SET name = $1, total_quantity = $2, unit = $3 WHERE ingredient_id = $4 RETURNING *',
        [name, total_quantity, unit, id]
    );
    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query('DELETE FROM Inventory WHERE ingredient_id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = { getAll, getById, create, update, remove };
