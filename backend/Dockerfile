# 使用 Node.js 18 Alpine 镜像
FROM node:18-alpine

# 安装构建工具（某些 npm 包可能需要）
RUN apk add --no-cache git python3 make g++

# 设置工作目录
WORKDIR /app

# 使用国内源并提高容错；关闭无关检查，加大超时
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

# 仅复制包清单以加速安装（backend 目录内）
COPY package*.json ./

# 尝试 npm ci；失败则回退到 npm install（兼容缺锁文件/冲突）
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps

# 复制后端源码
COPY . .

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]