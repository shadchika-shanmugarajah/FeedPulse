import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, message: 'Authorization token required.', error: 'unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, jwtSecret);
    (req as Request & { user?: unknown }).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, data: null, message: 'Invalid or expired token.', error: 'unauthorized' });
  }
};
