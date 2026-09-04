import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import "@/lib/dns-ipv6";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

function describeUrl(value: string) {
  const parsed = new URL(value);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    user: parsed.username,
    sslmode: parsed.searchParams.get("sslmode"),
  };
}

function poolerUrlFromDirect(direct: string) {
  const parsed = new URL(direct);
  const project = parsed.hostname.startsWith("db.")
    ? parsed.hostname.split(".")[1]
    : parsed.username.replace(/^postgres\./, "");
  const pooled = new URL(direct);
  pooled.hostname = "aws-0-eu-central-1.pooler.supabase.com";
  pooled.port = "5432";
  pooled.username = `postgres.${project}`;
  if (!pooled.searchParams.get("sslmode")) {
    pooled.searchParams.set("sslmode", "require");
  }
  return pooled.toString();
}

async function tryConnect(label: string, connectionUrl: string) {
  console.log("try", label, describeUrl(connectionUrl));
  const sql = postgres(connectionUrl, {
    ssl: "require",
    connect_timeout: 15,
    max: 1,
    prepare: false,
  });
  try {
    const rows = await sql`select current_database() as db, now() as now`;
    console.log("OK", label, rows);
    return true;
  } catch (error) {
    console.error(
      "ERR",
      label,
      error instanceof Error ? error.message : error,
    );
    return false;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

function rewriteEnvLocal(nextUrl: string) {
  const path = ".env.local";
  const current = readFileSync(path, "utf8");
  if (!current.includes("DATABASE_URL=")) {
    throw new Error(".env.local has no DATABASE_URL");
  }
  const updated = current.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL=${nextUrl}`,
  );
  writeFileSync(path, updated, "utf8");
  console.log("Updated .env.local DATABASE_URL host to pooler");
}

function withHostUserPort(
  direct: string,
  hostname: string,
  username: string,
  port: string,
) {
  const pooled = new URL(direct);
  pooled.hostname = hostname;
  pooled.port = port;
  pooled.username = username;
  if (!pooled.searchParams.get("sslmode")) {
    pooled.searchParams.set("sslmode", "require");
  }
  return pooled.toString();
}

async function tryIpv6Direct(direct: string) {
  const parsed = new URL(direct);
  const { resolve6 } = await import("node:dns/promises");
  let address: string;
  try {
    const records = await resolve6(parsed.hostname);
    address = records[0];
    console.log("ipv6", address);
  } catch (error) {
    console.error(
      "ERR ipv6-resolve",
      error instanceof Error ? error.message : error,
    );
    return false;
  }

  const sql = postgres({
    host: address.includes(":") ? `[${address}]` : address,
    port: Number(parsed.port || 5432) || 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: { rejectUnauthorized: false, servername: parsed.hostname },
    connect_timeout: 12,
    max: 1,
    prepare: false,
  });
  try {
    const rows = await sql`select current_database() as db, now() as now`;
    console.log("OK ipv6-direct", rows);
    return true;
  } catch (error) {
    console.error(
      "ERR ipv6-direct",
      error instanceof Error ? error.message : error,
    );
    return false;
  } finally {
    await sql.end({ timeout: 2 });
  }
}

async function main() {
  const original = url;
  const originalOk = await tryConnect("direct", original);
  if (originalOk) return;

  const ipv6Ok = await tryIpv6Direct(original);
  if (ipv6Ok) return;

  const parsed = new URL(original);
  const project = parsed.hostname.startsWith("db.")
    ? parsed.hostname.split(".")[1]
    : parsed.username.replace(/^postgres\./, "");

  const regions = [
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-north-1",
    "us-east-1",
    "us-west-1",
    "ap-southeast-1",
  ];
  const users = [`postgres.${project}`, "postgres"];
  const ports = ["6543", "5432"];

  for (const region of regions) {
    for (const port of ports) {
      for (const username of users) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const candidate = withHostUserPort(original, host, username, port);
        const ok = await tryConnect(`${region}:${port}:${username}`, candidate);
        if (ok) {
          rewriteEnvLocal(candidate);
          return;
        }
      }
    }
  }

  process.exitCode = 1;
}

void main();
