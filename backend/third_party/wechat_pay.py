import requests
import time
import json
import base64
import hashlib
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import traceback
from datetime import datetime, timedelta, timezone

from utils.log_util import logger
from utils import random_util


def get_code_url(request_id, user_id, pay_amount, order_type, out_trade_no, conf):
    """
    获取微信支付的二维码链接
    :param request_id: 请求ID
    :param conf: 配置项
    :return: 二维码链接
    """
    try:
        amount_total = pay_amount #int(conf["WECHAT_PAY_AMOUNT"].split("-")[0])
        amount_currency = 'CNY' #conf["WECHAT_PAY_AMOUNT"].split("-")[1]
        attach_str = json.dumps({
                            "user_id": user_id,
                            "order_type": order_type
                        }, ensure_ascii=False)
        # 生成15分钟后的过期时间
        beijing_tz = timezone(timedelta(hours=8))  # 北京时区 UTC+8
        expire_time = datetime.now(beijing_tz) + timedelta(minutes=15)
        time_expire = expire_time.strftime('%Y-%m-%dT%H:%M:%S+08:00')
        payload = {
            "appid" : conf["WECHAT_PAY_APPID"],
            "mchid" : conf["WECHAT_PAY_MCHID"],
            "description" : conf["WECHAT_PAY_DISCRIPTION"],
            "out_trade_no" : out_trade_no,
            "attach" : attach_str,
            "notify_url" : conf["WECHAT_PAY_NOTIFY_URL"],
            "time_expire" : time_expire,
            "support_fapiao" : False,
            "amount" : {
                "total" : amount_total,
                "currency" : amount_currency
            }
        }
        payload_str = json.dumps(payload, ensure_ascii=False)
        payload_str = payload_str.replace(" ", "").replace("\n", "")
        logger.info(f"request_id:{request_id}, wechat pay payload str: {payload_str}")

        random_str = random_util.generate_random_str(16).upper()
        timestamp = str(int(time.time()))
        auth = 'WECHATPAY2-SHA256-RSA2048 ' + \
            'mchid="{mchid}",nonce_str="{nonce_str}",signature="{signature}",' + \
            'timestamp="{timestamp}",serial_no="{serial_no}"'
        auth = auth.format(mchid=conf["WECHAT_PAY_MCHID"], \
                           nonce_str=random_str, \
                            signature=get_auth(request_id, conf, payload_str, timestamp, random_str), \
                            timestamp=timestamp, \
                            serial_no=conf["WECHAT_PAY_API_SERIAL_NO"])
        if not auth:
            logger.error(f"request_id:{request_id}, failed to get wechat pay auth")
            return None
        
        logger.info(f"request_id:{request_id}, auth:{auth}")
        
        headers = {
            "Authorization": auth,
            "Accept" : "application/json",
            "Content-Type" : "application/json"
        }
        
        # 发送POST请求
        response = requests.post(conf["WECHAT_PAY_NATIVE_DNS"]+conf["WECHAT_PAY_NATIVE_PATH"], 
                                 headers=headers, data=payload_str)
        
        # 添加详细的错误信息日志
        if response.status_code != 200:
            logger.error(f"request_id:{request_id}, HTTP状态码: {response.status_code}")
            logger.error(f"request_id:{request_id}, 响应内容: {response.text}")

        response.raise_for_status()  # 检查HTTP状态码
        
        rsp_json = response.json()
        code_url = rsp_json["code_url"]
        logger.info(f"request_id:{request_id}, wechat pay code url: {code_url}")

        return code_url
        
    except requests.exceptions.RequestException as e:
        logger.error(f"request_id:{request_id}, 下载失败：{traceback.format_exc()}")
    except IOError as e:
        logger.error(f"request_id:{request_id}, 文件写入错误：{traceback.format_exc()}")

    return None


def get_auth(request_id, conf, payload_str, timestamp, random_str):
    """
    获取微信支付的认证信息
    :param request_id: 请求ID
    :param conf: 配置文件
    :return: 认证信息
    """
    
    method = "POST"
    abs_url = conf["WECHAT_PAY_NATIVE_PATH"]

    pem_str = '\n'.join([method, abs_url, timestamp, random_str, payload_str])
    pem_str += "\n"
    logger.info(f"request_id:{request_id}, wechat pay pem_str: {pem_str}")

    return sign_with_rsa(request_id, pem_str, conf["WECHAT_PAY_PEM_PATH"])


