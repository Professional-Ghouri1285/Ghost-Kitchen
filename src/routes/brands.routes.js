const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Brand = require('../models/brand.model');

router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const brands = await Brand.getAll();
        res.json(brands);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const brand = await Brand.getById(req.params.id);
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.json(brand);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { hub_id, name, active_status } = req.body;
        if (!hub_id || !name) {
            return res.status(400).json({ error: 'hub_id and name are required' });
        }
        const brand = await Brand.create({ hub_id, name, active_status });
        res.status(201).json(brand);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Brand name already exists' });
        }
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { hub_id, name, active_status } = req.body;
        if (!hub_id || !name) {
            return res.status(400).json({ error: 'hub_id and name are required' });
        }
        const brand = await Brand.update(req.params.id, { hub_id, name, active_status });
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.json(brand);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const brand = await Brand.remove(req.params.id);
        if (!brand) return res.status(404).json({ error: 'Brand not found' });
        res.json({ message: 'Brand deleted', brand });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
