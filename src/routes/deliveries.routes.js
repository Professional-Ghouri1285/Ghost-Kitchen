const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Delivery = require('../models/delivery.model');

router.get('/', authenticate, authorize('admin', 'courier'), async (req, res) => {
    try {
        if (req.user.role === 'courier') {
            const deliveries = await Delivery.getByCourierId(req.user.courier_id);
            return res.json(deliveries);
        }
        const deliveries = await Delivery.getAll();
        res.json(deliveries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin', 'courier'), async (req, res) => {
    try {
        const delivery = await Delivery.getById(req.params.id);
        if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
        if (req.user.role === 'courier' && delivery.courier_id !== req.user.courier_id) {
            return res.status(403).json({ error: 'Can only view your own deliveries' });
        }
        res.json(delivery);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { order_id, courier_id } = req.body;
        if (!order_id || !courier_id) {
            return res.status(400).json({ error: 'order_id and courier_id are required' });
        }
        const delivery = await Delivery.assign({ order_id, courier_id });
        res.status(201).json(delivery);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Delivery already assigned for this order' });
        }
        res.status(400).json({ error: err.message });
    }
});

// Transaction Scenario 2: Complete delivery + payout
router.patch('/:id/complete', authenticate, authorize('admin', 'courier'), async (req, res) => {
    try {
        const courierIdFromToken = req.user.role === 'courier' ? req.user.courier_id : null;
        const result = await Delivery.completeDelivery(parseInt(req.params.id), courierIdFromToken);
        res.json(result);
    } catch (err) {
        if (err.message.includes('not found') || err.message.includes('already completed') || err.message.includes('Not authorized')) {
            return res.status(400).json({ error: err.message });
        }
        if (err.message.includes('Cannot modify order')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
