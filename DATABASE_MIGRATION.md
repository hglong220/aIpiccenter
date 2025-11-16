# 数据库迁移指南：SQLite → PostgreSQL

本文档说明如何将数据库从 SQLite 迁移到 PostgreSQL。

## 📋 前置要求

1. **PostgreSQL 已安装并运行**
   - 本地安装：https://www.postgresql.org/download/
   - Docker：`docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine`

2. **创建数据库**
   ```sql
   CREATE DATABASE aipiccenter;
   CREATE USER aipiccenter WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE aipiccenter TO aipiccenter;
   ```

3. **配置环境变量**
   - 复制 `env.template` 为 `.env.local`
   - 设置 `DATABASE_URL=postgresql://aipiccenter:password@localhost:5432/aipiccenter?schema=public`

## 🚀 迁移步骤

### 方法1：全新安装（推荐，无现有数据）

```bash
# 1. 安装依赖
npm install

# 2. 运行迁移
npm run db:migrate-to-postgres

# 3. 验证
npm run dev
# 访问 http://localhost:3000/api/health 检查数据库连接
```

### 方法2：从 SQLite 迁移现有数据

```bash
# 1. 导出 SQLite 数据
npm run db:export-sqlite
# 数据将导出到 scripts/sqlite-export.json

# 2. 运行 PostgreSQL 迁移
npm run db:migrate-to-postgres

# 3. 导入数据到 PostgreSQL
npm run db:import-postgres

# 4. 验证
npm run dev
# 访问 http://localhost:3000/api/health 检查数据库连接
```

## 🔍 验证迁移

1. **健康检查 API**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Prisma Studio**
   ```bash
   npm run db:studio
   ```

3. **数据库连接测试**
   ```bash
   npx prisma db pull
   ```

## 📝 迁移后的变化

### Schema 变化

- **数据库类型**：SQLite → PostgreSQL
- **文本字段**：自动使用 `@db.Text` 类型
- **连接池**：Prisma 自动管理 PostgreSQL 连接池
- **性能**：PostgreSQL 支持更好的并发和索引

### 代码变化

- `lib/prisma.ts`：添加了连接池配置和健康检查
- `app/api/health/route.ts`：使用新的健康检查函数
- 所有 Prisma 查询保持不变（Prisma 自动处理差异）

## 🐳 Docker 部署

如果使用 Docker，`docker-compose.yml` 已配置 PostgreSQL：

```bash
# 启动所有服务（包括 PostgreSQL）
docker-compose up -d

# 运行迁移
docker-compose exec app npm run db:migrate-to-postgres

# 查看日志
docker-compose logs -f app
```

## ⚠️ 注意事项

1. **备份数据**：迁移前请备份 SQLite 数据库
2. **环境变量**：确保 `.env.local` 中的 `DATABASE_URL` 正确
3. **权限问题**：确保数据库用户有足够的权限
4. **连接池**：生产环境建议配置连接池参数
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
   ```

## 🔧 故障排除

### 连接失败

```
Error: P1001: Can't reach database server
```

**解决方案**：
- 检查 PostgreSQL 服务是否运行
- 检查 `DATABASE_URL` 是否正确
- 检查防火墙设置

### 权限错误

```
Error: P1000: Authentication failed
```

**解决方案**：
- 检查用户名和密码
- 确保用户有数据库访问权限

### 迁移失败

```
Error: Migration failed
```

**解决方案**：
- 检查数据库是否为空（全新迁移）
- 或先手动删除所有表（如果允许）
- 检查 Prisma schema 语法

## 📚 相关文档

- [Prisma PostgreSQL 文档](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Docker PostgreSQL 镜像](https://hub.docker.com/_/postgres)

## ✅ 迁移检查清单

- [ ] PostgreSQL 已安装并运行
- [ ] 数据库已创建
- [ ] 环境变量已配置
- [ ] 依赖已安装（包括 tsx）
- [ ] 迁移脚本已运行
- [ ] 数据已导出（如有）
- [ ] 数据已导入（如有）
- [ ] 健康检查通过
- [ ] 应用正常运行

