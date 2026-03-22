import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth/authRoutes.js';

const PORT = process.env.PORT || 7002;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/auth', authRoutes);

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
});
