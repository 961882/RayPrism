#!/bin/bash
# rp — RayPrism 项目初始化工具
#
# 用法:
#   rp init <branch> <project-name> [--path /custom/dir]
#   rp list
#   rp projects
#   rp unregister <project-name>
#   rp status
#   rp upgrade
#
# 分支: pro | ink | dev | ops

set -e

# ─── 路径解析 ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")")" && pwd)"
RAYPRISM_HOME="$(cd "$SCRIPT_DIR/.." && pwd)"
BRANCHES_DIR="$RAYPRISM_HOME/branches"
DEFAULT_PROJECTS_DIR="$HOME/Projects"
REGISTRY_DIR="$HOME/.rayprism"
REGISTRY_FILE="$REGISTRY_DIR/registry.json"

# ─── 颜色 ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
log_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ─── 分支元数据 ──────────────────────────────────────────────────────
branch_desc() {
    case "$1" in
        pro)     echo "专业文档 / 策略规划 / 分析报告" ;;
        ink)     echo "内容创作 / 公众号 / 社媒运营" ;;
        dev)     echo "软件开发 / 代码 / 架构设计" ;;
        ops)     echo "运维 / 自动化 / 系统管理" ;;
        *)       echo "未知分支" ;;
    esac
}

# 各分支专属的 workspace 子目录
branch_workspace_dirs() {
    case "$1" in
        pro)     echo "reports strategy analysis drafts references" ;;
        ink)     echo "drafts published assets scheduled archive" ;;
        dev)     echo "src docs tests artifacts experiments" ;;
        ops)     echo "scripts configs runbooks logs incidents" ;;
        *)       echo "drafts output assets logs" ;;
    esac
}

# ─── 注册表操作 ───────────────────────────────────────────────────────

_ensure_registry() {
    mkdir -p "$REGISTRY_DIR"
    if [[ ! -f "$REGISTRY_FILE" ]]; then
        echo '{"projects":[]}' > "$REGISTRY_FILE"
    fi
}

_register_project() {
    local name="$1" branch="$2" path="$3" source="$4" version="$5"
    _ensure_registry

    # 用 python3 追加项目到注册表（去重：同名覆盖）
    python3 -c "
import json, sys
reg = json.load(open('$REGISTRY_FILE'))
projects = [p for p in reg['projects'] if p['name'] != '$name']
projects.append({
    'name': '$name',
    'branch': '$branch',
    'path': '$path',
    'source': '$source',
    'template_version': '$version',
    'created': '$(date -u +%Y-%m-%dT%H:%M:%SZ)'
})
reg['projects'] = projects
json.dump(reg, open('$REGISTRY_FILE', 'w'), indent=2, ensure_ascii=False)
"
}

_unregister_project() {
    local name="$1"
    _ensure_registry

    python3 -c "
import json
reg = json.load(open('$REGISTRY_FILE'))
before = len(reg['projects'])
reg['projects'] = [p for p in reg['projects'] if p['name'] != '$name']
after = len(reg['projects'])
json.dump(reg, open('$REGISTRY_FILE', 'w'), indent=2, ensure_ascii=False)
if before == after:
    print('NOT_FOUND')
else:
    print('OK')
"
}

# ─── CMD: list ───────────────────────────────────────────────────────
cmd_list() {
    echo ""
    echo -e "${BOLD}📦 RayPrism 可用分支${NC}"
    echo "══════════════════════════════════"
    for b in pro ink dev ops; do
        local ver="?"
        [[ -f "$BRANCHES_DIR/$b/VERSION" ]] && ver=$(cat "$BRANCHES_DIR/$b/VERSION" | tr -d '[:space:]')
        if [[ -d "$BRANCHES_DIR/$b" ]]; then
            echo -e "  ${GREEN}●${NC} ${BOLD}$b${NC} ${DIM}v${ver}${NC}   $(branch_desc $b)"
        else
            echo -e "  ${YELLOW}○${NC} $b   (分支目录未找到)"
        fi
    done
    echo ""
    echo "用法: rp init <branch> <project-name>"
    echo ""
}

# ─── CMD: projects ───────────────────────────────────────────────────
cmd_projects() {
    _ensure_registry

    local count
    count=$(python3 -c "import json; print(len(json.load(open('$REGISTRY_FILE'))['projects']))")

    if [[ "$count" == "0" ]]; then
        echo ""
        echo -e "${YELLOW}暂无已注册的项目${NC}"
        echo "运行 rp init <branch> <name> 创建第一个项目"
        echo ""
        return
    fi

    echo ""
    echo -e "${BOLD}📋 RayPrism 已注册项目 ($count)${NC}"
    echo "══════════════════════════════════════════════════════"

    python3 -c "
import json, os
reg = json.load(open('$REGISTRY_FILE'))
for p in reg['projects']:
    alive = '${GREEN}●${NC}' if os.path.isdir(p['path']) else '${RED}○${NC}'
    ver = p.get('template_version', '?')
    print(f'  {alive} {p[\"name\"]:20s} {p[\"branch\"]:8s} v{ver:6s} {p[\"path\"]}')
"
    echo ""
}

