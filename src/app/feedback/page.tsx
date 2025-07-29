'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, Clock, Trash2, X, BarChart3 } from 'lucide-react';
import type { FeedbackStats } from '@/types/feedback';

const feedbackTypeConfig = {
  helpful: { label: '很有用', icon: ThumbsUp, color: 'bg-green-100 text-green-800 border-green-200' },
  inaccurate: { label: '不准确', icon: ThumbsDown, color: 'bg-red-100 text-red-800 border-red-200' },
  irrelevant: { label: '不相关', icon: X, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  spam: { label: '垃圾内容', icon: Trash2, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  outdated: { label: '过时信息', icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200' }
};

export default function FeedbackPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedbackStats();
  }, []);

  const fetchFeedbackStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/feedback?type=stats');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback stats');
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFeedbackStats}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">暂无反馈数据</h3>
          <p className="text-gray-600">开始搜索并提供反馈来查看统计信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">用户反馈分析</h1>
          <p className="text-gray-600">搜索结果质量反馈统计</p>
        </div>
      </div>

      {/* 总览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总反馈数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正面反馈</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.feedbacksByType.helpful || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFeedbacks > 0 
                ? Math.round(((stats.feedbacksByType.helpful || 0) / stats.totalFeedbacks) * 100)
                : 0}% 的反馈
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">负面反馈</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(stats.feedbacksByType.inaccurate || 0) + 
               (stats.feedbacksByType.irrelevant || 0) + 
               (stats.feedbacksByType.spam || 0) + 
               (stats.feedbacksByType.outdated || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              需要改进的结果
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">搜索引擎数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(stats.feedbacksByEngine).length}</div>
            <p className="text-xs text-muted-foreground">活跃搜索引擎</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 反馈类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>反馈类型分布</CardTitle>
            <CardDescription>用户反馈的详细分类</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(feedbackTypeConfig).map(([type, config]) => {
              const count = stats.feedbacksByType[type as keyof typeof stats.feedbacksByType] || 0;
              const percentage = stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : 0;
              const IconComponent = config.icon;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <Badge variant="outline" className={config.color}>
                      {count}
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% 的反馈
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 搜索引擎表现 */}
        <Card>
          <CardHeader>
            <CardTitle>搜索引擎表现</CardTitle>
            <CardDescription>各搜索引擎的用户满意度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.feedbacksByEngine).map(([engine, data]) => (
              <div key={engine} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{engine}</span>
                    <Badge variant="outline">
                      {data.total} 反馈
                    </Badge>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    {data.accuracy.toFixed(1)}% 满意度
                  </span>
                </div>
                <Progress value={data.accuracy} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>正面: {data.positive}</span>
                  <span>负面: {data.negative}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 热门查询 */}
      <Card>
        <CardHeader>
          <CardTitle>热门查询</CardTitle>
          <CardDescription>用户反馈最多的搜索查询</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topQueries.map((queryData, index) => (
              <div key={queryData.query} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium">{queryData.query}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{queryData.count} 次反馈</span>
                  {queryData.avgScore > 0 && (
                    <span>平均分: {queryData.avgScore.toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
            {stats.topQueries.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                暂无查询数据
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 最近反馈 */}
      <Card>
        <CardHeader>
          <CardTitle>最近反馈</CardTitle>
          <CardDescription>最新的用户反馈记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentFeedbacks.map((feedback) => {
              const config = feedbackTypeConfig[feedback.feedback.type];
              const IconComponent = config?.icon || MessageSquare;
              
              return (
                <div key={feedback.id} className="flex items-start gap-3 p-3 border rounded">
                  <IconComponent className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{feedback.query}</span>
                      <Badge variant="outline" className={config?.color}>
                        {config?.label || feedback.feedback.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {feedback.result.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(feedback.timestamp).toLocaleString('zh-CN')} • {feedback.result.engine}
                    </p>
                  </div>
                </div>
              );
            })}
            {stats.recentFeedbacks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                暂无最近反馈
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}