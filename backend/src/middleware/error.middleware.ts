import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: { status?: number; message?: string; code?: string }, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error.';

  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: err.code || 'server_error',
  });
};
