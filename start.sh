#!/bin/bash

echo "🚀 启动 Web Query Next.js 服务..."

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动后台服务 (如果需要)
echo "🔍 检查后台服务..."

# 检查 SearxNG 是否运行
if ! curl -s http://localhost:8888/ > /dev/null; then
    echo "⚠️  SearxNG 服务未运行，尝试启动 Docker 服务..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d searxng redis
        echo "⏳ 等待服务启动..."
        sleep 10
    else
        echo "❌ Docker Compose 未安装，请手动启动 SearxNG 服务"
        echo "   或者修改 .env.local 中的 SEARXNG_URL 指向远程服务"
    fi
fi

# 启动 Next.js 开发服务器
echo "🎯 启动 Next.js 应用..."
npm run dev