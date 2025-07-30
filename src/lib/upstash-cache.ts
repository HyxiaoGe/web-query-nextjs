// Upstash Redis 缓存服务（用于 Vercel 部署）
import type { CacheService } from '@/types/search';

interface UpstashResponse {
  result: string | null;
}

class UpstashCacheService implements CacheService {
  private baseUrl: string;
  private token: string;
  private defaultTtl: number;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL || '';
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
    
    if (!url || !token) {
      throw new Error('Upstash Redis credentials not configured');
    }
    
    this.baseUrl = url;
    this.token = token;
    this.defaultTtl = parseInt(process.env.CACHE_TTL || '3600');
  }

  private async request(command: string[], method = 'POST'): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`Upstash request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Upstash request error:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const result = await this.request(['GET', key]);
      if (result) {
        return JSON.parse(result);
      }
      return null;
    } catch (error) {
      console.error('Upstash get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const finalTtl = ttl || this.defaultTtl;
      const serialized = JSON.stringify(value);
      
      await this.request(['SETEX', key, finalTtl.toString(), serialized]);
      return true;
    } catch (error) {
      console.error('Upstash set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.request(['DEL', key]);
      return true;
    } catch (error) {
      console.error('Upstash delete error:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const result = await this.request(['INCR', key]);
      return parseInt(result) || 0;
    } catch (error) {
      console.error('Upstash incr error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.request(['EXPIRE', key, seconds.toString()]);
      return result === 1;
    } catch (error) {
      console.error('Upstash expire error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const result = await this.request(['TTL', key]);
      return parseInt(result) || -1;
    } catch (error) {
      console.error('Upstash ttl error:', error);
      return -1;
    }
  }
}

export { UpstashCacheService };