// 搜索 API 接口
import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search';
import { rateLimiter, RateLimiter } from '@/lib/rate-limiter';
import { recordSearchQuery } from '@/lib/search-stats';
import metricsCollector from '@/lib/metrics';
import type { SearchParams } from '@/types/search';

// 输入验证
function validateSearchParams(body: any): { isValid: boolean; error?: string; params?: SearchParams } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const { q, categories, engines, language, time_range, safesearch, limit } = body;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return { isValid: false, error: 'Query parameter "q" is required' };
  }

  if (q.length > 500) {
    return { isValid: false, error: 'Query too long (max 500 characters)' };
  }

  // 验证其他参数
  if (categories && typeof categories !== 'string') {
    return { isValid: false, error: 'Invalid categories parameter' };
  }

  if (engines && typeof engines !== 'string' && !Array.isArray(engines)) {
    return { isValid: false, error: 'Invalid engines parameter' };
  }

  if (language && typeof language !== 'string') {
    return { isValid: false, error: 'Invalid language parameter' };
  }

  if (time_range && !['day', 'week', 'month', 'year'].includes(time_range)) {
    return { isValid: false, error: 'Invalid time_range parameter' };
  }

  if (safesearch !== undefined && ![0, 1, 2].includes(Number(safesearch))) {
    return { isValid: false, error: 'Invalid safesearch parameter' };
  }

  if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 50)) {
    return { isValid: false, error: 'Invalid limit parameter (1-50)' };
  }

  const params: SearchParams = {
    q: q.trim(),
    categories: categories || 'general',
    engines,
    language: language || 'zh-CN',
    time_range: time_range || null,
    safesearch: (Number(safesearch) || 0) as 0 | 1 | 2,
    limit: limit || 10
  };

  return { isValid: true, params };
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 验证输入
    const validation = validateSearchParams(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 获取客户端IP
    const clientIP = RateLimiter.getClientIP(request);
    
    // 检查限流
    const rateLimitCheck = await rateLimiter.checkRateLimit(clientIP, validation.params!.q);
    if (!rateLimitCheck.allowed) {
      // 记录限流事件
      metricsCollector.recordError('rate_limited').catch(console.error);
      
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.reason,
          timestamp: new Date().toISOString(),
          retryAfter: rateLimitCheck.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
            'X-RateLimit-Reason': rateLimitCheck.reason || 'Rate limit exceeded'
          }
        }
      );
    }

    // 记录请求
    await rateLimiter.recordRequest(clientIP, validation.params!.q);

    try {
      // 执行搜索并记录性能指标
      const startTime = Date.now();
      const result = await searchService.search(validation.params!);
      const responseTime = Date.now() - startTime;
      
      // 记录监控指标
      if (result.success) {
        metricsCollector.recordSearch(responseTime, result.cached).catch(console.error);
        // 记录搜索词统计（异步执行，不阻塞响应）
        recordSearchQuery(validation.params!.q).catch(console.error);
      } else {
        metricsCollector.recordError('search_failed').catch(console.error);
      }
      
      // 返回结果
      return NextResponse.json(result, {
        status: result.success ? 200 : 500,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          'X-API-Version': '1.0',
          'X-Response-Time': `${responseTime}ms`
        }
      });
      
    } finally {
      // 无论成功失败都要释放并发计数
      await rateLimiter.finishRequest();
    }

  } catch (error) {
    console.error('Search API error:', error);
    
    // 记录错误
    metricsCollector.recordError('api_error').catch(console.error);
    
    // 确保释放并发计数
    await rateLimiter.finishRequest();
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET 方法支持（查询参数方式）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      q: searchParams.get('q') || '',
      categories: searchParams.get('categories') || undefined,
      engines: searchParams.get('engines')?.split(',') || undefined,
      language: searchParams.get('language') || undefined,
      time_range: searchParams.get('time_range') as any || undefined,
      safesearch: searchParams.get('safesearch') ? Number(searchParams.get('safesearch')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    };

    // 验证输入
    const validation = validateSearchParams(params);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // 获取客户端IP
    const clientIP = RateLimiter.getClientIP(request);
    
    // 检查限流
    const rateLimitCheck = await rateLimiter.checkRateLimit(clientIP, validation.params!.q);
    if (!rateLimitCheck.allowed) {
      metricsCollector.recordError('rate_limited').catch(console.error);
      
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.reason,
          timestamp: new Date().toISOString(),
          retryAfter: rateLimitCheck.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
            'X-RateLimit-Reason': rateLimitCheck.reason || 'Rate limit exceeded'
          }
        }
      );
    }

    // 记录请求
    await rateLimiter.recordRequest(clientIP, validation.params!.q);

    try {
      // 执行搜索并记录性能指标
      const startTime = Date.now();
      const result = await searchService.search(validation.params!);
      const responseTime = Date.now() - startTime;
      
      // 记录监控指标
      if (result.success) {
        metricsCollector.recordSearch(responseTime, result.cached).catch(console.error);
        // 记录搜索词统计（异步执行，不阻塞响应）
        recordSearchQuery(validation.params!.q).catch(console.error);
      } else {
        metricsCollector.recordError('search_failed').catch(console.error);
      }
      
      return NextResponse.json(result, {
        status: result.success ? 200 : 500,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          'X-Response-Time': `${responseTime}ms`
        }
      });
      
    } finally {
      await rateLimiter.finishRequest();
    }

  } catch (error) {
    console.error('Search API error:', error);
    
    // 记录错误
    metricsCollector.recordError('api_error').catch(console.error);
    
    // 确保释放并发计数
    await rateLimiter.finishRequest();
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}