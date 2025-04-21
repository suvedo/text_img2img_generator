import os
from datetime import datetime
from flask import Flask, render_template, request, \
    jsonify, send_file, session, Blueprint
from flask_cors import CORS
#from werkzeug.utils import secure_filename
import json
import traceback
import random
import io
import asyncio

import third_party.kolors_hf_req as kolors_hf_req
import third_party.wechat_pay as wechat_pay
from utils.log_util import logger
from utils import random_util
from utils import qr_util
from database import payment_state_dao
from database.db_model import db
from account import user_account

app = Flask(__name__)
CORS(app, 
     resources={r"/api/*": {"origins": ["http://localhost:3000"], "supports_credentials": True}},
     allow_headers=["Content-Type"],
     expose_headers=["Access-Control-Allow-Origin"],
     methods=["GET", "POST", "OPTIONS"]
)

app.config.from_pyfile('config.py')

# 初始化数据库
db.init_app(app)

# 创建数据库表
with app.app_context():
    db.create_all()

# 确保上传和输出目录存在
os.makedirs(os.path.join(app.config['BASE_DIR'], app.config['UPLOAD_FOLDER']), exist_ok=True)
os.makedirs(os.path.join(app.config['BASE_DIR'], app.config['OUTPUT_FOLDER']), exist_ok=True)

# @app.route('/')
# def index():
#     is_logged_in = user_account.check_auth(random_util.generate_random_str(16), session)
#     user_email = session.get('email', '') if is_logged_in else ''
#     return render_template('index.html', 
#                          is_logged_in=is_logged_in,
#                          user_email=user_email)

@app.route('/api/process', methods=['POST'])
def process():
    request_id = random_util.generate_random_str(16)
    logger.info(f"got process request, request_id:{request_id}")
    auth = False
    
    try:
        # 从请求中获取用户信息
        user_data = json.loads(request.form.get('user', '{}'))
        # 将用户信息存入 session
        session['user'] = user_data
        
        if (not user_account.check_auth(request_id, session)):
            logger.info(f"request_id:{request_id}, user not login")
            return jsonify(success=False, isAuthenticated=auth, message="用户未登录")
        auth = True
    except Exception as e:
        logger.error(f"request_id:{request_id}, error:{traceback.format_exc()}")
        return jsonify(success=False, isAuthenticated=auth, message=str(e))
        
    logger.info(f"request_id:{request_id}, user:{session['user']}")
        
    try:
        # 处理图片上传
        if 'image' not in request.files:
            return jsonify(success=False, isAuthenticated=auth, message="未上传图片")
        
        file = request.files['image']
        if file.filename == '':
            return jsonify(success=False, isAuthenticated=auth, message="未选择文件")
        
        # 保存原始图片
        # filename = secure_filename(file.filename)
        # upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # file.save(upload_path)

        # upload image to hauggingface space
        upload_id = random_util.generate_random_str(11)
        upload_hf_rsp = kolors_hf_req.upload_image_stream(request_id, app.config['KOLORS_HF_UPLOAD_IMG_URL'], file, upload_id)
        path = upload_hf_rsp.json()[0] if upload_hf_rsp.status_code == 200 else None

        if not path:
            return jsonify(success=False, isAuthenticated=auth, message="upload image failed")

        # 获取文本内容
        text_content = request.form.get('text', '')
        if not text_content:
            return jsonify(success=False, isAuthenticated=auth, message="no text content provided")
        
        logger.info(f"request_id:{request_id}, file_name:{file.filename}, text_content:{text_content}")
        
        session_hash = random_util.generate_random_str(10)
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
            return jsonify(success=False, isAuthenticated=auth, message="generate image failed, try it later")
        
        img_path = download_file_from_hf(request_id, file.filename, gen_img_url)
        if not img_path:
            return jsonify(success=False, isAuthenticated=auth, message="generate image failed, try it later")
        
        return jsonify(
            success=True, 
            isAuthenticated=auth,
            img_path=img_path,
        )
        
    except Exception as e:
        logger.error(f"request_id:{request_id}, error:{traceback.format_exc()}")
        return jsonify(success=False, isAuthenticated=auth, message=str(e))


def download_file_from_hf(request_id, upload_file_name, url):
    try:
        path = "-".join([
            upload_file_name,
            request_id,
            random_util.generate_random_str(12),
            "gen_img."+url.split(".")[-1]
        ])
        kolors_hf_req.download_image(request_id, url, os.path.join(app.config['BASE_DIR'], app.config['OUTPUT_FOLDER'], path))
        return os.path.join(app.config['OUTPUT_FOLDER'], path)
    except Exception as e:
        logger.error(f"error:{traceback.format_exc()}")
        return None
                

@app.route('/get_pricing_qr')
def get_pricing_qr():
    try:
        request_id = random_util.generate_random_str(16)
        logger.info(f"got get_pricing_qr request, request_id:{request_id}")
        # 生成二维码内容
        user_id = "admin_user_id"
        order_type = "1" # 1
        out_trade_no = random_util.generate_random_str(16)
        qr_url = wechat_pay.get_code_url(request_id, user_id, order_type, out_trade_no, app.config) 
        # qr_content="weixin://wxpay/bizpayurl/up?pr=NwY5Mz9&groupid=00"
        logger.info(f"request_id:{request_id}, get_pricing_qr, qr_url:{qr_url}")
        if not qr_url:
            return jsonify(success=False, message="get wechat pay code fail"), 500

        # 将二维码保存到内存
        img = qr_util.gen_qr_img_from_url(qr_url)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        # 返回二维码图片
        # 设置响应头，包含订单参数
        response = send_file(buffer, mimetype='image/png')
        response.headers['X-Order-Id'] = out_trade_no
        response.headers['X-User-Id'] = user_id
        response.headers['X-Order-Type'] = order_type
        
        return response
    except Exception as e:
        logger.error(f"request_id:{request_id}, error:{traceback.format_exc()}")
        return jsonify(success=False, message=str(e)), 500


