import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@feedpulse.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FeedPulse123!';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, data: null, message: 'Email and password are required.', error: 'invalid_input' });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, data: null, message: 'Invalid credentials.', error: 'unauthorized' });
    }

    const token = jwt.sign({ role: 'admin', email }, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ success: true, data: { token }, message: 'Login successful.', error: null });
  } catch (error) {
    next(error);
  }
};
