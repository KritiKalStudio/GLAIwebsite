import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

config({ path: ".env.local" });

import { getSql } from "@/db";

const IDENT = /^[a-z0-9_]+$/;

export type BackupFile = {
  createdAt: string;
  database: string;
  tables: Record<string, unknown[]>;
  counts: Record<string, number>;
};

export async function dumpDatabase(): Promise<{ file: string; backup: BackupFile }> {
  const sql = getSql();
  const tables = await sql<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `;

  const dump: BackupFile = {
    createdAt: new Date().toISOString(),
    database: "public",
    tables: {},
    counts: {},
  };

  for (const row of tables) {
    const name = row.table_name;
    if (!IDENT.test(name) || name.startsWith("__drizzle")) continue;
    const records = await sql.unsafe(`select * from "${name}"`);
    dump.tables[name] = records as unknown[];
    dump.counts[name] = records.length;
  }

  const dir = path.join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });
  const stamp = dump.createdAt.replace(/[:.]/g, "-");
  const file = path.join(dir, `glai-${stamp}.json`);
  const serialized = JSON.stringify(dump, null, 2);
  await writeFile(file, serialized, "utf8");
  await writeFile(path.join(dir, "latest.json"), serialized, "utf8");
  return { file, backup: dump };
}

async function main() {
  const { file, backup } = await dumpDatabase();
  const total = Object.values(backup.counts).reduce((sum, n) => sum + n, 0);
  console.log(`Backup wrote ${file}`);
  console.log(`Tables: ${Object.keys(backup.tables).length}; rows: ${total}`);
  process.exit(0);
}

if (process.argv[1]?.includes("backup")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
