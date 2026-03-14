const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        `SELECT d.*, c.name AS courier_name, o.order_status
         FROM Deliveries d
         JOIN Couriers c ON d.courier_id = c.courier_id
         JOIN Orders o ON d.order_id = o.order_id
         ORDER BY d.delivery_id DESC`
    );
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query(
        `SELECT d.*, c.name AS courier_name, o.order_status, o.brand_id
         FROM Deliveries d
         JOIN Couriers c ON d.courier_id = c.courier_id
         JOIN Orders o ON d.order_id = o.order_id
         WHERE d.delivery_id = $1`,
        [id]
    );
    return result.rows[0];
};

const getByCourierId = async (courierId) => {
    const result = await pool.query(
        `SELECT d.*, o.order_status, o.brand_id
         FROM Deliveries d
         JOIN Orders o ON d.order_id = o.order_id
         WHERE d.courier_id = $1
         ORDER BY d.delivery_id DESC`,
        [courierId]
    );
    return result.rows;
};

const assign = async ({ order_id, courier_id }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const delivery = await client.query(
            'INSERT INTO Deliveries (order_id, courier_id, delivery_status) VALUES ($1, $2, $3) RETURNING *',
            [order_id, courier_id, 'ASSIGNED']
        );

        await client.query(
            "UPDATE Couriers SET status = 'BUSY' WHERE courier_id = $1",
            [courier_id]
        );

        await client.query('COMMIT');
        return delivery.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Transaction Scenario 2: Delivery Completion & Payout Processing
const completeDelivery = async (deliveryId, courierIdFromToken) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const delResult = await client.query(
            'SELECT * FROM Deliveries WHERE delivery_id = $1',
            [deliveryId]
        );
        if (delResult.rows.length === 0) {
            throw new Error('Delivery not found');
        }
        const delivery = delResult.rows[0];

        // courier can only complete their own delivery
        if (courierIdFromToken && delivery.courier_id !== courierIdFromToken) {
            throw new Error('Not authorized to complete this delivery');
        }
        if (delivery.delivery_status === 'COMPLETED') {
            throw new Error('Delivery already completed');
        }

        await client.query(
            "UPDATE Deliveries SET delivery_status = 'COMPLETED' WHERE delivery_id = $1",
            [deliveryId]
        );

        // trigger validates the order status transition
        await client.query(
            "UPDATE Orders SET order_status = 'DELIVERED' WHERE order_id = $1",
            [delivery.order_id]
        );

        await client.query(
            "UPDATE Couriers SET status = 'AVAILABLE' WHERE courier_id = $1",
            [delivery.courier_id]
        );

        // calculate payout as 15% of order total
        const totalResult = await client.query(
            `SELECT COALESCE(SUM(mi.price * oi.quantity), 0) AS total
             FROM OrderItems oi
             JOIN MenuItems mi ON oi.item_id = mi.item_id
             WHERE oi.order_id = $1`,
            [delivery.order_id]
        );
        const payoutAmount = (parseFloat(totalResult.rows[0].total) * 0.15).toFixed(2);

        await client.query(
            'INSERT INTO Payouts (courier_id, amount) VALUES ($1, $2)',
            [delivery.courier_id, payoutAmount]
        );

        await client.query('COMMIT');
        return { delivery_id: deliveryId, status: 'COMPLETED', payout: payoutAmount };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { getAll, getById, getByCourierId, assign, completeDelivery };
