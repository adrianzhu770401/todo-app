#!/bin/bash
# Todo App 腾讯云一键部署脚本
# 使用方法：bash deploy.sh

set -e

echo "======================================"
echo "  Todo App 腾讯云部署脚本"
echo "======================================"

# ---- 检查 Docker 是否已安装 ----
if ! command -v docker &> /dev/null; then
    echo "📦 Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装: $(docker -v)"
fi

# ---- 检查 Docker Compose 是否已安装 ----
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装: $(docker compose version)"
fi

# ---- 生成 .env 文件 ----
if [ ! -f ".env" ]; then
    echo ""
    echo "🔐 生成环境变量文件..."
    JWT_SECRET=$(openssl rand -hex 32)
    cat > .env << EOF
# JWT 密钥（自动生成，请勿泄露）
JWT_SECRET=${JWT_SECRET}

# 允许的前端域名（* 表示允许所有，生产环境建议填具体域名）
ALLOWED_ORIGINS=*
EOF
    echo "✅ .env 文件已生成，JWT_SECRET 已自动生成"
else
    echo "✅ .env 文件已存在，跳过生成"
fi

# ---- 拉取代码（如果是从 GitHub 部署）----
# git pull origin main

# ---- 构建并启动容器 ----
echo ""
echo "🐳 构建 Docker 镜像（首次可能需要 3-5 分钟）..."
docker compose build --no-cache

echo ""
echo "🚀 启动服务..."
docker compose up -d

# ---- 等待健康检查 ----
echo ""
echo "⏳ 等待后端服务就绪..."
for i in {1..30}; do
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ 后端服务已就绪！"
        break
    fi
    echo "  等待中... ($i/30)"
    sleep 3
done

# ---- 显示状态 ----
echo ""
echo "📊 容器状态："
docker compose ps

echo ""
echo "======================================"
echo "🎉 部署完成！"
PUBLIC_IP=$(curl -sf http://checkip.amazonaws.com 2>/dev/null || echo "请查看控制台获取公网IP")
echo "🌍 访问地址：http://${PUBLIC_IP}"
echo ""
echo "常用命令："
echo "  查看日志：docker compose logs -f"
echo "  重启服务：docker compose restart"
echo "  停止服务：docker compose down"
echo "  更新应用：git pull && docker compose build && docker compose up -d"
echo "======================================"
