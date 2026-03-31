import { Schema, model, Document } from 'mongoose';

export interface FeedbackDocument extends Document {
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  ai_sentiment: 'Positive' | 'Neutral' | 'Negative';
  ai_priority: number;
  ai_summary: string;
  ai_tags: string[];
  ai_processed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<FeedbackDocument>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 120,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Bug', 'Feature Request', 'Improvement', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['New', 'In Review', 'Resolved'],
      default: 'New',
    },
    submitterName: {
      type: String,
      trim: true,
    },
    submitterEmail: {
      type: String,
      trim: true,
      validate: {
        validator: function (email: string) {
          if (!email || email.trim() === '') return true;
          return /^\S+@\S+\.\S+$/.test(email);
        },
        message: 'Invalid email address',
      },
    },

    // AI fields
    ai_category: {
      type: String,
      enum: ['Bug', 'Feature Request', 'Improvement', 'Other'],
      default: 'Other',
    },
    ai_sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral',
    },
    ai_priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    ai_summary: {
      type: String,
      default: 'AI analysis unavailable',
      trim: true,
    },
    ai_tags: {
      type: [String],
      default: [],
    },
    ai_processed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ ai_priority: 1 });
FeedbackSchema.index({ createdAt: -1 });

export const FeedbackModel = model<FeedbackDocument>('Feedback', FeedbackSchema);