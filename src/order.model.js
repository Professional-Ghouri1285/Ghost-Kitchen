const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        `SELECT p.*, c.name AS courier_name
         FROM Payouts p
         JOIN Couriers c ON p.courier_id = c.courier_id
         ORDER BY p.payout_date DESC`
    );
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query(
        `SELECT p.*, c.name AS courier_name
         FROM Payouts p
         JOIN Couriers c ON p.courier_id = c.courier_id
         WHERE p.payout_id = $1`,
        [id]
    );
    return result.rows[0];
};

const getByCourierId = async (courierId) => {
    const result = await pool.query(
        'SELECT * FROM Payouts WHERE courier_id = $1 ORDER BY payout_date DESC',
        [courierId]
    );
    return result.rows;
};

module.exports = { getAll, getById, getByCourierId };
