import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";

config({ path: ".env.local" });

import { getSql } from "@/db";
import { decryptField, encryptField } from "@/lib/crypto";
import { dumpDatabase, type BackupFile } from "./backup";

const IDENT = /^[a-z0-9_]+$/;

async function main() {
  const roundtrip = encryptField("backup-restore-probe");
  if (decryptField(roundtrip) !== "backup-restore-probe") {
    throw new Error("Field encryption round-trip failed.");
  }

  const { file, backup } = await dumpDatabase();
  const onDisk = JSON.parse(await readFile(path.join(process.cwd(), "backups", "latest.json"), "utf8")) as BackupFile;
  if (onDisk.createdAt !== backup.createdAt) {
    throw new Error("latest.json does not match the dump just written.");
  }

  const sql = getSql();
  const mismatches: string[] = [];
  for (const [table, dumped] of Object.entries(backup.counts)) {
    if (!IDENT.test(table)) continue;
    const live = await sql.unsafe(`select count(*)::int as n from "${table}"`);
    const n = Number((live[0] as { n: number }).n);
    if (n !== dumped) mismatches.push(`${table}: dump ${dumped} vs live ${n}`);
  }
  if (mismatches.length) {
    throw new Error(`Count mismatch after dump:\n${mismatches.join("\n")}`);
  }

  const roles = backup.tables.roles ?? [];
  if (roles.length === 0) throw new Error("Dump contains no roles; refusing restore check.");

  await sql`drop schema if exists glai_restore_check cascade`;
  await sql`create schema glai_restore_check`;
  await sql`
    create table glai_restore_check.roles (
      id uuid primary key,
      name text not null,
      slug text not null,
      permissions jsonb not null default '{}'::jsonb
    )
  `;

  for (const role of roles as { id: string; name: string; slug: string; permissions: unknown }[]) {
    await sql`
      insert into glai_restore_check.roles (id, name, slug, permissions)
      values (
        ${role.id},
        ${role.name},
        ${role.slug},
        ${JSON.stringify(role.permissions ?? {})}::jsonb
      )
    `;
  }

  const restored = await sql<{ n: number }[]>`select count(*)::int as n from glai_restore_check.roles`;
  if (Number(restored[0]?.n) !== roles.length) {
    throw new Error(`Restore check failed: expected ${roles.length} roles, got ${restored[0]?.n}`);
  }

  await sql`drop schema glai_restore_check cascade`;
  console.log(`Restore check passed. Dump: ${file}`);
  console.log(`Restored ${roles.length} roles into a scratch schema and dropped it.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
