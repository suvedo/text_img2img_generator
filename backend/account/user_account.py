from flask import jsonify
import re

from database.user_dao import User, db
from utils.log_util import logger


def is_valid_email(email):
    """验证邮箱格式是否正确"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def is_valid_password(password):
    """验证密码强度"""
    if len(password) < 8:
        return False, "password not less than 8"
    if not re.search(r'[A-Z]', password):
        return False, "password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "password must contain at least one digit"
    return True, ""

def check_auth(request_id, session):
    return 'user_id' in session
    
def login(request_id, data, session):
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        logger.error(f"request_id:{request_id}, email:{email}, either email or password is None")
        return jsonify(ok=False, msg='email or password is empty')

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        session['user_id'] = user.id
        session['username'] = user.email
        session['email'] = user.email
        logger.info(f"request_id:{request_id}, email:{email}, password:{password}, login successful")
        return jsonify(ok=True, msg='login successful')
    
    logger.error(f"request_id:{request_id}, email:{email}, password:{password}, user not found or password incorrect") 
    return jsonify(ok=False, msg='email or password not correct')


def logout(request_id, session):
    if 'user_id' in session:
        del session['user_id']
        del session['username']
        del session['email']
        logger.info(f"request_id:{request_id}, logout successful")
        return jsonify(ok=True, msg='logout successful')
    else:
        logger.error(f"request_id:{request_id}, user not logged in")
        return jsonify(ok=False, msg='user not logged in')


def signup(request_id, data, session):
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        logger.error(f"request_id:{request_id}, email:{email}, either email or password is None")
        return jsonify(ok=False, msg='email or password is empty')

    # 验证邮箱格式
    if not is_valid_email(email):
        logger.error(f"request_id:{request_id}, email:{email}, email is invalid")
        return jsonify(ok=False, msg='email is invalid')

    # 验证密码强度
    is_valid, error_msg = is_valid_password(password)
    if not is_valid:
        logger.error(f"request_id:{request_id}, email:{email}, error: {error_msg}")
        return jsonify(ok=False, msg=error_msg)

    # 检查邮箱是否已被注册
    if User.query.filter_by(email=email).first():
        return jsonify(ok=False, msg="email has been registered")

    # 创建新用户
    try:
        user = User(id=email)
        user.set_password(password)
        user.set_email(email)
        db.session.add(user)
        db.session.commit()
        return jsonify(ok=True, msg="sign up successful")
    except Exception as e:
        db.session.rollback()
        logger.error(f"request_id:{request_id}, email:{email}, password:{password}, error: {str(e)}")
        return jsonify(ok=False, msg="failed, try it later")