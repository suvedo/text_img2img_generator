import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# 文件上传配置
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'outputs')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Flask配置
SECRET_KEY = 'your-secret-key-here'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB