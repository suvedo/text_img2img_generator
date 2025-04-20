import random
import string

def generate_random_str(length=10):
    characters = string.ascii_lowercase + string.digits  # 定义字符集[8](@ref)
    return ''.join(random.choices(characters, k=length))  # 随机选择字符[4](@ref)