const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const pool = require('../config/db');

router.get('/brand-sales', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM brand_sales_summary ORDER BY total_revenue DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/inventory-usage', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory_allocation_usage ORDER BY brand_name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/courier-performance', authenticate, authorize('admin'), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courier_performance_summary ORDER BY completed_deliveries DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
