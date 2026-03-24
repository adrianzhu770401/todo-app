# Todo App 部署指南

## 方案一：Railway（推荐新手，免费）

Railway 可以直接从 GitHub 仓库部署，不需要自己的服务器。

### 第一步：推送到 GitHub

1. 登录 [GitHub](https://github.com)，新建一个仓库（比如 `todo-app`）
2. 在本地执行：

```bash
cd todo-app
git remote add origin https://github.com/你的用户名/todo-app.git
git push -u origin master
```

### 第二步：部署后端到 Railway

1. 打开 [railway.app](https://railway.app)，用 GitHub 登录
2. 点 **New Project → Deploy from GitHub repo**，选 `todo-app`
3. 进入项目设置：
   - **Root Directory** 设为 `backend`
   - **Build Command**：`npm install`
   - **Start Command**：`node server.js`
4. 在 **Variables** 标签加入：
   ```
   PORT = 3001
   JWT_SECRET = 随机一段长字符串（比如 my_super_secret_key_2026）
   NODE_ENV = production
   ```
5. 点 Deploy，等待完成，Railway 会给你一个 URL，比如 `https://todo-backend.up.railway.app`

### 第三步：部署前端到 Vercel

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 点 **New Project**，导入 `todo-app`
3. 设置：
   - **Root Directory**：`frontend`
   - **Framework**：Vite
4. 在 **Environment Variables** 加入：
   ```
   VITE_API_URL = https://todo-backend.up.railway.app/api
   ```
   （替换成你的 Railway 后端 URL）
5. 点 Deploy，完成！Vercel 会给你前端 URL

---

## 方案二：腾讯云 / 阿里云轻量服务器（有更多控制权）

需要一台 Linux 服务器（最低 1核2G），成本约 ¥24/月。

### 前提：服务器安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker

# 安装 docker-compose
sudo apt-get install docker-compose-plugin
```

### 部署步骤

```bash
# 1. 克隆代码到服务器
git clone https://github.com/你的用户名/todo-app.git
cd todo-app

# 2. 创建生产环境变量文件
echo "JWT_SECRET=改成一个复杂的随机字符串" > .env

# 3. 一键启动
docker compose up -d --build

# 查看状态
docker compose ps
docker compose logs -f
```

访问 `http://服务器IP` 即可看到应用。

### 配置 HTTPS（用 Certbot + Nginx）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 申请证书（需要先把域名解析到服务器IP）
sudo certbot --nginx -d yourdomain.com

# 证书自动续期
sudo systemctl enable certbot.timer
```

---

## 方案三：本地运行（开发/测试）

```bash
# 终端 1：启动后端
cd todo-app/backend
npm start

# 终端 2：启动前端
cd todo-app/frontend
npm run dev
```

访问 http://localhost:5173

---

## API 接口文档

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET  | /api/auth/me | 获取当前用户（需 Token） |

### 待办任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET    | /api/todos | 获取任务列表（支持 ?filter=active/completed） |
| POST   | /api/todos | 创建任务 |
| PUT    | /api/todos/:id | 更新任务 |
| DELETE | /api/todos/:id | 删除任务 |
| PATCH  | /api/todos/:id/toggle | 切换完成状态 |

所有 todos 接口需要在 Header 带上：
```
Authorization: Bearer <token>
```
