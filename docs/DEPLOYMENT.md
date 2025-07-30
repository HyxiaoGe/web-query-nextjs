# 部署指南 - Vercel + Upstash Redis

本指南介绍如何将 Web Query NextJS 项目部署到 Vercel，并使用 Upstash Redis 作为缓存服务。

## 前置准备

1. **GitHub 账号** - 用于代码托管
2. **Vercel 账号** - [注册地址](https://vercel.com/signup)
3. **Upstash 账号** - [注册地址](https://upstash.com/)
4. **SearxNG 实例** - 需要一个可访问的 SearxNG 服务

## 步骤一：准备 SearxNG 服务

### 选项 1：使用公共 SearxNG 实例
- 访问 [SearxNG 实例列表](https://searx.space/)
- 选择一个稳定的实例
- 记录其 URL（如：`https://search.example.com`）

### 选项 2：自建 SearxNG（推荐）
```bash
# 在 VPS 上部署 SearxNG
docker run -d \
  --name searxng \
  -p 8080:8080 \
  -e SEARXNG_SECRET_KEY=$(openssl rand -hex 32) \
  searxng/searxng:latest
```

## 步骤二：创建 Upstash Redis 数据库

1. 登录 [Upstash Console](https://console.upstash.com/)
2. 点击 "Create Database"
3. 配置数据库：
   - **Name**: web-query-cache
   - **Region**: 选择离目标用户最近的区域
   - **Type**: Regional (更快) 或 Global (多区域)
4. 创建后记录：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 步骤三：部署到 Vercel

### 方法 1：通过 Vercel Dashboard（推荐）

1. 将代码推送到 GitHub：
```bash
git add .
git commit -m "Ready for deployment"
git push origin master
```

2. 访问 [Vercel Dashboard](https://vercel.com/new)
3. 选择 "Import Git Repository"
4. 授权并选择你的仓库
5. 配置项目：
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next

### 方法 2：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

## 步骤四：配置环境变量

在 Vercel Dashboard 中添加以下环境变量：

### 必需变量
```bash
# SearxNG 服务地址
SEARXNG_URL=https://your-searxng-instance.com

# Upstash Redis（如果使用 Vercel 集成，会自动添加）
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 可选配置
```bash
# 请求超时（毫秒）
REQUEST_TIMEOUT=30000

# 最大搜索结果数
MAX_RESULTS=20

# 缓存 TTL（秒）
CACHE_TTL=3600

# 限流配置
GLOBAL_RATE_LIMIT_PER_MINUTE=100
MAX_CONCURRENT_REQUESTS=10
IP_RATE_LIMIT_PER_MINUTE=10
IP_RATE_LIMIT_PER_HOUR=100
QUERY_RATE_LIMIT_PER_MINUTE=3

# 管理员 API 密钥（用于访问 /api/admin/* 接口）
ADMIN_API_KEY=your-secure-admin-key
```

## 步骤五：使用 Vercel 集成（推荐）

1. 在 Vercel Dashboard 中，进入项目设置
2. 点击 "Integrations" 标签
3. 搜索并添加 "Upstash" 集成
4. 授权后选择你的 Redis 数据库
5. 环境变量会自动添加到项目中

## 步骤六：配置域名（可选）

1. 在 Vercel Dashboard 中进入项目设置
2. 点击 "Domains" 标签
3. 添加自定义域名
4. 按照提示配置 DNS

## 监控和维护

### 查看部署日志
```bash
vercel logs
```

### 监控指标
- 访问 `/metrics` 页面查看系统指标
- 使用 Vercel Analytics 监控性能
- 在 Upstash Console 查看 Redis 使用情况

### 更新部署
```bash
# 推送代码会自动触发部署
git push origin master

# 或手动部署
vercel --prod
```

## 故障排查

### 常见问题

1. **Redis 连接失败**
   - 检查 Upstash 环境变量是否正确
   - 确认 Redis 数据库状态正常

2. **SearxNG 连接超时**
   - 验证 SEARXNG_URL 是否可访问
   - 检查防火墙设置
   - 考虑增加 REQUEST_TIMEOUT

3. **部署失败**
   - 查看 Vercel 构建日志
   - 确保所有依赖都已正确安装
   - 检查 Node.js 版本要求（≥18）

## 性能优化建议

1. **选择合适的区域**
   - Vercel Functions 区域应接近用户
   - Upstash Redis 区域应接近 Vercel Functions

2. **启用缓存**
   - 搜索结果会自动缓存
   - 调整 CACHE_TTL 平衡新鲜度和性能

3. **配置限流**
   - 根据实际流量调整限流参数
   - 监控 429 错误率

## 安全建议

1. **保护 SearxNG 实例**
   - 使用 HTTPS
   - 考虑添加访问控制
   - 定期更新 SearxNG

2. **设置管理员密钥**
   - 生成强密码：`openssl rand -hex 32`
   - 仅在需要时启用管理接口

3. **监控异常流量**
   - 定期检查访问日志
   - 设置告警规则

## 成本估算

- **Vercel Free Plan**: 
  - 100GB 带宽/月
  - 100 小时函数执行时间
  - 足够个人项目使用

- **Upstash Free Plan**:
  - 10,000 请求/天
  - 256MB 存储
  - 适合中小型项目

- **升级建议**：
  - 日搜索量 > 1000：考虑 Vercel Pro
  - 日搜索量 > 10000：考虑 Upstash Pay as You Go

## 支持

如有问题，请提交 Issue 或查看：
- [Vercel 文档](https://vercel.com/docs)
- [Upstash 文档](https://docs.upstash.com/)
- [项目 README](../README.md)