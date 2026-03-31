import { Request, Response, NextFunction } from 'express';
import { FeedbackModel } from '../models/feedback.model';
import { analyseFeedback, summarizeFeedbackCollection } from '../services/gemini.service';

const formatResponse = (data: unknown, message = 'OK') => ({
  success: true,
  data,
  message,
  error: null,
});

function buildLocalDigestSummary(
  feedbackItems: Array<{ title: string; description: string; ai_priority?: number; status?: string }>
): string {
  if (feedbackItems.length === 0) {
    return 'No feedback available for summary.';
  }

  const topItems = [...feedbackItems]
    .sort((a, b) => (b.ai_priority || 0) - (a.ai_priority || 0))
    .slice(0, 3);

  return topItems
    .map((item, index) => `${index + 1}. ${item.title} - ${item.description}`)
    .join('\n');
}

async function computeOpenCount(filter: Record<string, unknown>): Promise<number> {
  if (filter.status === 'Resolved') return 0;

  if (filter.status) {
    return FeedbackModel.countDocuments(filter);
  }

  return FeedbackModel.countDocuments({
    ...filter,
    status: { $ne: 'Resolved' },
  });
}

async function computeStatsForFilter(filter: Record<string, unknown>) {
  const [openCount, avgAgg, tagAgg] = await Promise.all([
    computeOpenCount(filter),
    FeedbackModel.aggregate([
      { $match: filter },
      { $group: { _id: null, avgPri: { $avg: '$ai_priority' } } },
    ]),
    FeedbackModel.aggregate([
      { $match: filter },
      { $unwind: { path: '$ai_tags', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$ai_tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const avgPriority = avgAgg[0]?.avgPri != null ? Number(avgAgg[0].avgPri.toFixed(1)) : 0;
  const topTag = tagAgg[0]?._id != null ? String(tagAgg[0]._id) : null;

  return { openCount, avgPriority, topTag };
}

export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    let feedback = await FeedbackModel.create({
      title,
      description,
      category,
      submitterName,
      submitterEmail,
    });

    try {
      const aiResult = await analyseFeedback(title, description);

      feedback.ai_category = aiResult.category as 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
      feedback.ai_sentiment = aiResult.sentiment as 'Positive' | 'Neutral' | 'Negative';
      feedback.ai_priority = aiResult.priority_score;
      feedback.ai_summary = aiResult.summary;
      feedback.ai_tags = aiResult.tags;
      /** True once AI pipeline ran and fields were saved (includes Gemini fallback when API fails). */
      feedback.ai_processed = true;

      await feedback.save();

      feedback = (await FeedbackModel.findById(feedback._id)) || feedback;
    } catch (aiError) {
      console.error('Gemini analysis failed:', aiError);
    }

    return res.status(201).json(formatResponse(feedback, 'Feedback submitted successfully.'));
  } catch (error) {
    next(error);
  }
};

export const listFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, search, page = '1', limit = '10', sort = 'createdAt desc' } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 50);
    const filter: Record<string, unknown> = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { ai_summary: { $regex: String(search), $options: 'i' } },
      ];
    }

    const [sortField, sortDirection] = String(sort).split(' ');
    const sortQuery: Record<string, 1 | -1> = {
      [sortField || 'createdAt']: sortDirection === 'asc' ? 1 : -1,
    };

    const [total, stats, feedback] = await Promise.all([
      FeedbackModel.countDocuments(filter),
      computeStatsForFilter(filter),
      FeedbackModel.find(filter)
        .sort(sortQuery)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    return res.json(
      formatResponse(
        {
          items: feedback,
          meta: {
            total,
            page: pageNumber,
            limit: pageSize,
            pages: Math.ceil(total / pageSize),
          },
          stats: {
            total,
            openCount: stats.openCount,
            avgPriority: stats.avgPriority,
            topTag: stats.topTag,
          },
        },
        'Feedback loaded.'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedback = await FeedbackModel.findById(req.params.id).lean();

    if (!feedback) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Feedback not found.',
        error: 'not_found',
      });
    }

    return res.json(formatResponse(feedback, 'Feedback loaded.'));
  } catch (error) {
    next(error);
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const feedback = await FeedbackModel.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Feedback not found.',
        error: 'not_found',
      });
    }

    feedback.status = status;
    await feedback.save();

    return res.json(formatResponse(feedback, 'Feedback status updated.'));
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedback = await FeedbackModel.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Feedback not found.',
        error: 'not_found',
      });
    }

    return res.json(formatResponse(null, 'Feedback deleted successfully.'));
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feedbackItems = await FeedbackModel.find({}, 'title description ai_priority status').lean();

    const total = feedbackItems.length;
    const openItems = feedbackItems.filter((item) => item.status !== 'Resolved').length;
    const averagePriority = total
      ? feedbackItems.reduce((sum, item) => sum + (item.ai_priority || 0), 0) / total
      : 0;

    let summary = 'Summary unavailable at this time.';

    try {
      summary = await summarizeFeedbackCollection(
        feedbackItems.map((item) => ({
          title: item.title,
          description: item.description,
        }))
      );
    } catch {
      summary = buildLocalDigestSummary(feedbackItems);
    }

    return res.json(
      formatResponse(
        {
          total,
          openItems,
          averagePriority: Number(averagePriority.toFixed(1)),
          summary,
        },
        'Feedback summary generated.'
      )
    );
  } catch (error) {
    next(error);
  }
};