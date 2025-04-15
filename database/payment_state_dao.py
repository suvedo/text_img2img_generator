from utils.log_util import logger
import threading
import traceback

# 创建读写锁
_rw_lock = threading.RLock()
payment_state_dict = {}

def format_order_no(user_id, order_type, out_trade_no):
    """
    格式化订单号
    :param user_id: 用户ID
    :param order_type: 订单类型
    :param out_trade_no: 订单号
    :return: 格式化后的订单号
    """
    return f"{user_id}####{order_type}####{out_trade_no}"


def success_paid(state):
    """
    判断支付状态
    :param state: 支付状态
    :return: True if paid, False otherwise
    """
    return state == "SUCCESS_PAIED"

def gen_paied_state(success):
    """
    生成支付状态
    :param success: 是否支付成功
    :return: 支付状态
    """
    return "SUCCESS_PAIED" if success else "FAILED_PAIED"

def get_payment_state(request_id, user_id, order_type, out_trade_no):
    """
    获取支付状态
    :param request_id: 请求ID
    :param order_no: 订单号
    :return: 支付状态
    """
    try:
        with _rw_lock:  # 获取读锁
            order_no = format_order_no(user_id, order_type, out_trade_no)
            if order_no in payment_state_dict:
                state = payment_state_dict[order_no]
                logger.info(f"request_id:{request_id}, get payment state for order_no:{order_no}, state:{state}")
                return state
            else:
                logger.info(f"request_id:{request_id}, order_no:{order_no} not found")
                return None
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in get_payment_state: {traceback.format_exc()}")
        return None
    
def set_payment_state(request_id, user_id, order_type, out_trade_no, state):
    """
    设置支付状态
    :param request_id: 请求ID
    :param order_no: 订单号
    :param state: 支付状态
    """
    try:
        with _rw_lock:  # 获取写锁
            order_no = format_order_no(user_id, order_type, out_trade_no)
            payment_state_dict[order_no] = state
            logger.info(f"request_id:{request_id}, set payment state for order_no:{order_no}, state:{state}")
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in set_payment_state: {traceback.format_exc()}")


def remove_payment_state(request_id, user_id, order_type, out_trade_no):
    """
    删除支付状态
    :param request_id: 请求ID
    :param order_no: 订单号
    """
    try:
        with _rw_lock:  # 获取写锁
            order_no = format_order_no(user_id, order_type, out_trade_no)
            if order_no in payment_state_dict:
                del payment_state_dict[order_no]
                logger.info(f"request_id:{request_id}, removed payment state for order_no:{order_no}")
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in remove_payment_state: {traceback.format_exc()}")