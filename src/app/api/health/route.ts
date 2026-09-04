import { getSql } from "@/db";
import { pingR2Bucket } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<
    string,
    { ok: boolean; latencyMs?: number; error?: string }
  > = {};

  const started = Date.now();
  try {
    await getSql()`select 1 as ok`;
    checks.database = { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    checks.database = {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  const r2Started = Date.now();
  try {
    await pingR2Bucket();
    checks.r2 = { ok: true, latencyMs: Date.now() - r2Started };
  } catch (error) {
    checks.r2 = {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown R2 error",
    };
  }

  const ok = Object.values(checks).every((check) => check.ok);
  return Response.json(
    {
      ok,
      service: "glai-website",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
