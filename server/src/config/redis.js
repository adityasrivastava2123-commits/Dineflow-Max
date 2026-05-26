import redis from "redis";
import logger from "../utils/logger.js";

// BullMQ requires ioredis-compatible connection object
export const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
};

// Standard redis client for caching
const client = redis.createClient({
  url: process.env.REDIS_URL || `redis://${redisConnection.host}:${redisConnection.port}`,
  password: process.env.REDIS_PASSWORD,
  socket: { tls: process.env.REDIS_TLS === "true" },
});

client.on("error", (err) => logger.error("Redis error:", err));
client.on("connect", () => logger.info("Redis connected"));
client.on("reconnecting", () => logger.warn("Redis reconnecting..."));

// Lazy connect — won't crash if Redis is not available
let connected = false;
const connect = async () => {
  if (!connected) {
    try {
      await client.connect();
      connected = true;
    } catch (err) {
      logger.warn("Redis unavailable, caching disabled:", err.message);
    }
  }
};

connect();

export const getCache = async (key) => {
  if (!connected) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error("Cache get error:", error);
    return null;
  }
};

export const setCache = async (key, value, ttl = 3600) => {
  if (!connected) return;
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error("Cache set error:", error);
  }
};

export const deleteCache = async (key) => {
  if (!connected) return;
  try {
    await client.del(key);
  } catch (error) {
    logger.error("Cache delete error:", error);
  }
};

export const invalidatePattern = async (pattern) => {
  if (!connected) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.error("Cache invalidate pattern error:", error);
  }
};

export default client;
