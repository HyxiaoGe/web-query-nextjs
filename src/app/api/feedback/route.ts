/**
 * 用户反馈API端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { feedbackService } from '@/lib/feedback';
import { metricsCollector } from '@/lib/metrics';
import type { FeedbackSubmission, FeedbackType } from '@/types/feedback';

// 提交反馈
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['query', 'resultUrl', 'resultTitle', 'resultEngine', 'feedbackType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 验证反馈类型
    const validFeedbackTypes = ['inaccurate', 'spam', 'helpful', 'irrelevant', 'outdated'];
    if (!validFeedbackTypes.includes(body.feedbackType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    const submission: FeedbackSubmission = {
      query: body.query,
      resultUrl: body.resultUrl,
      resultTitle: body.resultTitle,
      resultContent: body.resultContent || '',
      resultEngine: body.resultEngine,
      resultScore: body.resultScore,
      feedbackType: body.feedbackType as FeedbackType,
      comment: body.comment
    };

    const userAgent = request.headers.get('user-agent') || undefined;
    const feedback = feedbackService.submitFeedback(submission, userAgent);

    // 更新指标
    metricsCollector.recordFeedback(submission.feedbackType).catch(console.error);

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        timestamp: feedback.timestamp
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取反馈统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'stats') {
      const stats = feedbackService.getFeedbackStats();
      return NextResponse.json({
        success: true,
        stats
      });
    }

    if (type === 'analysis') {
      const analysis = feedbackService.analyzeSearchQuality();
      return NextResponse.json({
        success: true,
        analysis: {
          queryAccuracy: Object.fromEntries(analysis.queryAccuracy),
          enginePerformance: Object.fromEntries(analysis.enginePerformance),
          contentQuality: Object.fromEntries(analysis.contentQuality)
        }
      });
    }

    if (type === 'query' && searchParams.get('q')) {
      const query = searchParams.get('q')!;
      const queryFeedbacks = feedbackService.getQueryFeedbacks(query);
      return NextResponse.json({
        success: true,
        feedbacks: queryFeedbacks
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}