const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        'SELECT mi.*, vb.name AS brand_name FROM MenuItems mi JOIN VirtualBrands vb ON mi.brand_id = vb.brand_id ORDER BY mi.item_id'
    );
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query(
        'SELECT mi.*, vb.name AS brand_name FROM MenuItems mi JOIN VirtualBrands vb ON mi.brand_id = vb.brand_id WHERE mi.item_id = $1',
        [id]
    );
    return result.rows[0];
};

const create = async ({ brand_id, name, price, is_available }) => {
    const result = await pool.query(
        'INSERT INTO MenuItems (brand_id, name, price, is_available) VALUES ($1, $2, $3, $4) RETURNING *',
        [brand_id, name, price, is_available !== undefined ? is_available : true]
    );
    return result.rows[0];
};

const update = async (id, { brand_id, name, price, is_available }) => {
    const result = await pool.query(
        'UPDATE MenuItems SET brand_id = $1, name = $2, price = $3, is_available = $4 WHERE item_id = $5 RETURNING *',
        [brand_id, name, price, is_available, id]
    );
    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query('DELETE FROM MenuItems WHERE item_id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = { getAll, getById, create, update, remove };
