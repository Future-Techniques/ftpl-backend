import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import { handleStatusResponse } from './utils/renderStatusPage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy (needed for accurate client IP resolution behind Render / Vercel / Nginx)
app.set('trust proxy', 1);

// Middleware - Strict CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        const isAllowed = config.corsOrigins.some(allowedOrigin => {
            if (allowedOrigin === '*') return true;
            return origin.toLowerCase() === allowedOrigin.toLowerCase();
        });

        if (isAllowed) {
            return callback(null, true);
        } else {
            const err = new Error(`CORS policy violation: Origin '${origin}' is not permitted.`);
            err.status = 403;
            return callback(err, false);
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images if present
app.use('/frontend/images', express.static(path.join(__dirname, '../public/frontend/images')));

// Root server check
app.get('/', handleStatusResponse);

// API Routes
app.use('/api', apiRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        result: 'error',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Global Error Handler
app.use(errorHandler);

export default app;
