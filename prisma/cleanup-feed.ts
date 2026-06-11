import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const url = process.env.DATABASE_URL!;
const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
const pool = new Pool({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const BATCH = 2000;
const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

async function main() {
  console.log(`Deleting FeedActivity older than ${cutoff.toISOString()} in batches of ${BATCH}…`);
  let total = 0;

  while (true) {
    // Find oldest IDs to delete first — avoids holding a long lock
    const ids = await prisma.feedActivity.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: BATCH,
    });
    if (ids.length === 0) break;

    const { count } = await prisma.feedActivity.deleteMany({
      where: { id: { in: ids.map((r) => r.id) } },
    });
    total += count;
    process.stdout.write(`\r  deleted ${total} rows…`);
  }

  console.log(`\nDone. Total deleted: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
