
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// Routes
import userRoutes from './routes/user.routes.js';
app.use('/api/v1/users', userRoutes);

import videoRoutes from './routes/video.routes.js';
app.use('/api/v1/videos', videoRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
        success: false,
        message: message,
        errors: err.errors || []
    });
});

export { app };