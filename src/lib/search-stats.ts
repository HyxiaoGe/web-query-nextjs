/**
 * 搜索统计工具函数
 * 用于记录和分析用户搜索行为
 */

import { cacheService } from './cache';

export interface SearchSuggestion {
  query: string;
  count: number;
  lastSearched: number;
}

/**
 * 记录搜索统计（在搜索API中调用）
 */
export async function recordSearchQuery(query: string): Promise<void> {
  try {
    // 清理和标准化查询词
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || cleanQuery.length < 2 || cleanQuery.length > 20) {
      return;
    }
    
    // 过滤敏感内容
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s\-_.]+$/.test(cleanQuery)) {
      return;
    }

    const statsKey = 'search_stats';
    const currentStats = await cacheService.get(statsKey);
    
    let searchStats: Record<string, { count: number; lastSearched: number }> = {};
    
    if (currentStats) {
      try {
        searchStats = typeof currentStats === 'string' ? JSON.parse(currentStats) : currentStats;
      } catch (parseError) {
        console.warn('Failed to parse existing search stats');
      }
    }

    // 更新统计
    if (searchStats[cleanQuery]) {
      searchStats[cleanQuery].count++;
      searchStats[cleanQuery].lastSearched = Date.now();
    } else {
      searchStats[cleanQuery] = {
        count: 1,
        lastSearched: Date.now()
      };
    }

    // 清理老旧数据（保留最近30天内的数据）
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    Object.keys(searchStats).forEach(key => {
      if (searchStats[key].lastSearched < thirtyDaysAgo) {
        delete searchStats[key];
      }
    });

    // 限制存储的查询词数量（最多保留100个）
    const sortedEntries = Object.entries(searchStats)
      .sort(([,a], [,b]) => (b.count + b.lastSearched/1000000) - (a.count + a.lastSearched/1000000))
      .slice(0, 100);
    
    const limitedStats = Object.fromEntries(sortedEntries);

    // 保存到缓存，设置30天过期
    await cacheService.set(statsKey, JSON.stringify(limitedStats), 30 * 24 * 60 * 60);
    
  } catch (error) {
    console.error('Failed to record search query:', error);
  }
}

/**
 * 从缓存中获取热门搜索词
 */
export async function getPopularSearchQueries(): Promise<SearchSuggestion[]> {
  try {
    // 获取搜索统计数据
    const statsKey = 'search_stats';
    const statsData = await cacheService.get(statsKey);
    
    if (!statsData) {
      return getDefaultSuggestions();
    }

    let searchStats: Record<string, { count: number; lastSearched: number }>;
    
    try {
      searchStats = typeof statsData === 'string' ? JSON.parse(statsData) : statsData;
    } catch (parseError) {
      console.warn('Failed to parse search stats, using defaults');
      return getDefaultSuggestions();
    }

    // 转换为数组并按热度排序
    const suggestions: SearchSuggestion[] = Object.entries(searchStats)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        lastSearched: stats.lastSearched
      }))
      .filter(suggestion => {
        // 过滤条件：
        // 1. 查询词长度合理（2-20个字符）
        // 2. 不包含特殊字符或敏感内容
        // 3. 最近7天内有搜索记录
        const isValidLength = suggestion.query.length >= 2 && suggestion.query.length <= 20;
        const isClean = /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_.]+$/.test(suggestion.query);
        const isRecent = Date.now() - suggestion.lastSearched < 7 * 24 * 60 * 60 * 1000; // 7天
        
        return isValidLength && isClean && isRecent && suggestion.count >= 2;
      })
      .sort((a, b) => {
        // 综合排序：热度 + 时间新鲜度
        const hotScore = b.count - a.count;
        const timeScore = (b.lastSearched - a.lastSearched) / (24 * 60 * 60 * 1000); // 天数差异
        return hotScore + timeScore * 0.1;
      });

    return suggestions.length > 0 ? suggestions : getDefaultSuggestions();
    
  } catch (error) {
    console.error('Failed to get popular search queries:', error);
    return getDefaultSuggestions();
  }
}

/**
 * 获取默认搜索建议（当没有缓存数据时）
 */
function getDefaultSuggestions(): SearchSuggestion[] {
  const defaultQueries = [
    'AI技术发展',
    '春节放假安排', 
    '天气预报',
    '编程教程',
    '旅游攻略',
    '健康养生',
    '美食推荐',
    '电影推荐',
    '学习方法',
    '投资理财',
    '数码产品',
    '运动健身',
    '读书笔记',
    '职场技能',
    '生活小贴士'
  ];
  
  return defaultQueries.map((query, index) => ({
    query,
    count: Math.max(15 - index, 2), // 模拟热度，确保都满足最低阈值
    lastSearched: Date.now() - index * 60 * 60 * 1000 // 模拟搜索时间
  }));
}