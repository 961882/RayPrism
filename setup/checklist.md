# Checklist · 初始化验证清单

> 按顺序逐项确认，全部 ✅ 后框架即可正常使用。

---

## Phase 1 · 环境基础

- [ ] **Node.js ≥ 18 已安装**
  ```bash
  node -v
  ```
  预期输出 `v18.x.x` 或更高

- [ ] **rayprism 可用**
  ```bash
  npx rayprism help
  ```
  输出命令列表，无报错

---

## Phase 2 · 创建项目

- [ ] **选择分支并初始化**

  | 场景 | 执行命令 |
  |------|---------|
  | 知识整理 / 策略规划 | `npx rayprism init pro <项目名>` |
  | 内容创作 / 公众号 | `npx rayprism init content <项目名>` |
  | 工程开发 / 代码 | `npx rayprism init dev <项目名>` |
  | 系统运维 | `npx rayprism init ops <项目名>` |

- [ ] **项目目录结构正确**
  ```bash
  cd ~/Projects/<项目名>
  ls
  ```
  预期包含：`AGENTS.md`、`framework/`、`overrides/`、`workspace/`

- [ ] **framework/ 符号链接有效**
  ```bash
  readlink framework
  ls framework/VERSION
  ```
  能读取版本号，不报错

---

## Phase 3 · 验证 AI 工具配置

- [ ] **.agents/skills/ 链接正常**
  ```bash
  ls .agents/skills/
  ```
  显示分支自带的 Skills

- [ ] **.claude/rules/ 链接正常**
  ```bash
  ls .claude/rules/
  ```
  显示分支自带的规则文件

- [ ] **CLAUDE.md 链接正常**
  ```bash
  readlink CLAUDE.md
  ```
  预期：`framework/CLAUDE.md`

---

## Phase 4 · 项目管理

- [ ] **查看已注册项目**
  ```bash
  rayprism projects
  ```
  列出刚创建的项目，`●` 表示目录存在

- [ ] **查看项目状态**
  ```bash
  rayprism status
  ```
  显示项目信息和版本号

---

## 状态总结

> 完成 Phase 1~3 = **项目可正常使用** ✅
> 完成 Phase 4 = **项目管理功能验证** ✅
