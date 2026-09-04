import { CmsPage } from "@/components/cms-page";
import { pageMetadata } from "@/lib/page-meta";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return pageMetadata("faq", "FAQ");
}
export default async function FaqPage() {
  return <CmsPage slug="faq" />;
}
