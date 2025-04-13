import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
#from werkzeug.utils import secure_filename
import json
import traceback
import random

import kolors_hf_req
from log_util import logger

app = Flask(__name__)
app.config.from_pyfile('config.py')

# 确保上传和输出目录存在
os.makedirs(os.path.join(app.config['BASE_DIR'], app.config['UPLOAD_FOLDER']), exist_ok=True)
os.makedirs(os.path.join(app.config['BASE_DIR'], app.config['OUTPUT_FOLDER']), exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    try:
        request_id = kolors_hf_req.generate_random_str(16)
        logger.info(f"got request, request_id:{request_id}")
        # 处理图片上传
        if 'image' not in request.files:
            return jsonify(success=False, message="未上传图片")
        
        file = request.files['image']
        if file.filename == '':
            return jsonify(success=False, message="未选择文件")
        
        # 保存原始图片
        # filename = secure_filename(file.filename)
        # upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # file.save(upload_path)

        # upload image to hauggingface space
        upload_id = kolors_hf_req.generate_random_str(11)
        upload_hf_rsp = kolors_hf_req.upload_image_stream(request_id, app.config['KOLORS_HF_UPLOAD_IMG_URL'], file, upload_id)
        path = upload_hf_rsp.json()[0] if upload_hf_rsp.status_code == 200 else None

        if not path:
            return jsonify(success=False, message="upload image failed")

        # 获取文本内容
        text_content = request.form.get('text', '')
        if not text_content:
            return jsonify(success=False, message="no text content provided")
        
        logger.info(f"request_id:{request_id}, file_name:{file.filename}, text_content:{text_content}")
        
        session_hash = kolors_hf_req.generate_random_str(10)
        payload = app.config['KOLORS_HF_GEN_IMG_PAYLOAD']
        payload["session_hash"] = session_hash
        payload["data"][0]["orig_name"] = path.split("/")[-1]
        payload["data"][0]["path"] = path
        payload["data"][0]["url"] = app.config['KOLORS_HF_GEN_IMG_PAYLOAD_URL'].format(path=path)
        payload["data"][2] = text_content
        seed = random.randint(0, 999999)
        payload["data"][3] = seed

        logger.info(f"request_id:{request_id}, payload:{payload}")
        gen_img_rsp = kolors_hf_req.http_post(request_id, app.config['KOLORS_HF_GEN_IMG_URL'], payload)
        gen_img_url = None
        if gen_img_rsp:
            event_id = gen_img_rsp.get("event_id", None)
            if event_id:
                stream_url = app.config['KOLORS_HF_GET_IMG_URL'].format(session_hash=session_hash)
                chunks = kolors_hf_req.http_get_stream(request_id, stream_url)
                for chunk in chunks:
                    data = json.loads(chunk.split("data:")[1].strip())
                    if data:
                        if data.get("event_id", None) == event_id \
                            and data.get("success", False) \
                            and data.get("msg", None) == "process_completed":
                            gen_img_url = data["output"]["data"][0]
                            if gen_img_url:
                                gen_img_url = gen_img_url["url"]


        logger.info(f"request_id:{request_id}, gen_img_url:{gen_img_url}")
        if not gen_img_url:
            return jsonify(success=False, message="generate image failed, try it later")
        
        img_path = download_file_from_hf(request_id, file.filename, gen_img_url)
        if not img_path:
            return jsonify(success=False, message="generate image failed, try it later")
        
        return jsonify(
            success=True,
            img_path=img_path,
        )
        
    except Exception as e:
        logger.error(f"request_id:{request_id}, error:{traceback.format_exc()}")
        return jsonify(success=False, message=str(e))


def download_file_from_hf(request_id, upload_file_name, url):
    try:
        path = "-".join([
            upload_file_name,
            request_id,
            kolors_hf_req.generate_random_str(12),
            "gen_img."+url.split(".")[-1]
        ])
        kolors_hf_req.download_image(request_id, url, os.path.join(app.config['BASE_DIR'], app.config['OUTPUT_FOLDER'], path))
        return os.path.join(app.config['OUTPUT_FOLDER'], path)
    except Exception as e:
        logger.error(f"error:{traceback.format_exc()}")
        return None
                

# @app.route('/download', methods=['POST'])
# def download_file_from_hf():
#     # return send_from_directory(
#     #     app.config['OUTPUT_FOLDER'],
#     #     filename,
#     #     as_attachment=True
#     # )
#     try:
#         data = request.json
#         url = data['url']
#         path = kolors_hf_req.generate_random_str(12)+"_generated_image.jpg"
#         kolors_hf_req.download_image(url, os.path.join(app.config['BASE_DIR'], app.config['OUTPUT_FOLDER'], path))
        
#         return jsonify(success=True, img_url=os.path.join(app.config['OUTPUT_FOLDER'], path))
#     except Exception as e:
#         logger.error(f"error:{traceback.format_exc()}")
#         return jsonify(success=False, img_url="")


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000)