# 开发契约规范 (dev-contract.md)

## CLI 契约

1. **Unix 惯例**
   - `--help` / `--version` 必须支持
   - stdout 正常输出，stderr 错误/日志

2. **Exit Code**
   - `0` 成功 · `1` 一般错误 · `2` 参数错误 · `3` 依赖缺失

## 测试规范

- 核心逻辑必须有单元测试覆盖
- 外部 API 用 mock 隔离
- 命名 `*.test.ts` / `*.spec.ts`
- 断言用 `expect`

## 代码风格

- TypeScript 优先，避免 `any`
- 函数式优先，副作用集中管理
- 不吞异常
- public API 必须有 JSDoc

## 依赖管理

- 新增依赖需说明理由
- 优先零依赖方案
- 锁文件必须提交
