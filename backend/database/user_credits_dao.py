from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

from database.db_model import db
from utils.log_util import logger

class UserCredits(db.Model):
    __tablename__ = 'user_credis'

    user_id = db.Column(db.String(120), primary_key=True)
    credit_count = db.Column(db.Integer, nullable=False)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)  # 自动记录创建时间
    update_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 自动更新时间

def add_user_credits(request_id, user_id, credit_num):
    """
    添加用户积分
    :param user_id: 用户ID
    :param credit_num: 积分数量
    :return: None
    """
    try:
        user_credits = UserCredits.query.filter_by(user_id=user_id).first()
        if user_credits:
            user_credits.credit_count += credit_num
        else:
            user_credits = UserCredits(user_id=user_id, credit_count=credit_num)
            db.session.add(user_credits)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"request_id:{request_id}, error in add_user_credits: {str(e)}")
        return False
    
def substract_user_credits(request_id, user_id, credit_num):
    """
    扣除用户积分
    :param user_id: 用户ID
    :param credit_num: 积分数量
    :return: None
    """
    try:
        user_credits = UserCredits.query.filter_by(user_id=user_id).first()
        if user_credits and user_credits.credit_count >= credit_num:
            user_credits.credit_count -= credit_num
            db.session.commit()
            return True
        else:
            logger.error(f"request_id:{request_id}, insufficient credits for user {user_id}")
            return False
    except Exception as e:
        db.session.rollback()
        logger.error(f"request_id:{request_id}, error in subtract_user_credits: {str(e)}")
        return False

def get_user_credits(request_id, user_id):
    """
    获取用户积分
    :param user_id: 用户ID
    :return: 积分数量
    """
    try:
        user_credits = UserCredits.query.filter_by(user_id=user_id).first()
        if user_credits:
            return user_credits.credit_count
        else:
            return None
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in get_user_credits: {str(e)}")
        return None