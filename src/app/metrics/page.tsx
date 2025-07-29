'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MetricsData {
  success: boolean;
  timestamp: string;
  metrics: {
    performance: {
      total_searches: number;
      avg_response_time: string;
      avg_response_time_ms: number;
      total_response_time: number;
    };
    cache: {
      cache_hits: number;
      cache_misses: number;
      cache_hit_rate: string;
      cache_hit_rate_percent: number;
      total_cache_requests: number;
    };
    errors: {
      total_errors: number;
      error_rate: string;
      error_rate_percent: number;
      error_types: Record<string, number>;
      most_common_error: string;
    };
    system: {
      uptime: {
        seconds: number;
        formatted: string;
      };
      uptime_ms: number;
      last_reset: string;
      memory: {
        used: number;
        total: number;
        external: number;
        rss: number;
      };
      cpu: {
        user: number;
        system: number;
      };
      nodeVersion: string;
      platform: string;
      arch: string;
    };
    summary: {
      status: string;
      requests_per_minute: number;
      success_rate: string;
      health_score: number;
    };
  };
}


export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const autoRefresh = true; // 始终开启自动刷新

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 5000); // 每5秒刷新
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">加载监控数据中...</div>
          <div className="text-muted-foreground">请稍候</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-red-600">
          <div className="text-lg font-semibold mb-2">无法加载监控数据</div>
          <Button onClick={fetchMetrics}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">监控面板</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              最后更新: {lastUpdate?.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 服务状态 */}
        <div className={`p-6 rounded-lg border-2 ${getStatusColor(metrics.metrics.summary.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">服务状态</p>
              <p className="text-2xl font-bold capitalize">{metrics.metrics.summary.status}</p>
            </div>
            <div className="text-3xl">
              {metrics.metrics.summary.status === 'healthy' ? '✅' : '⚠️'}
            </div>
          </div>
        </div>

        {/* 健康评分 */}
        <div className="p-6 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-gray-600">健康评分</p>
                <div className="relative group">
                  <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    ❓
                  </button>
                  <div className="absolute left-0 top-6 w-96 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="font-semibold mb-2">健康评分计算规则</div>
                    <div className="space-y-2">
                      <div><strong>基础分数:</strong> 70分</div>
                      <div className="text-green-300"><strong>奖励机制:</strong></div>
                      <div className="pl-2 space-y-1">
                        <div>• 响应时间 ≤500ms: +20分</div>
                        <div>• 响应时间 ≤1000ms: +15分</div>
                        <div>• 响应时间 ≤2000ms: +10分</div>
                        <div>• 响应时间 ≤3000ms: +5分</div>
                        <div>• 缓存命中率 ≥80%: +10分</div>
                        <div>• 零错误率(≥10次搜索): +5分</div>
                      </div>
                      <div className="text-red-300"><strong>惩罚机制:</strong></div>
                      <div className="pl-2 space-y-1">
                        <div>• 错误率: 每1%扣1.5分</div>
                        <div>• 响应时间: 超过3000ms，每1000ms扣5分</div>
                        <div>• 高错误率: 超过10%额外惩罚</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <div><strong>当前状态:</strong> ({Math.round(metrics.metrics.performance.avg_response_time_ms)}ms, {metrics.metrics.errors.error_rate_percent}%错误) = {Math.round(metrics.metrics.summary.health_score)}分</div>
                        <div className="text-gray-400">最低保底分数: 10分</div>
                      </div>
                    </div>
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>
              </div>
              <p className={`text-2xl font-bold ${getHealthScoreColor(metrics.metrics.summary.health_score)}`}>
                {Math.round(metrics.metrics.summary.health_score)}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        {/* 总搜索次数 */}
        <div className="p-6 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总搜索次数</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics.metrics.performance.total_searches}
              </p>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
        </div>

        {/* 成功率 */}
        <div className="p-6 rounded-lg border bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">成功率</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics.metrics.summary.success_rate}
              </p>
            </div>
            <div className="text-3xl">✨</div>
          </div>
        </div>

      </div>

      {/* 详细指标 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 性能指标 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ⚡ 性能指标
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均响应时间</span>
              <span className="font-semibold">{metrics.metrics.performance.avg_response_time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">每分钟请求数</span>
              <span className="font-semibold">{metrics.metrics.summary.requests_per_minute.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">总响应时间</span>
              <span className="font-semibold">{metrics.metrics.performance.total_response_time}ms</span>
            </div>
          </div>
        </div>

        {/* 缓存指标 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🗄️ 缓存指标
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">缓存命中率</span>
              <span className="font-semibold text-blue-600">{metrics.metrics.cache.cache_hit_rate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">缓存命中</span>
              <span className="font-semibold text-green-600">{metrics.metrics.cache.cache_hits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">缓存未命中</span>
              <span className="font-semibold text-orange-600">{metrics.metrics.cache.cache_misses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">总缓存请求</span>
              <span className="font-semibold">{metrics.metrics.cache.total_cache_requests}</span>
            </div>
          </div>
        </div>

        {/* 错误指标 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🐛 错误指标
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">错误率</span>
              <span className="font-semibold text-red-600">{metrics.metrics.errors.error_rate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">总错误数</span>
              <span className="font-semibold">{metrics.metrics.errors.total_errors}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">最常见错误</span>
              <span className="font-semibold">{metrics.metrics.errors.most_common_error}</span>
            </div>
            {Object.keys(metrics.metrics.errors.error_types).length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">错误类型分布:</div>
                {Object.entries(metrics.metrics.errors.error_types).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 系统指标 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💻 系统指标
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">运行时间</span>
              <span className="font-semibold">{metrics.metrics.system.uptime.formatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">内存使用</span>
              <span className="font-semibold">
                {metrics.metrics.system.memory.used}MB / {metrics.metrics.system.memory.total}MB
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">RSS 内存</span>
              <span className="font-semibold">{metrics.metrics.system.memory.rss}MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Node.js 版本</span>
              <span className="font-semibold">{metrics.metrics.system.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平台</span>
              <span className="font-semibold">{metrics.metrics.system.platform} ({metrics.metrics.system.arch})</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}