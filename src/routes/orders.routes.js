const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Order = require('../models/order.model');

router.get('/', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const orders = await Order.getAll();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin', 'kitchen_staff', 'courier'), async (req, res) => {
    try {
        const order = await Order.getById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Transaction Scenario 1: Place order with inventory deduction
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { brand_id, items } = req.body;
        if (!brand_id || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'brand_id and items array are required' });
        }
        for (const item of items) {
            if (!item.item_id || !item.quantity || item.quantity < 1) {
                return res.status(400).json({ error: 'Each item needs item_id and quantity (>0)' });
            }
        }
        const order = await Order.placeOrder(brand_id, items);
        res.status(201).json(order);
    } catch (err) {
        if (err.message.includes('allocation exceeded') || err.message.includes('Insufficient inventory')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/cancel', authenticate, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.cancelOrder(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        if (err.message.includes('Cannot modify order')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
