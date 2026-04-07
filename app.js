import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth/authRoutes.js';
import adminUserRoutes  from './src/routes/admin/userRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import categoryRoutes from './src/routes/admin/categoryRoutes.js';
import tithesRoutes from './src/routes/tithesRoutes.js';
import requestFormRoutes from './src/routes/requestFormRoutes.js';
import voucherRoutes from './src/routes/voucherRoutes.js';
import expenseRoutes from './src/routes/expenseRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';

const PORT = process.env.PORT || 7002;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes );
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tithes', tithesRoutes);
app.use('/api/request-form', requestFormRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
});
