import dotenv from 'dotenv';
import connectDB from '../database/index.js';
import { app } from '../app.js';

dotenv.config();

// Vercel handles the request, we just ensure DB is connecting
connectDB().catch(err => console.error("Initial DB connection error:", err));

export default app;
