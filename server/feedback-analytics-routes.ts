
import { Router } from 'express';
import { db } from './db';
import { orderFeedback, issueReports, users } from '../shared/schema';
import { eq, gte, sql, desc, and } from 'drizzle-orm';
import { requireAdmin } from './auth';

const router = Router();

router.get('/analytics', requireAdmin, async (req: any, res) => {
  try {
    console.log('[Feedback Analytics] Request received:', { range: req.query.range, user: req.client?.id });
    const range = req.query.range as string || '30d';
    
    // Calculate date threshold
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get all feedback in range
    const feedbackData = await db
      .select()
      .from(orderFeedback)
      .where(gte(orderFeedback.createdAt, startDate.toISOString()))
      .execute();

    // Calculate average rating
    const totalFeedback = feedbackData.length;
    const averageRating = totalFeedback > 0
      ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback
      : 0;

    // Calculate NPS (promoters - detractors)
    const promoters = feedbackData.filter(f => f.rating >= 4).length;
    const detractors = feedbackData.filter(f => f.rating <= 2).length;
    const npsScore = totalFeedback > 0
      ? Math.round(((promoters - detractors) / totalFeedback) * 100)
      : 0;

    // Would recommend percentage
    const wouldRecommendCount = feedbackData.filter(f => f.wouldRecommend).length;
    const wouldRecommendPercent = totalFeedback > 0
      ? Math.round((wouldRecommendCount / totalFeedback) * 100)
      : 0;

    // Aspect ratings
    const aspectRatings = {
      orderingProcess: 0,
      productQuality: 0,
      deliverySpeed: 0,
      communication: 0
    };

    if (totalFeedback > 0) {
      const validFeedback = feedbackData.filter(f => 
        f.orderingProcessRating && 
        f.productQualityRating && 
        f.deliverySpeedRating && 
        f.communicationRating
      );

      if (validFeedback.length > 0) {
        aspectRatings.orderingProcess = validFeedback.reduce((sum, f) => sum + (f.orderingProcessRating || 0), 0) / validFeedback.length;
        aspectRatings.productQuality = validFeedback.reduce((sum, f) => sum + (f.productQualityRating || 0), 0) / validFeedback.length;
        aspectRatings.deliverySpeed = validFeedback.reduce((sum, f) => sum + (f.deliverySpeedRating || 0), 0) / validFeedback.length;
        aspectRatings.communication = validFeedback.reduce((sum, f) => sum + (f.communicationRating || 0), 0) / validFeedback.length;
      }
    }

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: feedbackData.filter(f => f.rating === rating).length
    }));

    // Trend data (group by day)
    const trendMap = new Map<string, { sum: number; count: number }>();
    feedbackData.forEach(f => {
      const date = new Date(f.createdAt).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { sum: 0, count: 0 };
      trendMap.set(date, {
        sum: existing.sum + f.rating,
        count: existing.count + 1
      });
    });

    const trendData = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        rating: data.count > 0 ? data.sum / data.count : 0,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days max

    // Top issues
    const issues = await db
      .select()
      .from(issueReports)
      .where(gte(issueReports.createdAt, startDate.toISOString()))
      .execute();

    const issueTypeMap = new Map<string, number>();
    issues.forEach(issue => {
      issueTypeMap.set(issue.issueType, (issueTypeMap.get(issue.issueType) || 0) + 1);
    });

    const topIssues = Array.from(issueTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent feedback with client names
    const recentFeedback = await db
      .select({
        id: orderFeedback.id,
        orderId: orderFeedback.orderId,
        rating: orderFeedback.rating,
        comments: orderFeedback.comments,
        createdAt: orderFeedback.createdAt,
        clientId: orderFeedback.clientId,
        clientNameEn: users.nameEn,
        clientNameAr: users.nameAr
      })
      .from(orderFeedback)
      .leftJoin(users, eq(orderFeedback.clientId, users.id))
      .where(gte(orderFeedback.createdAt, startDate.toISOString()))
      .orderBy(desc(orderFeedback.createdAt))
      .limit(10)
      .execute();

    const recentFeedbackFormatted = recentFeedback.map(f => ({
      id: f.id,
      orderId: f.orderId,
      rating: f.rating,
      comments: f.comments || '',
      createdAt: f.createdAt,
      clientName: f.clientNameEn || 'Unknown Client'
    }));

    const response = {
      totalFeedback,
      averageRating,
      npsScore,
      wouldRecommendPercent,
      aspectRatings,
      ratingDistribution,
      trendData,
      topIssues,
      recentFeedback: recentFeedbackFormatted
    };
    
    console.log('[Feedback Analytics] Sending response:', { totalFeedback, averageRating, npsScore });
    res.json(response);
  } catch (error) {
    console.error('[Feedback Analytics] Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
