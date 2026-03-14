const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        'SELECT vb.*, kh.name AS hub_name FROM VirtualBrands vb JOIN KitchenHubs kh ON vb.hub_id = kh.hub_id'
    );
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query(
        'SELECT vb.*, kh.name AS hub_name FROM VirtualBrands vb JOIN KitchenHubs kh ON vb.hub_id = kh.hub_id WHERE vb.brand_id = $1',
        [id]
    );
    return result.rows[0];
};

const create = async ({ hub_id, name, active_status }) => {
    const result = await pool.query(
        'INSERT INTO VirtualBrands (hub_id, name, active_status) VALUES ($1, $2, $3) RETURNING *',
        [hub_id, name, active_status !== undefined ? active_status : true]
    );
    return result.rows[0];
};

const update = async (id, { hub_id, name, active_status }) => {
    const result = await pool.query(
        'UPDATE VirtualBrands SET hub_id = $1, name = $2, active_status = $3 WHERE brand_id = $4 RETURNING *',
        [hub_id, name, active_status, id]
    );
    return result.rows[0];
};

const remove = async (id) => {
    const result = await pool.query('DELETE FROM VirtualBrands WHERE brand_id = $1 RETURNING *', [id]);
    return result.rows[0];
};

module.exports = { getAll, getById, create, update, remove };
