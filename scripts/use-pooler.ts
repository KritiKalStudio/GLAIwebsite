import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

function rewrite(nextUrl: string) {
  const path = ".env.local";
  const current = readFileSync(path, "utf8");
  const updated = current.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${nextUrl}`);
  writeFileSync(path, updated, "utf8");
}

function makeUrl(port: string) {
  const next = new URL(url);
  const project = next.hostname.startsWith("db.")
    ? next.hostname.split(".")[1]
    : next.username.replace(/^postgres\./, "");
  next.hostname = "aws-0-eu-west-2.pooler.supabase.com";
  next.port = port;
  next.username = `postgres.${project}`;
  next.searchParams.set("sslmode", "require");
  return next.toString();
}

async function tryPort(port: string) {
  const connectionUrl = makeUrl(port);
  const parsed = new URL(connectionUrl);
  const sql = postgres(connectionUrl, {
    ssl: "require",
    connect_timeout: 10,
    max: 1,
    prepare: false,
  });
  try {
    await sql`select 1 as ok`;
    console.log("OK", parsed.hostname, parsed.port, parsed.username);
    return true;
  } catch (error) {
    console.log(
      "ERR",
      parsed.port,
      error instanceof Error ? error.message : error,
    );
    return false;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

async function main() {
  const sessionOk = await tryPort("5432");
  const port = sessionOk ? "5432" : "6543";
  if (!sessionOk) {
    const txOk = await tryPort("6543");
    if (!txOk) process.exit(1);
  }
  rewrite(makeUrl(port));
  console.log("Wrote pooler DATABASE_URL using port", port);
}

void main();
