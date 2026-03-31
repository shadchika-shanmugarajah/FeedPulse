import './env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import feedbackRoutes from './routes/feedback.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware';

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors({ origin: '*' }));

// Body parser
app.use(express.json({ limit: '256kb' }));

// Routes
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

// Health check (GET /api/health — includes Gemini env status, not the API key)
app.get('/api/health', (req, res) => {
  const key = process.env.GEMINI_API_KEY?.trim();
  const geminiConfigured = Boolean(key && key !== 'your_gemini_api_key_here');
  const geminiDisabled = ['1', 'true', 'yes'].includes(
    (process.env.GEMINI_DISABLED ?? '').trim().toLowerCase()
  );
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      gemini: {
        configured: geminiConfigured,
        disabled: geminiDisabled,
        model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
      },
    },
    message: 'API is healthy',
    error: null,
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;