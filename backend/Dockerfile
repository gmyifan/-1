# 使用 Ubuntu 基础镜像（网络兼容性更好）
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 使用国内源并提高容错
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FETCH_RETRIES=3 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=60000

# 仅复制包清单以加速安装
COPY package*.json ./

# 简化安装：优先 npm install，避免 ci 的严格检查
RUN npm install --only=production --no-optional || npm install --only=production

# 复制后端源码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "start"]