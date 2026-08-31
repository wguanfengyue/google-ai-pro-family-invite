# Git 版本管理规范

## 分支

- `main`：稳定主分支，只接收经过验证的变更。
- `feat/<name>`：新功能，例如 `feat/redeem-flow`。
- `fix/<name>`：缺陷修复，例如 `fix/duplicate-redemption`。
- `test/<name>`：测试补充。
- `chore/<name>`：构建、依赖和 CI 调整。

## 提交信息

使用以下格式：

```text
<type>(<scope>): <summary>
```

示例：

```text
feat(invite): add family group allocation
fix(redeem): prevent duplicate card consumption
test(invite): cover last-slot concurrency
chore(ci): add pull request checks
```

## 版本号

采用语义化版本：`MAJOR.MINOR.PATCH`。

- `PATCH`：兼容性缺陷修复。
- `MINOR`：向后兼容的新功能。
- `MAJOR`：不兼容的重大变化。

MVP 阶段从 `v0.0.1` 开始，形成首个可演示闭环时发布 `v0.1.0`。

## 每个版本的发布步骤

1. 确认工作区没有意外修改：`git status`。
2. 运行 lint、类型检查、测试和构建。
3. 更新 `VERSION` 和必要的发布说明。
4. 创建提交：`git commit -m "chore(release): vX.Y.Z"`。
5. 创建带注释标签：`git tag -a vX.Y.Z -m "vX.Y.Z"`。
6. 推送分支和标签前再次检查提交内容。

## 回滚

- 已共享的提交使用 `git revert <commit>` 创建可审计的反向提交。
- 不使用 `git reset --hard` 修改已经共享的历史。
- 发布标签只指向验证通过的提交，不移动已有标签。
