# Google AI Pro 家庭权益自助邀请平台

面向 Google AI Pro 家庭权益场景的自助邀请与席位管理平台。

## 当前阶段

- 版本：`v0.0.1`
- 状态：项目基线已建立，尚未开始业务代码开发
- 目标：先实现卡密验证、目标邮箱提交、母号席位分配、邀请任务与状态查询的 MVP 闭环

## 计划技术栈

- 前端：Vue 3、TypeScript、Vite、Pinia
- 后端：NestJS、Prisma、PostgreSQL
- 异步任务：Redis、BullMQ
- 测试：Vitest、Jest、Supertest、Playwright Test
- 部署：Docker Compose、Nginx、GitHub Actions

## 版本原则

- `main` 始终保留可运行、可回滚的版本。
- 每项功能使用独立分支开发，通过测试后再合并。
- 每个可交付版本创建 Git 标签，例如 `v0.1.0`。
- 密码、Cookie、Token、`.env` 和浏览器会话不得进入 Git。

详细规则见 [docs/VERSIONING.md](docs/VERSIONING.md) 和 [AGENTS.md](AGENTS.md)。
