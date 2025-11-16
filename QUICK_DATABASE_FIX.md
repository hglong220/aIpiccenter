# 🚨 快速修复数据库连接问题

## 问题
错误：`Error code 14: Unable to open the database file`

**原因**：Prisma schema 配置为 PostgreSQL，但环境变量指向 SQLite。

---

## ✅ 解决方案（选择其一）

### 方案A：快速修复 - 临时使用 SQLite（开发环境）

如果你暂时不想配置 PostgreSQL，可以临时改回 SQLite：

1. **修改 `prisma/schema.prisma`**，将第6行改为：
   ```prisma
   provider = "sqlite"
   ```

2. **确保 `.env` 或 `.env.local` 中有**：
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. **重新生成 Prisma Client**：
   ```bash
   npm run db:generate
   npm run db:push
   ```

---

### 方案B：配置 PostgreSQL（推荐 - 生产环境）

#### 1. 使用 Docker 快速启动 PostgreSQL：

```bash
docker run --name postgres-aipiccenter -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aipiccenter -p 5432:5432 -d postgres:14
```

#### 2. 更新 `.env` 或 `.env.local`：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/aipiccenter?schema=public
```

#### 3. 运行迁移：

```bash
npm run db:generate
npm run db:push
```

---

## 🔍 检查当前配置

运行以下命令检查你的配置：

```bash
# 检查 Prisma schema
cat prisma/schema.prisma | grep provider

# 检查环境变量（如果存在）
cat .env | grep DATABASE_URL
# 或
cat .env.local | grep DATABASE_URL
```

---

## 📝 推荐

- **开发环境**：可以使用 SQLite（方案A，简单快速）
- **生产环境**：必须使用 PostgreSQL（方案B，性能更好）

选择方案A后，应用应该可以正常运行了！

