'use client';

import { ExternalLink, Clock, Zap } from 'lucide-react';
import type { SearchResult } from '@/types/search';
import { extractDomain, formatTime, truncateText, highlightText } from '@/lib/utils';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  loading?: boolean;
  cached?: boolean;
  timestamp?: string;
}

export function SearchResults({ 
  results, 
  query, 
  loading = false, 
  cached = false,
  timestamp 
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-muted rounded mb-2"></div>
            <div className="h-3 w-full bg-muted rounded mb-1"></div>
            <div className="h-3 w-5/6 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold mb-2">没有找到相关结果</h3>
        <p className="text-muted-foreground mb-4">
          尝试使用不同的关键词或检查拼写
        </p>
        <div className="text-sm text-muted-foreground">
          <p>搜索建议：</p>
          <ul className="mt-2 space-y-1">
            <li>• 使用更通用的关键词</li>
            <li>• 检查关键词拼写</li>
            <li>• 尝试使用同义词</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索信息栏 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
        <div className="flex items-center gap-4">
          <span>找到 {results.length} 个结果</span>
          {cached && (
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>缓存结果</span>
            </div>
          )}
        </div>
        {timestamp && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTime(timestamp)}</span>
          </div>
        )}
      </div>

      {/* 搜索结果列表 */}
      <div className="space-y-6">
        {results.map((result, index) => (
          <SearchResultItem 
            key={`${result.url}-${index}`} 
            result={result} 
            query={query}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  query: string;
  index: number;
}

function SearchResultItem({ result, query, index }: SearchResultItemProps) {
  const domain = extractDomain(result.url);
  const truncatedContent = truncateText(result.content);

  return (
    <article className="group">
      <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
          {result.engine}
        </span>
        <span>{domain}</span>
      </div>
      
      <h3 className="mb-2">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-primary hover:underline group-hover:underline flex items-center gap-2"
        >
          <span 
            dangerouslySetInnerHTML={{ 
              __html: highlightText(result.title, query) 
            }} 
          />
          <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </h3>
      
      <p className="text-muted-foreground text-sm mb-2 font-mono">
        {result.url}
      </p>
      
      {truncatedContent && (
        <p 
          className="text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: highlightText(truncatedContent, query) 
          }} 
        />
      )}
      
      {result.publishedDate && (
        <div className="mt-2 text-xs text-muted-foreground">
          发布时间: {formatTime(result.publishedDate)}
        </div>
      )}
    </article>
  );
}