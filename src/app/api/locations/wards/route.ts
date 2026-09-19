import { listWards } from "@/lib/nigeria-gazetteer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const lga = url.searchParams.get("lga") ?? "";
  if (!state || !lga) {
    return Response.json({ wards: [] });
  }
  const wards = await listWards(state, lga);
  return Response.json({ wards });
}
