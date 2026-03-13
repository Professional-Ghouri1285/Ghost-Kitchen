require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const hubRoutes = require('./routes/hubs.routes');
const brandRoutes = require('./routes/brands.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const allocationRoutes = require('./routes/allocations.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/orders.routes');
const courierRoutes = require('./routes/couriers.routes');
const deliveryRoutes = require('./routes/deliveries.routes');
const payoutRoutes = require('./routes/payouts.routes');
const reportRoutes = require('./routes/reports.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hubs', hubRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/menu-items', menuRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/couriers', courierRoutes);
app.use('/api/v1/deliveries', deliveryRoutes);
app.use('/api/v1/payouts', payoutRoutes);
app.use('/api/v1/reports', reportRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Ghost Kitchen API running on port ${PORT}`);
});
