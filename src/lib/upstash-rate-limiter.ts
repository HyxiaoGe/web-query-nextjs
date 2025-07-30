/**
 * Upstash Redis 限流器
 * 用于 Vercel 部署环境
 */

import { UpstashCacheService } from './upstash-cache';

export class UpstashRateLimiter {
  private cache: UpstashCacheService;
  private config: any;
  
  constructor(config?: any) {
    this.cache = new UpstashCacheService();
    this.config = {
      global: {
        maxRequestsPerMinute: parseInt(process.env.GLOBAL_RATE_LIMIT_PER_MINUTE || '100'),
        maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10')
      },
      perIP: {
        maxRequestsPerMinute: parseInt(process.env.IP_RATE_LIMIT_PER_MINUTE || '20'),
        maxRequestsPerHour: parseInt(process.env.IP_RATE_LIMIT_PER_HOUR || '200')
      },
      perQuery: {
        maxRequestsPerMinute: parseInt(process.env.QUERY_RATE_LIMIT_PER_MINUTE || '5')
      },
      ...config
    };
  }

  async checkRateLimit(clientIP: string, query: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    try {
      // 简化的限流检查（Upstash 优化版）
      const ipKey = `rate:ip:${clientIP}:min`;
      const ipCount = await this.cache.incr(ipKey);
      
      if (ipCount === 1) {
        await this.cache.expire(ipKey, 60);
      }
      
      if (ipCount > this.config.perIP.maxRequestsPerMinute) {
        return {
          allowed: false,
          reason: 'Too many requests',
          retryAfter: 60
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // 失败时允许请求通过
      return { allowed: true };
    }
  }

  async recordRequest(clientIP: string, query: string): Promise<void> {
    // 记录已在 checkRateLimit 中完成
  }

  async finishRequest(): Promise<void> {
    // Upstash 不需要管理并发计数
  }

  static getClientIP(request: any): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || real || 'unknown';
    return ip.trim();
  }

  async getStatus(): Promise<{
    concurrentRequests: number;
    config: any;
  }> {
    return {
      concurrentRequests: 0, // Upstash 不跟踪并发
      config: this.config
    };
  }
}