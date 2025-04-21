import os
import uuid
import traceback
from requests_toolbelt.multipart.encoder import MultipartEncoder
import requests

from utils.log_util import logger

def gen_image(request_id, file_stream, prompt, conf, test=True):
    """生成图片
    Args:
        request_id: 请求ID
        file_stream: 文件流
        prompt: 提示词
        conf: 配置信息
        test: 是否为测试模式
    Returns:
        str: 生成的图片路径，失败返回 None
    """
    uuid_str = str(uuid.uuid4())
    
    boundary = "----WebKitFormBoundarydw2KMeqEtqkKPBBl"
    # 构造MultipartEncoder对象
    multipart_data = MultipartEncoder(
        fields={
            "image": (file_stream.filename, file_stream.stream, 'image/jpeg'),  # 使用文件流
            "text_query": prompt,  # 文本字段直接赋值
            "image_id": uuid_str,
            "test": str(test).lower()  # 将布尔值转换为小写字符串 'true' 或 'false'
        },
        boundary=boundary  # 显式指定boundary
    )
    
    url = conf['GPT_GEN_IMG_URL']
    headers = {
        "Content-Type": multipart_data.content_type,
    }

    try:
        response = requests.post(url, data=multipart_data, headers=headers)
    except Exception as e:
        logger.error(f"request_id:{request_id}, gpt gen image error:{traceback.format_exc()}")
        return None

    if response.status_code == 200:
        image_data = response.content
        gen_img_file_name = "-".join([
            conf['GPT_RES_FILE_PREFIX'],
            file_stream.filename.replace("-", "_"),
            request_id,
            uuid_str.replace("-", "_"),
            "gen_img.png"
        ])
        try:
            with open(os.path.join(conf['BASE_DIR'], conf['OUTPUT_FOLDER'], gen_img_file_name), "wb") as f:
                f.write(image_data)
        except Exception as e:
            logger.error(f"request_id:{request_id}, save image error:{traceback.format_exc()}")
            return None
    else:
        logger.error(f"request_id:{request_id}, gpt gen image error:{response.text}")
        return None

    logger.info(f"request_id:{request_id}, gpt gen image success, save to path:{os.path.join(conf['OUTPUT_FOLDER'], gen_img_file_name)}")

    return os.path.join(conf['OUTPUT_FOLDER'], gen_img_file_name)
