import 'dotenv/config';
import cron from 'node-cron';
import pino from 'pino';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const prisma = new PrismaClient();

logger.info('Brightloop Background Worker initializing...');

// Run every hour or configurable interval (e.g. 0 * * * *)
// In dev, runs every 5 minutes or on demand
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/15 * * * *';

async function performWorkerCycle() {
  logger.info({ at: new Date().toISOString() }, 'Commencing scheduled billing and maintenance run...');
  const today = new Date();

  try {
    // 1. Auto-close expired subscriptions where plan.autoClose = true
    const expiredSubs = await prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        expiryDate: { lt: today },
        plan: { autoClose: true },
      },
      data: {
        status: SubscriptionStatus.CLOSED,
      },
    });

    if (expiredSubs.count > 0) {
      logger.info({ count: expiredSubs.count }, 'Auto-closed expired subscriptions');
    }

    logger.info('Worker scheduled cycle completed successfully.');
  } catch (error) {
    logger.error({ error }, 'Error occurred during worker cycle');
  }
}

// Start cron schedule
cron.schedule(CRON_SCHEDULE, performWorkerCycle);

logger.info(`Brightloop Background Worker started with schedule: ${CRON_SCHEDULE}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Worker shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

