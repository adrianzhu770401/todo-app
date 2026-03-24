# 腾讯云部署指南（轻量应用服务器）

## 推荐方案：腾讯云 Lighthouse 轻量服务器 + Docker Compose

### 为什么选轻量服务器？
- 💰 **最便宜**：24元/月起（2核2G），新用户有优惠
- 🚀 **最简单**：Docker Compose 一键启动，无需复杂配置
- 🔒 **数据安全**：SQLite 数据持久化在服务器本地
- 🌏 **国内访问快**：腾讯云国内节点，延迟低

---

## 第一步：购买轻量应用服务器

1. 进入 [腾讯云轻量应用服务器](https://cloud.tencent.com/product/lighthouse)
2. 点击"立即选购"
3. 配置选择：
   - **地域**：选离你用户最近的（如上海、广州、北京）
   - **镜像**：选 `Ubuntu 22.04`（系统镜像）
   - **套餐**：2核2G 50GB SSD（24元/月）起，个人项目够用
4. 购买后进入控制台，找到你的**公网 IP 地址**

---

## 第二步：配置防火墙

在轻量服务器控制台 → **防火墙** → 添加规则：

| 协议 | 端口 | 来源 | 用途 |
|------|------|------|------|
| TCP | 80 | 所有 | HTTP 访问 |
| TCP | 443 | 所有 | HTTPS（可选）|
| TCP | 22 | 所有 | SSH 管理 |

---

## 第三步：SSH 连接服务器

```bash
# Windows 用户：在 PowerShell 或 CMD 中执行
ssh ubuntu@你的公网IP

# 首次连接需确认指纹，输入 yes 继续
```

> 💡 也可以用腾讯云控制台的**网页 SSH 终端**，不需要本地配置

---

## 第四步：安装 Docker（服务器上执行）

```bash
# 使用阿里云镜像加速安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# 验证安装
docker -v
docker compose version
```

---

## 第五步：上传代码到服务器

### 方法一：从 GitHub 拉取（推荐）

```bash
# 在服务器上执行
sudo apt-get install -y git

# 克隆代码（你的 GitHub 仓库）
git clone https://github.com/adrianzhu770401/todo-app.git
cd todo-app
```

### 方法二：用 scp 直接上传本地文件

```powershell
# 在本地 PowerShell 执行（替换 IP）
scp -r "C:\Users\yang qi\WorkBuddy\20260324130532\todo-app" ubuntu@你的公网IP:~/
```

---

## 第六步：一键部署

```bash
# 进入项目目录
cd todo-app

# 给部署脚本添加执行权限
chmod +x deploy.sh

# 运行一键部署（自动安装依赖、生成密钥、构建镜像、启动服务）
bash deploy.sh
```

部署脚本会自动完成：
- ✅ 检查并安装 Docker / Docker Compose
- ✅ 生成随机 JWT_SECRET
- ✅ 构建前后端 Docker 镜像
- ✅ 启动所有服务
- ✅ 等待服务健康检查通过

**首次构建约需 3-5 分钟**（需要下载 Node.js 镜像和安装依赖）

---

## 第七步：访问你的应用

部署完成后，打开浏览器访问：

```
http://你的公网IP
```

---

## 常用运维命令

```bash
# 查看运行状态
docker compose ps

# 实时查看日志
docker compose logs -f

# 只看后端日志
docker compose logs -f backend

# 重启所有服务
docker compose restart

# 停止所有服务
docker compose down

# 更新代码后重新部署
git pull origin main
docker compose build
docker compose up -d

# 备份 SQLite 数据库
docker cp todo-backend:/app/data/todo.db ./todo_backup_$(date +%Y%m%d).db
```

---

## 可选：绑定域名 + HTTPS

### 绑定域名

1. 在域名注册商（腾讯云 DNSPod 等）添加 A 记录，指向服务器公网 IP
2. 等待 DNS 生效（通常 5-10 分钟）

### 配置 HTTPS（Let's Encrypt 免费证书）

```bash
# 安装 certbot
sudo apt-get install -y certbot

# 申请证书（替换 yourdomain.com）
sudo certbot certonly --standalone -d yourdomain.com

# 更新 ALLOWED_ORIGINS（编辑 .env 文件）
nano .env
# 将 ALLOWED_ORIGINS=* 改为 ALLOWED_ORIGINS=https://yourdomain.com

# 重启生效
docker compose restart
```

> 更完整的 HTTPS 配置需要修改 nginx.conf，如需帮助请告知。

---

## 故障排查

### 访问不了网页
- 检查防火墙是否开放了 80 端口
- 执行 `docker compose ps` 确认容器都在运行
- 执行 `docker compose logs frontend` 查看前端日志

### 接口报错 / 登录失败
- 执行 `docker compose logs backend` 查看后端日志
- 确认 `.env` 文件中 `JWT_SECRET` 已设置

### 容器启动失败
```bash
# 查看详细构建日志
docker compose build --no-cache
docker compose up  # 不加 -d，直接看日志输出
```
