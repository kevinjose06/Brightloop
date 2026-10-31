import { Router, Request, Response, NextFunction } from 'express';
import { CatalogService } from '../services/catalogService.js';
import { requireAuth, requireAdmin, requireStaffOrAdmin } from '../middleware/auth.js';
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createPlanSchema,
  updatePlanSchema,
  createTaxRuleSchema,
  updateTaxRuleSchema,
  createDiscountSchema,
  updateDiscountSchema,
  createTemplateSchema,
  updateTemplateSchema,
} from '../validators/catalog.js';

const router = Router();

// PRODUCTS
router.get('/products', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await CatalogService.listProducts({
      q: req.query.q as string,
      type: req.query.type as any,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    });
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await CatalogService.getProduct(req.params.id);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

router.post('/products', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await CatalogService.createProduct(data);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
});

router.patch('/products/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await CatalogService.updateProduct(req.params.id, data);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CatalogService.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

// VARIANTS
router.post('/products/:id/variants', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createVariantSchema.parse(req.body);
    const variant = await CatalogService.addVariant(req.params.id, data);
    res.status(201).json({ data: variant });
  } catch (err) {
    next(err);
  }
});

router.patch('/variants/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateVariantSchema.parse(req.body);
    const variant = await CatalogService.updateVariant(req.params.id, data);
    res.json({ data: variant });
  } catch (err) {
    next(err);
  }
});

router.delete('/variants/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CatalogService.deleteVariant(req.params.id);
    res.json({ success: true, message: 'Variant deleted' });
  } catch (err) {
    next(err);
  }
});

// PLANS
router.get('/plans', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await CatalogService.listPlans({
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      billingPeriod: req.query.billingPeriod as any,
    });
    res.json({ data: plans });
  } catch (err) {
    next(err);
  }
});

router.get('/plans/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await CatalogService.getPlan(req.params.id);
    res.json({ data: plan });
  } catch (err) {
    next(err);
  }
});

router.post('/plans', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createPlanSchema.parse(req.body);
    const plan = await CatalogService.createPlan(data);
    res.status(201).json({ data: plan });
  } catch (err) {
    next(err);
  }
});

router.patch('/plans/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updatePlanSchema.parse(req.body);
    const plan = await CatalogService.updatePlan(req.params.id, data);
    res.json({ data: plan });
  } catch (err) {
    next(err);
  }
});

// TAXES
router.get('/taxes', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taxes = await CatalogService.listTaxes(
      req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    );
    res.json({ data: taxes });
  } catch (err) {
    next(err);
  }
});

router.post('/taxes', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTaxRuleSchema.parse(req.body);
    const tax = await CatalogService.createTaxRule(data);
    res.status(201).json({ data: tax });
  } catch (err) {
    next(err);
  }
});

router.patch('/taxes/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateTaxRuleSchema.parse(req.body);
    const tax = await CatalogService.updateTaxRule(req.params.id, data);
    res.json({ data: tax });
  } catch (err) {
    next(err);
  }
});

// DISCOUNTS
router.get('/discounts', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discounts = await CatalogService.listDiscounts({
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      scope: req.query.scope as any,
    });
    res.json({ data: discounts });
  } catch (err) {
    next(err);
  }
});

router.post('/discounts', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createDiscountSchema.parse(req.body);
    const discount = await CatalogService.createDiscount(req.user!.id, data);
    res.status(201).json({ data: discount });
  } catch (err) {
    next(err);
  }
});

router.patch('/discounts/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateDiscountSchema.parse(req.body);
    const discount = await CatalogService.updateDiscount(req.user!.id, req.params.id, data);
    res.json({ data: discount });
  } catch (err) {
    next(err);
  }
});

// TEMPLATES
router.get('/quotation-templates', requireAuth, requireStaffOrAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await CatalogService.listTemplates();
    res.json({ data: templates });
  } catch (err) {
    next(err);
  }
});

router.get('/quotation-templates/:id', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await CatalogService.getTemplate(req.params.id);
    res.json({ data: template });
  } catch (err) {
    next(err);
  }
});

router.post('/quotation-templates', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTemplateSchema.parse(req.body);
    const template = await CatalogService.createTemplate(data);
    res.status(201).json({ data: template });
  } catch (err) {
    next(err);
  }
});

// CUSTOMERS
router.get('/customers', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customers = await CatalogService.listCustomers(req.query.q as string);
    res.json({ data: customers });
  } catch (err) {
    next(err);
  }
});

router.get('/customers/:id', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CatalogService.getCustomer(req.params.id);
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
});

router.post('/customers', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CatalogService.createCustomer(req.body);
    res.status(201).json({ data: customer });
  } catch (err) {
    next(err);
  }
});

router.patch('/customers/:id', requireAuth, requireStaffOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CatalogService.updateCustomer(req.params.id, req.body);
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
});

export const catalogRoutes = router;

