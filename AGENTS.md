# AGENTS.md

## Project scope

本项目是 Google AI Pro 家庭权益自助邀请与席位管理平台。

## Required workflow

- 开始修改前检查 `git status`，不得覆盖用户已有修改。
- 一个任务只处理一个明确目标，不混入无关重构。
- 业务代码变更必须增加或更新测试。
- 完成前必须运行仓库已有的 lint、typecheck、test 和 build 命令。
- 测试未通过时不得声明任务完成。
- 未经用户明确要求，不执行 push、merge、部署或发布。
- 禁止使用 `git push --force`、`git reset --hard` 和 `git commit --no-verify`。

## Architecture rules

- Controller 只处理输入输出，核心业务规则放在 Service。
- 卡密、订单、席位和邀请任务状态只能通过业务服务修改。
- 数据库结构变更必须附带 Prisma migration。
- 外部邀请能力必须封装在 `InvitationExecutor` 接口后。
- 队列任务只传递任务 ID，不传递密码、Cookie、Token 或浏览器会话。
- 卡密核销、任务创建和席位预占必须支持幂等和并发控制。

## Security rules

- 不收集用户的 Google 密码、辅助邮箱或 2FA 密钥。
- 不得将母号密码、Cookie、Token、`.env` 或 Playwright storage state 提交到 Git。
- 卡密只保存安全哈希，不保存可直接使用的明文。
- 日志和界面中的用户邮箱必须脱敏。
- 测试只能使用虚构数据，不得使用真实用户或母号凭证。

## Definition of done

- 验收条件已满足。
- lint、类型检查、测试和构建通过。
- 新增逻辑具有相应测试。
- 数据库变更包含迁移与回滚说明。
- `git diff` 中不存在敏感信息和无关修改。
