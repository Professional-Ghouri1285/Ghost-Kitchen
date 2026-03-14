const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const Payout = require('../models/payout.model');

router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payouts = await Payout.getAll();
        res.json(payouts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/my', authenticate, authorize('courier'), async (req, res) => {
    try {
        const payouts = await Payout.getByCourierId(req.user.courier_id);
        res.json(payouts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payout = await Payout.getById(req.params.id);
        if (!payout) return res.status(404).json({ error: 'Payout not found' });
        res.json(payout);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
