FROM node:20-alpine

WORKDIR /app

# 安装依赖（先复制 package 文件，利用 Docker 层缓存）
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 数据库目录
RUN mkdir -p /app/data

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server.js"]
