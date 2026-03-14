const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Menu = require('../models/menu.model');

router.get('/', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const items = await Menu.getAll();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const item = await Menu.getById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const { brand_id, name, price, is_available } = req.body;
        if (!brand_id || !name || !price) {
            return res.status(400).json({ error: 'brand_id, name, and price are required' });
        }
        const item = await Menu.create({ brand_id, name, price, is_available });
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const { brand_id, name, price, is_available } = req.body;
        if (!brand_id || !name || !price) {
            return res.status(400).json({ error: 'brand_id, name, and price are required' });
        }
        const item = await Menu.update(req.params.id, { brand_id, name, price, is_available });
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const item = await Menu.remove(req.params.id);
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json({ message: 'Menu item deleted', item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
