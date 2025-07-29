# Web Query - Next.js

基于 Next.js 和 SearxNG 的通用网络搜索服务，提供简洁的搜索界面和强大的 API。

## ✨ 特性

- 🔍 **智能搜索**: 聚合多个搜索引擎结果
- ⚡ **高性能缓存**: Redis/内存缓存，提升搜索速度
- 🎨 **现代界面**: 基于 Tailwind CSS 的响应式设计
- 📱 **移动友好**: 完美支持手机和平板设备
- 🛡️ **隐私保护**: 不追踪用户，保护搜索隐私
- 🚀 **易于部署**: 支持 Vercel、Docker 等多种部署方式

## 🏗️ 架构设计

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│   API Routes    │───▶│    SearxNG      │
│  (前端界面)      │    │  (搜索API)      │    │  (搜索引擎)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────▶│     Redis       │◀─────────────┘
                        │   (缓存服务)     │
                        └─────────────────┘
```

## 🚀 快速开始

### 方式 1: 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd web-query-nextjs

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 文件

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 方式 2: Docker 开发

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

### 方式 3: Vercel 部署

1. Fork 这个项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 配置环境变量:
   - `SEARXNG_URL`: 你的 SearxNG 服务地址
   - `REDIS_URL`: Redis 连接地址（可选，会使用内存缓存）
4. 部署完成！

## 📁 项目结构

```
web-query-nextjs/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API 路由
│   │   │   ├── search/      # 搜索 API
│   │   │   ├── health/      # 健康检查
│   │   │   └── admin/       # 管理 API (预留)
│   │   ├── layout.tsx       # 全局布局
│   │   └── page.tsx         # 首页
│   ├── components/          # React 组件
│   │   ├── ui/             # 基础 UI 组件
│   │   └── search/         # 搜索相关组件
│   ├── lib/                # 工具库
│   │   ├── search.ts       # 搜索服务
│   │   ├── cache.ts        # 缓存服务
│   │   ├── auth.ts         # 认证服务 (预留)
│   │   └── utils.ts        # 工具函数
│   └── types/              # TypeScript 类型
├── searxng/                # SearxNG 配置
├── docker-compose.yml      # Docker 编排
├── vercel.json            # Vercel 配置
└── README.md              # 项目文档
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SEARXNG_URL` | SearxNG 服务地址 | `http://localhost:8888` |
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379` |
| `CACHE_TTL` | 缓存过期时间(秒) | `3600` |
| `MAX_RESULTS` | 最大搜索结果数 | `10` |
| `REQUEST_TIMEOUT` | 请求超时时间(毫秒) | `30000` |

### SearxNG 配置

编辑 `searxng/settings.yml` 可以自定义：
- 启用的搜索引擎
- 默认语言和地区
- 搜索类别
- 隐私设置

## 📡 API 接口

### 搜索接口

**POST** `/api/search`

```json
{
  "q": "搜索关键词",
  "limit": 10,
  "language": "zh-CN",
  "categories": "general"
}
```

**响应:**
```json
{
  "success": true,
  "query": "搜索关键词",
  "results": [...],
  "count": 10,
  "cached": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 健康检查

**GET** `/api/health`

返回服务状态和各组件健康状况。

## 🎨 界面特色

- **简洁设计**: 类似 Google 的简洁搜索界面
- **响应式**: 自适应桌面、平板、手机
- **深色模式**: 支持系统深色模式切换
- **加载动画**: 优雅的搜索加载体验
- **结果高亮**: 搜索关键词高亮显示

## 🔮 扩展功能 (预留接口)

当前是 MVP 版本，已预留以下扩展接口：

### 🔐 用户认证系统
- 用户注册/登录
- JWT 会话管理
- API Key 管理

### 📊 管理后台
- 搜索统计分析
- 用户管理
- 系统监控

### 🎯 高级功能
- 搜索历史
- 个性化推荐
- 高级搜索选项
- 搜索结果导出

## 🛠️ 开发指南

### 添加新的搜索引擎

1. 编辑 `searxng/settings.yml`
2. 在 `engines` 部分添加配置
3. 重启 SearxNG 服务

### 自定义界面

- 修改 `src/app/globals.css` 调整样式
- 编辑 `tailwind.config.js` 自定义主题
- 在 `src/components/` 中添加新组件

### 扩展 API

1. 在 `src/app/api/` 中创建新路由
2. 使用 `src/types/` 中的类型定义
3. 参考现有 API 的错误处理模式

## 🐳 Docker 部署

### 开发环境
```bash
docker-compose up -d
```

### 生产环境
```bash
# 构建生产镜像
docker build -t web-query .

# 运行容器
docker run -d -p 3000:3000 \
  -e SEARXNG_URL=http://your-searxng-url \
  -e REDIS_URL=redis://your-redis-url \
  web-query
```

## 📈 性能优化

- **缓存策略**: 智能缓存热门搜索
- **响应压缩**: 自动 Gzip 压缩
- **图片优化**: Next.js 自动图片优化
- **代码分割**: 按需加载组件
- **静态生成**: 静态页面预生成

## 🔍 故障排除

### SearxNG 连接失败
```bash
# 检查 SearxNG 状态
curl http://localhost:8888/

# 查看 SearxNG 日志
docker-compose logs searxng
```

### Redis 连接问题
```bash
# 测试 Redis 连接
redis-cli -h localhost -p 6379 ping

# 查看 Redis 日志
docker-compose logs redis
```

### 前端构建错误
```bash
# 清除构建缓存
rm -rf .next
npm run build
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [SearxNG 项目](https://github.com/searxng/searxng)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel 部署](https://vercel.com)
