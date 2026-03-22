import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 7002;
const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));