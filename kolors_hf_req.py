import requests
import json
from pathlib import Path
import random
import string

prompt =  """Full body shot of young Asian face woman in sun hat and white dress standing on sunny beach with sea and mountains in background, 
high quality, sharp focus,
"""


def generate_random_str(length=10):
    characters = string.ascii_lowercase + string.digits  # 定义字符集[8](@ref)
    return ''.join(random.choices(characters, k=length))  # 随机选择字符[4](@ref)


def http_post(url, payload):
    """
    发送HTTP POST请求
    :param url: 请求的URL
    :param payload: 请求的负载数据
    :return: 响应数据
    """
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # 检查响应状态
        return response.json()
    except requests.RequestException as e:
        print(f"HTTP请求失败: {str(e)}")
        return None
    
def http_get_stream(url, max_chunks=30):
    """
    发送HTTP GET请求并以流式方式接收数据
    :param url: 请求的URL
    :param max_chunks: 最大数据块数
    :return: 接收到的数据块列表
    """
    chunks = []
    with requests.get(url, stream=True, timeout=30) as response:  # 启用流式传输
        try:
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:  # 过滤空心跳包
                    chunk = chunk.decode()
                    chunks.append(chunk)
                    print("http stream 收到数据块:", chunk)
                    if len(chunks) >= max_chunks:
                        print("http stream 达到最大数据块数，停止接收")
                        break
        except requests.exceptions.ChunkedEncodingError:
            print("连接中断，尝试重连...")

    return chunks


def download_image(url: str, save_path: str = "downloaded_image.jpg"):
    """
    通过图片URL下载图片到本地
    参数：
        url (str): 图片的HTTP/HTTPS地址
        save_path (str): 本地保存路径，默认为当前目录的downloaded_image.jpg
    """
    try:
        # 发送HTTP请求（支持HTTPS）
        response = requests.get(url, stream=True, timeout=10)
        response.raise_for_status()  # 检查HTTP状态码
        
        # 创建保存目录（如果不存在）
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        
        # 写入文件
        with open(save_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        print(f"图片已保存至：{save_path}")
        
    except requests.exceptions.RequestException as e:
        print(f"下载失败：{str(e)}")
    except IOError as e:
        print(f"文件写入错误：{str(e)}")


# 使用示例
if __name__ == "__main__":

    # session_hash = "jmrk72fki1" 
    session_hash = generate_random_str(10)
    print("session_hash:", session_hash)

    post_url = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/queue/join?__theme=system"
    # payload = {
    #     "event_data": None,
    #     "fn_index": 5,
    #     "session_hash": session_hash,
    #     "trigger_id": 30,
    #     "data": [
    #         {
    #             "meta" : {"_type": "gradio.FileData"},
    #             "mime_type": "image/jpeg",
    #             "orig_name": "test_ip.jpg",
    #             "path" : "/tmp/gradio/320dc4e421d97dc846504e24c297899c30e20f58b4205de1c3e9667696fa980f/test_ip.jpg",
    #             "size" : 683684,
    #             "url": "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/file=/tmp/gradio/320dc4e421d97dc846504e24c297899c30e20f58b4205de1c3e9667696fa980f/test_ip.jpg"
    #         },
    #         None,
    #         prompt,
    #         0,
    #         True
    #     ]
    # }

    payload = {
        "event_data": None,
        "fn_index": 5,
        "session_hash": session_hash,
        "trigger_id": 30,
        "data": [
            {
                "meta" : {"_type": "gradio.FileData"},
                "mime_type": "image/jpeg",
                "orig_name": "test_ip.jpg",
                "path" : "/tmp/gradio/320dc4e421d97dc846504e24c297899c30e20f58b4205de1c3e9667696fa980f/test_ip.jpg",
                "size" : 683684,
                "url": "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/file=/tmp/gradio/320dc4e421d97dc846504e24c297899c30e20f58b4205de1c3e9667696fa980f/test_ip.jpg"
            },
            None,
            prompt,
            0,
            True
        ]
    }

    post_res = http_post(post_url, payload)
    print("POST请求结果:", post_res)

    gen_img_url = None
    if post_res:
        event_id = post_res.get("event_id", None)
        if event_id:
            stream_url = "https://kwai-kolors-kolors-portrait-with-flux.hf.space/gradio_api/queue/data?session_hash=" + session_hash
            chunks = http_get_stream(stream_url)
            for chunk in chunks:
                data = json.loads(chunk.split("data:")[1].strip())
                if data:
                    if data.get("event_id", None) == event_id \
                        and data.get("msg", None) == "process_completed":
                        gen_img_url = data["output"]["data"][0]
                        if gen_img_url:
                            gen_img_url = gen_img_url["url"]

    if gen_img_url:
        print("生成的图像URL:", gen_img_url)
        download_image(gen_img_url, "generated_image.jpg")
    else:   
        print("未找到生成的图像URL")