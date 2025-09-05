#!/usr/bin/env bash
set -euo pipefail

# 颜色输出
green() { printf "\\033[32m%s\\033[0m\\n" "$*"; }
red()   { printf "\\033[31m%s\\033[0m\\n" "$*"; }

green "[1/6] 安装基础工具与 Docker（若已安装会自动跳过）..."
if ! command -v curl >/dev/null 2>&1; then
  apt update -y && apt install -y curl ca-certificates git
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    green "检测到 docker-compose，继续使用"
  else
    red "未检测到 docker compose / docker-compose，请重新登录或手动安装后重试。"
    exit 1
  fi
fi

green "[2/6] 准备目录 /opt/project ..."
mkdir -p /opt
cd /opt

REPO_URL="${REPO_URL:-https://github.com/gmyifan/-1.git}"
if [ -d /opt/project/.git ]; then
  green "检测到已存在仓库，执行拉取更新..."
  cd /opt/project
  git pull --rebase || true
else
  green "克隆仓库：$REPO_URL"
  git clone "$REPO_URL" project
  cd /opt/project
fi

green "[3/6] 准备环境变量文件 .env ..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    sed -i 's/please-change-me-very-strong/'"$(openssl rand -hex 16 2>/dev/null || echo change-me)"'/' .env || true
  else
    echo "JWT_SECRET=$(openssl rand -hex 16 2>/dev/null || echo change-me)" > .env
  fi
fi

green "[4/6] 关闭旧容器（若存在）..."
docker compose down || true

green "[5/6] 构建镜像..."
docker compose build

green "[6/6] 启动服务..."
docker compose up -d

green "完成！请在浏览器访问：http://<你的公网IP>/"
green "维护命令："
echo "  docker compose ps"
echo "  docker compose logs -f web"
echo "  docker compose logs -f backend"
echo "  docker compose down"