# ─── CMD: unregister ─────────────────────────────────────────────────
cmd_unregister() {
    local name="$1"
    [[ -z "$name" ]] && log_err "用法: rp unregister <project-name>"

    local result
    result=$(_unregister_project "$name")
    if [[ "$result" == "OK" ]]; then
        log_ok "已从注册表移除: $name"
    else
        log_warn "注册表中未找到: $name"
    fi
}

# ─── CMD: status ─────────────────────────────────────────────────────
cmd_status() {
    [[ ! -f ".rayprism.json" ]] && log_err "当前目录不是 RayPrism 项目（缺少 .rayprism.json）"

    echo ""
    echo -e "${BOLD}📋 RayPrism 项目信息${NC}"
    echo "══════════════════════════════════"
    python3 -c "
import json, sys
d = json.load(open('.rayprism.json'))
print(f\"  项目名称 : {d.get('name','?')}\")
print(f\"  分支类型 : {d.get('branch','?')}\")
print(f\"  框架来源 : {d.get('source','?')}\")
print(f\"  模板版本 : {d.get('template_version','?')}\")
print(f\"  创建时间 : {d.get('created','?')}\")
"

    # 版本对比
    local source_dir branch current_ver latest_ver
    source_dir=$(python3 -c "import json; print(json.load(open('.rayprism.json'))['source'])")
    branch=$(python3 -c "import json; print(json.load(open('.rayprism.json'))['branch'])")
    current_ver=$(python3 -c "import json; print(json.load(open('.rayprism.json')).get('template_version','?'))")
    latest_ver="?"
    [[ -f "$source_dir/VERSION" ]] && latest_ver=$(cat "$source_dir/VERSION" | tr -d '[:space:]')

    echo ""
    if [[ "$current_ver" == "$latest_ver" ]]; then
        echo -e "  ${GREEN}模板版本 : v${current_ver} ✅ 已是最新${NC}"
    else
        echo -e "  ${YELLOW}模板版本 : v${current_ver} → v${latest_ver} (可运行 rp upgrade)${NC}"
    fi

    echo ""
    if [[ -L "framework" ]]; then
        target=$(readlink "framework")
        echo -e "  ${GREEN}framework/${NC} → $target"
    else
        echo -e "  ${YELLOW}framework/${NC} (非符号链接，升级无效)"
    fi

    # overrides 状态
    if [[ -d "overrides" ]]; then
        local rule_count skill_count
        rule_count=$(find overrides/rules -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
        skill_count=$(find overrides/skills -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
        echo -e "  ${CYAN}overrides/${NC}  规则: ${rule_count}, Skills: ${skill_count}"
    fi
    echo ""
}

# ─── CMD: upgrade ────────────────────────────────────────────────────
cmd_upgrade() {
    [[ ! -f ".rayprism.json" ]] && log_err "当前目录不是 RayPrism 项目（缺少 .rayprism.json）"

    local source_dir branch current_ver latest_ver
    source_dir=$(python3 -c "import json; print(json.load(open('.rayprism.json'))['source'])")
    branch=$(python3 -c "import json; print(json.load(open('.rayprism.json'))['branch'])")
    current_ver=$(python3 -c "import json; print(json.load(open('.rayprism.json')).get('template_version','?'))")
    latest_ver="?"
    [[ -f "$source_dir/VERSION" ]] && latest_ver=$(cat "$source_dir/VERSION" | tr -d '[:space:]')

    # 版本对比输出
    if [[ "$current_ver" == "$latest_ver" ]]; then
        log_info "模板已是最新版本: v${current_ver}"
    else
        log_info "版本变更: v${current_ver} → v${latest_ver}"
    fi

    # 重新链接 framework/
    log_info "重新链接 framework → $source_dir"
    rm -f framework
    ln -s "$source_dir" framework

    # 重新链接隐藏目录（合并模式）
    _link_hidden_dirs "$branch"

    # 更新 .rayprism.json 中的版本号
    python3 -c "
import json
d = json.load(open('.rayprism.json'))
d['template_version'] = '$latest_ver'
json.dump(d, open('.rayprism.json', 'w'), indent=2, ensure_ascii=False)
"
    log_ok "模板版本已更新为 v${latest_ver}"

    # 更新注册表
    local name
    name=$(python3 -c "import json; print(json.load(open('.rayprism.json'))['name'])")
    _register_project "$name" "$branch" "$(pwd)" "$source_dir" "$latest_ver"

    log_ok "框架已更新至最新版本"
}

# ─── 内部: 链接 .agents/ .claude/ 等（逐文件合并模式）──────────────────
_link_hidden_dirs() {
    local branch="$1"
    local branch_dir="$BRANCHES_DIR/$branch"

    # === .agents/skills/ 合并 ===
    if [[ -d "$branch_dir/.agents/skills" ]]; then
        mkdir -p .agents/skills

        # 清除旧的框架符号链接（保留本地目录）
        for link in .agents/skills/*; do
            [[ -L "$link" ]] && rm -f "$link"
        done

        # 链接框架 skills
        for skill_dir in "$branch_dir/.agents/skills"/*/; do
            [[ -d "$skill_dir" ]] || continue
            local skill_name
            skill_name=$(basename "$skill_dir")
            # 如果 overrides/skills/ 中有同名目录，本地优先（不链接框架版本）
            if [[ -d "overrides/skills/$skill_name" ]]; then
                # 本地覆盖优先，链接 overrides 版本
                ln -sf "../../overrides/skills/$skill_name" ".agents/skills/$skill_name"
                log_info "  skills/$skill_name → overrides/ (本地覆盖)"
            else
                ln -sf "$skill_dir" ".agents/skills/$skill_name"
            fi
        done

        # 链接 overrides/skills 中的额外 skills（框架中没有的）
        if [[ -d "overrides/skills" ]]; then
            for skill_dir in overrides/skills/*/; do
                [[ -d "$skill_dir" ]] || continue
                local skill_name
                skill_name=$(basename "$skill_dir")
                if [[ ! -L ".agents/skills/$skill_name" && ! -d ".agents/skills/$skill_name" ]]; then
                    ln -sf "../../overrides/skills/$skill_name" ".agents/skills/$skill_name"
                fi
            done
        fi

        log_ok "链接 .agents/skills/（框架 + 覆盖合并）"
    fi

    # === .claude/rules/ 合并 ===
    if [[ -d "$branch_dir/.claude/rules" ]]; then
        mkdir -p .claude/rules

        # 清除旧的框架符号链接
        for link in .claude/rules/*; do
            [[ -L "$link" ]] && rm -f "$link"
        done

        # 链接框架 rules
        for rule_file in "$branch_dir/.claude/rules"/*; do
            [[ -f "$rule_file" ]] || continue
            local rule_name
            rule_name=$(basename "$rule_file")
            # 如果 overrides/rules/ 中有同名文件，本地优先
            if [[ -f "overrides/rules/$rule_name" ]]; then
                ln -sf "../../overrides/rules/$rule_name" ".claude/rules/$rule_name"
                log_info "  rules/$rule_name → overrides/ (本地覆盖)"
            else
                ln -sf "$rule_file" ".claude/rules/$rule_name"
            fi
        done

        # 链接 overrides/rules 中的额外 rules
        if [[ -d "overrides/rules" ]]; then
            for rule_file in overrides/rules/*; do
                [[ -f "$rule_file" ]] || continue
                local rule_name
                rule_name=$(basename "$rule_file")
                if [[ ! -L ".claude/rules/$rule_name" && ! -f ".claude/rules/$rule_name" ]]; then
                    ln -sf "../../overrides/rules/$rule_name" ".claude/rules/$rule_name"
                fi
            done
        fi

        log_ok "链接 .claude/rules/（框架 + 覆盖合并）"
    fi
}

# ─── 内部: 生成根目录 AGENTS.md（wrapper，含只读声明）─────────────────
_write_agents_md() {
    local branch="$1"
    local project_name="$2"

    cat > AGENTS.md << EOF
# ${project_name} · AGENTS.md

> 本文件由 \`rp init\` 自动生成，适用于 Claude Code / Cursor / Gemini CLI 等 AI 工具。

## ⚠️ 框架只读声明（最高优先级）

\`framework/\` 目录是从 RayPrism \`${branch}\` 分支拉取的只读框架，  
**禁止修改 \`framework/\` 下的任何文件**。框架升级请运行 \`rp upgrade\`。

## 📂 产出目录约束

所有 AI 产出、生成内容、中间文件，**必须写入 \`workspace/\` 目录**，  
不得在项目根目录随意创建文件。

\`\`\`
workspace/
$(for d in $(branch_workspace_dirs $branch); do echo "├── $d/"; done)
\`\`\`

## 🔧 自定义扩展

项目级规则放在 \`overrides/\` 目录：

- \`overrides/rules/*.md\` — 追加行为约束（自动合并到 .claude/rules/）
- \`overrides/skills/\` — 项目专属 Skills（自动合并到 .agents/skills/）
- 同名文件/目录会覆盖框架版本（本地优先）

## 📋 分支规则

本项目使用 **${branch}** 分支规则，详见：

\`\`\`
framework/AGENTS.md
\`\`\`

$(cat "$BRANCHES_DIR/$branch/AGENTS.md" 2>/dev/null | grep -v '^# ' | head -60)
EOF
    log_ok "AGENTS.md 已生成（含只读声明 + 覆盖说明 + 框架规则）"
}

# ─── CMD: init ───────────────────────────────────────────────────────
cmd_init() {
    local branch="$1"
    local project_name="$2"
    local project_path="$3"


    # 验证 branch
    [[ ! "$branch" =~ ^(pro|ink|dev|ops)$ ]] && \
        log_err "无效分支: '$branch'。可用: pro, ink, dev, ops"

    # 验证 branch 目录存在
    local branch_dir="$BRANCHES_DIR/$branch"
    [[ ! -d "$branch_dir" ]] && log_err "分支目录不存在: $branch_dir"

    # 确定项目路径
    [[ -z "$project_path" ]] && project_path="$DEFAULT_PROJECTS_DIR/$project_name"

    # 不允许覆盖已有目录
    [[ -d "$project_path" ]] && log_err "目录已存在: $project_path"

    # 读取模板版本号
    local template_ver="0.0.0"
    [[ -f "$branch_dir/VERSION" ]] && template_ver=$(cat "$branch_dir/VERSION" | tr -d '[:space:]')

    echo ""
    echo -e "${BOLD}🚀 RayPrism · 初始化新项目${NC}"
    echo "══════════════════════════════════"
    echo "  分支类型 : $branch  ($(branch_desc $branch))"
    echo "  项目名称 : $project_name"
    echo "  项目路径 : $project_path"
    echo "  框架来源 : $branch_dir"
    echo "  模板版本 : v${template_ver}"

    echo ""

    mkdir -p "$project_path"
    cd "$project_path"

    # ① framework/ 符号链接
    ln -s "$branch_dir" framework
    log_ok "framework/ → $branch_dir"

    # ② overrides/ 目录结构
    mkdir -p overrides/rules overrides/skills
    cat > overrides/README.md << 'OVERRIDES_EOF'
# overrides/ — 项目级自定义扩展

此目录用于添加项目特有的规则和 Skills，不影响框架模板。

## 使用方法

### 追加行为规则

在 `rules/` 下新建 `.md` 文件，会自动合并到 `.claude/rules/`：

```bash
# 新增一条项目专属规则
cat > overrides/rules/my-project-rule.md << 'EOF'
---
description: 项目专属规则
---
- 所有报告必须包含数据来源链接
- 代码注释使用中文
EOF
```

### 追加项目 Skills

在 `skills/` 下新建 skill 目录，会自动合并到 `.agents/skills/`：

```
overrides/skills/
└── my-custom-skill/
    └── SKILL.md
```

### 覆盖框架版本

如果本地文件与框架同名，本地版本优先（覆盖框架）。

### 生效方式

运行 `rp upgrade` 会重新合并框架 + overrides，自动生效。
OVERRIDES_EOF
    log_ok "overrides/ 目录结构已创建"

    # ③ 链接 .agents/ .claude/ 等 AI 工具配置（合并模式）
    _link_hidden_dirs "$branch"

    # ④ 链接 CLAUDE.md（如存在）
    if [[ -f "$branch_dir/CLAUDE.md" ]]; then
        ln -sf "framework/CLAUDE.md" "CLAUDE.md" && log_ok "链接 CLAUDE.md"
    fi

    # ⑤ workspace/ 目录结构（按分支定制）
    IFS=' ' read -ra dirs <<< "$(branch_workspace_dirs $branch)"
    for d in "${dirs[@]}"; do
        mkdir -p "workspace/$d"
    done
    log_ok "workspace/ 目录结构已创建"

    # ⑥ workspace/README.md（先组装表格再写入）
    local ws_table=""
    for d in "${dirs[@]}"; do
        local desc="—"
        case "$d" in
            reports)     desc="分析报告" ;;
            strategy)    desc="策略文档" ;;
            analysis)    desc="分析草稿" ;;
            drafts)      desc="草稿、初稿" ;;
            references)  desc="参考资料" ;;
            published)   desc="已发布内容" ;;
            assets)      desc="素材、图片" ;;
            scheduled)   desc="待发内容" ;;
            archive)     desc="历史归档" ;;
            src)         desc="源代码" ;;
            docs)        desc="文档" ;;
            tests)       desc="测试" ;;
            artifacts)   desc="构建产物" ;;
            experiments) desc="实验代码" ;;
            scripts)     desc="自动化脚本" ;;
            configs)     desc="配置文件" ;;
            runbooks)    desc="操作手册" ;;
            logs)        desc="日志记录" ;;
            incidents)   desc="故障记录" ;;
            output)      desc="最终产出" ;;
        esac
        ws_table+="| \`$d/\` | $desc |\n"
    done
    printf '# Workspace\n\n所有项目产出放在此目录，框架规则在 `../framework/`（只读）。\n\n| 目录 | 用途 |\n|------|------|\n%b' "$ws_table" > workspace/README.md
    log_ok "workspace/README.md 已生成"

    # ⑦ 根目录 AGENTS.md（wrapper）
    _write_agents_md "$branch" "$project_name"

    # ⑧ .rayprism.json 元信息
    cat > .rayprism.json << EOF
{
  "name": "$project_name",
  "branch": "$branch",
  "source": "$branch_dir",
  "rayprism_home": "$RAYPRISM_HOME",
  "template_version": "$template_ver",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    log_ok ".rayprism.json 元信息已写入（含模板版本 v${template_ver}）"

    # ⑨ .gitignore
    cat > .gitignore << 'EOF'
# 环境与系统
.env
.DS_Store

# 框架符号链接（不跟踪，由 rp upgrade 管理）
framework
.agents
.claude
CLAUDE.md

# 临时产出
workspace/logs/
workspace/incidents/
EOF
    log_ok ".gitignore 已创建"

    # ⑩ 注册到全局注册表
    _register_project "$project_name" "$branch" "$project_path" "$branch_dir" "$template_ver"
    log_ok "已注册到全局注册表 (~/.rayprism/registry.json)"

    # ⑪ 执行分支 post-init hook（如存在）
    if [[ -x "$branch_dir/post-init.sh" ]]; then
        log_info "执行 $branch post-init hook..."
        bash "$branch_dir/post-init.sh"
        log_ok "post-init hook 执行完成"
    fi



    echo ""
    echo "══════════════════════════════════"
    log_ok "项目初始化完成！"
    echo ""
    echo -e "  ${BOLD}下一步：${NC}"
    echo "  cd $project_path"
    echo "  用 Cursor / VS Code 打开即可"
    echo ""
    echo -e "  ${CYAN}产出路径${NC}   → workspace/"
    echo -e "  ${YELLOW}框架路径${NC}   → framework/（只读，请勿修改）"
    echo -e "  ${GREEN}自定义扩展${NC} → overrides/（添加项目专属规则/Skills）"
    echo ""
}

# ─── 主入口 ──────────────────────────────────────────────────────────
COMMAND="${1:-help}"
shift 2>/dev/null || true

case "$COMMAND" in
    init)
        _branch="${1:-}"
        _name="${2:-}"
        _path=""
        shift 2 2>/dev/null || true
        while [[ $# -gt 0 ]]; do
            case "$1" in
                --path) _path="$2"; shift 2 ;;
                *) shift ;;
            esac
        done
        [[ -z "$_branch" || -z "$_name" ]] && \
            log_err "用法: rp init <branch> <project-name> [--path /dir]"
        cmd_init "$_branch" "$_name" "$_path"
        ;;
    list)       cmd_list ;;
    projects)   cmd_projects ;;
    unregister)
        cmd_unregister "${1:-}"
        ;;
    status)     cmd_status ;;
    upgrade)    cmd_upgrade ;;
    help|--help|-h)
        echo ""
        echo -e "${BOLD}rp — RayPrism 项目工具${NC}"
        echo ""
        echo "命令："
        echo "  rp init <branch> <name> [--path /dir]            初始化新项目"
        echo "  rp list                                          列出可用分支"
        echo "  rp projects                                      列出所有已注册项目"
        echo "  rp unregister <name>                             从注册表移除项目"
        echo "  rp status                                        查看当前项目信息"
        echo "  rp upgrade                                       更新框架符号链接"
        echo ""
        echo "分支: pro | ink | dev | ops"
        echo ""
        echo "示例："
        echo "  rp init dev my-app"
        echo "  rp init ink my-blog --path ~/Work/my-blog"
        echo "  rp projects"
        echo ""
        ;;
    *)
        log_err "未知命令: '$COMMAND'。运行 rp help 查看帮助"
        ;;
esac
