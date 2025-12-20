import { buildApp } from './app.js';
import { settings } from './shared/config.js';
import { closeDatabase } from './shared/database.js';

/** Start the server */
async function start(): Promise<void> {
    try {
        const app = await buildApp();

        // Startup message
        console.log(`[STARTUP] Starting ${settings.appName} v${settings.appVersion}`);
        console.log(`[STARTUP] Environment: ${settings.environment}`);
        console.log(`[STARTUP] Database: Connected`);

        // Start listening
        await app.listen({
            port: settings.port,
            host: '0.0.0.0',
        });

        console.log(`[STARTUP] Server running at http://localhost:${settings.port}`);

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            console.log(`[SHUTDOWN] Received ${signal}, shutting down...`);
            await app.close();
            await closeDatabase();
            console.log('[SHUTDOWN] Shutdown complete');
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('[STARTUP] Failed to start server:', error);
        process.exit(1);
    }
}

start();
