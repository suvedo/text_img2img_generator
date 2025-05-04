#!/bin/bash

RESULT=$(netstat -tulnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1)
kill -9 $RESULT

# 检查 PID 文件是否存在
if [ ! -f "./tmp/next.pid" ]; then
    echo " PID file not found, service seems not to be running."
    exit 0
fi

# 读取 PID
PID=$(cat ./tmp/next.pid)

# 检查进程是否存在
if ps -p $PID > /dev/null; then
    echo "stopping Next.js service..."
    kill $PID
    rm ./tmp/next.pid
    echo "Next.js stopped successfully!"
else
    echo "Next.js not running"
    rm ./tmp/next.pid
fi