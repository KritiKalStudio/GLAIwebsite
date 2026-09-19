import { listPollingUnits } from "@/lib/nigeria-gazetteer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const lga = url.searchParams.get("lga") ?? "";
  const ward = url.searchParams.get("ward") ?? "";
  if (!state || !lga || !ward) {
    return Response.json({ pollingUnits: [] });
  }
  const pollingUnits = await listPollingUnits(state, lga, ward);
  return Response.json({ pollingUnits });
}
