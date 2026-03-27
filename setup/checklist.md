# Checklist · 初始化验证清单

> 按顺序逐项确认，全部 ✅ 后框架即可正常使用。

---

## Phase 1 · 环境基础

- [ ] **运行 init.sh**
  ```bash
  bash setup/init.sh
  ```
  预期输出全部显示 ✅，无报错

- [ ] **`.specstory/history/` 目录已创建**
  ```bash
  ls .specstory/history/
  ```
  目录存在（可为空）

- [ ] **SpecStory CLI 已安装**
  ```bash
  specstory --version
  ```
  输出版本号，不报错

- [ ] **fswatch 已安装**
  ```bash
  fswatch --version
  ```
  输出版本号

- [ ] **`trigger.sh` 已在项目根目录**
  ```bash
  ls -la trigger.sh
  ```
  文件存在且有执行权限（`-rwxr-xr-x`）

---

## Phase 2 · SpecStory CLI 对话记录

- [ ] **使用 SpecStory CLI 手动记录一次对话**
  ```bash
  specstory save
  ```
  按提示完成，确认 `.specstory/history/` 出现新 `.md` 文件
  ```bash
  ls -lt .specstory/history/ | head -5
  ```

- [ ] **（可选）IDE 插件自动捕获**
  > Cursor 或 VS Code 中安装 SpecStory 插件可实现对话完成后自动写入，无需手动运行 `specstory save`
  - Cursor / VS Code → Extensions → 搜索 `SpecStory` → Install

---

## Phase 3 · 监听触发器

- [ ] **trigger.sh 可以正常启动**
  ```bash
  bash trigger.sh
  ```
  预期输出：
  ```
  👁️  RayPulse trigger.sh 启动
  等待 SpecStory 写入新对话文件...
  ```

- [ ] **端到端验证（触发器 + SpecStory 联动）**
  1. 保持 `bash trigger.sh` 运行
  2. 在 Cursor/VS Code 中发起一次 AI 对话
  3. 对话完成后，trigger.sh 应输出类似：
     ```
     📄 新对话文件: .specstory/history/2026-03-27_152305.md
     ✅ Stage 1: 已记录 2026-03-27_152305.md
     ```

---

## Phase 4 · 框架分支选择

- [ ] **用 `rp` 工具新建项目**

  | 场景 | 执行命令 |
  |------|---------|
  | 知识整理 / 策略规划 | `rp init pro <项目名>` |
  | 内容创作 / 公众号 | `rp init content <项目名>` |
  | 工程开发 / 代码 | `rp init dev <项目名>` |
  | 系统运维 | `rp init ops <项目名>` |

  常用都存在 `~/.local/bin/rp`，运行 `rp list` 查看分支列表

---

## 可选 · Stage 2 预检（Mem0 升级前）

> 当前不需要，数据积累 > 100 条对话后再执行

- [ ] **配置环境变量**
  ```bash
  cp .env.example .env
  # 编辑 .env 填写 DEEPSEEK_API_KEY
  ```

- [ ] **验证 DeepSeek API 可用**
  ```bash
  curl https://api.deepseek.com/v1/models \
    -H "Authorization: Bearer $DEEPSEEK_API_KEY" | head -20
  ```

---

## 状态总结

> 完成 Phase 1~3 = **Stage 1 · 对话日志自动落盘** ✅
> 完成 Phase 4 = **分支工作区配置** ✅
> 完成可选部分 = **准备好升级到 Stage 2** ✅
