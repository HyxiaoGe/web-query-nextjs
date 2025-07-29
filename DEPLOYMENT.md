# 部署指南

## 🚀 快速部署

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.local.example .env.local

# 3. 启动服务（如果有 Docker）
docker-compose up -d

# 4. 启动应用
npm run dev
```

### Vercel 部署 (推荐)

1. **准备 SearxNG 服务**
   ```bash
   # 方式1: 使用公共 SearxNG 实例
   # 搜索: "public searxng instances"
   
   # 方式2: 自建 SearxNG (需要服务器)
   # 参考: https://github.com/searxng/searxng-docker
   ```

2. **部署到 Vercel**
   ```bash
   # Fork 项目到 GitHub
   # 在 Vercel 导入项目
   # 配置环境变量:
   # - SEARXNG_URL: https://your-searxng-instance.com
   # - REDIS_URL: (可选，不设置会使用内存缓存)
   ```

3. **环境变量配置**
   ```env
   SEARXNG_URL=https://searx.example.com
   REDIS_URL=rediss://your-redis-url  # 可选
   CACHE_TTL=3600
   MAX_RESULTS=10
   REQUEST_TIMEOUT=30000
   ```

### Docker 部署

1. **完整 Docker 部署**
   ```bash
   # 克隆项目
   git clone <your-repo>
   cd web-query-nextjs
   
   # 启动所有服务
   docker-compose up -d
   
   # 访问应用
   open http://localhost:3000
   ```

2. **仅应用 Docker 部署**
   ```bash
   # 构建镜像
   docker build -t web-query .
   
   # 运行容器
   docker run -d -p 3000:3000 \
     -e SEARXNG_URL=https://your-searxng-url \
     -e REDIS_URL=redis://your-redis-url \
     web-query
   ```

## 🔧 SearxNG 服务选项

### 选项 1: 公共实例 (快速测试)
```
https://searx.tiekoetter.com
https://searx.be
https://searx.ninja
```

### 选项 2: 自建服务 (推荐生产环境)
```bash
# 使用 searxng-docker
git clone https://github.com/searxng/searxng-docker.git
cd searxng-docker
sed -i "s|searxng.hostname|your-domain.com|g" .env
docker-compose up -d
```

### 选项 3: 云服务部署
- Railway: https://railway.app/template/searxng
- Heroku: 使用官方 buildpack
- DigitalOcean: App Platform 部署

## 🗄️ Redis 缓存选项

### 选项 1: 内存缓存 (默认)
- 不需要配置 REDIS_URL
- 适用于小规模使用
- 重启后数据丢失

### 选项 2: 云 Redis
- Upstash Redis (免费额度)
- Redis Cloud
- AWS ElastiCache

### 选项 3: 自建 Redis
```bash
# Docker 运行
docker run -d -p 6379:6379 redis:alpine

# 配置环境变量
REDIS_URL=redis://localhost:6379
```

## 🌐 域名和 SSL

### Vercel (自动)
- 自动 HTTPS
- 自定义域名支持
- 全球 CDN

### 自建服务器
```bash
# 使用 Nginx + Let's Encrypt
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 性能优化

### 1. 缓存配置
```env
CACHE_TTL=7200          # 2小时缓存
MAX_RESULTS=20          # 增加结果数
REQUEST_TIMEOUT=10000   # 10秒超时
```

### 2. CDN 配置
- Vercel: 自动全球 CDN
- Cloudflare: 免费 CDN + 缓存
- AWS CloudFront: 企业级 CDN

### 3. 监控设置
```bash
# 健康检查
curl https://your-domain.com/api/health

# 性能监控
# 使用 Vercel Analytics 或 Google Analytics
```

## 🔒 安全配置

### 1. 环境变量安全
- 使用强随机密钥
- 定期轮换密钥
- 不要提交到代码库

### 2. 网络安全
```bash
# 防火墙配置
ufw allow 80
ufw allow 443
ufw deny 3000  # 不直接暴露应用端口
```

### 3. 访问控制
- 使用 Cloudflare Access
- 配置 IP 白名单
- 实现 API 限流

## 📋 部署检查清单

- [ ] 环境变量配置正确
- [ ] SearxNG 服务可访问
- [ ] Redis 连接正常 (可选)
- [ ] 域名 DNS 解析正确
- [ ] SSL 证书有效
- [ ] 健康检查通过
- [ ] 搜索功能测试
- [ ] 性能测试完成
- [ ] 监控和日志配置

## 🆘 故障排除

### 常见问题

1. **搜索无结果**
   ```bash
   # 检查 SearxNG 状态
   curl $SEARXNG_URL/health
   
   # 检查配置
   echo $SEARXNG_URL
   ```

2. **页面加载慢**
   ```bash
   # 检查网络延迟
   ping your-searxng-host
   
   # 增加超时时间
   REQUEST_TIMEOUT=30000
   ```

3. **缓存不工作**
   ```bash
   # 检查 Redis 连接
   redis-cli -u $REDIS_URL ping
   
   # 查看缓存日志
   docker logs your-app-container
   ```

### 日志查看
```bash
# Vercel 日志
vercel logs

# Docker 日志
docker logs web-query-app

# 系统日志
journalctl -u your-service
```

## 📞 技术支持

- 项目文档: [README.md](./README.md)
- SearxNG 文档: https://docs.searxng.org/
- Next.js 部署: https://nextjs.org/docs/deployment
- Vercel 支持: https://vercel.com/docs