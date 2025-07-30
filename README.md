# Web Query - 智能聚合搜索服务

基于 Next.js 和 SearxNG 的隐私友好搜索引擎，聚合多个搜索源并提供现代化的搜索体验。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHyxiaoGe%2Fweb-query-nextjs&env=SEARXNG_URL,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN&envDescription=Configure%20your%20search%20service&envLink=https%3A%2F%2Fgithub.com%2FHyxiaoGe%2Fweb-query-nextjs%2Fblob%2Fmain%2Fdocs%2FDEPLOYMENT.md&project-name=web-query&repository-name=web-query)

## ✨ 核心功能

### 🔍 智能搜索
- **多引擎聚合**：同时搜索 Google、百度、DuckDuckGo
- **结果去重**：智能去除重复结果
- **相关性评分**：基于多维度的结果排序
- **搜索建议**：显示热门搜索词，支持"换一批"
- **中文优化**：针对中文搜索优化引擎权重

### ⚡ 性能与缓存
- **Redis 缓存**：使用 Upstash Redis 缓存搜索结果
- **智能缓存策略**：1小时结果缓存，30分钟搜索建议缓存
- **多层限流**：全局、IP、查询三层限流保护
- **响应时间优化**：平均响应时间 < 1.5s

### 🛡️ 隐私与安全
- **无用户追踪**：不记录用户个人信息
- **隐私搜索**：通过 SearxNG 代理搜索请求
- **安全限流**：防止恶意请求和爬虫
- **数据脱敏**：不暴露内部限流信息

### 📊 监控与反馈
- **实时监控**：搜索统计、性能指标、系统健康状况
- **用户反馈系统**：有用/无关/不准确反馈机制
- **健康检查**：API 健康状态监控
- **Prometheus 指标**：支持 Prometheus 格式监控数据

## 🏗️ 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│   API Routes    │───▶│  Railway        │
│  (用户界面)      │    │  (搜索/监控)     │    │  SearxNG        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────▶│ Upstash Redis  │◀─────────────┘
                        │ (缓存/限流/监控) │
                        └─────────────────┘
```

**技术栈：**
- **前端**：Next.js 14 + TypeScript + Tailwind CSS
- **后端**：Next.js API Routes + SearxNG
- **缓存**：Upstash Redis (Vercel 优化)
- **部署**：Vercel (前端) + Railway (SearxNG)

## 🚀 快速部署

### 一键部署到 Vercel

1. **部署 SearxNG**
   ```bash
   # 在 Railway 部署自定义 SearxNG
   docker pull hyxiaoge/searxng-webquery:latest
   ```

2. **创建 Upstash Redis**
   - 访问 [Upstash Console](https://console.upstash.com/)
   - 创建数据库，选择合适的区域
   - 获取 REST URL 和 Token

3. **部署到 Vercel**
   - 点击上方 "Deploy with Vercel" 按钮
   - 配置环境变量：
     - `SEARXNG_URL`: Railway SearxNG 地址
     - `UPSTASH_REDIS_REST_URL`: Upstash REST URL
     - `UPSTASH_REDIS_REST_TOKEN`: Upstash Token

详细部署指南见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📡 API 接口

### 搜索 API
```http
POST /api/search
Content-Type: application/json

{
  "q": "搜索关键词",
  "limit": 20,
  "language": "zh-CN",
  "categories": "general",
  "engines": ["google", "baidu", "duckduckgo"]
}
```

**响应：**
```json
{
  "success": true,
  "query": "搜索关键词",
  "results": [
    {
      "title": "结果标题",
      "url": "https://example.com",
      "content": "结果摘要",
      "engine": "google",
      "score": 1.0,
      "publishedDate": "2024-01-01"
    }
  ],
  "count": 15,
  "cached": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 搜索建议 API
```http
GET /api/search-suggestions?random=true&limit=5
```

### 监控 API
```http
GET /api/metrics
```
返回性能指标、缓存统计、错误率等监控数据。

### 反馈 API
```http
POST /api/feedback
Content-Type: application/json

{
  "query": "搜索词",
  "feedbackType": "helpful|inaccurate|irrelevant",
  "resultUrl": "https://example.com",
  "comment": "用户评论"
}
```

### 健康检查
```http
GET /api/health
```

## 📊 功能特性详解

### 搜索结果优化
- **多样性优化**：确保结果来源多样化
- **相关性评分**：基于标题、内容、域名权重计算
- **垃圾过滤**：过滤低质量和重复内容
- **智能补齐**：当结果不足时智能补充

### 缓存策略
- **搜索结果**：1小时缓存，提升重复查询速度
- **搜索统计**：30天数据保留，用于生成搜索建议
- **监控数据**：实时更新，30天历史保留

### 限流保护
- **全局限流**：100次/分钟，10个并发
- **IP限流**：20次/分钟，200次/小时
- **查询限流**：相同搜索词5次/分钟
- **优雅降级**：超限时返回429状态码

### 监控指标
- **性能指标**：平均响应时间、搜索量、成功率
- **缓存指标**：命中率、命中量、总请求数
- **系统指标**：内存使用、CPU占用、运行时间
- **用户反馈**：反馈数量、类型分布、满意度

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SEARXNG_URL` | SearxNG 服务地址 | `https://your-app.railway.app` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | `AXxxxxxxxxxxxx` |
| `REQUEST_TIMEOUT` | 搜索超时时间(毫秒) | `30000` |
| `MAX_RESULTS` | 最大搜索结果数 | `20` |
| `CACHE_TTL` | 缓存时间(秒) | `3600` |

### 限流配置（可选）
```env
GLOBAL_RATE_LIMIT_PER_MINUTE=100
MAX_CONCURRENT_REQUESTS=10
IP_RATE_LIMIT_PER_MINUTE=20
IP_RATE_LIMIT_PER_HOUR=200
QUERY_RATE_LIMIT_PER_MINUTE=5
```

## 📁 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── search/              # 搜索 API
│   │   ├── search-suggestions/  # 搜索建议 API
│   │   ├── feedback/           # 用户反馈 API
│   │   ├── metrics/            # 监控指标 API
│   │   └── health/             # 健康检查 API
│   ├── metrics/                # 监控页面
│   ├── feedback/               # 反馈页面
│   └── page.tsx                # 搜索首页
├── components/
│   └── search/
│       ├── SearchBox.tsx       # 搜索框 + 建议
│       ├── SearchResults.tsx   # 搜索结果
│       └── FeedbackButton.tsx  # 反馈按钮
├── lib/
│   ├── search.ts              # 搜索服务
│   ├── cache.ts               # 缓存服务
│   ├── upstash-cache.ts       # Upstash 适配器
│   ├── metrics.ts             # 监控收集器
│   ├── rate-limiter.ts        # 限流器
│   ├── search-stats.ts        # 搜索统计
│   ├── feedback.ts            # 反馈系统
│   ├── relevance.ts           # 相关性评分
│   └── diversity.ts           # 多样性优化
└── searxng-docker/            # SearxNG Docker 镜像
```

## 📈 性能数据

- **平均响应时间**：< 1.5s
- **缓存命中率**：> 60%
- **搜索成功率**：> 95%
- **系统可用性**：> 99.5%

## 🔗 相关资源

- [部署指南](docs/DEPLOYMENT.md)
- [SearxNG 官方文档](https://docs.searxng.org/)
- [Upstash Redis](https://upstash.com/)
- [Vercel 部署](https://vercel.com/docs)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件