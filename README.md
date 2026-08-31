# FamilyFlow — Google AI Pro 家庭权益自助邀请平台

一个可运行、可测试、可容器化部署的全栈 MVP。用户验证卡密并提交邀请邮箱后，后端会在事务内选择仍有余量的母号、预占席位，并通过 BullMQ 异步执行邀请任务；前端持续展示脱敏后的任务状态。

> 默认使用 `MockInvitationExecutor` 完成演示闭环，不会真正发送 Google 家庭组邀请，也不会登录或控制任何 Google 账号。

## 技术栈

- 前端：Vue 3、TypeScript、Vite、Pinia、Vitest
- 后端：NestJS、Prisma、PostgreSQL、Jest、Supertest
- 异步任务：Redis、BullMQ
- 部署与质量：Docker Compose、Nginx、GitHub Actions、ESLint

## 已实现功能

- 卡密可用性验证；数据库仅保存加 pepper 的安全哈希。
- 卡密核销、母号选择、席位预占和邀请任务创建。
- PostgreSQL 行锁与串行事务，防止并发超卖。
- 同一卡密重复提交幂等；禁止改绑其他邮箱。
- BullMQ 异步执行、失败重试与任务状态查询。
- 母号匿名标签、启停和容量管理。
- 用户邮箱脱敏展示；队列只传递任务 ID。
- 桌面/移动端自适应页面。

详细设计见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## Docker Compose 快速启动

要求：Docker Desktop 以及 Compose v2。

```bash
cp .env.example .env
```

启动前请至少修改 `.env` 中的 `CARD_HASH_PEPPER`、`ADMIN_API_KEY` 和数据库密码。`.env` 已被 Git 忽略。

```bash
docker compose up -d --build --wait
docker compose exec -T api ./node_modules/.bin/tsx apps/api/prisma/seed.ts
```

浏览器访问：<http://localhost:8080>

演示数据：

- 卡密：`DEMO-2026-MVP-0001`
- 母号标签：`demo-owner-01`
- 管理入口使用 `.env` 中的 `ADMIN_API_KEY`

演示卡密仅用于本地 Mock 环境，生产环境不要使用示例密钥或示例数据。

查看状态与停止服务：

```bash
docker compose ps
docker compose logs -f api
docker compose down
```

`docker compose down` 不会删除数据库卷；除非明确需要清空本地数据，否则不要增加 `-v`。

如果本机的 `5432`、`6379` 或 `8080` 已被占用，可以临时改端口：

```bash
POSTGRES_PORT=5433 REDIS_PORT=6380 WEB_PORT=8088 docker compose up -d --build --wait
```

## 本地开发

要求：Node.js 22+、npm 11+、PostgreSQL、Redis。

```bash
npm install
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run dev:api
```

另开终端：

```bash
npm run dev:web
```

前端默认运行在 <http://localhost:5173>，并将 `/api` 代理到 `http://localhost:3000`。

## API

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/v1/cards/verify` | 验证卡密 |
| `POST` | `/api/v1/invitations` | 创建幂等邀请任务 |
| `GET` | `/api/v1/invitations/:id` | 查询公开任务状态 |
| `GET` | `/api/v1/admin/owners` | 查询母号容量 |
| `POST` | `/api/v1/admin/owners` | 新增母号标签 |
| `PATCH` | `/api/v1/admin/owners/:id` | 修改状态或容量 |

管理接口必须携带 `x-admin-key`。公开接口不会返回完整邮箱、母号标签或内部数据库 ID。

## 验证命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

集成测试需要 PostgreSQL 和 Redis：

```bash
docker compose up -d --wait postgres redis
npm run db:migrate
npm run test:integration
```

CI 会自动运行依赖安装、Prisma 生成与迁移、lint、类型检查、单元测试、集成测试、生产构建和 Compose 配置验证。

## 数据库变更与回滚

- 数据库变更必须添加 Prisma migration。
- 迁移文件按发布版本进入 Git，部署时运行 `prisma migrate deploy`。
- 本迁移只创建新表和枚举；回滚时应先备份数据库，再由运维执行对应的反向 SQL。
- Git 发布版本通过 `git revert` 回滚，不移动已发布标签。

版本策略见 [docs/VERSIONING.md](docs/VERSIONING.md)，v0.1.0 变更见 [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md)。

## 生产接入限制

真实邀请能力必须实现 `InvitationExecutor`，并使用服务条款允许的官方接口或人工确认流程。项目明确不收集 Google 密码、Cookie、恢复邮箱、2FA 密钥或浏览器会话；这些信息也不得写入队列、日志、数据库和 Git。
