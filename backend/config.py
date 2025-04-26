import os
import requests
import socket

from utils.random_util import generate_random_str

def get_public_ip():
    """
    获取公网IPv4地址，使用多个备选API
    """
    ip_apis = [
        "https://api4.ipify.org",  # 专门用于IPv4的API
        "https://v4.ident.me",     # 专门用于IPv4的API
        "https://ipv4.icanhazip.com",
        "https://ip4.seeip.org"
    ]
    
    headers = {
        "Accept": "text/plain",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    
    for api in ip_apis:
        try:
            response = requests.get(api, headers=headers, timeout=5)
            if response.status_code == 200:
                ip = response.text.strip()
                # 验证返回的是否为有效的IPv4地址
                if is_valid_ipv4(ip):
                    return ip
        except requests.exceptions.RequestException:
            continue
            
    # 如果所有API都失败，尝试使用socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # AF_INET专门用于IPv4
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        if is_valid_ipv4(local_ip):
            return local_ip
    except Exception as e:
        print(f"获取IP地址失败: {e}")
    return None

def is_valid_ipv4(ip):
    """
    验证IP地址是否为有效的IPv4地址
    """
    try:
        parts = ip.split('.')
        return len(parts) == 4 and all(0 <= int(part) <= 255 for part in parts)
    except (AttributeError, TypeError, ValueError):
        return False

IP = get_public_ip()
if not IP:
    raise RuntimeError("无法获取公网 IP，程序终止。")
else:
    print(f"当前公网IP: {IP}")

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# 文件上传配置
UPLOAD_FOLDER = 'uploads' #os.path.join(BASE_DIR, 'uploads')
OUTPUT_FOLDER = 'static/outputs' #os.path.join(BASE_DIR, 'static/outputs')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

# Flask配置
SECRET_KEY = generate_random_str(24)
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# Database configuration
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:12345678@localhost/text_img2img_generator'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# 小于KOLORS_OR_GPT_THRES时，使用Kolors Huggingface Space，否则使用GPT
KOLORS_OR_GPT_THRES = 1.1

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
        False
    ]
}
KOLORS_HF_GEN_IMG_PAYLOAD_URL = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/file={path}"
KOLORS_HF_GET_IMG_URL = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/queue/data?session_hash={session_hash}"
KOLORS_RES_FILE_PREFIX = "TYPE1"

# yunfan的gpt的配置
GPT_GEN_IMG_URL = "https://yunfan-ye68--image-server-fastapi-app.modal.run/create_image"
GPT_GEN_IMG_TEST = False
GPT_GET_IMG_URL = "https://yunfan-ye68--image-server-fastapi-app.modal.run/images/{image_id}"
GPT_RES_FILE_PREFIX = "TYPE2"


# wechat pay configs
WECHAT_PAY_NATIVE_DNS = "https://api.mch.weixin.qq.com"
WECHAT_PAY_NATIVE_PATH = "/v3/pay/transactions/native"
WECHAT_PAY_APPID = "wxd89feb871d5d61fd" # 公众账号ID
WECHAT_PAY_MCHID = "1713859721" # 商户号
WECHAT_PAY_DISCRIPTION = "Image Creation" # 商品描述
WECHAT_PAY_NOTIFY_URL = "http://"+IP+":8000/wechat_pay_callback" #"https://www.weixin.qq.com/wxpay/pay.php"
# WECHAT_PAY_AMOUNT = "1-CNY"  # 金额单位为：分
WECHAT_PAY_PEM_PATH = "third_party/apiclient_key.pem"  # 商户私钥文件路径
WECHAT_PAY_API_PW = "FfVhDnkT58vfCFH1nLvQ2jJxbvAM6jdf" # 商户APIv3密钥
WECHAT_PAY_API_SERIAL_NO = "5BC778FEBC348BB92F28D1CB0EA61E1B46D85E8D"  # 商户API证书序列号
WECHAT_PAY_PLATFORM_PEM_PATH = "third_party/wechatpay.pem"  # 平台证书路径
WECHAT_PAY_SERIAL_NO = "73549CB41CF2F2933DD2224EF6C2592868BE5F92"  # 平台证书序列号
WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH = "./third_party/wxp_pub.pem"  # 平台证书公钥路径