@app.route('/wechat_pay_callback', methods=['POST'])
async def wechat_pay_callback():
    try:
        request_id = random_util.generate_random_str(16)
        logger.info(f"got wechat_pay_callback request, request_id:{request_id}")
        
        # 微信支付回调验证
        if wechat_pay.verify_pay_callback(request_id, request.headers, request.get_json(), app.config):
            logger.info(f"request_id:{request_id}, wechat pay callback verify success")
            asyncio.create_task(process_wechat_pay_callback(request_id, request.headers, request.get_json(), app.config))
            # 异步返回成功响应
            return jsonify({
                "code": "200"
            })
        else:
            logger.error(f"request_id:{request_id}, verify pay callback failed")
            return jsonify({
                "code": "FAIL",
                "message": "验证失败"
            })
    except Exception as e:
        logger.error(f"request_id:{request_id}, error:{traceback.format_exc()}")
        return jsonify({
            "code": "FAIL",
            "message": "系统错误"
        })

async def process_wechat_pay_callback(request_id, headers, body, conf):
    """处理验证成功后的业务逻辑"""
    try:
        logger.info(f"request_id:{request_id}, start processing after verify")
        # 解密回调数据
        decrypted_ciphertext = wechat_pay.decrypt_pay_callback_ciphertext(request_id, headers, body, conf)
        logger.info(f"request_id:{request_id}, decrypted ciphertext:{decrypted_ciphertext}")
        cipher_json = json.loads(decrypted_ciphertext)
        if cipher_json.get("trade_state", "") != "SUCCESS":
            logger.info(f"request_id:{request_id}, payment failed")
            return
        logger.info(f"request_id:{request_id}, payment success")
        attatch_json = json.loads(cipher_json.get("attach", "{}"))
        user_id = attatch_json.get("user_id", None)
        order_type = attatch_json.get("order_type", None)
        out_trade_no = cipher_json.get("out_trade_no", None)
        if not user_id or not order_type or not out_trade_no:
            logger.error(f"request_id:{request_id}, invalid attach json:{attatch_json}")
            return
        
        payment_state_dao.set_payment_state(request_id, user_id, order_type, \
                                            out_trade_no, payment_state_dao.gen_paied_state(True))
        return
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in after process: {traceback.format_exc()}")


@app.route('/query_payment_status', methods=['POST'])
def query_payment_status():
    try:
        request_id = random_util.generate_random_str(16)
        data = request.get_json()
        user_id = data.get('user_id')
        order_type = data.get('order_type')
        out_trade_no = data.get('out_trade_no')
        
        # logger.info(f"request_id:{request_id}, got payment status request, " \
        #             f"user_id:{user_id}, order_type:{order_type}, out_trade_no:{out_trade_no}")
        
        st = payment_state_dao.get_payment_state(request_id, user_id, order_type, out_trade_no)
        if st is None:
            # logger.info(f"request_id:{request_id}, order_no:{out_trade_no} not found")
            return jsonify({'success': False, 'paid': False})
        
        if payment_state_dao.success_paid(st):
            logger.info(f"request_id:{request_id}, user_id:{user_id}, order_type:{order_type}, " \
                        f"out_trade_no:{out_trade_no} success paid")
            return jsonify({'success': True, 'paid': True})

        logger.info(f"request_id:{request_id}, user_id:{user_id}, order_type:{order_type}, " \
                    f"out_trade_no:{out_trade_no}, pay failed")
        return jsonify({
            'success': True,
            'paid': False  # 这里返回实际的支付状态
        })
    except Exception as e:
        logger.error(f"request_id:{request_id}, user_id:{user_id}, order_type:{order_type}, " \
                     f"out_trade_no:{out_trade_no}, error:{traceback.format_exc()}")
        return jsonify({'success': False, 'paid': False})


@app.route('/api/login', methods=['POST'])
def login():
    request_id = random_util.generate_random_str(16)
    logger.info(f"got login request, request_id:{request_id}")
    data = request.get_json()
    return user_account.login(request_id, data, session)

@app.route('/api/signup', methods=['POST'])
def signup():
    request_id = random_util.generate_random_str(16)
    logger.info(f"got signup request, request_id:{request_id}")
    data = request.get_json()
    return user_account.signup(request_id, data, session)

@app.route('/api/logout', methods=['POST'])
def logout():
    request_id = random_util.generate_random_str(16)
    logger.info(f"got logout request, request_id:{request_id}")
    return user_account.logout(request_id, session)


if __name__ == '__main__':
    # app.run(host="0.0.0.0", port=8000)
    from hypercorn.config import Config
    from hypercorn.asyncio import serve

    config = Config()
    config.bind = ["0.0.0.0:8000"]
    asyncio.run(serve(app, config))