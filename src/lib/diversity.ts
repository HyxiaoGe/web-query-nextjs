/**
 * 搜索结果多样性优化模块
 * 确保搜索结果来自多个搜索引擎
 */

import type { SearchResult } from '@/types/search';

export class DiversityOptimizer {
  /**
   * 优化搜索结果的多样性
   * 确保结果包含来自不同搜索引擎的内容
   */
  static optimizeDiversity(results: SearchResult[], targetCount: number = 10): SearchResult[] {
    if (results.length === 0) return [];

    // 按搜索引擎分组
    const resultsByEngine = this.groupByEngine(results);
    
    // 如果只有一个引擎，直接返回前N个结果
    if (resultsByEngine.size === 1) {
      const singleEngineResults = Array.from(resultsByEngine.values())[0];
      return singleEngineResults.slice(0, targetCount);
    }
    
    // 计算每个引擎应该贡献的结果数
    const engineQuotas = this.calculateQuotas(resultsByEngine, targetCount);
    
    // 使用轮询方式选择结果，确保多样性
    let diversifiedResults = this.selectDiverseResults(resultsByEngine, engineQuotas, targetCount);
    
    // 如果结果数量不足，从可用引擎中补齐
    if (diversifiedResults.length < targetCount) {
      diversifiedResults = this.fillRemainingSlots(diversifiedResults, resultsByEngine, targetCount);
    }
    
    return diversifiedResults;
  }

  /**
   * 按搜索引擎分组
   */
  private static groupByEngine(results: SearchResult[]): Map<string, SearchResult[]> {
    const groups = new Map<string, SearchResult[]>();
    
    for (const result of results) {
      const engine = result.engine.toLowerCase();
      if (!groups.has(engine)) {
        groups.set(engine, []);
      }
      groups.get(engine)!.push(result);
    }
    
    // 对每个引擎的结果按分数排序
    groups.forEach((engineResults, engine) => {
      engineResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    });
    
    return groups;
  }

  /**
   * 计算每个引擎的配额
   */
  private static calculateQuotas(
    resultsByEngine: Map<string, SearchResult[]>, 
    targetCount: number
  ): Map<string, number> {
    const quotas = new Map<string, number>();
    const engines = Array.from(resultsByEngine.keys());
    
    // 定义引擎优先级和最小配额 - 确保多样性
    const enginePriorities: { [key: string]: { priority: number; minQuota: number; maxQuota: number } } = {
      'google': { priority: 1, minQuota: 3, maxQuota: 5 },
      'baidu': { priority: 1, minQuota: 3, maxQuota: 4 },      // 提高百度优先级
      'duckduckgo': { priority: 2, minQuota: 2, maxQuota: 3 }, // 提高DuckDuckGo优先级
      'wikipedia': { priority: 4, minQuota: 0, maxQuota: 1 },
      'github': { priority: 5, minQuota: 0, maxQuota: 1 },
      'stackoverflow': { priority: 5, minQuota: 0, maxQuota: 1 }
    };
    
    // 首先分配最小配额
    let remainingSlots = targetCount;
    for (const engine of engines) {
      const config = enginePriorities[engine] || { minQuota: 1, maxQuota: 2 };
      const availableResults = resultsByEngine.get(engine)!.length;
      const minQuota = Math.min(config.minQuota, availableResults, remainingSlots);
      
      quotas.set(engine, minQuota);
      remainingSlots -= minQuota;
    }
    
    // 分配剩余配额，优先给高优先级引擎
    const sortedEngines = engines.sort((a, b) => {
      const priorityA = enginePriorities[a]?.priority || 99;
      const priorityB = enginePriorities[b]?.priority || 99;
      return priorityA - priorityB;
    });
    
    while (remainingSlots > 0) {
      let allocated = false;
      
      for (const engine of sortedEngines) {
        const currentQuota = quotas.get(engine) || 0;
        const config = enginePriorities[engine] || { maxQuota: 2 };
        const availableResults = resultsByEngine.get(engine)!.length;
        
        if (currentQuota < config.maxQuota && currentQuota < availableResults) {
          quotas.set(engine, currentQuota + 1);
          remainingSlots--;
          allocated = true;
          
          if (remainingSlots === 0) break;
        }
      }
      
      // 如果无法再分配，退出循环
      if (!allocated) break;
    }
    
    return quotas;
  }

  /**
   * 选择多样化的结果
   */
  private static selectDiverseResults(
    resultsByEngine: Map<string, SearchResult[]>,
    engineQuotas: Map<string, number>,
    targetCount: number
  ): SearchResult[] {
    const selected: SearchResult[] = [];
    const engineIndexes = new Map<string, number>();
    
    // 初始化每个引擎的索引
    const engines = Array.from(resultsByEngine.keys());
    engines.forEach(engine => {
      engineIndexes.set(engine, 0);
    });
    
    // 轮询选择，确保结果交替来自不同引擎
    let engineIndex = 0;
    
    while (selected.length < targetCount) {
      let foundResult = false;
      let attempts = 0;
      
      // 尝试从每个引擎轮流选择
      while (attempts < engines.length && !foundResult) {
        const engine = engines[engineIndex % engines.length];
        const quota = engineQuotas.get(engine) || 0;
        const currentIndex = engineIndexes.get(engine) || 0;
        const engineResults = resultsByEngine.get(engine) || [];
        
        if (currentIndex < quota && currentIndex < engineResults.length) {
          selected.push(engineResults[currentIndex]);
          engineIndexes.set(engine, currentIndex + 1);
          foundResult = true;
        }
        
        engineIndex++;
        attempts++;
      }
      
      // 如果无法找到更多结果，退出
      if (!foundResult) break;
    }
    
    return selected;
  }

  /**
   * 补齐剩余位置 - 当某些引擎失效时，用其他引擎的结果填充
   */
  private static fillRemainingSlots(
    currentResults: SearchResult[],
    resultsByEngine: Map<string, SearchResult[]>,
    targetCount: number
  ): SearchResult[] {
    const remainingSlots = targetCount - currentResults.length;
    if (remainingSlots <= 0) return currentResults;

    // 获取已使用的结果URL，避免重复
    const usedUrls = new Set(currentResults.map(result => result.url));
    
    // 收集所有未使用的结果，按引擎优先级排序
    const availableResults: SearchResult[] = [];
    
    // 引擎优先级（与calculateQuotas中的一致）
    const enginePriorities: { [key: string]: number } = {
      'google': 1,
      'baidu': 1,
      'duckduckgo': 2,
      'wikipedia': 4,
      'github': 5,
      'stackoverflow': 5
    };
    
    // 按引擎优先级收集未使用的结果
    const sortedEngines = Array.from(resultsByEngine.keys()).sort((a, b) => {
      const priorityA = enginePriorities[a] || 99;
      const priorityB = enginePriorities[b] || 99;
      return priorityA - priorityB;
    });
    
    for (const engine of sortedEngines) {
      const engineResults = resultsByEngine.get(engine) || [];
      for (const result of engineResults) {
        if (!usedUrls.has(result.url)) {
          availableResults.push(result);
        }
      }
    }
    
    // 取前N个未使用的结果来填充
    const additionalResults = availableResults.slice(0, remainingSlots);
    
    return [...currentResults, ...additionalResults];
  }

}