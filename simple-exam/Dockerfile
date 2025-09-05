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

# 先仅拷贝依赖清单，最大化缓存命中
COPY package*.json ./

# 简化安装：直接使用 npm install，避免 ci 的严格要求
RUN npm install || npm install --legacy-peer-deps

# 再拷贝源码并构建
COPY . .
RUN npm run build || npm run build:prod || npm run build:release

# -------- Runtime stage (Nginx) --------
FROM nginx:1.25-alpine

# 兼容不同构建目录（Vite: dist；CRA: build）
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY --from=builder /app/build/ /usr/share/nginx/html/

# SPA 回退 + /api 反代到 backend:3001
RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  gzip on;\n\
  gzip_types text/plain application/javascript application/json text/css image/svg+xml;\n\
  location /api/ {\n\
    proxy_pass http://backend:3001/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Host $$host;\n\
    proxy_set_header X-Real-IP $$remote_addr;\n\
    proxy_set_header X-Forwarded-For $$proxy_add_x_forwarded_for;\n\
  }\n\
  location / {\n\
    try_files $$uri /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx","-g","daemon off;"]