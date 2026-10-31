import { Router, Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscriptionService.js';
import { requireAuth, requireStaffOrAdmin } from '../middleware/auth.js';
import {
  createSubscriptionSchema,
  transitionSubscriptionSchema,
  listQuerySchema,
} from '../validators/subscription.js';

const router = Router();

router.get('/', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await SubscriptionService.listSubscriptions({
      page: query.page,
      pageSize: query.pageSize,
      customerId: query.customerId,
      status: query.status as any,
      planId: query.planId,
      q: query.q,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await SubscriptionService.getSubscription(req.params.id);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSubscriptionSchema.parse(req.body);
    const sub = await SubscriptionService.createSubscription(req.user!.id, data);
    res.status(201).json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/transition', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = transitionSubscriptionSchema.parse(req.body);
    const sub = await SubscriptionService.transition(req.params.id, data.to, req.user!.id);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pause', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await SubscriptionService.togglePause(req.params.id, req.user!.id);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resume', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await SubscriptionService.togglePause(req.params.id, req.user!.id);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/renew', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await SubscriptionService.renew(req.params.id, req.user!.id);
    res.json({ data: sub });
  } catch (err) {
    next(err);
  }
});

export const subscriptionRoutes = router;

