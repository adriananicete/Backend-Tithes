import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth/authRoutes.js';
import userRoutes from './src/routes/admin/userRoutes.js';

const PORT = process.env.PORT || 7002;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/users', userRoutes)

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
});
