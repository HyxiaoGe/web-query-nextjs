// 健康检查 API
import { NextResponse } from 'next/server';
import { searchService } from '@/lib/search';
import metricsCollector from '@/lib/metrics';

export async function GET() {
  try {
    const health = await searchService.healthCheck();
    const metrics = await metricsCollector.getMetrics();
    
    // 判断整体健康状态
    const errorRate = metrics.errorRate;
    const avgResponseTime = metrics.avgResponseTime;
    const isHealthy = health.status === 'healthy' && errorRate < 5 && avgResponseTime < 5000;
    
    const status = isHealthy ? 200 : 503;
    
    return NextResponse.json({
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      checks: {
        searxng: health.searxng,
        cache: health.cache,
        api: true,
        performance: {
          avg_response_time: metrics.avgResponseTimeFormatted,
          error_rate: metrics.errorRateFormatted,
          cache_hit_rate: metrics.cacheHitRateFormatted,
          status: errorRate < 5 && avgResponseTime < 5000 ? 'healthy' : 'degraded'
        }
      },
      metrics: {
        total_searches: metrics.totalSearches,
        uptime: metrics.uptimeFormatted,
        memory_usage: `${metrics.systemInfo.memory.used}MB / ${metrics.systemInfo.memory.total}MB`,
        success_rate: `${Math.round((1 - errorRate / 100) * 10000) / 100}%`
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0-mvp'
    }, { status });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}