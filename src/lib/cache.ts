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
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
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

// 创建缓存服务实例
let cacheService: CacheService;

if (process.env.REDIS_URL && process.env.NODE_ENV !== 'development') {
  cacheService = new RedisCacheService();
} else {
  // 开发环境或没有 Redis 时使用内存缓存
  cacheService = new MemoryCacheService();
  console.log('Using memory cache service (Redis not available)');
}

export { cacheService };