import 'dotenv/config';
import { app } from './app.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Brightloop API Server running on http://localhost:${PORT}`);
  logger.info(`Interactive API Docs available at http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, commencing graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma database client disconnected.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

