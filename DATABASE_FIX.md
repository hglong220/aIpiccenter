# 🔧 数据库连接问题修复指南

## 问题描述

错误信息：`Error code 14: Unable to open the database file`

**原因**：Prisma schema 配置为 PostgreSQL，但环境变量 `DATABASE_URL` 指向 SQLite 数据库文件。

## 解决方案

### 方案1：使用 PostgreSQL（推荐 - 生产环境）

#### 步骤1：安装并启动 PostgreSQL

**Windows:**
1. 下载并安装 PostgreSQL: https://www.postgresql.org/download/windows/
2. 安装时记住设置的密码
3. 启动 PostgreSQL 服务

**使用 Docker（推荐）:**
```bash
docker run --name postgres-aipiccenter -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aipiccenter -p 5432:5432 -d postgres:14
```

#### 步骤2：更新环境变量

编辑 `.env` 或 `.env.local` 文件，将 `DATABASE_URL` 改为：

```env
# PostgreSQL 连接字符串
DATABASE_URL=postgresql://postgres:password@localhost:5432/aipiccenter?schema=public
```

**注意**：请根据你的实际配置修改：
- `postgres` - PostgreSQL 用户名（默认是 postgres）
- `password` - PostgreSQL 密码
- `localhost:5432` - 数据库主机和端口
- `aipiccenter` - 数据库名称

#### 步骤3：创建数据库（如果不存在）

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE aipiccenter;

# 退出
\q
```

#### 步骤4：运行数据库迁移

```bash
# 生成 Prisma Client
npm run db:generate

# 运行迁移
npm run db:migrate

# 或者直接推送 schema（开发环境）
npm run db:push
```

---

### 方案2：临时使用 SQLite（仅开发测试）

如果暂时不想配置 PostgreSQL，可以临时改回 SQLite：

#### 步骤1：修改 Prisma Schema

编辑 `prisma/schema.prisma`，将：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

改为：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

#### 步骤2：更新环境变量

确保 `.env` 或 `.env.local` 中：

```env
DATABASE_URL="file:./prisma/dev.db"
```

#### 步骤3：重新生成 Prisma Client

```bash
npm run db:generate
npm run db:push
```

---

## 验证连接

运行以下命令测试数据库连接：

```bash
# 测试连接（如果使用 Node.js 脚本）
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ 数据库连接成功'); process.exit(0); }).catch((e) => { console.error('❌ 数据库连接失败:', e.message); process.exit(1); });"
```

或者访问 `/api/health` 端点检查数据库健康状态。

---

## 推荐配置

**开发环境**：可以使用 SQLite（简单快速）
**生产环境**：必须使用 PostgreSQL（性能更好，支持并发）

---

## 常见问题

### Q: PostgreSQL 连接失败怎么办？

A: 检查：
1. PostgreSQL 服务是否运行
2. 用户名、密码是否正确
3. 数据库是否存在
4. 端口是否正确（默认 5432）
5. 防火墙是否阻止连接

### Q: 如何查看当前使用的数据库？

A: 检查 `.env` 或 `.env.local` 文件中的 `DATABASE_URL` 值。

### Q: 迁移数据从 SQLite 到 PostgreSQL？

A: 参考 `DATABASE_MIGRATION.md` 文件中的迁移指南。

