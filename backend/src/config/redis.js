import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let sharedConnection;

export const getRedisConnection = () => {
  if (!sharedConnection) {
    sharedConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  return sharedConnection;
};

export { redisUrl };
