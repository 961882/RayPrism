#!/bin/bash
# trigger.sh — 监听 .specstory/history/ 新文件，自动触发处理
# 用法: bash trigger.sh
#
# Stage 1（当前）: 仅记录新文件，不调用 Mem0
# Stage 2（升级后）: 取消注释 Mem0 提炼部分

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

WATCH_DIR=".specstory/history"
DAILY_DIR="daily"
LOG_FILE=".specstory/trigger.log"

mkdir -p "$WATCH_DIR" "$DAILY_DIR"

echo ""
echo "👁️  RayPulse trigger.sh 启动"
echo "================================"
echo "📂 监听目录: $PROJECT_ROOT/$WATCH_DIR"
echo "📋 日报目录: $PROJECT_ROOT/$DAILY_DIR"
echo "📝 日志文件: $PROJECT_ROOT/$LOG_FILE"
echo ""
echo "等待 SpecStory 写入新对话文件..."
echo "（使用 Ctrl+C 停止）"
echo ""

TODAY=$(date +%Y-%m-%d)

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

fswatch -0 "$WATCH_DIR" | while IFS= read -r -d '' file; do
    # 只处理 .md 文件
    [[ "$file" != *.md ]] && continue
    # 忽略 trigger.log
    [[ "$file" == *trigger.log ]] && continue

    log "📄 新对话文件: $file"

    # ── Stage 1: 记录到日志（当前生效）──────────────────────────────────────
    FILENAME=$(basename "$file")
    log "   ✅ Stage 1: 已记录 $FILENAME"

    # ── Stage 2: Mem0 提炼（启用时取消注释）──────────────────────────────────
    # if [[ -f ".env" ]]; then
    #     source .env
    # fi
    #
    # # 根据 LLM_PROVIDER 选择对应的 API Key
    # case "${LLM_PROVIDER:-openai}" in
    #   openai)      ACTIVE_KEY="$OPENAI_API_KEY" ;;
    #   deepseek)    ACTIVE_KEY="$DEEPSEEK_API_KEY" ;;
    #   claude)      ACTIVE_KEY="$ANTHROPIC_API_KEY" ;;
    #   openrouter)  ACTIVE_KEY="$OPENROUTER_API_KEY" ;;
    #   local)       ACTIVE_KEY="local" ;;        # 本地模型无需 Key
    #   *)           ACTIVE_KEY="" ;;
    # esac
    #
    # if [[ -n "$ACTIVE_KEY" ]]; then
    #     python3 raypulse-mem0/ingest.py "$file"
    #     log "   🧠 Stage 2: Mem0 提炼完成 (provider: ${LLM_PROVIDER:-openai})"
    # else
    #     log "   ⚠️  Stage 2 跳过: 请在 .env 中配置 LLM_PROVIDER 和对应 API Key"
    # fi

    # ── 自动日报（每天首次触发时生成）───────────────────────────────────────
    NEW_TODAY=$(date +%Y-%m-%d)
    if [[ "$NEW_TODAY" != "$TODAY" ]] || [[ ! -f "$DAILY_DIR/$NEW_TODAY.md" ]]; then
        TODAY=$NEW_TODAY
        log "   📋 生成日报: $DAILY_DIR/$TODAY.md"
        {
            echo "# $TODAY 自动日报"
            echo ""
            echo "> 由 trigger.sh 自动生成"
            echo ""
            echo "## 今日对话文件"
            echo ""
            find "$WATCH_DIR" -name "${TODAY}*.md" -newer "$DAILY_DIR/.last_report" 2>/dev/null \
                | while read -r f; do echo "- \`$(basename "$f")\`"; done
            echo ""
            echo "---"
            echo "> Stage 2 启用后将自动追加 Mem0 提炼的记忆条目"
        } > "$DAILY_DIR/$TODAY.md"
        touch "$DAILY_DIR/.last_report"
        log "   ✅ 日报已生成"
    fi

done
