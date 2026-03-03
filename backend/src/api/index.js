import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, './env') });
const serverless = require('serverless-http');


import connectDB from '../database/index.js';
import { app } from '../app.js';
import express from 'express';

connectDB()
.then(() => {
    console.log('✅ MongoDB connected');
    
    // const PORT = process.env.PORT || 8000;
    
    // app.listen(PORT, () => {
    //     console.log(`🚀 Server running on http://localhost:${PORT}`);

    // });
    module.exports = app;
    module.exports.handler = serverless(app);
})
.catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
});