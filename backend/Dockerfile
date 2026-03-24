FROM node:20-slim

WORKDIR /app

# 安装 better-sqlite3 原生编译所需的系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 先复制 package 文件（利用 Docker 层缓存）
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 数据库目录（挂载卷）
RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server.js"]
