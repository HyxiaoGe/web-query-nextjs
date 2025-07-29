// 搜索相关类型定义

export interface SearchParams {
  q: string;
  categories?: string;
  engines?: string | string[];
  language?: string;
  time_range?: 'day' | 'week' | 'month' | 'year' | null;
  safesearch?: 0 | 1 | 2;
  limit?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  score?: number;
  publishedDate?: string | null;
  thumbnail?: string | null;
  metadata?: {
    category?: string;
    template?: string;
  };
}

export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  count: number;
  cached: boolean;
  timestamp: string;
  error?: string;
}

export interface CacheService {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 扩展接口预留
export interface ApiKeyInfo {
  keyType: string;
  permissions: string[];
  limits: {
    daily: number;
    hourly: number;
    maxResults: number;
  };
}

export interface AuthContext {
  authenticated: boolean;
  apiKey?: string;
  keyInfo?: ApiKeyInfo;
}