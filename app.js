import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
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
import { setIO } from './src/services/realtime.js';

const PORT = process.env.PORT || 7002;
const app = express();

// Middleware
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const corsOriginCheck = (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
};

app.use(cors({
    origin: corsOriginCheck,
    credentials: true,
}));

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

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: corsOriginCheck,
        credentials: true,
    },
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        socket.userId = decoded.id;
        socket.role = decoded.role;
        next();
    } catch (err) {
        next(new Error('Invalid token'));
    }
});

io.on('connection', (socket) => {
    socket.join(String(socket.userId));
});

setIO(io);

connectDB().then(() => {
    httpServer.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
});