def sign_with_rsa(request_id, pem_str, private_key_path):
    """
    使用商户私钥对待签名串进行 SHA256 with RSA 签名，并返回 Base64 编码的签名值
    :param pem_str: 待签名串
    :param private_key_path: 商户私钥文件路径 (apiclient_key.pem)
    :return: Base64 编码的签名值
    """
    try:
        # 读取商户私钥
        with open(private_key_path, "rb") as key_file:
            private_key = load_pem_private_key(key_file.read(), password=None)

        # 对待签名串进行 SHA256 with RSA 签名
        signature = private_key.sign(
            pem_str.encode("utf-8"),  # 待签名串需要编码为字节
            padding.PKCS1v15(),      # 使用 PKCS#1 v1.5 填充
            hashes.SHA256()          # 使用 SHA256 哈希算法
        )

        # 对签名结果进行 Base64 编码
        signature_base64 = base64.b64encode(signature).decode("utf-8")
        logger.info(f"request_id:{request_id}, 签名成功: {signature_base64}")
        
        return signature_base64

    except Exception as e:
        logger.error(f"request_id:{request_id}, 签名失败: {traceback.format_exc()}")
        return None


def verify_pay_callback(request_id, headers, body, conf):
    try:
        logger.info(f"request_id:{request_id}, verify_pay_callback, headers: {headers}")
        serial = headers.get('Wechatpay-Serial')
        signature = headers.get('Wechatpay-Signature')
        timestamp = headers.get('Wechatpay-Timestamp')
        nonce = headers.get('Wechatpay-Nonce')

        # check if request serial matches the one in config
        if serial != conf["WECHAT_PAY_SERIAL_NO"]:
            logger.error(f"request_id:{request_id}, serial:{serial}, wechat pay platform serial number not match")
            return False
        
        # check timestamp
        if abs(int(time.time()) - int(timestamp)) > 300:
            logger.error(f"request_id:{request_id}, timestamp:{timestamp}, wechat pay timestamp expired")
            return False
        
        if not body:
            logger.info(f"request_id:{request_id}, wechat_pay_callback json data is None")
            return False
        
        logger.info(f"request_id:{request_id}, body is a dict:{isinstance(body, dict)}, received JSON data: {body}")
        body_str = json.dumps(body, ensure_ascii=False) if isinstance(body, dict) else body
        body_str = body_str.replace(" ", "").replace("\n", "")

        pem_str = "\n".join([str(timestamp), nonce, body_str])
        pem_str += "\n"

        try:
            # 读取微信支付平台公钥
            with open(conf["WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH"], "rb") as f:
                public_key = load_pem_public_key(f.read())
                
            # Base64解码签名
            decoded_signature = base64.b64decode(signature)
            
            # 验证签名
            try:
                public_key.verify(
                    decoded_signature,
                    pem_str.encode('utf-8'),
                    padding.PKCS1v15(),
                    hashes.SHA256()
                )
                return True
            except Exception as e:
                logger.error(f"request_id:{request_id}, signature verification failed: {traceback.format_exc()}")
                return False
                
        except Exception as e:
            logger.error(f"request_id:{request_id}, failed to load public key or verify signature: {traceback.format_exc()}")
            return False

    except Exception as e:
        logger.error(f"request_id:{request_id}, verify_pay_callback failed: {traceback.format_exc()}")
        return False


def decrypt_pay_callback_ciphertext(request_id, headers, body, conf):
    # nonce = headers.get('Wechatpay-Nonce')
    nonce = body["resource"]["nonce"]
    ciphertext = body["resource"]["ciphertext"]
    associated_data = body["resource"]["associated_data"]

    key = conf["WECHAT_PAY_API_PW"]
    key_bytes = str.encode(key)
    nonce_bytes = str.encode(nonce)
    ad_bytes = str.encode(associated_data)
    data = base64.b64decode(ciphertext)
    aesgcm = AESGCM(key_bytes)
    return aesgcm.decrypt(nonce_bytes, data, ad_bytes).decode('utf-8')

# 示例调用
if __name__ == "__main__":
    #pem_str = "POST\n/v3/pay/transactions/native\n1618888888\nRANDOMSTRING12345678\n{\"amount\":{\"total\":100,\"currency\":\"CNY\"}}"
    pem_str = 'POST\n/v3/pay/transactions/jsapi\n1554208460\n593BEC0C930BF1AFEB40B4A08C8FB242\n{"appid":"wxd678efh567hg6787","mchid":"1230000109","description":"Image形象店-深圳腾大-QQ公仔","out_trade_no":"1217752501201407033233368018","notify_url":"https://www.weixin.qq.com/wxpay/pay.php","amount":{"total":100,"currency":"CNY"},"payer":{"openid":"oUpF8uMuAJO_M2pxb1Q9zNjWeS6o"}}\n'
    private_key_path = "third_party/apiclient_key.pem"  # 商户私钥文件路径

    
    try:
        signature = sign_with_rsa("test_req_id_001", pem_str, private_key_path)
        print(f"签名值: {signature}")
    except RuntimeError as e:
        print(e)