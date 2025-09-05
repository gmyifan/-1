# 静态文件 Dockerfile - 直接使用 Nginx 托管
FROM nginx:1.25-alpine

# 复制所有静态文件到 Nginx 默认目录
COPY . /usr/share/nginx/html/

# 配置 Nginx：SPA 回退 + /api 反向代理到 backend:3001
RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  gzip on;\n\
  gzip_types text/plain application/javascript application/json text/css image/svg+xml;\n\
  \n\
  # API 反向代理到后端\n\
  location /api/ {\n\
    proxy_pass http://backend:3001/;\n\
    proxy_http_version 1.1;\n\
    proxy_set_header Host $$host;\n\
    proxy_set_header X-Real-IP $$remote_addr;\n\
    proxy_set_header X-Forwarded-For $$proxy_add_x_forwarded_for;\n\
    proxy_set_header X-Forwarded-Proto $$scheme;\n\
  }\n\
  \n\
  # 静态文件服务\n\
  location / {\n\
    try_files $$uri $$uri/ /index.html;\n\
  }\n\
  \n\
  # 缓存静态资源\n\
  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$$ {\n\
    expires 1y;\n\
    add_header Cache-Control "public, immutable";\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]