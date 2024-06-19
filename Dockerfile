# 使用官方 Node.js 基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /usr/src/app

# 复制项目文件到工作目录
COPY . .

# 安装项目依赖
RUN npm install

# 清理构建过程中的缓存
RUN npm cache clean --force

# 暴露容器的端口
EXPOSE 3000

# 启动应用程序
CMD [ "npm", "start" ]