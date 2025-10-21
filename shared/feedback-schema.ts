
import { z } from 'zod';

// Order Feedback Schema
export const orderFeedbackSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  clientId: z.string(),
  rating: z.number().min(1).max(5),
  orderingProcessRating: z.number().min(1).max(5).optional(),
  productQualityRating: z.number().min(1).max(5).optional(),
  deliverySpeedRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  comments: z.string().optional(),
  wouldRecommend: z.boolean(),
  createdAt: z.number(),
});

export const insertOrderFeedbackSchema = orderFeedbackSchema.omit({ id: true, createdAt: true });

export type OrderFeedback = z.infer<typeof orderFeedbackSchema>;
export type InsertOrderFeedback = z.infer<typeof insertOrderFeedbackSchema>;

// Issue Report Schema
export const issueReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userType: z.enum(['client', 'admin']),
  orderId: z.string().optional(),
  issueType: z.enum(['bug', 'feature_request', 'confusion', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  steps: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  browserInfo: z.string(),
  screenSize: z.string(),
  screenshots: z.array(z.string()).optional(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']),
  assignedTo: z.string().optional(),
  createdAt: z.number(),
  resolvedAt: z.number().optional(),
});

export const insertIssueReportSchema = issueReportSchema.omit({ id: true, createdAt: true, status: true });

export type IssueReport = z.infer<typeof issueReportSchema>;
export type InsertIssueReport = z.infer<typeof insertIssueReportSchema>;

// Feature Request Schema
export const featureRequestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['ordering', 'lta', 'products', 'reports', 'other']),
  priority: z.enum(['nice_to_have', 'important', 'critical']),
  votes: z.number(),
  status: z.enum(['submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected']),
  adminNotes: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const insertFeatureRequestSchema = featureRequestSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  votes: true,
  status: true
});

export type FeatureRequest = z.infer<typeof featureRequestSchema>;
export type InsertFeatureRequest = z.infer<typeof insertFeatureRequestSchema>;

// Micro Feedback Schema
export const microFeedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  touchpoint: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  quickResponse: z.string().optional(),
  context: z.record(z.any()).optional(),
  createdAt: z.number(),
});

export const insertMicroFeedbackSchema = microFeedbackSchema.omit({ id: true, createdAt: true });

export type MicroFeedback = z.infer<typeof microFeedbackSchema>;
export type InsertMicroFeedback = z.infer<typeof insertMicroFeedbackSchema>;
