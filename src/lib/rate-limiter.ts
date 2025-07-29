/**
 * 多层限流系统
 * 包含全局限流、IP限流、用户限流等策略
 */

import { cacheService } from './cache';

export interface RateLimitConfig {
  // 全局限流 - 保护后端服务
  global: {
    maxRequestsPerMinute: number;
    maxConcurrentRequests: number;
  };
  
  // IP限流 - 防止单个IP过度使用
  perIP: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  };
  
  // 搜索词限流 - 防止重复搜索
  perQuery: {
    maxRequestsPerMinute: number;
  };
}

export class RateLimiter {
  private config: RateLimitConfig;
  private concurrentRequests = 0;
  
  constructor(config?: Partial<RateLimitConfig>) {
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

  /**
   * 检查是否允许请求
   */
  async checkRateLimit(clientIP: string, query: string): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    try {
      // 1. 检查全局并发限制
      if (this.concurrentRequests >= this.config.global.maxConcurrentRequests) {
        return {
          allowed: false,
          reason: 'Too many concurrent requests. Please try again later.',
          retryAfter: 10
        };
      }

      // 2. 检查全局频率限制
      const globalCount = await this.getRequestCount('global', 60);
      if (globalCount >= this.config.global.maxRequestsPerMinute) {
        return {
          allowed: false,
          reason: 'Global rate limit exceeded. Please try again later.',
          retryAfter: 60
        };
      }

      // 3. 检查IP频率限制
      const ipMinuteCount = await this.getRequestCount(`ip:${clientIP}`, 60);
      const ipHourCount = await this.getRequestCount(`ip:${clientIP}`, 3600);
      
      if (ipMinuteCount >= this.config.perIP.maxRequestsPerMinute) {
        return {
          allowed: false,
          reason: 'Too many requests from your IP. Please slow down.',
          retryAfter: 60
        };
      }
      
      if (ipHourCount >= this.config.perIP.maxRequestsPerHour) {
        return {
          allowed: false,
          reason: 'Hourly limit exceeded for your IP. Please try again later.',
          retryAfter: 3600
        };
      }

      // 4. 检查搜索词限制（防止短时间内重复搜索）
      const queryKey = this.sanitizeQuery(query);
      const queryCount = await this.getRequestCount(`query:${queryKey}:${clientIP}`, 60);
      
      if (queryCount >= this.config.perQuery.maxRequestsPerMinute) {
        return {
          allowed: false,
          reason: 'Too many searches for the same query. Please wait a moment.',
          retryAfter: 60
        };
      }

      return { allowed: true };
      
    } catch (error) {
      console.error('Rate limiter error:', error);
      // 如果限流系统出错，允许请求通过（降级策略）
      return { allowed: true };
    }
  }

  /**
   * 记录请求
   */
  async recordRequest(clientIP: string, query: string): Promise<void> {
    try {
      this.concurrentRequests++;
      
      const now = Date.now();
      const queryKey = this.sanitizeQuery(query);
      
      // 记录各种维度的请求计数
      await Promise.all([
        this.incrementCounter('global', 60),
        this.incrementCounter(`ip:${clientIP}`, 60),
        this.incrementCounter(`ip:${clientIP}`, 3600),
        this.incrementCounter(`query:${queryKey}:${clientIP}`, 60)
      ]);
      
    } catch (error) {
      console.error('Failed to record request:', error);
    }
  }

  /**
   * 请求完成后调用
   */
  async finishRequest(): Promise<void> {
    this.concurrentRequests = Math.max(0, this.concurrentRequests - 1);
  }

  /**
   * 获取指定键的请求计数
   */
  private async getRequestCount(key: string, windowSeconds: number): Promise<number> {
    try {
      const cacheKey = `rate_limit:${key}`;
      const count = await cacheService.get(cacheKey);
      return parseInt(count || '0');
    } catch (error) {
      console.error('Failed to get request count:', error);
      return 0;
    }
  }

  /**
   * 增加计数器
   */
  private async incrementCounter(key: string, windowSeconds: number): Promise<void> {
    try {
      const cacheKey = `rate_limit:${key}`;
      const current = await cacheService.get(cacheKey);
      const count = parseInt(current || '0') + 1;
      
      // 设置过期时间稍长一些，确保窗口完整
      await cacheService.set(cacheKey, count.toString(), windowSeconds + 10);
    } catch (error) {
      console.error('Failed to increment counter:', error);
    }
  }

  /**
   * 清理搜索词（用于限流key）
   */
  private sanitizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_') // 保留中英文和数字
      .substring(0, 50); // 限制长度
  }

  /**
   * 获取客户端真实IP
   */
  static getClientIP(request: Request): string {
    // 检查各种可能的IP头
    const headers = request.headers;
    
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
      // X-Forwarded-For 可能包含多个IP，取第一个
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = headers.get('x-real-ip');
    if (realIP) {
      return realIP.trim();
    }
    
    const clientIP = headers.get('x-client-ip');
    if (clientIP) {
      return clientIP.trim();
    }
    
    // 开发环境fallback
    return '127.0.0.1';
  }

  /**
   * 获取当前限流状态（用于监控）
   */
  async getStatus(): Promise<{
    concurrentRequests: number;
    config: RateLimitConfig;
  }> {
    return {
      concurrentRequests: this.concurrentRequests,
      config: this.config
    };
  }
}

// 创建全局实例
export const rateLimiter = new RateLimiter();