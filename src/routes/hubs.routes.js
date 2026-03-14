const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Hub = require('../models/hub.model');

router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const hubs = await Hub.getAll();
        res.json(hubs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const hub = await Hub.getById(req.params.id);
        if (!hub) return res.status(404).json({ error: 'Hub not found' });
        res.json(hub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, location, status } = req.body;
        if (!name || !location) {
            return res.status(400).json({ error: 'name and location are required' });
        }
        const hub = await Hub.create({ name, location, status: status || 'ACTIVE' });
        res.status(201).json(hub);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { name, location, status } = req.body;
        if (!name || !location) {
            return res.status(400).json({ error: 'name and location are required' });
        }
        const hub = await Hub.update(req.params.id, { name, location, status });
        if (!hub) return res.status(404).json({ error: 'Hub not found' });
        res.json(hub);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const hub = await Hub.remove(req.params.id);
        if (!hub) return res.status(404).json({ error: 'Hub not found' });
        res.json({ message: 'Hub deleted', hub });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
