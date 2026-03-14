const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Allocation = require('../models/allocation.model');

router.get('/', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const allocations = await Allocation.getAll();
        res.json(allocations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:brandId/:ingredientId', authenticate, authorize('admin', 'kitchen_staff'), async (req, res) => {
    try {
        const alloc = await Allocation.getOne(req.params.brandId, req.params.ingredientId);
        if (!alloc) return res.status(404).json({ error: 'Allocation not found' });
        res.json(alloc);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { brand_id, ingredient_id, allocation_percentage } = req.body;
        if (!brand_id || !ingredient_id || !allocation_percentage) {
            return res.status(400).json({ error: 'brand_id, ingredient_id, and allocation_percentage are required' });
        }
        const alloc = await Allocation.create({ brand_id, ingredient_id, allocation_percentage });
        res.status(201).json(alloc);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Allocation already exists for this brand-ingredient pair' });
        }
        res.status(400).json({ error: err.message });
    }
});

router.put('/:brandId/:ingredientId', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { allocation_percentage } = req.body;
        const alloc = await Allocation.update(req.params.brandId, req.params.ingredientId, { allocation_percentage });
        if (!alloc) return res.status(404).json({ error: 'Allocation not found' });
        res.json(alloc);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:brandId/:ingredientId', authenticate, authorize('admin'), async (req, res) => {
    try {
        const alloc = await Allocation.remove(req.params.brandId, req.params.ingredientId);
        if (!alloc) return res.status(404).json({ error: 'Allocation not found' });
        res.json({ message: 'Allocation deleted', alloc });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
