import "dotenv/config";
import dns from "node:dns";
import { Pool } from "pg";

dns.setDefaultResultOrder("ipv4first");

console.log(process.env.DATABASE_URL);

const pool = new Pool({
  host: "ep-billowing-breeze-ayrgpp73-pooler.c-5.us-east-2.aws.neon.tech",
  user: "neondb_owner",
  password: "npg_YwjZV1cUmT8C",
  database: "neondb",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
  family: 4,
  connectionTimeoutMillis: 30000,
});

try {
  const res = await pool.query("SELECT NOW()");
  console.log(res.rows);
} catch (e) {
  console.error(e);
} finally {
  await pool.end();
}
