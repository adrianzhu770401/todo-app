# Todo App 部署指南（Railway 全流程）

## 整体架构

```
用户浏览器
    ↓
Railway 前端服务（React）
    ↓ VITE_API_URL
Railway 后端服务（Express + SQLite）
```

---

## 第一步：把代码推到 GitHub

### 1.1 在 GitHub 上新建仓库

1. 打开 https://github.com，登录（没账号先注册）
2. 右上角点 **+** → **New repository**
3. 填写：
   - Repository name: `todo-app`
   - 选 **Public**（免费账号 Public 仓库无限）
   - **不要**勾选 Initialize this repository
4. 点 **Create repository**
5. 复制页面上显示的仓库地址，格式为：
   `https://github.com/你的用户名/todo-app.git`

### 1.2 在本地推送代码

在项目根目录执行（把 `你的用户名` 换成你的 GitHub 用户名）：

```bash
cd todo-app
git remote add origin https://github.com/你的用户名/todo-app.git
git branch -M main
git push -u origin main
```

推送时会弹出登录框，输入 GitHub 账号密码（或 Token）。

> **注意**：如果提示需要 Personal Access Token，去 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token，勾选 `repo` 权限即可。

---

## 第二步：部署后端到 Railway

### 2.1 注册 Railway

1. 打开 https://railway.app
2. 点 **Login** → 用 **GitHub 账号登录**（推荐，方便直接读取仓库）

### 2.2 创建后端服务

1. 登录后点 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 找到并选择 `todo-app` 仓库
4. Railway 会自动检测项目，点 **Deploy Now**

### 2.3 配置后端

进入刚创建的服务，点顶部 **Settings** 标签：

| 设置项 | 填写值 |
|--------|--------|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `node server.js` |

然后点 **Variables** 标签，添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `PORT` | `3001` |
| `JWT_SECRET` | 随机字符串，比如 `todo_app_secret_key_2026_xyz` |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | 先填 `*`，等前端部署好后再改成前端 URL |

点 **Deploy** 等待部署完成（约 1-2 分钟）。

### 2.4 获取后端 URL

部署成功后，点 **Settings** → **Domains**，会看到一个 URL，格式类似：
```
https://todo-app-production-xxxx.up.railway.app
```
**复制这个 URL，后面前端要用。**

---

## 第三步：部署前端到 Railway

### 3.1 在同一项目中添加前端服务

1. 在刚才的 Railway 项目页，点 **+ New** → **GitHub Repo**
2. 再次选择同一个 `todo-app` 仓库

### 3.2 配置前端

进入新的前端服务，点 **Settings** 标签：

| 设置项 | 填写值 |
|--------|--------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npx serve -s dist -l 3000` |

然后点 **Variables** 标签，添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://你的后端URL/api`（第 2.4 步复制的地址，后面加 `/api`） |

例如：`https://todo-app-production-xxxx.up.railway.app/api`

点 **Deploy**，等待部署。

### 3.3 获取前端 URL

前端部署完成后同样在 **Settings** → **Domains** 获取前端 URL。

---

## 第四步：更新后端 CORS 配置（重要！）

前端部署好后，要告诉后端允许前端的域名访问。

回到后端服务 → **Variables** → 把 `ALLOWED_ORIGINS` 的值改为：
```
https://你的前端URL
```

例如：`https://todo-frontend-xxxx.up.railway.app`

保存后后端会自动重新部署。

---

## 第五步：验证上线

1. 打开前端 URL
2. 注册一个账号
3. 登录后添加几条任务
4. 刷新页面，任务还在 ✅

---

## 常见问题

### Q: 部署后打开网页显示 "Cannot GET /"
**A**: 前端 Start Command 没配对，确认是 `npx serve -s dist -l 3000`

### Q: 登录报错 "Network Error"
**A**: 检查 `VITE_API_URL` 是否填写正确，必须是 `https://` 开头的后端地址加 `/api`

### Q: 注册/登录一直转圈
**A**: 后端可能还在部署中，等待后端服务状态变为 "Active" 再试

### Q: better-sqlite3 编译失败
**A**: 确认 `backend/nixpacks.toml` 文件存在，Railway 会自动使用它配置编译环境

### Q: 免费额度够用吗
**A**: Railway 每月有 $5 免费额度，个人练手项目完全够用（通常只消耗几分钱）

---

## 本地开发（快速回顾）

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
