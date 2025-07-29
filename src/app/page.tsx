'use client';

import { useState } from 'react';
import { SearchBox } from '@/components/search/SearchBox';
import { SearchResults } from '@/components/search/SearchResults';
import type { SearchResponse } from '@/types/search';

export default function HomePage() {
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const handleSearch = async (query: string) => {
    setLoading(true);
    setCurrentQuery(query);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          limit: 10,
          language: 'zh-CN'
        }),
      });

      const data: SearchResponse = await response.json();
      
      // 从响应头中提取响应时间
      const responseTime = response.headers.get('X-Response-Time');
      if (responseTime) {
        data.responseTime = responseTime;
      }
      
      setSearchResponse(data);
      
      if (!data.success) {
        console.error('Search failed:', data.error);
      }
      
    } catch (error) {
      console.error('Search request failed:', error);
      setSearchResponse({
        success: false,
        query,
        results: [],
        count: 0,
        cached: false,
        timestamp: new Date().toISOString(),
        error: '搜索请求失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 搜索头部区域 */}
      <div className={`transition-all duration-300 ${searchResponse ? 'mb-8' : 'mb-16 mt-16'}`}>
        <div className="text-center mb-8">
          <h1 className={`font-bold text-primary transition-all duration-300 ${
            searchResponse ? 'text-2xl' : 'text-4xl mb-4'
          }`}>
            Web Query
          </h1>
          {!searchResponse && (
            <p className="text-lg text-muted-foreground mb-8">
              聚合多个搜索引擎，发现更多可能
            </p>
          )}
        </div>
        
        <SearchBox 
          onSearch={handleSearch}
          loading={loading}
          initialQuery={currentQuery}
          placeholder="搜索任何内容..."
        />
      </div>

      {/* 搜索结果区域 */}
      {(searchResponse || loading) && (
        <div className="mt-8">
          {searchResponse && !searchResponse.success && (
            <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-destructive mb-2">搜索出错了</h3>
              <p className="text-destructive/80">{searchResponse.error}</p>
            </div>
          )}
          
          <SearchResults
            results={searchResponse?.results || []}
            query={currentQuery}
            loading={loading}
            cached={searchResponse?.cached}
            timestamp={searchResponse?.timestamp}
            responseTime={searchResponse?.responseTime}
          />
        </div>
      )}

      {/* 首页功能介绍（仅在无搜索结果时显示） */}
      {!searchResponse && !loading && (
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">智能聚合</h3>
            <p className="text-sm text-muted-foreground">
              聚合多引擎，结果更全面
            </p>
          </div>
          
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">高速缓存</h3>
            <p className="text-sm text-muted-foreground">
              智能缓存常用搜索，提升访问速度
            </p>
          </div>
          
          <div className="text-center p-6 bg-card rounded-lg border">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-semibold mb-2">隐私保护</h3>
            <p className="text-sm text-muted-foreground">
              不追踪用户行为，保护搜索隐私
            </p>
          </div>
        </div>
      )}
    </div>
  );
}