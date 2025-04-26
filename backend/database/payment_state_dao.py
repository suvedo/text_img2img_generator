from database.db_model import db
from utils.log_util import logger

class UserPayment(db.Model):
    __tablename__ = 'user_payment'

    order_no = db.Column(db.String(120), primary_key=True)
    user_id = db.Column(db.String(120), nullable=False)
    order_type = db.Column(db.String(16), nullable=False)
    out_trade_no = db.Column(db.String(120), nullable=False)
    pay_state = db.Column(db.String(64))


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
        order_no = format_order_no(user_id, order_type, out_trade_no)
        payment = UserPayment.query.filter_by(order_no=order_no).first()
        if not payment:
            # logger.info(f"request_id:{request_id}, payment state not found for order_no:{order_no}")
            return None
        state = payment.pay_state
        logger.info(f"request_id:{request_id}, get payment state for order_no:{order_no}, state:{state}")
        return state
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in get_payment_state: {traceback.format_exc()}")
        return None


def set_payment_state(request_id, user_id, order_type, out_trade_no, state):
    """
    设置支付状态
    :param request_id: 请求ID
    :param order_no: 订单号
    :param state: 支付状态, 已转换为字符串
    """
    try:
        order_no = format_order_no(user_id, order_type, out_trade_no)
        payment = UserPayment(order_no=order_no)
        payment.user_id = user_id
        payment.order_type = order_type
        payment.out_trade_no = out_trade_no
        payment.state = state
        db.session.add(payment)
        if success_paid(state):
            
            logger.info(f"request_id:{request_id}, set payment state for order_no:{order_no}, state:{state}")
        
        db.session.commit()
        logger.info(f"request_id:{request_id}, set payment state for order_no:{order_no}, state:{state}")
        
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"request_id:{request_id}, error in set_payment_state: {traceback.format_exc()}")
        return False


def remove_payment_state(request_id, user_id, order_type, out_trade_no):
    """
    删除支付状态
    :param request_id: 请求ID
    :param order_no: 订单号
    """
    try:
        order_no = format_order_no(user_id, order_type, out_trade_no)
        payment = UserPayment(order_no=order_no)
        db.session.remove(payment)
        db.session.commit()
        logger.info(f"request_id:{request_id}, remove payment state for order_no:{order_no}, state:{state}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"request_id:{request_id}, error in remove_payment_state: {traceback.format_exc()}")
