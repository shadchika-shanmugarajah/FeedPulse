import { Request, Response, NextFunction } from 'express';

const categories = ['Bug', 'Feature Request', 'Improvement', 'Other'];
const statuses = ['New', 'In Review', 'Resolved'];

export const validateFeedbackInput = (req: Request, res: Response, next: NextFunction) => {
  const { title, description, category, submitterEmail } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, data: null, message: 'Title is required.', error: 'invalid_input' });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 20) {
    return res.status(400).json({ success: false, data: null, message: 'Description must be at least 20 characters.', error: 'invalid_input' });
  }

  if (category && !categories.includes(category)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid category.', error: 'invalid_input' });
  }

  if (submitterEmail && !/^\S+@\S+\.\S+$/.test(submitterEmail)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid email address.', error: 'invalid_input' });
  }

  next();
};

export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;

  if (!status || !statuses.includes(status)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid status value.', error: 'invalid_input' });
  }

  next();
};
