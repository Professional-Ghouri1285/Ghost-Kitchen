const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (decoded.role === 'courier') {
            const result = await pool.query(
                'SELECT courier_id FROM Couriers WHERE user_id = $1',
                [decoded.user_id]
            );
            if (result.rows.length > 0) {
                req.user.courier_id = result.rows[0].courier_id;
            }
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authenticate;
