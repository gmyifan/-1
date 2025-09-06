# -------- Build stage --------
FROM node:18-slim AS builder
WORKDIR /app

# 使用国内源并提高容错
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FETCH_RETRIES=3 \
    NPM_CONFIG_FETCH_RETRY_FACTOR=2 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=60000 \
    CI=true

# 先拷贝依赖清单，提升缓存命中
COPY package*.json ./

# 安装依赖（ci 失败回退 install）
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# 拷贝源码并构建
COPY . .
RUN npm run build || npm run build:prod || npm run build:release

# -------- Runtime stage (Nginx) --------
FROM nginx:1.25-alpine

# 复制构建产物（兼容 Vite: dist 与 CRA: build）
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY --from=builder /app/build/ /usr/share/nginx/html/

# 覆盖默认站点配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx","-g","daemon off;"]