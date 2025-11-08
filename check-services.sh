#!/bin/bash

echo "🔍 检查服务状态..."
echo ""

# 检查 Docker 服务
echo "📦 Docker 容器状态:"
docker-compose ps
echo ""

# 检查 SearxNG
echo "🔎 SearxNG 健康检查:"
if curl -s http://localhost:8888/ > /dev/null; then
    echo "✅ SearxNG 运行正常 (http://localhost:8888)"
else
    echo "❌ SearxNG 未运行或无法访问"
fi
echo ""

# 检查 Redis
echo "💾 Redis 健康检查:"
if docker exec web-query-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 运行正常"
else
    echo "❌ Redis 未运行或无法访问"
fi
echo ""

# 检查 Next.js
echo "⚛️  Next.js 应用检查:"
if curl -s http://localhost:3001/ > /dev/null 2>&1; then
    echo "✅ Next.js 运行正常 (http://localhost:3001)"
else
    echo "⚠️  Next.js 未运行，请执行: npm run dev"
fi
echo ""

echo "✨ 检查完成！"
