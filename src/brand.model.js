const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        `SELECT o.*, vb.name AS brand_name
         FROM Orders o
         JOIN VirtualBrands vb ON o.brand_id = vb.brand_id
         ORDER BY o.created_at DESC`
    );
    return result.rows;
};

const getById = async (id) => {
    const result = await pool.query(
        `SELECT o.*, vb.name AS brand_name
         FROM Orders o
         JOIN VirtualBrands vb ON o.brand_id = vb.brand_id
         WHERE o.order_id = $1`,
        [id]
    );
    if (!result.rows[0]) return null;

    const items = await pool.query(
        `SELECT oi.*, mi.name AS item_name, mi.price
         FROM OrderItems oi
         JOIN MenuItems mi ON oi.item_id = mi.item_id
         WHERE oi.order_id = $1`,
        [id]
    );

    return { ...result.rows[0], items: items.rows };
};

// Transaction Scenario 1: Order Placement with Inventory Deduction
const placeOrder = async (brand_id, items) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            'INSERT INTO Orders (brand_id, order_status) VALUES ($1, $2) RETURNING *',
            [brand_id, 'PLACED']
        );
        const order = orderResult.rows[0];

        for (const item of items) {
            // insert order item — the trigger checks brand allocation limits
            await client.query(
                'INSERT INTO OrderItems (order_id, item_id, quantity) VALUES ($1, $2, $3)',
                [order.order_id, item.item_id, item.quantity]
            );

            // deduct from shared inventory (all ingredients allocated to this brand)
            const allocCountResult = await client.query(
                'SELECT COUNT(*) AS cnt FROM BrandInventoryAllocation WHERE brand_id = $1',
                [brand_id]
            );
            const allocCount = parseInt(allocCountResult.rows[0].cnt);

            const deductResult = await client.query(
                `UPDATE Inventory SET total_quantity = total_quantity - $1
                 WHERE ingredient_id IN (
                     SELECT bia.ingredient_id
                     FROM BrandInventoryAllocation bia
                     WHERE bia.brand_id = $2
                 )
                 AND total_quantity >= $1
                 RETURNING *`,
                [item.quantity, brand_id]
            );

            if (deductResult.rowCount < allocCount) {
                throw new Error('Insufficient inventory for item ' + item.item_id);
            }
        }

        await client.query('COMMIT');
        return order;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const cancelOrder = async (id) => {
    const result = await pool.query(
        "UPDATE Orders SET order_status = 'CANCELLED' WHERE order_id = $1 RETURNING *",
        [id]
    );
    return result.rows[0];
};

module.exports = { getAll, getById, placeOrder, cancelOrder };
