import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema,
} from '../validators/auth.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.registerCustomer(data);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 1000,
    });

    res.status(201).json({
      data: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 1000,
    });

    res.json({
      data: result.user,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Successfully logged out' });
});

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await AuthService.getMe(req.user!.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);
    const result = await AuthService.requestPasswordReset(data.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const result = await AuthService.resetPassword(data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/staff', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createStaffSchema.parse(req.body);
    const result = await AuthService.createStaff(req.user!.id, data);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

export const authRoutes = router;

