import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("resources", "Resources");
}
export default async function ResourcesPage() {
  return <CmsPage slug="resources" />;
}
