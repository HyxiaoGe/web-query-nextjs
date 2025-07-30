// Redis 缓存服务
import { createClient, RedisClientType } from 'redis';
import type { CacheService } from '@/types/search';

class RedisCacheService implements CacheService {
  private client: RedisClientType | null = null;
  private connected = false;
  private ttl: number;

  constructor() {
    this.ttl = parseInt(process.env.CACHE_TTL || '3600');
    this.init().catch(console.error);
  }

  private async init() {
    try {
      // 支持 Upstash Redis URL 格式
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      
      if (redisUrl?.includes('upstash')) {
        // Upstash Redis 使用 REST API，需要特殊处理
        console.log('Detected Upstash Redis, using REST mode');
        // 注意：在生产环境中，我们将使用 @upstash/redis 包
      }
      
      this.client = createClient({
        url: redisUrl || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Too many reconnection attempts');
              return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.connected = false;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const finalTtl = ttl || this.ttl;
      const serialized = JSON.stringify(value);
      
      await this.client.setEx(key, finalTtl, serialized);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// 内存缓存服务（备用方案）
class MemoryCacheService implements CacheService {
  private cache = new Map<string, { value: any; expires: number }>();
  private ttl: number;

  constructor() {
    this.ttl = parseInt(process.env.CACHE_TTL || '3600') * 1000; // 转换为毫秒
    
    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (item.expires < now) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async get(key: string): Promise<any> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    const finalTtl = (ttl || this.ttl / 1000) * 1000;
    const expires = Date.now() + finalTtl;
    
    this.cache.set(key, { value, expires });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
}

// 导入 Upstash 缓存服务
import { UpstashCacheService } from './upstash-cache';

// 创建缓存服务实例
let cacheService: CacheService;

// 根据环境选择合适的缓存服务
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Vercel 部署时使用 Upstash Redis
  try {
    cacheService = new UpstashCacheService();
    console.log('Using Upstash Redis cache service');
  } catch (error) {
    console.error('Failed to initialize Upstash, falling back to memory cache:', error);
    cacheService = new MemoryCacheService();
  }
} else if (process.env.REDIS_URL && process.env.NODE_ENV !== 'development') {
  // 传统 Redis 服务
  cacheService = new RedisCacheService();
} else {
  // 开发环境或没有 Redis 时使用内存缓存
  cacheService = new MemoryCacheService();
  console.log('Using memory cache service (Redis not available)');
}

export { cacheService };