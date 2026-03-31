import '../env';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function normalizeEmail(value: string): string {
  return String(value).replace(/^\uFEFF/, '').trim().toLowerCase();
}

function normalizePassword(value: string): string {
  return String(value)
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email and password are required.',
        error: 'invalid_input',
      });
    }

    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@feedpulse.com');
    const adminPassword = normalizePassword(process.env.ADMIN_PASSWORD || 'FeedPulse123!');
    const jwtSecret = (process.env.JWT_SECRET || 'fallback_secret').replace(/^\uFEFF/, '').trim();

    const submittedEmail = normalizeEmail(email);
    const submittedPassword = normalizePassword(password);

    if (submittedEmail !== adminEmail || submittedPassword !== adminPassword) {
      return res.status(401).json({
        success: false,
        data: null,
        message:
          'Invalid credentials. Use the exact ADMIN_EMAIL and ADMIN_PASSWORD from backend/.env (restart the API after editing .env).',
        error: 'unauthorized',
      });
    }

    const token = jwt.sign({ role: 'admin', email: submittedEmail }, jwtSecret, { expiresIn: '8h' });

    return res.json({ success: true, data: { token }, message: 'Login successful.', error: null });
  } catch (error) {
    next(error);
  }
};
