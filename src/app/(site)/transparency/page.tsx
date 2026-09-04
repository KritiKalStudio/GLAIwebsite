import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("transparency", "Transparency");
}
export default async function TransparencyPage() {
  return <CmsPage slug="transparency" />;
}
