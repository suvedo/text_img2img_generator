import redis


class RedisClient:
    redis_client = None

    def __init__(self):
        raise RuntimeError("RedisClient is a singleton class. Use RedisClient.init() to initialize.")

    @staticmethod
    def init_client(url):
        if RedisClient.redis_client is None:
            RedisClient.redis_client = redis.Redis.from_url(url)
            RedisClient.redis_client.ping()  # Test the connection

    @staticmethod
    def set(key, value, ex=None):
        RedisClient.redis_client.setex(key, ex, value)

    @staticmethod
    def get(key):
        val = RedisClient.redis_client.get(key)
        if val is not None:
            return val.decode('utf-8')
        return None

    @staticmethod
    def delete(key):
        RedisClient.redis_client.delete(key)