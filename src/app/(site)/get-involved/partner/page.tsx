import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("get-involved/partner", "Partner");
}
export default async function PartnerPage() {
  return <CmsPage slug="get-involved/partner" />;
}
