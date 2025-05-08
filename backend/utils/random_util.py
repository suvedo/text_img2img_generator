import random
import string

def generate_random_str(length=10):
    characters = string.ascii_lowercase + string.digits  # 定义字符集[8](@ref)
    return ''.join(random.choices(characters, k=length))  # 随机选择字符[4](@ref)

def generate_random_from0to1():
    return random.random()

# 生成6位数字验证码
def generate_verify_code():
    return str(random.randint(100000, 999999))