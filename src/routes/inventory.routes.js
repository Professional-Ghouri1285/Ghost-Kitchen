const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Inventory = require('../models/inventory.model');

router.get('/', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const items = await Inventory.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const item = await Inventory.getById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Ingredient not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const { name, total_quantity, unit } = req.body;
        if (!name || total_quantity === undefined || !unit) {
            return res.status(400).json({ error: 'name, total_quantity, and unit are required' });
        }
        const item = await Inventory.create({ name, total_quantity, unit });
        res.status(201).json(item);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ingredient name already exists' });
        }
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const { name, total_quantity, unit } = req.body;
        const item = await Inventory.update(req.params.id, { name, total_quantity, unit });
        if (!item) return res.status(404).json({ error: 'Ingredient not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const item = await Inventory.remove(req.params.id);
        if (!item) return res.status(404).json({ error: 'Ingredient not found' });
        res.json({ message: 'Ingredient deleted', item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
