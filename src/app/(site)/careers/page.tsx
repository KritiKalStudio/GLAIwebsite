import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("careers", "Careers");
}
export default async function CareersPage() {
  return <CmsPage slug="careers" />;
}
