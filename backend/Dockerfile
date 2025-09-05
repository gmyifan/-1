FROM node:18-alpine
WORKDIR /app

# 仅复制包清单以加速安装（backend 目录内）
COPY package*.json ./
RUN npm ci --omit=dev

# 复制后端源码
COPY . .

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["npm", "run", "start"]