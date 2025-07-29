// 搜索建议 API 接口
import { NextRequest, NextResponse } from 'next/server';
import { getPopularSearchQueries } from '@/lib/search-stats';
import type { SearchSuggestion } from '@/lib/search-stats';

// 强制动态路由，因为需要处理查询参数
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // 获取热门搜索词
    const allSuggestions = await getPopularSearchQueries();
    
    // 分页或随机选择
    let suggestions: SearchSuggestion[];
    if (searchParams.get('random') === 'true') {
      // 随机选择（用于"换一批"功能）
      suggestions = getRandomSuggestions(allSuggestions, limit);
    } else {
      // 分页选择
      suggestions = allSuggestions.slice(offset, offset + limit);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      suggestions,
      total: allSuggestions.length,
      hasMore: offset + limit < allSuggestions.length
    });

  } catch (error) {
    console.error('Search suggestions API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        suggestions: [],
        total: 0,
        hasMore: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * 从建议列表中随机选择指定数量的建议
 */
function getRandomSuggestions(suggestions: SearchSuggestion[], count: number): SearchSuggestion[] {
  if (suggestions.length <= count) {
    return suggestions;
  }
  
  const shuffled = [...suggestions];
  
  // Fisher-Yates 洗牌算法
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}