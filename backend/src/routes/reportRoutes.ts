import { Router, Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/reportService.js';
import { requireAuth, requireStaffOrAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/summary', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await ReportService.getSummary({
      from: req.query.from as string,
      to: req.query.to as string,
      customerId: req.query.customerId as string,
      planId: req.query.planId as string,
    });
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
});

router.get('/revenue-series', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;
    const series = await ReportService.getRevenueSeries({ months });
    res.json({ data: series });
  } catch (err) {
    next(err);
  }
});

router.get('/overdue', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overdue = await ReportService.getOverdueInvoices({
      customerId: req.query.customerId as string,
    });
    res.json({ data: overdue });
  } catch (err) {
    next(err);
  }
});

export const reportRoutes = router;

