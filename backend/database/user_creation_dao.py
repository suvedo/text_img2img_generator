from datetime import datetime

from database.db_model import db
from utils.log_util import logger

class UserCreation(db.Model):
    __tablename__ = 'user_creation'

    user_id = db.Column(db.String(120), primary_key=True)
    img_path = db.Column(db.String(256), primary_key=True)
    created_time = db.Column(db.DateTime, default=datetime.utcnow)  # 自动记录创建时间
    update_time = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # 自动更新时间

def add_user_creation(request_id, user_id, img_path):
    """
    添加用户生成的图记录
    :param user_id: 用户ID
    :param img_path: 图片存放路径
    :return: None
    """
    try:
        creation = UserCreation(user_id=user_id, img_path=img_path)
        db.session.add(creation)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"request_id:{request_id}, error in add_user_creation: {str(e)}")
        return False

def get_user_creation(request_id, user_id, num=-1, max_num=100):
    """
    获取用户生成的图记录，最多返回100条
    :param user_id: 用户ID
    :param num: 返回数量，默认值：-1，表示全部返回，但不能多于100条
    :return: None
    """
    try:
        if num < 0 or num > max_num:
            num = max_num
        
        user_creation_list = UserCreation.query.filter_by(user_id=user_id).order_by(UserCreation.created_time.desc()).limit(num).all()
        if user_creation_list:
            img_paths = [creation.img_path for creation in user_creation_list]
            return img_paths
        return []
    except Exception as e:
        logger.error(f"request_id:{request_id}, error in get_user_creation: {str(e)}")
        return None

