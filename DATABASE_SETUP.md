# 数据库设置指南

## 🚨 数据库连接错误

如果遇到以下错误：
```
Can't reach database server at `localhost:5432`
```

说明 PostgreSQL 数据库服务器未运行。

## 解决方案

### 方案一：使用 Docker（推荐，最简单）

#### 1. 启动 PostgreSQL 容器

```bash
docker run --name postgres-aipiccenter \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aipiccenter \
  -p 5432:5432 \
  -d postgres:15
```

#### 2. 检查容器是否运行

```bash
docker ps
```

应该能看到 `postgres-aipiccenter` 容器正在运行。

#### 3. 如果容器已存在但未运行

```bash
# 启动已存在的容器
docker start postgres-aipiccenter

# 查看容器状态
docker ps -a
```

### 方案二：使用本地 PostgreSQL

#### 1. 安装 PostgreSQL

- **Windows**: 从 [PostgreSQL 官网](https://www.postgresql.org/download/windows/) 下载安装
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql` (Ubuntu/Debian)

#### 2. 启动 PostgreSQL 服务

**Windows**:
- 打开"服务"管理器（services.msc）
- 找到 "PostgreSQL" 服务
- 右键点击"启动"

**macOS/Linux**:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### 3. 创建数据库

```bash
# 使用 postgres 用户登录
psql -U postgres

# 创建数据库
CREATE DATABASE aipiccenter;

# 退出
\q
```

### 方案三：检查数据库连接

#### 1. 检查 PostgreSQL 是否运行

**Windows**:
```powershell
netstat -an | findstr 5432
```

**macOS/Linux**:
```bash
netstat -an | grep 5432
# 或
lsof -i :5432
```

如果看到 `LISTENING` 或 `0.0.0.0:5432`，说明数据库正在运行。

#### 2. 测试数据库连接

```bash
# 使用 psql 测试连接
psql -h localhost -p 5432 -U postgres -d aipiccenter
```

如果提示输入密码，输入 `postgres`（根据你的配置）。

## 初始化数据库

数据库运行后，需要初始化数据库表结构：

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema（开发环境）
npm run db:push

# 或者创建迁移（生产环境）
npm run db:migrate
```

## 验证数据库

```bash
# 打开 Prisma Studio 查看数据库
npm run db:studio
```

访问 `http://localhost:5555` 查看数据库内容。

## 常见问题

### 问题 1：端口 5432 已被占用

**解决方案**：
- 修改 Docker 端口映射：`-p 5433:5432`
- 更新 `.env.local` 中的 `DATABASE_URL` 端口为 `5433`

### 问题 2：密码错误

**解决方案**：
- 检查 `.env.local` 中的 `DATABASE_URL`
- 确保密码与数据库配置一致

### 问题 3：数据库不存在

**解决方案**：
```bash
# 使用 Docker
docker exec -it postgres-aipiccenter psql -U postgres
CREATE DATABASE aipiccenter;

# 使用本地 PostgreSQL
createdb aipiccenter
```

## 快速启动脚本（Docker）

如果使用 Docker，可以创建一个启动脚本：

**Windows (start-db.bat)**:
```batch
@echo off
docker start postgres-aipiccenter 2>nul || docker run --name postgres-aipiccenter -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=aipiccenter -p 5432:5432 -d postgres:15
echo Database started!
```

**macOS/Linux (start-db.sh)**:
```bash
#!/bin/bash
docker start postgres-aipiccenter 2>/dev/null || docker run --name postgres-aipiccenter -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=aipiccenter -p 5432:5432 -d postgres:15
echo "Database started!"
```

## 下一步

数据库运行后：
1. 运行 `npm run db:push` 初始化数据库
2. 重启开发服务器 `npm run dev`
3. 测试登录功能












