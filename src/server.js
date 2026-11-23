import app from './app.js';
import { config } from './config/env.js';
import { pool } from './config/db.js';

const PORT = config.port;

// Test DB connection before listening
async function startServer() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to Supabase PostgreSQL database.');
        client.release();

        app.listen(PORT, () => {
            console.log(`FutureTek API Server is running on port ${PORT}`);
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`API Base URL: http://localhost:${PORT}/api`);

            // Internal Supabase Keep-Alive: queries DB once every 24 hours to guarantee DB never pauses
            startDatabaseKeepAlive();
        });
    } catch (err) {
        console.error('Failed to connect to the database:', err.message);
        process.exit(1);
    }
}

function startDatabaseKeepAlive() {
    const ping = async () => {
        try {
            await pool.query('SELECT 1 as keep_alive, NOW() as current_time');
            console.log(`[AUTO KEEPALIVE] Supabase heartbeat successful at ${new Date().toISOString()}`);
        } catch (err) {
            console.warn('[AUTO KEEPALIVE WARNING] Failed to ping database:', err.message);
        }
    };
    // Run initial heartbeat ping on startup
    ping();
    const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
    const timer = setInterval(ping, INTERVAL_MS);
    if (timer.unref) timer.unref();
}

startServer();
