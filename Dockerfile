# 使用官方 Node.js lst 镜像作为基础镜像
FROM node:20.14.0-alpine3.19

# 设置工作目录
WORKDIR /usr/src/app

# 将 package.json 和 pnpm-lock.yaml 复制到工作目录
COPY package.json pnpm-lock.yaml ./

# 先通过 npm 安装 pnpm
RUN npm install -g pnpm

# 然后使用 pnpm 安装依赖
RUN pnpm install --production

# 将 Dockerfile 所在目录下的所有文件和文件夹，例如app.js，复制到当前工作目录中
COPY . .

# 你的应用的端口号
EXPOSE 3000

# 在容器启动时运行你的应用
CMD [ "pnpm", "start" ]