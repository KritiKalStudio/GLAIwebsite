import { deleteObject, getObjectBuffer, putObject } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function POST() {
  const key = `health/ping-${Date.now()}.txt`;
  const body = `glai-health ${new Date().toISOString()}`;

  try {
    const uploaded = await putObject({
      key,
      body,
      contentType: "text/plain",
    });
    const retrieved = await getObjectBuffer(key);
    const matches = retrieved.toString("utf8") === body;
    await deleteObject(key);

    return Response.json({
      ok: matches,
      uploaded: uploaded.url,
      retrievedBytes: retrieved.byteLength,
      matches,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "R2 media test failed",
      },
      { status: 503 },
    );
  }
}
