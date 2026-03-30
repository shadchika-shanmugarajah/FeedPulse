import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const requireDbConnection = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      data: null,
      message: 'Database connection unavailable. Start MongoDB and retry.',
      error: 'db_unavailable',
    });
  }
  next();
};
