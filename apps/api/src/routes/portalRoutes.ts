import { Router, Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';
import { BillingService } from '../services/billingService.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../lib/errors.js';
import { SubscriptionStatus } from '@prisma/client';

const router = Router();

// Middleware ensuring user has customerId
const requireCustomer = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || !req.user.customerId) {
    return next(AppError.forbidden('Customer profile required to access customer portal'));
  }
  next();
};

router.use(requireAuth, requireCustomer);

router.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const result = await SubscriptionService.listSubscriptions({
      customerId,
      page: 1,
      pageSize: 50,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/subscriptions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const sub = await SubscriptionService.getSubscription(req.params.id, customerId);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/:id/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const sub = await SubscriptionService.togglePause(req.params.id, req.user!.id, customerId);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/:id/resume', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const sub = await SubscriptionService.togglePause(req.params.id, req.user!.id, customerId);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const sub = await SubscriptionService.transition(
      req.params.id,
      SubscriptionStatus.CLOSED,
      req.user!.id,
      customerId
    );
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/subscriptions/:id/renew', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const sub = await SubscriptionService.renew(req.params.id, req.user!.id, customerId);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.get('/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const result = await BillingService.listInvoices({
      customerId,
      page: 1,
      pageSize: 50,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/invoices/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.user!.customerId!;
    const invoice = await BillingService.getInvoice(req.params.id, customerId);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

export const portalRoutes = router;

