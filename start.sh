#!/bin/bash

#python3 main.py ./data/input_images/test_ip.jpg "穿着黑色T恤衫，上面中文绿色大字写着“可图”"
# nohup python3 app.py > log.txt 2>&1 &
nohup python3 app.py > /dev/null 2>&1 &

# 等待服务启动
sleep 5

# 检查服务是否启动成功
pids=$(ps aux | grep -E "python3 app.py" | grep -v grep | awk '{print $2}')

if [ -z "$pids" ]; then
    echo "Service failed to start."
else
    echo "Service started successfully with PID(s): $pids"
fi
