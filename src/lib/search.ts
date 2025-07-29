// 搜索服务
import axios from 'axios';
import crypto from 'crypto';
import { cacheService } from './cache';
import { RelevanceScorer } from './relevance';
import { DiversityOptimizer } from './diversity';
import type { SearchParams, SearchResult, SearchResponse } from '@/types/search';

class SearchService {
  private searxngUrl: string;
  private timeout: number;
  private maxResults: number;

  constructor() {
    this.searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8888';
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000');
    this.maxResults = parseInt(process.env.MAX_RESULTS || '10');
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      // 生成缓存键
      const cacheKey = this.generateCacheKey(params);
      
      // 检查缓存
      const cachedResult = await cacheService.get(cacheKey);
      if (cachedResult) {
        console.log('Cache hit for query:', params.q);
        return {
          ...cachedResult,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      // 调用 SearxNG
      const response = await this.callSearxNG(params);
      
      // 格式化结果
      let results = this.formatResults(response.data.results || [], params.limit || this.maxResults);
      
      // 应用相关性评分和过滤
      results = RelevanceScorer.filterSpamResults(results);
      results = RelevanceScorer.scoreResults(results, params.q);
      results = RelevanceScorer.deduplicateResults(results);
      
      // 优化结果多样性，确保来自不同搜索引擎
      results = DiversityOptimizer.optimizeDiversity(results, params.limit || this.maxResults);
      
      // 构造响应
      const searchResponse: SearchResponse = {
        success: true,
        query: params.q,
        results,
        count: results.length,
        cached: false,
        timestamp: new Date().toISOString()
      };

      // 缓存结果
      await cacheService.set(cacheKey, searchResponse);

      return searchResponse;
    } catch (error) {
      console.error('Search error:', error);
      
      // 尝试返回过期缓存
      const cacheKey = this.generateCacheKey(params);
      const staleResult = await cacheService.get(`stale:${cacheKey}`);
      
      if (staleResult) {
        console.log('Using stale cache due to error');
        return {
          ...staleResult,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: false,
        query: params.q,
        results: [],
        count: 0,
        cached: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  private async callSearxNG(params: SearchParams) {
    const searchParams = new URLSearchParams({
      q: params.q,
      categories: params.categories || 'general',
      language: params.language || 'zh-CN',
      format: 'json',
      safesearch: (params.safesearch || 0).toString()
    });

    // 如果没有指定引擎，强制使用多个引擎
    if (params.engines) {
      if (Array.isArray(params.engines)) {
        searchParams.append('engines', params.engines.join(','));
      } else {
        searchParams.append('engines', params.engines);
      }
    } else {
      // 尝试多引擎搜索，即使部分引擎失败也能获得结果
      // 优先使用Google（最可靠），其次尝试Baidu和DuckDuckGo
      searchParams.append('engines', 'google,baidu,duckduckgo');
    }

    if (params.time_range) {
      searchParams.append('time_range', params.time_range);
    }

    const response = await axios.post(
      `${this.searxngUrl}/search`,
      searchParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: this.timeout
      }
    );

    return response;
  }

  private formatResults(results: any[], limit: number): SearchResult[] {
    if (!results || !Array.isArray(results)) {
      return [];
    }

    return results.slice(0, limit).map(result => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
      engine: result.engine || 'unknown',
      score: result.score || 0,
      publishedDate: result.publishedDate || null,
      thumbnail: result.img_src || null,
      metadata: {
        category: result.category || 'general',
        template: result.template || 'default'
      }
    }));
  }

  private generateCacheKey(params: SearchParams): string {
    const keyData = {
      q: params.q,
      categories: params.categories,
      engines: params.engines,
      language: params.language,
      time_range: params.time_range,
      safesearch: params.safesearch,
      limit: params.limit
    };
    
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');
    
    return `search:${hash}`;
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; searxng: boolean; cache: boolean }> {
    const status = {
      status: 'healthy',
      searxng: false,
      cache: false
    };

    // 检查 SearxNG
    try {
      await axios.get(`${this.searxngUrl}/`, { timeout: 5000 });
      status.searxng = true;
    } catch (error) {
      console.error('SearxNG health check failed:', error);
    }

    // 检查缓存
    try {
      await cacheService.set('health_check', 'ok', 10);
      const result = await cacheService.get('health_check');
      status.cache = result === 'ok';
      await cacheService.delete('health_check');
    } catch (error) {
      console.error('Cache health check failed:', error);
    }

    if (!status.searxng || !status.cache) {
      status.status = 'degraded';
    }

    return status;
  }
}

// 单例实例
export const searchService = new SearchService();