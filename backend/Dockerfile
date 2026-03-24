# ---- 后端 Dockerfile ----
FROM node:20-alpine

# 安装 better-sqlite3 需要的编译工具
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 先拷贝依赖文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm ci --only=production

# 拷贝源代码
COPY . .

# 创建数据目录
RUN mkdir -p /data

EXPOSE 3001

ENV NODE_ENV=production
ENV DB_PATH=/data/todo.db

CMD ["node", "server.js"]
