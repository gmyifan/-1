# 使用 Nginx 直接托管静态文件（simple-exam 为纯静态项目）
FROM nginx:1.25-alpine

# 拷贝站点静态文件
COPY . /usr/share/nginx/html/

# 覆盖默认站点配置（含 /api 反代与 SPA 回退）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx","-g","daemon off;"]