'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  initialQuery?: string;
}

interface SearchSuggestion {
  query: string;
  count: number;
  lastSearched: number;
}

export function SearchBox({ 
  onSearch, 
  loading = false, 
  placeholder = "搜索任何内容...",
  initialQuery = ""
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 获取搜索建议
  const fetchSuggestions = async (random = false) => {
    try {
      if (random) {
        setRefreshing(true);
      }
      
      const url = random 
        ? '/api/search-suggestions?random=true&limit=5'
        : '/api/search-suggestions?limit=5';
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
    } finally {
      if (random) {
        setRefreshing(false);
      }
    }
  };

  // 换一批建议
  const refreshSuggestions = () => {
    fetchSuggestions(true);
  };

  // 组件加载时获取建议
  useEffect(() => {
    fetchSuggestions();
    // 每30秒更新一次建议
    const interval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
      setShowSuggestions(false); // 搜索后隐藏建议
    }
  };

  const handleSuggestionClick = (suggestionQuery: string) => {
    setQuery(suggestionQuery);
    onSearch(suggestionQuery);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // 当用户清空输入时重新显示建议
              if (e.target.value === '') {
                setShowSuggestions(true);
              }
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              // 聚焦时如果输入框为空则显示建议
              if (!query) {
                setShowSuggestions(true);
              }
            }}
            placeholder={placeholder}
            className="pr-12 h-12 text-lg"
            disabled={loading}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 h-10 w-10"
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
      
      {/* 搜索建议 */}
      {showSuggestions && suggestions.length > 0 && !query && (
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
            <span>他们都在搜：</span>
            <button
              onClick={refreshSuggestions}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 rounded transition-colors duration-200 hover:bg-gray-50"
              title="换一批"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>换一批</span>
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.query}-${index}`}
                onClick={() => handleSuggestionClick(suggestion.query)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200 cursor-pointer border border-transparent hover:border-gray-300"
                disabled={loading || refreshing}
              >
                {suggestion.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}