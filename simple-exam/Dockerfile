# -------- Build stage --------
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install
COPY . .
ENV CI=true
RUN npm run build || npm run build:prod || npm run build:release

# -------- Runtime stage (Nginx) --------
FROM nginx:1.25-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY --from=builder /app/build/ /usr/share/nginx/html/
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