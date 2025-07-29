/**
 * 搜索结果相关性评分模块
 * 用于改善搜索结果的排序和质量
 */

import type { SearchResult } from '@/types/search';

interface RelevanceScore {
  titleScore: number;
  contentScore: number;
  urlScore: number;
  engineScore: number;
  totalScore: number;
}

export class RelevanceScorer {
  /**
   * 计算搜索结果的相关性得分
   */
  static scoreResults(results: SearchResult[], query: string): SearchResult[] {
    const normalizedQuery = this.normalizeText(query);
    const queryTokens = this.tokenize(normalizedQuery);
    
    // 计算每个结果的得分
    const scoredResults = results.map(result => {
      const score = this.calculateRelevanceScore(result, normalizedQuery, queryTokens);
      return {
        ...result,
        score: score.totalScore
      };
    });
    
    // 过滤掉相关性太低的结果
    const filtered = scoredResults.filter(result => result.score > 0.1);
    
    // 按得分降序排序
    return filtered.sort((a, b) => b.score - a.score);
  }

  /**
   * 计算单个结果的相关性得分
   */
  private static calculateRelevanceScore(
    result: SearchResult, 
    normalizedQuery: string,
    queryTokens: string[]
  ): RelevanceScore {
    const titleScore = this.calculateTextScore(result.title, normalizedQuery, queryTokens, 3.0);
    const contentScore = this.calculateTextScore(result.content, normalizedQuery, queryTokens, 1.0);
    const urlScore = this.calculateUrlScore(result.url, queryTokens);
    const engineScore = this.getEngineScore(result.engine);
    
    // 加权总分
    const totalScore = (
      titleScore * 0.4 +      // 标题权重40%
      contentScore * 0.3 +    // 内容权重30%
      urlScore * 0.1 +        // URL权重10%
      engineScore * 0.2       // 搜索引擎权重20%
    );
    
    return {
      titleScore,
      contentScore,
      urlScore,
      engineScore,
      totalScore
    };
  }

  /**
   * 计算文本相关性得分
   */
  private static calculateTextScore(
    text: string, 
    normalizedQuery: string,
    queryTokens: string[],
    multiplier: number = 1.0
  ): number {
    if (!text) return 0;
    
    const normalizedText = this.normalizeText(text);
    let score = 0;
    
    // 1. 完全匹配奖励
    if (normalizedText.includes(normalizedQuery)) {
      score += 1.0 * multiplier;
    }
    
    // 2. 词组匹配
    const textTokens = this.tokenize(normalizedText);
    const matchedTokens = queryTokens.filter(token => 
      textTokens.some(textToken => textToken.includes(token) || token.includes(textToken))
    );
    score += (matchedTokens.length / queryTokens.length) * 0.8 * multiplier;
    
    // 3. 位置权重（查询词出现在前面得分更高）
    const position = normalizedText.indexOf(normalizedQuery);
    if (position >= 0) {
      score += (1 - position / normalizedText.length) * 0.3 * multiplier;
    }
    
    // 4. 词频权重
    const frequency = this.countOccurrences(normalizedText, queryTokens);
    score += Math.min(frequency * 0.1, 0.5) * multiplier;
    
    return Math.min(score, 3.0); // 限制最高分
  }

  /**
   * 计算URL相关性得分
   */
  private static calculateUrlScore(url: string, queryTokens: string[]): number {
    if (!url) return 0;
    
    const normalizedUrl = this.normalizeText(url.toLowerCase());
    let score = 0;
    
    // 检查域名和路径中是否包含查询词
    const matchedTokens = queryTokens.filter(token => normalizedUrl.includes(token));
    score += (matchedTokens.length / queryTokens.length) * 0.5;
    
    // 权威域名加分
    const authorityDomains = [
      'wikipedia.org', 'zhihu.com', 'baidu.com', 'gov.cn',
      'edu.cn', 'stackoverflow.com', 'github.com'
    ];
    
    if (authorityDomains.some(domain => url.includes(domain))) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 获取搜索引擎权重得分
   */
  private static getEngineScore(engine: string): number {
    const engineScores: Record<string, number> = {
      'google': 1.0,      // Google通常相关性最好
      'baidu': 0.9,       // 百度对中文搜索很好，提升权重
      'duckduckgo': 0.8,  // DuckDuckGo
      'wikipedia': 0.7,   // Wikipedia（专门内容）
      'github': 0.6,      // GitHub（技术内容）
      'stackoverflow': 0.6, // StackOverflow（技术问答）
      'startpage': 0.5,   // Startpage相关性一般
      'unknown': 0.3      // 未知引擎
    };
    
    return engineScores[engine.toLowerCase()] || engineScores.unknown;
  }

  /**
   * 文本标准化
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ') // 保留中文、英文、数字
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 分词（简单实现）
   */
  private static tokenize(text: string): string[] {
    // 简单的中英文分词
    const tokens: string[] = [];
    
    // 英文单词
    const englishWords = text.match(/[a-z]+/g) || [];
    tokens.push(...englishWords);
    
    // 中文分词（简单的2-4字词组）
    const chineseText = text.replace(/[^\u4e00-\u9fa5]/g, '');
    for (let i = 0; i < chineseText.length; i++) {
      // 单字
      tokens.push(chineseText[i]);
      // 双字词
      if (i < chineseText.length - 1) {
        tokens.push(chineseText.substring(i, i + 2));
      }
      // 三字词
      if (i < chineseText.length - 2) {
        tokens.push(chineseText.substring(i, i + 3));
      }
    }
    
    return Array.from(new Set(tokens)); // 去重
  }

  /**
   * 计算词频
   */
  private static countOccurrences(text: string, tokens: string[]): number {
    let count = 0;
    for (const token of tokens) {
      const regex = new RegExp(token, 'gi');
      const matches = text.match(regex);
      count += matches ? matches.length : 0;
    }
    return count;
  }

  /**
   * 去除重复或高度相似的结果
   */
  static deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Map<string, SearchResult>();
    const urlSeen = new Set<string>();
    
    for (const result of results) {
      // 1. URL完全相同的去重
      const normalizedUrl = result.url.toLowerCase().replace(/\/$/, '');
      if (urlSeen.has(normalizedUrl)) {
        continue;
      }
      
      // 2. 标题高度相似的去重
      const titleKey = this.normalizeText(result.title).substring(0, 50);
      const existing = seen.get(titleKey);
      
      if (!existing || (result.score || 0) > (existing.score || 0)) {
        seen.set(titleKey, result);
        urlSeen.add(normalizedUrl);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * 过滤明显的垃圾结果
   */
  static filterSpamResults(results: SearchResult[]): SearchResult[] {
    return results.filter(result => {
      // 过滤无效结果
      if (!result.title || !result.url) return false;
      
      // 过滤标题过短
      if (result.title.length < 5) return false;
      
      // 过滤明显的垃圾域名
      const spamDomains = [
        'lipstickalley.com', // 从你的例子中看到的无关网站
        '0.0.0.2',           // 无效域名
        'localhost'          // 本地地址
      ];
      
      if (spamDomains.some(domain => result.url.includes(domain))) {
        return false;
      }
      
      // 过滤无内容的结果
      if (!result.content || result.content.length < 20) {
        return false;
      }
      
      return true;
    });
  }
}