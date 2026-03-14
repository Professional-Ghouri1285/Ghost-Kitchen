const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Courier = require('../models/courier.model');

router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const couriers = await Courier.getAll();
        res.json(couriers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin', 'courier'), async (req, res) => {
    try {
        if (req.user.role === 'courier' && req.user.courier_id !== parseInt(req.params.id)) {
            return res.status(403).json({ error: 'Can only view your own profile' });
        }
        const courier = await Courier.getById(req.params.id);
        if (!courier) return res.status(404).json({ error: 'Courier not found' });
        res.json(courier);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { user_id, name, status, rating } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        const courier = await Courier.create({ user_id, name, status, rating });
        res.status(201).json(courier);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, status, rating } = req.body;
        const courier = await Courier.update(req.params.id, { name, status, rating });
        if (!courier) return res.status(404).json({ error: 'Courier not found' });
        res.json(courier);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const courier = await Courier.remove(req.params.id);
        if (!courier) return res.status(404).json({ error: 'Courier not found' });
        res.json({ message: 'Courier deleted', courier });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
