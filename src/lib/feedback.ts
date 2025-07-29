/**
 * 用户反馈数据收集和分析服务
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { SearchResultFeedback, FeedbackStats, FeedbackSubmission, FeedbackType } from '@/types/feedback';

class FeedbackService {
  private dataFile: string;
  private feedbacks: SearchResultFeedback[];

  constructor() {
    this.dataFile = path.join(process.cwd(), '.feedbacks.json');
    this.feedbacks = this.loadFeedbacks();
  }

  /**
   * 加载反馈数据
   */
  private loadFeedbacks(): SearchResultFeedback[] {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        return JSON.parse(data) || [];
      }
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
    }
    return [];
  }

  /**
   * 保存反馈数据
   */
  private saveFeedbacks() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.feedbacks, null, 2));
    } catch (error) {
      console.error('Failed to save feedbacks:', error);
    }
  }

  /**
   * 提交用户反馈
   */
  submitFeedback(submission: FeedbackSubmission, userAgent?: string): SearchResultFeedback {
    const feedback: SearchResultFeedback = {
      id: crypto.randomUUID(),
      query: submission.query,
      result: {
        title: submission.resultTitle,
        url: submission.resultUrl,
        content: submission.resultContent,
        engine: submission.resultEngine,
        score: submission.resultScore
      },
      feedback: {
        type: submission.feedbackType,
        comment: submission.comment
      },
      timestamp: new Date().toISOString(),
      userAgent
    };

    this.feedbacks.push(feedback);
    this.saveFeedbacks();

    return feedback;
  }

  /**
   * 获取反馈统计数据
   */
  getFeedbackStats(): FeedbackStats {
    const totalFeedbacks = this.feedbacks.length;
    
    // 按反馈类型统计
    const feedbacksByType = this.feedbacks.reduce((acc, feedback) => {
      acc[feedback.feedback.type] = (acc[feedback.feedback.type] || 0) + 1;
      return acc;
    }, {} as Record<FeedbackType, number>);

    // 按搜索引擎统计
    const feedbacksByEngine = this.feedbacks.reduce((acc, feedback) => {
      const engine = feedback.result.engine;
      if (!acc[engine]) {
        acc[engine] = { total: 0, positive: 0, negative: 0, accuracy: 0 };
      }
      
      acc[engine].total++;
      
      // 分类正面和负面反馈
      if (['helpful'].includes(feedback.feedback.type)) {
        acc[engine].positive++;
      } else if (['inaccurate', 'spam', 'irrelevant', 'outdated'].includes(feedback.feedback.type)) {
        acc[engine].negative++;
      }
      
      // 计算准确率
      acc[engine].accuracy = acc[engine].total > 0 
        ? (acc[engine].positive / acc[engine].total) * 100 
        : 0;
      
      return acc;
    }, {} as Record<string, { total: number; positive: number; negative: number; accuracy: number }>);

    // 最近的反馈
    const recentFeedbacks = this.feedbacks
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // 热门查询统计
    const queryStats = this.feedbacks.reduce((acc, feedback) => {
      const query = feedback.query.toLowerCase();
      if (!acc[query]) {
        acc[query] = { count: 0, scores: [] };
      }
      acc[query].count++;
      if (feedback.result.score) {
        acc[query].scores.push(feedback.result.score);
      }
      return acc;
    }, {} as Record<string, { count: number; scores: number[] }>);

    const topQueries = Object.entries(queryStats)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgScore: stats.scores.length > 0 
          ? stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length 
          : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalFeedbacks,
      feedbacksByType,
      feedbacksByEngine,
      recentFeedbacks,
      topQueries
    };
  }

  /**
   * 获取查询的反馈历史
   */
  getQueryFeedbacks(query: string): SearchResultFeedback[] {
    return this.feedbacks.filter(
      feedback => feedback.query.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 获取URL的反馈历史
   */
  getUrlFeedbacks(url: string): SearchResultFeedback[] {
    return this.feedbacks.filter(
      feedback => feedback.result.url === url
    );
  }

  /**
   * 分析搜索结果质量（为机器学习准备数据）
   */
  analyzeSearchQuality() {
    const analysis = {
      queryAccuracy: new Map<string, number>(),
      enginePerformance: new Map<string, number>(),
      contentQuality: new Map<string, number>(),
      temporalTrends: new Map<string, number>()
    };

    // 计算查询准确率
    const queryGroups = this.groupFeedbacksByQuery();
    queryGroups.forEach((feedbacks, query) => {
      const positive = feedbacks.filter(f => f.feedback.type === 'helpful').length;
      const total = feedbacks.length;
      analysis.queryAccuracy.set(query, total > 0 ? positive / total : 0);
    });

    // 计算引擎性能
    const engineGroups = this.groupFeedbacksByEngine();
    engineGroups.forEach((feedbacks, engine) => {
      const positive = feedbacks.filter(f => f.feedback.type === 'helpful').length;
      const total = feedbacks.length;
      analysis.enginePerformance.set(engine, total > 0 ? positive / total : 0);
    });

    return analysis;
  }

  /**
   * 按查询分组反馈
   */
  private groupFeedbacksByQuery(): Map<string, SearchResultFeedback[]> {
    return this.feedbacks.reduce((acc, feedback) => {
      const query = feedback.query.toLowerCase();
      if (!acc.has(query)) {
        acc.set(query, []);
      }
      acc.get(query)!.push(feedback);
      return acc;
    }, new Map<string, SearchResultFeedback[]>());
  }

  /**
   * 按引擎分组反馈
   */
  private groupFeedbacksByEngine(): Map<string, SearchResultFeedback[]> {
    return this.feedbacks.reduce((acc, feedback) => {
      const engine = feedback.result.engine;
      if (!acc.has(engine)) {
        acc.set(engine, []);
      }
      acc.get(engine)!.push(feedback);
      return acc;
    }, new Map<string, SearchResultFeedback[]>());
  }

  /**
   * 清理过期反馈数据（保留最近30天）
   */
  cleanupOldFeedbacks() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    this.feedbacks = this.feedbacks.filter(
      feedback => new Date(feedback.timestamp) > thirtyDaysAgo
    );

    this.saveFeedbacks();
  }
}

// 单例实例
export const feedbackService = new FeedbackService();