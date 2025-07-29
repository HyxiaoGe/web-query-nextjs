/**
 * 监控指标收集模块
 * 统计搜索性能、错误率、系统资源等指标
 * 支持持久化存储到文件系统
 */

import fs from 'fs';
import path from 'path';

interface MetricsData {
  // 性能指标
  totalSearches: number;
  totalResponseTime: number;
  avgResponseTime: number;
  
  // 缓存指标
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  
  // 错误指标
  totalErrors: number;
  errorRate: number;
  errorTypes: Record<string, number>;
  
  // 系统指标
  startTime: number;
  lastResetTime: number;
}

class MetricsCollector {
  private metrics: MetricsData;
  private dataFile: string;
  
  constructor() {
    // 指标数据文件路径
    this.dataFile = path.join(process.cwd(), '.metrics.json');
    
    // 加载已保存的指标数据
    this.metrics = this.loadMetrics();
  }

  /**
   * 从文件加载指标数据
   */
  private loadMetrics(): MetricsData {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        const savedMetrics = JSON.parse(data);
        
        // 验证数据结构
        if (this.isValidMetricsData(savedMetrics)) {
          return savedMetrics;
        }
      }
    } catch (error) {
      console.warn('Failed to load metrics data, starting fresh:', error);
    }
    
    // 返回默认值
    return {
      totalSearches: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalErrors: 0,
      errorRate: 0,
      errorTypes: {},
      startTime: Date.now(),
      lastResetTime: Date.now()
    };
  }

  /**
   * 保存指标数据到文件
   */
  private saveMetrics() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metrics data:', error);
    }
  }

  /**
   * 验证指标数据结构
   */
  private isValidMetricsData(data: any): data is MetricsData {
    return data && 
           typeof data.totalSearches === 'number' &&
           typeof data.totalResponseTime === 'number' &&
           typeof data.cacheHits === 'number' &&
           typeof data.cacheMisses === 'number' &&
           typeof data.totalErrors === 'number' &&
           typeof data.startTime === 'number' &&
           typeof data.lastResetTime === 'number' &&
           typeof data.errorTypes === 'object';
  }

  /**
   * 记录搜索请求
   */
  recordSearch(responseTime: number, cached: boolean = false) {
    this.metrics.totalSearches++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.avgResponseTime = this.metrics.totalResponseTime / this.metrics.totalSearches;
    
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate = totalCacheRequests > 0 
      ? (this.metrics.cacheHits / totalCacheRequests) * 100 
      : 0;
    
    // 保存数据到文件
    this.saveMetrics();
  }

  /**
   * 记录搜索错误
   */
  recordError(errorType: string) {
    this.metrics.totalErrors++;
    this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
    
    if (this.metrics.totalSearches > 0) {
      this.metrics.errorRate = (this.metrics.totalErrors / this.metrics.totalSearches) * 100;
    }
    
    // 保存数据到文件
    this.saveMetrics();
  }

  /**
   * 获取当前指标
   */
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;
    
    return {
      ...this.metrics,
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      avgResponseTimeFormatted: `${Math.round(this.metrics.avgResponseTime)}ms`,
      cacheHitRateFormatted: `${this.metrics.cacheHitRate.toFixed(1)}%`,
      errorRateFormatted: `${this.metrics.errorRate.toFixed(2)}%`,
      systemInfo: this.getSystemInfo()
    };
  }

  /**
   * 重置指标
   */
  resetMetrics() {
    const startTime = this.metrics.startTime;
    this.metrics = {
      totalSearches: 0,
      totalResponseTime: 0,
      avgResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalErrors: 0,
      errorRate: 0,
      errorTypes: {},
      startTime,
      lastResetTime: Date.now()
    };
    
    // 保存重置后的数据
    this.saveMetrics();
  }

  /**
   * 获取系统信息
   */
  private getSystemInfo() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // 微秒转毫秒
        system: Math.round(cpuUsage.system / 1000)
      },
      uptime: {
        seconds: Math.round(uptime),
        formatted: this.formatUptime(uptime * 1000)
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
}

// 创建全局单例实例
const metricsCollector = new MetricsCollector();

export default metricsCollector;
export type { MetricsData };