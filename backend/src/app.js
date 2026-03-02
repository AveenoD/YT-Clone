import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const corsOrigin = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

// CORS Configuration
app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
}));




app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// Routes
import userRoutes from './routes/user.routes.js';
app.use('/api/v1/users', userRoutes);

import videoRoutes from './routes/video.routes.js';
app.use('/api/v1/videos', videoRoutes);

// ✅ FIX: Correct import path for like routes
import likeRoutes from './routes/like.routes.js'; // Changed from video.routes.js
app.use('/api/v1/likes', likeRoutes);

import subscriptionRoutes from './routes/susbcription.routes.js';
app.use('/api/v1/subscriptions', subscriptionRoutes);

import commentRoutes from './routes/comment.routes.js';
app.use('/api/v1/comments',commentRoutes)

import playlistRoutes from './routes/playlist.routes.js'
app.use('/api/v1/playlists', playlistRoutes);

import tweetRouter from './routes/tweet.routes.js';
app.use('/api/v1/tweets', tweetRouter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running smoothly ✅',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            errors: err.errors || []
        })
    });
});

export { app };