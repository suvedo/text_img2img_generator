#!/bin/bash

# 查找进程名为 "python app.py" 或 "python3 app.py" 的进程并杀掉
pids=$(ps aux | grep -E "python(3)? app.py" | grep -v grep | awk '{print $2}')

if [ -z "$pids" ]; then
    echo "No process named 'python app.py' or 'python3 app.py' is running."
else
    echo "Killing processes with PIDs: $pids"
    echo "$pids" | xargs kill -9
    echo "Processes killed."
fi