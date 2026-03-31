import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createFeedback,
  deleteFeedback,
  getFeedbackById,
  getSummary,
  listFeedback,
  updateFeedbackStatus,
} from '../controllers/feedback.controller';
import { authenticate, requireDbConnection, validateFeedbackInput, validateStatusUpdate } from '../middleware';

const router = Router();

const feedbackSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: 'Too many submissions from this IP, please try again after an hour.',
    error: 'rate_limit_exceeded',
  },
});

router.use(requireDbConnection);
router.post('/', feedbackSubmitLimiter, validateFeedbackInput, createFeedback);
router.use(authenticate);
router.get('/', listFeedback);
/** Must be before /:id or "summary" is captured as an ObjectId and Mongoose throws (500). */
router.get('/summary', getSummary);
router.get('/:id', getFeedbackById);
router.patch('/:id', validateStatusUpdate, updateFeedbackStatus);
router.delete('/:id', deleteFeedback);

export default router;
