import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("get-involved", "Get Involved");
}
export default async function GetInvolvedPage() {
  return <CmsPage slug="get-involved" />;
}
