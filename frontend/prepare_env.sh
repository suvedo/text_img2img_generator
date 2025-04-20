# 使用 nvm 管理 Node.js 版本（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18  # LTS 版本（Next.js 15 官方要求 ≥16.8）
nvm use 18

# 验证版本
node -v  # 应输出 v18.x.x 或更高

# 删除旧依赖和锁文件
rm -rf node_modules package-lock.json

# 重新安装（确保网络通畅）
npm install --force