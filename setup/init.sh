#!/bin/bash
# init.sh — RayPulse 框架一键初始化
# 用法: bash setup/init.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "🚀 RayPulse · 初始化开始"
echo "=============================="
echo "📁 项目根目录: $PROJECT_ROOT"
echo ""

# ─── 1. 创建 .specstory/history/ 目录 ───────────────────────────────────────
echo "① 创建 .specstory/history/ ..."
mkdir -p .specstory/history
echo "   ✅ .specstory/history/ 已就绪"

# ─── 2. 安装 SpecStory CLI（必装）────────────────────────────────────────────
echo ""
echo "② 检查 SpecStory CLI ..."
if command -v specstory &>/dev/null; then
    echo "   ✅ specstory 已安装 ($(specstory --version 2>/dev/null | head -1))"
else
    echo "   ⬇️  安装 SpecStory CLI ..."
    if command -v brew &>/dev/null; then
        brew install specstoryai/tap/specstory
        echo "   ✅ SpecStory CLI 安装完成"
    else
        echo "   ❌ 未找到 Homebrew，请手动安装: https://brew.sh"
        exit 1
    fi
fi

# ─── 3. 安装 SpecStory Agent Skills ──────────────────────────────────────────
echo ""
echo "③ 安装 SpecStory Agent Skills ..."
if command -v npx &>/dev/null; then
    npx skills add specstoryai/agent-skills
    echo "   ✅ specstoryai/agent-skills 安装完成"
else
    echo "   ❌ 未找到 npx，请先安装 Node.js: https://nodejs.org"
    echo "   安装后手动执行: npx skills add specstoryai/agent-skills"
fi

# ─── 4. 安装 fswatch ─────────────────────────────────────────────────────────
echo ""
echo "④ 检查 fswatch ..."
if command -v fswatch &>/dev/null; then
    echo "   ✅ fswatch 已安装 ($(fswatch --version 2>/dev/null | head -1))"
else
    echo "   ⬇️  安装 fswatch ..."
    if command -v brew &>/dev/null; then
        brew install fswatch
        echo "   ✅ fswatch 安装完成"
    else
        echo "   ❌ 未找到 Homebrew，请手动安装: https://brew.sh"
        exit 1
    fi
fi

# ─── 4. 复制 trigger.sh 到项目根 ─────────────────────────────────────────────
echo ""
echo "④ 部署 trigger.sh ..."
if [[ -f "trigger.sh" ]]; then
    echo "   ⚠️  trigger.sh 已存在，跳过（如需更新请手动替换）"
else
    cp setup/trigger.sh trigger.sh
    chmod +x trigger.sh
    echo "   ✅ trigger.sh 已复制到项目根目录"
fi

# ─── 5. 生成 .env.example ────────────────────────────────────────────────────
echo ""
echo "⑤ 生成 .env.example ..."
if [[ -f ".env.example" ]]; then
    echo "   ⚠️  .env.example 已存在，跳过"
else
    cat > .env.example << 'EOF'
# RayPulse 环境变量模板
# 复制为 .env 并填写真实值: cp .env.example .env

# ── LLM 提供商选择（Stage 2 Mem0 提炼）──
# 可选: openai | deepseek | claude | openrouter | local
LLM_PROVIDER=openai

# ── OpenAI ──
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# ── DeepSeek ──
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat

# ── Anthropic (Claude) ──
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# ── OpenRouter（通用中转，支持几乎所有模型）──
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini

# ── 本地模型（Ollama 等，兼容 OpenAI 接口）──
LOCAL_BASE_URL=http://localhost:11434/v1
LOCAL_MODEL=llama3

# ── Stage 3（Neo4j）启用时填写 ──
NEO4J_PASSWORD=your_neo4j_password_here
EOF
    echo "   ✅ .env.example 已生成"
fi

# ─── 6. 检查 .env ────────────────────────────────────────────────────────────
echo ""
echo "⑥ 检查 .env ..."
if [[ -f ".env" ]]; then
    echo "   ✅ .env 已存在"
else
    echo "   ℹ️  未找到 .env，Stage 2 启用前请执行:"
    echo "      cp .env.example .env"
fi

# ─── 7. 检查 .gitignore ──────────────────────────────────────────────────────
echo ""
echo "⑦ 检查 .gitignore ..."
if [[ -f ".gitignore" ]]; then
    if grep -q "\.env$" .gitignore 2>/dev/null; then
        echo "   ✅ .env 已在 .gitignore 中"
    else
        echo ".env" >> .gitignore
        echo "   ✅ 已将 .env 添加到 .gitignore"
    fi
else
    echo ".env" > .gitignore
    echo "   ✅ 已创建 .gitignore 并添加 .env"
fi

# ─── 完成 ─────────────────────────────────────────────────────────────────────
echo ""
echo "=============================="
echo "✅ 初始化完成！"
echo ""
echo "下一步："
echo "  1. 运行 trigger.sh 启动监听: bash trigger.sh"
echo "  2. 用 SpecStory CLI 记录对话: specstory save"
echo "  3. 按 setup/checklist.md 验证"
echo ""
echo "  💡 可选: 在 Cursor / VS Code 中安装 SpecStory 插件（自动捕获）"
echo ""
echo "详细说明: setup/README.md"
echo ""
