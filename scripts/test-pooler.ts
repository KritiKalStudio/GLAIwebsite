import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const original = new URL(url);
const project = original.hostname.startsWith("db.")
  ? original.hostname.split(".")[1]
  : original.username.replace(/^postgres\./, "");

const regions = [
  "eu-central-1",
  "eu-central-2",
  "eu-west-1",
  "eu-west-2",
  "eu-north-1",
  "eu-west-3",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "ap-southeast-1",
  "ap-south-1",
  "ap-northeast-1",
];

function candidate(host: string, username: string, port: string) {
  const next = new URL(url);
  next.hostname = host;
  next.port = port;
  next.username = username;
  next.searchParams.set("sslmode", "require");
  return next.toString();
}

async function tryConnect(label: string, connectionUrl: string) {
  const parsed = new URL(connectionUrl);
  const sql = postgres(connectionUrl, {
    ssl: "require",
    connect_timeout: 8,
    max: 1,
    prepare: false,
  });
  try {
    const rows = await sql`select current_database() as db, now() as now`;
    console.log("OK", label, parsed.hostname, parsed.port, parsed.username, rows);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("ERR", label, parsed.port, parsed.username, message);
    return false;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

async function main() {
  console.log("project", project);
  const username = `postgres.${project}`;
  const ports = ["6543", "5432"];

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    for (const port of ports) {
      const ok = await tryConnect(region, candidate(host, username, port));
      if (ok) process.exit(0);
    }
  }

  process.exit(1);
}

void main();
