/**
 * TCF Redis Backup Script
 * Run with: node scripts/backup-redis.js
 *
 * Dumps every key in Redis to a timestamped JSON file in scripts/backups/
 */

const Redis = require("ioredis");
const fs = require("fs");
const path = require("path");

const REDIS_URL = "redis://default:6J8z6sO2gWHENBDCYJWrAHgELrRqW1tZ@ultraneat-merino-dust-87746.db.redis.io:19616";

async function backup() {
  console.log("🔌 Connecting to Redis...");
  const redis = new Redis(REDIS_URL);

  try {
    // Get all keys
    const keys = await redis.keys("*");
    console.log(`📦 Found ${keys.length} keys`);

    const dump = {};
    for (const key of keys) {
      const raw = await redis.get(key);
      try {
        dump[key] = JSON.parse(raw);
      } catch {
        dump[key] = raw; // store as-is if not valid JSON
      }
      console.log(`  ✓ ${key}`);
    }

    // Save to file
    const backupsDir = path.join(__dirname, "backups");
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = path.join(backupsDir, `tcf-redis-backup-${timestamp}.json`);

    fs.writeFileSync(filename, JSON.stringify(dump, null, 2));
    console.log(`\n✅ Backup saved to: ${filename}`);
    console.log(`   Size: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB`);
  } finally {
    redis.disconnect();
  }
}

backup().catch((err) => {
  console.error("❌ Backup failed:", err.message);
  process.exit(1);
});
