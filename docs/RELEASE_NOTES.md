# v0.1.0

首个可演示 MVP：

- Vue 3 自助邀请三步页面与母号容量管理面板。
- NestJS 卡密验证、邀请提交、任务查询和管理员容量 API。
- PostgreSQL 串行事务、行锁与席位预占，防止并发超卖。
- Redis + BullMQ 异步任务和可替换的 `InvitationExecutor`。
- Prisma migration、演示种子数据、Nginx 与 Docker Compose。
- Jest 单元测试、Supertest 集成测试、Vitest 组件测试和 GitHub Actions CI。

限制：默认邀请 Provider 为安全 Mock，不会实际发送 Google 家庭组邀请。
