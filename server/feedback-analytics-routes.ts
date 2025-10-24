
import { Router } from 'express';
import { db } from './db';
import { orderFeedback, issueReports, clients, microFeedback } from '../shared/schema';
import { eq, gte, sql, desc, and, gte as greaterThanOrEqual } from 'drizzle-orm';
import { requireAdmin } from './auth';

const router = Router();

router.get('/feedback/analytics', requireAdmin, async (req: any, res) => {
  try {
    console.log('[Feedback Analytics] Request received:', { range: req.query.range, user: req.client?.id });
    const range = req.query.range as string || '30d';
    
    // Validate range parameter
    if (!['7d', '30d', '90d', 'all'].includes(range)) {
      return res.status(400).json({ error: 'Invalid range parameter. Must be one of: 7d, 30d, 90d, all' });
    }
    
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

    let feedbackData: any[] = [];
    
    try {
      // Get all feedback in range
      feedbackData = await db
        .select()
        .from(orderFeedback)
        .where(greaterThanOrEqual(orderFeedback.createdAt, startDate))
        .execute();
    } catch (dbError) {
      console.warn('[Feedback Analytics] Database query failed, using empty data:', dbError);
      // If database query fails, use empty data instead of throwing error
      feedbackData = [];
    }

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
    let issues: any[] = [];
    try {
      issues = await db
        .select()
        .from(issueReports)
        .where(greaterThanOrEqual(issueReports.createdAt, startDate))
        .execute();
    } catch (dbError) {
      console.warn('[Feedback Analytics] Issues query failed:', dbError);
      issues = [];
    }

    const issueTypeMap = new Map<string, number>();
    issues.forEach(issue => {
      issueTypeMap.set(issue.issueType, (issueTypeMap.get(issue.issueType) || 0) + 1);
    });

    const topIssues = Array.from(issueTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent feedback with client names
    let recentFeedback: any[] = [];
    try {
      recentFeedback = await db
        .select({
          id: orderFeedback.id,
          orderId: orderFeedback.orderId,
          rating: orderFeedback.rating,
          comments: orderFeedback.comments,
          createdAt: orderFeedback.createdAt,
          clientId: orderFeedback.clientId,
          clientNameEn: clients.nameEn,
          clientNameAr: clients.nameAr,
          adminResponse: orderFeedback.adminResponse,
          adminResponseAt: orderFeedback.adminResponseAt,
          respondedBy: orderFeedback.respondedBy
        })
        .from(orderFeedback)
        .leftJoin(clients, eq(orderFeedback.clientId, clients.id))
        .where(greaterThanOrEqual(orderFeedback.createdAt, startDate))
        .orderBy(desc(orderFeedback.createdAt))
        .limit(10)
        .execute();
    } catch (dbError) {
      console.warn('[Feedback Analytics] Recent feedback query failed:', dbError);
      recentFeedback = [];
    }

    const recentFeedbackFormatted = recentFeedback.map(f => ({
      id: f.id,
      orderId: f.orderId,
      rating: f.rating,
      comments: f.comments || '',
      createdAt: f.createdAt,
      clientName: f.clientNameEn || 'Unknown Client',
      adminResponse: f.adminResponse,
      adminResponseAt: f.adminResponseAt,
      respondedBy: f.respondedBy
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
      recentFeedback: recentFeedbackFormatted,
      isEmpty: totalFeedback === 0
    };
    
    console.log('[Feedback Analytics] Sending response:', { totalFeedback, averageRating, npsScore, isEmpty: totalFeedback === 0 });
    res.json(response);
  } catch (error) {
    console.error('[Feedback Analytics] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      range: req.query.range,
      user: req.client?.id
    });
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get micro-feedback analytics
router.get('/feedback/micro/analytics', requireAdmin, async (req: any, res) => {
  try {
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
        startDate = new Date(0);
        break;
    }

    // Get all micro feedback in range
    const feedbackData = await db
      .select()
      .from(microFeedback)
      .where(greaterThanOrEqual(microFeedback.createdAt, startDate))
      .execute();

    // Sentiment counts
    const sentimentCounts = {
      positive: feedbackData.filter(f => f.sentiment === 'positive').length,
      neutral: feedbackData.filter(f => f.sentiment === 'neutral').length,
      negative: feedbackData.filter(f => f.sentiment === 'negative').length,
    };

    // Top touchpoints
    const touchpointMap = new Map<string, number>();
    feedbackData.forEach(f => {
      touchpointMap.set(f.touchpoint, (touchpointMap.get(f.touchpoint) || 0) + 1);
    });

    const topTouchpoints = Array.from(touchpointMap.entries())
      .map(([touchpoint, count]) => ({ touchpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent feedback
    const recentFeedback = feedbackData
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(f => ({
        touchpoint: f.touchpoint,
        sentiment: f.sentiment,
        quickResponse: f.quickResponse,
        createdAt: f.createdAt,
      }));

    res.json({
      totalCount: feedbackData.length,
      sentimentCounts,
      topTouchpoints,
      recentFeedback,
    });
  } catch (error) {
    console.error('[Micro Feedback Analytics] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch micro-feedback analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
