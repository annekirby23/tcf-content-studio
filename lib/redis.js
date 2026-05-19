import Redis from "ioredis";

let redis;
export function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

export async function kvGet(key) {
  const val = await getRedis().get(key);
  return val ? JSON.parse(val) : null;
}

export async function kvSet(key, value) {
  await getRedis().set(key, JSON.stringify(value));
}
