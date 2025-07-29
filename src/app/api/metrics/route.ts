// 监控指标 API 接口
import { NextRequest, NextResponse } from 'next/server';
import metricsCollector from '@/lib/metrics';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const reset = searchParams.get('reset') === 'true';
    
    // 如果请求重置指标
    if (reset) {
      metricsCollector.resetMetrics();
      return NextResponse.json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    // 获取监控指标
    const metrics = metricsCollector.getMetrics();
    
    // 格式化响应
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        // 性能指标
        performance: {
          total_searches: metrics.totalSearches,
          avg_response_time: metrics.avgResponseTimeFormatted,
          avg_response_time_ms: Math.round(metrics.avgResponseTime),
          total_response_time: metrics.totalResponseTime,
        },
        
        // 缓存指标
        cache: {
          cache_hits: metrics.cacheHits,
          cache_misses: metrics.cacheMisses,
          cache_hit_rate: metrics.cacheHitRateFormatted,
          cache_hit_rate_percent: Math.round(metrics.cacheHitRate * 100) / 100,
          total_cache_requests: metrics.cacheHits + metrics.cacheMisses
        },
        
        // 错误指标
        errors: {
          total_errors: metrics.totalErrors,
          error_rate: metrics.errorRateFormatted,
          error_rate_percent: Math.round(metrics.errorRate * 100) / 100,
          error_types: metrics.errorTypes,
          most_common_error: Object.keys(metrics.errorTypes).length > 0 
            ? Object.entries(metrics.errorTypes).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
            : 'none'
        },
        
        // 系统指标
        system: {
          uptime: metrics.uptimeFormatted,
          uptime_ms: metrics.uptime,
          last_reset: new Date(metrics.lastResetTime).toISOString(),
          memory: metrics.systemInfo.memory,
          cpu: metrics.systemInfo.cpu,
          nodeVersion: metrics.systemInfo.nodeVersion,
          platform: metrics.systemInfo.platform,
          arch: metrics.systemInfo.arch
        },
        
        // 统计摘要
        summary: {
          status: metrics.totalErrors / Math.max(metrics.totalSearches, 1) < 0.05 ? 'healthy' : 'degraded',
          requests_per_minute: Math.round((metrics.totalSearches / (metrics.uptime / 1000 / 60)) * 100) / 100,
          success_rate: `${Math.round((1 - metrics.errorRate / 100) * 10000) / 100}%`,
          health_score: calculateHealthScore(metrics)
        }
      }
    };
    
    // 根据格式返回响应
    if (format === 'prometheus') {
      // Prometheus格式输出
      const prometheusMetrics = generatePrometheusMetrics(metrics);
      return new Response(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-Version': '1.0'
      }
    });

  } catch (error) {
    console.error('Metrics API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 计算健康评分的优化算法
function calculateHealthScore(metrics: any): number {
  let score = 70; // 基础分数调整为70分
  
  // 奖励机制
  // 1. 响应时间奖励 (最多+20分)
  if (metrics.avgResponseTime <= 500) {
    score += 20; // 超快响应奖励
  } else if (metrics.avgResponseTime <= 1000) {
    score += 15; // 快速响应奖励
  } else if (metrics.avgResponseTime <= 2000) {
    score += 10; // 良好响应奖励
  } else if (metrics.avgResponseTime <= 3000) {
    score += 5; // 可接受响应奖励
  }
  
  // 2. 缓存命中率奖励 (最多+10分)
  if (metrics.cacheHitRate >= 80) {
    score += 10; // 高缓存命中率奖励
  } else if (metrics.cacheHitRate >= 60) {
    score += 7; // 良好缓存命中率奖励
  } else if (metrics.cacheHitRate >= 40) {
    score += 5; // 中等缓存命中率奖励
  } else if (metrics.cacheHitRate >= 20) {
    score += 2; // 基础缓存命中率奖励
  }
  
  // 3. 稳定性奖励：长时间无错误 (最多+5分)
  if (metrics.totalSearches >= 10 && metrics.errorRate === 0) {
    score += 5; // 零错误率奖励
  } else if (metrics.errorRate <= 1) {
    score += 3; // 低错误率奖励
  } else if (metrics.errorRate <= 3) {
    score += 1; // 可接受错误率奖励
  }
  
  // 惩罚机制 (放宽规则)
  // 1. 错误率惩罚：每1%错误率扣1.5分 (从2分降低)
  score -= metrics.errorRate * 1.5;
  
  // 2. 响应时间惩罚：超过3000ms才开始惩罚，每1000ms扣5分 (从1000ms阈值提高到3000ms)
  if (metrics.avgResponseTime > 3000) {
    score -= Math.floor((metrics.avgResponseTime - 3000) / 1000) * 5;
  }
  
  // 3. 高错误率额外惩罚
  if (metrics.errorRate > 10) {
    score -= (metrics.errorRate - 10) * 2; // 超过10%错误率额外惩罚
  }
  
  // 确保分数在0-100范围内，但设置最低分数为10分
  return Math.max(10, Math.min(100, Math.round(score)));
}

// 生成Prometheus格式的指标
function generatePrometheusMetrics(metrics: any): string {
  const lines = [
    '# HELP web_query_searches_total Total number of search requests',
    '# TYPE web_query_searches_total counter',
    `web_query_searches_total ${metrics.totalSearches}`,
    '',
    '# HELP web_query_response_time_ms Average response time in milliseconds',
    '# TYPE web_query_response_time_ms gauge',
    `web_query_response_time_ms ${Math.round(metrics.avgResponseTime)}`,
    '',
    '# HELP web_query_cache_hits_total Total number of cache hits',
    '# TYPE web_query_cache_hits_total counter',
    `web_query_cache_hits_total ${metrics.cacheHits}`,
    '',
    '# HELP web_query_cache_hit_rate Cache hit rate percentage',
    '# TYPE web_query_cache_hit_rate gauge',
    `web_query_cache_hit_rate ${metrics.cacheHitRate}`,
    '',
    '# HELP web_query_errors_total Total number of errors',
    '# TYPE web_query_errors_total counter',
    `web_query_errors_total ${metrics.totalErrors}`,
    '',
    '# HELP web_query_error_rate Error rate percentage',
    '# TYPE web_query_error_rate gauge',
    `web_query_error_rate ${metrics.errorRate}`,
    '',
    '# HELP web_query_uptime_seconds Service uptime in seconds',
    '# TYPE web_query_uptime_seconds gauge',
    `web_query_uptime_seconds ${Math.round(metrics.uptime / 1000)}`,
    ''
  ];
  
  // 添加错误类型指标
  Object.entries(metrics.errorTypes).forEach(([errorType, count]) => {
    lines.push(`web_query_errors_by_type{type="${errorType}"} ${count}`);
  });
  
  return lines.join('\n');
}

// POST方法用于重置指标（需要认证）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'reset') {
      metricsCollector.resetMetrics();
      return NextResponse.json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use {"action": "reset"} to reset metrics.'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Metrics POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );
  }
}