import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# 文件上传配置
UPLOAD_FOLDER = 'uploads' #os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = 'static/outputs' #os.path.join(BASE_DIR, 'static/outputs')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Flask配置
SECRET_KEY = 'your-secret-key-here'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# Kolors Huggingface Space配置
KOLORS_HF_UPLOAD_IMG_URL = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/upload" #?upload_id=" + upload_id
KOLORS_HF_GEN_IMG_URL = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/queue/join?__theme=system"
KOLORS_HF_GEN_IMG_PAYLOAD = {
    "event_data": None,
    "fn_index": 5,
    "session_hash": "",
    "trigger_id": 30,
    "data": [
        {
            "meta" : {"_type": "gradio.FileData"},
            "mime_type": "image/jpeg",
            "orig_name": "",
            "path" : "",
            "size" : 683684,
            "url": ""
        },
        None,
        "",
        0,
        True
    ]
}
KOLORS_HF_GEN_IMG_PAYLOAD_URL = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/file={path}"
KOLORS_HF_GET_IMG_URL = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/queue/data?session_hash={session_hash}" 