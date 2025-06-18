exports.getRedisClient = (req, res) => {
    const redisClient = req.app.get('redis');
    if (!redisClient) {
        throw new Error('Redis Client is Not Available');
    }
    return redisClient;
};


exports.cleanRedisDataFlush = async (redisClient, key = "clinic*") => {
    const keys = await redisClient.keys(key);
    if (keys.length > 0) {
        await redisClient.del(keys);
    }
};