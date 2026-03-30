import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import feedbackRoutes from './routes/feedback.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '256kb' }));

app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { uptime: process.uptime() }, message: 'API is healthy', error: null });
});

app.use(errorHandler);

export default app;
