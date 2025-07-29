/**
 * 用户反馈系统类型定义
 */

export interface SearchResultFeedback {
  id: string;
  query: string;
  result: {
    title: string;
    url: string;
    content: string;
    engine: string;
    score?: number;
  };
  feedback: {
    type: FeedbackType;
    comment?: string;
  };
  timestamp: string;
  sessionId?: string;
  userAgent?: string;
}

export enum FeedbackType {
  INACCURATE = 'inaccurate',      // 结果不准确
  SPAM = 'spam',                  // 垃圾内容
  HELPFUL = 'helpful',            // 很有用
  IRRELEVANT = 'irrelevant',      // 不相关
  OUTDATED = 'outdated'           // 过时信息
}

export interface FeedbackStats {
  totalFeedbacks: number;
  feedbacksByType: Record<FeedbackType, number>;
  feedbacksByEngine: Record<string, {
    total: number;
    positive: number;
    negative: number;
    accuracy: number;
  }>;
  recentFeedbacks: SearchResultFeedback[];
  topQueries: Array<{
    query: string;
    count: number;
    avgScore: number;
  }>;
}

export interface FeedbackSubmission {
  query: string;
  resultUrl: string;
  resultTitle: string;
  resultContent: string;
  resultEngine: string;
  resultScore?: number;
  feedbackType: FeedbackType;
  comment?: string;
}